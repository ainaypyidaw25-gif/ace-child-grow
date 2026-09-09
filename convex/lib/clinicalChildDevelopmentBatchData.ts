import exactPreimages from './clinicalChildDevelopmentBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID =
  'clinical-child-development-governed-14-2026-08-29-v1' as const;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_FROZEN_AT = 1787971971657 as const;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_EXPIRES_AT = 1789181571657 as const;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_BATCH_ID =
  'clinical-english-refreeze-14-2026-08-28-v1' as const;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_FREEZE_DIGEST =
  '1bd42abd7a9c9ddab855bb7b1aed215b8f80a130133845d05be126d551ff28f2' as const;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_RECEIPT_DIGEST =
  '4d1e52a80bf690ac7ddff576e6fa952c1dbe77318c44929fe71d3e5a18f2674b' as const;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_HASH =
  '74cf7ebe6b55a3b1c3bc7e26a3fbd88cf5aee50d5d635a4233e5b267c3d8ec6b' as const;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ROUTING_HASH =
  'dc8eb48e97c28ad670e629544bd1580fd88d24d6fdff77750fbe7516e386f436' as const;

export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_MANIFEST = {
  batchId: CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID,
  count: CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS.length,
  reviewer: CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_REVIEWER,
  items: CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== 'b3cf5c8f89f7ffc3804da829bfad387e2bd63d21'
  || exactPreimages.batchId !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development')) {
  throw new Error('Child-development release batch constants are invalid');
}
