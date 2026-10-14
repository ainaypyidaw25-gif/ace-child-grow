import exactPreimages from './clinicalP1RemainingBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_P1_REMAINING_BATCH_ID =
  'clinical-p1-remaining-25-2026-10-14-v1' as const;
export const CLINICAL_P1_REMAINING_BATCH_FROZEN_AT = 1791923705878 as const;
export const CLINICAL_P1_REMAINING_BATCH_EXPIRES_AT = 1793133305878 as const;
export const CLINICAL_P1_REMAINING_PREVIOUS_BATCH_ID =
  'clinical-social-guide-gd-7-9m-2026-10-13-v1' as const;
export const CLINICAL_P1_REMAINING_PREVIOUS_FREEZE_DIGEST =
  '34f5597d338778bee0168c6924acf24032ecabffde3cd53bafa6646287fcbf9a' as const;
export const CLINICAL_P1_REMAINING_PREVIOUS_RECEIPT_ID =
  'qx7dt0494mf74rhchbpc1axd1d8g78we' as const;
export const CLINICAL_P1_REMAINING_PREVIOUS_DECISION_DIGEST =
  '279acbbfcf6e6bd9911c65d0eefaf6f42d542e22219a5ac66c5a0011dfa18da4' as const;
export const CLINICAL_P1_REMAINING_PREVIOUS_RECEIPT_DIGEST =
  'ff3f3f3efb7f1b4e20c8dd476344a65d73442e78fe3cb86e177a1e8e640cd548' as const;
export const CLINICAL_P1_REMAINING_BATCH_HASH =
  'd608b6f487b3edfe0b86f33a4155e321f3e5aa1442a663369916588bae5def9a' as const;
export const CLINICAL_P1_REMAINING_BATCH_ROUTING_HASH =
  '03aeface19452998c2b12aef7420ddecaa89447b571bfaad69c54228da458d0a' as const;

export const CLINICAL_P1_REMAINING_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_P1_REMAINING_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_P1_REMAINING_BATCH_MANIFEST = {
  batchId: CLINICAL_P1_REMAINING_BATCH_ID,
  count: CLINICAL_P1_REMAINING_BATCH_ITEMS.length,
  reviewer: CLINICAL_P1_REMAINING_BATCH_REVIEWER,
  items: CLINICAL_P1_REMAINING_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_P1_REMAINING_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '5cbcb8c5c30c426a8f2c02fd62468fcefd728922'
  || exactPreimages.batchId !== CLINICAL_P1_REMAINING_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_P1_REMAINING_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_P1_REMAINING_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_P1_REMAINING_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_P1_REMAINING_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptId
    !== CLINICAL_P1_REMAINING_PREVIOUS_RECEIPT_ID
  || exactPreimages.expectedPreviousDecisionDigest
    !== CLINICAL_P1_REMAINING_PREVIOUS_DECISION_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_P1_REMAINING_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_P1_REMAINING_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_P1_REMAINING_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 25
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items[0]?.slug !== 'gd_7_9m_communication'
  || exactPreimages.items[24]?.slug !== 'act_texture_touch') {
  throw new Error('Clinical P1 remaining batch constants are invalid');
}
