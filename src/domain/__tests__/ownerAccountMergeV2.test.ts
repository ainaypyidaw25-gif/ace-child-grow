import { describe, expect, it, vi } from 'vitest';

import {
  classifyOwnerAccountMergeV2Snapshot,
  executeOwnerAccountMergeV2,
  sourceUnexpectedReferenceCategories,
  type OwnerAccountMergeV2Preflight,
} from '../../../convex/ownerAccountMergeV2';
import {
  OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE,
  OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE,
  OWNER_ACCOUNT_MERGE_V2_FINALIZE_ACTION,
  OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
  OWNER_ACCOUNT_MERGE_V2_SOURCE_PROFILE_ID,
  OWNER_ACCOUNT_MERGE_V2_SOURCE_SUBSCRIPTION_ID,
  OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID,
  OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS,
  OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID,
} from '../../../convex/lib/ownerAccountMergeV2Data';

function classifierInput(applied = false) {
  return {
    core: structuredClone(applied
      ? OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE
      : OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE),
    targetReferences: OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS.map((set): {
      count: number;
      idsDigest: string;
      linksDigest: string;
    } => ({ ...set })),
    sourceUnexpectedReferenceCategories: [] as string[],
    sourceAuthenticationArtifactCount: 0,
    googleVerificationCodeCount: 0,
    v1FinalizeAuditCount: 0,
    v2FinalizeAuditCount: applied ? 1 : 0,
    v2FinalizeAuditValid: applied,
  };
}

function result(phase: OwnerAccountMergeV2Preflight['phase']): OwnerAccountMergeV2Preflight {
  return {
    releaseId: OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
    phase,
    blockers: phase === 'blocked' ? ['frozen row drifted'] : [],
    v1QuarantineAuditFound: true,
    v2FinalizeAuditFound: phase === 'applied',
    sourceAuthenticationArtifactCount: 0,
    googleVerificationCodeCount: 0,
    sourceUnexpectedReferenceCategories: [],
    sourceTransferCounts: { profiles: 1, subscriptions: 1, children: 1, activities: 16, notifications: 1 },
    targetReferenceSets: OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS.map((set) => ({
      key: set.key,
      count: set.count,
      expectedCount: set.count,
      exact: true,
    })),
  };
}

describe('immutable duplicate-owner v2 successor', () => {
  it('recognizes the exact 2026-09-09 production preimage', () => {
    expect(classifyOwnerAccountMergeV2Snapshot(classifierInput())).toEqual({
      phase: 'finalize_ready',
      blockers: [],
    });
  });

  it.each(OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS)(
    'fails closed when $key differs from its exact row-id/link digests',
    (expected) => {
      const input = classifierInput();
      const index = OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS.findIndex((set) => set.key === expected.key);
      input.targetReferences[index] = { ...input.targetReferences[index], idsDigest: 'drift' };
      expect(classifyOwnerAccountMergeV2Snapshot(input)).toMatchObject({
        phase: 'blocked',
        blockers: expect.arrayContaining([`${expected.key} reference set drifted`]),
      });
    },
  );

  it('checks every non-transfer user reference category and reports exact hits', async () => {
    const expected = [
      ['favorites.userId', 'favorites', 'by_user', 'userId'],
      ['growthRecords.userId', 'growthRecords', 'by_user', 'userId'],
      ['sleepRecords.userId', 'sleepRecords', 'by_user', 'userId'],
      ['healthRecords.userId', 'healthRecords', 'by_user_and_child', 'userId'],
      ['vaccinationRecords.userId', 'vaccinationRecords', 'by_user_and_child', 'userId'],
      ['medicationRecords.userId', 'medicationRecords', 'by_user_and_child', 'userId'],
      ['milestoneSessions.userId', 'milestoneSessions', 'by_user', 'userId'],
      ['milestoneResponses.userId', 'milestoneResponses', 'by_user_and_child', 'userId'],
      ['appointments.userId', 'appointments', 'by_user_and_appointment_at', 'userId'],
      ['observations.userId', 'observations', 'by_user_and_observed_on', 'userId'],
      ['paymentRequests.userId', 'paymentRequests', 'by_user', 'userId'],
      ['paymentRequests.reviewedBy', 'paymentRequests', 'by_reviewed_by', 'reviewedBy'],
      ['mmpayTransactions.userId', 'mmpayTransactions', 'by_user', 'userId'],
      ['referralCodes.userId', 'referralCodes', 'by_user', 'userId'],
      ['referrals.referrerUserId', 'referrals', 'by_referrer_user', 'referrerUserId'],
      ['referrals.referredUserId', 'referrals', 'by_referred_user', 'referredUserId'],
      ['referrals.reviewedBy', 'referrals', 'by_reviewed_by', 'reviewedBy'],
      ['familyCaregivers.ownerId', 'familyCaregivers', 'by_owner', 'ownerId'],
      ['familyCaregivers.caregiverUserId', 'familyCaregivers', 'by_caregiver_user', 'caregiverUserId'],
      ['staffInvites.targetUserId', 'staffInvites', 'by_target_user', 'targetUserId'],
      ['staffInvites.invitedBy', 'staffInvites', 'by_invited_by', 'invitedBy'],
      ['staffInvites.acceptedBy', 'staffInvites', 'by_accepted_by', 'acceptedBy'],
      ['contentItems.reviewerId', 'contentItems', 'by_reviewer', 'reviewerId'],
      ['libraryContent.reviewerId', 'libraryContent', 'by_reviewer', 'reviewerId'],
      ['libraryContent.classificationConfirmedBy', 'libraryContent', 'by_classification_confirmed_by', 'classificationConfirmedBy'],
      ['evidenceSources.reviewerId', 'evidenceSources', 'by_reviewer', 'reviewerId'],
      ['healthcareFacilities.verifiedBy', 'healthcareFacilities', 'by_verified_by', 'verifiedBy'],
      ['libraryMedia.reviewedBy', 'libraryMedia', 'by_reviewed_by', 'reviewedBy'],
      ['clinicalReviewBatches.reviewerId', 'clinicalReviewBatches', 'by_reviewer', 'reviewerId'],
      ['clinicalReviewBatchReceipts.reviewerId', 'clinicalReviewBatchReceipts', 'by_reviewer', 'reviewerId'],
    ];
    const observed: Array<{ table: string; index: string; field: string; value: unknown }> = [];
    const query = vi.fn((table: string) => ({
      withIndex: vi.fn((index: string, callback: (q: {
        eq: (field: string, value: unknown) => unknown;
      }) => unknown) => {
        let field = '';
        let value: unknown;
        const q = {
          eq(nextField: string, nextValue: unknown) {
            field = nextField;
            value = nextValue;
            return q;
          },
        };
        callback(q);
        observed.push({ table, index, field, value });
        return { take: vi.fn(async () => [{ _id: `${table}.${field}` }]) };
      }),
    }));

    await expect(sourceUnexpectedReferenceCategories({ db: { query } } as never))
      .resolves.toEqual(expected.map(([key]) => key));
    expect(query).toHaveBeenCalledTimes(expected.length);
    expect(expected).toHaveLength(30);
    expect(observed).toEqual(expected.map(([, table, index, field]) => ({
      table,
      index,
      field,
      value: OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID,
    })));
    const deliberatelyHandledElsewhere = [
      'parentProfiles',
      'subscriptions',
      'children',
      'activityCompletions',
      'notifications',
      'contentReviews',
      'contentEditLogs',
      'auditLogs',
      'authAccounts',
      'authSessions',
    ];
    const queriedTables = observed.map(({ table }) => table);
    for (const table of deliberatelyHandledElsewhere) expect(queriedTables).not.toContain(table);

    const input = classifierInput();
    input.sourceUnexpectedReferenceCategories = ['mmpayTransactions.userId'];
    expect(classifyOwnerAccountMergeV2Snapshot(input)).toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining([
        'source gained unexpected reference categories: mmpayTransactions.userId',
      ]),
    });
  });

  it('recognizes the exact postimage and makes a repeat call idempotent', async () => {
    expect(classifyOwnerAccountMergeV2Snapshot(classifierInput(true))).toEqual({
      phase: 'applied',
      blockers: [],
    });
    const db = { query: vi.fn(), patch: vi.fn(), delete: vi.fn(), insert: vi.fn() };
    await expect(executeOwnerAccountMergeV2({ db } as never, async () => result('applied')))
      .resolves.toMatchObject({ phase: 'applied' });
    expect(db.query).not.toHaveBeenCalled();
    expect(db.patch).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('durably recognizes an audited merge after unrelated target growth', () => {
    const input = classifierInput(true);
    input.core.targetActivities = {
      count: input.core.targetActivities.count + 1,
      idsDigest: 'later-target-ids',
      rowsDigest: 'later-target-rows',
    };
    input.targetReferences[0] = {
      ...input.targetReferences[0],
      count: input.targetReferences[0].count + 1,
      idsDigest: 'later-reference-ids',
      linksDigest: 'later-reference-links',
    };

    expect(classifyOwnerAccountMergeV2Snapshot(input)).toEqual({
      phase: 'applied',
      blockers: [],
    });
    expect(classifyOwnerAccountMergeV2Snapshot({ ...input, strictPostflight: true }))
      .toMatchObject({ phase: 'blocked' });
  });

  it('finalizes only the frozen transfer rows, deletes the two duplicate rows, and writes one audit', async () => {
    const rowsByTable = {
      children: [{ _id: 'source-child' }],
      activityCompletions: [{ _id: 'source-activity-1' }, { _id: 'source-activity-2' }],
      notifications: [{ _id: 'source-notification' }],
    } as const;
    const query = vi.fn((table: keyof typeof rowsByTable) => ({
      withIndex: vi.fn(() => ({
        take: vi.fn(async () => [...rowsByTable[table]]),
      })),
    }));
    const db = {
      query,
      patch: vi.fn(async (id: string, update: Record<string, unknown>) => {
        void id;
        void update;
      }),
      delete: vi.fn(async (id: string) => {
        void id;
      }),
      insert: vi.fn(async (table: string, row: Record<string, unknown>) => {
        void table;
        void row;
        return 'v2-audit';
      }),
    };
    const readState = vi.fn()
      .mockResolvedValueOnce(result('finalize_ready'))
      .mockResolvedValueOnce(result('applied'));

    await expect(executeOwnerAccountMergeV2({ db } as never, readState, readState))
      .resolves.toMatchObject({ phase: 'applied' });

    expect(query.mock.calls.map(([table]) => table)).toEqual([
      'children',
      'activityCompletions',
      'notifications',
    ]);
    expect(db.patch.mock.calls).toEqual([
      ['source-child', { userId: OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID }],
      ['source-activity-1', { userId: OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID }],
      ['source-activity-2', { userId: OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID }],
      ['source-notification', { userId: OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID }],
    ]);
    expect(db.patch.mock.calls.some(([, update]) => 'preferredLocale' in update)).toBe(false);
    expect(db.delete.mock.calls).toEqual([
      [OWNER_ACCOUNT_MERGE_V2_SOURCE_SUBSCRIPTION_ID],
      [OWNER_ACCOUNT_MERGE_V2_SOURCE_PROFILE_ID],
    ]);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: OWNER_ACCOUNT_MERGE_V2_FINALIZE_ACTION,
      entityTable: 'users',
      result: 'ok',
      summary: OWNER_ACCOUNT_MERGE_V2_RELEASE_ID,
    }));
    expect(readState).toHaveBeenCalledTimes(2);
  });

  it('performs zero writes when any preflight digest has drifted', async () => {
    const db = { query: vi.fn(), patch: vi.fn(), delete: vi.fn(), insert: vi.fn() };
    await expect(executeOwnerAccountMergeV2({ db } as never, async () => result('blocked')))
      .rejects.toThrow('Owner account v2 finalize blocked');
    expect(db.query).not.toHaveBeenCalled();
    expect(db.patch).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
