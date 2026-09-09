import exactPreimages from './clinicalSafetySuccessorBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_SAFETY_SUCCESSOR_BATCH_ID =
  'clinical-safety-successor-14-2026-09-01-v1' as const;
export const CLINICAL_SAFETY_SUCCESSOR_BATCH_FROZEN_AT =
  1788232803918 as const;
export const CLINICAL_SAFETY_SUCCESSOR_BATCH_EXPIRES_AT =
  1789442403918 as const;
export const CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_BATCH_ID =
  'clinical-evidence-successor-14-2026-09-01-v1' as const;
export const CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_FREEZE_DIGEST =
  'f847abc3de1b0c88f42b4713efe718c7f487516040ecc92948e855fea048467f' as const;
export const CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_ID =
  'qx76j01zmcm92gg7ndpjm26g6h8dkmcz' as const;
export const CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_DECISION_DIGEST =
  '28917526d547b99fe71deeb098b3c492986cf4f95c32e8b400c7a3b32a91a5cf' as const;
export const CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST =
  'cd98c905a18850b4c9fafb318e37781006e21dfbd51870d8d555f5671f2344a5' as const;
export const CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH =
  '670bf7992e5e5e840709d7adf9c5754659983c051abd2f35ccc48cd4e32a1ec0' as const;
export const CLINICAL_SAFETY_SUCCESSOR_BATCH_ROUTING_HASH =
  '4caf6f8f03a988d0df6a28818f9596412acca9a637776ad539d7d95bd3c62c10' as const;

export const CLINICAL_SAFETY_SUCCESSOR_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST = {
  batchId: CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
  count: CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS.length,
  reviewer: CLINICAL_SAFETY_SUCCESSOR_BATCH_REVIEWER,
  items: CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_SAFETY_SUCCESSOR_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== 'bd63e2b026142ec8374255feb52eda771bf72f80'
  || exactPreimages.batchId !== CLINICAL_SAFETY_SUCCESSOR_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_SAFETY_SUCCESSOR_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_SAFETY_SUCCESSOR_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptId
    !== CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_ID
  || exactPreimages.expectedPreviousDecisionDigest
    !== CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_DECISION_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_SAFETY_SUCCESSOR_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development,evidence')) {
  throw new Error('Safety successor batch constants are invalid');
}
