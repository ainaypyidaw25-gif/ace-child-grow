import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

// ACE Child Grow — Convex schema.
// authTables provides `users`, `authSessions`, etc. (managed by Convex Auth).
// Every private table carries `userId` (the owning parent) and is queried only
// via `by_user` indexes filtered to the authenticated identity — the server-side
// equivalent of the P0 "no child data across accounts" guarantee.
export default defineSchema({
  ...authTables,

  // Parent consent + preferences (one row per user).
  parentProfiles: defineTable({
    userId: v.id('users'),
    displayName: v.optional(v.string()),
    preferredLocale: v.union(v.literal('mm'), v.literal('en')),
    consentAcceptedAt: v.optional(v.number()),
    privacyNoticeVersion: v.optional(v.string()),
    // Staff flag for the Admin CMS. Granted by a super admin (or, in dev, via the
    // Convex dashboard). Content-workflow mutations require this to be true.
    isStaff: v.optional(v.boolean()),
  }).index('by_user', ['userId']),

  // Saved (favourite) activities — private to the parent.
  favorites: defineTable({
    userId: v.id('users'),
    activityKey: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_activity', ['userId', 'activityKey']),

  // Per-parent notifications (e.g. review reminders). Private.
  notifications: defineTable({
    userId: v.id('users'),
    titleMm: v.string(),
    titleEn: v.string(),
    bodyMm: v.optional(v.string()),
    bodyEn: v.optional(v.string()),
    readAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  // Admin CMS content items carrying review-workflow state. Readable by any
  // authenticated user only when 'published'; staff see all and can transition.
  contentItems: defineTable({
    kind: v.string(), // milestone | activity | awareness | lesson
    titleMm: v.string(),
    titleEn: v.string(),
    reviewStatus: v.string(), // matches src/domain/content/workflow.ts states
  }).index('by_status', ['reviewStatus']),

  children: defineTable({
    userId: v.id('users'),
    nickname: v.string(),
    birthDate: v.string(), // ISO yyyy-mm-dd
    sex: v.optional(v.union(v.literal('female'), v.literal('male'), v.literal('unspecified'))),
    gestationalWeeks: v.optional(v.number()),
    useCorrectedAge: v.boolean(),
    deletedAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  growthRecords: defineTable({
    userId: v.id('users'),
    childId: v.id('children'),
    measuredOn: v.string(),
    weightKg: v.optional(v.number()),
    heightCm: v.optional(v.number()),
    headCircumferenceCm: v.optional(v.number()),
    inputWeightUnit: v.optional(v.string()),
    inputLengthUnit: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_child', ['childId']),

  sleepRecords: defineTable({
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
  })
    .index('by_user', ['userId'])
    .index('by_child', ['childId']),

  milestoneSessions: defineTable({
    userId: v.id('users'),
    childId: v.id('children'),
    ageGroupKey: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    resultState: v.optional(
      v.union(v.literal('green'), v.literal('yellow'), v.literal('orange'), v.literal('red')),
    ),
    lostSkill: v.boolean(),
    resultSnapshot: v.optional(v.any()),
  })
    .index('by_user', ['userId'])
    .index('by_child', ['childId']),
});
