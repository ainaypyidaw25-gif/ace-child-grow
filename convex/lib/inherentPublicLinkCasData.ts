import exactSourceRowsJson from './inherentPublicLinkCasSources.json';

export const INHERENT_PUBLIC_LINK_CAS_RELEASE_ID =
  '2026-08-21-inherent-public-citation-links-v1' as const;

export const INHERENT_PUBLIC_LINK_CAS_SNAPSHOT_SHA256 =
  '09419d04bafd28a4d3b4a721828209990904d16b28d86a642ed4145e9f72bf80' as const;

export type InherentPublicLinkKind = 'hope_topic' | 'safety_rule';

export type InherentPublicLinkCasTarget = {
  kind: InherentPublicLinkKind;
  slug: string;
  linkId: string;
  creationTime: number;
  createdAt: number;
  initialUpdatedAt: number;
  initialSourceIds: readonly string[];
  desiredSourceIds: readonly string[];
};

/** Exact read-only Production evidenceLinks preimages captured on 2026-08-21. */
export const INHERENT_PUBLIC_LINK_CAS_TARGETS:
readonly InherentPublicLinkCasTarget[] = [
  {
    kind: 'hope_topic',
    slug: 'autism-spectrum',
    linkId: 'k9746442dremr2m7mb523p6wtn8b8fve',
    creationTime: 1_785_024_331_625.8694,
    createdAt: 1_785_024_331_625,
    initialUpdatedAt: 1_785_024_331_625,
    initialSourceIds: [
      'aap-asd-2020',
      'cdc-autism-signs-2024',
      'nice-cg128-autism-2011',
      'jr-mchat-rf-2014',
    ],
    desiredSourceIds: ['aap-asd-2020', 'cdc-autism-signs-2024'],
  },
  {
    kind: 'hope_topic',
    slug: 'cerebral-palsy',
    linkId: 'k978sst6tqdcjq7vmaasjyhbpx8b983p',
    creationTime: 1_785_024_331_625.8704,
    createdAt: 1_785_024_331_625,
    initialUpdatedAt: 1_785_024_331_625,
    initialSourceIds: [
      'nice-ng62-cerebral-palsy-2017',
      'tb-swaiman-7e-2025',
      'tb-campbell-pt-6e-2022',
    ],
    desiredSourceIds: ['nice-ng62-cerebral-palsy-2017'],
  },
  {
    kind: 'safety_rule',
    slug: 'loss_of_acquired_skills',
    linkId: 'k973bf4m7wbg1r6y8acz7j1mhd8b9pq1',
    creationTime: 1_785_024_331_625.8687,
    createdAt: 1_785_024_331_625,
    initialUpdatedAt: 1_785_024_331_625,
    initialSourceIds: [
      'aap-surveillance-2020',
      'cdc-autism-signs-2024',
      'aap-asd-2020',
    ],
    desiredSourceIds: ['aap-surveillance-2020', 'cdc-milestones-2026'],
  },
  {
    kind: 'safety_rule',
    slug: 'skill_loss_question',
    linkId: 'k97dtxg0fcdpby49pw0x7h18718b8thr',
    creationTime: 1_785_024_331_625.869,
    createdAt: 1_785_024_331_625,
    initialUpdatedAt: 1_785_024_331_625,
    initialSourceIds: [
      'aap-surveillance-2020',
      'aap-asd-2020',
      'cdc-monitoring-screening-2026',
    ],
    desiredSourceIds: ['aap-surveillance-2020', 'cdc-milestones-2026'],
  },
] as const;

export type InherentPublicCitationSourcePreimage = {
  sourceId: string;
  rowId: string;
  creationTime: number;
  org: string;
  orgKey: string;
  title: string;
  url: string;
  evidenceLevel: string;
  reviewStatus: 'approved';
  reviewer: string;
  reviewerId: string;
  reviewerQualification: string;
  reviewScope: 'education';
  year: number;
  reviewDate: string;
  nextReviewDate: string;
  verifiedOn: string;
  updatedAt: number;
  exactCanonicalSha256: string;
};

export const INHERENT_PUBLIC_CITATION_EXACT_SOURCE_ROWS =
  exactSourceRowsJson as readonly Record<string, unknown>[];

/**
 * Exact citation-bearing Production source preimages captured on 2026-08-21.
 * The release never patches these rows; it only proves that the desired links
 * still resolve to the professionally reviewed metadata inspected here.
 */
export const INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES:
readonly InherentPublicCitationSourcePreimage[] = [
  {
    sourceId: 'aap-asd-2020',
    rowId: 'kd73n2fknq767qx9ajk8w1qtx58b8yqh',
    creationTime: 1_785_024_320_720.736,
    org: 'American Academy of Pediatrics',
    orgKey: 'AAP',
    title: 'Identification, Evaluation, and Management of Children With Autism Spectrum Disorder',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31843864/',
    evidenceLevel: 'guideline',
    reviewStatus: 'approved',
    reviewer: 'ACE Child Grow Owner / Education Reviewer',
    reviewerId: 'mn79pqcdy108y85stdxvtvqcz18b8w9c',
    reviewerQualification: 'MEd (Early Childhood and Special Education)',
    reviewScope: 'education',
    year: 2020,
    reviewDate: '2026-07-26',
    nextReviewDate: '2027-07-26',
    verifiedOn: '2026-07-24',
    updatedAt: 1_785_043_814_882,
    exactCanonicalSha256: 'e6821688d6d42ab564a8b0536190e26869d9b1529853aec32fba5dd669f898b7',
  },
  {
    sourceId: 'aap-surveillance-2020',
    rowId: 'kd73qqr09nqa74faq95t7kwcxn8b9m6g',
    creationTime: 1_785_024_320_720.7358,
    org: 'American Academy of Pediatrics',
    orgKey: 'AAP',
    title: 'Promoting Optimal Development: Identifying Infants and Young Children With Developmental Disorders Through Developmental Surveillance and Screening',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31843861/',
    evidenceLevel: 'guideline',
    reviewStatus: 'approved',
    reviewer: 'ACE Child Grow Owner / Education Reviewer',
    reviewerId: 'mn79pqcdy108y85stdxvtvqcz18b8w9c',
    reviewerQualification: 'MEd (Early Childhood and Special Education)',
    reviewScope: 'education',
    year: 2020,
    reviewDate: '2026-07-26',
    nextReviewDate: '2027-07-26',
    verifiedOn: '2026-07-24',
    updatedAt: 1_785_043_814_882,
    exactCanonicalSha256: '636c00a8f07a846b4c2486c0de8f58dc3a1ac28100dc80dffb024043f2d9c897',
  },
  {
    sourceId: 'cdc-autism-signs-2024',
    rowId: 'kd7dj6xbvzgy1w9tnhzw2gn1hn8b9cxe',
    creationTime: 1_785_024_320_720.739,
    org: 'Centers for Disease Control and Prevention',
    orgKey: 'CDC',
    title: 'Signs and Symptoms of Autism Spectrum Disorder',
    url: 'https://www.cdc.gov/autism/signs-symptoms/index.html',
    evidenceLevel: 'parent_education',
    reviewStatus: 'approved',
    reviewer: 'ACE Child Grow Owner / Education Reviewer',
    reviewerId: 'mn79pqcdy108y85stdxvtvqcz18b8w9c',
    reviewerQualification: 'MEd (Early Childhood and Special Education)',
    reviewScope: 'education',
    year: 2024,
    reviewDate: '2026-07-26',
    nextReviewDate: '2027-07-26',
    verifiedOn: '2026-07-24',
    updatedAt: 1_785_043_814_882,
    exactCanonicalSha256: 'c9d11e3d5019d06b9aa1e973adf6cab0992a1a38577aef5f3b3e37d7883a9b97',
  },
  {
    sourceId: 'cdc-milestones-2026',
    rowId: 'kd7csfrtqwtjkr6vmmtbkzhxj98b9jdm',
    creationTime: 1_785_024_320_720.7383,
    org: 'Centers for Disease Control and Prevention',
    orgKey: 'CDC',
    title: "CDC's Developmental Milestones",
    url: 'https://www.cdc.gov/act-early/milestones/index.html',
    evidenceLevel: 'parent_education',
    reviewStatus: 'approved',
    reviewer: 'ACE Child Grow Owner / Education Reviewer',
    reviewerId: 'mn79pqcdy108y85stdxvtvqcz18b8w9c',
    reviewerQualification: 'MEd (Early Childhood and Special Education)',
    reviewScope: 'education',
    year: 2026,
    reviewDate: '2026-07-26',
    nextReviewDate: '2027-07-26',
    verifiedOn: '2026-07-24',
    updatedAt: 1_785_043_814_882,
    exactCanonicalSha256: '9a93e5e84dde28c280f1683ac983ebb41e08f34948ce36d050062f30f9d5e03b',
  },
  {
    sourceId: 'nice-ng62-cerebral-palsy-2017',
    rowId: 'kd79knstrm9zfswckrqr29tedd8b81xc',
    creationTime: 1_785_024_320_720.742,
    org: 'National Institute for Health and Care Excellence',
    orgKey: 'NICE',
    title: 'Cerebral palsy in under 25s: assessment and management',
    url: 'https://www.nice.org.uk/guidance/ng62',
    evidenceLevel: 'guideline',
    reviewStatus: 'approved',
    reviewer: 'ACE Child Grow Owner / Education Reviewer',
    reviewerId: 'mn79pqcdy108y85stdxvtvqcz18b8w9c',
    reviewerQualification: 'MEd (Early Childhood and Special Education)',
    reviewScope: 'education',
    year: 2017,
    reviewDate: '2026-07-26',
    nextReviewDate: '2027-07-26',
    verifiedOn: '2026-07-24',
    updatedAt: 1_785_043_814_882,
    exactCanonicalSha256: '86cfc2b8148a3c1a859634a157acdd58fb1dd3cd45f6a55cf031569f41bf092f',
  },
] as const;

const targetKeys = INHERENT_PUBLIC_LINK_CAS_TARGETS.map(
  (target) => `${target.kind}\u0000${target.slug}`,
);
const targetKeySet = new Set<string>(targetKeys);
const linkIds = INHERENT_PUBLIC_LINK_CAS_TARGETS.map((target) => target.linkId);
const sourceIds = INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.map((source) => source.sourceId);
const sourceRowIds = INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.map((source) => source.rowId);
const exactSourceRowIds = INHERENT_PUBLIC_CITATION_EXACT_SOURCE_ROWS.map(
  (source) => String(source.sourceId),
);
const desiredSourceIds = new Set(
  INHERENT_PUBLIC_LINK_CAS_TARGETS.flatMap((target) => [...target.desiredSourceIds]),
);

if (INHERENT_PUBLIC_LINK_CAS_TARGETS.length !== 4
  || new Set(targetKeys).size !== targetKeys.length
  || new Set(linkIds).size !== linkIds.length) {
  throw new Error('Inherent-public link CAS must freeze exactly four unique Production links');
}
if (INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.length !== 5
  || new Set(sourceIds).size !== sourceIds.length
  || new Set(sourceRowIds).size !== sourceRowIds.length
  || INHERENT_PUBLIC_CITATION_EXACT_SOURCE_ROWS.length !== sourceIds.length
  || new Set(exactSourceRowIds).size !== exactSourceRowIds.length
  || !sourceIds.every((sourceId, index) => sourceId === exactSourceRowIds[index])
  || sourceIds.some((sourceId) => !desiredSourceIds.has(sourceId))
  || [...desiredSourceIds].some((sourceId) => !sourceIds.includes(sourceId))) {
  throw new Error('Inherent-public link CAS source preimages must equal the desired source union');
}
for (const target of INHERENT_PUBLIC_LINK_CAS_TARGETS) {
  if (target.initialSourceIds.length < 1
    || target.initialSourceIds.length > 20
    || new Set(target.initialSourceIds).size !== target.initialSourceIds.length
    || target.desiredSourceIds.length < 1
    || target.desiredSourceIds.length > 20
    || new Set(target.desiredSourceIds).size !== target.desiredSourceIds.length) {
    throw new Error(`Inherent-public link CAS has an invalid source array: ${target.kind}:${target.slug}`);
  }
}

/** Server-boundary guard against stale or generic evidence-link imports. */
export function isInherentPublicLinkCasTarget(kind: string, slug: string): boolean {
  return targetKeySet.has(`${kind}\u0000${slug}`);
}
