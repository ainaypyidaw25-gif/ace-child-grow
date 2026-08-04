import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, ownChild } from './lib/auth';

const categoryValidator = v.union(
  v.literal('behavior'),
  v.literal('development'),
  v.literal('health'),
  v.literal('other'),
);

const observationValidator = v.object({
  _id: v.id('observations'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  observedOn: v.string(),
  category: v.optional(categoryValidator),
  note: v.string(),
  createdAt: v.number(),
});

export const list = query({
  args: { childId: v.id('children') },
  returns: v.array(observationValidator),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, childId, userId);
    const rows = await ctx.db
      .query('observations')
      .withIndex('by_child_and_observed_on', (q) => q.eq('childId', childId))
      .collect();
    return rows.sort((a, b) => b.observedOn.localeCompare(a.observedOn) || b.createdAt - a.createdAt);
  },
});

export const add = mutation({
  args: {
    childId: v.id('children'),
    observedOn: v.string(),
    category: v.optional(categoryValidator),
    note: v.string(),
  },
  returns: v.id('observations'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const child = await ownChild(ctx, args.childId, userId);
    const note = args.note.trim();
    if (!note) throw new Error('Note is required');
    return await ctx.db.insert('observations', {
      ...args,
      note,
      userId: child.userId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('observations') },
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
