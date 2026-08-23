import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'owner-user' as string | null }));
vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import { materializeRegisteredReleaseBatches } from '../../../convex/clinicalReviewRegistry';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  frozenClinicalPublicationApproval,
  isRegisteredReleaseContentTarget,
  isRegisteredReleaseSourceId,
} from '../../../convex/lib/clinicalReviewBatchProvenance';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

type Row = Record<string, unknown>;
const originalRegistry = [...CLINICAL_REVIEW_BATCH_REGISTRY] as ClinicalReviewBatchRegistration[];

function context() {
  const tables: Record<string, Row[]> = {
    parentProfiles: [{
      _id: 'owner-profile', _creationTime: 1, userId: 'owner-user', isStaff: true,
      staffRole: 'owner', displayName: 'Owner', staffQualification: 'MEd',
    }],
    clinicalReviewBatches: [], clinicalReviewAssignments: [], auditLogs: [],
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
  return { auth: {}, db: { query, insert }, tables };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;
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
  } = {},
): Promise<ClinicalReviewBatchRegistration> {
  const pilot = originalRegistry[0];
  const item = { ...pilot.manifest.items[0], ordinal: 1, slug };
  Object.assign(item, {
    currentClinicalReviewCount: 0,
    currentClinicalReviewsCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    allClinicalReviewHistoryCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
  });
  const reviewer = { ...pilot.manifest.reviewer, role: options.reviewerRole ?? pilot.manifest.reviewer.role };
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

async function registryDigest() {
  return await sha256Canonical(CLINICAL_REVIEW_BATCH_REGISTRY.map((registration) => ({
    routing: clinicalReviewBatchRoutingPayload(registration),
    routingDigest: registration.routingCanonicalSha256,
  })));
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
    expect(result).toMatchObject({ ok: false, code: 'registered_manifest_invalid', createdBatches: 0, createdAssignments: 0 });
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
      ok: false, code: 'persisted_assignment_preimage_mismatch', createdBatches: 0, createdAssignments: 0,
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
      ok: false, code: 'persisted_batch_preimage_mismatch', createdBatches: 0, createdAssignments: 0,
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
    expect(replay).toMatchObject({ ok: false, code: 'persisted_assignment_preimage_mismatch' });
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
    expect(replay).toMatchObject({ ok: false, code: 'persisted_target_collision' });
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
    expect(rejected).toMatchObject({ ok: false, code: 'registered_reviewer_role_mismatch' });
    expect(rejectedCtx.tables.clinicalReviewBatches).toHaveLength(0);
    expect(rejectedCtx.tables.clinicalReviewAssignments).toHaveLength(0);
  });

  it('rejects a global exact-target collision before any write', async () => {
    const pilot = originalRegistry[0];
    const release = await releaseRegistration('release-collision', pilot.manifest.items[0].slug);
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(release);
    const ctx = context();
    const result = await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    expect(result).toMatchObject({ ok: false, code: 'registered_target_collision' });
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(0);
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(0);
  });
});
