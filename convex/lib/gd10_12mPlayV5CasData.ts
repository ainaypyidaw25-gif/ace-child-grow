import seedData from '../seedData.json';
import exactPreimagesJson from './gd10_12mPlayV5CasPreimages.json';

export {
  isGd10_12mPlayV5ContentSlug,
  isGd10_12mPlayV5Link,
  isGd10_12mPlayV5Source,
} from './gd10_12mPlayV5ImportPolicy';

export const GD10_12M_PLAY_V5_RELEASE_ID =
  '2026-08-24-gd-10-12m-play-safety-v5' as const;
export const GD10_12M_PLAY_V5_RELEASE_ACTION =
  'release.gd_10_12m_play_safety_v5' as const;
export const GD10_12M_PLAY_V5_FIXTURE_SHA256 =
  '0cc980a5f4f9a5c6efe4431b0e6f8249ecf2cdbed3d4114c4f89417648d96eda' as const;

type ExactDocument = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
};

type ContentDocument = ExactDocument & {
  type: string;
  slug: string;
  createdAt: number;
  updatedAt: number;
  reviewRevision: number;
  clinicalStatus: string;
  data: Record<string, unknown>;
  searchText: string;
};

type LinkDocument = ExactDocument & {
  kind: string;
  slug: string;
  sourceIds: string[];
  createdAt: number;
  updatedAt: number;
};

type SourceDocument = ExactDocument & {
  sourceId: string;
};

type ReverseSnapshot = {
  sourceId: string;
  keys: string[];
  canonicalSha256: string;
};

type ExactPreimages = {
  frozenFrom: {
    deployment: string;
    checkedAt: string;
    gitBase: string;
  };
  content: ContentDocument;
  link: LinkDocument;
  sources: SourceDocument[];
  reviews: ExactDocument[];
  media: ExactDocument[];
  ai: {
    contentAudits: ExactDocument[];
    evidenceAudits: ExactDocument[];
    releases: ExactDocument[];
    runs: ExactDocument[];
  };
  releaseAudits: ExactDocument[];
  reverseDependencies: ReverseSnapshot[];
};

type DesiredSeedContent = {
  type: string;
  slug: string;
  summaryMm: string;
  summaryEn: string;
  data: Record<string, unknown>;
  searchText: string;
};

export const GD10_12M_PLAY_V5_PREIMAGES = exactPreimagesJson as ExactPreimages;

const desiredContent = (seedData as unknown as DesiredSeedContent[])
  .find((row) => row.slug === 'gd_10_12m_play');
if (!desiredContent) throw new Error('Missing gd_10_12m_play generated seed row');

export const GD10_12M_PLAY_V5_DESIRED_CONTENT = desiredContent;

export const GD10_12M_PLAY_V5_REQUIRED_REVIEWS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

export const GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS = [
  'aap-power-of-play-2018',
  'who-care-for-child-development-2012',
  'unicef-early-moments-2017',
  'tb-bright-futures-4e-2017',
  'aap-drowning-2021',
  'aap-safe-sleep-2022',
] as const;

export const GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS = [
  'aap-power-of-play-2018',
  'who-care-for-child-development-2012',
  'unicef-early-moments-2017',
  'tb-bright-futures-4e-2017',
  'aap-drowning-2021',
  'cpsc-childproofing-home-2023',
  'hc-choking-prevention-2026',
] as const;

export const GD10_12M_PLAY_V5_SOURCE_UNION_IDS = [
  ...GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS,
  ...GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS.filter((sourceId) =>
    !(GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS as readonly string[]).includes(sourceId)),
] as const;

export type Gd10_12mPlayV5ExactPreimage = {
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  document: ExactDocument;
};

function preimage(
  document: ExactDocument,
  exactCanonicalSha256: string,
): Gd10_12mPlayV5ExactPreimage {
  return {
    rowId: document._id,
    creationTime: document._creationTime,
    exactCanonicalSha256,
    document,
  };
}

export const GD10_12M_PLAY_V5_CONTENT_PREIMAGE = preimage(
  GD10_12M_PLAY_V5_PREIMAGES.content,
  'f43fe0f62224588b54c6ee5a7f72c291fcd5923ecad101b78406e8591df40923',
);

export const GD10_12M_PLAY_V5_LINK_PREIMAGE = preimage(
  GD10_12M_PLAY_V5_PREIMAGES.link,
  '62cf222cde440a66325cecb863a4275d4e3f9e61e9c3d986dc9ca3098b680fa9',
);

const sourceHashes: Readonly<Record<string, string>> = {
  'hc-choking-prevention-2026':
    '837b52d0307be1a93642ef526f6329d9612cf1f76f6254e3243929dae2468dd4',
  'aap-drowning-2021':
    'ab31ffe031739edcefabe23a46a74b28e3e554bd288359ca3386deba6a3113d1',
  'cpsc-childproofing-home-2023':
    'c5835ee92e9b1143b8195ce88b6b0d934eb96e99708844d5204cb2fbbf0592d4',
  'unicef-early-moments-2017':
    '92e187d84af5d84d21674b05b369c92dce4b4c7e5ed9761f50ed1fe24285f58f',
  'who-care-for-child-development-2012':
    '05337229d974b540513a0d0a4ded7ad645f0fa8aa654a4f5fddf72649e984370',
  'aap-power-of-play-2018':
    '1a64c92492971bcd6bc53cc551df54bb33d93b62d9d78c11c0c7180a8f218c6b',
  'tb-bright-futures-4e-2017':
    '884f6f50bcdc10faf29690640dafc56818cc9102695b5d33eab49303149e245b',
  'aap-safe-sleep-2022':
    '1e0b8da788ec727914131e955abaddb6c7d0c435ca8947bcb654d247779317bc',
};

export const GD10_12M_PLAY_V5_SOURCE_PREIMAGES =
  GD10_12M_PLAY_V5_PREIMAGES.sources.map((document) => ({
    sourceId: document.sourceId,
    ...preimage(document, sourceHashes[document.sourceId] ?? ''),
  }));

const reviewHashes = [
  'd9756bfa6896603f8a65388ae84a35ccfefaff7d514a4a0d6bde462df97e79ec',
  '0263fe83ddaef8494c67c3e0f52d062d79c4ea7c197554f260352e7b9cc2dc2b',
  'b022c2ed8e34199494d7f2181b8be456c9573da45d335ac6d488b0703cef3cf0',
  'b1f004da68aed0562cc32a3156f8ae2fde8371329e75d59f8140d68a31583483',
  'c4d65daf5a66b800a9934a1eec6fa5c5a9a712a1f1aba5ed69c91ebc9ddcc8d4',
] as const;

export const GD10_12M_PLAY_V5_REVIEW_PREIMAGES =
  GD10_12M_PLAY_V5_PREIMAGES.reviews.map((document, index) =>
    preimage(document, reviewHashes[index] ?? ''));

export const GD10_12M_PLAY_V5_MEDIA_PREIMAGES =
  GD10_12M_PLAY_V5_PREIMAGES.media.map((document) => preimage(document, ''));

export const GD10_12M_PLAY_V5_REVERSE_PREIMAGES =
  GD10_12M_PLAY_V5_PREIMAGES.reverseDependencies.map((snapshot) => ({
    sourceId: snapshot.sourceId,
    count: snapshot.keys.length,
    keys: [...snapshot.keys].sort((left, right) => left.localeCompare(right)),
    canonicalSha256: snapshot.canonicalSha256,
  }));

export const GD10_12M_PLAY_V5_TARGET = {
  kind: 'guide',
  slug: 'gd_10_12m_play',
  contentId: GD10_12M_PLAY_V5_PREIMAGES.content._id,
  contentCreationTime: GD10_12M_PLAY_V5_PREIMAGES.content._creationTime,
  contentCreatedAt: GD10_12M_PLAY_V5_PREIMAGES.content.createdAt,
  contentInitialUpdatedAt: GD10_12M_PLAY_V5_PREIMAGES.content.updatedAt,
  contentInitialReviewRevision: 4,
  contentDesiredReviewRevision: 5,
  linkId: GD10_12M_PLAY_V5_PREIMAGES.link._id,
  linkCreationTime: GD10_12M_PLAY_V5_PREIMAGES.link._creationTime,
  linkCreatedAt: GD10_12M_PLAY_V5_PREIMAGES.link.createdAt,
  linkInitialUpdatedAt: GD10_12M_PLAY_V5_PREIMAGES.link.updatedAt,
} as const;

const desiredText = JSON.stringify(GD10_12M_PLAY_V5_DESIRED_CONTENT);
const forbiddenDesiredPhrases = [
  'loss of consciousness',
  'unusual drowsiness',
  'swallowed button battery or magnet',
  'Tie blind cords high',
  'aap-safe-sleep-2022',
];

if (GD10_12M_PLAY_V5_PREIMAGES.frozenFrom.deployment !== 'graceful-possum-566'
  || GD10_12M_PLAY_V5_PREIMAGES.frozenFrom.gitBase
    !== '4f43d354d414c33cb8b349b0da83d1dc225104f2'
  || GD10_12M_PLAY_V5_TARGET.contentInitialReviewRevision !== 4
  || GD10_12M_PLAY_V5_TARGET.contentDesiredReviewRevision !== 5
  || GD10_12M_PLAY_V5_PREIMAGES.content.clinicalStatus !== 'clinical_review'
  || JSON.stringify(GD10_12M_PLAY_V5_PREIMAGES.link.sourceIds)
    !== JSON.stringify(GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS)
  || GD10_12M_PLAY_V5_SOURCE_PREIMAGES.length !== 8
  || GD10_12M_PLAY_V5_REVIEW_PREIMAGES.length !== 5
  || GD10_12M_PLAY_V5_MEDIA_PREIMAGES.length !== 0
  || GD10_12M_PLAY_V5_PREIMAGES.ai.contentAudits.length !== 0
  || GD10_12M_PLAY_V5_PREIMAGES.ai.evidenceAudits.length !== 0
  || GD10_12M_PLAY_V5_PREIMAGES.ai.releases.length !== 0
  || GD10_12M_PLAY_V5_PREIMAGES.ai.runs.length !== 0
  || GD10_12M_PLAY_V5_PREIMAGES.releaseAudits.length !== 0
  || GD10_12M_PLAY_V5_REVERSE_PREIMAGES.length !== 8
  || GD10_12M_PLAY_V5_SOURCE_PREIMAGES.some((row) => !row.exactCanonicalSha256)
  || GD10_12M_PLAY_V5_REVIEW_PREIMAGES.some((row) => !row.exactCanonicalSha256)
  || desiredContent.type !== GD10_12M_PLAY_V5_TARGET.kind
  || forbiddenDesiredPhrases.some((phrase) => desiredText.includes(phrase))
  || !desiredText.includes('move climbable furniture away from windows')
  || !desiredText.includes('not emergency-treatment thresholds')) {
  throw new Error('gd_10_12m_play v5 CAS constants are invalid');
}
