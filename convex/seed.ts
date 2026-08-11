// One-shot admin seeding of the content library from a JSON snapshot generated
// from src/content/seed. This is an INTERNAL mutation — it can only be invoked
// by the Convex CLI/admin (`npx convex run seed:run`), never by app clients, so
// it safely skips the staff auth gate that guards the public importSeed. It is
// idempotent (upsert by slug) and never overrides an existing review decision.
import { internalMutation, internalQuery } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { v } from 'convex/values';
import { logAudit } from './audit';
import seedData from './seedData.json';
import {
  publishedErrataSlugs,
  seedAuditSummary,
  seedMayUpdateExisting,
  seedMediaIsProtected,
} from './lib/seedPolicy';
import {
  DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
  DUPLICATE_MILESTONE_SLUGS,
  type DuplicateMilestoneSlug,
} from './lib/contentRetirements';

const GRANTABLE_ROLES = [
  'owner',
  'content_editor',
  'language_reviewer',
  'evidence_reviewer',
  'clinical_reviewer',
  'review_manager',
  'support',
] as const;

// Grant staff access to an account by email. INTERNAL — CLI/admin only
// (`npx convex run seed:grantStaffByEmail '{"email":"you@example.com"}'`), never
// callable from the app. Bootstraps the first owner and recovers a locked-out one.
//
// Convex Auth mints a SEPARATE `users` row per sign-in method, so one person who
// has used both Google and email+password has two user ids under the same email.
// The previous version REFUSED when it saw more than one — which left the owner
// permanently locked out, because there was then no path to grant either row.
// This is exactly the "even the owner can't get in" failure. So every user row
// for the email is granted, not a silently-picked one: whichever way the owner
// signs in, that identity is staff. Email-scoped and owner-run, so this cannot
// escalate anyone else.
export const grantStaffByEmail = internalMutation({
  args: {
    email: v.string(),
    role: v.optional(v.union(...GRANTABLE_ROLES.map((r) => v.literal(r)))),
  },
  handler: async (ctx, { email, role }) => {
    const norm = email.trim().toLowerCase();
    const grantRole = role ?? 'owner';
    const users = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', norm))
      .take(20);
    if (users.length === 0) return { ok: false, reason: 'no account has that email', granted: 0, accounts: [] };

    const accounts: { userId: string; action: 'patched' | 'created' }[] = [];
    for (const user of users) {
      const profile = await ctx.db
        .query('parentProfiles')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, { isStaff: true, staffRole: grantRole });
        accounts.push({ userId: user._id, action: 'patched' });
      } else {
        await ctx.db.insert('parentProfiles', {
          userId: user._id,
          preferredLocale: 'mm',
          isStaff: true,
          staffRole: grantRole,
        });
        accounts.push({ userId: user._id, action: 'created' });
      }
      await logAudit(ctx, user._id, 'staff.grant', 'parentProfiles', user._id, `${norm} -> ${grantRole}`);
    }
    return { ok: true, granted: accounts.length, role: grantRole, accounts };
  },
});

// Read-only diagnosis of staff access. INTERNAL — CLI/admin only
// (`npx convex run seed:staffDiagnostics '{"email":"you@example.com"}'`).
// Answers "why can't I get into /admin?" without guessing: it lists every
// account row for the email with its staff status, and every current staff
// account, so a split Google-vs-password identity is visible at a glance.
export const staffDiagnostics = internalQuery({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, { email }) => {
    const norm = email?.trim().toLowerCase();

    const accountsForEmail: Array<{
      userId: string;
      email: string | null;
      hasProfile: boolean;
      isStaff: boolean;
      staffRole: string | null;
    }> = [];
    if (norm) {
      const users = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', norm))
        .take(20);
      for (const user of users) {
        const profile = await ctx.db
          .query('parentProfiles')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .unique();
        accountsForEmail.push({
          userId: user._id,
          email: (user as { email?: string }).email ?? null,
          hasProfile: profile !== null,
          isStaff: profile?.isStaff === true,
          staffRole: profile?.staffRole ?? null,
        });
      }
    }

    const staffProfiles = await ctx.db
      .query('parentProfiles')
      .withIndex('by_is_staff', (q) => q.eq('isStaff', true))
      .take(100);
    const allStaff = await Promise.all(
      staffProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          userId: profile.userId,
          email: (user as { email?: string } | null)?.email ?? null,
          staffRole: profile.staffRole ?? '(legacy isStaff → owner)',
          displayName: profile.displayName?.trim() || null,
        };
      }),
    );

    return {
      queriedEmail: norm ?? null,
      accountsForEmail,
      accountsForEmailCount: accountsForEmail.length,
      staffCount: allStaff.length,
      allStaff,
    };
  },
});

type Media = { kind: string; placeholder?: boolean; offline?: boolean; note?: string };
type Item = {
  type: string; slug: string; ageGroupKey?: string; domainKey?: string; category?: string;
  titleMm: string; titleEn: string; summaryMm?: string; summaryEn?: string; tags: string[];
  difficulty?: string; durationMinutes?: number; offline?: boolean; source: string;
  version: number; clinicalStatus: string; data: unknown; media: Media[]; searchText: string;
};

const duplicateMilestoneSlugValidator = v.union(
  v.literal('ms_5_6m_gross_motor_1'),
  v.literal('ms_5_6m_speech_1'),
  v.literal('ms_7_9m_gross_motor_1'),
  v.literal('ms_5_6m_fine_motor_1'),
  v.literal('ms_5_6m_language_1'),
  v.literal('ms_5_6m_social_1'),
);

const retirementPreflightRowValidator = v.object({
  slug: duplicateMilestoneSlugValidator,
  found: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  mediaRows: v.number(),
  evidenceLinkRows: v.number(),
});

/**
 * Read-only production preflight for the exact retirement release. Run this
 * after deployment and copy the six reported review revisions into the guarded
 * mutation. It cannot expose or mutate any other slug.
 */
export const preflightDuplicateMilestoneRetirement = internalQuery({
  args: { releaseId: v.literal(DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID) },
  returns: v.array(retirementPreflightRowValidator),
  handler: async (ctx) => {
    const rows: Array<{
      slug: DuplicateMilestoneSlug;
      found: boolean;
      clinicalStatus: string | null;
      reviewRevision: number | null;
      mediaRows: number;
      evidenceLinkRows: number;
    }> = [];
    for (const slug of DUPLICATE_MILESTONE_SLUGS) {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      const mediaRows = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', slug))
        .take(100);
      const evidenceLinkRows = await ctx.db
        .query('evidenceLinks')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .take(20);
      rows.push({
        slug,
        found: content !== null,
        clinicalStatus: content?.clinicalStatus ?? null,
        reviewRevision: content ? (content.reviewRevision ?? 1) : null,
        mediaRows: mediaRows.length,
        evidenceLinkRows: evidenceLinkRows.length,
      });
    }
    return rows;
  },
});

/**
 * Atomically archive the six reviewed duplicate milestones.
 *
 * INTERNAL means no browser or parent session can call it. The caller must use
 * the exact code-reviewed release id and the review revisions returned by the
 * preflight. Every target is validated before the first write, so a changed or
 * missing row aborts the whole transaction instead of partially withdrawing a
 * catalogue. Media, evidence links and review decisions remain for staff audit
 * but become unreachable to parents through the existing publication gates.
 */
export const retireDuplicateMilestones = internalMutation({
  args: {
    releaseId: v.literal(DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID),
    targets: v.array(v.object({
      slug: duplicateMilestoneSlugValidator,
      expectedReviewRevision: v.number(),
    })),
  },
  returns: v.object({
    retired: v.number(),
    alreadyRetired: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const expectedSlugs = new Set<string>(DUPLICATE_MILESTONE_SLUGS);
    const suppliedSlugs = new Set<string>(args.targets.map((target) => target.slug));
    if (
      args.targets.length !== DUPLICATE_MILESTONE_SLUGS.length
      || suppliedSlugs.size !== DUPLICATE_MILESTONE_SLUGS.length
      || [...expectedSlugs].some((slug) => !suppliedSlugs.has(slug))
    ) {
      throw new Error('Retirement targets must match the exact six-slug release');
    }

    const targetBySlug = new Map(args.targets.map((target) => [target.slug, target]));
    const validated: Array<Doc<'libraryContent'>> = [];
    let alreadyRetired = 0;

    // Validate the entire release before writing anything (stale-state guard).
    for (const slug of DUPLICATE_MILESTONE_SLUGS) {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      if (!content) throw new Error(`Retirement target missing: ${slug}`);
      const target = targetBySlug.get(slug);
      if (!target || (content.reviewRevision ?? 1) !== target.expectedReviewRevision) {
        throw new Error(`Retirement target has a newer review revision: ${slug}`);
      }
      if (content.clinicalStatus === 'archived') {
        alreadyRetired += 1;
        continue;
      }
      if (content.clinicalStatus !== 'published') {
        throw new Error(`Retirement target is not published: ${slug}`);
      }
      validated.push(content);
    }

    const now = Date.now();
    for (const content of validated) {
      await ctx.db.patch(content._id, {
        clinicalStatus: 'archived',
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: `Retired by ${DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID}`,
        updatedAt: now,
      });
      await logAudit(
        ctx,
        null,
        'library.duplicate_milestone.retired',
        'libraryContent',
        content._id,
        `${DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID} · ${content.slug}`,
        {
          before: JSON.stringify({
            clinicalStatus: content.clinicalStatus,
            reviewRevision: content.reviewRevision ?? 1,
          }),
          after: JSON.stringify({
            clinicalStatus: 'archived',
            reviewRevision: content.reviewRevision ?? 1,
          }),
        },
      );
    }

    return {
      retired: validated.length,
      alreadyRetired,
      total: DUPLICATE_MILESTONE_SLUGS.length,
    };
  },
});

/**
 * Applies one code-reviewed correction release to rows already published.
 * The content comes exclusively from the bundled seed snapshot; callers can
 * neither submit content nor choose slugs. Review state and media are retained.
 */
export const applyPublishedErrata = internalMutation({
  args: {
    releaseId: v.union(
      v.literal('2026-07-28-content-remediation'),
      v.literal('2026-07-28-myanmar-copy-clarity'),
    ),
  },
  returns: v.object({
    updated: v.number(),
    unchanged: v.number(),
    missing: v.number(),
    notPublished: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, { releaseId }) => {
    const slugs = publishedErrataSlugs(releaseId) ?? [];
    const items = seedData as unknown as Item[];
    const desiredBySlug = new Map(items.map((item) => [item.slug, item]));
    const priorErrata = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'library.published_errata'))
      .collect();
    const appliedSummaries = new Set(priorErrata.map((row) => row.summary).filter(Boolean));
    const now = Date.now();
    let updated = 0;
    let unchanged = 0;
    let missing = 0;
    let notPublished = 0;

    for (const slug of slugs) {
      const auditSummary = `${releaseId} · ${slug}`;
      if (appliedSummaries.has(auditSummary)) {
        unchanged += 1;
        continue;
      }
      const desired = desiredBySlug.get(slug);
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      if (!desired || !existing) {
        missing += 1;
        continue;
      }
      if (existing.clinicalStatus !== 'published') {
        notPublished += 1;
        continue;
      }

      const { media: _media, clinicalStatus: _clinicalStatus, ...content } = desired;
      void _media;
      void _clinicalStatus;
      const current = Object.fromEntries(
        Object.keys(content).map((key) => [key, existing[key as keyof typeof existing]]),
      );
      if (JSON.stringify(current) === JSON.stringify(content)) {
        unchanged += 1;
        continue;
      }

      await ctx.db.patch(existing._id, { ...content, updatedAt: now });
      await logAudit(
        ctx,
        null,
        'library.published_errata',
        'libraryContent',
        existing._id,
        auditSummary,
        {
          before: JSON.stringify({
            titleMm: existing.titleMm,
            reviewRevision: existing.reviewRevision ?? 1,
          }),
          after: JSON.stringify({
            titleMm: desired.titleMm,
            reviewRevision: existing.reviewRevision ?? 1,
          }),
        },
      );
      updated += 1;
    }

    return { updated, unchanged, missing, notPublished, total: slugs.length };
  },
});

export const run = internalMutation({
  args: {},
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    skippedApproved: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const items = seedData as unknown as Item[];
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skippedApproved = 0;
    for (const it of items) {
      const { media, ...content } = it;
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', it.slug))
        .unique();
      if (existing) {
        if (!seedMayUpdateExisting(existing.clinicalStatus)) {
          skippedApproved += 1;
          continue;
        }
        await ctx.db.patch(existing._id, {
          ...content,
          clinicalStatus: existing.clinicalStatus,
          reviewerId: existing.reviewerId,
          reviewedAt: existing.reviewedAt,
          nextReviewAt: existing.nextReviewAt,
          updatedAt: now,
        });
        updated++;
      } else {
        // Seeding can never create published content (clinical-review gate).
        const clinicalStatus = content.clinicalStatus === 'published' ? 'clinical_review' : content.clinicalStatus;
        await ctx.db.insert('libraryContent', { ...content, clinicalStatus, createdAt: now, updatedAt: now });
        created++;
      }
      const existingMedia = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', it.slug))
        .collect();
      for (const mrow of existingMedia) {
        if (!seedMediaIsProtected(mrow)) await ctx.db.delete(mrow._id);
      }
      for (const mref of media) {
        if (existingMedia.some((row) => row.kind === mref.kind && seedMediaIsProtected(row))) continue;
        await ctx.db.insert('libraryMedia', {
          contentSlug: it.slug,
          kind: mref.kind,
          placeholder: mref.placeholder ?? true,
          offline: mref.offline,
          note: mref.note,
        });
      }
    }
    await logAudit(
      ctx,
      null,
      'library.seed',
      'libraryContent',
      undefined,
      seedAuditSummary(created, updated, skippedApproved),
    );
    return { created, updated, skippedApproved, total: items.length };
  },
});
