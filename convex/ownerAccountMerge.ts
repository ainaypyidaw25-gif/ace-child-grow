import { v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import {
  OWNER_ACCOUNT_MERGE_QUARANTINE_ACTION,
  OWNER_ACCOUNT_MERGE_RELEASE_ID,
  OWNER_ACCOUNT_MERGE_SOURCE_USER_ID,
} from './lib/ownerAccountMergePolicy';

/**
 * Exact, two-phase consolidation of the two Production Convex Auth users for
 * lapyaewun2690@gmail.com observed on 2026-09-01.
 *
 * Phase 1 moves the Google provider to the qualified password owner and
 * revokes every source session credential. Phase 2 waits longer than Convex
 * Auth's one-hour access-JWT lifetime before moving private parent data and
 * deleting the duplicate live profile/subscription. Immutable review, edit,
 * and audit rows retain the source user id as their historical actor.
 */

export { OWNER_ACCOUNT_MERGE_RELEASE_ID } from './lib/ownerAccountMergePolicy';
export const OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION =
  'confirm-owner-account-quarantine-lapyaewun2690-2026-09-01-v1' as const;
export const OWNER_ACCOUNT_MERGE_FINALIZE_CONFIRMATION =
  'confirm-owner-account-finalize-lapyaewun2690-2026-09-01-v1' as const;

const EMAIL = 'lapyaewun2690@gmail.com';
const QUALIFICATION = 'MEd (Early Childhood and Special Education)';
const ACCESS_TOKEN_DRAIN_MS = 65 * 60 * 1_000;
const QUARANTINE_ACTION = OWNER_ACCOUNT_MERGE_QUARANTINE_ACTION;
const FINALIZE_ACTION = 'auth.account.merge_duplicate_owner.finalize.2026_09_01_v1';

const SOURCE_USER_ID = OWNER_ACCOUNT_MERGE_SOURCE_USER_ID;
const TARGET_USER_ID = 'mn79pqcdy108y85stdxvtvqcz18b8w9c' as Id<'users'>;
const SOURCE_PROFILE_ID = 'md7ab5dgsg9h6ew6ah2n39f7v98bds46' as Id<'parentProfiles'>;
const TARGET_PROFILE_ID = 'md7bqb9vjxytefqsdfd8p19cwd8b8vq8' as Id<'parentProfiles'>;
const SOURCE_SUBSCRIPTION_ID = 'mx72fnnqyd0q125shqxv4vvebh8bc1xa' as Id<'subscriptions'>;
const TARGET_SUBSCRIPTION_ID = 'mx75qt1n1e8dv5y7wr1f5xm5sh8b8t2h' as Id<'subscriptions'>;
const GOOGLE_ACCOUNT_ID = 'j97asew6qe3engdk7tm6a8g6fs8bcrwx' as Id<'authAccounts'>;
const PASSWORD_ACCOUNT_ID = 'j97fwc6mr1gj8evmatwnzbkrah8b9gm3' as Id<'authAccounts'>;
const SOURCE_CHILD_ID = 'k177zh32zak9da9jrsf3y7dh718bc2vx' as Id<'children'>;

const SOURCE_EMAIL_VERIFIED_AT = 1788167129007;
const TARGET_EMAIL_VERIFIED_AT = 1787753791940;
const SOURCE_PROFILE_CONSENT_AT = 1785227040807;
const TARGET_PROFILE_CONSENT_AT = 1785027628992;
const SOURCE_SUBSCRIPTION_CREATED_AT = 1785226992721;
const TARGET_SUBSCRIPTION_CREATED_AT = 1785046558245;
const SOURCE_NAME = 'Lapyae Wun';
const SOURCE_IMAGE = 'https://lh3.googleusercontent.com/a/ACg8ocJwP6KQ1LPgG1d1FM93hgHxwf3xK5aQa8_qPGxinSwScdcw9g=s96-c';

const ACTIVE_DATA_DIGESTS = {
  sourceChildren: 'b330d52f5e1003e776c96ba6e394d558fefd18f274377eb77927854dc96fc1b5',
  targetChildren: '2cc6123bb70a12205d2f7a8f339cc800f87cb25236ed8a9f37ab1439d1abf0c5',
  sourceActivityCompletions: 'faf9467837af122bea60e074d124553f1787670e9b0421316053b95254a9989d',
  targetActivityCompletions: '626ef5184bdce6c59cbfd767a5174af8908839c7e76c8519008a40439c79e5bf',
  sourceNotifications: '3c41f8d4bea914461ffa5ee135b0e6373c79cf3e9ddc6af0aa50fe420444bfaa',
  targetNotifications: '29dd3167c785c7e1874fa49e2ff4d5c097a7ecb441771ee983220bb1237f9fc5',
  mergedChildren: 'f74dd989baa127a92a2f00aab0bb730d3d1db4dc64489ec38e2626623b086bdf',
  mergedActivityCompletions: 'c46d367ae6c485b29898ea2f9aea87b609bf53ac78559abd385fe67cb1af34bf',
  mergedNotifications: '6976986344fc48089990f6f0e1b20e651d4d8350634b7702e57bbc22536e3ef6',
} as const;

const quarantineBefore = JSON.stringify({
  sourceUserId: SOURCE_USER_ID,
  targetUserId: TARGET_USER_ID,
  googleAccountId: GOOGLE_ACCOUNT_ID,
  sourceName: SOURCE_NAME,
  sourceImage: SOURCE_IMAGE,
  sourceSessionCount: 16,
  sourceRefreshTokenCount: 120,
  sourceVerifierCount: 1,
  googleVerificationCodeCount: 0,
});
const quarantineAfter = JSON.stringify({
  canonicalUserId: TARGET_USER_ID,
  providers: ['google', 'password'],
  sourceIdentityTombstoned: true,
  minimumAccessTokenDrainMs: ACCESS_TOKEN_DRAIN_MS,
});
const finalizeBefore = JSON.stringify({
  sourceUserId: SOURCE_USER_ID,
  targetUserId: TARGET_USER_ID,
  sourceProfileId: SOURCE_PROFILE_ID,
  sourceSubscriptionId: SOURCE_SUBSCRIPTION_ID,
  sourceChildCount: 1,
  sourceActivityCompletionCount: 16,
  sourceNotificationCount: 1,
  preservedHistoricalReviewCount: 26,
  preservedHistoricalEditLogCount: 11,
});
const finalizeAfter = JSON.stringify({
  canonicalUserId: TARGET_USER_ID,
  canonicalProfileId: TARGET_PROFILE_ID,
  providers: ['google', 'password'],
  qualification: QUALIFICATION,
  sourceUserRetainedOnlyAsHistoricalActor: true,
});

const phaseValidator = v.union(
  v.literal('quarantine_ready'),
  v.literal('quarantined_waiting'),
  v.literal('finalize_ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const identityStateValidator = v.object({
  profileCount: v.number(),
  subscriptionCount: v.number(),
  authAccountCount: v.number(),
  sessionCount: v.number(),
  refreshTokenCount: v.number(),
  verifierCount: v.number(),
  childCount: v.number(),
  activityCompletionCount: v.number(),
  notificationCount: v.number(),
  historicalReviewCount: v.number(),
  historicalEditLogCount: v.number(),
  unexpectedOwnedCount: v.number(),
});

const preflightValidator = v.object({
  releaseId: v.literal(OWNER_ACCOUNT_MERGE_RELEASE_ID),
  phase: phaseValidator,
  blockers: v.array(v.string()),
  quarantineAuditFound: v.boolean(),
  finalizeAuditFound: v.boolean(),
  quarantineAt: v.union(v.number(), v.null()),
  finalizeAfter: v.union(v.number(), v.null()),
  googleAccountUserId: v.union(v.string(), v.null()),
  passwordAccountUserId: v.union(v.string(), v.null()),
  googleVerificationCodeCount: v.number(),
  source: identityStateValidator,
  target: identityStateValidator,
});

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

async function boundedRows<T>(promise: Promise<T[]>, limit: number, label: string): Promise<T[]> {
  const rows = await promise;
  if (rows.length > limit) throw new Error(`${label} exceeds safety bound ${limit}`);
  return rows;
}

async function sessionArtifacts(
  ctx: DatabaseContext,
  sessions: Array<{ _id: Id<'authSessions'> }>,
) {
  const groups = await Promise.all(sessions.map(async (session) => {
    const [refreshTokens, verifiers] = await Promise.all([
      boundedRows(
        ctx.db.query('authRefreshTokens')
          .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
          .take(101),
        100,
        `refresh tokens for ${String(session._id)}`,
      ),
      boundedRows(
        ctx.db.query('authVerifiers')
          .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
          .take(21),
        20,
        `auth verifiers for ${String(session._id)}`,
      ),
    ]);
    return { refreshTokens, verifiers };
  }));
  return {
    refreshTokens: groups.flatMap((group) => group.refreshTokens),
    verifiers: groups.flatMap((group) => group.verifiers),
  };
}

async function userState(ctx: DatabaseContext, userId: Id<'users'>) {
  const [
    profiles,
    subscriptions,
    accounts,
    sessions,
    children,
    activityCompletions,
    notifications,
    historicalReviews,
    historicalEditLogs,
  ] = await Promise.all([
    ctx.db.query('parentProfiles').withIndex('by_user', (q) => q.eq('userId', userId)).take(3),
    ctx.db.query('subscriptions').withIndex('by_user', (q) => q.eq('userId', userId)).take(3),
    ctx.db.query('authAccounts').withIndex('userIdAndProvider', (q) => q.eq('userId', userId)).take(5),
    boundedRows(
      ctx.db.query('authSessions').withIndex('userId', (q) => q.eq('userId', userId)).take(101),
      100,
      `sessions for ${String(userId)}`,
    ),
    ctx.db.query('children').withIndex('by_user', (q) => q.eq('userId', userId)).take(11),
    boundedRows(
      ctx.db.query('activityCompletions')
        .withIndex('by_user_and_completed_at', (q) => q.eq('userId', userId))
        .take(101),
      100,
      `activity completions for ${String(userId)}`,
    ),
    boundedRows(
      ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', userId)).take(101),
      100,
      `notifications for ${String(userId)}`,
    ),
    boundedRows(
      ctx.db.query('contentReviews').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(501),
      500,
      `review history for ${String(userId)}`,
    ),
    boundedRows(
      ctx.db.query('contentEditLogs').withIndex('by_editor', (q) => q.eq('editorId', userId)).take(201),
      200,
      `edit history for ${String(userId)}`,
    ),
  ]);
  const artifacts = await sessionArtifacts(ctx, sessions);
  return {
    profiles,
    subscriptions,
    accounts,
    sessions,
    children,
    activityCompletions,
    notifications,
    historicalReviews,
    historicalEditLogs,
    ...artifacts,
  };
}

async function unexpectedOwnedReferences(ctx: DatabaseContext, userId: Id<'users'>) {
  const checks = await Promise.all([
    ctx.db.query('favorites').withIndex('by_user', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('growthRecords').withIndex('by_user', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('sleepRecords').withIndex('by_user', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('healthRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('vaccinationRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('medicationRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('milestoneSessions').withIndex('by_user', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('milestoneResponses').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('appointments').withIndex('by_user_and_appointment_at', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('observations').withIndex('by_user_and_observed_on', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('paymentRequests').withIndex('by_user', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('paymentRequests').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(1),
    ctx.db.query('mmpayTransactions').withIndex('by_user', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('referralCodes').withIndex('by_user', (q) => q.eq('userId', userId)).take(1),
    ctx.db.query('referrals').withIndex('by_referrer_user', (q) => q.eq('referrerUserId', userId)).take(1),
    ctx.db.query('referrals').withIndex('by_referred_user', (q) => q.eq('referredUserId', userId)).take(1),
    ctx.db.query('referrals').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(1),
    ctx.db.query('familyCaregivers').withIndex('by_owner', (q) => q.eq('ownerId', userId)).take(1),
    ctx.db.query('familyCaregivers').withIndex('by_caregiver_user', (q) => q.eq('caregiverUserId', userId)).take(1),
    ctx.db.query('staffInvites').withIndex('by_target_user', (q) => q.eq('targetUserId', userId)).take(1),
    ctx.db.query('staffInvites').withIndex('by_invited_by', (q) => q.eq('invitedBy', userId)).take(1),
    ctx.db.query('staffInvites').withIndex('by_accepted_by', (q) => q.eq('acceptedBy', userId)).take(1),
    ctx.db.query('contentItems').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1),
    ctx.db.query('libraryContent').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1),
    ctx.db.query('libraryContent')
      .withIndex('by_classification_confirmed_by', (q) => q.eq('classificationConfirmedBy', userId))
      .take(1),
    ctx.db.query('evidenceSources').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1),
    ctx.db.query('healthcareFacilities').withIndex('by_verified_by', (q) => q.eq('verifiedBy', userId)).take(1),
    ctx.db.query('libraryMedia').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(1),
    ctx.db.query('clinicalReviewBatches').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1),
    ctx.db.query('clinicalReviewBatchReceipts').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(1),
  ]);
  return checks.reduce((total, rows) => total + rows.length, 0);
}

function publicIdentityState(
  state: Awaited<ReturnType<typeof userState>>,
  unexpectedOwnedCount: number,
) {
  return {
    profileCount: state.profiles.length,
    subscriptionCount: state.subscriptions.length,
    authAccountCount: state.accounts.length,
    sessionCount: state.sessions.length,
    refreshTokenCount: state.refreshTokens.length,
    verifierCount: state.verifiers.length,
    childCount: state.children.length,
    activityCompletionCount: state.activityCompletions.length,
    notificationCount: state.notifications.length,
    historicalReviewCount: state.historicalReviews.length,
    historicalEditLogCount: state.historicalEditLogs.length,
    unexpectedOwnedCount,
  };
}

async function exactReleaseAudits(ctx: DatabaseContext, action: string) {
  return await ctx.db.query('auditLogs')
    .withIndex(
      'by_action_and_entity_table_and_entity_id_and_result',
      (q) => q.eq('action', action)
        .eq('entityTable', 'users')
        .eq('entityId', String(SOURCE_USER_ID))
        .eq('result', 'ok'),
    )
    .take(3);
}

function byId<T extends { _id: unknown }>(rows: T[]) {
  return [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

function exactProviderlessFreeSubscription(
  row: Awaited<ReturnType<typeof userState>>['subscriptions'][number] | null,
  expectedId: Id<'subscriptions'>,
  expectedUserId: Id<'users'>,
  expectedCreatedAt: number,
) {
  return Boolean(
    row
      && row._id === expectedId
      && row.userId === expectedUserId
      && row.planKey === 'free'
      && row.status === 'active'
      && row.createdAt === expectedCreatedAt
      && row.updatedAt === expectedCreatedAt
      && row.provider === undefined
      && row.providerCustomerId === undefined
      && row.providerSubscriptionId === undefined
      && row.currentPeriodEnd === undefined
      && row.cancelAtPeriodEnd === undefined
      && row.trialStartedAt === undefined
      && row.trialUsedAt === undefined,
  );
}

function sourceTombstoned(user: Doc<'users'> | null) {
  return Boolean(
    user
      && user.email === undefined
      && user.emailVerificationTime === undefined
      && user.name === undefined
      && user.image === undefined
      && user.phone === undefined
      && user.phoneVerificationTime === undefined,
  );
}

async function preflightState(ctx: DatabaseContext) {
  const [
    sourceUser,
    targetUser,
    source,
    target,
    sourceUnexpected,
    targetUnexpected,
    quarantineAudits,
    finalizeAudits,
    googleVerificationCodes,
  ] = await Promise.all([
    ctx.db.get(SOURCE_USER_ID),
    ctx.db.get(TARGET_USER_ID),
    userState(ctx, SOURCE_USER_ID),
    userState(ctx, TARGET_USER_ID),
    unexpectedOwnedReferences(ctx, SOURCE_USER_ID),
    unexpectedOwnedReferences(ctx, TARGET_USER_ID),
    exactReleaseAudits(ctx, QUARANTINE_ACTION),
    exactReleaseAudits(ctx, FINALIZE_ACTION),
    boundedRows(
      ctx.db.query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', GOOGLE_ACCOUNT_ID))
        .take(21),
      20,
      'Google verification codes',
    ),
  ]);

  const sourceProfile = source.profiles[0] ?? null;
  const targetProfile = target.profiles[0] ?? null;
  const sourceSubscription = source.subscriptions[0] ?? null;
  const targetSubscription = target.subscriptions[0] ?? null;
  const googleAccount = [...source.accounts, ...target.accounts]
    .find((row) => row._id === GOOGLE_ACCOUNT_ID) ?? null;
  const passwordAccount = [...source.accounts, ...target.accounts]
    .find((row) => row._id === PASSWORD_ACCOUNT_ID) ?? null;
  const quarantineAudit = quarantineAudits[0] ?? null;
  const finalizeAudit = finalizeAudits[0] ?? null;
  const quarantineAt = quarantineAudit?._creationTime ?? null;
  const drainEndsAt = quarantineAt === null ? null : quarantineAt + ACCESS_TOKEN_DRAIN_MS;
  const [
    sourceChildrenDigest,
    targetChildrenDigest,
    sourceActivityCompletionsDigest,
    targetActivityCompletionsDigest,
    sourceNotificationsDigest,
    targetNotificationsDigest,
  ] = await Promise.all([
    sha256Canonical(byId(source.children)),
    sha256Canonical(byId(target.children)),
    sha256Canonical(byId(source.activityCompletions)),
    sha256Canonical(byId(target.activityCompletions)),
    sha256Canonical(byId(source.notifications)),
    sha256Canonical(byId(target.notifications)),
  ]);

  const blockers: string[] = [];
  if (!sourceUser) blockers.push('source user document is missing');
  if (!targetUser
    || targetUser.email !== EMAIL
    || targetUser.emailVerificationTime !== TARGET_EMAIL_VERIFIED_AT
    || targetUser.phone !== undefined
    || targetUser.phoneVerificationTime !== undefined
    || (quarantineAudit
      ? targetUser.name !== SOURCE_NAME || targetUser.image !== SOURCE_IMAGE
      : targetUser.name !== undefined || targetUser.image !== undefined)) {
    blockers.push('canonical target user preimage drifted');
  }
  if (!targetProfile
    || target.profiles.length !== 1
    || targetProfile._id !== TARGET_PROFILE_ID
    || targetProfile.displayName !== 'Daw La Pyae Wun'
    || targetProfile.isStaff !== true
    || targetProfile.staffRole !== 'owner'
    || targetProfile.staffQualification !== QUALIFICATION
    || targetProfile.parentTourCompletedVersion !== 1
    || targetProfile.staffTourCompletedVersion !== 1) {
    blockers.push('qualified target owner profile preimage drifted');
  }
  if (sourceUnexpected !== 0) blockers.push(`source has ${sourceUnexpected} unexpected live reference categories`);
  if (source.historicalReviews.length !== 26) blockers.push('source review-history count drifted');
  if (source.historicalEditLogs.length !== 11) blockers.push('source edit-history count drifted');
  if (quarantineAudits.length > 1) blockers.push('duplicate quarantine audit rows found');
  if (finalizeAudits.length > 1) blockers.push('duplicate finalize audit rows found');
  if (finalizeAudit && !quarantineAudit) blockers.push('finalize audit exists without quarantine audit');
  if (quarantineAudit && (
    quarantineAudit.actorId !== undefined
      || quarantineAudit.summary !== OWNER_ACCOUNT_MERGE_RELEASE_ID
      || quarantineAudit.before !== quarantineBefore
      || quarantineAudit.after !== quarantineAfter
  )) blockers.push('quarantine audit payload drifted');
  if (finalizeAudit && (
    finalizeAudit.actorId !== undefined
      || finalizeAudit.summary !== OWNER_ACCOUNT_MERGE_RELEASE_ID
      || finalizeAudit.before !== finalizeBefore
      || finalizeAudit.after !== finalizeAfter
  )) blockers.push('finalize audit payload drifted');

  const sourceProfileMatches = Boolean(
    sourceProfile
      && source.profiles.length === 1
      && sourceProfile._id === SOURCE_PROFILE_ID
      && sourceProfile.userId === SOURCE_USER_ID
      && sourceProfile.displayName === 'ဒေါ်လပြည့်၀န်း'
      && sourceProfile.preferredLocale === 'mm'
      && sourceProfile.consentAcceptedAt === SOURCE_PROFILE_CONSENT_AT
      && sourceProfile.privacyNoticeVersion === undefined
      && sourceProfile.isStaff === true
      && sourceProfile.staffRole === 'owner'
      && sourceProfile.staffQualification === undefined
      && sourceProfile.parentTourCompletedVersion === 1
      && sourceProfile.staffTourCompletedVersion === 1,
  );
  const targetProfilePreimageMatches = Boolean(
    targetProfile
      && targetProfile.preferredLocale === 'en'
      && targetProfile.consentAcceptedAt === TARGET_PROFILE_CONSENT_AT
      && targetProfile.privacyNoticeVersion === undefined,
  );
  const targetProfilePostimageMatches = Boolean(
    targetProfile
      && targetProfile.preferredLocale === 'mm'
      && targetProfile.consentAcceptedAt === TARGET_PROFILE_CONSENT_AT
      && targetProfile.privacyNoticeVersion === undefined,
  );
  const subscriptionsMatch = Boolean(
    source.subscriptions.length === 1
      && exactProviderlessFreeSubscription(
        sourceSubscription,
        SOURCE_SUBSCRIPTION_ID,
        SOURCE_USER_ID,
        SOURCE_SUBSCRIPTION_CREATED_AT,
      )
      && target.subscriptions.length === 1
      && exactProviderlessFreeSubscription(
        targetSubscription,
        TARGET_SUBSCRIPTION_ID,
        TARGET_USER_ID,
        TARGET_SUBSCRIPTION_CREATED_AT,
      ),
  );
  const activeDataPreimageMatches = Boolean(
    sourceProfileMatches
      && targetProfilePreimageMatches
      && subscriptionsMatch
      && source.children.length === 1
      && source.children[0]._id === SOURCE_CHILD_ID
      && source.children[0].nickname === 'La Pyae'
      && source.children[0].deletedAt === undefined
      && target.children.length === 2
      && source.activityCompletions.length === 16
      && source.activityCompletions.every((row) => row.childId === SOURCE_CHILD_ID)
      && target.activityCompletions.length === 3
      && source.notifications.length === 1
      && target.notifications.length === 1
      && sourceChildrenDigest === ACTIVE_DATA_DIGESTS.sourceChildren
      && targetChildrenDigest === ACTIVE_DATA_DIGESTS.targetChildren
      && sourceActivityCompletionsDigest === ACTIVE_DATA_DIGESTS.sourceActivityCompletions
      && targetActivityCompletionsDigest === ACTIVE_DATA_DIGESTS.targetActivityCompletions
      && sourceNotificationsDigest === ACTIVE_DATA_DIGESTS.sourceNotifications
      && targetNotificationsDigest === ACTIVE_DATA_DIGESTS.targetNotifications
      && sourceUnexpected === 0,
  );
  const initialMatches = Boolean(
    !quarantineAudit
      && !finalizeAudit
      && sourceUser
      && sourceUser.email === EMAIL
      && sourceUser.emailVerificationTime === SOURCE_EMAIL_VERIFIED_AT
      && sourceUser.name === SOURCE_NAME
      && sourceUser.image === SOURCE_IMAGE
      && sourceUser.phone === undefined
      && sourceUser.phoneVerificationTime === undefined
      && source.accounts.length === 1
      && source.accounts[0]._id === GOOGLE_ACCOUNT_ID
      && source.accounts[0].provider === 'google'
      && source.accounts[0].providerAccountId === '105107425159252909867'
      && target.accounts.length === 1
      && target.accounts[0]._id === PASSWORD_ACCOUNT_ID
      && target.accounts[0].provider === 'password'
      && target.accounts[0].providerAccountId === EMAIL
      && target.accounts[0].emailVerified === EMAIL
      && typeof target.accounts[0].secret === 'string'
      && target.accounts[0].secret.length > 0
      && source.sessions.length === 16
      && source.refreshTokens.length === 120
      && source.verifiers.length === 1
      && googleVerificationCodes.length === 0
      && activeDataPreimageMatches,
  );
  const quarantineMatches = Boolean(
    quarantineAudit
      && !finalizeAudit
      && sourceTombstoned(sourceUser)
      && source.accounts.length === 0
      && source.sessions.length === 0
      && source.refreshTokens.length === 0
      && source.verifiers.length === 0
      && googleVerificationCodes.length === 0
      && target.accounts.length === 2
      && googleAccount?.userId === TARGET_USER_ID
      && passwordAccount?.userId === TARGET_USER_ID
      && activeDataPreimageMatches,
  );
  const appliedMatches = Boolean(
    quarantineAudit
      && finalizeAudit
      && sourceTombstoned(sourceUser)
      && source.profiles.length === 0
      && source.subscriptions.length === 0
      && source.accounts.length === 0
      && source.sessions.length === 0
      && source.refreshTokens.length === 0
      && source.verifiers.length === 0
      && source.children.length === 0
      && source.activityCompletions.length === 0
      && source.notifications.length === 0
      && sourceUnexpected === 0
      && targetProfilePostimageMatches
      && target.subscriptions.length === 1
      && exactProviderlessFreeSubscription(
        targetSubscription,
        TARGET_SUBSCRIPTION_ID,
        TARGET_USER_ID,
        TARGET_SUBSCRIPTION_CREATED_AT,
      )
      && target.accounts.length === 2
      && googleAccount?.userId === TARGET_USER_ID
      && passwordAccount?.userId === TARGET_USER_ID
      && target.children.length === 3
      && target.children.some((row) => row._id === SOURCE_CHILD_ID)
      && target.activityCompletions.length === 19
      && target.notifications.length === 2
      && targetChildrenDigest === ACTIVE_DATA_DIGESTS.mergedChildren
      && targetActivityCompletionsDigest === ACTIVE_DATA_DIGESTS.mergedActivityCompletions
      && targetNotificationsDigest === ACTIVE_DATA_DIGESTS.mergedNotifications,
  );

  let phase: 'quarantine_ready' | 'quarantined_waiting' | 'finalize_ready' | 'blocked' | 'applied' = 'blocked';
  if (appliedMatches && blockers.length === 0) phase = 'applied';
  else if (quarantineMatches && blockers.length === 0) {
    phase = drainEndsAt !== null && Date.now() >= drainEndsAt
      ? 'finalize_ready'
      : 'quarantined_waiting';
  } else if (initialMatches && blockers.length === 0) phase = 'quarantine_ready';
  else {
    if (finalizeAudit && !appliedMatches) blockers.push('finalize audit exists but postimage drifted');
    else if (quarantineAudit && !quarantineMatches) blockers.push('quarantine postimage or final preimage drifted');
    else if (!quarantineAudit && !initialMatches) blockers.push('exact initial preimage drifted');
  }

  return {
    releaseId: OWNER_ACCOUNT_MERGE_RELEASE_ID,
    phase,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    quarantineAuditFound: quarantineAudit !== null,
    finalizeAuditFound: finalizeAudit !== null,
    quarantineAt,
    finalizeAfter: drainEndsAt,
    googleAccountUserId: googleAccount ? String(googleAccount.userId) : null,
    passwordAccountUserId: passwordAccount ? String(passwordAccount.userId) : null,
    googleVerificationCodeCount: googleVerificationCodes.length,
    source: publicIdentityState(source, sourceUnexpected),
    target: publicIdentityState(target, targetUnexpected),
  };
}

/** Read-only, exact-state preflight for both phases. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(OWNER_ACCOUNT_MERGE_RELEASE_ID) },
  returns: preflightValidator,
  handler: async (ctx) => preflightState(ctx),
});

/**
 * Phase 1: link Google to the canonical owner, clear the duplicate login
 * identity, and revoke all source session credentials. Active parent rows are
 * deliberately left untouched until old one-hour access JWTs have expired.
 */
export const quarantine = internalMutation({
  args: {
    releaseId: v.literal(OWNER_ACCOUNT_MERGE_RELEASE_ID),
    confirmation: v.literal(OWNER_ACCOUNT_MERGE_QUARANTINE_CONFIRMATION),
  },
  returns: preflightValidator,
  handler: async (ctx) => {
    const before = await preflightState(ctx);
    if (before.phase === 'quarantined_waiting' || before.phase === 'finalize_ready' || before.phase === 'applied') {
      return before;
    }
    if (before.phase !== 'quarantine_ready') {
      throw new Error(`Owner account quarantine blocked: ${before.blockers.join('; ')}`);
    }

    const source = await userState(ctx, SOURCE_USER_ID);
    const verificationCodes = await boundedRows(
      ctx.db.query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', GOOGLE_ACCOUNT_ID))
        .take(21),
      20,
      'Google verification codes',
    );
    await ctx.db.patch(GOOGLE_ACCOUNT_ID, { userId: TARGET_USER_ID });
    await ctx.db.patch(TARGET_USER_ID, { name: SOURCE_NAME, image: SOURCE_IMAGE });
    await ctx.db.patch(SOURCE_USER_ID, {
      name: undefined,
      image: undefined,
      email: undefined,
      emailVerificationTime: undefined,
      phone: undefined,
      phoneVerificationTime: undefined,
    });
    for (const code of verificationCodes) await ctx.db.delete(code._id);
    for (const token of source.refreshTokens) await ctx.db.delete(token._id);
    for (const verifier of source.verifiers) await ctx.db.delete(verifier._id);
    for (const session of source.sessions) await ctx.db.delete(session._id);

    await logAudit(
      ctx,
      null,
      QUARANTINE_ACTION,
      'users',
      String(SOURCE_USER_ID),
      OWNER_ACCOUNT_MERGE_RELEASE_ID,
      { result: 'ok', before: quarantineBefore, after: quarantineAfter },
    );
    const after = await preflightState(ctx);
    if (after.phase !== 'quarantined_waiting' && after.phase !== 'finalize_ready') {
      throw new Error(`Owner account quarantine postflight failed: ${after.blockers.join('; ')}`);
    }
    return after;
  },
});

/**
 * Phase 2: after the access-token drain, atomically move the exact private rows
 * and remove only the frozen duplicate profile and providerless free plan.
 */
export const apply = internalMutation({
  args: {
    releaseId: v.literal(OWNER_ACCOUNT_MERGE_RELEASE_ID),
    confirmation: v.literal(OWNER_ACCOUNT_MERGE_FINALIZE_CONFIRMATION),
  },
  returns: preflightValidator,
  handler: async (ctx) => {
    const before = await preflightState(ctx);
    if (before.phase === 'applied') return before;
    if (before.phase !== 'finalize_ready') {
      throw new Error(`Owner account finalize blocked: ${before.blockers.join('; ')}`);
    }

    const source = await userState(ctx, SOURCE_USER_ID);
    for (const child of source.children) await ctx.db.patch(child._id, { userId: TARGET_USER_ID });
    for (const completion of source.activityCompletions) {
      await ctx.db.patch(completion._id, { userId: TARGET_USER_ID });
    }
    for (const notification of source.notifications) {
      await ctx.db.patch(notification._id, { userId: TARGET_USER_ID });
    }
    await ctx.db.patch(TARGET_PROFILE_ID, { preferredLocale: 'mm' });
    await ctx.db.delete(SOURCE_SUBSCRIPTION_ID);
    await ctx.db.delete(SOURCE_PROFILE_ID);

    await logAudit(
      ctx,
      null,
      FINALIZE_ACTION,
      'users',
      String(SOURCE_USER_ID),
      OWNER_ACCOUNT_MERGE_RELEASE_ID,
      { result: 'ok', before: finalizeBefore, after: finalizeAfter },
    );
    const after = await preflightState(ctx);
    if (after.phase !== 'applied') {
      throw new Error(`Owner account finalize postflight failed: ${after.blockers.join('; ')}`);
    }
    return after;
  },
});
