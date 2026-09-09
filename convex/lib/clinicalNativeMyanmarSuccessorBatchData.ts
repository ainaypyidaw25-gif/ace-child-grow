import exactPreimages from './clinicalNativeMyanmarSuccessorBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ID =
  'clinical-native-myanmar-successor-14-2026-08-31-v1' as const;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_FROZEN_AT =
  1788182591622 as const;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_EXPIRES_AT =
  1789392191622 as const;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_BATCH_ID =
  'clinical-child-development-refreeze-14-2026-08-31-v1' as const;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_FREEZE_DIGEST =
  'd5a41d6d49274003f13263fc57cd4728c692c66bacafe55fd43316b89d162e4a' as const;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST =
  '3d7457b5b5ce35e5bf644bd694382c06de17b31701ee1f8dc19f67e41a6d2204' as const;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_HASH =
  'd536c63aeb5a2f4e5a88f4e028fe73f61173011cc36ea03e1ef576e458fc068a' as const;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ROUTING_HASH =
  '7ec4ef8140869403a67e2a514131c6002ffd4d4f026fed3331553446e51389e7' as const;

export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_MANIFEST = {
  batchId: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ID,
  count: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS.length,
  reviewer: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_REVIEWER,
  items: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '911c07642242a898748396b725a9d1e3fb7ec37c'
  || exactPreimages.batchId !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development')) {
  throw new Error('Native-Myanmar successor batch constants are invalid');
}
