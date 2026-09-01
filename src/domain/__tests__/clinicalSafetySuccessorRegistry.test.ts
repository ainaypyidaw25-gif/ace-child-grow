import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'owner-user' as string | null }));
const livePreflight = vi.hoisted(() => ({
  blockers: vi.fn(async () => [] as string[]),
}));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

vi.mock('../../../convex/clinicalReviewBatch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/clinicalReviewBatch')>();
  return { ...actual, registeredBatchActivationBlockers: livePreflight.blockers };
});

import {
  activateRegisteredBatch,
  materializeRegisteredReleaseBatches,
} from '../../../convex/clinicalReviewRegistry';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_SAFETY_SUCCESSOR_BATCH_FROZEN_AT,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_PREIMAGES,
  CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

type Row = Record<string, unknown>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function productionLikeContext() {
  const frozen = CLINICAL_SAFETY_SUCCESSOR_BATCH_PREIMAGES;
  const tables: Record<string, Row[]> = {
    parentProfiles: [{
      _id: 'owner-profile',
      _creationTime: 1,
      userId: 'owner-user',
      isStaff: true,
      staffRole: 'owner',
      displayName: 'Daw La Pyae Wun',
      staffQualification: 'MEd (Early Childhood and Special Education)',
    }],
    clinicalReviewBatches: clone(frozen.registry.batches),
    clinicalReviewAssignments: clone(frozen.registry.assignments),
    clinicalReviewBatchReceipts: clone(frozen.registry.receipts),
    contentReviews: clone(frozen.registry.decisions),
    auditLogs: [],
  };
  const query = vi.fn((table: string) => {
    const builder = (filters: Array<[string, unknown]>) => {
      const rows = () => (tables[table] ?? []).filter((row) =>
        filters.every(([field, value]) => row[field] === value));
      const terminal = {
        take: async (count: number) => rows().slice(0, count),
        unique: async () => {
          const matches = rows();
          if (matches.length > 1) throw new Error('not unique');
          return matches[0] ?? null;
        },
        order: () => terminal,
      };
      return {
        ...terminal,
        withIndex: (
          _name: string,
          callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
        ) => {
          const next = [...filters];
          const q = {
            eq: (field: string, value: unknown) => {
              next.push([field, value]);
              return q;
            },
          };
          callback(q);
          return builder(next);
        },
      };
    };
    return builder([]);
  });
  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    inserted += 1;
    const id = `${table}-seq15-${inserted}`;
    (tables[table] ??= []).push({ _id: id, _creationTime: inserted, ...value });
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    for (const rows of Object.values(tables)) {
      const row = rows.find((candidate) => candidate._id === id);
      if (row) {
        Object.assign(row, value);
        return;
      }
    }
    throw new Error(`Missing row ${id}`);
  });
  return { auth: {}, db: { query, insert, patch }, tables };
}

function handler(fn: unknown) {
  return (fn as {
    _handler: (
      ctx: ReturnType<typeof productionLikeContext>,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
  })._handler;
}

async function registryDigest() {
  return await sha256Canonical(CLINICAL_REVIEW_BATCH_REGISTRY.map((registration) => ({
    routing: clinicalReviewBatchRoutingPayload(registration),
    routingDigest: registration.routingCanonicalSha256,
  })));
}

describe('sequence-15 safety successor registry handlers', () => {
  beforeEach(() => {
    authState.userId = 'owner-user';
    livePreflight.blockers.mockReset();
    livePreflight.blockers.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('materializes only seq15 and consumes only the exact seq14 handoff', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(
      CLINICAL_SAFETY_SUCCESSOR_BATCH_FROZEN_AT + 1,
    );
    const ctx = productionLikeContext();
    const decisionsBefore = clone(ctx.tables.contentReviews);
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(13);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(142);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(9);

    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: true,
      code: 'materialized',
      createdBatches: 2,
      createdAssignments: 28,
    });
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(15);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(170);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(9);
    expect(ctx.tables.contentReviews).toEqual(decisionsBefore);
    expect(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST.batchId,
    )).toMatchObject({
      sequence: 15,
      dimension: 'safety',
      status: 'frozen',
      itemCount: 14,
      activationKind: 'after_handoff',
      predecessorBatchId: 'clinical-evidence-successor-14-2026-09-01-v1',
    });

    ctx.db.insert.mockClear();
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST.batchId,
      expectedFreezeDigest: CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
      expectedUpstreamReceiptDigest: '0'.repeat(64),
    })).resolves.toMatchObject({
      ok: false,
      code: 'upstream_handoff_missing',
    });
    expect(ctx.db.patch).not.toHaveBeenCalled();
    expect(ctx.db.insert).not.toHaveBeenCalled();

    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST.batchId,
      expectedFreezeDigest: CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
      expectedUpstreamReceiptDigest:
        CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
    })).resolves.toMatchObject({
      ok: true,
      code: 'activated',
      batchId: CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST.batchId,
    });
    expect(livePreflight.blockers).toHaveBeenCalledTimes(1);
    expect(ctx.db.patch).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).toHaveBeenCalledWith('auditLogs', expect.any(Object));
    expect(ctx.tables.clinicalReviewBatches.filter(
      (row) => row.status === 'active',
    )).toHaveLength(1);
    expect(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST.batchId,
    )).toMatchObject({
      status: 'active',
      consumedUpstreamReceiptDigest:
        CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
      activatedAt: CLINICAL_SAFETY_SUCCESSOR_BATCH_FROZEN_AT + 1,
    });
    expect(ctx.tables.contentReviews).toEqual(decisionsBefore);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(9);
  });
});
