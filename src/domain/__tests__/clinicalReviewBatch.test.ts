import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import { getAssignedBatch, saveAssignedDecision } from '../../../convex/clinicalReviewBatch';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_COUNT,
  CLINICAL_REVIEW_BATCH_HASH,
  CLINICAL_REVIEW_BATCH_ID,
  CLINICAL_REVIEW_BATCH_ITEMS,
  CLINICAL_REVIEW_BATCH_MANIFEST,
  CLINICAL_REVIEW_BATCH_REVIEWER,
} from '../../../convex/lib/clinicalReviewBatchData';

const frozenProfile = {
  _creationTime: 1785417794053.964,
  _id: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  consentAcceptedAt: 1785417794054,
  displayName: 'Phyo Ko Ko',
  isStaff: true,
  parentTourCompletedVersion: 1,
  preferredLocale: 'mm',
  staffQualification: 'MBBS',
  staffRole: 'clinical_reviewer',
  staffTourCompletedVersion: 1,
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
};

function context(profileRows = [frozenProfile]) {
  const insert = vi.fn(async () => 'inserted');
  const query = vi.fn((table: string) => {
    const rows = table === 'parentProfiles' ? profileRows : [];
    const terminal = {
      take: async (count: number) => rows.slice(0, count),
      order: () => terminal,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = { eq: () => q };
        callback(q);
        return terminal;
      },
    };
  });
  return { auth: {}, db: { query, insert }, storage: {} };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

const baseArgs = {
  batchId: CLINICAL_REVIEW_BATCH_ID,
  batchHash: CLINICAL_REVIEW_BATCH_HASH,
  count: CLINICAL_REVIEW_BATCH_COUNT,
  ordinal: 1,
  kind: 'milestone',
  slug: 'ms_birth_2m_communication_1',
  expectedReviewRevision: 1,
  decision: 'approved',
};

describe('frozen clinical-review batch', () => {
  beforeEach(() => { authState.userId = null; });

  it('keeps the manifest hash, reviewer assignment and two exact members immutable', async () => {
    expect(await sha256Canonical(CLINICAL_REVIEW_BATCH_MANIFEST)).toBe(CLINICAL_REVIEW_BATCH_HASH);
    expect(CLINICAL_REVIEW_BATCH_COUNT).toBe(2);
    expect(CLINICAL_REVIEW_BATCH_REVIEWER).toMatchObject({
      userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
    });
    expect(CLINICAL_REVIEW_BATCH_ITEMS.map(({ ordinal, kind, slug, reviewRevision }) => ({ ordinal, kind, slug, reviewRevision }))).toEqual([
      { ordinal: 1, kind: 'milestone', slug: 'ms_birth_2m_communication_1', reviewRevision: 1 },
      { ordinal: 2, kind: 'activity', slug: 'act_peek_a_boo_cloth', reviewRevision: 1 },
    ]);
    expect(await sha256Canonical(frozenProfile)).toBe(CLINICAL_REVIEW_BATCH_REVIEWER.profileCanonicalSha256);
  });

  it('refuses another authenticated clinical account and only writes a refusal audit', async () => {
    authState.userId = 'another-clinical-user';
    const ctx = context();
    await expect(handler(saveAssignedDecision)(ctx, baseArgs)).resolves.toMatchObject({ ok: false, code: 'not_assigned_reviewer' });
    expect(ctx.db.insert).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({ result: 'rejected' }));
    expect(ctx.db.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
  });

  it('does not expose assigned items to a different authenticated account', async () => {
    authState.userId = 'another-clinical-user';
    const result = await handler(getAssignedBatch)(context(), {});
    expect(result).toMatchObject({ allowed: false, blockers: ['not_assigned_reviewer'], items: [] });
  });

  it('refuses a mismatched manifest tuple before any content decision write', async () => {
    authState.userId = CLINICAL_REVIEW_BATCH_REVIEWER.userId;
    const ctx = context();
    await expect(handler(saveAssignedDecision)(ctx, { ...baseArgs, count: 999 })).resolves.toMatchObject({
      ok: false,
      code: 'batch_manifest_mismatch',
    });
    expect(ctx.db.insert).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
  });

  it('refuses a slug outside the two-member manifest before any content decision write', async () => {
    authState.userId = CLINICAL_REVIEW_BATCH_REVIEWER.userId;
    const ctx = context();
    await expect(handler(saveAssignedDecision)(ctx, { ...baseArgs, slug: 'not-in-batch' })).resolves.toMatchObject({
      ok: false,
      code: 'not_in_frozen_batch',
    });
    expect(ctx.db.insert).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
  });
});
