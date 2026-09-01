import exactPreimages from './clinicalReviewSuccessorBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_REVIEW_SUCCESSOR_BATCH_ID =
  'clinical-review-successor-14-2026-09-01-v1' as const;
export const CLINICAL_REVIEW_SUCCESSOR_BATCH_FROZEN_AT =
  1788244511515 as const;
export const CLINICAL_REVIEW_SUCCESSOR_BATCH_EXPIRES_AT =
  1789454111515 as const;
export const CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_BATCH_ID =
  'clinical-safety-successor-14-2026-09-01-v1' as const;
export const CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_FREEZE_DIGEST =
  '670bf7992e5e5e840709d7adf9c5754659983c051abd2f35ccc48cd4e32a1ec0' as const;
export const CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_ID =
  'qx7dcjwg84x11xfxh5s3w2n46s8dk094' as const;
export const CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_DECISION_DIGEST =
  'f660247521c1205ede5bc7293b014579035f0dc7c4a4c57d320027eca418d8f0' as const;
export const CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST =
  '00f1e8eb917b2e0849e4c0e6bafd4ca7efa4d953ae423d8390138e64a028b422' as const;
export const CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH =
  'eab7019857b1ea753e1f66fba8c237ab1a601867a8d5fbc080a3eac2c310f18d' as const;
export const CLINICAL_REVIEW_SUCCESSOR_BATCH_ROUTING_HASH =
  '40b96de087b33c0cc62c69a626efd81b31401d5d4337f0ea9b8775bfb92cfbad' as const;

export const CLINICAL_REVIEW_SUCCESSOR_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_REVIEW_SUCCESSOR_BATCH_MANIFEST = {
  batchId: CLINICAL_REVIEW_SUCCESSOR_BATCH_ID,
  count: CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS.length,
  reviewer: CLINICAL_REVIEW_SUCCESSOR_BATCH_REVIEWER,
  items: CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_REVIEW_SUCCESSOR_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== 'fa4e3382cb829a0fc4352da70bbd1f939c554dfc'
  || exactPreimages.batchId !== CLINICAL_REVIEW_SUCCESSOR_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_REVIEW_SUCCESSOR_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_REVIEW_SUCCESSOR_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptId
    !== CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_ID
  || exactPreimages.expectedPreviousDecisionDigest
    !== CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_DECISION_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_REVIEW_SUCCESSOR_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development,evidence,safety')) {
  throw new Error('Clinical-review successor batch constants are invalid');
}
