import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { isStaff, requireStaff } from './lib/auth';
import { logAudit } from './audit';

// Mirror of src/domain/content/workflow.ts (convex functions can't import src/).
const TRANSITIONS: Record<string, string[]> = {
  draft: ['content_review', 'archived'],
  content_review: ['translation_review', 'draft', 'archived'],
  translation_review: ['clinical_review', 'content_review', 'archived'],
  clinical_review: ['approved', 'translation_review', 'archived'],
  approved: ['published', 'clinical_review', 'archived'],
  published: ['approved', 'archived'],
  archived: ['draft'],
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const staff = userId ? await isStaff(ctx, userId) : false;
    const all = await ctx.db.query('contentItems').collect();
    // Non-staff see only published items; staff see everything.
    return { staff, items: staff ? all : all.filter((i) => i.reviewStatus === 'published') };
  },
});

// Idempotent seed so the Admin CMS has content to manage. Staff-only; every item
// starts in clinical_review (never published without the review workflow below).
export const seedIfEmpty = mutation({
  args: { items: v.array(v.object({ kind: v.string(), titleMm: v.string(), titleEn: v.string() })) },
  handler: async (ctx, { items }) => {
    await requireStaff(ctx);
    const existing = await ctx.db.query('contentItems').take(1);
    if (existing.length > 0) return;
    for (const it of items) {
      await ctx.db.insert('contentItems', { ...it, reviewStatus: 'clinical_review' });
    }
  },
});

export const transition = mutation({
  args: { id: v.id('contentItems'), to: v.string() },
  handler: async (ctx, { id, to }) => {
    const userId = await requireStaff(ctx);
    const item = await ctx.db.get(id);
    if (!item) throw new Error('Not found');
    const allowed = TRANSITIONS[item.reviewStatus] ?? [];
    if (!allowed.includes(to)) throw new Error(`Invalid transition ${item.reviewStatus} -> ${to}`);
    await ctx.db.patch(id, { reviewStatus: to });
    // All content transitions (esp. publish) are audited.
    await logAudit(ctx, userId, `content.${to}`, 'contentItems', id, item.titleEn);
  },
});

// Translation review: staff edit the mm/en pair and move its translation state.
// Clinical content still cannot be published without the review workflow above.
export const setTranslation = mutation({
  args: {
    id: v.id('contentItems'),
    bodyMm: v.optional(v.string()),
    bodyEn: v.optional(v.string()),
    translationStatus: v.string(),
    translationNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireStaff(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    await logAudit(ctx, userId, `translation.${args.translationStatus}`, 'contentItems', id);
  },
});
