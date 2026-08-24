import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { sha256Canonical } from './aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_CONTRACT,
  CLINICAL_REVIEW_BATCH_CONTRACT_VERSION,
} from './clinicalReviewBatchContract';
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

/** Generic import/edit lanes may not mutate any compile-frozen release input. */
export function isRegisteredReleaseContentTarget(kind: string, contentSlug: string): boolean {
  // Slug is the immutable catalogue identity. Ignore the caller-supplied kind
  // so a wrong-type seed/import cannot evade a frozen release registration.
  void kind;
  const registrations: readonly ClinicalReviewBatchRegistration[] = CLINICAL_REVIEW_BATCH_REGISTRY;
  return registrations.some((registration) =>
    registration.authority === 'release'
      && registration.manifest.items.some((item) => item.slug === contentSlug));
}

export function isRegisteredReleaseSourceId(sourceId: string): boolean {
  const registrations: readonly ClinicalReviewBatchRegistration[] = CLINICAL_REVIEW_BATCH_REGISTRY;
  return registrations.some((registration) =>
    registration.authority === 'release'
      && registration.manifest.items.some((item) => item.sourceIds.some((id) => id === sourceId)));
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
    && String(row.reviewerId) === registration.manifest.reviewer.userId
    && row.reviewerDisplayName === registration.manifest.reviewer.displayName
    && row.reviewerQualification === registration.manifest.reviewer.qualification
    && row.reviewerRole === registration.manifest.reviewer.role
    && row.createdAt === row.reviewedAt
    && row.updatedAt === row.reviewedAt
    && (row.note === undefined || (row.note.trim().length > 0 && row.note === row.note.trim()));
}

async function expectedHandoffReceipt(
  ctx: DatabaseContext,
  registration: ClinicalReviewBatchRegistration,
) {
  if (registration.authority !== 'release') return null;
  const decisions = [];
  for (const item of registration.manifest.items) {
    const assignmentId = await frozenClinicalDecisionKey(registration, item);
    const rows = await ctx.db.query('contentReviews')
      .withIndex('by_decision_key', (q) => q.eq('decisionKey', assignmentId)).take(2);
    if (rows.length !== 1 || !exactApprovedDecision(rows[0], registration, item, assignmentId)) {
      return null;
    }
    decisions.push({
      assignmentId,
      slug: item.slug,
      reviewRevision: item.reviewRevision,
      receipt: {
        decision: rows[0].decision,
        note: rows[0].note?.trim() || null,
        reviewedAt: rows[0].reviewedAt,
        receiptId: String(rows[0]._id),
      },
    });
  }
  if (decisions.length !== registration.manifest.count) return null;
  const completedAt = Math.max(...decisions.map((entry) => entry.receipt.reviewedAt));
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
  return {
    completedAt,
    digest,
    receiptDigest: await sha256Canonical({
      digest,
      freezeReceiptDigest,
      reviewerUserId: registration.manifest.reviewer.userId,
    }),
  };
}

export async function exactHandoffReceipt(
  ctx: DatabaseContext,
  row: Doc<'clinicalReviewBatchReceipts'>,
  registration: ClinicalReviewBatchRegistration,
): Promise<boolean> {
  const expected = await expectedHandoffReceipt(ctx, registration);
  return expected !== null
    && row.batchId === registration.manifest.batchId
    && row.freezeDigest === registration.freezeDigest
    && row.authority === registration.authority
    && row.decisionCount === registration.manifest.count
    && String(row.reviewerId) === registration.manifest.reviewer.userId
    && row.completedAt === expected.completedAt
    && row.createdAt === expected.completedAt
    && row.digest === expected.digest
    && row.receiptDigest === expected.receiptDigest;
}

export function exactPersistedBatchRegistration(
  row: Doc<'clinicalReviewBatches'>,
  registration: ClinicalReviewBatchRegistration,
): boolean {
  const activation = registration.activation;
  return registration.authority === 'release'
    && row.batchId === registration.manifest.batchId
    && row.sequence === registration.sequence
    && row.laneGraphVersion === registration.laneGraphVersion
    && row.dimension === registration.dimension
    && row.authority === registration.authority
    && row.freezeDigest === registration.freezeDigest
    && row.routingDigest === registration.routingCanonicalSha256
    && row.itemCount === registration.manifest.count
    && row.frozenAt === registration.frozenAt
    && row.expiresAt === registration.expiresAt
    && row.reviewerProfileId === registration.manifest.reviewer.profileId
    && String(row.reviewerId) === registration.manifest.reviewer.userId
    && row.reviewerDisplayName === registration.manifest.reviewer.displayName
    && row.reviewerQualification === registration.manifest.reviewer.qualification
    && row.reviewerRole === registration.manifest.reviewer.role
    && row.reviewerIdentityDigest === registration.manifest.reviewer.identityCanonicalSha256
    && row.createdAt === registration.frozenAt
    && row.activationKind === activation.kind
    && row.predecessorBatchId === (activation.kind === 'initial' ? undefined : activation.previousBatchId)
    && row.expectedUpstreamStateDigest === (activation.kind === 'initial'
      ? undefined
      : activation.kind === 'after_handoff'
        ? activation.expectedPreviousFreezeDigest
        : activation.expectedDecisionSetDigest);
}

function exactCompletedReleaseBatch(
  row: Doc<'clinicalReviewBatches'>,
  registration: ClinicalReviewBatchRegistration,
): boolean {
  return exactPersistedBatchRegistration(row, registration)
    && row.status === 'completed'
    && (registration.activation.kind === 'initial'
      ? row.consumedUpstreamReceiptDigest === undefined
      : !!row.consumedUpstreamReceiptDigest
        && /^[a-f0-9]{64}$/.test(row.consumedUpstreamReceiptDigest));
}

export async function exactClinicalReviewUpstreamChain(
  ctx: DatabaseContext,
  registration: ClinicalReviewBatchRegistration,
  row: Doc<'clinicalReviewBatches'>,
  seen = new Set<string>(),
): Promise<boolean> {
  if (seen.size >= 32 || seen.has(registration.manifest.batchId)) return false;
  seen.add(registration.manifest.batchId);
  const activation = registration.activation;
  if (activation.kind === 'initial') return row.consumedUpstreamReceiptDigest === undefined;
  const predecessor = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (candidate) => candidate.manifest.batchId === activation.previousBatchId,
  ) as ClinicalReviewBatchRegistration | undefined;
  if (!predecessor) return false;
  const predecessorRows = await ctx.db.query('clinicalReviewBatches')
    .withIndex('by_batch_id', (q) => q.eq('batchId', predecessor.manifest.batchId)).take(2);
  if (predecessor.authority === 'release') {
    if (predecessorRows.length !== 1
      || predecessorRows[0].status === 'invalidated'
      || (activation.kind === 'after_handoff' && predecessorRows[0].status !== 'completed')
      || !exactPersistedBatchRegistration(predecessorRows[0], predecessor)
      || !await exactClinicalReviewUpstreamChain(ctx, predecessor, predecessorRows[0], seen)) return false;
  } else if (predecessorRows.some((candidate) => candidate.status === 'invalidated')) {
    return false;
  }
  if (activation.kind === 'after_changes_requested_refreeze') {
    return row.consumedUpstreamReceiptDigest === activation.expectedDecisionSetDigest
      && predecessorRows.length === 1
      && predecessorRows[0].status === 'stopped_changes_requested';
  }
  const receipts = await ctx.db.query('clinicalReviewBatchReceipts')
    .withIndex('by_batch_id', (q) => q.eq('batchId', predecessor.manifest.batchId)).take(2);
  return receipts.length === 1
    && await exactHandoffReceipt(ctx, receipts[0], predecessor)
    && predecessorRows[0].completedAt === receipts[0].completedAt
    && row.consumedUpstreamReceiptDigest === receipts[0].receiptDigest;
}

export function exactPersistedAssignment(
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
    && row.currentClinicalReviewCount === item.currentClinicalReviewCount
    && row.currentClinicalReviewsCanonicalSha256 === item.currentClinicalReviewsCanonicalSha256
    && row.allClinicalReviewHistoryCanonicalSha256 === item.allClinicalReviewHistoryCanonicalSha256
    && row.createdAt === registration.frozenAt
    && row.sourceIds.length === item.sourceIds.length
    && row.sourceIds.every((sourceId, index) => sourceId === item.sourceIds[index])
    && JSON.stringify(row.upstreamReviewDigests) === JSON.stringify(item.upstreamReviewDigests ?? []);
}

/**
 * Database-authoritative release-governance lookup. The content slug is the
 * immutable identity: a caller cannot evade the guard by presenting a wrong
 * or newly changed content type. Any persisted release batch keeps the target
 * on the controlled correction/refreeze path, including after invalidation.
 */
export async function isPersistedReleaseGovernedContent(
  ctx: DatabaseContext,
  contentSlug: string,
): Promise<boolean> {
  const assignments = await ctx.db.query('clinicalReviewAssignments')
    .withIndex('by_exact_target', (q) => q.eq('contentSlug', contentSlug))
    .take(33);
  if (assignments.length > 32) return true;
  for (const batchId of new Set(assignments.map((row) => row.batchId))) {
    const batches = await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_batch_id', (q) => q.eq('batchId', batchId)).take(2);
    if (batches.length !== 1 || batches[0].authority === 'release') return true;
  }
  return false;
}

/** Bounded batch-operation snapshot: read governed assignments, not the catalogue. */
async function persistedReleaseGovernedAssignments(
  ctx: DatabaseContext,
): Promise<Doc<'clinicalReviewAssignments'>[]> {
  const statuses: readonly Doc<'clinicalReviewBatches'>['status'][] = [
    'frozen',
    'active',
    'completed',
    'stopped_changes_requested',
    'invalidated',
  ];
  const batches = (await Promise.all(statuses.map(async (status) =>
    await ctx.db.query('clinicalReviewBatches')
      .withIndex('by_status', (q) => q.eq('status', status)).take(33),
  ))).flat();
  if (batches.length > 32) throw new Error('Clinical release batch governance bound exceeded');
  const assignments: Doc<'clinicalReviewAssignments'>[] = [];
  for (const batch of batches.filter((row) => row.authority === 'release')) {
    const batchAssignments = await ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_batch_id_and_ordinal', (q) => q.eq('batchId', batch.batchId)).take(26);
    if (batchAssignments.length > 25) throw new Error('Clinical release assignment governance bound exceeded');
    assignments.push(...batchAssignments);
  }
  return assignments;
}

export async function persistedReleaseGovernedContentSlugs(
  ctx: DatabaseContext,
): Promise<Set<string>> {
  return new Set((await persistedReleaseGovernedAssignments(ctx))
    .map((assignment) => assignment.contentSlug));
}

export async function assertNoPersistedReleaseGovernedContent(
  ctx: DatabaseContext,
  slugs: Iterable<string>,
): Promise<void> {
  const governed = await persistedReleaseGovernedContentSlugs(ctx);
  const overlap = [...new Set(slugs)].filter((slug) => governed.has(slug));
  if (overlap.length > 0) {
    throw new Error(`Frozen release targets require invalidation and refreeze: ${overlap.join(', ')}`);
  }
}

/** Sources are compile-frozen inputs; their persisted target batch must exist. */
export async function isPersistedReleaseGovernedSource(
  ctx: DatabaseContext,
  sourceId: string,
): Promise<boolean> {
  return (await persistedReleaseGovernedAssignments(ctx))
    .some((assignment) => assignment.sourceIds.includes(sourceId));
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
  const registrations: readonly ClinicalReviewBatchRegistration[] = CLINICAL_REVIEW_BATCH_REGISTRY;
  const registeredReleaseTargetsForSlug = registrations.flatMap((registration) =>
    registration.authority === 'release'
      ? registration.manifest.items
        .filter((item) => item.slug === content.slug)
        .map((item) => ({ registration: registration as ClinicalReviewBatchRegistration, item }))
      : [],
  );
  const exactReleaseTargetExists = registeredReleaseTargetsForSlug.some(
    ({ item }) => item.reviewRevision === reviewRevision,
  );
  if (!exactReleaseTargetExists && registeredReleaseTargetsForSlug.length > 0) {
    const governedDimensions = new Set<string>();
    for (const { registration } of registeredReleaseTargetsForSlug) {
      const rows = await ctx.db.query('clinicalReviewBatches')
        .withIndex('by_batch_id', (q) => q.eq('batchId', registration.manifest.batchId)).take(2);
      if (rows.some((row) => row.authority === 'release'
        && exactPersistedBatchRegistration(row, registration))) {
        governedDimensions.add(registration.dimension);
      }
    }
    if (governedDimensions.size > 0) {
      return {
        required: true,
        allowed: false,
        missing: [...governedDimensions].map((dimension) => `${dimension}:registered_revision_mismatch`),
        governedDimensions: [...governedDimensions],
      };
    }
  }
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
    if (batchRows.length !== 1 || !exactCompletedReleaseBatch(batchRows[0], registration)) {
      missing.push(`${registration.dimension}:persisted_batch`);
      continue;
    }
    if (!await exactClinicalReviewUpstreamChain(ctx, registration, batchRows[0])) {
      missing.push(`${registration.dimension}:upstream_chain`);
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
    if (!receipt || !await exactHandoffReceipt(ctx, receipt, registration)) {
      missing.push(`${registration.dimension}:batch_handoff`);
    } else if (batchRows[0].completedAt !== receipt.completedAt) {
      missing.push(`${registration.dimension}:batch_completion_timestamp`);
    }
  }

  return {
    required: governed,
    allowed: !governed || missing.length === 0,
    missing: [...new Set(missing)],
    governedDimensions: [...governedDimensions],
  };
}
