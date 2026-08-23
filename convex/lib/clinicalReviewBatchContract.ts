import { v, type Infer } from 'convex/values';
import { CLINICAL_REVIEW_BATCH_ID } from './clinicalReviewBatchData';

export const CLINICAL_REVIEW_BATCH_CONTRACT = 'ace.clinical-frozen-batch' as const;
export const CLINICAL_REVIEW_BATCH_CONTRACT_VERSION = 1 as const;
export const CLINICAL_REVIEW_BATCH_DIMENSION = 'clinical' as const;

const nullableStringValidator = v.union(v.string(), v.null());
export const clinicalReviewDecisionValidator = v.union(
  v.literal('approved'),
  v.literal('changes_requested'),
  v.literal('not_applicable'),
);
export const clinicalReviewReceiptValidator = v.object({
  decision: clinicalReviewDecisionValidator,
  note: nullableStringValidator,
  reviewedAt: v.number(),
  receiptId: v.string(),
});
const snapshotFieldValidator = v.object({
  path: v.string(), labelMm: v.string(), labelEn: v.string(),
  valueMm: nullableStringValidator, valueEn: nullableStringValidator,
});
const snapshotSourceValidator = v.object({
  sourceId: v.string(), org: v.string(), title: v.string(),
  year: v.union(v.number(), v.null()), url: v.string(),
});
const snapshotValidator = v.object({
  digest: v.string(), titleMm: v.string(), titleEn: v.string(),
  summaryMm: nullableStringValidator, summaryEn: nullableStringValidator,
  sources: v.array(snapshotSourceValidator), fields: v.array(snapshotFieldValidator),
});
export const clinicalReviewHandoffValidator = v.object({
  batchId: v.string(), decisionCount: v.number(), completedAt: v.number(),
  digest: v.string(), receiptDigest: v.string(),
});
const itemValidator = v.object({
  assignmentId: v.string(), slug: v.string(), type: v.string(),
  dimension: v.literal(CLINICAL_REVIEW_BATCH_DIMENSION),
  reviewRevision: v.number(), liveReviewRevision: v.number(), snapshot: snapshotValidator,
  decision: v.union(clinicalReviewReceiptValidator, v.null()),
});
const reviewerValidator = v.object({
  profileId: v.string(), userId: v.string(), displayName: v.string(), qualification: v.string(),
  role: v.literal('clinical_reviewer'),
});

export const clinicalReviewBatchResultValidator = v.object({
  contract: v.literal(CLINICAL_REVIEW_BATCH_CONTRACT),
  contractVersion: v.literal(CLINICAL_REVIEW_BATCH_CONTRACT_VERSION),
  scope: v.literal('authenticated_assignee'),
  batchId: v.literal(CLINICAL_REVIEW_BATCH_ID),
  lane: v.literal('clinical'),
  assignedRole: v.literal('clinical_reviewer'),
  frozenAt: v.number(),
  freezeDigest: v.string(),
  freezeReceiptDigest: v.string(),
  reviewer: reviewerValidator,
  items: v.array(itemValidator),
  handoff: v.union(clinicalReviewHandoffValidator, v.null()),
});

export type ClinicalReviewBatchResult = Infer<typeof clinicalReviewBatchResultValidator>;
export type ClinicalReviewDecision = Infer<typeof clinicalReviewDecisionValidator>;
