import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_COUNT,
  CLINICAL_REVIEW_BATCH_HASH,
  CLINICAL_REVIEW_BATCH_ID,
  CLINICAL_REVIEW_BATCH_ITEMS,
  CLINICAL_REVIEW_BATCH_MANIFEST,
  CLINICAL_REVIEW_BATCH_REVIEWER,
  type ClinicalReviewBatchItem,
} from './lib/clinicalReviewBatchData';
import { todayIsoUtc } from './lib/evidenceFreshness';
import { evaluatePublicationEvidence } from './lib/evidencePublicationGate';
import { requireUser } from './lib/auth';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
const MAX_RELATED_ROWS = 50;
const decisionValidator = v.union(v.literal('approved'), v.literal('changes_requested'));
const phaseValidator = v.union(v.literal('ready'), v.literal('blocked'), v.literal('already_decided'));

const itemStateValidator = v.object({
  ordinal: v.number(),
  kind: v.string(),
  slug: v.string(),
  reviewRevision: v.number(),
  decisionKey: v.string(),
  phase: phaseValidator,
  blockers: v.array(v.string()),
});

const batchResultValidator = v.object({
  allowed: v.boolean(),
  batchId: v.literal(CLINICAL_REVIEW_BATCH_ID),
  batchHash: v.literal(CLINICAL_REVIEW_BATCH_HASH),
  count: v.number(),
  reviewerDisplayName: v.string(),
  reviewerQualification: v.string(),
  blockers: v.array(v.string()),
  items: v.array(itemStateValidator),
});

async function assignedReviewerBlockers(
  ctx: DatabaseContext,
  userId: Id<'users'>,
): Promise<string[]> {
  const rows = await ctx.db
    .query('parentProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .take(2);
  if (String(userId) !== CLINICAL_REVIEW_BATCH_REVIEWER.userId) return ['not_assigned_reviewer'];
  if (rows.length !== 1) return ['assigned_reviewer_profile_not_unique'];
  const profile = rows[0];
  const blockers: string[] = [];
  if (String(profile._id) !== CLINICAL_REVIEW_BATCH_REVIEWER.profileId) blockers.push('assigned_reviewer_profile_id_drift');
  if (profile.isStaff !== true) blockers.push('assigned_reviewer_not_staff');
  if (profile.staffRole !== CLINICAL_REVIEW_BATCH_REVIEWER.role) blockers.push('assigned_reviewer_role_drift');
  if ((profile.displayName ?? '').trim() !== CLINICAL_REVIEW_BATCH_REVIEWER.displayName) blockers.push('assigned_reviewer_name_drift');
  if ((profile.staffQualification ?? '').trim() !== CLINICAL_REVIEW_BATCH_REVIEWER.qualification) blockers.push('assigned_reviewer_qualification_drift');
  if (await sha256Canonical(profile) !== CLINICAL_REVIEW_BATCH_REVIEWER.profileCanonicalSha256) {
    blockers.push('assigned_reviewer_profile_preimage_drift');
  }
  return blockers;
}

async function decisionKeyFor(item: ClinicalReviewBatchItem): Promise<string> {
  return await sha256Canonical({
    batchId: CLINICAL_REVIEW_BATCH_ID,
    batchHash: CLINICAL_REVIEW_BATCH_HASH,
    ordinal: item.ordinal,
    kind: item.kind,
    slug: item.slug,
    reviewRevision: item.reviewRevision,
    dimension: 'clinical',
    reviewerUserId: CLINICAL_REVIEW_BATCH_REVIEWER.userId,
  });
}

function sortById<T extends { _id: unknown }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

async function inspectItem(ctx: DatabaseContext, item: ClinicalReviewBatchItem) {
  const blockers: string[] = [];
  const contentRows = await ctx.db
    .query('libraryContent')
    .withIndex('by_slug', (q) => q.eq('slug', item.slug))
    .take(2);
  const linkRows = await ctx.db
    .query('evidenceLinks')
    .withIndex('by_kind_slug', (q) => q.eq('kind', item.kind).eq('slug', item.slug))
    .take(2);
  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  if (contentRows.length !== 1) blockers.push('content_preimage_not_unique');
  if (linkRows.length !== 1) blockers.push('evidence_link_preimage_not_unique');

  if (content) {
    if (String(content._id) !== item.contentId || content._creationTime !== item.contentCreationTime) blockers.push('content_identity_drift');
    if (content.type !== item.kind || (content.reviewRevision ?? 1) !== item.reviewRevision) blockers.push('stale_revision');
    if (content.updatedAt !== item.contentUpdatedAt) blockers.push('content_updated_at_drift');
    if (await sha256Canonical(content) !== item.contentCanonicalSha256) blockers.push('content_preimage_drift');
  }
  if (link) {
    if (String(link._id) !== item.linkId || link._creationTime !== item.linkCreationTime) blockers.push('evidence_link_identity_drift');
    if (link.updatedAt !== item.linkUpdatedAt) blockers.push('evidence_link_updated_at_drift');
    if (await sha256Canonical(link) !== item.linkCanonicalSha256) blockers.push('evidence_link_preimage_drift');
    if (link.sourceIds.length !== item.sourceIds.length || !link.sourceIds.every((id, index) => id === item.sourceIds[index])) {
      blockers.push('evidence_link_membership_drift');
    }
  }

  const sourceRows: Doc<'evidenceSources'>[] = [];
  for (const sourceId of item.sourceIds) {
    const rows = await ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', sourceId))
      .take(2);
    if (rows.length !== 1) blockers.push(`source_not_unique:${sourceId}`);
    else sourceRows.push(rows[0]);
  }
  if (sourceRows.length !== item.sourceCount || await sha256Canonical(sourceRows) !== item.sourcesCanonicalSha256) {
    blockers.push('source_preimage_drift');
  }
  if (link) {
    const evidence = evaluatePublicationEvidence(link.sourceIds, sourceRows, todayIsoUtc());
    if (!evidence.allowed) blockers.push('citation_eligibility_drift');
  }

  const mediaPage = await ctx.db
    .query('libraryMedia')
    .withIndex('by_content', (q) => q.eq('contentSlug', item.slug))
    .take(MAX_RELATED_ROWS + 1);
  if (mediaPage.length > MAX_RELATED_ROWS) blockers.push('media_bound_exceeded');
  const mediaRows = sortById(mediaPage.slice(0, MAX_RELATED_ROWS));
  if (mediaRows.length !== item.mediaCount || await sha256Canonical(mediaRows) !== item.mediaCanonicalSha256) blockers.push('media_preimage_drift');

  const contentAudits = content
    ? await ctx.db
        .query('aiContentAudits')
        .withIndex('by_content_revision_and_updated_at', (q) =>
          q.eq('contentSlug', item.slug).eq('reviewRevision', item.reviewRevision).eq('contentUpdatedAt', item.contentUpdatedAt),
        )
        .take(MAX_RELATED_ROWS + 1)
    : [];
  const evidenceAudits: Doc<'aiEvidenceAudits'>[] = [];
  for (const source of sourceRows) {
    const rows = await ctx.db
      .query('aiEvidenceAudits')
      .withIndex('by_source_and_updated_at', (q) => q.eq('sourceId', source.sourceId).eq('sourceUpdatedAt', source.updatedAt))
      .take(MAX_RELATED_ROWS + 1);
    evidenceAudits.push(...rows);
  }
  const releases = await ctx.db
    .query('aiPublicationReleases')
    .withIndex('by_target_key', (q) => q.eq('targetKey', `${item.kind}:${item.slug}`))
    .take(MAX_RELATED_ROWS + 1);
  if (contentAudits.length > MAX_RELATED_ROWS || evidenceAudits.length > MAX_RELATED_ROWS || releases.length > MAX_RELATED_ROWS) {
    blockers.push('ai_snapshot_bound_exceeded');
  }
  const aiSnapshot = {
    contentAudits: sortById(contentAudits.slice(0, MAX_RELATED_ROWS)),
    evidenceAudits: sortById(evidenceAudits.slice(0, MAX_RELATED_ROWS)),
    releases: sortById(releases.slice(0, MAX_RELATED_ROWS)),
    runs: [],
  };
  if (await sha256Canonical(aiSnapshot) !== item.aiCanonicalSha256) blockers.push('ai_snapshot_drift');

  const decisionKey = await decisionKeyFor(item);
  const existingByKey = await ctx.db
    .query('contentReviews')
    .withIndex('by_decision_key', (q) => q.eq('decisionKey', decisionKey))
    .take(2);
  if (existingByKey.length > 1) blockers.push('duplicate_decision_key');
  const currentClinical = await ctx.db
    .query('contentReviews')
    .withIndex('by_content_dimension_version', (q) =>
      q.eq('contentSlug', item.slug).eq('dimension', 'clinical').eq('contentVersion', item.reviewRevision),
    )
    .order('desc')
    .take(MAX_RELATED_ROWS + 1);
  if (currentClinical.length > MAX_RELATED_ROWS) blockers.push('clinical_history_bound_exceeded');
  if (currentClinical.some((row) => row.decisionKey !== decisionKey)) blockers.push('unfrozen_clinical_decision_exists');

  return {
    ordinal: item.ordinal,
    kind: item.kind,
    slug: item.slug,
    reviewRevision: item.reviewRevision,
    decisionKey,
    phase: blockers.length > 0 ? 'blocked' as const : existingByKey.length === 1 ? 'already_decided' as const : 'ready' as const,
    blockers,
    content,
    existing: existingByKey[0] ?? null,
  };
}

export const getAssignedBatch = query({
  args: {},
  returns: batchResultValidator,
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const blockers = await assignedReviewerBlockers(ctx, userId);
    if (await sha256Canonical(CLINICAL_REVIEW_BATCH_MANIFEST) !== CLINICAL_REVIEW_BATCH_HASH) blockers.push('manifest_hash_mismatch');
    const items: Awaited<ReturnType<typeof inspectItem>>[] = [];
    if (blockers.length === 0) {
      for (const item of CLINICAL_REVIEW_BATCH_ITEMS) {
        items.push(await inspectItem(ctx, item));
      }
    }
    return {
      allowed: blockers.length === 0,
      batchId: CLINICAL_REVIEW_BATCH_ID,
      batchHash: CLINICAL_REVIEW_BATCH_HASH,
      count: CLINICAL_REVIEW_BATCH_COUNT,
      reviewerDisplayName: CLINICAL_REVIEW_BATCH_REVIEWER.displayName,
      reviewerQualification: CLINICAL_REVIEW_BATCH_REVIEWER.qualification,
      blockers,
      items: items.map((item) => ({
        ordinal: item.ordinal,
        kind: item.kind,
        slug: item.slug,
        reviewRevision: item.reviewRevision,
        decisionKey: item.decisionKey,
        phase: item.phase,
        blockers: item.blockers,
      })),
    };
  },
});

async function refuse(
  ctx: MutationCtx,
  userId: Id<'users'>,
  code: string,
  summary: string,
  entityId?: string,
) {
  await logAudit(ctx, userId, 'clinicalReviewBatch.decision', 'libraryContent', entityId, summary, { result: 'rejected' });
  return { ok: false as const, code, message: 'The frozen clinical-review batch refused this decision.' };
}

export const saveAssignedDecision = mutation({
  args: {
    batchId: v.string(),
    batchHash: v.string(),
    count: v.number(),
    ordinal: v.number(),
    kind: v.string(),
    slug: v.string(),
    expectedReviewRevision: v.number(),
    decision: decisionValidator,
    note: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), decisionKey: v.string(), duplicate: v.boolean() }),
    v.object({ ok: v.literal(false), code: v.string(), message: v.string() }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const identityBlockers = await assignedReviewerBlockers(ctx, userId);
    if (identityBlockers.length > 0) return await refuse(ctx, userId, identityBlockers[0], `${args.slug} · refused: ${identityBlockers.join(',')}`);
    if (args.batchId !== CLINICAL_REVIEW_BATCH_ID || args.batchHash !== CLINICAL_REVIEW_BATCH_HASH || args.count !== CLINICAL_REVIEW_BATCH_COUNT) {
      return await refuse(ctx, userId, 'batch_manifest_mismatch', `${args.slug} · refused: batch_manifest_mismatch`);
    }
    if (await sha256Canonical(CLINICAL_REVIEW_BATCH_MANIFEST) !== CLINICAL_REVIEW_BATCH_HASH) {
      return await refuse(ctx, userId, 'manifest_hash_mismatch', `${args.slug} · refused: manifest_hash_mismatch`);
    }
    const item = CLINICAL_REVIEW_BATCH_ITEMS.find((candidate) =>
      candidate.ordinal === args.ordinal && candidate.kind === args.kind && candidate.slug === args.slug,
    );
    if (!item) return await refuse(ctx, userId, 'not_in_frozen_batch', `${args.slug} · refused: not_in_frozen_batch`);
    if (args.expectedReviewRevision !== item.reviewRevision) {
      return await refuse(ctx, userId, 'stale_revision', `${args.slug} · refused: expected revision ${args.expectedReviewRevision}`);
    }
    const note = args.note?.trim();
    if (args.decision === 'changes_requested' && !note) {
      return await refuse(ctx, userId, 'note_required', `${args.slug} · refused: changes_requested requires note`, item.contentId);
    }
    const state = await inspectItem(ctx, item);
    if (state.blockers.length > 0) return await refuse(ctx, userId, state.blockers[0], `${args.slug} · refused: ${state.blockers.join(',')}`, item.contentId);
    if (state.existing) {
      const identical = state.existing.decision === args.decision && (state.existing.note ?? '') === (note ?? '');
      if (!identical) return await refuse(ctx, userId, 'decision_key_conflict', `${args.slug} · refused: decision_key_conflict`, item.contentId);
      return { ok: true as const, decisionKey: state.decisionKey, duplicate: true };
    }

    const now = Date.now();
    await ctx.db.insert('contentReviews', {
      contentSlug: item.slug,
      contentVersion: item.reviewRevision,
      reviewRevision: item.reviewRevision,
      dimension: 'clinical',
      decision: args.decision,
      note: note || undefined,
      reviewerId: userId,
      reviewerDisplayName: CLINICAL_REVIEW_BATCH_REVIEWER.displayName,
      reviewerQualification: CLINICAL_REVIEW_BATCH_REVIEWER.qualification,
      reviewerRole: 'clinical_reviewer',
      reviewedAt: now,
      decisionKey: state.decisionKey,
      clinicalReviewBatchId: CLINICAL_REVIEW_BATCH_ID,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit(
      ctx,
      userId,
      'clinicalReviewBatch.decision',
      'libraryContent',
      item.contentId,
      `${item.kind}:${item.slug} · revision ${item.reviewRevision} · ${args.decision} · ${state.decisionKey}`,
      {
        result: 'ok',
        before: JSON.stringify({ batchId: CLINICAL_REVIEW_BATCH_ID, batchHash: CLINICAL_REVIEW_BATCH_HASH, count: CLINICAL_REVIEW_BATCH_COUNT, ordinal: item.ordinal }),
        after: JSON.stringify({ decisionKey: state.decisionKey, decision: args.decision, reviewRevision: item.reviewRevision }),
      },
    );
    return { ok: true as const, decisionKey: state.decisionKey, duplicate: false };
  },
});
