import exactPreimages from './clinicalEnglishBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_ENGLISH_RELEASE_BATCH_ID =
  'clinical-english-governed-14-2026-08-27-v1' as const;
export const CLINICAL_ENGLISH_RELEASE_BATCH_FROZEN_AT = 1787808825094 as const;
export const CLINICAL_ENGLISH_RELEASE_BATCH_EXPIRES_AT = 1789018425094 as const;
export const CLINICAL_ENGLISH_RELEASE_PREVIOUS_BATCH_ID =
  'clinical-native-myanmar-refreeze-14-2026-08-26-v1' as const;
export const CLINICAL_ENGLISH_RELEASE_PREVIOUS_FREEZE_DIGEST =
  'eed6398428a631f0e83c80d871bca9eb832a6ce5e787c9decbab5736bf8676f6' as const;
export const CLINICAL_ENGLISH_RELEASE_PREVIOUS_RECEIPT_DIGEST =
  '64f364d48ebe2c2ef6c4c2d262bac09a2013636e529920e308a0c6d48e68af36' as const;
export const CLINICAL_ENGLISH_RELEASE_BATCH_HASH =
  'f1e315759e81552b86fd04f4582594ee74f078ca209265549413e4d050f8e325' as const;
export const CLINICAL_ENGLISH_RELEASE_BATCH_ROUTING_HASH =
  'a4ac7244c0c4532943a35097ed651aa7144eb3678960b14dcb7e4459377dc195' as const;

export const CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_ENGLISH_RELEASE_BATCH_MANIFEST = {
  batchId: CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  count: CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS.length,
  reviewer: CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER,
  items: CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_ENGLISH_RELEASE_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '96a69a710fd1410338fdfa53529e7c445967cb11'
  || exactPreimages.batchId !== CLINICAL_ENGLISH_RELEASE_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_ENGLISH_RELEASE_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_ENGLISH_RELEASE_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_ENGLISH_RELEASE_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_ENGLISH_RELEASE_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_ENGLISH_RELEASE_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_ENGLISH_RELEASE_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_ENGLISH_RELEASE_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english')) {
  throw new Error('English release batch constants are invalid');
}
