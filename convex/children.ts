import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireUser } from './lib/auth';
import { childLimit } from './lib/entitlements';

const childValidator = v.object({
  _id: v.id('children'),
  _creationTime: v.number(),
  userId: v.id('users'),
  nickname: v.string(),
  birthDate: v.string(),
  sex: v.optional(v.union(v.literal('female'), v.literal('male'), v.literal('unspecified'))),
  gestationalWeeks: v.optional(v.number()),
  useCorrectedAge: v.boolean(),
  deletedAt: v.optional(v.number()),
});

// Ownership is ALWAYS derived from the authenticated identity, never from client
// input. A parent can only ever read/write their own children (P0 guarantee).

export const list = query({
  args: {},
  returns: v.array(childValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const owned = await ctx.db
      .query('children')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(10);
    const memberships = await ctx.db
      .query('familyCaregivers')
      .withIndex('by_caregiver_user', (q) => q.eq('caregiverUserId', userId))
      .take(5);
    const sharedGroups = await Promise.all(
      memberships
        .filter((membership) => membership.status === 'active')
        .map((membership) => ctx.db
          .query('children')
          .withIndex('by_user', (q) => q.eq('userId', membership.ownerId))
          .take(3)),
    );
    return [...owned, ...sharedGroups.flat()].filter((child) => !child.deletedAt);
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
  returns: v.id('children'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const children = await ctx.db
      .query('children')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(4);
    const activeCount = children.filter((child) => !child.deletedAt).length;
    const limit = await childLimit(ctx, userId);
    if (activeCount >= limit) {
      throw new Error(limit === 1 ? 'Family plan required to add another child' : 'Family plan supports up to 3 children');
    }
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id('children') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(args.id, { deletedAt: Date.now() });
    return null;
  },
});
