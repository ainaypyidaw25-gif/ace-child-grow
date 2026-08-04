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

// Short-lived upload URL for a milestone keepsake photo. Ownership isn't
// checked here — a storage id alone grants nothing — it's enforced when the
// photo is actually attached to a response, same as the payment-proof flow.
export const generatePhotoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

// Attaches (or replaces) a keepsake photo on an achieved milestone response.
// The upload is re-validated server-side rather than trusted from the
// client, the same way payment-proof uploads are checked in billing.ts.
export const attachMilestonePhoto = mutation({
  args: {
    responseId: v.id('milestoneResponses'),
    storageId: v.id('_storage'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(args.responseId);
    if (!row) throw new Error('Milestone response not found');
    await ownChild(ctx, row.childId, userId);
    if (row.answer !== 'yes') throw new Error('Only an achieved milestone can have a keepsake photo');

    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata) throw new Error('Uploaded photo not found');
    if (!PHOTO_ALLOWED_TYPES.includes(metadata.contentType ?? '') || metadata.size > PHOTO_MAX_BYTES) {
      await ctx.storage.delete(args.storageId);
      throw new Error('Use a JPG, PNG, or WebP photo up to 5 MB');
    }

    const previousStorageId = row.photoStorageId;
    await ctx.db.patch(args.responseId, { photoStorageId: args.storageId });
    if (previousStorageId && previousStorageId !== args.storageId) {
      await ctx.storage.delete(previousStorageId);
    }
    return null;
  },
});

export const removeMilestonePhoto = mutation({
  args: { responseId: v.id('milestoneResponses') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(args.responseId);
    if (!row) throw new Error('Milestone response not found');
    await ownChild(ctx, row.childId, userId);
    if (!row.photoStorageId) throw new Error('No photo to remove');
    await ctx.storage.delete(row.photoStorageId);
    await ctx.db.patch(args.responseId, { photoStorageId: undefined });
    return null;
  },
});

// One row per achieved (`'yes'`) milestone, deduped by milestoneKey (a
// milestone re-answered in a later session shows once, as the newest
// record), with a freshly resolved — never stored/trusted — photo URL.
export const listAchievedMilestones = query({
  args: { childId: v.id('children') },
  returns: v.array(v.object({
    _id: v.id('milestoneResponses'),
    milestoneKey: v.string(),
    titleMm: v.optional(v.string()),
    titleEn: v.optional(v.string()),
    domain: v.string(),
    answeredAt: v.number(),
    photoUrl: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, { childId }) => {
    const userId = await requireUser(ctx);
    await ownChild(ctx, childId, userId);
    const rows = await ctx.db
      .query('milestoneResponses')
      .withIndex('by_child', (q) => q.eq('childId', childId))
      .order('desc')
      .take(300);

    const latestByKey = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (row.answer !== 'yes') continue;
      const existing = latestByKey.get(row.milestoneKey);
      if (!existing || row.answeredAt > existing.answeredAt) latestByKey.set(row.milestoneKey, row);
    }

    const achieved = [...latestByKey.values()].sort((a, b) => b.answeredAt - a.answeredAt);
    return Promise.all(achieved.map(async (row) => ({
      _id: row._id,
      milestoneKey: row.milestoneKey,
      titleMm: row.titleMm,
      titleEn: row.titleEn,
      domain: row.domain,
      answeredAt: row.answeredAt,
      photoUrl: row.photoStorageId ? await ctx.storage.getUrl(row.photoStorageId) : null,
    })));
  },
});

export const getMilestoneKeepsake = query({
  args: { responseId: v.id('milestoneResponses') },
  returns: v.union(v.null(), v.object({
    milestoneKey: v.string(),
    titleMm: v.optional(v.string()),
    titleEn: v.optional(v.string()),
    domain: v.string(),
    answeredAt: v.number(),
    childNickname: v.string(),
    photoUrl: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, { responseId }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(responseId);
    if (!row) return null;
    const child = await ownChild(ctx, row.childId, userId);
    return {
      milestoneKey: row.milestoneKey,
      titleMm: row.titleMm,
      titleEn: row.titleEn,
      domain: row.domain,
      answeredAt: row.answeredAt,
      childNickname: child.nickname,
      photoUrl: row.photoStorageId ? await ctx.storage.getUrl(row.photoStorageId) : null,
    };
  },
});
