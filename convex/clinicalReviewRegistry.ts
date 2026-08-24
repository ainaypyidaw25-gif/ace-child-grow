import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type QueryCtx } from './_generated/server';
import { logAudit } from './audit';
import { registeredBatchActivationBlockers } from './clinicalReviewBatch';
import { requireOwner } from './lib/auth';
import { sha256Canonical } from './lib/aiAuditHash';
import { todayIsoUtc } from './lib/evidenceFreshness';
import { roleMayReview } from './lib/reviewPolicy';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from './lib/clinicalReviewBatchData';
import {
  exactHandoffReceipt,
  exactPersistedAssignment,
  exactPersistedBatchRegistration,
  frozenClinicalDecisionKey,
} from './lib/clinicalReviewBatchProvenance';

const resultValidator = v.object({
  ok: v.boolean(),
  code: v.string(),
  batchId: v.union(v.string(), v.null()),
  createdBatches: v.number(),
  createdAssignments: v.number(),
});

const MAX_REGISTERED_RELEASES = 20;
const MAX_ASSIGNMENTS_PER_RELEASE = 50;

const persistedBatchStatusValidator = v.union(
  v.literal('frozen'),
  v.literal('active'),
  v.literal('stopped_changes_requested'),
  v.literal('completed'),
  v.literal('invalidated'),
);

const activationReadinessValidator = v.union(
  v.literal('not_materialized'),
  v.literal('blocked_persisted_mismatch'),
  v.literal('blocked_assignment_mismatch'),
  v.literal('already_active'),
  v.literal('already_completed'),
  v.literal('stopped_changes_requested'),
  v.literal('invalidated'),
  v.literal('blocked_active_batch_exists'),
  v.literal('blocked_expired'),
  v.literal('awaiting_predecessor_completion'),
  v.literal('awaiting_predecessor_receipt'),
  v.literal('blocked_predecessor_mismatch'),
  v.literal('blocked_upstream_receipt_consumed'),
  v.literal('blocked_live_preflight'),
  v.literal('blocked_refreeze_requires_exact_confirmation'),
  v.literal('ready_initial'),
  v.literal('ready_after_handoff'),
);

const ownerRegistryStatusValidator = v.object({
  registryDigest: v.string(),
  registryCode: v.union(v.literal('valid'), v.literal('invalid')),
  materializationCode: v.union(
    v.literal('materialization_required'),
    v.literal('materialized_exact'),
    v.literal('blocked_persisted_mismatch'),
  ),
  registeredReleaseCount: v.number(),
  persistedBatchCount: v.number(),
  persistedAssignmentCount: v.number(),
  releases: v.array(v.object({
    batchId: v.string(),
    sequence: v.number(),
    dimension: v.union(
      v.literal('clinical'),
      v.literal('child_development'),
      v.literal('evidence'),
      v.literal('safety'),
    ),
    activationKind: v.union(
      v.literal('initial'),
      v.literal('after_handoff'),
      v.literal('after_changes_requested_refreeze'),
    ),
    freezeDigest: v.string(),
    itemCount: v.number(),
    expiresAt: v.number(),
    persistedStatus: v.union(persistedBatchStatusValidator, v.null()),
    persistedBatchRows: v.number(),
    persistedAssignmentRows: v.number(),
    persistedReceiptRows: v.number(),
    registrationExact: v.boolean(),
    assignmentsExact: v.boolean(),
    readinessCode: activationReadinessValidator,
  })),
  currentActivation: v.union(v.null(), v.object({
    batchId: v.string(),
    freezeDigest: v.string(),
    expectedUpstreamReceiptDigest: v.union(v.string(), v.null()),
    confirmationText: v.string(),
    readinessCode: v.union(v.literal('ready_initial'), v.literal('ready_after_handoff')),
  })),
});

type ActivationReadiness =
  | 'not_materialized'
  | 'blocked_persisted_mismatch'
  | 'blocked_assignment_mismatch'
  | 'already_active'
  | 'already_completed'
  | 'stopped_changes_requested'
  | 'invalidated'
  | 'blocked_active_batch_exists'
  | 'blocked_expired'
  | 'awaiting_predecessor_completion'
  | 'awaiting_predecessor_receipt'
  | 'blocked_predecessor_mismatch'
  | 'blocked_upstream_receipt_consumed'
  | 'blocked_live_preflight'
  | 'blocked_refreeze_requires_exact_confirmation'
  | 'ready_initial'
  | 'ready_after_handoff';

function registrationById(batchId: string): ClinicalReviewBatchRegistration | null {
  return CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (registration) => registration.manifest.batchId === batchId,
  ) ?? null;
}

async function registryDigest(): Promise<string> {
  return await sha256Canonical(CLINICAL_REVIEW_BATCH_REGISTRY.map((registration) => ({
    routing: clinicalReviewBatchRoutingPayload(registration),
    routingDigest: registration.routingCanonicalSha256,
  })));
}

async function registryIntegrityValid(): Promise<boolean> {
  const batchIds = new Set<string>();
  const targets = new Set<string>();
  let previousRelease: ClinicalReviewBatchRegistration | null = null;
  const registrations: readonly ClinicalReviewBatchRegistration[] = CLINICAL_REVIEW_BATCH_REGISTRY;
  const releaseCount = registrations.filter((registration) => registration.authority === 'release').length;
  if (releaseCount > MAX_REGISTERED_RELEASES) return false;
  for (let index = 0; index < registrations.length; index += 1) {
    const registration = registrations[index];
    if (registration.manifest.count !== registration.manifest.items.length
      || registration.manifest.count < 1
      || registration.manifest.count > MAX_ASSIGNMENTS_PER_RELEASE) return false;
    if (registration.sequence !== index + 1 || batchIds.has(registration.manifest.batchId)) return false;
    batchIds.add(registration.manifest.batchId);
    if (await sha256Canonical(registration.manifest) !== registration.freezeDigest
      || await sha256Canonical(clinicalReviewBatchRoutingPayload(registration))
        !== registration.routingCanonicalSha256) return false;
    if (!roleMayReview(registration.manifest.reviewer.role, registration.dimension)
      || (registration.dimension !== 'evidence'
        && registration.manifest.reviewer.role !== 'clinical_reviewer')) return false;
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
    for (const item of registration.manifest.items) {
      if (registration.authority === 'release'
        && (!Number.isInteger(item.currentClinicalReviewCount)
          || item.currentClinicalReviewCount! < 0
          || !/^[a-f0-9]{64}$/.test(item.currentClinicalReviewsCanonicalSha256 ?? '')
          || !/^[a-f0-9]{64}$/.test(item.allClinicalReviewHistoryCanonicalSha256 ?? ''))) return false;
      const target = `${item.kind}\u0000${item.slug}\u0000${registration.dimension}\u0000${item.reviewRevision}`;
      if (targets.has(target)) return false;
      targets.add(target);
    }
  }
  return true;
}

type ReleaseInspection = {
  registration: ClinicalReviewBatchRegistration;
  batches: Doc<'clinicalReviewBatches'>[];
  assignments: Doc<'clinicalReviewAssignments'>[];
  receipts: Doc<'clinicalReviewBatchReceipts'>[];
  registrationExact: boolean;
  assignmentsCompatible: boolean;
  assignmentsExact: boolean;
};

async function inspectPersistedRegistration(
  ctx: Pick<QueryCtx, 'db'>,
  registration: ClinicalReviewBatchRegistration,
): Promise<ReleaseInspection> {
  const batches = await ctx.db.query('clinicalReviewBatches')
    .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId)).take(2);
  const assignments = await ctx.db.query('clinicalReviewAssignments')
    .withIndex('by_batch_id_and_ordinal', (q) => q.eq('batchId', registration.manifest.batchId))
    .take(registration.manifest.count + 1);
  const receipts = await ctx.db.query('clinicalReviewBatchReceipts')
    .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId)).take(2);
  const expectedAssignments = await Promise.all(registration.manifest.items.map(async (item) => ({
    item,
    assignmentId: await frozenClinicalDecisionKey(registration, item),
  })));
  let assignmentsCompatible = assignments.length <= registration.manifest.count
    && assignments.every((row) => {
      const expected = expectedAssignments.find((candidate) => candidate.assignmentId === row.assignmentId);
      return !!expected
        && exactPersistedAssignment(row, registration, expected.item, expected.assignmentId);
    })
    && new Set(assignments.map((row) => row.assignmentId)).size === assignments.length;
  // Mirror the materializer's two global uniqueness checks. A batch-local
  // assignment list is not exact when a second row elsewhere occupies either
  // its hash-derived id or semantic target.
  for (const expected of expectedAssignments) {
    const byId = await ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_assignment_id', (q) => q.eq('assignmentId', expected.assignmentId)).take(2);
    const byTarget = await ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_exact_target', (q) => q
        .eq('contentSlug', expected.item.slug)
        .eq('dimension', registration.dimension)
        .eq('reviewRevision', expected.item.reviewRevision))
      .take(2);
    const batchRow = assignments.find((row) => row.assignmentId === expected.assignmentId);
    const absentEverywhere = !batchRow && byId.length === 0 && byTarget.length === 0;
    const exactEverywhere = !!batchRow
      && byId.length === 1
      && byTarget.length === 1
      && byId[0]._id === batchRow._id
      && byTarget[0]._id === batchRow._id
      && exactPersistedAssignment(batchRow, registration, expected.item, expected.assignmentId);
    if (!absentEverywhere && !exactEverywhere) assignmentsCompatible = false;
  }
  return {
    registration,
    batches,
    assignments,
    receipts,
    registrationExact: batches.length === 1
      && exactPersistedBatchRegistration(batches[0], registration),
    assignmentsCompatible,
    assignmentsExact: assignmentsCompatible
      && assignments.length === registration.manifest.count,
  };
}

function expectedUpstreamStateDigest(registration: ClinicalReviewBatchRegistration): string | undefined {
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
  const assignmentId = await frozenClinicalDecisionKey(registration, item);
  return {
    batchId: registration.manifest.batchId,
    assignmentId,
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

/**
 * Owner-only operational read model for the code-frozen release registry.
 *
 * The browser receives routing metadata, digests, bounded persisted counts and
 * coarse readiness codes only. Exact assignments, source ids/URLs and frozen
 * content snapshots remain confined to the assignee-only batch loader.
 */
export const ownerRegistryStatus = query({
  args: {},
  returns: ownerRegistryStatusValidator,
  handler: async (ctx) => {
    await requireOwner(ctx);
    const exactRegistryDigest = await registryDigest();
    const registryCode = await registryIntegrityValid() ? 'valid' as const : 'invalid' as const;
    const registeredReleases = CLINICAL_REVIEW_BATCH_REGISTRY.filter(
      (registration) => registration.authority === 'release',
    ) as readonly ClinicalReviewBatchRegistration[];
    if (registryCode === 'invalid') {
      return {
        registryDigest: exactRegistryDigest,
        registryCode,
        materializationCode: 'blocked_persisted_mismatch' as const,
        registeredReleaseCount: registeredReleases.length,
        persistedBatchCount: 0,
        persistedAssignmentCount: 0,
        releases: [],
        currentActivation: null,
      };
    }
    const releaseRegistrations = registeredReleases;
    const inspections: ReleaseInspection[] = [];
    for (const registration of releaseRegistrations) {
      inspections.push(await inspectPersistedRegistration(ctx, registration));
    }
    const inspectionByBatchId = new Map(
      inspections.map((inspection) => [inspection.registration.manifest.batchId, inspection]),
    );
    const activeRows = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_status', (q) => q.eq('status', 'active')).take(2);
    const now = Date.now();
    const todayIso = todayIsoUtc();
    const upstreamReceiptByBatchId = new Map<string, string>();
    const readinessByBatchId = new Map<string, ActivationReadiness>();

    for (const inspection of inspections) {
      const { registration, batches, assignmentsCompatible, assignmentsExact } = inspection;
      const batchId = registration.manifest.batchId;
      let readiness: ActivationReadiness = 'blocked_persisted_mismatch';
      if (registryCode !== 'valid' || batches.length > 1
        || (batches.length === 1 && !inspection.registrationExact)) {
        readiness = 'blocked_persisted_mismatch';
      } else if (!assignmentsCompatible) {
        readiness = 'blocked_assignment_mismatch';
      } else if (batches.length === 0 || !assignmentsExact) {
        readiness = 'not_materialized';
      } else {
        const status = batches[0].status;
        if (status === 'active') readiness = 'already_active';
        else if (status === 'completed') readiness = 'already_completed';
        else if (status === 'stopped_changes_requested') readiness = 'stopped_changes_requested';
        else if (status === 'invalidated') readiness = 'invalidated';
        else if (activeRows.length > 0) readiness = 'blocked_active_batch_exists';
        else if (now >= registration.expiresAt) readiness = 'blocked_expired';
        else if (registration.activation.kind === 'after_changes_requested_refreeze') {
          // The activation mutation retains the exact decision-set CAS. This
          // read model never manufactures or exposes that digest.
          readiness = 'blocked_refreeze_requires_exact_confirmation';
        } else {
          let prerequisiteReady = true;
          if (registration.activation.kind === 'after_handoff') {
            const activation = registration.activation;
            const predecessorRegistration = registrationById(activation.previousBatchId);
            const predecessor = inspectionByBatchId.get(activation.previousBatchId);
            if (!predecessorRegistration
              || predecessorRegistration.authority !== 'release'
              || predecessorRegistration.freezeDigest !== activation.expectedPreviousFreezeDigest
              || !predecessor
              || !predecessor.registrationExact
              || !predecessor.assignmentsExact) {
              readiness = 'blocked_predecessor_mismatch';
              prerequisiteReady = false;
            } else if (predecessor.batches[0].status !== 'completed') {
              readiness = 'awaiting_predecessor_completion';
              prerequisiteReady = false;
            } else if (predecessor.receipts.length !== 1
              || !await exactHandoffReceipt(ctx, predecessor.receipts[0], predecessorRegistration)) {
              readiness = 'awaiting_predecessor_receipt';
              prerequisiteReady = false;
            } else {
              const consumers = await ctx.db.query('clinicalReviewBatches')
                .withIndex('by_predecessor_batch_id', (q) => q.eq('predecessorBatchId', activation.previousBatchId))
                .take(3);
              if (consumers.some((row) => row.batchId !== batchId
                && (row.status === 'active' || row.status === 'completed'))) {
                readiness = 'blocked_upstream_receipt_consumed';
                prerequisiteReady = false;
              } else {
                upstreamReceiptByBatchId.set(batchId, predecessor.receipts[0].receiptDigest);
              }
            }
          }
          if (prerequisiteReady) {
            const liveBlockers = await registeredBatchActivationBlockers(ctx, registration, todayIso);
            readiness = liveBlockers.length > 0
              ? 'blocked_live_preflight'
              : registration.activation.kind === 'initial'
                ? 'ready_initial'
                : 'ready_after_handoff';
          }
        }
      }
      readinessByBatchId.set(batchId, readiness);
    }

    const materializationMismatch = registryCode !== 'valid' || inspections.some((inspection) => (
      inspection.batches.length > 1
      || (inspection.batches.length === 1 && !inspection.registrationExact)
      || !inspection.assignmentsCompatible
    ));
    const materializedExact = inspections.every((inspection) => (
      inspection.registrationExact && inspection.assignmentsExact
    ));
    const materializationCode = materializationMismatch
      ? 'blocked_persisted_mismatch' as const
      : materializedExact
        ? 'materialized_exact' as const
        : 'materialization_required' as const;
    const releases = inspections.map((inspection) => {
      const registration = inspection.registration;
      const persistedStatus = inspection.batches.length === 1
        ? inspection.batches[0].status
        : null;
      return {
        batchId: registration.manifest.batchId,
        sequence: registration.sequence,
        dimension: registration.dimension,
        activationKind: registration.activation.kind,
        freezeDigest: registration.freezeDigest,
        itemCount: registration.manifest.count,
        expiresAt: registration.expiresAt,
        persistedStatus,
        persistedBatchRows: inspection.batches.length,
        persistedAssignmentRows: inspection.assignments.length,
        persistedReceiptRows: inspection.receipts.length,
        registrationExact: inspection.registrationExact,
        assignmentsExact: inspection.assignmentsExact,
        readinessCode: readinessByBatchId.get(registration.manifest.batchId)
          ?? 'blocked_persisted_mismatch' as const,
      };
    });
    let currentActivation: {
      batchId: string;
      freezeDigest: string;
      expectedUpstreamReceiptDigest: string | null;
      confirmationText: string;
      readinessCode: 'ready_initial' | 'ready_after_handoff';
    } | null = null;
    for (const release of releases) {
      if (release.readinessCode !== 'ready_initial'
        && release.readinessCode !== 'ready_after_handoff') continue;
      currentActivation = {
        batchId: release.batchId,
        freezeDigest: release.freezeDigest,
        expectedUpstreamReceiptDigest: upstreamReceiptByBatchId.get(release.batchId) ?? null,
        confirmationText: `ACTIVATE ${release.batchId}`,
        readinessCode: release.readinessCode,
      };
      break;
    }
    return {
      registryDigest: exactRegistryDigest,
      registryCode,
      materializationCode,
      registeredReleaseCount: releaseRegistrations.length,
      persistedBatchCount: inspections.reduce((total, inspection) => total + inspection.batches.length, 0),
      persistedAssignmentCount: inspections.reduce((total, inspection) => total + inspection.assignments.length, 0),
      releases,
      currentActivation,
    };
  },
});

/**
 * Owner-confirmed materialization of code-frozen release manifests. Pilot rows
 * are intentionally skipped, and this mutation never activates a batch.
 */
export const materializeRegisteredReleaseBatches = mutation({
  args: { expectedRegistryDigest: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const exactRegistryDigest = await registryDigest();
    if (args.expectedRegistryDigest !== exactRegistryDigest) {
      return { ok: false, code: 'registry_digest_mismatch', batchId: null, createdBatches: 0, createdAssignments: 0 };
    }
    const registrations: readonly ClinicalReviewBatchRegistration[] = CLINICAL_REVIEW_BATCH_REGISTRY;
    const releaseRegistrations = registrations.filter(
      (registration) => registration.authority === 'release',
    ) as readonly ClinicalReviewBatchRegistration[];
    const batchPlans: ReturnType<typeof batchInsertValue>[] = [];
    const assignmentPlans: Array<Awaited<ReturnType<typeof assignmentInsertValue>>> = [];
    const compileTargets = new Set<string>();
    const compileBatchIds = new Set<string>();
    let previousRelease: ClinicalReviewBatchRegistration | null = null;
    for (let index = 0; index < registrations.length; index += 1) {
      const registration = registrations[index];
      if (registration.sequence !== index + 1
        || compileBatchIds.has(registration.manifest.batchId)) {
        return { ok: false, code: 'registered_lane_dag_invalid', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
      }
      // Pilot registrations are append-only historical context, never a
      // release prerequisite. Production intentionally has no persisted pilot
      // batch/receipt, so the first release is the initial release-chain root.
      // Later releases must consume only the immediately prior release state.
      if (registration.authority === 'pilot') {
        if (registration.activation.kind !== 'initial' || previousRelease) {
          return { ok: false, code: 'registered_lane_dag_invalid', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
      } else if (!previousRelease) {
        if (registration.activation.kind !== 'initial') {
          return { ok: false, code: 'registered_lane_dag_invalid', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
        previousRelease = registration;
      } else {
        if (registration.activation.kind === 'initial'
          || registration.activation.previousBatchId !== previousRelease.manifest.batchId) {
          return { ok: false, code: 'registered_lane_dag_invalid', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
        previousRelease = registration;
      }
      compileBatchIds.add(registration.manifest.batchId);
      if (!roleMayReview(registration.manifest.reviewer.role, registration.dimension)
        || (registration.dimension !== 'evidence'
          && registration.manifest.reviewer.role !== 'clinical_reviewer')) {
        return { ok: false, code: 'registered_reviewer_role_mismatch', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
      }
      for (const item of registration.manifest.items) {
        if (registration.authority === 'release'
          && (!Number.isInteger(item.currentClinicalReviewCount)
            || item.currentClinicalReviewCount! < 0
            || !/^[a-f0-9]{64}$/.test(item.currentClinicalReviewsCanonicalSha256 ?? '')
            || !/^[a-f0-9]{64}$/.test(item.allClinicalReviewHistoryCanonicalSha256 ?? ''))) {
          return { ok: false, code: 'registered_review_preimage_missing', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
        const targetKey = `${item.kind}\u0000${item.slug}\u0000${registration.dimension}\u0000${item.reviewRevision}`;
        if (compileTargets.has(targetKey)) {
          return { ok: false, code: 'registered_target_collision', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
        compileTargets.add(targetKey);
      }
    }

    // Complete read/prevalidation pass. No writes are allowed above the marker
    // below; every false return therefore guarantees zero registry mutation.
    for (const registration of releaseRegistrations) {
      if (await sha256Canonical(registration.manifest) !== registration.freezeDigest
        || await sha256Canonical(clinicalReviewBatchRoutingPayload(registration))
          !== registration.routingCanonicalSha256) {
        return { ok: false, code: 'registered_manifest_invalid', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
      }
      const existingBatches = await ctx.db
        .query('clinicalReviewBatches')
        .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId))
        .take(2);
      if (existingBatches.length > 1) {
        return { ok: false, code: 'duplicate_batch_id', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
      }
      if (existingBatches.length === 1) {
        if (!exactPersistedBatchRegistration(existingBatches[0], registration)) {
          return { ok: false, code: 'persisted_batch_preimage_mismatch', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
      } else {
        batchPlans.push(batchInsertValue(registration));
      }

      for (const item of registration.manifest.items) {
        const assignment = await assignmentInsertValue(registration, item);
        const existingById = await ctx.db
          .query('clinicalReviewAssignments')
          .withIndex('by_assignment_id', (q) => q.eq('assignmentId', assignment.assignmentId))
          .take(2);
        if (existingById.length > 1) {
          return { ok: false, code: 'duplicate_assignment_id', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
        // Always query the semantic identity as well as the hash-derived id.
        // A matching assignmentId must not hide a second row occupying the
        // same slug/dimension/revision tuple in another batch.
        const targetRows = await ctx.db
          .query('clinicalReviewAssignments')
          .withIndex('by_exact_target', (q) => q
            .eq('contentSlug', item.slug)
            .eq('dimension', registration.dimension)
            .eq('reviewRevision', item.reviewRevision))
          .take(2);
        if (existingById.length === 1) {
          if (!exactPersistedAssignment(existingById[0], registration, item, assignment.assignmentId)) {
            return { ok: false, code: 'persisted_assignment_preimage_mismatch', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
          }
          if (targetRows.length !== 1 || targetRows[0]._id !== existingById[0]._id) {
            return { ok: false, code: 'persisted_target_collision', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
          }
          continue;
        }
        if (targetRows.length > 0) {
          return { ok: false, code: 'persisted_target_collision', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
        }
        assignmentPlans.push(assignment);
      }
    }

    // First write occurs only after the entire registry and existing database
    // state have passed. Convex commits this write set atomically.
    for (const batch of batchPlans) await ctx.db.insert('clinicalReviewBatches', batch);
    for (const assignment of assignmentPlans) {
      await ctx.db.insert('clinicalReviewAssignments', assignment);
    }
    const createdBatches = batchPlans.length;
    const createdAssignments = assignmentPlans.length;
    await logAudit(ctx, userId, 'clinicalReviewRegistry.materialize', 'clinicalReviewBatches', undefined,
      `registry ${exactRegistryDigest} · batches ${createdBatches} · assignments ${createdAssignments}`);
    return { ok: true, code: 'materialized', batchId: null, createdBatches, createdAssignments };
  },
});

/** Server-authoritative, owner-only transition from frozen to the one active batch. */
export const activateRegisteredBatch = mutation({
  args: {
    batchId: v.string(),
    expectedFreezeDigest: v.string(),
    expectedUpstreamReceiptDigest: v.optional(v.string()),
  },
  returns: resultValidator,
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const registration = registrationById(args.batchId);
    if (!registration || registration.authority !== 'release'
      || registration.freezeDigest !== args.expectedFreezeDigest
      || (registration.activation.kind === 'initial' && args.expectedUpstreamReceiptDigest !== undefined)
      || (registration.activation.kind !== 'initial' && !args.expectedUpstreamReceiptDigest)) {
      return { ok: false, code: 'registration_mismatch', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const batches = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', args.batchId)).take(2);
    if (batches.length !== 1 || batches[0].status !== 'frozen'
      || !exactPersistedBatchRegistration(batches[0], registration)) {
      return { ok: false, code: 'batch_not_frozen', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const persistedAssignments = await ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_batch_id_and_ordinal', (q) => q.eq('batchId', args.batchId))
      .take(registration.manifest.count + 1);
    if (persistedAssignments.length !== registration.manifest.count) {
      return { ok: false, code: 'assignment_count_mismatch', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    for (const item of registration.manifest.items) {
      const assignmentId = await frozenClinicalDecisionKey(registration, item);
      const matches = persistedAssignments.filter((row) => row.assignmentId === assignmentId);
      if (matches.length !== 1
        || !exactPersistedAssignment(matches[0], registration, item, assignmentId)) {
        return { ok: false, code: 'assignment_preimage_mismatch', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
      }
    }
    const active = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_status', (q) => q.eq('status', 'active')).take(2);
    if (active.length > 0) {
      return { ok: false, code: 'active_batch_exists', batchId: active[0].batchId, createdBatches: 0, createdAssignments: 0 };
    }
    if (Date.now() >= registration.expiresAt) {
      return { ok: false, code: 'batch_expired', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const activation = registration.activation;
    if (activation.kind === 'after_handoff') {
      const predecessor = registrationById(activation.previousBatchId);
      const predecessorRows = await ctx.db.query('clinicalReviewBatches')
        .withIndex('by_batch_id', (q) => q.eq('batchId', activation.previousBatchId)).take(2);
      const receipts = await ctx.db.query('clinicalReviewBatchReceipts')
        .withIndex('by_batch_id', (q) => q.eq('batchId', activation.previousBatchId)).take(2);
      if (!predecessor
        || predecessor.freezeDigest !== activation.expectedPreviousFreezeDigest
        || predecessorRows.length !== 1
        || predecessorRows[0].status !== 'completed'
        || !exactPersistedBatchRegistration(predecessorRows[0], predecessor)
        || !args.expectedUpstreamReceiptDigest
        || receipts.length !== 1
        || !await exactHandoffReceipt(ctx, receipts[0], predecessor)
        || receipts[0].receiptDigest !== args.expectedUpstreamReceiptDigest) {
        return { ok: false, code: 'upstream_handoff_missing', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
      }
    } else if (activation.kind === 'after_changes_requested_refreeze') {
      const predecessor = registrationById(activation.previousBatchId);
      if (!predecessor) {
        return { ok: false, code: 'refreeze_predecessor_missing', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
      }
      const priorRows = await ctx.db.query('clinicalReviewBatches')
        .withIndex('by_batch_id', (q) => q.eq('batchId', predecessor.manifest.batchId)).take(2);
      if (priorRows.length !== 1 || priorRows[0].status !== 'stopped_changes_requested'
        || !exactPersistedBatchRegistration(priorRows[0], predecessor)) {
        return { ok: false, code: 'refreeze_predecessor_not_stopped', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
      }
      const decisions = [];
      for (const item of predecessor.manifest.items) {
        const decisionKey = await frozenClinicalDecisionKey(predecessor, item);
        const rows = await ctx.db.query('contentReviews')
          .withIndex('by_decision_key', (q) => q.eq('decisionKey', decisionKey)).take(2);
        if (rows.length === 1
          && rows[0].clinicalReviewBatchId === predecessor.manifest.batchId
          && rows[0].contentSlug === item.slug
          && rows[0].contentVersion === item.reviewRevision
          && rows[0].reviewRevision === item.reviewRevision
          && rows[0].dimension === predecessor.dimension
          && String(rows[0].reviewerId) === predecessor.manifest.reviewer.userId) {
          decisions.push({
            assignmentId: decisionKey,
            slug: item.slug,
            kind: item.kind,
            reviewRevision: item.reviewRevision,
            decision: rows[0].decision,
            note: rows[0].note?.trim() || null,
            reviewedAt: rows[0].reviewedAt,
            receiptId: String(rows[0]._id),
          });
        } else if (rows.length > 0) {
          return { ok: false, code: 'refreeze_decision_preimage_mismatch', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
        }
      }
      const changes = decisions.filter((decision) => decision.decision === 'changes_requested');
      const digest = await sha256Canonical({
        batchId: predecessor.manifest.batchId,
        freezeDigest: predecessor.freezeDigest,
        decisions,
      });
      const successorTargets = new Map(registration.manifest.items.map((item) => [`${item.kind}:${item.slug}`, item]));
      if (changes.length === 0
        || digest !== activation.expectedDecisionSetDigest
        || args.expectedUpstreamReceiptDigest !== digest
        || changes.some((decision) => {
          const successor = successorTargets.get(`${decision.kind}:${decision.slug}`);
          return !successor || successor.reviewRevision <= decision.reviewRevision;
        })) {
        return { ok: false, code: 'refreeze_decision_set_mismatch', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
      }
    }
    const consumers = activation.kind === 'initial' ? [] : await ctx.db
      .query('clinicalReviewBatches')
      .withIndex('by_predecessor_batch_id', (q) => q.eq('predecessorBatchId', activation.previousBatchId))
      .take(3);
    if (consumers.some((row) => row.batchId !== args.batchId
      && (row.status === 'active' || row.status === 'completed'))) {
      return { ok: false, code: 'upstream_receipt_already_consumed', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const liveBlockers = await registeredBatchActivationBlockers(ctx, registration, todayIsoUtc());
    if (liveBlockers.length > 0) {
      return { ok: false, code: `live_preflight_failed:${liveBlockers.join(',')}`, batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const now = Date.now();
    await ctx.db.patch(batches[0]._id, {
      status: 'active',
      activatedAt: now,
      ...(args.expectedUpstreamReceiptDigest
        ? { consumedUpstreamReceiptDigest: args.expectedUpstreamReceiptDigest }
        : {}),
    });
    await logAudit(ctx, userId, 'clinicalReviewRegistry.activate', 'clinicalReviewBatches', String(batches[0]._id),
      `${args.batchId} · ${registration.freezeDigest}`);
    return { ok: true, code: 'activated', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
  },
});

/** Owner-only fail-closed invalidation, propagated to every downstream batch. */
export const invalidateRegisteredBatch = mutation({
  args: { batchId: v.string(), expectedFreezeDigest: v.string(), reason: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const reason = args.reason.trim();
    if (!reason) return { ok: false, code: 'reason_required', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    let currentBatchId: string | null = args.batchId;
    let expectedFreezeDigest: string | null = args.expectedFreezeDigest;
    const rowsToInvalidate = [];
    const seen = new Set<string>();
    const now = Date.now();
    // Resolve and validate the full downstream chain before the first patch.
    while (currentBatchId && rowsToInvalidate.length < CLINICAL_REVIEW_BATCH_REGISTRY.length) {
      if (seen.has(currentBatchId)) {
        return { ok: false, code: 'downstream_cycle', batchId: currentBatchId, createdBatches: 0, createdAssignments: 0 };
      }
      seen.add(currentBatchId);
      const rows = await ctx.db.query('clinicalReviewBatches')
        .withIndex('by_batch_id', (q) => q.eq('batchId', currentBatchId!)).take(2);
      if (rows.length !== 1 || (expectedFreezeDigest && rows[0].freezeDigest !== expectedFreezeDigest)) {
        return { ok: false, code: 'batch_preimage_mismatch', batchId: currentBatchId, createdBatches: 0, createdAssignments: 0 };
      }
      const registration = registrationById(rows[0].batchId);
      if (!registration || !exactPersistedBatchRegistration(rows[0], registration)) {
        return { ok: false, code: 'batch_registration_mismatch', batchId: currentBatchId, createdBatches: 0, createdAssignments: 0 };
      }
      rowsToInvalidate.push(rows[0]);
      const downstream = await ctx.db.query('clinicalReviewBatches')
        .withIndex('by_predecessor_batch_id', (q) => q.eq('predecessorBatchId', currentBatchId!)).take(2);
      if (downstream.length > 1) {
        return { ok: false, code: 'downstream_fork', batchId: currentBatchId, createdBatches: 0, createdAssignments: 0 };
      }
      currentBatchId = downstream.length === 1 ? downstream[0].batchId : null;
      expectedFreezeDigest = null;
    }
    if (currentBatchId) {
      return { ok: false, code: 'downstream_bound_exceeded', batchId: currentBatchId, createdBatches: 0, createdAssignments: 0 };
    }
    for (const row of rowsToInvalidate) {
      if (row.status !== 'invalidated') {
        await ctx.db.patch(row._id, { status: 'invalidated', invalidatedAt: now, invalidationReason: reason });
      }
    }
    const invalidated = rowsToInvalidate.filter((row) => row.status !== 'invalidated').length;
    await logAudit(ctx, userId, 'clinicalReviewRegistry.invalidate', 'clinicalReviewBatches', args.batchId,
      `${args.batchId} · ${reason} · downstream ${invalidated}`);
    return { ok: true, code: 'invalidated', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
  },
});
