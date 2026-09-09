import exactPreimages from './clinicalChildDevelopmentRefreezeBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ID =
  'clinical-child-development-refreeze-14-2026-08-31-v1' as const;
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT =
  1788163723460 as const;
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_EXPIRES_AT =
  1789373323460 as const;
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID =
  'clinical-child-development-governed-14-2026-08-29-v1' as const;
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST =
  '2da5ddfecc5e2815c132f5520cf27df27ea76bfdc151e64c6f489c9e384f803f' as const;
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH =
  'd5a41d6d49274003f13263fc57cd4728c692c66bacafe55fd43316b89d162e4a' as const;
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ROUTING_HASH =
  '3e81892d99cf35eb94cf348d9617ff5839bb5fb5bdb0a464d814dbb139351ae1' as const;

export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST = {
  batchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ID,
  count: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS.length,
  reviewer: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_REVIEWER,
  items: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_PREIMAGES = exactPreimages;

const transitionedSourceRows = exactPreimages.items.filter((item) =>
  item.slug === 'gd_2y_safety' || item.slug === 'gd_2_5y_safety');

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== 'e0d22f6877eb6b3cb3f3a420639d3b414e108169'
  || exactPreimages.batchId !== CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId
    !== CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID
  || exactPreimages.expectedDecisionSetDigest
    !== CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH
  || exactPreimages.routingDigest
    !== CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development')
  || transitionedSourceRows.length !== 2
  || transitionedSourceRows.some((item) =>
    !item.sourceIds.includes('cdc-positive-parenting-toddlers-2-3-2026')
    || item.sourceIds.includes('cdc-positive-parenting-toddlers-2026'))) {
  throw new Error('Child-development refreeze batch constants are invalid');
}
