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
    staffRole: v.optional(
      v.union(
        v.literal('owner'),
        v.literal('content_editor'),
        v.literal('clinical_reviewer'),
        v.literal('support'),
      ),
    ),
    staffQualification: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_is_staff', ['isStaff'])
    .index('by_staff_role', ['staffRole']),

  // Invite-only staff onboarding. The raw invitation code is returned once to
  // the owner and never stored; only its SHA-256 digest is persisted.
  staffInvites: defineTable({
    email: v.string(),
    displayName: v.string(),
    role: v.union(
      v.literal('owner'),
      v.literal('content_editor'),
      v.literal('clinical_reviewer'),
      v.literal('support'),
    ),
    reviewerQualification: v.optional(v.string()),
    codeHash: v.string(),
    targetUserId: v.id('users'),
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('revoked'), v.literal('expired')),
    invitedBy: v.id('users'),
    invitedAt: v.number(),
    expiresAt: v.number(),
    acceptedBy: v.optional(v.id('users')),
    acceptedAt: v.optional(v.number()),
  })
    .index('by_email', ['email'])
    .index('by_code_hash', ['codeHash'])
    .index('by_status', ['status']),

  // Billing-provider-neutral subscription state. Stripe (or another provider)
  // can be connected later without changing parent or child records.
  subscriptions: defineTable({
    userId: v.id('users'),
    planKey: v.union(v.literal('free'), v.literal('premium'), v.literal('family')),
    status: v.union(
      v.literal('active'),
      v.literal('trialing'),
      v.literal('past_due'),
      v.literal('canceled'),
      v.literal('paused'),
    ),
    provider: v.optional(v.string()),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    trialStartedAt: v.optional(v.number()),
    trialUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_status_period_end', ['status', 'currentPeriodEnd'])
    .index('by_provider_subscription', ['provider', 'providerSubscriptionId']),

  // Owner-configured prices. No amount or payment destination is shipped in
  // the frontend bundle; production configuration lives in Convex.
  subscriptionPlans: defineTable({
    planKey: v.union(v.literal('premium'), v.literal('family')),
    nameMm: v.string(),
    nameEn: v.string(),
    descriptionMm: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    interval: v.union(v.literal('month'), v.literal('year')),
    features: v.array(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_plan_key', ['planKey'])
    .index('by_plan_key_interval', ['planKey', 'interval'])
    .index('by_active_and_sort_order', ['isActive', 'sortOrder']),

  // Configurable local/manual payment destinations (e.g. a merchant wallet or
  // bank transfer). Secrets are never stored here.
  paymentMethods: defineTable({
    nameMm: v.string(),
    nameEn: v.string(),
    accountName: v.string(),
    accountIdentifier: v.string(),
    instructionsMm: v.optional(v.string()),
    instructionsEn: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_active_and_sort_order', ['isActive', 'sortOrder']),

  paymentRequests: defineTable({
    userId: v.id('users'),
    planKey: v.union(v.literal('premium'), v.literal('family')),
    planId: v.optional(v.id('subscriptionPlans')),
    paymentMethodId: v.id('paymentMethods'),
    amount: v.number(),
    currency: v.string(),
    paymentReference: v.string(),
    proofStorageId: v.optional(v.id('_storage')),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'), v.literal('canceled')),
    reviewedBy: v.optional(v.id('users')),
    reviewNote: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status']),

  // Myan Myan Pay transactions are kept separate from the legacy/manual
  // screenshot-review flow above. Provider credentials live only in Convex
  // environment variables; this table contains non-secret reconciliation data.
  mmpayTransactions: defineTable({
    userId: v.id('users'),
    planKey: v.union(v.literal('premium'), v.literal('family')),
    planId: v.optional(v.id('subscriptionPlans')),
    planInterval: v.optional(v.union(v.literal('month'), v.literal('year'))),
    environment: v.union(v.literal('sandbox'), v.literal('production')),
    orderId: v.string(),
    amount: v.number(),
    currency: v.literal('MMK'),
    status: v.union(
      v.literal('INITIATING'),
      v.literal('PENDING'),
      v.literal('SUCCESS'),
      v.literal('FAILED'),
      v.literal('REFUNDED'),
      v.literal('CANCELLED'),
      v.literal('EXPIRED'),
    ),
    condition: v.optional(v.union(v.literal('PRISTINE'), v.literal('TOUCHED'), v.literal('DIRTY'), v.literal('EXPIRED'))),
    qrPayload: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    vendor: v.optional(v.string()),
    method: v.optional(v.union(v.literal('QR'), v.literal('PIN'), v.literal('PWA'), v.literal('CARD'))),
    vendorQrRefId: v.optional(v.string()),
    transactionRefId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    callbackReceivedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_order_id', ['orderId'])
    .index('by_user', ['userId'])
    .index('by_status', ['status'])
    .index('by_transaction_ref_id', ['transactionRefId']),

  // A signed callback can be delivered more than once. Persisting a digest of
  // its nonce makes processing idempotent without retaining the raw nonce.
  mmpayWebhookEvents: defineTable({
    nonceHash: v.string(),
    orderId: v.string(),
    status: v.string(),
    receivedAt: v.number(),
  })
    .index('by_nonce_hash', ['nonceHash'])
    .index('by_order_id', ['orderId']),

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
    reviewerQualification: v.optional(v.string()),
    reviewerId: v.optional(v.id('users')),
    reviewScope: v.optional(v.union(v.literal('education'), v.literal('clinical'))),
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
    nextVerificationAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id('users')),
    isActive: v.boolean(), // inactive until verified
  })
    .index('by_active', ['isActive'])
    .index('by_name', ['name']),

  // Immutable audit trail. Insert-only; readable by staff/super-admin. Listed via
  // the implicit _creationTime order (newest first), so no extra index is needed.
  auditLogs: defineTable({
    actorId: v.optional(v.id('users')),
    action: v.string(),
    entityTable: v.optional(v.string()),
    entityId: v.optional(v.string()),
    summary: v.optional(v.string()),
    // A refused action is the one most worth recording: an attempt to approve a
    // reference that may not be approved is a fact about the review process,
    // not a non-event. 'ok' | 'rejected' | 'failed'. All three fields are
    // optional so existing rows stay valid — this is an additive change.
    result: v.optional(v.string()),
    before: v.optional(v.string()),
    after: v.optional(v.string()),
  })
    .index('by_action', ['action'])
    .index('by_result', ['result']),

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
    reviewerQualification: v.optional(v.string()),
    reviewerDisplayName: v.optional(v.string()),
    reviewScope: v.optional(v.union(v.literal('education'), v.literal('clinical'))),
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
    storageId: v.optional(v.id('_storage')),
    mimeType: v.optional(v.string()),
    altMm: v.optional(v.string()),
    altEn: v.optional(v.string()),
    captionMm: v.optional(v.string()),
    captionEn: v.optional(v.string()),
    placeholder: v.boolean(),
    offline: v.optional(v.boolean()),
    note: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    transcriptMm: v.optional(v.string()),
    transcriptEn: v.optional(v.string()),
    rightsOwner: v.optional(v.string()),
    rightsSourceUrl: v.optional(v.string()),
    licenseType: v.optional(v.string()),
    attributionMm: v.optional(v.string()),
    attributionEn: v.optional(v.string()),
    reviewStatus: v.optional(
      v.union(v.literal('planned'), v.literal('in_review'), v.literal('approved'), v.literal('retired')),
    ),
    reviewedBy: v.optional(v.id('users')),
    reviewerQualification: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    nextReviewAt: v.optional(v.number()),
    accessLevel: v.optional(v.union(v.literal('free_sample'), v.literal('premium'))),
    sortOrder: v.optional(v.number()),
  })
    .index('by_content', ['contentSlug'])
    .index('by_kind', ['kind']),

  // ------------------------------------------------------------------
  // Evidence Base. Every knowledge item in the library must be traceable to a
  // reference a human can open. Records here are metadata READ OFF a publisher
  // page — never inferred. A record that cannot be verified carries
  // reviewStatus 'evidence_required' and is not citable.
  // ------------------------------------------------------------------
  evidenceSources: defineTable({
    sourceId: v.string(), // stable slug, the foreign key used by evidenceLinks
    org: v.string(),
    orgKey: v.string(),
    title: v.string(),
    authors: v.union(v.string(), v.null()),
    year: v.union(v.number(), v.null()),
    edition: v.union(v.string(), v.null()),
    country: v.union(v.string(), v.null()),
    language: v.string(),
    url: v.string(),
    doi: v.union(v.string(), v.null()),
    isbn: v.union(v.string(), v.null()),
    pmid: v.union(v.string(), v.null()),
    evidenceLevel: v.string(),
    reviewStatus: v.string(), // evidence_required | awaiting_review | in_review | approved | retired
    reviewer: v.union(v.string(), v.null()),
    // Professional qualification of the named reviewer (e.g. 'MBBS, MMedSc
    // (Paediatrics)'). Recorded alongside the name so a clinical sign-off can
    // be audited: an approval with no stated qualification is not a sign-off.
    reviewerQualification: v.optional(v.string()),
    reviewDate: v.union(v.string(), v.null()),
    nextReviewDate: v.union(v.string(), v.null()),
    reviewNote: v.optional(v.string()),
    reviewerId: v.optional(v.id('users')),
    reviewScope: v.optional(v.union(v.literal('education'), v.literal('clinical'))),
    keywords: v.array(v.string()),
    topics: v.array(v.string()),
    ageMonthsMin: v.union(v.number(), v.null()),
    ageMonthsMax: v.union(v.number(), v.null()),
    verifiedOn: v.union(v.string(), v.null()),
    verifiedNote: v.string(),
    searchText: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_source_id', ['sourceId'])
    .index('by_org', ['orgKey'])
    .index('by_review_status', ['reviewStatus'])
    .index('by_level', ['evidenceLevel']),

  // Content-to-reference edges. NO ORPHAN CONTENT: every content slug, urgent
  // safety rule and Hope Center topic must appear here with >= 1 sourceId.
  evidenceLinks: defineTable({
    kind: v.string(), // milestone | guide | activity | lesson | special_need | story | printable | safety_rule | hope_topic
    slug: v.string(),
    sourceIds: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_kind_slug', ['kind', 'slug'])
    .index('by_kind', ['kind'])
    .index('by_slug', ['slug']),

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

  milestoneResponses: defineTable({
    userId: v.id('users'),
    childId: v.id('children'),
    sessionId: v.id('milestoneSessions'),
    milestoneKey: v.string(),
    titleMm: v.optional(v.string()),
    titleEn: v.optional(v.string()),
    domain: v.string(),
    answer: v.union(
      v.literal('yes'),
      v.literal('sometimes'),
      v.literal('not_yet'),
      v.literal('not_sure'),
    ),
    note: v.optional(v.string()),
    answeredAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_child', ['childId'])
    .index('by_user_and_child', ['userId', 'childId']),

  activityCompletions: defineTable({
    userId: v.id('users'),
    childId: v.id('children'),
    contentSlug: v.string(),
    completedAt: v.number(),
    durationMinutes: v.optional(v.number()),
    note: v.optional(v.string()),
  })
    .index('by_child_and_completed_at', ['childId', 'completedAt'])
    .index('by_user_and_completed_at', ['userId', 'completedAt']),

  appointments: defineTable({
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
  })
    .index('by_user_and_appointment_at', ['userId', 'appointmentAt'])
    .index('by_child_and_appointment_at', ['childId', 'appointmentAt'])
    .index('by_reminder_at', ['reminderAt']),

  familyCaregivers: defineTable({
    ownerId: v.id('users'),
    caregiverUserId: v.optional(v.id('users')),
    caregiverEmail: v.string(),
    displayName: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('active'), v.literal('revoked')),
    invitedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index('by_owner', ['ownerId'])
    .index('by_owner_and_email', ['ownerId', 'caregiverEmail'])
    .index('by_email_and_status', ['caregiverEmail', 'status'])
    .index('by_caregiver_user', ['caregiverUserId']),
});
