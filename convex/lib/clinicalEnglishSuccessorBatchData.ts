import exactPreimages from './clinicalEnglishSuccessorBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_ID =
  'clinical-english-successor-14-2026-08-31-v1' as const;
export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_FROZEN_AT =
  1788186672713 as const;
export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_EXPIRES_AT =
  1789396272713 as const;
export const CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_BATCH_ID =
  'clinical-native-myanmar-successor-14-2026-08-31-v1' as const;
export const CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_FREEZE_DIGEST =
  'd536c63aeb5a2f4e5a88f4e028fe73f61173011cc36ea03e1ef576e458fc068a' as const;
export const CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_ID =
  'qx74nqm0fp8ncre22q0r6ffdzn8dhs06' as const;
export const CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_DECISION_DIGEST =
  'bec8d61c4de024796d63a84c7287fb2d63d705be8c586f096264df90b7f0b5ec' as const;
export const CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST =
  '9e5ca9d4eac4fa7068b07d8a9eedd4edefa51c1db74e131c3b34370b7e8c48e4' as const;
export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_HASH =
  '116d691a56fec864c8fb1335dfc6e55bd9fef13178fefbf8f74e855ac5af6761' as const;
export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_ROUTING_HASH =
  'cdbf8d00712dc352a326d288f55b81ebcb8186b817453383b3bf59e34fe89fde' as const;

export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_MANIFEST = {
  batchId: CLINICAL_ENGLISH_SUCCESSOR_BATCH_ID,
  count: CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS.length,
  reviewer: CLINICAL_ENGLISH_SUCCESSOR_BATCH_REVIEWER,
  items: CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_ENGLISH_SUCCESSOR_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '8bb4752267bfa91c08dfd443b3470db59be8d2fa'
  || exactPreimages.batchId !== CLINICAL_ENGLISH_SUCCESSOR_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_ENGLISH_SUCCESSOR_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_ENGLISH_SUCCESSOR_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptId
    !== CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_ID
  || exactPreimages.expectedPreviousDecisionDigest
    !== CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_DECISION_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_ENGLISH_SUCCESSOR_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_ENGLISH_SUCCESSOR_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development')) {
  throw new Error('English successor batch constants are invalid');
}
