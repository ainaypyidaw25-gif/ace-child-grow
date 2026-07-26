import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, ownChild } from './lib/auth';

const sleepValidator = v.object({
  _id: v.id('sleepRecords'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  recordDate: v.string(),
  bedtime: v.optional(v.string()),
  wakeTime: v.optional(v.string()),
  napMinutes: v.number(),
  nightWakingCount: v.number(),
  breathingPauses: v.optional(v.boolean()),
  breathingDifficulty: v.optional(v.boolean()),
  notes: v.optional(v.string()),
});

export const list = query({
  args: { childId: v.id('children') },
  returns: v.array(sleepValidator),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, childId, userId);
    const rows = await ctx.db
      .query('sleepRecords')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .collect();
    return rows.sort((a, b) => b.recordDate.localeCompare(a.recordDate));
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const child = await ownChild(ctx, args.childId, userId);
    await ctx.db.insert('sleepRecords', { userId: child.userId, ...args });
    return null;
  },
});
