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
  }).index('by_user', ['userId']),

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
