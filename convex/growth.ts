import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, ownChild } from './lib/auth';

const growthValidator = v.object({
  _id: v.id('growthRecords'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  measuredOn: v.string(),
  weightKg: v.optional(v.number()),
  heightCm: v.optional(v.number()),
  headCircumferenceCm: v.optional(v.number()),
  inputWeightUnit: v.optional(v.string()),
  inputLengthUnit: v.optional(v.string()),
  notes: v.optional(v.string()),
});

export const list = query({
  args: { childId: v.id('children') },
  returns: v.array(growthValidator),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, childId, userId);
    const rows = await ctx.db
      .query('growthRecords')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .collect();
    // Defence in depth: only return rows owned by the caller.
    return rows.sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
  },
});

export const add = mutation({
  args: {
    childId: v.id('children'),
    measuredOn: v.string(),
    weightKg: v.optional(v.number()),
    heightCm: v.optional(v.number()),
    inputWeightUnit: v.optional(v.string()),
    inputLengthUnit: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const child = await ownChild(ctx, args.childId, userId);
    await ctx.db.insert('growthRecords', { userId: child.userId, ...args });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id('growthRecords') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Not found');
    await ownChild(ctx, row.childId, userId);
    await ctx.db.delete(id);
    return null;
  },
});
