/**
 * Immutable Production preimages for the first bounded clinical-review batch.
 *
 * Frozen read-only on 2026-08-23. This file authorizes no publication and no
 * bulk approval: it only defines the two exact revision-bound rows that the
 * assigned reviewer may decide one at a time.
 */
export const CLINICAL_REVIEW_BATCH_ID = 'clinical-first-p1-2026-08-23-v1' as const;
export const CLINICAL_REVIEW_BATCH_HASH = '3419907959d16a30c031df3c3bff8f1708304807cad2f0c8813644ae98f3f6b2' as const;
export const CLINICAL_REVIEW_BATCH_FROZEN_AT = 1787443200000 as const;
export const CLINICAL_REVIEW_BATCH_EXPIRES_AT = 1816560000000 as const;

export const CLINICAL_REVIEW_BATCH_REVIEWER = {
  profileId: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  displayName: 'Phyo Ko Ko',
  qualification: 'MBBS',
  role: 'clinical_reviewer',
  identityCanonicalSha256: 'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
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

/**
 * Exact read-only candidate exported by the 2026-08-23 Production inventory.
 * Registration is inert: it creates no database row and grants no assignment
 * until the owner separately materializes and activates it with the exact
 * registry and predecessor-receipt CAS values.
 */
export const CLINICAL_SAFETY_BATCH_ID = 'clinical-safety-13m-4_5y-2026-08-23-v1' as const;
export const CLINICAL_SAFETY_BATCH_FROZEN_AT = 1787491407528 as const;
export const CLINICAL_SAFETY_BATCH_EXPIRES_AT = 1819027407528 as const;
export const CLINICAL_SAFETY_BATCH_ITEMS = [
  {
    ordinal: 1, kind: 'guide', slug: 'gd_13_18m_safety', reviewRevision: 6,
    contentId: 'kx70pz9t2x95n0727d38qvwdkd8bdzb8', contentCreationTime: 1785237828583.466,
    contentUpdatedAt: 1786432330925,
    contentCanonicalSha256: '26e6ec762116eb294f9279943728ece0bde75ca49e9de6bec471dcc8d3e0c8fb',
    linkId: 'k978ctxpz373p0qagwvv64t34n8bcvpd', linkCreationTime: 1785241493911.8396,
    linkUpdatedAt: 1785241493911,
    linkCanonicalSha256: 'aafc546a65225cc27e0f801e42cbfc4b32359b9e0a6f0c462556668400053b1b',
    sourceIds: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
    sourceCount: 3,
    sourcesCanonicalSha256: '46b42c9380efe066fca2fb582b1e0e15dce1206bff76bb716d421b80488cd561',
    mediaCount: 0, mediaCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
  {
    ordinal: 2, kind: 'guide', slug: 'gd_2y_safety', reviewRevision: 6,
    contentId: 'kx73pwvtvvamn3dfx14jrg40nn8bc7kj', contentCreationTime: 1785237828583.4753,
    contentUpdatedAt: 1786432330925,
    contentCanonicalSha256: '153da4bfad4b7f83cfe8fe5106add4f8e8abc9d04af394b9ebe4faafefbe854f',
    linkId: 'k973vc85xh8yav2fg8j4kmnabn8bd1g6', linkCreationTime: 1785241493911.8455,
    linkUpdatedAt: 1785241493911,
    linkCanonicalSha256: 'a160bee9f2097b7e89e20db03961bbcd04718de2e96931063edd2a8a07655108',
    sourceIds: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
    sourceCount: 3,
    sourcesCanonicalSha256: '46b42c9380efe066fca2fb582b1e0e15dce1206bff76bb716d421b80488cd561',
    mediaCount: 0, mediaCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
  {
    ordinal: 3, kind: 'guide', slug: 'gd_2_5y_safety', reviewRevision: 6,
    contentId: 'kx71xfbs9qjg1bz2hfvmgfc1rd8bcnfq', contentCreationTime: 1785237828583.4802,
    contentUpdatedAt: 1786432330925,
    contentCanonicalSha256: '74c6085a0be81451d2c83a3cd9e0fdef3aa838a88e7a7de1fee436fabe974b16',
    linkId: 'k972t78ctsbmrp4gh7dhrfp0q58bdq47', linkCreationTime: 1785241497141.093,
    linkUpdatedAt: 1785241497141,
    linkCanonicalSha256: '2e67b6bb3c1fb194e191a462164cc0eaef6636ecbf1ad492c85d1643fa7419c7',
    sourceIds: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
    sourceCount: 3,
    sourcesCanonicalSha256: '46b42c9380efe066fca2fb582b1e0e15dce1206bff76bb716d421b80488cd561',
    mediaCount: 0, mediaCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
  {
    ordinal: 4, kind: 'guide', slug: 'gd_3y_safety', reviewRevision: 5,
    contentId: 'kx75jb917chhxe4spsmp49bw918bdmcd', contentCreationTime: 1785237828583.485,
    contentUpdatedAt: 1786432330925,
    contentCanonicalSha256: '5eb9a62b6bf776f3a49a64434a9237dcdda77d58662ebf6875c1ed49936eeb37',
    linkId: 'k970wxb0d4xnxnbcr2z8yp2kbn8bca9v', linkCreationTime: 1785241497141.0962,
    linkUpdatedAt: 1785241497141,
    linkCanonicalSha256: '10ebd75beb32265bcd6c3c70667dd408b1b108b2dde58c48718fd6bf60659a01',
    sourceIds: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
    sourceCount: 3,
    sourcesCanonicalSha256: '46b42c9380efe066fca2fb582b1e0e15dce1206bff76bb716d421b80488cd561',
    mediaCount: 0, mediaCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
  {
    ordinal: 5, kind: 'guide', slug: 'gd_3_5y_safety', reviewRevision: 5,
    contentId: 'kx72jqztx8ysd8w20sqwxw8gfd8bc5gj', contentCreationTime: 1785237828583.49,
    contentUpdatedAt: 1786432330925,
    contentCanonicalSha256: 'c1bd6d864bff70f498f746f6b3c5d932bd25eadf160f7ae7a1ae7afbc30b8ede',
    linkId: 'k97emfw1fzzdkrmbcy8emnad3s8bdz7q', linkCreationTime: 1785241497141.0994,
    linkUpdatedAt: 1785241497141,
    linkCanonicalSha256: '2dd703359ebfee68a13ce6e30bcf3413e5ec1d15c59552f33e92a5fb665b1f62',
    sourceIds: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
    sourceCount: 3,
    sourcesCanonicalSha256: '46b42c9380efe066fca2fb582b1e0e15dce1206bff76bb716d421b80488cd561',
    mediaCount: 0, mediaCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
  {
    ordinal: 6, kind: 'guide', slug: 'gd_4y_safety', reviewRevision: 5,
    contentId: 'kx735zjgmccz25yaacwc5fhymn8bdvsb', contentCreationTime: 1785237828583.4949,
    contentUpdatedAt: 1786432330925,
    contentCanonicalSha256: 'b2bdd45fe92497272663b6320ba461b5df30eca6454188e39578b99766ccbbf9',
    linkId: 'k970ex6j7yzngvenvwqbrv0ayn8bc1w3', linkCreationTime: 1785241497141.1025,
    linkUpdatedAt: 1785241497141,
    linkCanonicalSha256: '1b112cdcdf9001bb5919260804bbdf04c5ceb1cc4c9b63e1c8ea84af27a642ee',
    sourceIds: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
    sourceCount: 3,
    sourcesCanonicalSha256: '46b42c9380efe066fca2fb582b1e0e15dce1206bff76bb716d421b80488cd561',
    mediaCount: 0, mediaCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
  {
    ordinal: 7, kind: 'guide', slug: 'gd_4_5y_safety', reviewRevision: 5,
    contentId: 'kx7c0k0hq7agzphv03j863cacd8bc8wh', contentCreationTime: 1785237828583.4998,
    contentUpdatedAt: 1786432330925,
    contentCanonicalSha256: 'c85cec2e4c09cf05373fbd48bff96647193945507a474c00127393deb580b873',
    linkId: 'k978mvw7fmmggm4m1e11x04wb98bc8b4', linkCreationTime: 1785241497141.1057,
    linkUpdatedAt: 1785241497141,
    linkCanonicalSha256: '9782052802dacc0520f106c345bd14c836f8f54df6c452336f5af59d37a2318c',
    sourceIds: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
    sourceCount: 3,
    sourcesCanonicalSha256: '46b42c9380efe066fca2fb582b1e0e15dce1206bff76bb716d421b80488cd561',
    mediaCount: 0, mediaCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    aiCanonicalSha256: 'e0c04573de4314ddde597477c374bafd25b400663d593e0a0244afe3f73c1d0d',
  },
] as const;

export const CLINICAL_SAFETY_BATCH_MANIFEST = {
  batchId: CLINICAL_SAFETY_BATCH_ID,
  count: CLINICAL_SAFETY_BATCH_ITEMS.length,
  reviewer: CLINICAL_REVIEW_BATCH_REVIEWER,
  items: CLINICAL_SAFETY_BATCH_ITEMS,
} as const;

export type ClinicalReviewBatchReviewer = {
  readonly profileId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly qualification: string;
  readonly role: 'clinical_reviewer';
  readonly identityCanonicalSha256: string;
};

export type ClinicalReviewBatchItem = {
  readonly ordinal: number;
  readonly kind: string;
  readonly slug: string;
  readonly reviewRevision: number;
  readonly contentId: string;
  readonly contentCreationTime: number;
  readonly contentUpdatedAt: number;
  readonly contentCanonicalSha256: string;
  readonly linkId: string;
  readonly linkCreationTime: number;
  readonly linkUpdatedAt: number;
  readonly linkCanonicalSha256: string;
  readonly sourceIds: readonly string[];
  readonly sourceCount: number;
  readonly sourcesCanonicalSha256: string;
  readonly mediaCount: number;
  readonly mediaCanonicalSha256: string;
  readonly aiCanonicalSha256: string;
  readonly upstreamReviewDigests?: readonly {
    readonly dimension: string;
    readonly digest: string;
  }[];
};

export type ClinicalReviewBatchFreezeManifest = {
  readonly batchId: string;
  readonly count: number;
  readonly reviewer: ClinicalReviewBatchReviewer;
  readonly items: readonly ClinicalReviewBatchItem[];
};

/**
 * A later immutable batch may start only from one of these exact, server-frozen
 * predecessor states. `after_handoff` binds the new batch to the predecessor's
 * unanimous-approval handoff receipt. `after_changes_requested_refreeze` binds
 * it to the complete prior decision set and is accepted only when every
 * changes-requested target is present at a strictly newer review revision.
 *
 * No future activation is present below. Inventory must first freeze exact
 * candidate rows and receipt digests; adding a broad query or an empty digest
 * can never create an assignment.
 */
export type ClinicalReviewBatchActivation =
  | { readonly kind: 'initial' }
  | {
      readonly kind: 'after_handoff';
      readonly previousBatchId: string;
      readonly expectedPreviousFreezeDigest: string;
    }
  | {
      readonly kind: 'after_changes_requested_refreeze';
      readonly previousBatchId: string;
      readonly expectedDecisionSetDigest: string;
    };

export type ClinicalReviewBatchRegistration = {
  readonly sequence: number;
  readonly laneGraphVersion: 1;
  readonly dimension: 'clinical' | 'child_development' | 'evidence' | 'safety';
  readonly authority: 'pilot' | 'release';
  readonly activation: ClinicalReviewBatchActivation;
  readonly routingCanonicalSha256: string;
  readonly freezeDigest: string;
  readonly frozenAt: number;
  readonly expiresAt: number;
  readonly manifest: ClinicalReviewBatchFreezeManifest;
};

/**
 * Compile-time allowlist of immutable clinical batches, in strict sequence.
 * Keep this registry explicit: it must never be populated from the catalogue,
 * owner-priority queues, search results, or generic review requests.
 */
export const CLINICAL_REVIEW_BATCH_REGISTRY = [
  {
    sequence: 1,
    laneGraphVersion: 1,
    dimension: 'clinical',
    // Existing pilot decisions remain valid review history but are deliberately
    // non-release-authoritative. A later exact manifest must opt into `release`
    // and be materialized/activated server-side before it can gate publication.
    authority: 'pilot',
    activation: { kind: 'initial' },
    routingCanonicalSha256: '497b44347bfcb273a590a6e94ee5bd74ecb527b9c77d3617c99fb30d7ae8cec4',
    freezeDigest: CLINICAL_REVIEW_BATCH_HASH,
    frozenAt: CLINICAL_REVIEW_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_REVIEW_BATCH_EXPIRES_AT,
    manifest: CLINICAL_REVIEW_BATCH_MANIFEST,
  },
] as const satisfies readonly ClinicalReviewBatchRegistration[];

export function clinicalReviewBatchRoutingPayload(registration: ClinicalReviewBatchRegistration) {
  return {
    batchId: registration.manifest.batchId,
    sequence: registration.sequence,
    laneGraphVersion: registration.laneGraphVersion,
    dimension: registration.dimension,
    authority: registration.authority,
    activation: registration.activation,
    freezeDigest: registration.freezeDigest,
    frozenAt: registration.frozenAt,
    expiresAt: registration.expiresAt,
    reviewerUserId: registration.manifest.reviewer.userId,
    itemCount: registration.manifest.count,
  };
}
