import exactPreimages from './clinicalSocialGuideBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_SOCIAL_GUIDE_BATCH_ID =
  'clinical-social-guide-gd-7-9m-2026-10-13-v1' as const;
export const CLINICAL_SOCIAL_GUIDE_BATCH_FROZEN_AT = 1791876734237 as const;
export const CLINICAL_SOCIAL_GUIDE_BATCH_EXPIRES_AT = 1793086334237 as const;
export const CLINICAL_SOCIAL_GUIDE_PREVIOUS_BATCH_ID =
  'clinical-review-successor-14-2026-09-01-v1' as const;
export const CLINICAL_SOCIAL_GUIDE_PREVIOUS_FREEZE_DIGEST =
  'eab7019857b1ea753e1f66fba8c237ab1a601867a8d5fbc080a3eac2c310f18d' as const;
export const CLINICAL_SOCIAL_GUIDE_PREVIOUS_RECEIPT_ID =
  'qx769ndz5kpfp1s0zaxbt5wx7h8dkjdc' as const;
export const CLINICAL_SOCIAL_GUIDE_PREVIOUS_DECISION_DIGEST =
  '069d4399e3f470c3653fc1fcb3ed4ffe18503c4aaeec020f037ab98edfdf2730' as const;
export const CLINICAL_SOCIAL_GUIDE_PREVIOUS_RECEIPT_DIGEST =
  'ccef5ccffba62137f697a2f80f22451b5ab761421bc85d5cb62ef02baa759178' as const;
export const CLINICAL_SOCIAL_GUIDE_BATCH_HASH =
  '34f5597d338778bee0168c6924acf24032ecabffde3cd53bafa6646287fcbf9a' as const;
export const CLINICAL_SOCIAL_GUIDE_BATCH_ROUTING_HASH =
  'd3c252dfd5d24cbda2991913761f6ae05a3071a6d5929c2927af8fb220179d26' as const;

export const CLINICAL_SOCIAL_GUIDE_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_SOCIAL_GUIDE_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_SOCIAL_GUIDE_BATCH_MANIFEST = {
  batchId: CLINICAL_SOCIAL_GUIDE_BATCH_ID,
  count: CLINICAL_SOCIAL_GUIDE_BATCH_ITEMS.length,
  reviewer: CLINICAL_SOCIAL_GUIDE_BATCH_REVIEWER,
  items: CLINICAL_SOCIAL_GUIDE_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_SOCIAL_GUIDE_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '187b06665e4894fda2f7008139be40216381da21'
  || exactPreimages.batchId !== CLINICAL_SOCIAL_GUIDE_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_SOCIAL_GUIDE_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_SOCIAL_GUIDE_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_SOCIAL_GUIDE_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_SOCIAL_GUIDE_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptId
    !== CLINICAL_SOCIAL_GUIDE_PREVIOUS_RECEIPT_ID
  || exactPreimages.expectedPreviousDecisionDigest
    !== CLINICAL_SOCIAL_GUIDE_PREVIOUS_DECISION_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_SOCIAL_GUIDE_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_SOCIAL_GUIDE_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_SOCIAL_GUIDE_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 1
  || exactPreimages.items[0]?.slug !== 'gd_7_9m_social'
  || exactPreimages.items[0]?.ordinal !== 1
  || exactPreimages.items[0]?.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
    !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development,evidence,safety') {
  throw new Error('Clinical social-guide batch constants are invalid');
}
