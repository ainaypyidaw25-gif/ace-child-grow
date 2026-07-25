import { query, mutation, type QueryCtx, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Id } from './_generated/dataModel';

async function ownChild(ctx: QueryCtx | MutationCtx, childId: Id<'children'>, userId: Id<'users'>) {
  const child = await ctx.db.get(childId);
  if (!child || child.userId !== userId) throw new Error('Not found');
}

export const list = query({
  args: { childId: v.id('children') },
  handler: async (ctx, { childId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query('growthRecords')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .collect();
    // Defence in depth: only return rows owned by the caller.
    return rows.filter((r) => r.userId === userId).sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ownChild(ctx, args.childId, userId);
    await ctx.db.insert('growthRecords', { userId, ...args });
  },
});

export const remove = mutation({
  args: { id: v.id('growthRecords') },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new Error('Not found');
    await ctx.db.delete(id);
  },
});
