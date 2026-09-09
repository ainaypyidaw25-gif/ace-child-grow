import exactPreimages from './clinicalEvidenceSuccessorBatchPreimages.json';
import type {
  ClinicalReviewBatchFreezeManifest,
  ClinicalReviewBatchItem,
  ClinicalReviewBatchReviewer,
} from './clinicalReviewBatchData';

export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ID =
  'clinical-evidence-successor-14-2026-09-01-v1' as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_FROZEN_AT =
  1788213857660 as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_EXPIRES_AT =
  1789423457660 as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_BATCH_ID =
  'clinical-english-successor-14-2026-08-31-v1' as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_FREEZE_DIGEST =
  '116d691a56fec864c8fb1335dfc6e55bd9fef13178fefbf8f74e855ac5af6761' as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_ID =
  'qx74kcvag57vxcd877sqsc6bxh8dh4ez' as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_DECISION_DIGEST =
  'dd59c4e1e8bab414372a016735d2070f5addc7243054c889f8d7e6ed30fbc70a' as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST =
  '85c943dfc463c9a6c6b22e60c4de4da3c4404934df124fde78a47ee9ab682040' as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_HASH =
  'f847abc3de1b0c88f42b4713efe718c7f487516040ecc92948e855fea048467f' as const;
export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ROUTING_HASH =
  '46344beb5166d1424a29cff83a627612a6182a2e326bd03e251c0d51ff7e90b6' as const;

export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_REVIEWER =
  exactPreimages.reviewer as ClinicalReviewBatchReviewer;
export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS =
  exactPreimages.items as readonly ClinicalReviewBatchItem[];
export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_MANIFEST = {
  batchId: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ID,
  count: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS.length,
  reviewer: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_REVIEWER,
  items: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS,
} as const satisfies ClinicalReviewBatchFreezeManifest;

export const CLINICAL_EVIDENCE_SUCCESSOR_BATCH_PREIMAGES = exactPreimages;

if (exactPreimages.frozenFrom.deployment !== 'graceful-possum-566'
  || exactPreimages.frozenFrom.gitBase !== '28921b11938a6e718168bc35d49f8726bf8cb7d8'
  || exactPreimages.batchId !== CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ID
  || exactPreimages.frozenAt !== CLINICAL_EVIDENCE_SUCCESSOR_BATCH_FROZEN_AT
  || exactPreimages.expiresAt !== CLINICAL_EVIDENCE_SUCCESSOR_BATCH_EXPIRES_AT
  || exactPreimages.previousBatchId !== CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_BATCH_ID
  || exactPreimages.expectedPreviousFreezeDigest
    !== CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_FREEZE_DIGEST
  || exactPreimages.expectedPreviousReceiptId
    !== CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_ID
  || exactPreimages.expectedPreviousDecisionDigest
    !== CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_DECISION_DIGEST
  || exactPreimages.expectedPreviousReceiptDigest
    !== CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST
  || exactPreimages.freezeDigest !== CLINICAL_EVIDENCE_SUCCESSOR_BATCH_HASH
  || exactPreimages.routingDigest !== CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ROUTING_HASH
  || exactPreimages.items.length !== 14
  || new Set(exactPreimages.items.map((item) => item.slug)).size !== 14
  || exactPreimages.items.some((item, index) => item.ordinal !== index + 1)
  || exactPreimages.items.some((item) =>
    item.upstreamReviewDigests.map((entry) => entry.dimension).join(',')
      !== 'all_review_history,all_nonclinical_history,native_myanmar,english,child_development')) {
  throw new Error('Evidence successor batch constants are invalid');
}
