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
    // Optional translation-review fields (side-by-side en/mm editing).
    bodyMm: v.optional(v.string()),
    bodyEn: v.optional(v.string()),
    translationStatus: v.optional(v.string()), // draft | submitted | approved | changes_requested
    translationNote: v.optional(v.string()),
  }).index('by_status', ['reviewStatus']),

  // Verified healthcare facilities. NEVER seeded with invented data. Only
  // active + verified rows are shown to parents (directory.listPublic).
  healthcareFacilities: defineTable({
    country: v.string(),
    region: v.optional(v.string()),
    township: v.optional(v.string()),
    name: v.string(),
    facilityType: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    services: v.optional(v.string()),
    source: v.optional(v.string()),
    lastVerifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id('users')),
    isActive: v.boolean(), // inactive until verified
  }).index('by_active', ['isActive']),

  // Immutable audit trail. Insert-only; readable by staff/super-admin. Listed via
  // the implicit _creationTime order (newest first), so no extra index is needed.
  auditLogs: defineTable({
    actorId: v.optional(v.id('users')),
    action: v.string(),
    entityTable: v.optional(v.string()),
    entityId: v.optional(v.string()),
    summary: v.optional(v.string()),
  }).index('by_action', ['action']),

  // ------------------------------------------------------------------
  // Content Library (database-driven; nothing hardcoded in components).
  // One row per content item across all types (milestone/guide/activity/
  // lesson/special_need/story/printable). Type-specific structure lives in
  // `data`; first-class columns carry the searchable/indexed metadata and the
  // clinical-review lifecycle. Nothing is 'published' until a reviewer approves.
  // ------------------------------------------------------------------
  libraryContent: defineTable({
    type: v.string(),
    slug: v.string(),
    ageGroupKey: v.optional(v.string()),
    domainKey: v.optional(v.string()),
    category: v.optional(v.string()),
    titleMm: v.string(),
    titleEn: v.string(),
    summaryMm: v.optional(v.string()),
    summaryEn: v.optional(v.string()),
    tags: v.array(v.string()),
    difficulty: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    offline: v.optional(v.boolean()),
    data: v.any(), // type-specific bilingual payload
    source: v.string(),
    version: v.number(),
    clinicalStatus: v.string(), // draft | clinical_review | published
    reviewerId: v.optional(v.id('users')),
    reviewedAt: v.optional(v.number()),
    nextReviewAt: v.optional(v.number()),
    reviewNote: v.optional(v.string()),
    searchText: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_type', ['type'])
    .index('by_type_age', ['type', 'ageGroupKey'])
    .index('by_type_domain', ['type', 'domainKey'])
    .index('by_type_category', ['type', 'category'])
    .index('by_status', ['clinicalStatus']),

  // Media architecture for library content. Only architecture + placeholders are
  // seeded; real assets are attached later via the CMS media system.
  libraryMedia: defineTable({
    contentSlug: v.string(),
    kind: v.string(), // illustration | animation | audio | video | pdf | download | offline_bundle
    url: v.optional(v.string()),
    placeholder: v.boolean(),
    offline: v.optional(v.boolean()),
    note: v.optional(v.string()),
  })
    .index('by_content', ['contentSlug'])
    .index('by_kind', ['kind']),

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
