import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation } from './_generated/server';
import { logAudit } from './audit';
import { requireOwner } from './lib/auth';
import { sha256Canonical } from './lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from './lib/clinicalReviewBatchData';
import { frozenClinicalDecisionKey } from './lib/clinicalReviewBatchProvenance';

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
    let createdBatches = 0;
    let createdAssignments = 0;
    for (const registration of CLINICAL_REVIEW_BATCH_REGISTRY) {
      if (registration.authority !== 'release') continue;
      if (await sha256Canonical(registration.manifest) !== registration.freezeDigest
        || await sha256Canonical(clinicalReviewBatchRoutingPayload(registration))
          !== registration.routingCanonicalSha256) {
        return {
          ok: false,
          code: 'registered_manifest_invalid',
          batchId: registration.manifest.batchId,
          createdBatches,
          createdAssignments,
        };
      }
      const existing = await ctx.db
        .query('clinicalReviewBatches')
        .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId))
        .take(2);
      if (existing.length > 1) {
        return { ok: false, code: 'duplicate_batch_id', batchId: registration.manifest.batchId, createdBatches, createdAssignments };
      }
      if (existing.length === 0) {
        const activation = registration.activation;
        await ctx.db.insert('clinicalReviewBatches', {
          batchId: registration.manifest.batchId,
          sequence: registration.sequence,
          laneGraphVersion: registration.laneGraphVersion,
          dimension: registration.dimension,
          authority: registration.authority,
          status: 'frozen',
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
        });
        createdBatches += 1;
      }
      for (const item of registration.manifest.items) {
        const assignmentId = await frozenClinicalDecisionKey(registration, item);
        const existingAssignments = await ctx.db
          .query('clinicalReviewAssignments')
          .withIndex('by_assignment_id', (q) => q.eq('assignmentId', assignmentId))
          .take(2);
        if (existingAssignments.length > 1) {
          return { ok: false, code: 'duplicate_assignment_id', batchId: registration.manifest.batchId, createdBatches, createdAssignments };
        }
        if (existingAssignments.length === 0) {
          await ctx.db.insert('clinicalReviewAssignments', {
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
            upstreamReviewDigests: [...(item.upstreamReviewDigests ?? [])],
            createdAt: registration.frozenAt,
          });
          createdAssignments += 1;
        }
      }
    }
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
      || registration.freezeDigest !== args.expectedFreezeDigest) {
      return { ok: false, code: 'registration_mismatch', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const batches = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', args.batchId)).take(2);
    if (batches.length !== 1 || batches[0].status !== 'frozen') {
      return { ok: false, code: 'batch_not_frozen', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const active = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_status', (q) => q.eq('status', 'active')).take(2);
    if (active.length > 0) {
      return { ok: false, code: 'active_batch_exists', batchId: active[0].batchId, createdBatches: 0, createdAssignments: 0 };
    }
    if (Date.now() >= registration.expiresAt) {
      return { ok: false, code: 'batch_expired', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    if (registration.activation.kind === 'after_handoff') {
      const predecessor = registrationById(registration.activation.previousBatchId);
      const receipts = await ctx.db.query('clinicalReviewBatchReceipts')
        .withIndex('by_batch_id', (q) => q.eq('batchId', registration.activation.previousBatchId)).take(2);
      if (!predecessor
        || predecessor.freezeDigest !== registration.activation.expectedPreviousFreezeDigest
        || !args.expectedUpstreamReceiptDigest
        || receipts.length !== 1
        || receipts[0].batchId !== predecessor.manifest.batchId
        || receipts[0].freezeDigest !== predecessor.freezeDigest
        || receipts[0].authority !== predecessor.authority
        || receipts[0].decisionCount !== predecessor.manifest.count
        || String(receipts[0].reviewerId) !== predecessor.manifest.reviewer.userId
        || receipts[0].receiptDigest !== args.expectedUpstreamReceiptDigest) {
        return { ok: false, code: 'upstream_handoff_missing', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
      }
    } else if (registration.activation.kind !== 'initial') {
      // Refreeze activation additionally depends on exact decision-set checks in
      // the assigned-decision service. Keep it closed until that signed state is
      // present; a generic owner click cannot bypass it.
      return { ok: false, code: 'refreeze_activation_requires_verified_state', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
    }
    const consumers = registration.activation.kind === 'initial' ? [] : await ctx.db
      .query('clinicalReviewBatches')
      .withIndex('by_predecessor_batch_id', (q) => q.eq('predecessorBatchId', registration.activation.previousBatchId))
      .take(3);
    if (consumers.some((row) => row.batchId !== args.batchId
      && (row.status === 'active' || row.status === 'completed'))) {
      return { ok: false, code: 'upstream_receipt_already_consumed', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
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
    let invalidated = 0;
    const now = Date.now();
    while (currentBatchId && invalidated < CLINICAL_REVIEW_BATCH_REGISTRY.length) {
      const rows = await ctx.db.query('clinicalReviewBatches')
        .withIndex('by_batch_id', (q) => q.eq('batchId', currentBatchId!)).take(2);
      if (rows.length !== 1 || (expectedFreezeDigest && rows[0].freezeDigest !== expectedFreezeDigest)) {
        return { ok: false, code: 'batch_preimage_mismatch', batchId: currentBatchId, createdBatches: 0, createdAssignments: 0 };
      }
      if (rows[0].status !== 'invalidated') {
        await ctx.db.patch(rows[0]._id, { status: 'invalidated', invalidatedAt: now, invalidationReason: reason });
        invalidated += 1;
      }
      const downstream = await ctx.db.query('clinicalReviewBatches')
        .withIndex('by_predecessor_batch_id', (q) => q.eq('predecessorBatchId', currentBatchId!)).take(2);
      currentBatchId = downstream.length === 1 ? downstream[0].batchId : null;
      expectedFreezeDigest = null;
    }
    await logAudit(ctx, userId, 'clinicalReviewRegistry.invalidate', 'clinicalReviewBatches', args.batchId,
      `${args.batchId} · ${reason} · downstream ${invalidated}`);
    return { ok: true, code: 'invalidated', batchId: args.batchId, createdBatches: 0, createdAssignments: 0 };
  },
});
