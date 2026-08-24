import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { registeredBatchActivationBlockers } from './clinicalReviewBatch';
import { sha256Canonical } from './lib/aiAuditHash';
import {
  CLINICAL_INITIAL_RELEASE_BATCH_ID,
  CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
  CLINICAL_NUTRITION_RELEASE_BATCH_ID,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from './lib/clinicalReviewBatchData';
import {
  exactPersistedAssignment,
  exactPersistedBatchRegistration,
  exactFrozenReleaseBatchLifecycle,
  exactStoppedChangesRequestedReleaseBatchLifecycle,
  frozenClinicalDecisionKey,
} from './lib/clinicalReviewBatchProvenance';
import {
  CLINICAL_REFREEZE_CORRECTION_AUDIT,
  CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
  CLINICAL_REFREEZE_REGISTRY_PREIMAGE,
  clinicalRefreezeRegistryApplyResultValidator,
  clinicalRefreezeRegistryPreflightResultValidator,
  type ClinicalRefreezeRegistryPreflightResult,
} from './lib/clinicalRefreezeRegistryMigrationData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const migrationAction = 'clinicalReviewRegistry.refreeze_migration';
const maxReleaseBatches = 5;
const maxAssignments = 17;

function sortById<T extends { _id: unknown }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

function releaseRegistration(batchId: string): ClinicalReviewBatchRegistration {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (candidate) => candidate.authority === 'release'
      && candidate.manifest.batchId === batchId,
  );
  if (!registration) throw new Error(`Missing registered release batch: ${batchId}`);
  return registration;
}

const rootRegistration = releaseRegistration(CLINICAL_INITIAL_RELEASE_BATCH_ID);
const refreezeRegistration = releaseRegistration(CLINICAL_NEWBORN_REFREEZE_BATCH_ID);
const nutritionRegistration = releaseRegistration(CLINICAL_NUTRITION_RELEASE_BATCH_ID);
const safetyRegistration = releaseRegistration(CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID);

async function compileRegistryDigest(): Promise<string> {
  return await sha256Canonical(CLINICAL_REVIEW_BATCH_REGISTRY.map((registration) => ({
    routing: clinicalReviewBatchRoutingPayload(registration),
    routingDigest: registration.routingCanonicalSha256,
  })));
}

async function compileRegistryExact(): Promise<boolean> {
  let previousRelease: ClinicalReviewBatchRegistration | null = null;
  const ids = new Set<string>();
  for (let index = 0; index < CLINICAL_REVIEW_BATCH_REGISTRY.length; index += 1) {
    const registration = CLINICAL_REVIEW_BATCH_REGISTRY[index];
    if (registration.sequence !== index + 1
      || ids.has(registration.manifest.batchId)
      || registration.manifest.count !== registration.manifest.items.length
      || registration.manifest.count < 1
      || registration.manifest.count > 25
      || await sha256Canonical(registration.manifest) !== registration.freezeDigest
      || await sha256Canonical(clinicalReviewBatchRoutingPayload(registration))
        !== registration.routingCanonicalSha256) return false;
    ids.add(registration.manifest.batchId);
    if (registration.authority === 'pilot') {
      if (registration.activation.kind !== 'initial' || previousRelease) return false;
    } else if (!previousRelease) {
      if (registration.activation.kind !== 'initial') return false;
      previousRelease = registration;
    } else {
      if (registration.activation.kind === 'initial'
        || registration.activation.previousBatchId !== previousRelease.manifest.batchId) return false;
      previousRelease = registration;
    }
  }
  return true;
}

async function rootDecisionSetDigest(ctx: DatabaseContext): Promise<string | null> {
  const decisions = [];
  for (const item of rootRegistration.manifest.items) {
    const assignmentId = await frozenClinicalDecisionKey(rootRegistration, item);
    const rows = await ctx.db.query('contentReviews')
      .withIndex('by_decision_key', (q) => q.eq('decisionKey', assignmentId)).take(2);
    if (rows.length !== 1) return null;
    const row = rows[0];
    if (row.clinicalReviewBatchId !== rootRegistration.manifest.batchId
      || row.contentSlug !== item.slug
      || row.contentVersion !== item.reviewRevision
      || row.reviewRevision !== item.reviewRevision
      || row.dimension !== rootRegistration.dimension
      || String(row.reviewerId) !== rootRegistration.manifest.reviewer.userId) return null;
    decisions.push({
      assignmentId,
      slug: item.slug,
      kind: item.kind,
      reviewRevision: item.reviewRevision,
      decision: row.decision,
      note: row.note?.trim() || null,
      reviewedAt: row.reviewedAt,
      receiptId: String(row._id),
    });
  }
  return await sha256Canonical({
    batchId: rootRegistration.manifest.batchId,
    freezeDigest: rootRegistration.freezeDigest,
    decisions,
  });
}

async function correctionAuditExact(ctx: DatabaseContext): Promise<boolean> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', CLINICAL_REFREEZE_CORRECTION_AUDIT.action))
    .take(2);
  return rows.length === 1
    && String(rows[0]._id) === CLINICAL_REFREEZE_CORRECTION_AUDIT.id
    && rows[0]._creationTime === CLINICAL_REFREEZE_CORRECTION_AUDIT.creationTime
    && await sha256Canonical(rows[0]) === CLINICAL_REFREEZE_CORRECTION_AUDIT.canonicalSha256;
}

function legacyDownstreamRowsExact(batches: readonly Doc<'clinicalReviewBatches'>[]): boolean {
  const root = batches.filter((row) => row.batchId === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.rootBatchId);
  const nutrition = batches.filter((row) => row.batchId === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionBatchId);
  const safety = batches.filter((row) => row.batchId === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.safetyBatchId);
  return root.length === 1
    && root[0].status === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.rootStatus
    && nutrition.length === 1
    && nutrition[0].status === 'frozen'
    && nutrition[0].sequence === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionSequence
    && nutrition[0].routingDigest === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionRoutingDigest
    && nutrition[0].predecessorBatchId
      === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionPredecessorBatchId
    && nutrition[0].expectedUpstreamStateDigest
      === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.nutritionExpectedUpstreamStateDigest
    && nutrition[0].activatedAt === undefined
    && nutrition[0].consumedUpstreamReceiptDigest === undefined
    && nutrition[0].completedAt === undefined
    && nutrition[0].invalidatedAt === undefined
    && safety.length === 1
    && safety[0].status === 'frozen'
    && safety[0].sequence === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.safetySequence
    && safety[0].routingDigest === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.safetyRoutingDigest
    && safety[0].activatedAt === undefined
    && safety[0].consumedUpstreamReceiptDigest === undefined
    && safety[0].completedAt === undefined
    && safety[0].invalidatedAt === undefined;
}

async function currentRegistryPreimageExact(ctx: DatabaseContext) {
  const [batches, assignments, receipts] = await Promise.all([
    ctx.db.query('clinicalReviewBatches').take(maxReleaseBatches),
    ctx.db.query('clinicalReviewAssignments').take(maxAssignments),
    ctx.db.query('clinicalReviewBatchReceipts').take(2),
  ]);
  const exact = batches.length === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.batchesCount
    && batches.length < maxReleaseBatches
    && await sha256Canonical(sortById(batches))
      === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.batchesCanonicalSha256
    && assignments.length === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.assignmentsCount
    && assignments.length < maxAssignments
    && await sha256Canonical(sortById(assignments))
      === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.assignmentsCanonicalSha256
    && receipts.length === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.receiptsCount
    && await sha256Canonical(sortById(receipts))
      === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.receiptsCanonicalSha256
    && legacyDownstreamRowsExact(batches);
  return { exact, batches, assignments, receipts };
}

function expectedUpstreamStateDigest(registration: ClinicalReviewBatchRegistration) {
  const activation = registration.activation;
  if (activation.kind === 'initial') return undefined;
  return activation.kind === 'after_handoff'
    ? activation.expectedPreviousFreezeDigest
    : activation.expectedDecisionSetDigest;
}

function batchInsertValue(registration: ClinicalReviewBatchRegistration) {
  const activation = registration.activation;
  return {
    batchId: registration.manifest.batchId,
    sequence: registration.sequence,
    laneGraphVersion: registration.laneGraphVersion,
    dimension: registration.dimension,
    authority: registration.authority,
    status: 'frozen' as const,
    freezeDigest: registration.freezeDigest,
    routingDigest: registration.routingCanonicalSha256,
    itemCount: registration.manifest.count,
    frozenAt: registration.frozenAt,
    expiresAt: registration.expiresAt,
    reviewerProfileId: registration.manifest.reviewer.profileId,
    reviewerId: registration.manifest.reviewer.userId as Id<'users'>,
    reviewerDisplayName: registration.manifest.reviewer.displayName,
    reviewerQualification: registration.manifest.reviewer.qualification,
    reviewerRole: registration.manifest.reviewer.role,
    reviewerIdentityDigest: registration.manifest.reviewer.identityCanonicalSha256,
    activationKind: activation.kind,
    predecessorBatchId: activation.kind === 'initial' ? undefined : activation.previousBatchId,
    expectedUpstreamStateDigest: expectedUpstreamStateDigest(registration),
    createdAt: registration.frozenAt,
  };
}

async function assignmentInsertValue(
  registration: ClinicalReviewBatchRegistration,
  item: ClinicalReviewBatchRegistration['manifest']['items'][number],
) {
  return {
    batchId: registration.manifest.batchId,
    assignmentId: await frozenClinicalDecisionKey(registration, item),
    ordinal: item.ordinal,
    dimension: registration.dimension,
    kind: item.kind,
    contentSlug: item.slug,
    reviewRevision: item.reviewRevision,
    contentId: item.contentId as Id<'libraryContent'>,
    contentCreationTime: item.contentCreationTime,
    contentUpdatedAt: item.contentUpdatedAt,
    contentCanonicalSha256: item.contentCanonicalSha256,
    linkId: item.linkId as Id<'evidenceLinks'>,
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
    upstreamReviewDigests: [...(item.upstreamReviewDigests ?? [])],
    createdAt: registration.frozenAt,
  };
}

async function exactPersistedRelease(
  ctx: DatabaseContext,
  registration: ClinicalReviewBatchRegistration,
  expectedStatus: 'frozen' | 'stopped_changes_requested',
): Promise<boolean> {
  const [batches, assignments, receipts] = await Promise.all([
    ctx.db.query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId)).take(2),
    ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_batch_id_and_ordinal', (q) => q.eq('batchId', registration.manifest.batchId))
      .take(registration.manifest.count + 1),
    ctx.db.query('clinicalReviewBatchReceipts')
      .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId)).take(2),
  ]);
  if (batches.length !== 1
    || !exactPersistedBatchRegistration(batches[0], registration)
    || assignments.length !== registration.manifest.count
    || receipts.length !== 0) return false;
  if (expectedStatus === 'frozen'
    ? !exactFrozenReleaseBatchLifecycle(batches[0], registration)
    : !exactStoppedChangesRequestedReleaseBatchLifecycle(batches[0], registration)) return false;
  for (const item of registration.manifest.items) {
    const assignmentId = await frozenClinicalDecisionKey(registration, item);
    const row = assignments.find((candidate) => candidate.assignmentId === assignmentId);
    if (!row || !exactPersistedAssignment(row, registration, item, assignmentId)) return false;
    const byId = await ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_assignment_id', (q) => q.eq('assignmentId', assignmentId)).take(2);
    const byTarget = await ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_exact_target', (q) => q
        .eq('contentSlug', item.slug)
        .eq('dimension', registration.dimension)
        .eq('reviewRevision', item.reviewRevision))
      .take(2);
    if (byId.length !== 1 || byTarget.length !== 1
      || byId[0]._id !== row._id || byTarget[0]._id !== row._id) return false;
  }
  return true;
}

async function postRegistryExact(ctx: DatabaseContext): Promise<boolean> {
  const [batches, assignments, receipts] = await Promise.all([
    ctx.db.query('clinicalReviewBatches').take(maxReleaseBatches),
    ctx.db.query('clinicalReviewAssignments').take(maxAssignments),
    ctx.db.query('clinicalReviewBatchReceipts').take(2),
  ]);
  return batches.length === 4
    && batches.length < maxReleaseBatches
    && assignments.length === 16
    && assignments.length < maxAssignments
    && receipts.length === 0
    && await exactPersistedRelease(ctx, rootRegistration, 'stopped_changes_requested')
    && await exactPersistedRelease(ctx, refreezeRegistration, 'frozen')
    && await exactPersistedRelease(ctx, nutritionRegistration, 'frozen')
    && await exactPersistedRelease(ctx, safetyRegistration, 'frozen');
}

function migrationAuditBeforeJson(): string {
  return JSON.stringify({
    registry: CLINICAL_REFREEZE_REGISTRY_PREIMAGE,
    correctionAudit: CLINICAL_REFREEZE_CORRECTION_AUDIT,
    publicationDecision: 'not_made',
  });
}

function migrationAuditAfterJson(migratedAt: number, registryDigest: string): string {
  return JSON.stringify({
    migratedAt,
    registryDigest,
    refreezeBatchId: refreezeRegistration.manifest.batchId,
    refreezeFreezeDigest: refreezeRegistration.freezeDigest,
    refreezeDecisionSetDigest: CLINICAL_REFREEZE_REGISTRY_PREIMAGE.rootDecisionSetDigest,
    batchesInserted: 1,
    assignmentsInserted: 2,
    batchesRewired: 2,
    dataRowsChanged: 5,
    contentEvidenceMediaReviewRowsChanged: 0,
    publicationDecision: 'not_made',
  });
}

async function migrationAuditState(ctx: DatabaseContext, registryDigest: string) {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', migrationAction)).take(2);
  if (rows.length !== 1) return { rows: rows.length, exact: false, migratedAt: null as number | null };
  const row = rows[0];
  let migratedAt: number | null = null;
  try {
    const after = JSON.parse(row.after ?? '{}') as { migratedAt?: unknown };
    if (typeof after.migratedAt === 'number') migratedAt = after.migratedAt;
  } catch {
    migratedAt = null;
  }
  const exact = migratedAt !== null
    && row.actorId === undefined
    && row.entityTable === 'clinicalReviewBatches'
    && row.entityId === undefined
    && row.summary === CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID
    && row.result === 'ok'
    && row.before === migrationAuditBeforeJson()
    && row.after === migrationAuditAfterJson(migratedAt, registryDigest);
  return { rows: 1, exact, migratedAt: exact ? migratedAt : null };
}

async function inspect(
  ctx: DatabaseContext,
  checkedAt: number,
  todayIso: string,
): Promise<ClinicalRefreezeRegistryPreflightResult> {
  const serverDate = new Date(checkedAt);
  const blockers: string[] = [];
  if (!Number.isFinite(checkedAt)
    || Number.isNaN(serverDate.getTime())
    || checkedAt < 0
    || serverDate.toISOString().slice(0, 10) !== todayIso) {
    blockers.push('server_clock_invalid');
  }
  if (blockers.length === 0
    && (checkedAt < refreezeRegistration.frozenAt
      || checkedAt >= refreezeRegistration.expiresAt)) {
    blockers.push('refreeze_registration_window_invalid');
  }
  const registryDigest = await compileRegistryDigest();
  const [compileExact, correctionExact, decisionSetDigest, preimage, audit] = await Promise.all([
    compileRegistryExact(),
    correctionAuditExact(ctx),
    rootDecisionSetDigest(ctx),
    currentRegistryPreimageExact(ctx),
    migrationAuditState(ctx, registryDigest),
  ]);
  const decisionSetExact = decisionSetDigest === CLINICAL_REFREEZE_REGISTRY_PREIMAGE.rootDecisionSetDigest;
  let refreezeBlockers: string[] = [];
  if (blockers.length === 0) {
    refreezeBlockers = await registeredBatchActivationBlockers(ctx, refreezeRegistration, todayIso);
  }
  const inputsExact = blockers.length === 0 && refreezeBlockers.length === 0;
  const postExact = audit.exact ? await postRegistryExact(ctx) : false;

  if (!compileExact) blockers.push('compile_registry_invalid');
  if (!correctionExact) blockers.push('correction_audit_drift');
  if (!decisionSetExact) blockers.push('predecessor_decision_set_drift');
  blockers.push(...refreezeBlockers.map((blocker) => `refreeze:${blocker}`));
  if (audit.rows > 1) blockers.push('duplicate_migration_audit');
  if (audit.rows === 1 && (!audit.exact || !postExact)) blockers.push('migration_postimage_drift');
  if (audit.rows === 0 && !preimage.exact) blockers.push('registry_preimage_drift');

  const phase = blockers.length > 0 ? 'blocked' : audit.exact && postExact ? 'applied' : 'ready';
  return {
    releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
    phase,
    checkedAt,
    todayIso,
    blockers,
    migrationAuditRows: audit.rows,
    migrationAuditExact: audit.exact,
    migratedAt: audit.migratedAt,
    correctionAuditExact: correctionExact,
    predecessorDecisionSetExact: decisionSetExact,
    compileRegistryExact: compileExact,
    currentRegistryExact: phase === 'applied' ? postExact : preimage.exact,
    refreezeInputsExact: inputsExact,
    releaseBatchRows: preimage.batches.length,
    assignmentRows: preimage.assignments.length,
    receiptRows: preimage.receipts.length,
  };
}

export const preflightAt = internalQuery({
  args: { nowMs: v.number(), todayIso: v.string() },
  returns: clinicalRefreezeRegistryPreflightResultValidator,
  handler: async (ctx, args) => await inspect(ctx, args.nowMs, args.todayIso),
});

export const apply = internalMutation({
  args: { releaseId: v.literal(CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID) },
  returns: clinicalRefreezeRegistryApplyResultValidator,
  handler: async (ctx) => {
    const now = Date.now();
    const todayIso = new Date(now).toISOString().slice(0, 10);
    const preflight = await inspect(ctx, now, todayIso);
    if (preflight.phase === 'applied' && preflight.migratedAt !== null) {
      return {
        releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
        applied: false,
        alreadyApplied: true,
        batchesInserted: 0,
        assignmentsInserted: 0,
        batchesRewired: 0,
        dataRowsChanged: 0,
        publicationDecisionMade: false as const,
        migratedAt: preflight.migratedAt,
      };
    }
    if (preflight.phase !== 'ready') {
      throw new Error(`Clinical refreeze registry migration blocked: ${preflight.blockers.join(',')}`);
    }

    const nutritionRows = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', nutritionRegistration.manifest.batchId)).take(2);
    const safetyRows = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', safetyRegistration.manifest.batchId)).take(2);
    if (nutritionRows.length !== 1 || safetyRows.length !== 1) {
      throw new Error('Clinical refreeze registry downstream preimage drift');
    }
    const assignmentPlans = await Promise.all(refreezeRegistration.manifest.items.map(
      async (item) => await assignmentInsertValue(refreezeRegistration, item),
    ));

    await ctx.db.insert('clinicalReviewBatches', batchInsertValue(refreezeRegistration));
    for (const assignment of assignmentPlans) {
      await ctx.db.insert('clinicalReviewAssignments', assignment);
    }
    await ctx.db.patch(nutritionRows[0]._id, {
      sequence: nutritionRegistration.sequence,
      routingDigest: nutritionRegistration.routingCanonicalSha256,
      predecessorBatchId: refreezeRegistration.manifest.batchId,
      expectedUpstreamStateDigest: refreezeRegistration.freezeDigest,
    });
    await ctx.db.patch(safetyRows[0]._id, {
      sequence: safetyRegistration.sequence,
      routingDigest: safetyRegistration.routingCanonicalSha256,
    });

    const registryDigest = await compileRegistryDigest();
    await logAudit(
      ctx,
      null,
      migrationAction,
      'clinicalReviewBatches',
      undefined,
      CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
      {
        before: migrationAuditBeforeJson(),
        after: migrationAuditAfterJson(now, registryDigest),
      },
    );
    const postflight = await inspect(ctx, now, todayIso);
    if (postflight.phase !== 'applied' || postflight.migratedAt !== now) {
      throw new Error(`Clinical refreeze registry migration postflight failed: ${postflight.blockers.join(',')}`);
    }
    return {
      releaseId: CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID,
      applied: true,
      alreadyApplied: false,
      batchesInserted: 1,
      assignmentsInserted: 2,
      batchesRewired: 2,
      dataRowsChanged: 5,
      publicationDecisionMade: false as const,
      migratedAt: now,
    };
  },
});
