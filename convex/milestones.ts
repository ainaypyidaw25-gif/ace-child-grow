import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, ownChild } from './lib/auth';
import { resolveEntitlements } from './lib/entitlements';

const answerValidator = v.union(
  v.literal('yes'),
  v.literal('sometimes'),
  v.literal('not_yet'),
  v.literal('not_sure'),
);

// Persist a completed milestone review session (result snapshot) for history.
export const recordSession = mutation({
  args: {
    childId: v.id('children'),
    resultState: v.union(v.literal('green'), v.literal('yellow'), v.literal('orange'), v.literal('red')),
    lostSkill: v.boolean(),
    resultSnapshot: v.any(),
    ageGroupKey: v.optional(v.string()),
    responses: v.optional(v.array(v.object({
      milestoneKey: v.string(),
      titleMm: v.optional(v.string()),
      titleEn: v.optional(v.string()),
      domain: v.string(),
      answer: answerValidator,
      note: v.optional(v.string()),
    }))),
  },
  returns: v.id('milestoneSessions'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const child = await ownChild(ctx, args.childId, userId);
    const sessionId = await ctx.db.insert('milestoneSessions', {
      userId: child.userId,
      childId: args.childId,
      ageGroupKey: args.ageGroupKey,
      completedAt: Date.now(),
      resultState: args.resultState,
      lostSkill: args.lostSkill,
      resultSnapshot: args.resultSnapshot,
    });
    const answeredAt = Date.now();
    for (const response of args.responses ?? []) {
      await ctx.db.insert('milestoneResponses', {
        userId: child.userId,
        childId: args.childId,
        sessionId,
        ...response,
        answeredAt,
      });
    }
    return sessionId;
  },
});

export const listSessions = query({
  args: { childId: v.id('children') },
  returns: v.array(v.object({
    _id: v.id('milestoneSessions'),
    _creationTime: v.number(),
    userId: v.id('users'),
    childId: v.id('children'),
    ageGroupKey: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    resultState: v.optional(v.union(v.literal('green'), v.literal('yellow'), v.literal('orange'), v.literal('red'))),
    lostSkill: v.boolean(),
    resultSnapshot: v.optional(v.any()),
  })),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, childId, userId);
    const entitlements = await resolveEntitlements(ctx, userId);
    const limit = entitlements.features.includes('advanced_reports') ? 100 : 1;
    const rows = await ctx.db
      .query('milestoneSessions')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .take(limit);
    return rows;
  },
});

export const latestSession = query({
  args: { childId: v.id('children') },
  returns: v.union(v.null(), v.object({
    _id: v.id('milestoneSessions'),
    completedAt: v.union(v.number(), v.null()),
    resultState: v.union(v.literal('green'), v.literal('yellow'), v.literal('orange'), v.literal('red'), v.null()),
    lostSkill: v.boolean(),
    responseCount: v.number(),
  })),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, childId, userId);
    const session = await ctx.db
      .query('milestoneSessions')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .first();
    if (!session) return null;
    const responses = await ctx.db
      .query('milestoneResponses')
      .withIndex('by_session', (q) => q.eq('sessionId', session._id))
      .take(100);
    return {
      _id: session._id,
      completedAt: session.completedAt ?? null,
      resultState: session.resultState ?? null,
      lostSkill: session.lostSkill,
      responseCount: responses.length,
    };
  },
});
