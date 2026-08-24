import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/clinicalReviewBatch', () => ({
  registeredBatchActivationBlockers: vi.fn(async () => []),
}));

vi.mock('../../../convex/lib/auth', () => ({
  requireOwner: vi.fn(async () => 'owner-user-id'),
}));

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      if (Array.isArray(value) && value.length > 0) {
        const marked = value.find((entry) => (
          typeof entry === 'object' && entry !== null
          && '__collectionCanonicalSha256' in entry
        )) as { __collectionCanonicalSha256?: string } | undefined;
        if (marked?.__collectionCanonicalSha256) return marked.__collectionCanonicalSha256;
      }
      const marked = value as { __exactCanonicalSha256?: string };
      if (marked?.__exactCanonicalSha256) return marked.__exactCanonicalSha256;
      return await actual.sha256Canonical(value);
    }),
  };
});

import { apply, preflightAt } from '../../../convex/clinicalRefreezeRegistryMigration';
import { registeredBatchActivationBlockers } from '../../../convex/clinicalReviewBatch';
import {
  activateRegisteredBatch,
  ownerRegistryStatus,
} from '../../../convex/clinicalReviewRegistry';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_INITIAL_RELEASE_BATCH_ID,
  CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
  CLINICAL_NEWBORN_REFREEZE_BATCH_EXPIRES_AT,
  CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
  CLINICAL_NUTRITION_RELEASE_BATCH_ID,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';
import {
  exactClinicalReviewUpstreamChain,
  frozenClinicalDecisionKey,
} from '../../../convex/lib/clinicalReviewBatchProvenance';
import {
  CLINICAL_REFREEZE_CORRECTION_AUDIT,
  CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
  CLINICAL_REFREEZE_REGISTRY_PREIMAGE,
} from '../../../convex/lib/clinicalRefreezeRegistryMigrationData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as { _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

function registration(batchId: string) {
  const row = CLINICAL_REVIEW_BATCH_REGISTRY.find((candidate) => candidate.manifest.batchId === batchId);
  if (!row) throw new Error(`missing registration ${batchId}`);
  return row as ClinicalReviewBatchRegistration;
}

function upstreamDigest(row: ClinicalReviewBatchRegistration) {
  if (row.activation.kind === 'initial') return undefined;
  return row.activation.kind === 'after_handoff'
    ? row.activation.expectedPreviousFreezeDigest
    : row.activation.expectedDecisionSetDigest;
}

function batchRow(row: ClinicalReviewBatchRegistration): Row {
  return {
    _id: `batch:${row.manifest.batchId}`,
    _creationTime: row.frozenAt + 0.1,
    batchId: row.manifest.batchId,
    sequence: row.sequence,
    laneGraphVersion: row.laneGraphVersion,
    dimension: row.dimension,
    authority: row.authority,
    status: 'frozen',
    freezeDigest: row.freezeDigest,
    routingDigest: row.routingCanonicalSha256,
    itemCount: row.manifest.count,
    frozenAt: row.frozenAt,
    expiresAt: row.expiresAt,
    reviewerProfileId: row.manifest.reviewer.profileId,
    reviewerId: row.manifest.reviewer.userId,
    reviewerDisplayName: row.manifest.reviewer.displayName,
    reviewerQualification: row.manifest.reviewer.qualification,
    reviewerRole: row.manifest.reviewer.role,
    reviewerIdentityDigest: row.manifest.reviewer.identityCanonicalSha256,
    activationKind: row.activation.kind,
    ...(row.activation.kind === 'initial' ? {} : { predecessorBatchId: row.activation.previousBatchId }),
    ...(upstreamDigest(row) ? { expectedUpstreamStateDigest: upstreamDigest(row) } : {}),
    createdAt: row.frozenAt,
  };
}

async function assignmentRow(row: ClinicalReviewBatchRegistration, item: ClinicalReviewBatchRegistration['manifest']['items'][number]): Promise<Row> {
  return {
    _id: `assignment:${row.manifest.batchId}:${item.ordinal}`,
    _creationTime: row.frozenAt + item.ordinal / 10,
    batchId: row.manifest.batchId,
    assignmentId: await frozenClinicalDecisionKey(row, item),
    ordinal: item.ordinal,
    dimension: row.dimension,
    kind: item.kind,
    contentSlug: item.slug,
    reviewRevision: item.reviewRevision,
    contentId: item.contentId,
    contentCreationTime: item.contentCreationTime,
    contentUpdatedAt: item.contentUpdatedAt,
    contentCanonicalSha256: item.contentCanonicalSha256,
    linkId: item.linkId,
    linkCreationTime: item.linkCreationTime,
    linkUpdatedAt: item.linkUpdatedAt,
    linkCanonicalSha256: item.linkCanonicalSha256,
    sourceIds: [...item.sourceIds],
    sourceCount: item.sourceCount,
    sourcesCanonicalSha256: item.sourcesCanonicalSha256,
    mediaCount: item.mediaCount,
    mediaCanonicalSha256: item.mediaCanonicalSha256,
    aiCanonicalSha256: item.aiCanonicalSha256,
    currentClinicalReviewCount: item.currentClinicalReviewCount ?? 0,
    currentClinicalReviewsCanonicalSha256: item.currentClinicalReviewsCanonicalSha256 ?? '',
    allClinicalReviewHistoryCanonicalSha256: item.allClinicalReviewHistoryCanonicalSha256 ?? '',
    upstreamReviewDigests: structuredClone(item.upstreamReviewDigests ?? []),
    createdAt: row.frozenAt,
  };
}

async function exactContext() {
  const root = registration(CLINICAL_INITIAL_RELEASE_BATCH_ID);
  const nutrition = registration(CLINICAL_NUTRITION_RELEASE_BATCH_ID);
  const safety = registration(CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID);
  const batches = [batchRow(root), batchRow(nutrition), batchRow(safety)];
  Object.assign(batches[0], {
    status: 'stopped_changes_requested',
    activatedAt: 1_787_566_511_787,
    __collectionCanonicalSha256: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.batchesCanonicalSha256,
  });
  Object.assign(batches[1], {
    sequence: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionSequence,
    routingDigest: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionRoutingDigest,
    predecessorBatchId: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionPredecessorBatchId,
    expectedUpstreamStateDigest: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionExpectedUpstreamStateDigest,
  });
  Object.assign(batches[2], {
    sequence: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.safetySequence,
    routingDigest: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.safetyRoutingDigest,
  });

  const assignments: Row[] = [];
  for (const row of [root, nutrition, safety]) {
    for (const item of row.manifest.items) assignments.push(await assignmentRow(row, item));
  }
  assignments[0].__collectionCanonicalSha256 =
    CLINICAL_REFREEZE_REGISTRY_PREIMAGE.assignmentsCanonicalSha256;

  const rootAssignmentIds = await Promise.all(root.manifest.items.map(
    async (item) => await frozenClinicalDecisionKey(root, item),
  ));
  const contentReviews: Row[] = [
    {
      _id: 'nn7cr0zpahffckza48vxt0cqq18d2j00',
      _creationTime: 1_787_577_658_243.519,
      clinicalReviewBatchId: root.manifest.batchId,
      contentSlug: 'act_skin_to_skin_calm',
      contentVersion: 2,
      createdAt: 1_787_577_658_243,
      decision: 'changes_requested',
      decisionKey: rootAssignmentIds[0],
      dimension: 'clinical',
      note: 'WHO ရင်းမြစ်များသည် မီးဖွား/မွေးကင်းစ ကျန်းမာရေးဌာနအတွင်း ချက်ချင်း skin-to-skin နှင့် နို့တိုက်ပံ့ပိုးမှုကိုသာ တိုက်ရိုက်ထောက်ခံပါသည်။ အိမ်တွင် ထပ်ခါတလဲလဲ calming အဖြစ် သုံးခြင်းနှင့် “Feeding often becomes easier” ဟူသော outcome ကို တိုက်ရိုက်မထောက်ခံသေးပါ။ Outcome ကို bonding/settling အထိ ကျဉ်းစေပြီး နို့တိုက်ကျွေးမှု claim ကို ဖယ်ရှားပါ သို့မဟုတ် အိမ်တွင်းထပ်ခါတလဲလဲ အသုံးပြုမှုကို တိုက်ရိုက်ထောက်ခံသည့် ရင်းမြစ် ထပ်ချိတ်ပါ။',
      reviewRevision: 2,
      reviewedAt: 1_787_577_658_243,
      updatedAt: 1_787_577_658_243,
      reviewerDisplayName: 'Phyo Ko Ko',
      reviewerId: root.manifest.reviewer.userId,
      reviewerQualification: 'MBBS',
      reviewerRole: 'clinical_reviewer',
    },
    {
      _id: 'nn70mzzyxwgy8606p34mpszew58d3bvy',
      _creationTime: 1_787_577_617_519.2214,
      clinicalReviewBatchId: root.manifest.batchId,
      contentSlug: 'gd_birth_2m_sleep',
      contentVersion: 3,
      createdAt: 1_787_577_617_520,
      decision: 'approved',
      decisionKey: rootAssignmentIds[1],
      dimension: 'clinical',
      reviewRevision: 3,
      reviewedAt: 1_787_577_617_520,
      updatedAt: 1_787_577_617_520,
      reviewerDisplayName: 'Phyo Ko Ko',
      reviewerId: root.manifest.reviewer.userId,
      reviewerQualification: 'MBBS',
      reviewerRole: 'clinical_reviewer',
    },
  ];
  const auditLogs: Row[] = [{
    _id: CLINICAL_REFREEZE_CORRECTION_AUDIT.id,
    _creationTime: CLINICAL_REFREEZE_CORRECTION_AUDIT.creationTime,
    action: CLINICAL_REFREEZE_CORRECTION_AUDIT.action,
    entityTable: 'libraryContent',
    result: 'ok',
    summary: '2026-08-24-skin-to-skin-refreeze-correction-v1',
    __exactCanonicalSha256: CLINICAL_REFREEZE_CORRECTION_AUDIT.canonicalSha256,
  }];
  const tables: Record<string, Row[]> = {
    clinicalReviewBatches: batches,
    clinicalReviewAssignments: assignments,
    clinicalReviewBatchReceipts: [],
    contentReviews,
    auditLogs,
  };
  let insertNo = 0;
  const writes: Array<{ op: string; table?: string; id?: unknown }> = [];
  const db = {
    query(table: string) {
      const filters: Array<[string, unknown]> = [];
      const builder = {
        withIndex(_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) {
          const q = { eq(field: string, value: unknown) { filters.push([field, value]); return q; } };
          callback(q);
          return builder;
        },
        async take(limit: number) {
          return (tables[table] ?? []).filter((row) => filters.every(([key, value]) => row[key] === value)).slice(0, limit);
        },
      };
      return builder;
    },
    async insert(table: string, value: Row) {
      insertNo += 1;
      const row = { _id: `${table}:inserted:${insertNo}`, _creationTime: 1_787_581_500_000 + insertNo / 10, ...structuredClone(value) };
      (tables[table] ??= []).push(row);
      writes.push({ op: 'insert', table, id: row._id });
      return row._id;
    },
    async patch(id: unknown, patch: Row) {
      for (const rows of Object.values(tables)) {
        const row = rows.find((candidate) => candidate._id === id);
        if (row) { Object.assign(row, structuredClone(patch)); writes.push({ op: 'patch', id }); return; }
      }
      throw new Error(`missing patch row ${String(id)}`);
    },
  };
  return { ctx: { db }, tables, writes };
}

afterEach(() => vi.restoreAllMocks());

describe('clinical refreeze registry migration', () => {
  it('atomically inserts the refreeze batch and rewires only downstream registry metadata', async () => {
    const state = await exactContext();
    const ready = await registeredHandler(preflightAt)(state.ctx, {
      nowMs: 1_787_581_400_000,
      todayIso: '2026-08-24',
    }) as { phase: string; blockers: string[] };
    expect(ready).toMatchObject({ phase: 'ready', blockers: [] });

    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    const first = await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    }) as Record<string, unknown>;
    expect(first).toMatchObject({
      applied: true,
      alreadyApplied: false,
      batchesInserted: 1,
      assignmentsInserted: 2,
      batchesRewired: 2,
      dataRowsChanged: 5,
      publicationDecisionMade: false,
    });
    expect(state.tables.clinicalReviewBatches).toHaveLength(4);
    expect(state.tables.clinicalReviewAssignments).toHaveLength(16);
    expect(state.tables.clinicalReviewBatchReceipts).toHaveLength(0);
    expect(state.tables.clinicalReviewBatches.find((row) => row.batchId === CLINICAL_NEWBORN_REFREEZE_BATCH_ID))
      .toMatchObject({ status: 'frozen', sequence: 3, activationKind: 'after_changes_requested_refreeze' });
    expect(state.tables.clinicalReviewBatches.find((row) => row.batchId === CLINICAL_NUTRITION_RELEASE_BATCH_ID))
      .toMatchObject({ sequence: 4, predecessorBatchId: CLINICAL_NEWBORN_REFREEZE_BATCH_ID });
    expect(state.tables.clinicalReviewBatches.find((row) => row.batchId === CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID))
      .toMatchObject({ sequence: 5 });
    expect(state.tables.clinicalReviewBatches.find((row) => row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID))
      .toMatchObject({ status: 'stopped_changes_requested' });

    const writesAfterFirst = state.writes.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({ applied: false, alreadyApplied: true, dataRowsChanged: 0 });
    expect(state.writes).toHaveLength(writesAfterFirst);
  });

  it('allows only the exact refreeze batch to activate after migration', async () => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });

    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_600_000);
    const refreeze = registration(CLINICAL_NEWBORN_REFREEZE_BATCH_ID);
    const activated = await registeredHandler(activateRegisteredBatch)(state.ctx, {
      batchId: refreeze.manifest.batchId,
      expectedFreezeDigest: refreeze.freezeDigest,
      expectedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
    });

    expect(activated).toMatchObject({
      ok: true,
      code: 'activated',
      batchId: CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
    });
    expect(state.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
    )).toMatchObject({
      status: 'active',
      activatedAt: 1_787_581_600_000,
      consumedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
    });
    expect(state.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID,
    )).toMatchObject({ status: 'stopped_changes_requested' });
    expect(state.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_NUTRITION_RELEASE_BATCH_ID,
    )).toMatchObject({ status: 'frozen' });
    expect(state.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
    )).toMatchObject({ status: 'frozen' });

    const writesAfterActivation = state.writes.length;
    const replay = await registeredHandler(activateRegisteredBatch)(state.ctx, {
      batchId: refreeze.manifest.batchId,
      expectedFreezeDigest: refreeze.freezeDigest,
      expectedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
    });
    expect(replay).toMatchObject({ ok: false, code: 'batch_not_frozen' });
    expect(state.writes).toHaveLength(writesAfterActivation);
  });

  it('exposes only the exact actionable refreeze tuple after migration', async () => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    const refreeze = registration(CLINICAL_NEWBORN_REFREEZE_BATCH_ID);
    const result = await registeredHandler(ownerRegistryStatus)(state.ctx, {
      nowMs: 1_787_581_600_000,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      registryCode: 'valid',
      materializationCode: 'materialized_exact',
      currentActivation: {
        batchId: refreeze.manifest.batchId,
        freezeDigest: refreeze.freezeDigest,
        expectedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
        confirmationText: `ACTIVATE ${refreeze.manifest.batchId}`,
        readinessCode: 'ready_after_changes_requested_refreeze',
      },
      releases: expect.arrayContaining([expect.objectContaining({
        batchId: refreeze.manifest.batchId,
        readinessCode: 'ready_after_changes_requested_refreeze',
      })]),
    });
    expect(JSON.stringify(result)).not.toContain('sourceIds');
    expect(JSON.stringify(result)).not.toContain('contentCanonicalSha256');
    expect(JSON.stringify(result)).not.toContain('"decision":');
    expect(JSON.stringify(result)).not.toContain('reviewedAt');
  });

  it.each([
    ['orphan predecessor receipt', (state: Awaited<ReturnType<typeof exactContext>>) => {
      state.tables.clinicalReviewBatchReceipts.push({
        _id: 'orphan-root-status-receipt',
        _creationTime: 1,
        batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      });
    }],
    ['stale refreeze lifecycle', (state: Awaited<ReturnType<typeof exactContext>>) => {
      const row = state.tables.clinicalReviewBatches.find(
        (candidate) => candidate.batchId === CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
      );
      if (row) row.activatedAt = 1_787_581_500_000;
    }],
    ['tampered decision preimage', (state: Awaited<ReturnType<typeof exactContext>>) => {
      state.tables.contentReviews[0].note = 'tampered review note';
    }],
    ['duplicate refreeze assignment', (state: Awaited<ReturnType<typeof exactContext>>) => {
      const row = state.tables.clinicalReviewAssignments.find(
        (candidate) => candidate.batchId === CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
      );
      if (row) state.tables.clinicalReviewAssignments.push({ ...structuredClone(row), _id: 'duplicate-refreeze-assignment' });
    }],
  ])('does not expose refreeze activation for %s', async (_label, tamper) => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    tamper(state);
    const result = await registeredHandler(ownerRegistryStatus)(state.ctx, {
      nowMs: 1_787_581_600_000,
      todayIso: '2026-08-24',
    }) as { currentActivation: unknown };
    expect(result.currentActivation).toBeNull();
  });

  it('does not expose refreeze activation when server-clock expiry or live preflight blocks it', async () => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    const expired = await registeredHandler(ownerRegistryStatus)(state.ctx, {
      nowMs: CLINICAL_NEWBORN_REFREEZE_BATCH_EXPIRES_AT,
      todayIso: new Date(CLINICAL_NEWBORN_REFREEZE_BATCH_EXPIRES_AT).toISOString().slice(0, 10),
    }) as { currentActivation: unknown };
    expect(expired.currentActivation).toBeNull();

    vi.mocked(registeredBatchActivationBlockers).mockResolvedValueOnce(['live_preflight_tamper']);
    const blocked = await registeredHandler(ownerRegistryStatus)(state.ctx, {
      nowMs: 1_787_581_600_000,
      todayIso: '2026-08-24',
    }) as { currentActivation: unknown };
    expect(blocked.currentActivation).toBeNull();
  });

  it('rejects a tampered refreeze decision set before the first activation write', async () => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    state.tables.contentReviews[0].note = 'tampered review note';
    const writesBeforeActivation = state.writes.length;
    const refreeze = registration(CLINICAL_NEWBORN_REFREEZE_BATCH_ID);
    const result = await registeredHandler(activateRegisteredBatch)(state.ctx, {
      batchId: refreeze.manifest.batchId,
      expectedFreezeDigest: refreeze.freezeDigest,
      expectedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
    });
    expect(result).toMatchObject({ ok: false, code: 'refreeze_decision_set_mismatch' });
    expect(state.writes).toHaveLength(writesBeforeActivation);
    expect(state.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
    )).toMatchObject({ status: 'frozen' });
  });

  it('requires every registered release row to be exact before exposing or activating refreeze', async () => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    state.tables.clinicalReviewBatches = state.tables.clinicalReviewBatches.filter(
      (row) => row.batchId !== CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
    );
    state.tables.clinicalReviewAssignments = state.tables.clinicalReviewAssignments.filter(
      (row) => row.batchId !== CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
    );
    const status = await registeredHandler(ownerRegistryStatus)(state.ctx, {
      nowMs: 1_787_581_600_000,
      todayIso: '2026-08-24',
    }) as { currentActivation: unknown };
    expect(status.currentActivation).toBeNull();

    const writesBeforeActivation = state.writes.length;
    const refreeze = registration(CLINICAL_NEWBORN_REFREEZE_BATCH_ID);
    const result = await registeredHandler(activateRegisteredBatch)(state.ctx, {
      batchId: refreeze.manifest.batchId,
      expectedFreezeDigest: refreeze.freezeDigest,
      expectedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
    });
    expect(result).toMatchObject({ ok: false, code: 'persisted_registry_state_mismatch' });
    expect(state.writes).toHaveLength(writesBeforeActivation);
  });

  it.each([
    ['orphan receipt', (state: Awaited<ReturnType<typeof exactContext>>) => {
      state.tables.clinicalReviewBatchReceipts.push({
        _id: 'orphan-root-receipt',
        _creationTime: 1,
        batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      });
    }],
    ['stale completedAt', (state: Awaited<ReturnType<typeof exactContext>>) => {
      const root = state.tables.clinicalReviewBatches.find(
        (row) => row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID,
      );
      if (root) root.completedAt = 1_787_581_500_000;
    }],
    ['stale consumed digest', (state: Awaited<ReturnType<typeof exactContext>>) => {
      const root = state.tables.clinicalReviewBatches.find(
        (row) => row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID,
      );
      if (root) root.consumedUpstreamReceiptDigest = 'a'.repeat(64);
    }],
  ])('refuses refreeze activation when the stopped root has %s', async (_label, tamper) => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    tamper(state);
    const writesBeforeActivation = state.writes.length;
    const refreeze = registration(CLINICAL_NEWBORN_REFREEZE_BATCH_ID);
    const result = await registeredHandler(activateRegisteredBatch)(state.ctx, {
      batchId: refreeze.manifest.batchId,
      expectedFreezeDigest: refreeze.freezeDigest,
      expectedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
    });
    expect(result).toMatchObject({ ok: false, code: 'refreeze_predecessor_not_stopped' });
    expect(state.writes).toHaveLength(writesBeforeActivation);
    expect(state.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
    )).toMatchObject({ status: 'frozen' });
  });

  it.each([
    ['orphan receipt', (state: Awaited<ReturnType<typeof exactContext>>) => {
      state.tables.clinicalReviewBatchReceipts.push({
        _id: 'late-orphan-root-receipt',
        _creationTime: 2,
        batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      });
    }],
    ['stale lifecycle field', (state: Awaited<ReturnType<typeof exactContext>>) => {
      const root = state.tables.clinicalReviewBatches.find(
        (row) => row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID,
      );
      if (root) root.completedAt = 1_787_581_700_000;
    }],
  ])('invalidates the recursive refreeze chain after a late root %s', async (_label, tamper) => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    const refreeze = registration(CLINICAL_NEWBORN_REFREEZE_BATCH_ID);
    await registeredHandler(activateRegisteredBatch)(state.ctx, {
      batchId: refreeze.manifest.batchId,
      expectedFreezeDigest: refreeze.freezeDigest,
      expectedUpstreamReceiptDigest: CLINICAL_NEWBORN_REFREEZE_DECISION_SET_DIGEST,
    });
    const refreezeRow = state.tables.clinicalReviewBatches.find(
      (row) => row.batchId === CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
    );
    if (!refreezeRow) throw new Error('missing active refreeze batch');
    await expect(exactClinicalReviewUpstreamChain(
      state.ctx as never,
      refreeze,
      refreezeRow as never,
    )).resolves.toBe(true);

    tamper(state);
    await expect(exactClinicalReviewUpstreamChain(
      state.ctx as never,
      refreeze,
      refreezeRow as never,
    )).resolves.toBe(false);
  });

  it.each([
    ['stopped root lifecycle', CLINICAL_INITIAL_RELEASE_BATCH_ID, { completedAt: 1_787_581_500_000 }],
    ['frozen refreeze lifecycle', CLINICAL_NEWBORN_REFREEZE_BATCH_ID, { activatedAt: 1_787_581_500_000 }],
    ['frozen downstream lifecycle', CLINICAL_NUTRITION_RELEASE_BATCH_ID, { invalidatedAt: 1_787_581_500_000, invalidationReason: 'stale' }],
  ])('blocks applied replay on corrupted %s', async (_label, batchId, lifecyclePatch) => {
    const state = await exactContext();
    vi.spyOn(Date, 'now').mockReturnValue(1_787_581_500_000);
    await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    });
    const row = state.tables.clinicalReviewBatches.find((candidate) => candidate.batchId === batchId);
    if (!row) throw new Error(`missing batch ${batchId}`);
    Object.assign(row, lifecyclePatch);
    const writesAfterApply = state.writes.length;
    const preflight = await registeredHandler(preflightAt)(state.ctx, {
      nowMs: 1_787_581_600_000,
      todayIso: '2026-08-24',
    }) as { phase: string; blockers: string[] };
    expect(preflight.phase).toBe('blocked');
    expect(preflight.blockers).toContain('migration_postimage_drift');
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    })).rejects.toThrow('migration_postimage_drift');
    expect(state.writes).toHaveLength(writesAfterApply);
  });

  it('refuses to migrate outside the refreeze registration window', async () => {
    const state = await exactContext();
    const todayIso = new Date(CLINICAL_NEWBORN_REFREEZE_BATCH_EXPIRES_AT)
      .toISOString().slice(0, 10);
    const preflight = await registeredHandler(preflightAt)(state.ctx, {
      nowMs: CLINICAL_NEWBORN_REFREEZE_BATCH_EXPIRES_AT,
      todayIso,
    }) as { phase: string; blockers: string[] };
    expect(preflight.phase).toBe('blocked');
    expect(preflight.blockers).toContain('refreeze_registration_window_invalid');
    vi.spyOn(Date, 'now').mockReturnValue(CLINICAL_NEWBORN_REFREEZE_BATCH_EXPIRES_AT);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    })).rejects.toThrow('refreeze_registration_window_invalid');
    expect(state.writes).toEqual([]);
  });

  it('fails closed before writes when a receipt appears', async () => {
    const state = await exactContext();
    state.tables.clinicalReviewBatchReceipts.push({
      _id: 'unexpected-receipt',
      _creationTime: 1,
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
    });
    const result = await registeredHandler(preflightAt)(state.ctx, {
      nowMs: 1_787_581_400_000,
      todayIso: '2026-08-24',
    }) as { phase: string; blockers: string[] };
    expect(result.phase).toBe('blocked');
    expect(result.blockers).toContain('registry_preimage_drift');
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    })).rejects.toThrow('registry_preimage_drift');
    expect(state.writes).toEqual([]);
  });

  it('keeps the compile registry digest-bound', async () => {
    for (const row of CLINICAL_REVIEW_BATCH_REGISTRY) {
      expect(await sha256Canonical(row.manifest)).toBe(row.freezeDigest);
    }
  });
});
