import frozenDesired from './childDevelopmentRefreezeCorrectionDesired.json';
import exactPreimagesJson from './childDevelopmentRefreezeCorrectionPreimages.json';
import { v, type Infer } from 'convex/values';
import {
  CDC_TODDLERS_1_2_SOURCE_ID,
  CDC_TODDLERS_2_3_SOURCE_ID,
  CHILD_DEVELOPMENT_REFREEZE_SEMANTIC_SLUGS,
  CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS,
} from './childDevelopmentRefreezeCorrectionCopy';

export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID =
  '2026-08-31-child-development-14-refreeze-correction-v1' as const;
export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_ACTION =
  'release.child_development_14_refreeze_correction' as const;
export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_FIXTURE_SHA256 =
  '320e0e021d0aca7f818b3507506952056f787c26a13e15c532997e760c3f4eca' as const;
export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED_SHA256 =
  '450a0d149250cc735a0119fd8da7895e020ca07f1c03931f944660cd5eb34ea3' as const;
export const CHILD_DEVELOPMENT_REFREEZE_PREDECESSOR_BATCH_ID =
  'clinical-child-development-governed-14-2026-08-29-v1' as const;
export const CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST =
  '2da5ddfecc5e2815c132f5520cf27df27ea76bfdc151e64c6f489c9e384f803f' as const;
export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_EXPIRES_AT =
  1789387200000 as const; // 2026-09-14T12:00:00.000Z

export const CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS = [
  'child_development',
  'english',
  'native_myanmar',
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

type DesiredLink = {
  kind: string;
  slug: string;
  sourceIds: string[];
};

type TargetPreimage = {
  kind: string;
  slug: string;
  desiredReviewRevision: number;
  desiredAuthoredCanonicalSha256: string;
  desiredSearchTextCanonicalSha256: string;
  desiredLinkSourceIdsCanonicalSha256: string;
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
    childDevelopmentHistoryCanonicalSha256: string;
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
  sourceApproval: {
    source: SourceDocument & {
      reviewer?: string;
      reviewerQualification?: string;
      reviewerId?: string;
      reviewScope?: string;
      reviewDate?: string | null;
      reviewNote?: string;
    };
    audit: ExactDocument;
    reviewerProfile: ExactDocument;
  };
  releaseAudits: ExactDocument[];
};

type FrozenDesired = {
  content: DesiredContent[];
  links: DesiredLink[];
};

export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES =
  exactPreimagesJson as ExactPreimages;
export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED =
  frozenDesired as FrozenDesired;

const desiredContentBySlug = new Map(
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED.content.map((row) => [row.slug, row]),
);
const desiredLinkByKey = new Map(
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED.links.map((row) => [
    `${row.kind}:${row.slug}`,
    row,
  ]),
);

export type ChildDevelopmentRefreezeCorrectionTarget = TargetPreimage & {
  desiredContent: DesiredContent;
  desiredLink: DesiredLink;
};

export const CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS =
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.targets.map((target) => {
    const desiredContent = desiredContentBySlug.get(target.slug);
    const desiredLink = desiredLinkByKey.get(`${target.kind}:${target.slug}`);
    if (!desiredContent || !desiredLink) {
      throw new Error(`Missing child-development correction desired row: ${target.kind}:${target.slug}`);
    }
    return { ...target, desiredContent, desiredLink };
  }) as readonly ChildDevelopmentRefreezeCorrectionTarget[];

export const childDevelopmentRefreezeCorrectionPreflightValidator = v.object({
  releaseId: v.literal(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  checkedAt: v.number(),
  blockers: v.array(v.string()),
  fixtureExact: v.boolean(),
  desiredFixtureExact: v.boolean(),
  registryExact: v.boolean(),
  decisionSetExact: v.boolean(),
  sourceApprovalExact: v.boolean(),
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
    linkInitialExact: v.boolean(),
    linkDesiredExact: v.boolean(),
    sourcesExact: v.boolean(),
    citationsEligible: v.boolean(),
    mediaExact: v.boolean(),
    reviewsExact: v.boolean(),
    aiExact: v.boolean(),
    desiredRevisionApprovals: v.number(),
    outstandingRequiredReviews: v.array(v.string()),
  })),
});

export type ChildDevelopmentRefreezeCorrectionPreflight =
  Infer<typeof childDevelopmentRefreezeCorrectionPreflightValidator>;

const semanticSlugs = new Set<string>(CHILD_DEVELOPMENT_REFREEZE_SEMANTIC_SLUGS);
const sourceTransitionSlugs = new Set<string>(
  CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS,
);
const sourceApproval = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.sourceApproval;

if (CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.frozenFrom.deployment
    !== 'graceful-possum-566'
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.frozenFrom.gitBase
    !== '39c41e2524703020203097d6b4b794e219e198c7'
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.releaseAction
    !== CHILD_DEVELOPMENT_REFREEZE_CORRECTION_ACTION
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.decisionSetDigest
    !== CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED.content.length !== 14
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED.links.length !== 14
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.length !== 14
  || new Set(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.map((target) => target.slug)).size !== 14
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.some((target) => (
    target.desiredContent.slug !== target.slug
    || target.desiredContent.type !== target.kind
    || target.desiredLink.slug !== target.slug
    || target.desiredLink.kind !== target.kind
    || target.desiredReviewRevision !== target.content.reviewRevision + 1
  ))
  || semanticSlugs.size !== 4
  || sourceTransitionSlugs.size !== 2
  || CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.some((target) => (
    sourceTransitionSlugs.has(target.slug)
      ? !target.link.sourceIds.includes(CDC_TODDLERS_1_2_SOURCE_ID)
        || target.link.sourceIds.includes(CDC_TODDLERS_2_3_SOURCE_ID)
        || target.desiredLink.sourceIds.includes(CDC_TODDLERS_1_2_SOURCE_ID)
        || !target.desiredLink.sourceIds.includes(CDC_TODDLERS_2_3_SOURCE_ID)
      : target.link.sourceIds.join('\u0000') !== target.desiredLink.sourceIds.join('\u0000')
  ))
  || sourceApproval.source.sourceId !== CDC_TODDLERS_2_3_SOURCE_ID
  || sourceApproval.source.reviewStatus !== 'approved'
  || sourceApproval.source.reviewer !== 'Phyo Ko Ko'
  || sourceApproval.source.reviewerQualification !== 'MBBS'
  || sourceApproval.source.reviewScope !== 'education'
  || sourceApproval.source.reviewDate !== '2026-08-31'
  || sourceApproval.source.reviewNote !== undefined
  || sourceApproval.audit.action !== 'evidence.setReview'
  || sourceApproval.audit.entityTable !== 'evidenceSources'
  || sourceApproval.audit.entityId !== CDC_TODDLERS_2_3_SOURCE_ID
  || sourceApproval.audit.result !== 'ok'
  || sourceApproval.audit.before !== 'awaiting_review / no reviewer / no date'
  || sourceApproval.audit.after !== 'approved / Phyo Ko Ko (MBBS) / 2026-08-31'
  || sourceApproval.audit.summary !== 'awaiting_review → approved by Phyo Ko Ko (MBBS)'
  || String(sourceApproval.audit.actorId) !== String(sourceApproval.source.reviewerId)
  || sourceApproval.reviewerProfile.isStaff !== true
  || sourceApproval.reviewerProfile.staffRole !== 'clinical_reviewer'
  || sourceApproval.reviewerProfile.displayName !== 'Phyo Ko Ko'
  || sourceApproval.reviewerProfile.staffQualification !== 'MBBS'
  || String(sourceApproval.reviewerProfile.userId)
    !== String(sourceApproval.source.reviewerId)) {
  throw new Error('Child-development refreeze correction constants are invalid');
}
