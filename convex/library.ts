// Content Library Convex functions.
//
// Read access: published items are visible to any authenticated user; staff see
// everything (all clinical statuses). Write access (import, review transitions,
// media) is staff-only and audited. The library carries NO per-parent private
// data, so reads are shared catalogue — but still behind authentication.
import { query, mutation, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Id } from './_generated/dataModel';
import { logAudit } from './audit';

async function isStaff(ctx: QueryCtx, userId: Id<'users'>): Promise<boolean> {
  const p = await ctx.db
    .query('parentProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  return p?.isStaff === true;
}

// List content by type, optionally filtered by age/domain/category and a query.
// Non-staff receive only 'published'; staff receive all statuses.
export const listByType = query({
  args: {
    type: v.string(),
    ageGroupKey: v.optional(v.string()),
    domainKey: v.optional(v.string()),
    category: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { staff: false, items: [] };
    const staff = await isStaff(ctx, userId);

    let rows = await ctx.db
      .query('libraryContent')
      .withIndex('by_type', (qq) => qq.eq('type', args.type))
      .collect();

    if (args.ageGroupKey) rows = rows.filter((r) => r.ageGroupKey === args.ageGroupKey);
    if (args.domainKey) rows = rows.filter((r) => r.domainKey === args.domainKey);
    if (args.category) rows = rows.filter((r) => r.category === args.category);
    if (!staff) rows = rows.filter((r) => r.clinicalStatus === 'published');
    if (args.q) {
      const needle = args.q.toLowerCase();
      rows = rows.filter((r) => r.searchText.includes(needle));
    }
    // Stable ordering: age order not stored here, so order by slug for determinism.
    rows.sort((a, b) => a.slug.localeCompare(b.slug));
    return { staff, items: rows };
  },
});

// Fetch one item by slug (with its media). Non-staff cannot read unpublished.
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const staff = await isStaff(ctx, userId);
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .unique();
    if (!item) return null;
    if (!staff && item.clinicalStatus !== 'published') return { restricted: true };
    const media = await ctx.db
      .query('libraryMedia')
      .withIndex('by_content', (qq) => qq.eq('contentSlug', args.slug))
      .collect();
    return { item, media, staff };
  },
});

// Cross-type search (for the library search box).
export const search = query({
  args: { q: v.string(), type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const staff = await isStaff(ctx, userId);
    const needle = args.q.trim().toLowerCase();
    if (!needle) return [];
    let rows = args.type
      ? await ctx.db.query('libraryContent').withIndex('by_type', (qq) => qq.eq('type', args.type as string)).collect()
      : await ctx.db.query('libraryContent').collect();
    if (!staff) rows = rows.filter((r) => r.clinicalStatus === 'published');
    return rows
      .filter((r) => r.searchText.includes(needle))
      .slice(0, 50)
      .map((r) => ({ _id: r._id, slug: r.slug, type: r.type, titleMm: r.titleMm, titleEn: r.titleEn, clinicalStatus: r.clinicalStatus }));
  },
});

// Coverage/stats — powers the admin dashboard and integrity checks.
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false, total: 0, byType: {}, byStatus: {}, ages: [], domains: [] };
    const rows = await ctx.db.query('libraryContent').collect();
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const ages = new Set<string>();
    const domains = new Set<string>();
    for (const r of rows) {
      byType[r.type] = (byType[r.type] ?? 0) + 1;
      byStatus[r.clinicalStatus] = (byStatus[r.clinicalStatus] ?? 0) + 1;
      if (r.ageGroupKey) ages.add(r.ageGroupKey);
      if (r.domainKey) domains.add(r.domainKey);
    }
    return { allowed: true, total: rows.length, byType, byStatus, ages: [...ages], domains: [...domains] };
  },
});

const seedItemValidator = v.object({
  type: v.string(),
  slug: v.string(),
  ageGroupKey: v.optional(v.string()),
  domainKey: v.optional(v.string()),
  category: v.optional(v.string()),
  titleMm: v.string(),
  titleEn: v.string(),
  summaryMm: v.optional(v.string()),
  summaryEn: v.optional(v.string()),
  tags: v.array(v.string()),
  difficulty: v.optional(v.string()),
  durationMinutes: v.optional(v.number()),
  offline: v.optional(v.boolean()),
  source: v.string(),
  version: v.number(),
  clinicalStatus: v.string(),
  data: v.any(),
  media: v.array(
    v.object({
      kind: v.string(),
      placeholder: v.optional(v.boolean()),
      offline: v.optional(v.boolean()),
      note: v.optional(v.string()),
    }),
  ),
  searchText: v.string(),
});

// Idempotent import: upsert by slug. Preserves existing clinicalStatus/reviewer
// on already-imported items (so a re-seed never silently un-publishes reviewed
// content). Staff-only; audited. Replaces media placeholders for the slug.
export const importSeed = mutation({
  args: { items: v.array(seedItemValidator) },
  handler: async (ctx, { items }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) throw new Error('Staff only');
    const now = Date.now();
    let created = 0;
    let updated = 0;
    for (const it of items) {
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (qq) => qq.eq('slug', it.slug))
        .unique();
      const { media, ...content } = it;
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...content,
          // Never override a human review decision on re-seed.
          clinicalStatus: existing.clinicalStatus,
          reviewerId: existing.reviewerId,
          reviewedAt: existing.reviewedAt,
          nextReviewAt: existing.nextReviewAt,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert('libraryContent', { ...content, createdAt: now, updatedAt: now });
        created++;
      }
      // Refresh media placeholders for this slug.
      const existingMedia = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (qq) => qq.eq('contentSlug', it.slug))
        .collect();
      for (const mrow of existingMedia) await ctx.db.delete(mrow._id);
      for (const mref of media) {
        await ctx.db.insert('libraryMedia', {
          contentSlug: it.slug,
          kind: mref.kind,
          placeholder: mref.placeholder ?? true,
          offline: mref.offline,
          note: mref.note,
        });
      }
    }
    await logAudit(ctx, userId, 'library.import', 'libraryContent', undefined, `created ${created}, updated ${updated}`);
    return { created, updated, total: items.length };
  },
});

// Review transition (draft/clinical_review/published) with reviewer + dates.
export const setReview = mutation({
  args: {
    slug: v.string(),
    clinicalStatus: v.string(),
    reviewNote: v.optional(v.string()),
    nextReviewAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) throw new Error('Staff only');
    if (!['draft', 'clinical_review', 'published'].includes(args.clinicalStatus)) {
      throw new Error('Invalid status');
    }
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .unique();
    if (!item) throw new Error('Not found');
    const now = Date.now();
    await ctx.db.patch(item._id, {
      clinicalStatus: args.clinicalStatus,
      reviewerId: userId,
      reviewedAt: now,
      nextReviewAt: args.nextReviewAt,
      reviewNote: args.reviewNote,
      updatedAt: now,
    });
    await logAudit(ctx, userId, `library.${args.clinicalStatus}`, 'libraryContent', item._id, item.titleEn);
    return { ok: true };
  },
});
