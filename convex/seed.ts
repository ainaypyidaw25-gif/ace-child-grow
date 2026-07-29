// One-shot admin seeding of the content library from a JSON snapshot generated
// from src/content/seed. This is an INTERNAL mutation — it can only be invoked
// by the Convex CLI/admin (`npx convex run seed:run`), never by app clients, so
// it safely skips the staff auth gate that guards the public importSeed. It is
// idempotent (upsert by slug) and never overrides an existing review decision.
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { logAudit } from './audit';
import seedData from './seedData.json';
import {
  publishedErrataSlugs,
  seedAuditSummary,
  seedContentNeedsUpdate,
  seedMayUpdateExisting,
  seedMediaIsProtected,
  seedReviewInvalidationPatch,
} from './lib/seedPolicy';

// Grant staff (CMS access) to an account by email. INTERNAL — CLI/admin only,
// never callable from the app. Used to bootstrap the first reviewer account.
export const grantStaffByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email.trim().toLowerCase()))
      .unique();
    if (!user) return { ok: false, reason: 'no such user' };
    const profile = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, { isStaff: true, staffRole: 'owner' });
    } else {
      await ctx.db.insert('parentProfiles', {
        userId: user._id,
        preferredLocale: 'mm',
        isStaff: true,
        staffRole: 'owner',
      });
    }
    await logAudit(ctx, user._id, 'staff.grant', 'parentProfiles', user._id, email);
    return { ok: true, userId: user._id };
  },
});

type Media = { kind: string; placeholder?: boolean; offline?: boolean; note?: string };
type Item = {
  type: string; slug: string; ageGroupKey?: string; domainKey?: string; category?: string;
  titleMm: string; titleEn: string; summaryMm?: string; summaryEn?: string; tags: string[];
  difficulty?: string; durationMinutes?: number; offline?: boolean; source: string;
  version: number; clinicalStatus: string; data: unknown; media: Media[]; searchText: string;
};

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
        if (seedContentNeedsUpdate(existing, content)) {
          await ctx.db.patch(existing._id, {
            ...content,
            clinicalStatus: existing.clinicalStatus,
            ...seedReviewInvalidationPatch(existing),
            updatedAt: now,
          });
          updated++;
        }
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
