import exactPreimages from './clinicalEnglishRefreezeBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_ENGLISH_REFREEZE_BATCH_ID =
  'clinical-english-refreeze-14-2026-08-28-v1' as const;
export const CLINICAL_ENGLISH_REFREEZE_BATCH_FROZEN_AT = 1787906213836 as const;
export const CLINICAL_ENGLISH_REFREEZE_BATCH_EXPIRES_AT = 1789115813836 as const;
export const CLINICAL_ENGLISH_REFREEZE_PREVIOUS_BATCH_ID =
  'clinical-english-governed-14-2026-08-27-v1' as const;
export const CLINICAL_ENGLISH_REFREEZE_DECISION_SET_DIGEST =
  'e53afb11c4b507c9d621ab75905daec7825685a49d59ce763ef417c116275e0d' as const;
export const CLINICAL_ENGLISH_REFREEZE_BATCH_HASH =
  '1bd42abd7a9c9ddab855bb7b1aed215b8f80a130133845d05be126d551ff28f2' as const;
export const CLINICAL_ENGLISH_REFREEZE_BATCH_ROUTING_HASH =
  'a4038cd29a5535d65e105f97b24793e0a6049f6cfb4fde278dc8bab9026ee456' as const;

export const CLINICAL_ENGLISH_REFREEZE_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_ENGLISH_REFREEZE_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_ENGLISH_REFREEZE_BATCH_MANIFEST = {
  batchId: CLINICAL_ENGLISH_REFREEZE_BATCH_ID,
  count: CLINICAL_ENGLISH_REFREEZE_BATCH_ITEMS.length,
  reviewer: CLINICAL_ENGLISH_REFREEZE_BATCH_REVIEWER,
  items: CLINICAL_ENGLISH_REFREEZE_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_ENGLISH_REFREEZE_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '8dd38dfc5c7c1c9e3f6b96456e35eb1e72915ee6'
  || exactPreimages.batchId !== CLINICAL_ENGLISH_REFREEZE_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_ENGLISH_REFREEZE_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_ENGLISH_REFREEZE_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_ENGLISH_REFREEZE_PREVIOUS_BATCH_ID
  || exactPreimages.expectedDecisionSetDigest
    !== CLINICAL_ENGLISH_REFREEZE_DECISION_SET_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_ENGLISH_REFREEZE_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_ENGLISH_REFREEZE_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english')) {
  throw new Error('English refreeze batch constants are invalid');
}
