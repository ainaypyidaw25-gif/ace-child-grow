import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'owner-user' as string | null }));
vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import {
  activateRegisteredBatch,
  materializeRegisteredReleaseBatches,
  ownerRegistryStatus,
} from '../../../convex/clinicalReviewRegistry';
import { getOwnerRegistryStatus } from '../../../convex/clinicalReviewBatchActions';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  frozenClinicalDecisionKey,
  frozenClinicalPublicationApproval,
  isRegisteredReleaseContentTarget,
  isRegisteredReleaseSourceId,
} from '../../../convex/lib/clinicalReviewBatchProvenance';
import {
  CLINICAL_REVIEW_BATCH_CONTRACT,
  CLINICAL_REVIEW_BATCH_CONTRACT_VERSION,
} from '../../../convex/lib/clinicalReviewBatchContract';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

type Row = Record<string, unknown>;
const originalRegistry = [...CLINICAL_REVIEW_BATCH_REGISTRY] as ClinicalReviewBatchRegistration[];
const TEST_NOW_MS = new Date('2026-08-24T00:00:00.000Z').getTime();

function ownerStatusArgs(nowMs = TEST_NOW_MS) {
  return { nowMs, todayIso: new Date(nowMs).toISOString().slice(0, 10) };
}

function context() {
  const tables: Record<string, Row[]> = {
    parentProfiles: [{
      _id: 'owner-profile', _creationTime: 1, userId: 'owner-user', isStaff: true,
      staffRole: 'owner', displayName: 'Owner', staffQualification: 'MEd',
    }],
    clinicalReviewBatches: [], clinicalReviewAssignments: [],
    clinicalReviewBatchReceipts: [], contentReviews: [], auditLogs: [],
  };
  const query = vi.fn((table: string) => {
    const builder = (filters: Array<[string, unknown]>) => {
      const rows = () => tables[table].filter((row) => filters.every(([field, value]) => row[field] === value));
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
        withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
          const next = [...filters];
          const q = { eq: (field: string, value: unknown) => { next.push([field, value]); return q; } };
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
    const id = `${table}-${inserted}`;
    tables[table].push({ _id: id, _creationTime: inserted, ...value });
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
  return (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

function actionHandler(fn: unknown) {
  return (fn as {
    _handler: (
      ctx: { runQuery: (reference: unknown, args: Record<string, unknown>) => Promise<unknown> },
      args: Record<string, unknown>,
    ) => Promise<unknown>;
  })._handler;
}

async function releaseRegistration(
  batchId: string,
  slug: string,
  options: {
    sequence?: number;
    previous?: ClinicalReviewBatchRegistration;
    invalidFreeze?: boolean;
    dimension?: ClinicalReviewBatchRegistration['dimension'];
    reviewerRole?: ClinicalReviewBatchRegistration['manifest']['reviewer']['role'];
    reviewerQualification?: string | null;
  } = {},
): Promise<ClinicalReviewBatchRegistration> {
  const pilot = originalRegistry[0];
  const item = { ...pilot.manifest.items[0], ordinal: 1, slug };
  Object.assign(item, {
    currentClinicalReviewCount: 0,
    currentClinicalReviewsCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    allClinicalReviewHistoryCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
  });
  const reviewer = {
    ...pilot.manifest.reviewer,
    role: options.reviewerRole ?? pilot.manifest.reviewer.role,
    qualification: options.reviewerQualification === undefined
      ? pilot.manifest.reviewer.qualification
      : options.reviewerQualification,
  };
  const manifest = { batchId, count: 1, reviewer, items: [item] };
  const freezeDigest = options.invalidFreeze ? '0'.repeat(64) : await sha256Canonical(manifest);
  const activation: ClinicalReviewBatchRegistration['activation'] = options.previous
    ? {
        kind: 'after_handoff',
        previousBatchId: options.previous.manifest.batchId,
        expectedPreviousFreezeDigest: options.previous.freezeDigest,
      }
    : { kind: 'initial' };
  const pending: ClinicalReviewBatchRegistration = {
    sequence: options.sequence ?? 2,
    laneGraphVersion: 1,
    dimension: options.dimension ?? 'clinical',
    authority: 'release',
    activation,
    routingCanonicalSha256: '',
    freezeDigest,
    frozenAt: pilot.frozenAt,
    expiresAt: pilot.expiresAt,
    manifest,
  };
  return {
    ...pending,
    routingCanonicalSha256: await sha256Canonical(clinicalReviewBatchRoutingPayload(pending)),
  };
}

async function registrationWithItemCount(
  release: ClinicalReviewBatchRegistration,
  count: number,
): Promise<ClinicalReviewBatchRegistration> {
  const items = Array.from({ length: count }, (_, index) => ({
    ...release.manifest.items[0],
    ordinal: index + 1,
    slug: `release_slug_${index + 1}`,
  }));
  const manifest = { ...release.manifest, count: items.length, items };
  const pending: ClinicalReviewBatchRegistration = {
    ...release,
    manifest,
    freezeDigest: await sha256Canonical(manifest),
    routingCanonicalSha256: '',
  };
  return {
    ...pending,
    routingCanonicalSha256: await sha256Canonical(clinicalReviewBatchRoutingPayload(pending)),
  };
}

async function registryDigest() {
  return await sha256Canonical(CLINICAL_REVIEW_BATCH_REGISTRY.map((registration) => ({
    routing: clinicalReviewBatchRoutingPayload(registration),
    routingDigest: registration.routingCanonicalSha256,
  })));
}

async function completeRegisteredRelease(
  ctx: ReturnType<typeof context>,
  registration: ClinicalReviewBatchRegistration,
  completedAt: number,
  consumedUpstreamReceiptDigest?: string,
) {
  const batch = ctx.tables.clinicalReviewBatches.find(
    (row) => row.batchId === registration.manifest.batchId,
  );
  const assignment = ctx.tables.clinicalReviewAssignments.find(
    (row) => row.batchId === registration.manifest.batchId,
  );
  expect(batch).toBeDefined();
  expect(assignment).toBeDefined();
  if (!batch || !assignment) throw new Error('Expected materialized release');
  Object.assign(batch, {
    status: 'completed',
    activatedAt: completedAt - 1,
    completedAt,
    ...(consumedUpstreamReceiptDigest ? { consumedUpstreamReceiptDigest } : {}),
  });
  const receiptId = `review-${registration.manifest.batchId}`;
  const item = registration.manifest.items[0];
  const decisionKey = await frozenClinicalDecisionKey(registration, item);
  ctx.tables.contentReviews.push({
    _id: receiptId,
    _creationTime: completedAt,
    decisionKey,
    clinicalReviewBatchId: registration.manifest.batchId,
    contentSlug: item.slug,
    contentVersion: item.reviewRevision,
    reviewRevision: item.reviewRevision,
    dimension: registration.dimension,
    decision: 'approved',
    reviewerId: registration.manifest.reviewer.userId,
    reviewerDisplayName: registration.manifest.reviewer.displayName,
    reviewerQualification: registration.manifest.reviewer.qualification,
    reviewerRole: registration.manifest.reviewer.role,
    reviewedAt: completedAt,
    createdAt: completedAt,
    updatedAt: completedAt,
  });
  const decisions = [{
    assignmentId: decisionKey,
    slug: item.slug,
    reviewRevision: item.reviewRevision,
    receipt: { decision: 'approved', note: null, reviewedAt: completedAt, receiptId },
  }];
  const digest = await sha256Canonical({
    contract: `${CLINICAL_REVIEW_BATCH_CONTRACT}.handoff`,
    contractVersion: CLINICAL_REVIEW_BATCH_CONTRACT_VERSION,
    batchId: registration.manifest.batchId,
    freezeDigest: registration.freezeDigest,
    decisionCount: decisions.length,
    completedAt,
    decisions,
  });
  const freezeReceiptDigest = await sha256Canonical({
    contract: CLINICAL_REVIEW_BATCH_CONTRACT,
    contractVersion: CLINICAL_REVIEW_BATCH_CONTRACT_VERSION,
    batchId: registration.manifest.batchId,
    freezeDigest: registration.freezeDigest,
    frozenAt: registration.frozenAt,
    expiresAt: registration.expiresAt,
    reviewer: registration.manifest.reviewer,
  });
  const receiptDigest = await sha256Canonical({
    digest,
    freezeReceiptDigest,
    reviewerUserId: registration.manifest.reviewer.userId,
  });
  ctx.tables.clinicalReviewBatchReceipts.push({
    _id: `receipt-${registration.manifest.batchId}`,
    _creationTime: completedAt,
    batchId: registration.manifest.batchId,
    freezeDigest: registration.freezeDigest,
    reviewerId: registration.manifest.reviewer.userId,
    decisionCount: decisions.length,
    completedAt,
    digest,
    receiptDigest,
    authority: registration.authority,
    createdAt: completedAt,
  });
  return receiptDigest;
}

describe('persisted clinical review registry', () => {
  beforeEach(() => {
    authState.userId = 'owner-user';
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.splice(0, registry.length, originalRegistry[0]);
  });
  afterEach(() => {
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.splice(0, registry.length, ...originalRegistry);
    vi.restoreAllMocks();
  });

  it('materializes an exact release manifest only after the complete read pass', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    const result = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(result).toMatchObject({ ok: true, createdBatches: 1, createdAssignments: 1 });
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(1);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(1);
  });

  it('keeps the registry status owner-only and reads no database rows when unauthenticated', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    authState.userId = null;
    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).rejects.toThrow('Not authenticated');
    expect(ctx.db.query).not.toHaveBeenCalled();
  });

  it('fails closed for a non-owner before reading registry tables', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    ctx.tables.parentProfiles[0].staffRole = 'clinical_reviewer';
    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).rejects.toThrow('Insufficient staff permission');
    expect(ctx.db.query).toHaveBeenCalledTimes(1);
    expect(ctx.db.query).toHaveBeenCalledWith('parentProfiles');
  });

  it('rejects direct activation for a non-owner before registry reads or writes', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    ctx.tables.parentProfiles[0].staffRole = 'clinical_reviewer';
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: release.manifest.batchId,
      expectedFreezeDigest: release.freezeDigest,
    })).rejects.toThrow('Insufficient staff permission');
    expect(ctx.db.query).toHaveBeenCalledTimes(1);
    expect(ctx.db.query).toHaveBeenCalledWith('parentProfiles');
    expect(ctx.db.patch).not.toHaveBeenCalled();
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it('injects only the server clock through the public owner-status action', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(TEST_NOW_MS);
    const expected = { marker: 'internal-owner-status' };
    const runQuery = vi.fn(async () => expected);
    await expect(actionHandler(getOwnerRegistryStatus)({ runQuery }, {})).resolves.toBe(expected);
    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(runQuery).toHaveBeenCalledWith(expect.anything(), ownerStatusArgs());
  });

  it('fails closed when the internal status clock and UTC date disagree', async () => {
    const ctx = context();
    await expect(handler(ownerRegistryStatus)(ctx, {
      nowMs: TEST_NOW_MS,
      todayIso: '2026-08-25',
    })).rejects.toThrow('Invalid server clock');
    expect(ctx.db.query).toHaveBeenCalledTimes(1);
    expect(ctx.db.query).toHaveBeenCalledWith('parentProfiles');
  });

  it('rejects the public owner-status action before its internal query when unauthenticated', async () => {
    authState.userId = null;
    const runQuery = vi.fn();
    await expect(actionHandler(getOwnerRegistryStatus)({ runQuery }, {})).rejects.toThrow('Not authenticated');
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('rejects a 26-item release in status and direct materialization before operational reads or writes', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    const oversized = await registrationWithItemCount(release, 26);
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(oversized);
    const ctx = context();

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      registryCode: 'invalid',
      materializationCode: 'blocked_persisted_mismatch',
      registeredReleaseCount: 1,
      persistedBatchCount: 0,
      persistedAssignmentCount: 0,
      releases: [],
      currentActivation: null,
    });
    expect(ctx.db.query).toHaveBeenCalledTimes(1);
    expect(ctx.db.query).toHaveBeenCalledWith('parentProfiles');

    ctx.db.query.mockClear();
    ctx.db.insert.mockClear();
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: false,
      code: 'registered_registry_invalid',
      createdBatches: 0,
      createdAssignments: 0,
    });
    expect(ctx.db.query).toHaveBeenCalledTimes(1);
    expect(ctx.db.query).toHaveBeenCalledWith('parentProfiles');
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(0);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(0);

    ctx.db.query.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: oversized.manifest.batchId,
      expectedFreezeDigest: oversized.freezeDigest,
    })).resolves.toMatchObject({
      ok: false,
      code: 'registered_registry_invalid',
      batchId: oversized.manifest.batchId,
    });
    expect(ctx.db.query).toHaveBeenCalledTimes(1);
    expect(ctx.db.query).toHaveBeenCalledWith('parentProfiles');
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it('accepts the shared 25-item registry boundary for status and materialization', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    const bounded = await registrationWithItemCount(release, 25);
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(bounded);
    const ctx = context();

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      registryCode: 'valid',
      registeredReleaseCount: 1,
      releases: [{ batchId: 'release-1', itemCount: 25, readinessCode: 'not_materialized' }],
    });
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: true,
      createdBatches: 1,
      createdAssignments: 25,
    });
  });

  it('returns only bounded release metadata before materialization', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    const result = await handler(ownerRegistryStatus)(ctx, ownerStatusArgs()) as Record<string, unknown>;
    expect(result).toMatchObject({
      registryDigest: await registryDigest(),
      registryCode: 'valid',
      materializationCode: 'materialization_required',
      registeredReleaseCount: 1,
      persistedBatchCount: 0,
      persistedAssignmentCount: 0,
      currentActivation: null,
      releases: [{
        batchId: 'release-1',
        persistedStatus: null,
        persistedBatchRows: 0,
        persistedAssignmentRows: 0,
        readinessCode: 'not_materialized',
      }],
    });
    expect(JSON.stringify(result)).not.toContain('sourceIds');
    expect(JSON.stringify(result)).not.toContain('https://');
    expect(JSON.stringify(result)).not.toContain('contentCanonicalSha256');
  });

  it('replays exact materialization idempotently without inserting duplicate rows', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    const args = { expectedRegistryDigest: await registryDigest() };
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, args)).resolves.toMatchObject({
      ok: true, createdBatches: 1, createdAssignments: 1,
    });
    ctx.db.insert.mockClear();
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, args)).resolves.toMatchObject({
      ok: true, createdBatches: 0, createdAssignments: 0,
    });
    expect(ctx.db.insert).toHaveBeenCalledTimes(1);
    expect(ctx.db.insert).toHaveBeenCalledWith('auditLogs', expect.any(Object));
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(1);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(1);
  });

  it('blocks direct activation when any unrelated registered release is invalid', async () => {
    const first = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(first);
    const ctx = context();
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({ ok: true, createdBatches: 1, createdAssignments: 1 });

    const invalidUnrelated = await releaseRegistration('release-2', 'release_slug_2', {
      sequence: 3,
      previous: first,
      invalidFreeze: true,
    });
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(invalidUnrelated);
    ctx.db.insert.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: first.manifest.batchId,
      expectedFreezeDigest: first.freezeDigest,
    })).resolves.toMatchObject({
      ok: false,
      code: 'registered_registry_invalid',
      batchId: first.manifest.batchId,
    });
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({ status: 'frozen' });
  });

  it('bounds assignment inspection at expected count plus one and blocks overflow', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewAssignments.push({
      ...ctx.tables.clinicalReviewAssignments[0],
      _id: 'overflow-assignment',
      assignmentId: 'overflow-assignment',
    });
    const result = await handler(ownerRegistryStatus)(ctx, ownerStatusArgs()) as Record<string, unknown>;
    expect(result).toMatchObject({
      materializationCode: 'blocked_persisted_mismatch',
      persistedAssignmentCount: 2,
      releases: [{
        batchId: 'release-1',
        persistedAssignmentRows: 2,
        assignmentsExact: false,
        readinessCode: 'blocked_assignment_mismatch',
      }],
      currentActivation: null,
    });
  });

  it('blocks a globally duplicated assignment id and semantic target', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewAssignments.push({
      ...ctx.tables.clinicalReviewAssignments[0],
      _id: 'duplicate-global-assignment',
      batchId: 'unregistered-batch',
    });

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      materializationCode: 'blocked_persisted_mismatch',
      persistedAssignmentCount: 1,
      releases: [{
        batchId: 'release-1',
        persistedAssignmentRows: 1,
        assignmentsExact: false,
        readinessCode: 'blocked_assignment_mismatch',
      }],
      currentActivation: null,
    });
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: release.manifest.batchId,
      expectedFreezeDigest: release.freezeDigest,
    })).resolves.toMatchObject({
      ok: false,
      code: 'persisted_registry_state_mismatch',
      batchId: release.manifest.batchId,
    });
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it.each(['active', 'completed'] as const)(
    'never fills a missing assignment after a batch becomes %s',
    async (persistedStatus) => {
      const release = await releaseRegistration('release-1', 'release_slug_1');
      (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
      const ctx = context();
      await handler(materializeRegisteredReleaseBatches)(ctx, {
        expectedRegistryDigest: await registryDigest(),
      });
      ctx.tables.clinicalReviewBatches[0].status = persistedStatus;
      ctx.tables.clinicalReviewAssignments.splice(0);

      await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
        materializationCode: 'blocked_persisted_mismatch',
        releases: [{ readinessCode: 'blocked_assignment_mismatch', assignmentsExact: false }],
        currentActivation: null,
      });
      ctx.db.insert.mockClear();
      await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
        expectedRegistryDigest: await registryDigest(),
      })).resolves.toMatchObject({
        ok: false,
        code: 'persisted_registry_state_mismatch',
        createdBatches: 0,
        createdAssignments: 0,
      });
      expect(ctx.db.insert).not.toHaveBeenCalled();
      expect(ctx.tables.clinicalReviewAssignments).toHaveLength(0);
    },
  );

  it.each(['frozen', 'active', 'completed'] as const)(
    'rejects an orphan %s successor instead of backfilling its missing predecessor',
    async (successorStatus) => {
      const first = await releaseRegistration('release-1', 'release_slug_1');
      const second = await releaseRegistration('release-2', 'release_slug_2', {
        sequence: 3,
        previous: first,
      });
      const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
      registry.push(first, second);
      const ctx = context();
      await handler(materializeRegisteredReleaseBatches)(ctx, {
        expectedRegistryDigest: await registryDigest(),
      });
      ctx.tables.clinicalReviewBatches.splice(0, 1);
      ctx.tables.clinicalReviewAssignments.splice(0, 1);
      Object.assign(ctx.tables.clinicalReviewBatches[0], {
        status: successorStatus,
        ...(successorStatus === 'frozen' ? {} : { activatedAt: TEST_NOW_MS - 1_000 }),
        ...(successorStatus === 'completed' ? { completedAt: TEST_NOW_MS } : {}),
      });

      await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
        materializationCode: 'blocked_persisted_mismatch',
        releases: [
          { batchId: first.manifest.batchId, readinessCode: 'blocked_persisted_mismatch' },
          { batchId: second.manifest.batchId, readinessCode: 'blocked_persisted_mismatch' },
        ],
        currentActivation: null,
      });
      ctx.db.insert.mockClear();
      ctx.db.patch.mockClear();
      await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
        expectedRegistryDigest: await registryDigest(),
      })).resolves.toMatchObject({
        ok: false,
        code: 'persisted_registry_state_mismatch',
        batchId: second.manifest.batchId,
        createdBatches: 0,
        createdAssignments: 0,
      });
      expect(ctx.db.insert).not.toHaveBeenCalled();
      expect(ctx.db.patch).not.toHaveBeenCalled();
      expect(ctx.tables.clinicalReviewBatches).toHaveLength(1);
      expect(ctx.tables.clinicalReviewAssignments).toHaveLength(1);

      await expect(handler(activateRegisteredBatch)(ctx, {
        batchId: second.manifest.batchId,
        expectedFreezeDigest: second.freezeDigest,
        expectedUpstreamReceiptDigest: 'f'.repeat(64),
      })).resolves.toMatchObject({ ok: false });
      expect(ctx.db.patch).not.toHaveBeenCalled();
    },
  );

  it('rejects direct root activation when a downstream persisted release follows an absent gap', async () => {
    const first = await releaseRegistration('release-1', 'release_slug_1');
    const second = await releaseRegistration('release-2', 'release_slug_2', {
      sequence: 3,
      previous: first,
    });
    const third = await releaseRegistration('release-3', 'release_slug_3', {
      sequence: 4,
      previous: second,
    });
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.push(first, second, third);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    const missingBatchIndex = ctx.tables.clinicalReviewBatches.findIndex(
      (row) => row.batchId === second.manifest.batchId,
    );
    const missingAssignmentIndex = ctx.tables.clinicalReviewAssignments.findIndex(
      (row) => row.batchId === second.manifest.batchId,
    );
    expect(missingBatchIndex).toBeGreaterThanOrEqual(0);
    expect(missingAssignmentIndex).toBeGreaterThanOrEqual(0);
    ctx.tables.clinicalReviewBatches.splice(missingBatchIndex, 1);
    ctx.tables.clinicalReviewAssignments.splice(missingAssignmentIndex, 1);

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      materializationCode: 'blocked_persisted_mismatch',
      currentActivation: null,
    });
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: first.manifest.batchId,
      expectedFreezeDigest: first.freezeDigest,
    })).resolves.toMatchObject({
      ok: false,
      code: 'persisted_registry_state_mismatch',
      batchId: first.manifest.batchId,
    });
    expect(ctx.db.patch).not.toHaveBeenCalled();
    expect(ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === first.manifest.batchId,
    )).toMatchObject({ status: 'frozen' });
  });

  it('rejects an extra batch-local assignment instead of filling its missing expected row', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    Object.assign(ctx.tables.clinicalReviewAssignments[0], {
      assignmentId: 'unexpected-batch-local-assignment',
      ordinal: 2,
    });
    ctx.db.insert.mockClear();

    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: false,
      code: 'persisted_registry_state_mismatch',
      createdBatches: 0,
      createdAssignments: 0,
    });
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(1);
    expect(ctx.tables.clinicalReviewAssignments[0]).toMatchObject({
      assignmentId: 'unexpected-batch-local-assignment',
    });
  });

  it('does not materialize a frozen batch around an orphan receipt', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    ctx.tables.clinicalReviewBatchReceipts.push({
      _id: 'orphan-receipt',
      _creationTime: 1,
      batchId: release.manifest.batchId,
    });

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      materializationCode: 'blocked_persisted_mismatch',
      currentActivation: null,
    });
    ctx.db.insert.mockClear();
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: false,
      code: 'persisted_registry_state_mismatch',
      createdBatches: 0,
      createdAssignments: 0,
    });
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(0);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(0);
  });

  it('requires a clean frozen lifecycle before readiness or direct activation', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewBatches[0].consumedUpstreamReceiptDigest = 'f'.repeat(64);

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      materializationCode: 'blocked_persisted_mismatch',
      releases: [{ readinessCode: 'blocked_persisted_mismatch' }],
      currentActivation: null,
    });
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: release.manifest.batchId,
      expectedFreezeDigest: release.freezeDigest,
    })).resolves.toMatchObject({ ok: false, code: 'persisted_registry_state_mismatch' });
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('rejects a successor when the completed predecessor upstream chain was tampered', async () => {
    const first = await releaseRegistration('release-1', 'release_slug_1');
    const second = await releaseRegistration('release-2', 'release_slug_2', {
      sequence: 3,
      previous: first,
    });
    const third = await releaseRegistration('release-3', 'release_slug_3', {
      sequence: 4,
      previous: second,
    });
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.push(first, second, third);
    const ctx = context();
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({ ok: true, createdBatches: 3, createdAssignments: 3 });
    const firstReceipt = await completeRegisteredRelease(ctx, first, TEST_NOW_MS - 2_000);
    const secondReceipt = await completeRegisteredRelease(ctx, second, TEST_NOW_MS - 1_000, firstReceipt);
    const secondBatch = ctx.tables.clinicalReviewBatches.find(
      (row) => row.batchId === second.manifest.batchId,
    );
    expect(secondBatch).toBeDefined();
    if (!secondBatch) return;
    secondBatch.consumedUpstreamReceiptDigest = '0'.repeat(64);

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      currentActivation: null,
      releases: [
        expect.any(Object),
        expect.any(Object),
        { batchId: third.manifest.batchId, readinessCode: 'blocked_predecessor_mismatch' },
      ],
    });
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: third.manifest.batchId,
      expectedFreezeDigest: third.freezeDigest,
      expectedUpstreamReceiptDigest: secondReceipt,
    })).resolves.toMatchObject({ ok: false, code: 'upstream_handoff_missing' });
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('commits zero registry writes when a later registration is invalid', async () => {
    const first = await releaseRegistration('release-1', 'release_slug_1');
    const second = await releaseRegistration('release-2', 'release_slug_2', {
      sequence: 3,
      previous: first,
      invalidFreeze: true,
    });
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.push(first, second);
    const ctx = context();
    const result = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(result).toMatchObject({ ok: false, code: 'registered_registry_invalid', createdBatches: 0, createdAssignments: 0 });
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(0);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(0);
  });

  it('replays idempotently but performs zero writes when a persisted assignment drifts', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewAssignments[0].contentCanonicalSha256 = 'drifted';
    ctx.db.insert.mockClear();
    const replay = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(replay).toMatchObject({
      ok: false, code: 'persisted_registry_state_mismatch', createdBatches: 0, createdAssignments: 0,
    });
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['reviewerDisplayName', 'Drifted reviewer'],
    ['reviewerQualification', 'Drifted qualification'],
    ['reviewerRole', 'evidence_reviewer'],
    ['createdAt', 999],
  ] as const)('rejects persisted batch %s drift before any replay write', async (field, value) => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewBatches[0][field] = value;
    ctx.db.insert.mockClear();
    const replay = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(replay).toMatchObject({
      ok: false, code: 'persisted_registry_state_mismatch', createdBatches: 0, createdAssignments: 0,
    });
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it('rejects persisted assignment createdAt drift before any replay write', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewAssignments[0].createdAt = 999;
    ctx.db.insert.mockClear();
    const replay = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(replay).toMatchObject({ ok: false, code: 'persisted_registry_state_mismatch' });
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it('always checks the exact target even when the assignment id already exists', async () => {
    const release = await releaseRegistration('release-1', 'release_slug_1');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewAssignments.push({
      ...ctx.tables.clinicalReviewAssignments[0],
      _id: 'colliding-target-row',
      assignmentId: 'different-assignment-id',
      batchId: 'different-batch',
    });
    ctx.db.insert.mockClear();
    const replay = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(replay).toMatchObject({ ok: false, code: 'persisted_registry_state_mismatch' });
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it('treats pilot history as non-authoritative and materializes an initial release root', async () => {
    const firstRelease = await releaseRegistration('release-root', 'release_root_slug');
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.push(firstRelease);
    const ctx = context();
    const result = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(result).toMatchObject({ ok: true, createdBatches: 1, createdAssignments: 1 });
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({
      batchId: 'release-root', authority: 'release', activationKind: 'initial', status: 'frozen',
    });
    expect(ctx.tables.clinicalReviewBatches.some((row) => row.authority === 'pilot')).toBe(false);
  });

  it('keeps a materialized governed slug blocked after its revision changes', async () => {
    const firstRelease = await releaseRegistration('release-root', 'governed_slug');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(firstRelease);
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    await expect(frozenClinicalPublicationApproval(ctx as never, {
      slug: 'governed_slug', reviewRevision: firstRelease.manifest.items[0].reviewRevision + 1,
    })).resolves.toEqual({
      required: true,
      allowed: false,
      missing: ['clinical:registered_revision_mismatch'],
      governedDimensions: ['clinical'],
    });
  });

  it('marks frozen release content, links, and sources as protected from generic import lanes', async () => {
    const firstRelease = await releaseRegistration('release-root', 'governed_slug');
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(firstRelease);
    expect(isRegisteredReleaseContentTarget(firstRelease.manifest.items[0].kind, 'governed_slug')).toBe(true);
    expect(isRegisteredReleaseSourceId(firstRelease.manifest.items[0].sourceIds[0])).toBe(true);
    expect(isRegisteredReleaseContentTarget('guide', 'unrelated_slug')).toBe(false);
    expect(isRegisteredReleaseSourceId('unrelated-source')).toBe(false);
  });

  it('accepts evidence-reviewer assignments only for the evidence dimension', async () => {
    const evidence = await releaseRegistration('evidence-root', 'evidence_slug', {
      dimension: 'evidence', reviewerRole: 'evidence_reviewer',
    });
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.push(evidence);
    const ctx = context();
    const accepted = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(accepted).toMatchObject({ ok: true, createdBatches: 1, createdAssignments: 1 });
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({
      dimension: 'evidence', reviewerRole: 'evidence_reviewer',
    });

    registry.splice(1, 1, await releaseRegistration('clinical-mismatch', 'clinical_slug', {
      reviewerRole: 'evidence_reviewer',
    }));
    const rejectedCtx = context();
    const rejected = await handler(materializeRegisteredReleaseBatches)(rejectedCtx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(rejected).toMatchObject({ ok: false, code: 'registered_registry_invalid' });
    expect(rejectedCtx.tables.clinicalReviewBatches).toHaveLength(0);
    expect(rejectedCtx.tables.clinicalReviewAssignments).toHaveLength(0);
  });

  it('accepts an unqualified language reviewer only for a language dimension', async () => {
    const language = await releaseRegistration('language-root', 'language_slug', {
      dimension: 'native_myanmar',
      reviewerRole: 'language_reviewer',
      reviewerQualification: null,
    });
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.push(language);
    const ctx = context();
    const accepted = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(accepted).toMatchObject({ ok: true, createdBatches: 1, createdAssignments: 1 });
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({
      dimension: 'native_myanmar', reviewerRole: 'language_reviewer',
    });
    expect(ctx.tables.clinicalReviewBatches[0].reviewerQualification).toBeUndefined();

    registry.splice(1, 1, await releaseRegistration('language-mismatch', 'evidence_slug', {
      dimension: 'evidence',
      reviewerRole: 'language_reviewer',
      reviewerQualification: null,
    }));
    const rejectedCtx = context();
    const rejected = await handler(materializeRegisteredReleaseBatches)(rejectedCtx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(rejected).toMatchObject({ ok: false, code: 'registered_registry_invalid' });
    expect(rejectedCtx.tables.clinicalReviewBatches).toHaveLength(0);
  });

  it('rejects a global exact-target collision before any write', async () => {
    const pilot = originalRegistry[0];
    const release = await releaseRegistration('release-collision', pilot.manifest.items[0].slug);
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    const result = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(result).toMatchObject({ ok: false, code: 'registered_registry_invalid' });
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(0);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(0);
  });
});
