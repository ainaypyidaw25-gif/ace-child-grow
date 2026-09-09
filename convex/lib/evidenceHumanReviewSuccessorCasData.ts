import supportingSourcesJson from './evidenceHumanReviewSuccessorSources.json';
import {
  GD_BIRTH2M_EMOTIONAL_CONTENT_PREIMAGE,
  GD_BIRTH2M_EMOTIONAL_DESIRED_DATA,
  GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT,
  GD_BIRTH2M_EMOTIONAL_LINK_PREIMAGE,
  GD_BIRTH2M_EMOTIONAL_MEDIA_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
  GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_TARGET,
  NHS_SOOTHING_CRYING_BABY_DESIRED,
  NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
  UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES,
  UNICEF_SEEN_COUNTED_DESIRED_METADATA,
  UNICEF_SEEN_COUNTED_LINK_PREIMAGES,
  UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES,
  UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
  UNICEF_SEEN_COUNTED_REVERSE_KEYS,
  UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES,
  UNICEF_SEEN_COUNTED_SOURCE_ID,
  UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE,
  type ClinicalBlockerExactPreimage,
} from './clinicalBlockerCasData';

export const NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID =
  '2026-08-24-nhs-soothing-human-review-successor-v1' as const;
export const UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID =
  '2026-08-24-unicef-seen-counted-human-review-successor-v1' as const;

export type EvidenceHumanReviewSuccessorExactRow = {
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  document?: Record<string, unknown>;
};

export type EvidenceHumanReviewSuccessorTarget = {
  kind: string;
  slug: string;
  content: EvidenceHumanReviewSuccessorExactRow;
  link: EvidenceHumanReviewSuccessorExactRow;
  reviews: readonly EvidenceHumanReviewSuccessorExactRow[];
  media: readonly EvidenceHumanReviewSuccessorExactRow[];
};

export type EvidenceHumanReviewSuccessorSpec = {
  releaseId:
    | typeof NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID
    | typeof UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID;
  releaseAction: string;
  sourceId:
    | typeof NHS_SOOTHING_CRYING_BABY_SOURCE_ID
    | typeof UNICEF_SEEN_COUNTED_SOURCE_ID;
  stagedSource: EvidenceHumanReviewSuccessorExactRow & {
    document: Record<string, unknown>;
  };
  priorRelease: {
    releaseId: string;
    action: string;
    rowId: string;
    creationTime: number;
    exactCanonicalSha256: string;
  };
  targets: readonly EvidenceHumanReviewSuccessorTarget[];
  supportingSources: readonly (EvidenceHumanReviewSuccessorExactRow & {
    sourceId: string;
    document: Record<string, unknown>;
  })[];
  reverseDependencyKeys: readonly string[];
};

function exactRow(
  source: ClinicalBlockerExactPreimage,
): EvidenceHumanReviewSuccessorExactRow & { document: Record<string, unknown> } {
  return {
    rowId: source.rowId,
    creationTime: source.creationTime,
    exactCanonicalSha256: source.exactCanonicalSha256,
    document: source.document,
  };
}

function withoutContentDecisionFields(document: Record<string, unknown>) {
  const {
    reviewerId: _reviewerId,
    reviewerQualification: _reviewerQualification,
    reviewerDisplayName: _reviewerDisplayName,
    reviewScope: _reviewScope,
    reviewedAt: _reviewedAt,
    nextReviewAt: _nextReviewAt,
    reviewNote: _reviewNote,
    aiPublicationReleaseId: _aiPublicationReleaseId,
    aiPublishedAt: _aiPublishedAt,
    ...stable
  } = document;
  void _reviewerId;
  void _reviewerQualification;
  void _reviewerDisplayName;
  void _reviewScope;
  void _reviewedAt;
  void _nextReviewAt;
  void _reviewNote;
  void _aiPublicationReleaseId;
  void _aiPublishedAt;
  return stable;
}

function withoutSourceReviewFields(document: Record<string, unknown>) {
  const {
    reviewerQualification: _reviewerQualification,
    reviewNote: _reviewNote,
    reviewerId: _reviewerId,
    reviewScope: _reviewScope,
    ...stable
  } = document;
  void _reviewerQualification;
  void _reviewNote;
  void _reviewerId;
  void _reviewScope;
  return stable;
}

export const NHS_SOOTHING_STAGED_SOURCE_DOCUMENT = {
  _creationTime: 1_787_509_568_107.2234,
  _id: 'kd77yw49yxjn784wwen2tsxgpd8d1w5y',
  ...NHS_SOOTHING_CRYING_BABY_DESIRED,
  keywords: [...NHS_SOOTHING_CRYING_BABY_DESIRED.keywords],
  topics: [...NHS_SOOTHING_CRYING_BABY_DESIRED.topics],
  createdAt: 1_787_509_568_107,
  updatedAt: 1_787_509_568_107,
} as const;

export const UNICEF_SEEN_COUNTED_STAGED_SOURCE_DOCUMENT = {
  ...withoutSourceReviewFields(UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.document),
  _id: UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.rowId,
  _creationTime: UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.creationTime,
  ...UNICEF_SEEN_COUNTED_DESIRED_METADATA,
  updatedAt: 1_787_509_679_606,
} as const;

export const NHS_SOOTHING_CURRENT_CONTENT_DOCUMENT = {
  ...withoutContentDecisionFields(GD_BIRTH2M_EMOTIONAL_CONTENT_PREIMAGE.document),
  data: GD_BIRTH2M_EMOTIONAL_DESIRED_DATA,
  searchText: GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT,
  clinicalStatus: 'clinical_review',
  reviewRevision: GD_BIRTH2M_EMOTIONAL_TARGET.contentDesiredReviewRevision,
  updatedAt: 1_787_509_568_107,
} as const;

export const NHS_SOOTHING_CURRENT_LINK_DOCUMENT = {
  ...GD_BIRTH2M_EMOTIONAL_LINK_PREIMAGE.document,
  sourceIds: [...GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds],
  updatedAt: 1_787_509_568_107,
} as const;

const supportingSourceHashes: Readonly<Record<string, string>> = {
  'who-unicef-developmental-disabilities-2023':
    'a0f9051435d25d72f363637d7275a9725b541af4d1906f8e39aac449a010755a',
  'aap-surveillance-2020':
    '636c00a8f07a846b4c2486c0de8f58dc3a1ac28100dc80dffb024043f2d9c897',
  'tb-dbp-5e-2022':
    '7b74adb5b6f6214053391051697d5ce7e5ab8cc6a2199638251da6250a76a80d',
  'tb-ccitsn-3e-2004':
    'f1af454d41f0351e3a026181daa04b987016a18f3200ba94f160ea480afd59bd',
  'tb-handbook-ecse-2016':
    'e880b5f5cd22d57f4b130df42603f4b904b2ed3a57b2ff1e1ace27e0edbb83d5',
};

type SupportingSourceDocument = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
  sourceId: string;
};

export const UNICEF_SEEN_COUNTED_SUPPORTING_SOURCE_PREIMAGES =
  (supportingSourcesJson as SupportingSourceDocument[]).map((document) => ({
    sourceId: document.sourceId,
    rowId: document._id,
    creationTime: document._creationTime,
    exactCanonicalSha256: supportingSourceHashes[document.sourceId] ?? '',
    document,
  }));

const nhsSupportingSourceIds = new Set([
  'aap-toxic-stress-2021',
  'who-nurturing-care-2018',
  'nice-ng143-fever-2019',
]);

export const NHS_SOOTHING_SUPPORTING_SOURCE_PREIMAGES =
  GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES
    .filter((source) => nhsSupportingSourceIds.has(source.sourceId))
    .map((source) => ({ sourceId: source.sourceId, ...exactRow(source) }));

export const NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC = {
  releaseId: NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID,
  releaseAction: 'release.nhs_soothing_human_review_successor',
  sourceId: NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
  stagedSource: {
    rowId: NHS_SOOTHING_STAGED_SOURCE_DOCUMENT._id,
    creationTime: NHS_SOOTHING_STAGED_SOURCE_DOCUMENT._creationTime,
    exactCanonicalSha256:
      '6921b4bc867ed2b45bfa7ffa8c00b92d1380a969b2473f4bb23e2d0d6b140e70',
    document: NHS_SOOTHING_STAGED_SOURCE_DOCUMENT,
  },
  priorRelease: {
    releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
    action: 'release.gd_birth_2m_emotional_tier_evidence',
    rowId: 'j57et5ts178wv4f3191p29bk2x8d1n61',
    creationTime: 1_787_509_568_107.2236,
    exactCanonicalSha256:
      '50887adf9b15b2ddbddcdcf4e21ebb391f40780909dd08ba585e523d6c06b63e',
  },
  targets: [{
    kind: GD_BIRTH2M_EMOTIONAL_TARGET.kind,
    slug: GD_BIRTH2M_EMOTIONAL_TARGET.slug,
    content: {
      rowId: GD_BIRTH2M_EMOTIONAL_TARGET.contentId,
      creationTime: GD_BIRTH2M_EMOTIONAL_TARGET.contentCreationTime,
      exactCanonicalSha256:
        'd138739ca7efb8518c7fe8882737bf0784429e1f7d19d8c4e7b55f79e409b5aa',
      document: NHS_SOOTHING_CURRENT_CONTENT_DOCUMENT,
    },
    link: {
      rowId: GD_BIRTH2M_EMOTIONAL_TARGET.linkId,
      creationTime: GD_BIRTH2M_EMOTIONAL_TARGET.linkCreationTime,
      exactCanonicalSha256:
        '215ed4df735acc94165449b2598e7af20f5e7383cb2a2093ca7eff3f65e15a3b',
      document: NHS_SOOTHING_CURRENT_LINK_DOCUMENT,
    },
    reviews: GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES.map(exactRow),
    media: GD_BIRTH2M_EMOTIONAL_MEDIA_PREIMAGES.map(exactRow),
  }],
  supportingSources: NHS_SOOTHING_SUPPORTING_SOURCE_PREIMAGES,
  reverseDependencyKeys: ['guide:gd_birth_2m_emotional'],
} as const satisfies EvidenceHumanReviewSuccessorSpec;

export const UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_SPEC = {
  releaseId: UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID,
  releaseAction: 'release.unicef_seen_counted_human_review_successor',
  sourceId: UNICEF_SEEN_COUNTED_SOURCE_ID,
  stagedSource: {
    rowId: UNICEF_SEEN_COUNTED_STAGED_SOURCE_DOCUMENT._id as string,
    creationTime: UNICEF_SEEN_COUNTED_STAGED_SOURCE_DOCUMENT._creationTime as number,
    exactCanonicalSha256:
      'dd5c651360e190398f45545388b10c972fc41a6e8d99eb90739dda9a7248c04d',
    document: UNICEF_SEEN_COUNTED_STAGED_SOURCE_DOCUMENT,
  },
  priorRelease: {
    releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
    action: 'release.unicef_seen_counted_metadata',
    rowId: 'j571s0e7kcgy9w5hha5es5c1nn8d0sv3',
    creationTime: 1_787_509_679_606.1316,
    exactCanonicalSha256:
      '8c03cb7d646de74f5dc060a587c79d88fbdd84374a444d0cbea8bc9744fbbd88',
  },
  targets: [
    {
      kind: 'lesson',
      slug: 'lsn_special_needs_awareness',
      content: exactRow(UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES[0]),
      link: exactRow(UNICEF_SEEN_COUNTED_LINK_PREIMAGES[0]),
      reviews: UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES.filter((row) =>
        row.document.contentSlug === 'lsn_special_needs_awareness').map(exactRow),
      media: UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES.filter((row) =>
        row.document.contentSlug === 'lsn_special_needs_awareness').map(exactRow),
    },
    {
      kind: 'special_need',
      slug: 'sn_learning_disability',
      content: exactRow(UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES[1]),
      link: exactRow(UNICEF_SEEN_COUNTED_LINK_PREIMAGES[1]),
      reviews: UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES.filter((row) =>
        row.document.contentSlug === 'sn_learning_disability').map(exactRow),
      media: UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES.filter((row) =>
        row.document.contentSlug === 'sn_learning_disability').map(exactRow),
    },
  ],
  supportingSources: UNICEF_SEEN_COUNTED_SUPPORTING_SOURCE_PREIMAGES,
  reverseDependencyKeys: UNICEF_SEEN_COUNTED_REVERSE_KEYS,
} as const satisfies EvidenceHumanReviewSuccessorSpec;

export const EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS = [
  NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC,
  UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_SPEC,
] as const;

export function isEvidenceHumanReviewSuccessorSourceId(sourceId: string): boolean {
  return EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS.some(
    (spec) => spec.sourceId === sourceId,
  );
}

export function isEvidenceHumanReviewSuccessorTarget(
  kind: string,
  slug: string,
): boolean {
  return EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS.some((spec) =>
    spec.targets.some((target) => target.kind === kind && target.slug === slug));
}

export function isEvidenceHumanReviewSuccessorContentSlug(slug: string): boolean {
  return EVIDENCE_HUMAN_REVIEW_SUCCESSOR_SPECS.some((spec) =>
    spec.targets.some((target) => target.slug === slug));
}
