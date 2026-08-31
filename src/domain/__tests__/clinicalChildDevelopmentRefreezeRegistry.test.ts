import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'owner-user' as string | null }));
const livePreflight = vi.hoisted(() => ({
  blockers: vi.fn(async () => [] as string[]),
}));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

// The generic live-preflight implementation has its own focused tests. This
// suite isolates the registry handlers and verifies that they bind and consume
// only the exact immutable sequence-11 registration.
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
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES,
} from '../../../convex/lib/childDevelopmentRefreezeCorrectionData';
import {
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_EXPIRES_AT,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ROUTING_HASH,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

type Row = Record<string, unknown>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueById(rows: readonly Row[]): Row[] {
  return [...new Map(rows.map((row) => [String(row._id), clone(row)])).values()];
}

function productionLikeContext() {
  const fixture = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES;
  const tables: Record<string, Row[]> = {
    parentProfiles: [
      {
        _id: 'owner-profile',
        _creationTime: 1,
        userId: 'owner-user',
        isStaff: true,
        staffRole: 'owner',
        displayName: 'Owner',
        staffQualification: 'MEd',
      },
      clone(fixture.sourceApproval.reviewerProfile),
    ],
    clinicalReviewBatches: clone(fixture.registry.batches),
    clinicalReviewAssignments: clone(fixture.registry.assignments),
    clinicalReviewBatchReceipts: clone(fixture.registry.receipts),
    contentReviews: uniqueById(fixture.targets.flatMap((target) => target.reviews)),
    libraryContent: uniqueById(fixture.targets.map((target) => target.content)),
    evidenceLinks: uniqueById(fixture.targets.map((target) => target.link)),
    evidenceSources: uniqueById(fixture.targets.flatMap((target) => target.sources)),
    libraryMedia: uniqueById(fixture.targets.flatMap((target) => target.media)),
    aiContentAudits: uniqueById(fixture.targets.flatMap((target) => target.ai.contentAudits)),
    aiEvidenceAudits: uniqueById(fixture.targets.flatMap((target) => target.ai.evidenceAudits)),
    aiPublicationReleases: uniqueById(fixture.targets.flatMap((target) => target.ai.releases)),
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
    const id = `${table}-seq11-${inserted}`;
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

function preservedRows(ctx: ReturnType<typeof productionLikeContext>) {
  return clone({
    contentReviews: ctx.tables.contentReviews,
    libraryContent: ctx.tables.libraryContent,
    evidenceLinks: ctx.tables.evidenceLinks,
    evidenceSources: ctx.tables.evidenceSources,
    libraryMedia: ctx.tables.libraryMedia,
    aiContentAudits: ctx.tables.aiContentAudits,
    aiEvidenceAudits: ctx.tables.aiEvidenceAudits,
    aiPublicationReleases: ctx.tables.aiPublicationReleases,
  });
}

describe('sequence-11 child-development refreeze registry handlers', () => {
  beforeEach(() => {
    authState.userId = 'owner-user';
    livePreflight.blockers.mockReset();
    livePreflight.blockers.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers only the exact immutable successor of the stopped sequence-10 batch', () => {
    const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find((row) =>
      row.manifest.batchId === CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST.batchId,
    ) as ClinicalReviewBatchRegistration;
    expect(CLINICAL_REVIEW_BATCH_REGISTRY).toHaveLength(12);
    expect(registration).toMatchObject({
      sequence: 11,
      laneGraphVersion: 1,
      dimension: 'child_development',
      authority: 'release',
      activation: {
        kind: 'after_changes_requested_refreeze',
        previousBatchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
        expectedDecisionSetDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
      },
      routingCanonicalSha256: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ROUTING_HASH,
      freezeDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH,
      frozenAt: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT,
      expiresAt: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_EXPIRES_AT,
      manifest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST,
    });
    expect(registration.manifest.reviewer).toMatchObject({
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
    });
    expect(registration.manifest.items.map((item) => item.reviewRevision)).toEqual([
      6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9,
    ]);
    expect(registration.manifest.count).toBe(14);
  });

  it('materializes the registered tail idempotently, then activates only seq11 by exact decision digest', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT + 1);
    const ctx = productionLikeContext();
    const preserved = preservedRows(ctx);
    const predecessorBefore = clone(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
    ));
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(9);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(86);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(5);
    expect(predecessorBefore).toMatchObject({
      sequence: 10,
      status: 'stopped_changes_requested',
    });

    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: true,
      code: 'materialized',
      createdBatches: 2,
      createdAssignments: 28,
    });
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(11);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(114);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(5);
    expect(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST.batchId,
    )).toMatchObject({
      sequence: 11,
      status: 'frozen',
      itemCount: 14,
      activationKind: 'after_changes_requested_refreeze',
      predecessorBatchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
      expectedUpstreamStateDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
    });
    expect(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
    )).toEqual(predecessorBefore);
    expect(preservedRows(ctx)).toEqual(preserved);

    ctx.db.insert.mockClear();
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: true,
      createdBatches: 0,
      createdAssignments: 0,
    });
    expect(ctx.db.insert).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).toHaveBeenCalledWith('auditLogs', expect.any(Object));
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(11);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(114);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(5);

    ctx.db.insert.mockClear();
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST.batchId,
      expectedFreezeDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH,
      expectedUpstreamReceiptDigest: '0'.repeat(64),
    })).resolves.toMatchObject({
      ok: false,
      code: 'refreeze_decision_set_mismatch',
      batchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST.batchId,
    });
    expect(ctx.db.patch).not.toHaveBeenCalled();
    expect(ctx.db.insert).not.toHaveBeenCalled();

    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST.batchId,
      expectedFreezeDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH,
      expectedUpstreamReceiptDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
    })).resolves.toMatchObject({
      ok: true,
      code: 'activated',
      batchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST.batchId,
    });
    expect(livePreflight.blockers).toHaveBeenCalledTimes(1);
    expect(livePreflight.blockers).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        sequence: 11,
        freezeDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH,
      }),
      expect.any(String),
    );
    expect(ctx.db.patch).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).toHaveBeenCalledWith('auditLogs', expect.any(Object));
    expect(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST.batchId,
    )).toMatchObject({
      sequence: 11,
      status: 'active',
      consumedUpstreamReceiptDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
      activatedAt: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT + 1,
    });
    expect(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
    )).toEqual(predecessorBefore);
    expect(ctx.tables.clinicalReviewBatches.filter((row) => row.status === 'active')).toHaveLength(1);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(5);
    expect(preservedRows(ctx)).toEqual(preserved);
  });
});
