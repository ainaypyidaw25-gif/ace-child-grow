import type { Doc } from '../_generated/dataModel';

export const AI_PUBLICATION_RELEASE_ID = '2026-08-19-ai-educational-preview-3' as const;

/** SHA-256 of the immutable multi-agent audit artifact compiled with this release. */
export const AI_PUBLICATION_AUDIT_ARTIFACT_HASH =
  'a0c1a453b29808e314b5ad296b06dcbc31e3a08d772de62c7c7a04341384cfd4' as const;

export type AiReleaseTargetData = {
  type: 'lesson' | 'story';
  slug: 'lsn_early_math' | 'st_waiting_at_clinic' | 'st_first_day_school';
  initialClinicalStatus: 'clinical_review' | 'published';
  initialReviewRevision: number;
  initialContentUpdatedAt: number;
  initialContentSnapshotHash: string;
  initialSourceIds: readonly string[];
  initialLinkUpdatedAt: number;
  initialLinkSnapshotHash: string;
  desiredReviewRevision: number;
  desiredSourceIds: readonly [string];
  desiredContentSnapshotHash: string;
  desiredLinkSnapshotHash: string;
};

/**
 * Read-only production preimages captured on 2026-08-19. These constants are
 * intentionally not caller-controlled: any intervening edit, review, link
 * change or publication transition makes the release fail before its first
 * write.
 */
export const AI_PUBLICATION_RELEASE_TARGETS: readonly AiReleaseTargetData[] = [
  {
    type: 'lesson',
    slug: 'lsn_early_math',
    initialClinicalStatus: 'clinical_review',
    initialReviewRevision: 8,
    initialContentUpdatedAt: 1_786_432_330_925,
    initialContentSnapshotHash: '0955e1fe3c953a6e2eb1f4349c5c990721dce1bf79bfbabfc7b5ec5d75e09349',
    initialSourceIds: ['aap-power-of-play-2018', 'tb-handbook-ecse-2016'],
    initialLinkUpdatedAt: 1_785_024_331_625,
    initialLinkSnapshotHash: '675acb62f2d6b00af46580fe8409414e7edab984c18a8f247790477c85e0ff14',
    desiredReviewRevision: 9,
    desiredSourceIds: ['us-hhs-head-start-elof-2015'],
    desiredContentSnapshotHash: 'e5e5bd3383ade88d5960a1278658a19aef460ddc84717ca8eed07d11fa4145ba',
    desiredLinkSnapshotHash: '3badde0e97557a30961739438adc85cdc20ae4545fa3f12f984a5a4bf651c7f8',
  },
  {
    type: 'story',
    slug: 'st_waiting_at_clinic',
    initialClinicalStatus: 'clinical_review',
    initialReviewRevision: 2,
    initialContentUpdatedAt: 1_786_432_330_925,
    initialContentSnapshotHash: '7a7b9738b4f678756a1727bcfc24d5592bb5ea015f114c7e962e226e0cb13de2',
    initialSourceIds: ['tb-bright-futures-4e-2017', 'nhs-baby-reviews-2023'],
    initialLinkUpdatedAt: 1_785_024_331_625,
    initialLinkSnapshotHash: 'bb9af7c7522e6529183b209e25759dbc287c21ca94de202f50b861f637b021b2',
    desiredReviewRevision: 3,
    desiredSourceIds: ['nhs-alder-hey-outpatient-2023'],
    desiredContentSnapshotHash: '590191f08636fc7ff358c717ae1044233c6bd067170322f7ae47c6fb2e60a04c',
    desiredLinkSnapshotHash: '5bb37bca3a190f7c16c7caa819ab4c614e8279219cffc0a5dbf49ee3faa2ec50',
  },
  {
    type: 'story',
    slug: 'st_first_day_school',
    initialClinicalStatus: 'published',
    initialReviewRevision: 1,
    initialContentUpdatedAt: 1_787_027_727_052,
    initialContentSnapshotHash: '3531a1f489b35311a79dd9f8bf7c6ac88b439cf9dfc5fa8cf61b2c331d0f955a',
    initialSourceIds: ['tb-handbook-ecse-2016', 'nice-ph40-social-emotional-2012'],
    initialLinkUpdatedAt: 1_785_024_331_625,
    initialLinkSnapshotHash: 'ed4d5caa674090810432be87d63ef3901a2b99426c9a45377266509fdb7e4a44',
    desiredReviewRevision: 2,
    desiredSourceIds: ['us-hhs-head-start-first-day-jitters-2024'],
    desiredContentSnapshotHash: 'cc4d31c2eb18098c24763fcd0b718c431a7f753962f6ae5a5b6c9f9f3d9f72fc',
    desiredLinkSnapshotHash: '25eedf3d1dc97fe181b59d674ec96365e6591652acfb3f0fecd7dff0a0c05263',
  },
] as const;

export type AiReleaseSourceSeed = Pick<
  Doc<'evidenceSources'>,
  | 'sourceId'
  | 'org'
  | 'orgKey'
  | 'title'
  | 'authors'
  | 'year'
  | 'edition'
  | 'country'
  | 'language'
  | 'url'
  | 'doi'
  | 'isbn'
  | 'pmid'
  | 'evidenceLevel'
  | 'reviewStatus'
  | 'reviewer'
  | 'reviewDate'
  | 'nextReviewDate'
  | 'keywords'
  | 'topics'
  | 'ageMonthsMin'
  | 'ageMonthsMax'
  | 'verifiedOn'
  | 'verifiedNote'
>;

/** Exact publisher metadata already locked by the evidence registry tests. */
export const AI_PUBLICATION_RELEASE_SOURCES: readonly AiReleaseSourceSeed[] = [
  {
    sourceId: 'us-hhs-head-start-elof-2015',
    org: 'U.S. Department of Health and Human Services, Administration for Children and Families, Office of Head Start',
    orgKey: 'GOV',
    title: 'Head Start Early Learning Outcomes Framework: Ages Birth to Five',
    authors: 'U.S. Department of Health and Human Services, Administration for Children and Families, Office of Head Start',
    year: 2015,
    edition: null,
    country: 'United States',
    language: 'en',
    url: 'https://headstart.gov/sites/default/files/pdf/elof-ohs-framework.pdf',
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'expert_consensus',
    reviewStatus: 'awaiting_review',
    reviewer: null,
    reviewDate: null,
    nextReviewDate: null,
    keywords: ['early learning outcomes', 'early mathematics', 'social development', 'emotional development', 'school readiness'],
    topics: ['milestones', 'cognitive', 'social_emotional', 'parenting', 'school_readiness', 'play'],
    ageMonthsMin: 0,
    ageMonthsMax: 60,
    verifiedOn: '2026-08-19',
    verifiedNote: 'The official Head Start PDF cover prints this title, 2015 and the Office of Head Start corporate body. The framework describes overlapping developmental progressions from birth through 60 months; its preschool Mathematics Development domain explicitly covers counting and cardinality, measurement, patterns, geometry and spatial sense. It also says the framework is not an assessment tool or checklist and must not be used to conclude that a child has failed or is not ready.',
  },
  {
    sourceId: 'nhs-alder-hey-outpatient-2023',
    org: "Alder Hey Children's NHS Foundation Trust",
    orgKey: 'NHS',
    title: 'What to expect at an outpatient appointment',
    authors: null,
    year: 2023,
    edition: 'Page last reviewed: 04/07/2023',
    country: 'United Kingdom',
    language: 'en',
    url: 'https://www.alderhey.nhs.uk/visiting/outpatient-appointments/expect/',
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'parent_education',
    reviewStatus: 'awaiting_review',
    reviewer: null,
    reviewDate: null,
    nextReviewDate: null,
    keywords: ['outpatient appointment', 'waiting area', 'toys', 'activities'],
    topics: ['parenting', 'play'],
    ageMonthsMin: null,
    ageMonthsMax: null,
    verifiedOn: '2026-08-19',
    verifiedNote: 'The official Alder Hey Children’s NHS Foundation Trust page prints this title and “Page last reviewed: 04/07/2023.” Its waiting-area section says a child may need to wait and that some waiting areas have toys and other activities for younger children.',
  },
  {
    sourceId: 'us-hhs-head-start-first-day-jitters-2024',
    org: 'U.S. Department of Health and Human Services, Administration for Children and Families, Office of Head Start',
    orgKey: 'GOV',
    title: 'First Day Jitters',
    authors: null,
    year: 2024,
    edition: 'Last Updated: September 26, 2024',
    country: 'United States',
    language: 'en',
    url: 'https://www.headstart.gov/video/first-day-jitters',
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'parent_education',
    reviewStatus: 'awaiting_review',
    reviewer: null,
    reviewDate: null,
    nextReviewDate: null,
    keywords: ['first day of school', 'kindergarten transition', 'nervous feelings', 'school readiness'],
    topics: ['social_emotional', 'school_readiness', 'parenting'],
    ageMonthsMin: 36,
    ageMonthsMax: 60,
    verifiedOn: '2026-08-19',
    verifiedNote: 'The official Head Start page prints this title, identifies Amanda Bryans as the reader, labels the age group “Preschoolers” and prints “Last Updated: September 26, 2024.” Its introduction and transcript describe first-day nervousness, a welcoming adult, new classmates and feeling better after starting school.',
  },
] as const;

export const AI_PUBLICATION_RELEASE_SOURCE_HASHES: Readonly<Record<string, string>> = {
  'us-hhs-head-start-elof-2015': '061e21a65c5e7df0aa339d56ccf9f0823e17fdf9b7c4fba44ce49228923f2a5c',
  'nhs-alder-hey-outpatient-2023': 'b1ef83b5454077bdbac05ab4813eae6522fb78a3b7ff2beffed79bb9d5080cd3',
  'us-hhs-head-start-first-day-jitters-2024': '93da0145018783682eba7e299cac56420f5561900f2145c07f36b689c8f7b9a3',
};
