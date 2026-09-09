import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import {
  OWNER_ACCOUNT_MERGE_QUARANTINE_ACTION,
  OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS,
} from './lib/ownerAccountMergePolicy';
import {
  OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE,
  OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE,
  OWNER_ACCOUNT_MERGE_V2_FINALIZE_ACTION,
  OWNER_ACCOUNT_MERGE_V2_FINALIZE_CONFIRMATION,
  OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
  OWNER_ACCOUNT_MERGE_V2_SOURCE_PROFILE_ID,
  OWNER_ACCOUNT_MERGE_V2_SOURCE_SUBSCRIPTION_ID,
  OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID,
  OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS,
  OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID,
  type FrozenSet,
} from './lib/ownerAccountMergeV2Data';

export {
  OWNER_ACCOUNT_MERGE_V2_FINALIZE_CONFIRMATION,
  OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
} from './lib/ownerAccountMergeV2Data';

const V1_FINALIZE_ACTION = 'auth.account.merge_duplicate_owner.finalize.2026_09_01_v1';
const GOOGLE_ACCOUNT_ID = 'j97asew6qe3engdk7tm6a8g6fs8bcrwx' as Id<'authAccounts'>;

const FINALIZE_BEFORE = JSON.stringify({
  releaseId: OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
  sourceProfileId: String(OWNER_ACCOUNT_MERGE_V2_SOURCE_PROFILE_ID),
  sourceSubscriptionId: String(OWNER_ACCOUNT_MERGE_V2_SOURCE_SUBSCRIPTION_ID),
  sourceChildrenDigest: OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE.sourceChildren.rowsDigest,
  sourceActivitiesDigest: OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE.sourceActivities.rowsDigest,
  sourceNotificationsDigest: OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE.sourceNotifications.rowsDigest,
});
const FINALIZE_AFTER = JSON.stringify({
  releaseId: OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
  targetChildrenDigest: OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE.targetChildren.rowsDigest,
  targetActivitiesDigest: OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE.targetActivities.rowsDigest,
  targetNotificationsDigest: OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE.targetNotifications.rowsDigest,
  sourceHistoricalActorsPreserved: true,
});

type DbCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

type ActualSet = FrozenSet;
type CoreSnapshot = Record<keyof typeof OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE, ActualSet>;

export type OwnerAccountMergeV2Preflight = {
  releaseId: typeof OWNER_ACCOUNT_MERGE_V2_RELEASE_ID;
  phase: 'finalize_ready' | 'blocked' | 'applied';
  blockers: string[];
  v1QuarantineAuditFound: boolean;
  v2FinalizeAuditFound: boolean;
  sourceAuthenticationArtifactCount: number;
  googleVerificationCodeCount: number;
  sourceUnexpectedReferenceCategories: string[];
  sourceTransferCounts: {
    profiles: number;
    subscriptions: number;
    children: number;
    activities: number;
    notifications: number;
  };
  targetReferenceSets: Array<{
    key: string;
    count: number;
    expectedCount: number;
    exact: boolean;
  }>;
};

const resultValidator = v.object({
  releaseId: v.literal(OWNER_ACCOUNT_MERGE_V2_RELEASE_ID),
  phase: v.union(v.literal('finalize_ready'), v.literal('blocked'), v.literal('applied')),
  blockers: v.array(v.string()),
  v1QuarantineAuditFound: v.boolean(),
  v2FinalizeAuditFound: v.boolean(),
  sourceAuthenticationArtifactCount: v.number(),
  googleVerificationCodeCount: v.number(),
  sourceUnexpectedReferenceCategories: v.array(v.string()),
  sourceTransferCounts: v.object({
    profiles: v.number(),
    subscriptions: v.number(),
    children: v.number(),
    activities: v.number(),
    notifications: v.number(),
  }),
  targetReferenceSets: v.array(v.object({
    key: v.string(),
    count: v.number(),
    expectedCount: v.number(),
    exact: v.boolean(),
  })),
});

function byId<T extends { _id: unknown }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

async function freezeRows(rows: Array<{ _id: unknown }>): Promise<ActualSet> {
  const sorted = byId(rows);
  return {
    count: sorted.length,
    idsDigest: await sha256Canonical(sorted.map((row) => row._id)),
    rowsDigest: await sha256Canonical(sorted),
  };
}

async function freezeAccountProjection(rows: Doc<'authAccounts'>[]): Promise<ActualSet> {
  const projected = await Promise.all(byId(rows).map(async (row) => ({
    _id: row._id,
    _creationTime: row._creationTime,
    userId: row.userId,
    provider: row.provider,
    providerAccountIdDigest: await sha256Canonical(row.providerAccountId),
    emailVerifiedDigest: typeof row.emailVerified === 'string'
      ? await sha256Canonical(row.emailVerified)
      : null,
    secretPresent: typeof row.secret === 'string' && row.secret.length > 0,
  })));
  return {
    count: projected.length,
    idsDigest: await sha256Canonical(projected.map((row) => row._id)),
    rowsDigest: await sha256Canonical(projected),
  };
}

function setMatches(actual: ActualSet, expected: FrozenSet): boolean {
  return actual.count === expected.count
    && actual.idsDigest === expected.idsDigest
    && actual.rowsDigest === expected.rowsDigest;
}

function diffCore(actual: CoreSnapshot, expected: CoreSnapshot): string[] {
  return (Object.keys(expected) as Array<keyof CoreSnapshot>)
    .filter((key) => !setMatches(actual[key], expected[key]))
    .map((key) => `${String(key)} preimage digest drifted`);
}

const DURABLE_SOURCE_POSTIMAGE_KEYS: ReadonlyArray<keyof CoreSnapshot> = [
  'sourceUser',
  'sourceProfiles',
  'sourceSubscriptions',
  'sourceChildren',
  'sourceActivities',
  'sourceNotifications',
  'sourceReviews',
  'sourceEditLogs',
  'v1QuarantineAudit',
];

function diffDurableSourcePostimage(core: CoreSnapshot): string[] {
  return DURABLE_SOURCE_POSTIMAGE_KEYS
    .filter((key) => !setMatches(core[key], OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE[key]))
    .map((key) => `${String(key)} durable postimage digest drifted`);
}

async function exactAudits(ctx: DbCtx, action: string) {
  return await ctx.db.query('auditLogs')
    .withIndex(
      'by_action_and_entity_table_and_entity_id_and_result',
      (q) => q.eq('action', action)
        .eq('entityTable', 'users')
        .eq('entityId', String(OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID))
        .eq('result', 'ok'),
    )
    .take(3);
}

async function coreSnapshot(ctx: DbCtx): Promise<CoreSnapshot> {
  const [
    sourceUser,
    targetUser,
    sourceProfiles,
    targetProfiles,
    sourceSubscriptions,
    targetSubscriptions,
    sourceChildren,
    targetChildren,
    sourceActivities,
    targetActivities,
    sourceNotifications,
    targetNotifications,
    sourceReviews,
    sourceEditLogs,
    targetAccounts,
    v1QuarantineAudits,
  ] = await Promise.all([
    ctx.db.get(OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID),
    ctx.db.get(OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID),
    ctx.db.query('parentProfiles').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(3),
    ctx.db.query('parentProfiles').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID)).take(3),
    ctx.db.query('subscriptions').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(3),
    ctx.db.query('subscriptions').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID)).take(3),
    ctx.db.query('children').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(4),
    ctx.db.query('children').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID)).take(4),
    ctx.db.query('activityCompletions').withIndex('by_user_and_completed_at', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(21),
    ctx.db.query('activityCompletions').withIndex('by_user_and_completed_at', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID)).take(21),
    ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(4),
    ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID)).take(4),
    ctx.db.query('contentReviews').withIndex('by_reviewer', (q) => q.eq('reviewerId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(28),
    ctx.db.query('contentEditLogs').withIndex('by_editor', (q) => q.eq('editorId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(13),
    ctx.db.query('authAccounts').withIndex('userIdAndProvider', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID)).take(4),
    exactAudits(ctx, OWNER_ACCOUNT_MERGE_QUARANTINE_ACTION),
  ]);

  const entries = await Promise.all([
    freezeRows(sourceUser ? [sourceUser] : []),
    freezeRows(targetUser ? [targetUser] : []),
    freezeRows(sourceProfiles),
    freezeRows(targetProfiles),
    freezeRows(sourceSubscriptions),
    freezeRows(targetSubscriptions),
    freezeRows(sourceChildren),
    freezeRows(targetChildren),
    freezeRows(sourceActivities),
    freezeRows(targetActivities),
    freezeRows(sourceNotifications),
    freezeRows(targetNotifications),
    freezeRows(sourceReviews),
    freezeRows(sourceEditLogs),
    freezeAccountProjection(targetAccounts),
    freezeRows(v1QuarantineAudits),
  ]);
  const keys = Object.keys(OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE) as Array<keyof CoreSnapshot>;
  return Object.fromEntries(keys.map((key, index) => [key, entries[index]])) as CoreSnapshot;
}

type LinkRow = { _id: unknown } & Record<string, unknown>;

async function freezeLinks(rows: LinkRow[], field: string) {
  const sorted = byId(rows);
  return {
    count: sorted.length,
    idsDigest: await sha256Canonical(sorted.map((row) => row._id)),
    linksDigest: await sha256Canonical(sorted.map((row) => ({ _id: row._id, [field]: row[field] }))),
  };
}

async function targetReferenceState(ctx: DbCtx) {
  const userId = OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID;
  const rows = await Promise.all([
    ctx.db.query('sleepRecords').withIndex('by_user', (q) => q.eq('userId', userId)).take(2),
    ctx.db.query('milestoneSessions').withIndex('by_user', (q) => q.eq('userId', userId)).take(6),
    ctx.db.query('milestoneResponses').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(60),
    ctx.db.query('observations').withIndex('by_user_and_observed_on', (q) => q.eq('userId', userId)).take(2),
    ctx.db.query('staffInvites').withIndex('by_invited_by', (q) => q.eq('invitedBy', userId)).take(9),
    ctx.db.query('contentItems').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(23),
    ctx.db.query('libraryContent').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(82),
    ctx.db.query('evidenceSources').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(87),
  ]);
  const fields = ['userId', 'userId', 'userId', 'userId', 'invitedBy', 'reviewerId', 'reviewerId', 'reviewerId'];
  return await Promise.all(rows.map((set, index) => freezeLinks(set as LinkRow[], fields[index])));
}

async function referenced(
  key: string,
  rows: Promise<Array<unknown>>,
): Promise<string | null> {
  return (await rows).length > 0 ? key : null;
}

/**
 * Every current schema reference to a user that is neither one of the three
 * explicitly transferred private-data sets nor the two intentionally
 * preserved historical-actor sets. A source hit in any category makes the
 * merge fail closed so no row is left pointing at the quarantined login.
 */
export async function sourceUnexpectedReferenceCategories(ctx: DbCtx): Promise<string[]> {
  const userId = OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID;
  const categories = await Promise.all([
    referenced('favorites.userId', ctx.db.query('favorites').withIndex('by_user', (q) => q.eq('userId', userId)).take(1)),
    referenced('growthRecords.userId', ctx.db.query('growthRecords').withIndex('by_user', (q) => q.eq('userId', userId)).take(1)),
    referenced('sleepRecords.userId', ctx.db.query('sleepRecords').withIndex('by_user', (q) => q.eq('userId', userId)).take(1)),
    referenced('healthRecords.userId', ctx.db.query('healthRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1)),
    referenced('vaccinationRecords.userId', ctx.db.query('vaccinationRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1)),
    referenced('medicationRecords.userId', ctx.db.query('medicationRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1)),
    referenced('milestoneSessions.userId', ctx.db.query('milestoneSessions').withIndex('by_user', (q) => q.eq('userId', userId)).take(1)),
    referenced('milestoneResponses.userId', ctx.db.query('milestoneResponses').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1)),
    referenced('appointments.userId', ctx.db.query('appointments').withIndex('by_user_and_appointment_at', (q) => q.eq('userId', userId)).take(1)),
    referenced('observations.userId', ctx.db.query('observations').withIndex('by_user_and_observed_on', (q) => q.eq('userId', userId)).take(1)),
    referenced('paymentRequests.userId', ctx.db.query('paymentRequests').withIndex('by_user', (q) => q.eq('userId', userId)).take(1)),
    referenced('paymentRequests.reviewedBy', ctx.db.query('paymentRequests').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(1)),
    referenced('mmpayTransactions.userId', ctx.db.query('mmpayTransactions').withIndex('by_user', (q) => q.eq('userId', userId)).take(1)),
    referenced('referralCodes.userId', ctx.db.query('referralCodes').withIndex('by_user', (q) => q.eq('userId', userId)).take(1)),
    referenced('referrals.referrerUserId', ctx.db.query('referrals').withIndex('by_referrer_user', (q) => q.eq('referrerUserId', userId)).take(1)),
    referenced('referrals.referredUserId', ctx.db.query('referrals').withIndex('by_referred_user', (q) => q.eq('referredUserId', userId)).take(1)),
    referenced('referrals.reviewedBy', ctx.db.query('referrals').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(1)),
    referenced('familyCaregivers.ownerId', ctx.db.query('familyCaregivers').withIndex('by_owner', (q) => q.eq('ownerId', userId)).take(1)),
    referenced('familyCaregivers.caregiverUserId', ctx.db.query('familyCaregivers').withIndex('by_caregiver_user', (q) => q.eq('caregiverUserId', userId)).take(1)),
    referenced('staffInvites.targetUserId', ctx.db.query('staffInvites').withIndex('by_target_user', (q) => q.eq('targetUserId', userId)).take(1)),
    referenced('staffInvites.invitedBy', ctx.db.query('staffInvites').withIndex('by_invited_by', (q) => q.eq('invitedBy', userId)).take(1)),
    referenced('staffInvites.acceptedBy', ctx.db.query('staffInvites').withIndex('by_accepted_by', (q) => q.eq('acceptedBy', userId)).take(1)),
    referenced('contentItems.reviewerId', ctx.db.query('contentItems').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1)),
    referenced('libraryContent.reviewerId', ctx.db.query('libraryContent').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1)),
    referenced('libraryContent.classificationConfirmedBy', ctx.db.query('libraryContent')
      .withIndex('by_classification_confirmed_by', (q) => q.eq('classificationConfirmedBy', userId)).take(1)),
    referenced('evidenceSources.reviewerId', ctx.db.query('evidenceSources').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1)),
    referenced('healthcareFacilities.verifiedBy', ctx.db.query('healthcareFacilities').withIndex('by_verified_by', (q) => q.eq('verifiedBy', userId)).take(1)),
    referenced('libraryMedia.reviewedBy', ctx.db.query('libraryMedia').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(1)),
    referenced('clinicalReviewBatches.reviewerId', ctx.db.query('clinicalReviewBatches').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1)),
    referenced('clinicalReviewBatchReceipts.reviewerId', ctx.db.query('clinicalReviewBatchReceipts').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1)),
  ]);
  return categories.filter((key): key is string => key !== null);
}

async function authenticationArtifactState(ctx: DbCtx) {
  const [sourceAccounts, sourceSessions, verificationCodes, oldSessionArtifacts] = await Promise.all([
    ctx.db.query('authAccounts').withIndex('userIdAndProvider', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(1),
    ctx.db.query('authSessions').withIndex('userId', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(1),
    ctx.db.query('authVerificationCodes').withIndex('accountId', (q) => q.eq('accountId', GOOGLE_ACCOUNT_ID)).take(1),
    Promise.all(OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS.map(async (session) => {
      const [tokens, verifiers] = await Promise.all([
        ctx.db.query('authRefreshTokens').withIndex('sessionId', (q) => q.eq('sessionId', session._id)).take(1),
        ctx.db.query('authVerifiers').withIndex('sessionId', (q) => q.eq('sessionId', session._id)).take(1),
      ]);
      return tokens.length + verifiers.length;
    })),
  ]);
  return {
    sourceAuthenticationArtifactCount:
      sourceAccounts.length + sourceSessions.length + oldSessionArtifacts.reduce((sum, count) => sum + count, 0),
    googleVerificationCodeCount: verificationCodes.length,
  };
}

function exactV2Audit(row: Doc<'auditLogs'> | undefined): boolean {
  return Boolean(row
    && row.actorId === undefined
    && row.summary === OWNER_ACCOUNT_MERGE_V2_RELEASE_ID
    && row.before === FINALIZE_BEFORE
    && row.after === FINALIZE_AFTER);
}

export function classifyOwnerAccountMergeV2Snapshot(args: {
  core: CoreSnapshot;
  targetReferences: Array<{ count: number; idsDigest: string; linksDigest: string }>;
  sourceUnexpectedReferenceCategories: string[];
  sourceAuthenticationArtifactCount: number;
  googleVerificationCodeCount: number;
  v1FinalizeAuditCount: number;
  v2FinalizeAuditCount: number;
  v2FinalizeAuditValid: boolean;
  strictPostflight?: boolean;
}): Pick<OwnerAccountMergeV2Preflight, 'phase' | 'blockers'> {
  const blockers: string[] = [];
  if (args.sourceUnexpectedReferenceCategories.length !== 0) {
    blockers.push(`source gained unexpected reference categories: ${args.sourceUnexpectedReferenceCategories.join(', ')}`);
  }
  if (args.sourceAuthenticationArtifactCount !== 0) blockers.push('source authentication artifacts reappeared');
  if (args.googleVerificationCodeCount !== 0) blockers.push('Google verification code is active');
  if (args.v1FinalizeAuditCount !== 0) blockers.push('v1 finalize audit already exists');
  if (args.v2FinalizeAuditCount > 1) blockers.push('duplicate v2 finalize audits found');
  if (args.v2FinalizeAuditCount === 1 && !args.v2FinalizeAuditValid) blockers.push('v2 finalize audit payload drifted');

  if (args.v2FinalizeAuditCount === 1 && args.v2FinalizeAuditValid) {
    const postimageDiff = args.strictPostflight
      ? diffCore(args.core, OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE)
      : diffDurableSourcePostimage(args.core);
    if (postimageDiff.length === 0 && blockers.length === 0) {
      return { phase: 'applied', blockers: [] };
    }
    blockers.push(...postimageDiff);
    return { phase: 'blocked', blockers: [...new Set(blockers)].sort() };
  }

  OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS.forEach((expected, index) => {
    const actual = args.targetReferences[index];
    if (!actual
      || actual.count !== expected.count
      || actual.idsDigest !== expected.idsDigest
      || actual.linksDigest !== expected.linksDigest) {
      blockers.push(`${expected.key} reference set drifted`);
    }
  });
  const preimageDiff = diffCore(args.core, OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE);
  if (args.v2FinalizeAuditCount === 0 && preimageDiff.length === 0 && blockers.length === 0) {
    return { phase: 'finalize_ready', blockers: [] };
  }
  blockers.push(...preimageDiff);
  return { phase: 'blocked', blockers: [...new Set(blockers)].sort() };
}

async function preflightState(
  ctx: DbCtx,
  strictPostflight = false,
): Promise<OwnerAccountMergeV2Preflight> {
  const [core, targetReferences, sourceReferences, auth, v1FinalizeAudits, v2FinalizeAudits] = await Promise.all([
    coreSnapshot(ctx),
    targetReferenceState(ctx),
    sourceUnexpectedReferenceCategories(ctx),
    authenticationArtifactState(ctx),
    exactAudits(ctx, V1_FINALIZE_ACTION),
    exactAudits(ctx, OWNER_ACCOUNT_MERGE_V2_FINALIZE_ACTION),
  ]);
  const classified = classifyOwnerAccountMergeV2Snapshot({
    core,
    targetReferences,
    sourceUnexpectedReferenceCategories: sourceReferences,
    sourceAuthenticationArtifactCount: auth.sourceAuthenticationArtifactCount,
    googleVerificationCodeCount: auth.googleVerificationCodeCount,
    v1FinalizeAuditCount: v1FinalizeAudits.length,
    v2FinalizeAuditCount: v2FinalizeAudits.length,
    v2FinalizeAuditValid: exactV2Audit(v2FinalizeAudits[0]),
    strictPostflight,
  });
  return {
    releaseId: OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
    ...classified,
    v1QuarantineAuditFound: setMatches(core.v1QuarantineAudit, OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE.v1QuarantineAudit),
    v2FinalizeAuditFound: v2FinalizeAudits.length === 1,
    ...auth,
    sourceUnexpectedReferenceCategories: sourceReferences,
    sourceTransferCounts: {
      profiles: core.sourceProfiles.count,
      subscriptions: core.sourceSubscriptions.count,
      children: core.sourceChildren.count,
      activities: core.sourceActivities.count,
      notifications: core.sourceNotifications.count,
    },
    targetReferenceSets: targetReferences.map((actual, index) => {
      const expected = OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS[index];
      return {
        key: expected.key,
        count: actual.count,
        expectedCount: expected.count,
        exact: actual.count === expected.count
          && actual.idsDigest === expected.idsDigest
          && actual.linksDigest === expected.linksDigest,
      };
    }),
  };
}

/** Read-only exact preflight for the immutable v2 successor. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(OWNER_ACCOUNT_MERGE_V2_RELEASE_ID) },
  returns: resultValidator,
  handler: async (ctx) => preflightState(ctx),
});

type ReadState = (ctx: DbCtx) => Promise<OwnerAccountMergeV2Preflight>;

export async function executeOwnerAccountMergeV2(
  ctx: MutationCtx,
  readState: ReadState = preflightState,
  readStrictPostflight: ReadState = (context) => preflightState(context, true),
): Promise<OwnerAccountMergeV2Preflight> {
  const before = await readState(ctx);
  if (before.phase === 'applied') return before;
  if (before.phase !== 'finalize_ready') {
    throw new Error(`Owner account v2 finalize blocked: ${before.blockers.join('; ')}`);
  }

  const [children, activities, notifications] = await Promise.all([
    ctx.db.query('children').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(2),
    ctx.db.query('activityCompletions').withIndex('by_user_and_completed_at', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(17),
    ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID)).take(2),
  ]);
  for (const child of children) await ctx.db.patch(child._id, { userId: OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID });
  for (const activity of activities) await ctx.db.patch(activity._id, { userId: OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID });
  for (const notification of notifications) await ctx.db.patch(notification._id, { userId: OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID });
  await ctx.db.delete(OWNER_ACCOUNT_MERGE_V2_SOURCE_SUBSCRIPTION_ID);
  await ctx.db.delete(OWNER_ACCOUNT_MERGE_V2_SOURCE_PROFILE_ID);
  await logAudit(
    ctx,
    null,
    OWNER_ACCOUNT_MERGE_V2_FINALIZE_ACTION,
    'users',
    String(OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID),
    OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
    { result: 'ok', before: FINALIZE_BEFORE, after: FINALIZE_AFTER },
  );

  const after = await readStrictPostflight(ctx);
  if (after.phase !== 'applied') {
    throw new Error(`Owner account v2 finalize postflight failed: ${after.blockers.join('; ')}`);
  }
  return after;
}

/** Atomically moves only the frozen source rows; no production call is made by this change. */
export const apply = internalMutation({
  args: {
    releaseId: v.literal(OWNER_ACCOUNT_MERGE_V2_RELEASE_ID),
    confirmation: v.literal(OWNER_ACCOUNT_MERGE_V2_FINALIZE_CONFIRMATION),
  },
  returns: resultValidator,
  handler: async (ctx) => executeOwnerAccountMergeV2(ctx),
});
