import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ownChild, requireUser } from './lib/auth';
import { requireFeature } from './lib/entitlements';

const appointmentValidator = v.object({
  _id: v.id('appointments'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  title: v.string(),
  providerName: v.optional(v.string()),
  appointmentAt: v.number(),
  questions: v.optional(v.string()),
  notes: v.optional(v.string()),
  reminderAt: v.optional(v.number()),
  status: v.union(v.literal('scheduled'), v.literal('completed'), v.literal('canceled')),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listMine = query({
  args: { childId: v.optional(v.id('children')) },
  returns: v.array(appointmentValidator),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await requireFeature(ctx, userId, 'appointments');
    if (childId) {
      await ownChild(ctx, childId, userId);
      return await ctx.db
        .query('appointments')
        .withIndex('by_child_and_appointment_at', (q) => q.eq('childId', childId))
        .order('desc')
        .take(100);
    }
    return await ctx.db
      .query('appointments')
      .withIndex('by_user_and_appointment_at', (q) => q.eq('userId', userId))
      .order('desc')
      .take(100);
  },
});

export const add = mutation({
  args: {
    childId: v.id('children'),
    title: v.string(),
    providerName: v.optional(v.string()),
    appointmentAt: v.number(),
    questions: v.optional(v.string()),
    notes: v.optional(v.string()),
    reminderAt: v.optional(v.number()),
  },
  returns: v.id('appointments'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await requireFeature(ctx, userId, 'appointments');
    const child = await ownChild(ctx, args.childId, userId);
    const title = args.title.trim();
    if (!title) throw new Error('Appointment title is required');
    if (!Number.isFinite(args.appointmentAt)) throw new Error('Invalid appointment time');
    const now = Date.now();
    return await ctx.db.insert('appointments', {
      ...args,
      title,
      userId: child.userId,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id('appointments'),
    status: v.union(v.literal('scheduled'), v.literal('completed'), v.literal('canceled')),
  },
  returns: v.null(),
  handler: async (ctx, { id, status }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Not found');
    await ownChild(ctx, row.childId, userId);
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id('appointments') },
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
