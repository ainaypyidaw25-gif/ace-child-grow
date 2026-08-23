import { v, type Infer } from 'convex/values';

export const CLINICAL_REVIEW_BATCH_CONTRACT = 'ace.clinical-frozen-batch' as const;
export const CLINICAL_REVIEW_BATCH_CONTRACT_VERSION = 1 as const;
// Backward-compatible pilot default. Every registry entry now declares its
// dimension explicitly and the server returns that registered value.
export const CLINICAL_REVIEW_BATCH_DIMENSION = 'clinical' as const;
export const clinicalReviewBatchDimensionValidator = v.union(
  v.literal('clinical'),
  v.literal('child_development'),
  v.literal('evidence'),
  v.literal('safety'),
);

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
const snapshotAdvisoryValidator = v.object({ mm: v.string(), en: v.string() });
const snapshotValidator = v.object({
  digest: v.string(), titleMm: v.string(), titleEn: v.string(),
  summaryMm: nullableStringValidator, summaryEn: nullableStringValidator,
  reviewerAdvisory: v.union(snapshotAdvisoryValidator, v.null()),
  sources: v.array(snapshotSourceValidator), fields: v.array(snapshotFieldValidator),
});
export const clinicalReviewHandoffValidator = v.object({
  batchId: v.string(), decisionCount: v.number(), completedAt: v.number(),
  digest: v.string(), receiptDigest: v.string(),
});
const itemValidator = v.object({
  assignmentId: v.string(), slug: v.string(), type: v.string(),
  dimension: clinicalReviewBatchDimensionValidator,
  reviewRevision: v.number(), liveReviewRevision: v.number(), snapshot: snapshotValidator,
  decision: v.union(clinicalReviewReceiptValidator, v.null()),
});
const reviewerValidator = v.object({
  profileId: v.string(), userId: v.string(), displayName: v.string(), qualification: v.string(),
  role: v.union(v.literal('clinical_reviewer'), v.literal('evidence_reviewer')),
});

export const clinicalReviewBatchResultValidator = v.object({
  contract: v.literal(CLINICAL_REVIEW_BATCH_CONTRACT),
  contractVersion: v.literal(CLINICAL_REVIEW_BATCH_CONTRACT_VERSION),
  scope: v.literal('authenticated_assignee'),
  batchId: v.string(),
  lane: clinicalReviewBatchDimensionValidator,
  assignedRole: v.union(v.literal('clinical_reviewer'), v.literal('evidence_reviewer')),
  frozenAt: v.number(),
  freezeDigest: v.string(),
  freezeReceiptDigest: v.string(),
  reviewer: reviewerValidator,
  items: v.array(itemValidator),
  handoff: v.union(clinicalReviewHandoffValidator, v.null()),
});

export const clinicalReviewBatchLoadRefusalValidator = v.object({
  status: v.literal('refused'),
  code: v.union(
    v.literal('not_authenticated'),
    v.literal('not_assigned_reviewer'),
    v.literal('assignment_expired'),
    v.literal('batch_preflight_failed'),
  ),
  message: v.string(),
});

export const clinicalReviewBatchLoadResultValidator = v.union(
  clinicalReviewBatchResultValidator,
  clinicalReviewBatchLoadRefusalValidator,
);

export type ClinicalReviewBatchResult = Infer<typeof clinicalReviewBatchResultValidator>;
export type ClinicalReviewBatchLoadResult = Infer<typeof clinicalReviewBatchLoadResultValidator>;
export type ClinicalReviewDecision = Infer<typeof clinicalReviewDecisionValidator>;
