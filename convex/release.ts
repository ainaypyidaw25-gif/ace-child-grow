import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { logAudit } from './audit';
import { isPersistedReleaseGovernedSource } from './lib/clinicalReviewBatchProvenance';
import { isEvidenceHumanReviewSuccessorSourceId } from './lib/evidenceHumanReviewSuccessorCasData';

const OWNER_QUALIFICATION = 'MEd (Early Childhood and Special Education)';
const OWNER_REVIEWER_LABEL = 'ACE Child Grow Owner / Education Reviewer';
const REVIEWED_ON = '2026-07-26';
const NEXT_REVIEW_ON = '2027-07-26';
const REVIEW_NOTE =
  'Education and special-needs review completed. General guidance was checked against authoritative public evidence and is not individualized medical advice.';

// These five records were previously evidence_required. Their official
// publisher pages were opened and their registry metadata checked on
// 2026-07-26 before this release mutation was authored.
const VERIFIED_OFFICIAL_SOURCE_IDS = new Set([
  'aota-early-intervention',
  'asha-speech-sound-disorders',
  'asha-pediatric-feeding-swallowing',
  'asha-spoken-language-disorders',
  'asha-late-language-emergence',
]);

async function qualifiedOwner(ctx: MutationCtx): Promise<{
  userId: Id<'users'>;
  profileId: Id<'parentProfiles'>;
  reviewerName: string;
}> {
  const staff = await ctx.db
    .query('parentProfiles')
    .withIndex('by_is_staff', (q) => q.eq('isStaff', true))
    .take(20);
  const owners = staff.filter((row) => (row.staffRole ?? 'owner') === 'owner');
  if (owners.length !== 1) throw new Error(`Expected exactly one owner; found ${owners.length}`);
  const owner = owners[0];
  if (owner.staffQualification !== OWNER_QUALIFICATION) {
    throw new Error('Owner education-review qualification has not been configured');
  }
  return {
    userId: owner.userId,
    profileId: owner._id,
    reviewerName: owner.displayName?.trim() || OWNER_REVIEWER_LABEL,
  };
}

/** One-time production-safe setup: targets the sole existing owner only. */
export const configureOwnerEducationReviewer = internalMutation({
  args: {},
  returns: v.object({ ok: v.boolean(), reviewerLabel: v.string(), qualification: v.string() }),
  handler: async (ctx) => {
    const staff = await ctx.db
      .query('parentProfiles')
      .withIndex('by_is_staff', (q) => q.eq('isStaff', true))
      .take(20);
    const owners = staff.filter((row) => (row.staffRole ?? 'owner') === 'owner');
    if (owners.length !== 1) throw new Error(`Expected exactly one owner; found ${owners.length}`);
    const owner = owners[0];
    await ctx.db.patch(owner._id, {
      isStaff: true,
      staffRole: 'owner',
      staffQualification: OWNER_QUALIFICATION,
    });
    const reviewerLabel = owner.displayName?.trim() || OWNER_REVIEWER_LABEL;
    await logAudit(
      ctx,
      owner.userId,
      'staff.educationReviewer.configure',
      'parentProfiles',
      owner._id,
      `${reviewerLabel} — ${OWNER_QUALIFICATION}`,
    );
    return { ok: true, reviewerLabel, qualification: OWNER_QUALIFICATION };
  },
});

/** Retained as a hard-failing compatibility endpoint. Bulk publication is unsafe. */
export const publishLibraryEducationReviewed = internalMutation({
  args: {},
  returns: v.object({ published: v.number(), alreadyPublished: v.number(), total: v.number() }),
  handler: async (ctx) => {
    void ctx;
    throw new Error('Bulk education-scoped publication has been retired; use individual review gates and qualified publication approval');
  },
});

/** Approve the reference registry as source/education review, never clinical. */
export const approveEvidenceEducationReviewed = internalMutation({
  args: {},
  returns: v.object({ approved: v.number(), alreadyApproved: v.number(), verifiedOfficialPages: v.number(), total: v.number() }),
  handler: async (ctx) => {
    const owner = await qualifiedOwner(ctx);
    const rows = await ctx.db.query('evidenceSources').take(500);
    for (const row of rows) {
      if (isEvidenceHumanReviewSuccessorSourceId(row.sourceId)) {
        throw new Error(
          `Human-review successor source must be reviewed individually through evidence.setReview: ${row.sourceId}`,
        );
      }
      if (await isPersistedReleaseGovernedSource(ctx, row.sourceId)) {
        throw new Error(`Frozen release source requires invalidation and refreeze: ${row.sourceId}`);
      }
    }
    const now = Date.now();
    let approved = 0;
    let alreadyApproved = 0;
    let verifiedOfficialPages = 0;
    for (const row of rows) {
      if (row.reviewStatus === 'retired') continue;
      if (row.reviewStatus === 'evidence_required') {
        if (!VERIFIED_OFFICIAL_SOURCE_IDS.has(row.sourceId)) {
          throw new Error(`Unverified evidence_required source: ${row.sourceId}`);
        }
        verifiedOfficialPages += 1;
      }
      if (row.reviewStatus === 'approved' && row.reviewScope === 'education') {
        alreadyApproved += 1;
        continue;
      }
      await ctx.db.patch(row._id, {
        reviewStatus: 'approved',
        reviewer: owner.reviewerName,
        reviewerQualification: OWNER_QUALIFICATION,
        reviewerId: owner.userId,
        reviewScope: 'education',
        reviewDate: REVIEWED_ON,
        nextReviewDate: NEXT_REVIEW_ON,
        reviewNote: `${REVIEW_NOTE} Official publisher metadata verified where previously required.`,
        updatedAt: now,
      });
      approved += 1;
    }
    await logAudit(
      ctx,
      owner.userId,
      'evidence.education.approveAll',
      'evidenceSources',
      undefined,
      `${approved} approved; ${alreadyApproved} already approved; ${verifiedOfficialPages} official pages verified. ${REVIEW_NOTE}`,
    );
    return { approved, alreadyApproved, verifiedOfficialPages, total: rows.length };
  },
});

/** Retained as a hard-failing compatibility endpoint. Bulk publication is unsafe. */
export const publishLegacyContentEducationReviewed = internalMutation({
  args: {},
  returns: v.object({ published: v.number(), total: v.number() }),
  handler: async (ctx) => {
    void ctx;
    throw new Error('Bulk legacy publication has been retired; publish only records that satisfy current review gates');
  },
});

export const approvalStatus = internalQuery({
  args: {},
  returns: v.object({
    libraryTotal: v.number(),
    libraryPublished: v.number(),
    libraryEducationReviewed: v.number(),
    evidenceTotal: v.number(),
    evidenceApproved: v.number(),
    evidenceEducationReviewed: v.number(),
    clinicalScopedApprovals: v.number(),
  }),
  handler: async (ctx) => {
    const library = await ctx.db.query('libraryContent').take(1000);
    const evidence = await ctx.db.query('evidenceSources').take(500);
    return {
      libraryTotal: library.length,
      libraryPublished: library.filter((row) => row.clinicalStatus === 'published').length,
      libraryEducationReviewed: library.filter((row) => row.reviewScope === 'education').length,
      evidenceTotal: evidence.length,
      evidenceApproved: evidence.filter((row) => row.reviewStatus === 'approved').length,
      evidenceEducationReviewed: evidence.filter((row) => row.reviewScope === 'education').length,
      clinicalScopedApprovals:
        library.filter((row) => row.reviewScope === 'clinical').length +
        evidence.filter((row) => row.reviewScope === 'clinical').length,
    };
  },
});
