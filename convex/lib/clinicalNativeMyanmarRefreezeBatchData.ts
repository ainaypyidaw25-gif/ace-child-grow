import exactPreimages from './clinicalNativeMyanmarRefreezeBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ID =
  'clinical-native-myanmar-refreeze-14-2026-08-26-v1' as const;
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_FROZEN_AT = 1787746750496 as const;
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_EXPIRES_AT = 1788956350496 as const;
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_PREVIOUS_BATCH_ID =
  'clinical-native-myanmar-governed-14-2026-08-26-v1' as const;
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST =
  '1ba0b69abc01cc63fa47cff67f2e6495a606531bef98d3d6073bdeb9e65af08e' as const;
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_HASH =
  'eed6398428a631f0e83c80d871bca9eb832a6ce5e787c9decbab5736bf8676f6' as const;
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ROUTING_HASH =
  '845622f6451df565a79349f0432b5847abe2316b854953afb026b88178088490' as const;

export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_MANIFEST = {
  batchId: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ID,
  count: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS.length,
  reviewer: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_REVIEWER,
  items: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '06c6bab7ac6729db17b573c49361a59f7b4ecb21'
  || exactPreimages.batchId !== CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_NATIVE_MYANMAR_REFREEZE_PREVIOUS_BATCH_ID
  || exactPreimages.expectedDecisionSetDigest
    !== CLINICAL_NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)) {
  throw new Error('Native-Myanmar refreeze batch constants are invalid');
}
