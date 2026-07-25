import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireUser, ownChild } from './lib/auth';

export const list = query({
  args: { childId: v.id('children') },
  handler: async (ctx, { childId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query('sleepRecords')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .collect();
    return rows.filter((r) => r.userId === userId).sort((a, b) => b.recordDate.localeCompare(a.recordDate));
  },
});

export const add = mutation({
  args: {
    childId: v.id('children'),
    recordDate: v.string(),
    bedtime: v.optional(v.string()),
    wakeTime: v.optional(v.string()),
    napMinutes: v.number(),
    nightWakingCount: v.number(),
    breathingPauses: v.optional(v.boolean()),
    breathingDifficulty: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, args.childId, userId);
    await ctx.db.insert('sleepRecords', { userId, ...args });
  },
});
