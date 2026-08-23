import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { sha256Canonical } from './aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  type ClinicalReviewBatchItem,
  type ClinicalReviewBatchRegistration,
} from './clinicalReviewBatchData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

export type RegisteredClinicalReviewTarget = {
  registration: ClinicalReviewBatchRegistration;
  item: ClinicalReviewBatchItem;
};

export function registeredClinicalReviewTargets(
  contentSlug: string,
  reviewRevision: number,
): RegisteredClinicalReviewTarget[] {
  return CLINICAL_REVIEW_BATCH_REGISTRY.flatMap((registration) =>
    registration.manifest.items
      .filter((item) => item.slug === contentSlug && item.reviewRevision === reviewRevision)
      .map((item) => ({ registration, item })),
  );
}

export function isRegisteredClinicalReviewTarget(contentSlug: string, reviewRevision: number): boolean {
  return registeredClinicalReviewTargets(contentSlug, reviewRevision).length > 0;
}

export async function frozenClinicalDecisionKey(
  registration: ClinicalReviewBatchRegistration,
  item: ClinicalReviewBatchItem,
): Promise<string> {
  return await sha256Canonical({
    batchId: registration.manifest.batchId,
    batchHash: registration.freezeDigest,
    ordinal: item.ordinal,
    kind: item.kind,
    slug: item.slug,
    reviewRevision: item.reviewRevision,
    dimension: registration.dimension,
    reviewerUserId: registration.manifest.reviewer.userId,
  });
}

function exactApprovedDecision(
  row: Doc<'contentReviews'>,
  registration: ClinicalReviewBatchRegistration,
  item: ClinicalReviewBatchItem,
  decisionKey: string,
): boolean {
  return row.decisionKey === decisionKey
    && row.clinicalReviewBatchId === registration.manifest.batchId
    && row.contentSlug === item.slug
    && row.contentVersion === item.reviewRevision
    && row.reviewRevision === item.reviewRevision
    && row.dimension === registration.dimension
    && row.decision === 'approved'
    && String(row.reviewerId) === registration.manifest.reviewer.userId;
}

function exactHandoffReceipt(
  row: Doc<'clinicalReviewBatchReceipts'>,
  registration: ClinicalReviewBatchRegistration,
): boolean {
  return row.batchId === registration.manifest.batchId
    && row.freezeDigest === registration.freezeDigest
    && row.authority === 'release'
    && row.decisionCount === registration.manifest.count
    && String(row.reviewerId) === registration.manifest.reviewer.userId
    && /^[a-f0-9]{64}$/.test(row.digest)
    && /^[a-f0-9]{64}$/.test(row.receiptDigest);
}

function exactPersistedReleaseBatch(
  row: Doc<'clinicalReviewBatches'>,
  registration: ClinicalReviewBatchRegistration,
): boolean {
  const activation = registration.activation;
  return registration.authority === 'release'
    && row.batchId === registration.manifest.batchId
    && row.sequence === registration.sequence
    && row.laneGraphVersion === registration.laneGraphVersion
    && row.dimension === registration.dimension
    && row.authority === 'release'
    && row.status === 'completed'
    && row.freezeDigest === registration.freezeDigest
    && row.routingDigest === registration.routingCanonicalSha256
    && row.itemCount === registration.manifest.count
    && row.frozenAt === registration.frozenAt
    && row.expiresAt === registration.expiresAt
    && row.reviewerProfileId === registration.manifest.reviewer.profileId
    && String(row.reviewerId) === registration.manifest.reviewer.userId
    && row.reviewerIdentityDigest === registration.manifest.reviewer.identityCanonicalSha256
    && row.activationKind === activation.kind
    && row.predecessorBatchId === (activation.kind === 'initial' ? undefined : activation.previousBatchId)
    && row.expectedUpstreamStateDigest === (activation.kind === 'initial'
      ? undefined
      : activation.kind === 'after_handoff'
        ? activation.expectedPreviousFreezeDigest
        : activation.expectedDecisionSetDigest)
    && (activation.kind === 'after_handoff'
      ? !!row.consumedUpstreamReceiptDigest && /^[a-f0-9]{64}$/.test(row.consumedUpstreamReceiptDigest)
      : row.consumedUpstreamReceiptDigest === undefined);
}

function exactPersistedAssignment(
  row: Doc<'clinicalReviewAssignments'>,
  registration: ClinicalReviewBatchRegistration,
  item: ClinicalReviewBatchItem,
  assignmentId: string,
): boolean {
  return row.batchId === registration.manifest.batchId
    && row.assignmentId === assignmentId
    && row.ordinal === item.ordinal
    && row.dimension === registration.dimension
    && row.kind === item.kind
    && row.contentSlug === item.slug
    && row.reviewRevision === item.reviewRevision
    && String(row.contentId) === item.contentId
    && row.contentCreationTime === item.contentCreationTime
    && row.contentUpdatedAt === item.contentUpdatedAt
    && row.contentCanonicalSha256 === item.contentCanonicalSha256
    && String(row.linkId) === item.linkId
    && row.linkCreationTime === item.linkCreationTime
    && row.linkUpdatedAt === item.linkUpdatedAt
    && row.linkCanonicalSha256 === item.linkCanonicalSha256
    && row.sourceCount === item.sourceCount
    && row.sourcesCanonicalSha256 === item.sourcesCanonicalSha256
    && row.mediaCount === item.mediaCount
    && row.mediaCanonicalSha256 === item.mediaCanonicalSha256
    && row.aiCanonicalSha256 === item.aiCanonicalSha256
    && row.sourceIds.length === item.sourceIds.length
    && row.sourceIds.every((sourceId, index) => sourceId === item.sourceIds[index])
    && JSON.stringify(row.upstreamReviewDigests) === JSON.stringify(item.upstreamReviewDigests ?? []);
}

/**
 * Publication and parent visibility gate for compile-time frozen targets.
 * Generic approved review rows are insufficient: every exact registered
 * dimension must have its idempotent decision row and the batch's unanimous
 * server-issued handoff receipt.
 */
export async function frozenClinicalPublicationApproval(
  ctx: DatabaseContext,
  content: { slug: string; reviewRevision?: number; version?: number },
): Promise<{
  required: boolean;
  allowed: boolean;
  missing: string[];
  governedDimensions: string[];
}> {
  const reviewRevision = content.reviewRevision ?? content.version ?? 1;
  const targets = registeredClinicalReviewTargets(content.slug, reviewRevision);
  if (targets.length === 0) {
    return { required: false, allowed: true, missing: [], governedDimensions: [] };
  }

  const missing: string[] = [];
  let governed = false;
  const governedDimensions = new Set<string>();
  const receiptByBatch = new Map<string, Doc<'clinicalReviewBatchReceipts'> | null>();
  for (const { registration, item } of targets) {
    // Default-off migration rule: compile-time pilot history does not govern
    // release or parent visibility. Only an exact persisted row explicitly
    // marked `release` turns this gate on for its registered targets.
    const batchRows = await ctx.db
      .query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId))
      .take(2);
    if (batchRows.length === 0 || batchRows.every((row) => row.authority === 'pilot')) continue;
    governed = true;
    governedDimensions.add(registration.dimension);
    if (batchRows.length !== 1 || !exactPersistedReleaseBatch(batchRows[0], registration)) {
      missing.push(`${registration.dimension}:persisted_batch`);
      continue;
    }

    const decisionKey = await frozenClinicalDecisionKey(registration, item);
    const assignmentRows = await ctx.db
      .query('clinicalReviewAssignments')
      .withIndex('by_assignment_id', (q) => q.eq('assignmentId', decisionKey))
      .take(2);
    if (assignmentRows.length !== 1
      || !exactPersistedAssignment(assignmentRows[0], registration, item, decisionKey)) {
      missing.push(`${registration.dimension}:persisted_assignment`);
    }
    const decisions = await ctx.db
      .query('contentReviews')
      .withIndex('by_decision_key', (q) => q.eq('decisionKey', decisionKey))
      .take(2);
    if (decisions.length !== 1 || !exactApprovedDecision(decisions[0], registration, item, decisionKey)) {
      missing.push(`${registration.dimension}:frozen_approval`);
    }

    let receipt = receiptByBatch.get(registration.manifest.batchId);
    if (receipt === undefined) {
      const rows = await ctx.db
        .query('clinicalReviewBatchReceipts')
        .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId))
        .take(2);
      receipt = rows.length === 1 ? rows[0] : null;
      receiptByBatch.set(registration.manifest.batchId, receipt);
    }
    if (!receipt || !exactHandoffReceipt(receipt, registration)) {
      missing.push(`${registration.dimension}:batch_handoff`);
    }
  }

  return {
    required: governed,
    allowed: !governed || missing.length === 0,
    missing: [...new Set(missing)],
    governedDimensions: [...governedDimensions],
  };
}
