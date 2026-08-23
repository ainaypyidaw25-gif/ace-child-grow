/**
 * Immutable Production preimages for the first bounded clinical-review batch.
 *
 * Frozen read-only on 2026-08-23. This file authorizes no publication and no
 * bulk approval: it only defines the two exact revision-bound rows that the
 * assigned reviewer may decide one at a time.
 */
export const CLINICAL_REVIEW_BATCH_ID = 'clinical-first-p1-2026-08-23-v1' as const;
export const CLINICAL_REVIEW_BATCH_HASH = 'e2817684bfd83049aa495a652845a1ca4716b00889605485187808f62f1f3642' as const;

export const CLINICAL_REVIEW_BATCH_REVIEWER = {
  profileId: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  displayName: 'Phyo Ko Ko',
  qualification: 'MBBS',
  role: 'clinical_reviewer',
  profileCanonicalSha256: 'd171a5985467ee4d0507c8226f5b43d74c7a47b56d701f460465e91ea72e8818',
} as const;

export const CLINICAL_REVIEW_BATCH_ITEMS = [
  {
    ordinal: 1,
    kind: 'milestone',
    slug: 'ms_birth_2m_communication_1',
    reviewRevision: 1,
    contentId: 'kx7cvr9gnpt5ty0r8ppxdjenzd8b8zh8',
    contentCreationTime: 1785024282947.1724,
    contentUpdatedAt: 1786433535701,
    contentCanonicalSha256: 'c9fb30377a111c030db6ee8ddc3b78728504c3b1cf56a75ea51150d122e5d46c',
    linkId: 'k97bf1f6f7vs02daavp2fa2mq18b9qhg',
    linkCreationTime: 1785024331625.8022,
    linkUpdatedAt: 1785024331625,
    linkCanonicalSha256: '8ef5635f1e64619ac5845b0c7c8b7aebf782e68d39aa408925bcce219828757f',
    sourceIds: [
      'aap-milestones-2022',
      'cdc-milestones-2026',
      'aap-surveillance-2020',
      'who-care-for-child-development-2012',
      'nhs-learn-to-talk-2023',
    ],
    sourceCount: 5,
    sourcesCanonicalSha256: '0c6af19fd085216df72cf1474b5f78149225b0d79703009bed88c5ba299552c4',
    mediaCount: 1,
    mediaCanonicalSha256: '1dbee1edbd8c47103d4db42aa8245098bcbbdb2a0ab31ae66426e266bf66a9a1',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
  {
    ordinal: 2,
    kind: 'activity',
    slug: 'act_peek_a_boo_cloth',
    reviewRevision: 1,
    contentId: 'kx7fxxbphzkx6q8wesmned64vd8b89b3',
    contentCreationTime: 1785024282947.2432,
    contentUpdatedAt: 1786433535701,
    contentCanonicalSha256: 'e274382e1c3186b3c3ca781c1635a889855f35655267aa6ec360af8e9510b7f3',
    linkId: 'k97435q5knq15rbjebydgb3fwd8b9q1e',
    linkCreationTime: 1785024331625.8457,
    linkUpdatedAt: 1785024331625,
    linkCanonicalSha256: '2460e4cba17149c24e6d28a659f64e1180e9ee5e45444c59c20b0b7070f4dba5',
    sourceIds: [
      'aap-power-of-play-2018',
      'who-nurturing-care-2018',
      'cdc-milestones-2026',
      'aap-safe-sleep-2022',
    ],
    sourceCount: 4,
    sourcesCanonicalSha256: 'b042e839cdb6d5f8f0a9fbe20e8ce7a0974052bd42224677955c027dafc56ebd',
    mediaCount: 2,
    mediaCanonicalSha256: '9eaf505edb4abf8d16aaec8d36f24353b743fa36a24d3ba8b65b1f218bdd7d9c',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
] as const;

export const CLINICAL_REVIEW_BATCH_COUNT = CLINICAL_REVIEW_BATCH_ITEMS.length;

export const CLINICAL_REVIEW_BATCH_MANIFEST = {
  batchId: CLINICAL_REVIEW_BATCH_ID,
  count: CLINICAL_REVIEW_BATCH_COUNT,
  reviewer: CLINICAL_REVIEW_BATCH_REVIEWER,
  items: CLINICAL_REVIEW_BATCH_ITEMS,
} as const;

export type ClinicalReviewBatchItem = (typeof CLINICAL_REVIEW_BATCH_ITEMS)[number];
