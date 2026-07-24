import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

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

async function isStaff(ctx: any, userId: any): Promise<boolean> {
  const profile = await ctx.db
    .query('parentProfiles')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .unique();
  return profile?.isStaff === true;
}

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

// Idempotent seed so the Admin CMS has content to manage. Any authenticated user
// may seed the initial catalogue (all items start in clinical_review).
export const seedIfEmpty = mutation({
  args: { items: v.array(v.object({ kind: v.string(), titleMm: v.string(), titleEn: v.string() })) },
  handler: async (ctx, { items }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    if (!(await isStaff(ctx, userId))) throw new Error('Staff only');
    const item = await ctx.db.get(id);
    if (!item) throw new Error('Not found');
    const allowed = TRANSITIONS[item.reviewStatus] ?? [];
    if (!allowed.includes(to)) throw new Error(`Invalid transition ${item.reviewStatus} -> ${to}`);
    await ctx.db.patch(id, { reviewStatus: to });
  },
});
