import { query, mutation, type QueryCtx, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

// Ownership is ALWAYS derived from the authenticated identity, never from client
// input. A parent can only ever read/write their own children (P0 guarantee).
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query('children')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.filter((c) => !c.deletedAt);
  },
});

export const add = mutation({
  args: {
    nickname: v.string(),
    birthDate: v.string(),
    sex: v.optional(v.union(v.literal('female'), v.literal('male'), v.literal('unspecified'))),
    gestationalWeeks: v.optional(v.number()),
    useCorrectedAge: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert('children', { userId, ...args });
  },
});

export const update = mutation({
  args: {
    id: v.id('children'),
    nickname: v.string(),
    birthDate: v.string(),
    gestationalWeeks: v.optional(v.number()),
    useCorrectedAge: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id('children') },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(args.id, { deletedAt: Date.now() });
  },
});
