import frozenDesiredContent from './nativeMyanmarRefreezeCorrectionDesired.json';
import exactPreimagesJson from './nativeMyanmarRefreezeCorrectionPreimages.json';
import { v, type Infer } from 'convex/values';

export const NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID =
  '2026-08-26-native-myanmar-14-refreeze-correction-v1' as const;
export const NATIVE_MYANMAR_REFREEZE_CORRECTION_ACTION =
  'release.native_myanmar_14_refreeze_correction' as const;
export const NATIVE_MYANMAR_REFREEZE_CORRECTION_FIXTURE_SHA256 =
  '54ee6680052081c3632c8b07e349cc543729d5b34cc16817498510f2799d446b' as const;
export const NATIVE_MYANMAR_REFREEZE_PREDECESSOR_BATCH_ID =
  'clinical-native-myanmar-governed-14-2026-08-26-v1' as const;
export const NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST =
  '1ba0b69abc01cc63fa47cff67f2e6495a606531bef98d3d6073bdeb9e65af08e' as const;
export const NATIVE_MYANMAR_REFREEZE_CORRECTION_EXPIRES_AT =
  1788177600000 as const; // 2026-08-31T12:00:00.000Z

export const NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS = [
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
    nativeMyanmarHistoryCanonicalSha256: string;
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

export const NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES =
  exactPreimagesJson as ExactPreimages;

const desiredBySlug = new Map(
  (frozenDesiredContent as unknown as DesiredContent[]).map((row) => [row.slug, row]),
);

export type NativeMyanmarRefreezeCorrectionTarget = TargetPreimage & {
  desiredContent: DesiredContent;
};

export const NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS =
  NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES.targets.map((target) => {
    const desiredContent = desiredBySlug.get(target.slug);
    if (!desiredContent) throw new Error(`Missing native refreeze desired content: ${target.slug}`);
    return { ...target, desiredContent };
  }) as readonly NativeMyanmarRefreezeCorrectionTarget[];

export const NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY = {
  safetyMm:
    'ပက်လက်လှန် အိပ်ပါ။',
  observationQuestionMm:
    'ပက်လက်လှန်၍ အိပ်ပါသလား။',
  encouragementMm:
    'အိပ်ချိန်ပုံစံသည် တဖြည်းဖြည်း တည်ငြိမ်လာမည် — သည်းခံပါ။',
} as const;

export const nativeMyanmarRefreezeCorrectionPreflightValidator = v.object({
  releaseId: v.literal(NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID),
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

export type NativeMyanmarRefreezeCorrectionPreflight =
  Infer<typeof nativeMyanmarRefreezeCorrectionPreflightValidator>;

const sleep = NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.find(
  (target) => target.slug === 'gd_birth_2m_sleep',
);
const sleepData = sleep?.desiredContent.data as {
  safety?: { mm?: string };
  observationQuestions?: Array<{ mm?: string }>;
  encouragement?: { mm?: string };
} | undefined;

if (NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES.frozenFrom.deployment
    !== 'graceful-possum-566'
  || NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES.frozenFrom.gitBase
    !== 'b69a973b996c72b91032ef988625c3170bdc895a'
  || NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES.releaseAction
    !== NATIVE_MYANMAR_REFREEZE_CORRECTION_ACTION
  || NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES.decisionSetDigest
    !== NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST
  || NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.length !== 14
  || new Set(NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.map((target) => target.slug)).size !== 14
  || NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.some((target) => (
    target.desiredContent.slug !== target.slug
    || target.desiredContent.type !== target.kind
    || target.desiredReviewRevision !== target.content.reviewRevision + 1
  ))
  || !sleepData?.safety?.mm?.startsWith(NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.safetyMm)
  || sleepData.observationQuestions?.[1]?.mm
    !== NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.observationQuestionMm
  || sleepData.encouragement?.mm !== NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.encouragementMm) {
  throw new Error('Native-Myanmar refreeze correction constants are invalid');
}
