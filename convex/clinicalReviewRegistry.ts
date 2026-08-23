import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation } from './_generated/server';
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
        if (existingById.length === 1) {
          if (!exactPersistedAssignment(existingById[0], registration, item, assignment.assignmentId)) {
            return { ok: false, code: 'persisted_assignment_preimage_mismatch', batchId: registration.manifest.batchId, createdBatches: 0, createdAssignments: 0 };
          }
          continue;
        }
        const targetRows = await ctx.db
          .query('clinicalReviewAssignments')
          .withIndex('by_exact_target', (q) => q
            .eq('contentSlug', item.slug)
            .eq('dimension', registration.dimension)
            .eq('reviewRevision', item.reviewRevision))
          .take(2);
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
        || !exactHandoffReceipt(receipts[0], predecessor)
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
