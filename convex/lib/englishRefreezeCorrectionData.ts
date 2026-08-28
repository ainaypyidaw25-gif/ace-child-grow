import seedData from '../seedData.json';
import exactPreimagesJson from './englishRefreezeCorrectionPreimages.json';
import { v, type Infer } from 'convex/values';

export const ENGLISH_REFREEZE_CORRECTION_RELEASE_ID =
  '2026-08-27-english-14-refreeze-correction-v1' as const;
export const ENGLISH_REFREEZE_CORRECTION_ACTION =
  'release.english_14_refreeze_correction' as const;
export const ENGLISH_REFREEZE_CORRECTION_FIXTURE_SHA256 =
  '7dbf1e8fb5a13251ee2f7e25601849f7f92b4ee42aa558265eb3ac901648dbf0' as const;
export const ENGLISH_REFREEZE_PREDECESSOR_BATCH_ID =
  'clinical-english-governed-14-2026-08-27-v1' as const;
export const ENGLISH_REFREEZE_DECISION_SET_DIGEST =
  'e53afb11c4b507c9d621ab75905daec7825685a49d59ce763ef417c116275e0d' as const;
export const ENGLISH_REFREEZE_CORRECTION_EXPIRES_AT =
  1788436800000 as const; // 2026-09-03T12:00:00.000Z

export const ENGLISH_REFREEZE_REQUIRED_REVIEWS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

type ExactDocument = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
};

type ContentDocument = ExactDocument & {
  type: string;
  slug: string;
  reviewRevision: number;
  clinicalStatus: string;
  updatedAt: number;
};

type LinkDocument = ExactDocument & {
  kind: string;
  slug: string;
  sourceIds: string[];
  updatedAt: number;
};

type SourceDocument = ExactDocument & {
  sourceId: string;
  reviewStatus: string;
  updatedAt: number;
};

type TargetPreimage = {
  kind: string;
  slug: string;
  desiredReviewRevision: number;
  desiredAuthoredCanonicalSha256: string;
  desiredSearchTextCanonicalSha256: string;
  content: ContentDocument;
  link: LinkDocument;
  sources: SourceDocument[];
  media: ExactDocument[];
  reviews: ExactDocument[];
  ai: {
    contentAudits: ExactDocument[];
    evidenceAudits: ExactDocument[];
    releases: ExactDocument[];
    runs: ExactDocument[];
  };
  history: {
    allReviewHistoryCanonicalSha256: string;
    allNonclinicalHistoryCanonicalSha256: string;
    englishHistoryCanonicalSha256: string;
    currentClinicalReviewsCanonicalSha256: string;
    allClinicalReviewHistoryCanonicalSha256: string;
  };
};

type ExactPreimages = {
  frozenFrom: {
    deployment: string;
    checkedAt: string;
    gitBase: string;
  };
  releaseAction: string;
  decisionSetDigest: string;
  targets: TargetPreimage[];
  registry: {
    batches: ExactDocument[];
    assignments: ExactDocument[];
    receipts: ExactDocument[];
  };
  releaseAudits: ExactDocument[];
};

type DesiredContent = {
  type: string;
  slug: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  tags: string[];
  difficulty?: string;
  durationMinutes?: number;
  offline?: boolean;
  data: unknown;
  source: string;
  version: number;
  searchText: string;
};

export const ENGLISH_REFREEZE_CORRECTION_PREIMAGES =
  exactPreimagesJson as ExactPreimages;

const desiredBySlug = new Map(
  (seedData as unknown as DesiredContent[]).map((row) => [row.slug, row]),
);

export type EnglishRefreezeCorrectionTarget = TargetPreimage & {
  desiredContent: DesiredContent;
};

export const ENGLISH_REFREEZE_CORRECTION_TARGETS =
  ENGLISH_REFREEZE_CORRECTION_PREIMAGES.targets.map((target) => {
    const desiredContent = desiredBySlug.get(target.slug);
    if (!desiredContent) throw new Error(`Missing English refreeze desired content: ${target.slug}`);
    return { ...target, desiredContent };
  }) as readonly EnglishRefreezeCorrectionTarget[];

export const ENGLISH_REFREEZE_CONFIRMED_COPY = {
  titleMm: '၅–၆ လ — အာဟာရ (ဖြည့်စွက်စာ စတင်ခြင်း)',
  whyMm:
    '၆ လခန့်တွင် ဖြည့်စွက်စာ စတင်ကျွေးခြင်းသည် ကြီးထွားမှုနှင့် အရသာ သင်ယူမှုအတွက် အရေးကြီးသည်။',
} as const;

export const englishRefreezeCorrectionPreflightValidator = v.object({
  releaseId: v.literal(ENGLISH_REFREEZE_CORRECTION_RELEASE_ID),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  checkedAt: v.number(),
  blockers: v.array(v.string()),
  fixtureExact: v.boolean(),
  registryExact: v.boolean(),
  decisionSetExact: v.boolean(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  targets: v.array(v.object({
    kind: v.string(),
    slug: v.string(),
    contentRows: v.number(),
    reviewRevision: v.union(v.number(), v.null()),
    contentInitialExact: v.boolean(),
    contentDesiredExact: v.boolean(),
    desiredTemplateExact: v.boolean(),
    linkExact: v.boolean(),
    sourcesExact: v.boolean(),
    citationsEligible: v.boolean(),
    mediaExact: v.boolean(),
    reviewsExact: v.boolean(),
    aiExact: v.boolean(),
    desiredRevisionApprovals: v.number(),
    outstandingRequiredReviews: v.array(v.string()),
  })),
});

export type EnglishRefreezeCorrectionPreflight =
  Infer<typeof englishRefreezeCorrectionPreflightValidator>;

const nutrition = ENGLISH_REFREEZE_CORRECTION_TARGETS.find(
  (target) => target.slug === 'gd_5_6m_nutrition',
);
const nutritionData = nutrition?.desiredContent.data as {
  title?: { mm?: string };
  why?: { mm?: string };
} | undefined;

if (ENGLISH_REFREEZE_CORRECTION_PREIMAGES.frozenFrom.deployment
    !== 'graceful-possum-566'
  || ENGLISH_REFREEZE_CORRECTION_PREIMAGES.frozenFrom.gitBase
    !== '530fee3b57448cd66068e72184c034fae9b70ca8'
  || ENGLISH_REFREEZE_CORRECTION_PREIMAGES.releaseAction
    !== ENGLISH_REFREEZE_CORRECTION_ACTION
  || ENGLISH_REFREEZE_CORRECTION_PREIMAGES.decisionSetDigest
    !== ENGLISH_REFREEZE_DECISION_SET_DIGEST
  || ENGLISH_REFREEZE_CORRECTION_TARGETS.length !== 14
  || new Set(ENGLISH_REFREEZE_CORRECTION_TARGETS.map((target) => target.slug)).size !== 14
  || ENGLISH_REFREEZE_CORRECTION_TARGETS.some((target) => (
    target.desiredContent.slug !== target.slug
    || target.desiredContent.type !== target.kind
    || target.desiredReviewRevision !== target.content.reviewRevision + 1
  ))
  || nutrition?.desiredContent.titleMm !== ENGLISH_REFREEZE_CONFIRMED_COPY.titleMm
  || nutrition?.desiredContent.summaryMm !== ENGLISH_REFREEZE_CONFIRMED_COPY.whyMm
  || nutritionData?.title?.mm !== ENGLISH_REFREEZE_CONFIRMED_COPY.titleMm
  || nutritionData?.why?.mm !== ENGLISH_REFREEZE_CONFIRMED_COPY.whyMm) {
  throw new Error('English refreeze correction constants are invalid');
}
