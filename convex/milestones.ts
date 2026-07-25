import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireUser, ownChild } from './lib/auth';

// Persist a completed milestone review session (result snapshot) for history.
export const recordSession = mutation({
  args: {
    childId: v.id('children'),
    resultState: v.union(v.literal('green'), v.literal('yellow'), v.literal('orange'), v.literal('red')),
    lostSkill: v.boolean(),
    resultSnapshot: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, args.childId, userId);
    await ctx.db.insert('milestoneSessions', {
      userId,
      childId: args.childId,
      completedAt: Date.now(),
      resultState: args.resultState,
      lostSkill: args.lostSkill,
      resultSnapshot: args.resultSnapshot,
    });
  },
});

export const listSessions = query({
  args: { childId: v.id('children') },
  handler: async (ctx, { childId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query('milestoneSessions')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .collect();
    return rows.filter((r) => r.userId === userId);
  },
});
