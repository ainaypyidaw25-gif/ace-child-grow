import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ownChild, requireUser } from './lib/auth';
import { requireFeature } from './lib/entitlements';
import { contentIsParentReadable } from './lib/publicationVisibility';

const completionValidator = v.object({
  _id: v.id('activityCompletions'),
  _creationTime: v.number(),
  userId: v.id('users'),
  childId: v.id('children'),
  contentSlug: v.string(),
  completedAt: v.number(),
  durationMinutes: v.optional(v.number()),
  note: v.optional(v.string()),
});

export const complete = mutation({
  args: {
    childId: v.id('children'),
    contentSlug: v.string(),
    durationMinutes: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  returns: v.id('activityCompletions'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await requireFeature(ctx, userId, 'activity_history');
    const child = await ownChild(ctx, args.childId, userId);
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug))
      .unique();
    if (!content || content.type !== 'activity' || !(await contentIsParentReadable(ctx, content))) {
      throw new Error('Activity not found');
    }
    return await ctx.db.insert('activityCompletions', {
      userId: child.userId,
      ...args,
      completedAt: Date.now(),
    });
  },
});

export const list = query({
  args: { childId: v.id('children') },
  returns: v.array(completionValidator),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await requireFeature(ctx, userId, 'activity_history');
    await ownChild(ctx, childId, userId);
    return await ctx.db
      .query('activityCompletions')
      .withIndex('by_child_and_completed_at', (q) => q.eq('childId', childId))
      .order('desc')
      .take(100);
  },
});
