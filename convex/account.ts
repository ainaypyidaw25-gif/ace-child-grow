import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Id, TableNames } from './_generated/dataModel';
import { internalMutation, mutation, type MutationCtx } from './_generated/server';
import { requireUser } from './lib/auth';

const ROOT_BATCH_SIZE = 24;
const NESTED_BATCH_SIZE = 32;
const CHILD_BATCH_SIZE = 4;
const AUDIT_SCAN_BATCH_SIZE = 64;
const ACCOUNT_DELETION_START_DELAY_MS = 5_000;
// Convex Auth access JWTs are valid for one hour by default. Accounts and
// refreshable sessions are removed immediately by the worker, then the user row
// is retained just beyond that window so a still-cached JWT cannot recreate
// orphaned data after the final sweep.
const ACCESS_TOKEN_GRACE_MS = 61 * 60 * 1_000;

type DeletableRow = { _id: Id<TableNames> };

function distinctRows(...groups: ReadonlyArray<ReadonlyArray<DeletableRow>>): DeletableRow[] {
  const seen = new Set<string>();
  const rows: DeletableRow[] = [];
  for (const group of groups) {
    for (const row of group) {
      const id = String(row._id);
      if (seen.has(id)) continue;
      seen.add(id);
      rows.push(row);
    }
  }
  return rows;
}

async function deleteRows(ctx: MutationCtx, rows: ReadonlyArray<DeletableRow>): Promise<number> {
  for (const row of rows) await ctx.db.delete(row._id);
  return rows.length;
}

function scrubText(value: string | undefined, tokens: readonly string[]): string | undefined {
  if (value === undefined) return undefined;
  let scrubbed = value;
  for (const token of tokens) {
    if (token.length < 3) continue;
    scrubbed = scrubbed.split(token).join('[deleted account]');
  }
  return scrubbed;
}

function normalizedTokens(values: ReadonlyArray<string | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

export const deleteMine = mutation({
  args: { confirmation: v.literal('DELETE') },
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [user, profile] = await Promise.all([
      ctx.db.get(userId),
      ctx.db
        .query('parentProfiles')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .unique(),
    ]);
    const authIdentifiers = normalizedTokens([user?.email, user?.phone]);
    const scrubTokens = normalizedTokens([
      String(userId),
      user?.email,
      user?.phone,
      user?.name,
      profile?.displayName,
    ]);

    await ctx.scheduler.runAfter(
      ACCOUNT_DELETION_START_DELAY_MS,
      internal.account.deleteMineBatch,
      {
        userId,
        deleteAfter: Date.now() + ACCESS_TOKEN_GRACE_MS,
        authIdentifiers,
        scrubTokens,
        auditCursor: null,
        auditDone: false,
      },
    );
    return null;
  },
});

const deleteMineBatchArgs = {
  userId: v.id('users'),
  deleteAfter: v.number(),
  authIdentifiers: v.array(v.string()),
  scrubTokens: v.array(v.string()),
  auditCursor: v.union(v.string(), v.null()),
  auditDone: v.boolean(),
};

/**
 * Bounded, idempotent account erasure worker.
 *
 * Every `.take()` is a per-transaction batch size, not a deletion cap: any
 * observed work schedules this internal mutation again until every indexed
 * ownership range is empty. The final no-work transaction deletes the user, so
 * inserts racing that final range check cause an OCC retry rather than orphans.
 */
export const deleteMineBatch = internalMutation({
  args: deleteMineBatchArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = args.userId;
    let hadWork = false;

    // Parent-owned records with direct user indexes.
    const directGroups = await Promise.all([
      ctx.db.query('parentProfiles').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('subscriptions').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('referralCodes').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('favorites').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
    ]);
    if (await deleteRows(ctx, distinctRows(...directGroups))) hadWork = true;

    // Child-linked data is swept by user id to catch legacy or already-orphaned
    // rows. A second by-child sweep below protects against inconsistent userId
    // fields before the child itself is hard-deleted.
    const userChildGroups = await Promise.all([
      ctx.db.query('growthRecords').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('sleepRecords').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('healthRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('vaccinationRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('medicationRecords').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('milestoneSessions').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('milestoneResponses').withIndex('by_user_and_child', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('activityCompletions').withIndex('by_user_and_completed_at', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('appointments').withIndex('by_user_and_appointment_at', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
    ]);
    if (await deleteRows(ctx, distinctRows(...userChildGroups))) hadWork = true;

    const children = await ctx.db
      .query('children')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(CHILD_BATCH_SIZE);
    for (const child of children) {
      const childGroups = await Promise.all([
        ctx.db.query('growthRecords').withIndex('by_child', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('sleepRecords').withIndex('by_child', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('healthRecords').withIndex('by_child_and_record_date', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('vaccinationRecords').withIndex('by_child_and_scheduled_on', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('medicationRecords').withIndex('by_child_and_started_on', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('milestoneSessions').withIndex('by_child', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('milestoneResponses').withIndex('by_child', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('activityCompletions').withIndex('by_child_and_completed_at', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('appointments').withIndex('by_child_and_appointment_at', (q) => q.eq('childId', child._id)).take(NESTED_BATCH_SIZE),
      ]);
      const linkedRows = distinctRows(...childGroups);
      if (linkedRows.length > 0) {
        await deleteRows(ctx, linkedRows);
        hadWork = true;
      } else {
        await ctx.db.delete(child._id);
        hadWork = true;
      }
    }

    // Manual payment proofs are the only user-uploaded storage blobs in the
    // schema. Delete the blob in the same transaction as its request row.
    const [ownedPaymentRequests, reviewedPaymentRequests] = await Promise.all([
      ctx.db.query('paymentRequests').withIndex('by_user', (q) => q.eq('userId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('paymentRequests').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(ROOT_BATCH_SIZE),
    ]);
    const ownedPaymentIds = new Set(ownedPaymentRequests.map((row) => String(row._id)));
    for (const row of reviewedPaymentRequests) {
      if (ownedPaymentIds.has(String(row._id))) continue;
      await ctx.db.patch(row._id, {
        reviewedBy: undefined,
        reviewNote: scrubText(row.reviewNote, args.scrubTokens),
      });
      hadWork = true;
    }
    for (const row of ownedPaymentRequests) {
      if (row.proofStorageId) await ctx.storage.delete(row.proofStorageId);
      await ctx.db.delete(row._id);
      hadWork = true;
    }

    // Webhook events are user-linked through their transaction order id. Keep
    // the transaction until its event range is empty, then remove it.
    const transactions = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(ROOT_BATCH_SIZE);
    for (const transaction of transactions) {
      const events = await ctx.db
        .query('mmpayWebhookEvents')
        .withIndex('by_order_id', (q) => q.eq('orderId', transaction.orderId))
        .take(NESTED_BATCH_SIZE);
      if (events.length > 0) {
        await deleteRows(ctx, events);
      } else {
        await ctx.db.delete(transaction._id);
      }
      hadWork = true;
    }

    const [sentReferrals, receivedReferrals, reviewedReferrals] = await Promise.all([
      ctx.db.query('referrals').withIndex('by_referrer_user', (q) => q.eq('referrerUserId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('referrals').withIndex('by_referred_user', (q) => q.eq('referredUserId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('referrals').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(ROOT_BATCH_SIZE),
    ]);
    const ownedReferralRows = distinctRows(sentReferrals, receivedReferrals);
    const ownedReferralIds = new Set(ownedReferralRows.map((row) => String(row._id)));
    for (const row of reviewedReferrals) {
      if (ownedReferralIds.has(String(row._id))) continue;
      await ctx.db.patch(row._id, { reviewedBy: undefined });
      hadWork = true;
    }
    if (await deleteRows(ctx, ownedReferralRows)) hadWork = true;

    const inviteGroups = await Promise.all([
      ctx.db.query('staffInvites').withIndex('by_target_user', (q) => q.eq('targetUserId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('staffInvites').withIndex('by_invited_by', (q) => q.eq('invitedBy', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('staffInvites').withIndex('by_accepted_by', (q) => q.eq('acceptedBy', userId)).take(ROOT_BATCH_SIZE),
      ...args.authIdentifiers.map((identifier) =>
        ctx.db.query('staffInvites').withIndex('by_email', (q) => q.eq('email', identifier)).take(ROOT_BATCH_SIZE)),
    ]);
    if (await deleteRows(ctx, distinctRows(...inviteGroups))) hadWork = true;

    const familyGroups = await Promise.all([
      ctx.db.query('familyCaregivers').withIndex('by_owner', (q) => q.eq('ownerId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('familyCaregivers').withIndex('by_caregiver_user', (q) => q.eq('caregiverUserId', userId)).take(ROOT_BATCH_SIZE),
      ...args.authIdentifiers.map((identifier) =>
        ctx.db.query('familyCaregivers').withIndex('by_email_and_status', (q) => q.eq('caregiverEmail', identifier)).take(ROOT_BATCH_SIZE)),
    ]);
    if (await deleteRows(ctx, distinctRows(...familyGroups))) hadWork = true;

    // Global editorial/reconciliation rows remain useful, but their reviewer
    // link and known display-name metadata must not survive account erasure.
    const [contentItems, facilities, libraryItems, contentReviews, contentEdits, media, evidenceSources] = await Promise.all([
      ctx.db.query('contentItems').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('healthcareFacilities').withIndex('by_verified_by', (q) => q.eq('verifiedBy', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('libraryContent').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('contentReviews').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('contentEditLogs').withIndex('by_editor', (q) => q.eq('editorId', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('libraryMedia').withIndex('by_reviewed_by', (q) => q.eq('reviewedBy', userId)).take(ROOT_BATCH_SIZE),
      ctx.db.query('evidenceSources').withIndex('by_reviewer', (q) => q.eq('reviewerId', userId)).take(ROOT_BATCH_SIZE),
    ]);
    for (const row of contentItems) {
      await ctx.db.patch(row._id, {
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewScope: undefined,
        translationNote: scrubText(row.translationNote, args.scrubTokens),
      });
      hadWork = true;
    }
    for (const row of facilities) {
      await ctx.db.patch(row._id, { verifiedBy: undefined });
      hadWork = true;
    }
    for (const row of libraryItems) {
      await ctx.db.patch(row._id, {
        reviewerId: undefined,
        reviewerDisplayName: undefined,
        reviewerQualification: undefined,
        reviewScope: undefined,
        reviewNote: scrubText(row.reviewNote, args.scrubTokens),
      });
      hadWork = true;
    }
    if (await deleteRows(ctx, [...contentReviews, ...contentEdits])) hadWork = true;
    for (const row of media) {
      await ctx.db.patch(row._id, {
        reviewedBy: undefined,
        reviewerQualification: undefined,
        note: scrubText(row.note, args.scrubTokens),
      });
      hadWork = true;
    }
    for (const row of evidenceSources) {
      await ctx.db.patch(row._id, {
        reviewerId: undefined,
        reviewer: null,
        reviewerQualification: undefined,
        reviewScope: undefined,
        reviewNote: scrubText(row.reviewNote, args.scrubTokens),
      });
      hadWork = true;
    }

    // Convex Auth child rows must be deleted before their parent account/session.
    const accounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', userId))
      .take(ROOT_BATCH_SIZE);
    for (const account of accounts) {
      const [codes, accountRateLimits] = await Promise.all([
        ctx.db
          .query('authVerificationCodes')
          .withIndex('accountId', (q) => q.eq('accountId', account._id))
          .take(NESTED_BATCH_SIZE),
        // Password-provider failures are keyed by authAccounts._id, while
        // email/OTP failures below are keyed by the identifier itself.
        ctx.db
          .query('authRateLimits')
          .withIndex('identifier', (q) => q.eq('identifier', String(account._id)))
          .take(NESTED_BATCH_SIZE),
      ]);
      const accountChildren = distinctRows(codes, accountRateLimits);
      if (accountChildren.length > 0) {
        await deleteRows(ctx, accountChildren);
      } else {
        await ctx.db.delete(account._id);
      }
      hadWork = true;
    }

    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .take(ROOT_BATCH_SIZE);
    for (const session of sessions) {
      const [tokens, verifiers] = await Promise.all([
        ctx.db.query('authRefreshTokens').withIndex('sessionId', (q) => q.eq('sessionId', session._id)).take(NESTED_BATCH_SIZE),
        ctx.db.query('authVerifiers').withIndex('sessionId', (q) => q.eq('sessionId', session._id)).take(NESTED_BATCH_SIZE),
      ]);
      const authChildren = distinctRows(tokens, verifiers);
      if (authChildren.length > 0) {
        await deleteRows(ctx, authChildren);
      } else {
        await ctx.db.delete(session._id);
      }
      hadWork = true;
    }

    for (const identifier of args.authIdentifiers) {
      const rateLimits = await ctx.db
        .query('authRateLimits')
        .withIndex('identifier', (q) => q.eq('identifier', identifier))
        .take(ROOT_BATCH_SIZE);
      if (await deleteRows(ctx, rateLimits)) hadWork = true;
    }

    // Audit rows are intentionally preserved, but identifiers in both the actor
    // field and serialized details are anonymized. Pagination makes this a full,
    // bounded scan instead of a capped partial delete.
    let auditCursor = args.auditCursor;
    let auditDone = args.auditDone;
    if (!auditDone) {
      const stableScrubTokens = normalizedTokens([String(userId), ...args.authIdentifiers]);
      const auditPage = await ctx.db.query('auditLogs').paginate({
        cursor: auditCursor,
        numItems: AUDIT_SCAN_BATCH_SIZE,
      });
      for (const row of auditPage.page) {
        // Names are not unique, so scrub them only from records attributed to
        // this actor. Stable ids/email/phone may be scrubbed from target records.
        const rowTokens = row.actorId === userId ? args.scrubTokens : stableScrubTokens;
        const entityId = scrubText(row.entityId, rowTokens);
        const summary = scrubText(row.summary, rowTokens);
        const before = scrubText(row.before, rowTokens);
        const after = scrubText(row.after, rowTokens);
        if (
          row.actorId === userId ||
          entityId !== row.entityId ||
          summary !== row.summary ||
          before !== row.before ||
          after !== row.after
        ) {
          await ctx.db.patch(row._id, {
            actorId: row.actorId === userId ? undefined : row.actorId,
            entityId,
            summary,
            before,
            after,
          });
          hadWork = true;
        }
      }
      auditDone = auditPage.isDone;
      auditCursor = auditPage.isDone ? null : auditPage.continueCursor;
    }

    if (hadWork || !auditDone) {
      await ctx.scheduler.runAfter(0, internal.account.deleteMineBatch, {
        ...args,
        auditCursor,
        auditDone,
      });
      return null;
    }

    if (Date.now() < args.deleteAfter) {
      // Rescan the audit trail and all ownership ranges after cached access JWTs
      // have expired, then perform the final user deletion.
      await ctx.scheduler.runAt(args.deleteAfter, internal.account.deleteMineBatch, {
        ...args,
        auditCursor: null,
        auditDone: false,
      });
      return null;
    }

    if (await ctx.db.get(userId)) await ctx.db.delete(userId);
    return null;
  },
});
