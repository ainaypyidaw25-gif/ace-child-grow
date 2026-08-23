import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { canonicalJson, sha256Canonical } from './lib/aiAuditHash';
import { todayIsoUtc } from './lib/evidenceFreshness';
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsEligible,
} from './lib/evidencePublicationGate';
import {
  CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
  CLINICAL_TWO_SMALL_REQUIRED_REVIEWS,
  CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES,
  CLINICAL_TWO_SMALL_SOURCE_PREIMAGES,
  CLINICAL_TWO_SMALL_TARGETS,
  type ClinicalTwoSmallDesiredContent,
  type ClinicalTwoSmallExactPreimage,
  type ClinicalTwoSmallTarget,
} from './lib/clinicalTwoSmallCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const releaseAction = 'release.clinical_two_small_corrections';
const allLinkLimit = 1_001;

const phaseValidator = v.union(
  v.literal('ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const sourceStateValidator = v.object({
  sourceId: v.string(),
  rows: v.number(),
  rowId: v.union(v.string(), v.null()),
  exact: v.boolean(),
  eligible: v.boolean(),
  authoritative: v.boolean(),
  ageCompatible: v.boolean(),
  reviewStatus: v.union(v.string(), v.null()),
  evidenceLevel: v.union(v.string(), v.null()),
  reviewDate: v.union(v.string(), v.null()),
  nextReviewDate: v.union(v.string(), v.null()),
  verifiedOn: v.union(v.string(), v.null()),
});

const targetStateValidator = v.object({
  kind: v.string(),
  slug: v.string(),
  contentRows: v.number(),
  contentRowId: v.union(v.string(), v.null()),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  contentUpdatedAt: v.union(v.number(), v.null()),
  contentInitialMatches: v.boolean(),
  desiredTemplateExact: v.boolean(),
  contentDesiredMatches: v.boolean(),
  linkRows: v.number(),
  linkRowId: v.union(v.string(), v.null()),
  sourceIds: v.array(v.string()),
  linkUpdatedAt: v.union(v.number(), v.null()),
  linkInitialMatches: v.boolean(),
  linkDesiredMatches: v.boolean(),
  citationEligible: v.boolean(),
  eligibleDesiredSourceIds: v.array(v.string()),
  mediaRows: v.number(),
  mediaExact: v.boolean(),
  reviewRows: v.number(),
  reviewsExact: v.boolean(),
  desiredRevisionApprovals: v.number(),
  outstandingRequiredReviews: v.array(v.string()),
  aiContentAuditRows: v.number(),
  aiReleaseRows: v.number(),
});

const reverseStateValidator = v.object({
  sourceId: v.string(),
  rows: v.number(),
  canonicalSha256: v.string(),
  initialMatches: v.boolean(),
  desiredMatches: v.boolean(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(CLINICAL_TWO_SMALL_CAS_RELEASE_ID),
  phase: phaseValidator,
  todayIso: v.string(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  blockers: v.array(v.string()),
  allLinksRows: v.number(),
  allLinksBounded: v.boolean(),
  targets: v.array(targetStateValidator),
  sources: v.array(sourceStateValidator),
  reverseDependencies: v.array(reverseStateValidator),
  aiEvidenceAuditRows: v.number(),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sortById<T extends { _id: unknown }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

async function rowMatches(
  row: { _id: unknown; _creationTime: number },
  expected: ClinicalTwoSmallExactPreimage,
): Promise<boolean> {
  return String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && await sha256Canonical(row) === expected.exactCanonicalSha256;
}

async function rowsMatch(
  rows: Array<{ _id: unknown; _creationTime: number }>,
  expectedRows: readonly ClinicalTwoSmallExactPreimage[],
): Promise<boolean> {
  if (rows.length !== expectedRows.length) return false;
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  for (const expected of expectedRows) {
    const row = byId.get(expected.rowId);
    if (!row || !await rowMatches(row, expected)) return false;
  }
  return true;
}

function authoredSnapshot(row: Partial<ClinicalTwoSmallDesiredContent>): Record<string, unknown> {
  return {
    type: row.type,
    slug: row.slug,
    ageGroupKey: row.ageGroupKey,
    domainKey: row.domainKey,
    category: row.category,
    titleMm: row.titleMm,
    titleEn: row.titleEn,
    summaryMm: row.summaryMm,
    summaryEn: row.summaryEn,
    tags: row.tags,
    difficulty: row.difficulty,
    durationMinutes: row.durationMinutes,
    offline: row.offline,
    data: row.data,
    source: row.source,
    version: row.version,
  };
}

function desiredContentMatches(
  row: Doc<'libraryContent'>,
  target: ClinicalTwoSmallTarget,
): boolean {
  const desired = target.desiredContent;
  return canonicalJson(authoredSnapshot(row)) === canonicalJson(authoredSnapshot(desired))
    && row.searchText === desired.searchText
    && sameStrings(
      row.requiredReviewDimensions ?? [],
      CLINICAL_TWO_SMALL_REQUIRED_REVIEWS,
    );
}

function contentIdentityMatches(
  row: Doc<'libraryContent'>,
  target: ClinicalTwoSmallTarget,
): boolean {
  return String(row._id) === target.contentId
    && row._creationTime === target.contentCreationTime
    && row.type === target.kind
    && row.slug === target.slug;
}

function linkIdentityMatches(
  row: Doc<'evidenceLinks'>,
  target: ClinicalTwoSmallTarget,
): boolean {
  return String(row._id) === target.linkId
    && row._creationTime === target.linkCreationTime
    && row.createdAt === target.linkCreatedAt
    && row.kind === target.kind
    && row.slug === target.slug;
}

type AuditedPostimage = {
  slug: string;
  contentCanonicalSha256: string;
  linkCanonicalSha256: string;
};

type AuditedReversePostimage = {
  sourceId: string;
  rows: number;
  canonicalSha256: string;
};

function auditBeforeJson(): string {
  return JSON.stringify({
    targets: CLINICAL_TWO_SMALL_TARGETS.map((target) => ({
      kind: target.kind,
      slug: target.slug,
      content: {
        rowId: target.contentId,
        canonicalSha256: target.contentInitialCanonicalSha256,
        authoredCanonicalSha256: target.contentInitialAuthoredSha256,
        reviewRevision: target.contentInitialReviewRevision,
        updatedAt: target.contentInitialUpdatedAt,
      },
      link: {
        rowId: target.linkId,
        canonicalSha256: target.linkInitialCanonicalSha256,
        sourceIds: target.initialSourceIds,
        updatedAt: target.linkInitialUpdatedAt,
      },
      media: target.mediaPreimages,
      reviews: target.reviewPreimages,
    })),
    sources: CLINICAL_TWO_SMALL_SOURCE_PREIMAGES,
    reverseDependencies: CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES.map((row) => ({
      sourceId: row.sourceId,
      rows: row.initialCount,
      canonicalSha256: row.initialCanonicalSha256,
    })),
    ai: {
      contentAudits: 0,
      evidenceAudits: 0,
      releases: 0,
      runs: 0,
    },
  });
}

function auditAfterJson(
  updatedAt: number,
  postimages: readonly AuditedPostimage[],
  reversePostimages: readonly AuditedReversePostimage[],
): string {
  return JSON.stringify({
    updatedAt,
    targets: CLINICAL_TWO_SMALL_TARGETS.map((target) => {
      const postimage = postimages.find((candidate) => candidate.slug === target.slug);
      if (!postimage) throw new Error(`Missing audited postimage: ${target.slug}`);
      const linkChanged = !sameStrings(target.initialSourceIds, target.desiredSourceIds);
      return {
        kind: target.kind,
        slug: target.slug,
        content: {
          rowId: target.contentId,
          canonicalSha256: postimage.contentCanonicalSha256,
          authoredCanonicalSha256: target.desiredAuthoredSha256,
          searchTextCanonicalSha256: target.desiredSearchTextSha256,
          clinicalStatus: 'clinical_review',
          reviewRevision: target.contentDesiredReviewRevision,
          updatedAt,
        },
        link: {
          rowId: target.linkId,
          canonicalSha256: postimage.linkCanonicalSha256,
          sourceIds: target.desiredSourceIds,
          updatedAt: linkChanged ? updatedAt : target.linkInitialUpdatedAt,
          changed: linkChanged,
        },
      };
    }),
    sourcesPreserved: CLINICAL_TWO_SMALL_SOURCE_PREIMAGES,
    mediaAndReviewHistoryPreserved: true,
    reverseDependencies: CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES.map((row) => {
      const postimage = reversePostimages.find((candidate) => candidate.sourceId === row.sourceId);
      if (!postimage) throw new Error(`Missing audited reverse postimage: ${row.sourceId}`);
      return postimage;
    }),
    desiredRevisionApprovals: 0,
    outstandingRequiredReviews: CLINICAL_TWO_SMALL_REQUIRED_REVIEWS,
    publicationDecision: 'not_made',
    aiStatePreserved: true,
    citationEligible: true,
  });
}

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  postimages: AuditedPostimage[];
  reversePostimages: AuditedReversePostimage[];
};

async function releaseAuditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction))
    .take(2);
  if (rows.length !== 1) {
    return {
      rows: rows.length,
      exact: false,
      updatedAt: null,
      postimages: [],
      reversePostimages: [],
    };
  }

  const row = rows[0];
  let updatedAt: number | null = null;
  let postimages: AuditedPostimage[] = [];
  let reversePostimages: AuditedReversePostimage[] = [];
  try {
    const detail = JSON.parse(row.after ?? '{}') as {
      updatedAt?: unknown;
      targets?: Array<{
        slug?: unknown;
        content?: { canonicalSha256?: unknown };
        link?: { canonicalSha256?: unknown };
      }>;
      reverseDependencies?: Array<{
        sourceId?: unknown;
        rows?: unknown;
        canonicalSha256?: unknown;
      }>;
    };
    if (typeof detail.updatedAt === 'number' && Array.isArray(detail.targets)) {
      updatedAt = detail.updatedAt;
      postimages = detail.targets.flatMap((target) => (
        typeof target.slug === 'string'
        && typeof target.content?.canonicalSha256 === 'string'
        && typeof target.link?.canonicalSha256 === 'string'
          ? [{
            slug: target.slug,
            contentCanonicalSha256: target.content.canonicalSha256,
            linkCanonicalSha256: target.link.canonicalSha256,
          }]
          : []
      ));
      reversePostimages = (detail.reverseDependencies ?? []).flatMap((reverse) => (
        typeof reverse.sourceId === 'string'
        && typeof reverse.rows === 'number'
        && typeof reverse.canonicalSha256 === 'string'
          ? [{
            sourceId: reverse.sourceId,
            rows: reverse.rows,
            canonicalSha256: reverse.canonicalSha256,
          }]
          : []
      ));
    }
  } catch {
    updatedAt = null;
    postimages = [];
    reversePostimages = [];
  }
  const exact = updatedAt !== null
    && postimages.length === CLINICAL_TWO_SMALL_TARGETS.length
    && new Set(postimages.map((postimage) => postimage.slug)).size === postimages.length
    && reversePostimages.length === CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES.length
    && new Set(reversePostimages.map((postimage) => postimage.sourceId)).size
      === reversePostimages.length
    && row.actorId === undefined
    && row.entityTable === 'libraryContent,evidenceLinks'
    && row.entityId === undefined
    && row.summary === CLINICAL_TWO_SMALL_CAS_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, postimages, reversePostimages);
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    postimages: exact ? postimages : [],
    reversePostimages: exact ? reversePostimages : [],
  };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const todayIso = todayIsoUtc(new Date(now));
  const audit = await releaseAuditState(ctx);
  const allLinks = await ctx.db.query('evidenceLinks').take(allLinkLimit);
  const allLinksBounded = allLinks.length < allLinkLimit;

  const sourceResults = await Promise.all(CLINICAL_TWO_SMALL_SOURCE_PREIMAGES.map(
    async (expected) => {
      const [rows, evidenceAudits] = await Promise.all([
        ctx.db.query('evidenceSources')
          .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId)).take(2),
        ctx.db.query('aiEvidenceAudits')
          .withIndex('by_source_and_updated_at', (q) => q.eq('sourceId', expected.sourceId)).take(1),
      ]);
      const row = rows.length === 1 ? rows[0] : null;
      const exact = Boolean(row && await rowMatches(row, expected));
      const eligible = Boolean(row
        && row.reviewStatus === 'approved'
        && publicationEvidenceIsEligible(row, todayIso));
      const authoritative = row?.evidenceLevel === 'guideline';
      const ageCompatible = Boolean(row
        && (row.ageMonthsMin === null || row.ageMonthsMin <= 3)
        && (row.ageMonthsMax === null || row.ageMonthsMax >= 4));
      return {
        expected,
        row,
        evidenceAuditRows: evidenceAudits.length,
        public: {
          sourceId: expected.sourceId,
          rows: rows.length,
          rowId: row ? String(row._id) : null,
          exact,
          eligible,
          authoritative,
          ageCompatible,
          reviewStatus: row?.reviewStatus ?? null,
          evidenceLevel: row?.evidenceLevel ?? null,
          reviewDate: row?.reviewDate ?? null,
          nextReviewDate: row?.nextReviewDate ?? null,
          verifiedOn: row?.verifiedOn ?? null,
        },
      };
    },
  ));
  const sourcesById = new Map(sourceResults.flatMap((result) => result.row
    ? [[result.row.sourceId, result.row] as const]
    : []));

  const reverseResults = await Promise.all(CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES.map(
    async (expected) => {
      const rows = sortById(allLinks.filter((link) => link.sourceIds.includes(expected.sourceId)));
      const canonicalSha256 = await sha256Canonical(rows);
      const audited = audit.reversePostimages
        .find((candidate) => candidate.sourceId === expected.sourceId);
      const fixedDesiredHashMatches = expected.desiredCanonicalSha256 === null
        || canonicalSha256 === expected.desiredCanonicalSha256;
      return {
        sourceId: expected.sourceId,
        rows: rows.length,
        canonicalSha256,
        initialMatches: rows.length === expected.initialCount
          && canonicalSha256 === expected.initialCanonicalSha256,
        desiredMatches: Boolean(audited
          && rows.length === expected.desiredCount
          && audited.rows === expected.desiredCount
          && canonicalSha256 === audited.canonicalSha256
          && fixedDesiredHashMatches),
      };
    },
  ));

  const inspectedTargets = await Promise.all(CLINICAL_TWO_SMALL_TARGETS.map(async (target) => {
    const [contentRows, linkRows, mediaRows, reviewRows, aiContentAudits, aiReleases] =
      await Promise.all([
        ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).take(2),
        ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
          .eq('kind', target.kind).eq('slug', target.slug)).take(2),
        ctx.db.query('libraryMedia').withIndex('by_content', (q) => q
          .eq('contentSlug', target.slug)).take(target.mediaPreimages.length + 1),
        ctx.db.query('contentReviews').withIndex('by_content', (q) => q
          .eq('contentSlug', target.slug)).take(target.reviewPreimages.length + 1),
        ctx.db.query('aiContentAudits')
          .withIndex('by_content_revision_and_updated_at', (q) => q.eq('contentSlug', target.slug))
          .take(1),
        ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
          .eq('targetKey', `${target.kind}:${target.slug}`)).take(1),
      ]);
    const content = contentRows.length === 1 ? contentRows[0] : null;
    const link = linkRows.length === 1 ? linkRows[0] : null;
    const postimage = audit.postimages.find((candidate) => candidate.slug === target.slug);
    const [contentHash, linkHash, initialAuthoredHash, desiredAuthoredHash, desiredSearchTextHash] =
      await Promise.all([
        content ? sha256Canonical(content) : null,
        link ? sha256Canonical(link) : null,
        content ? sha256Canonical(authoredSnapshot(content)) : null,
        sha256Canonical(authoredSnapshot(target.desiredContent)),
        sha256Canonical(target.desiredContent.searchText),
      ]);
    const desiredSourceRows = target.desiredSourceIds.flatMap((sourceId) => {
      const row = sourcesById.get(sourceId);
      return row ? [row] : [];
    });
    const eligibleDesiredSourceIds = target.desiredSourceIds.filter((sourceId) => {
      const row = sourcesById.get(sourceId);
      return Boolean(row
        && row.reviewStatus === 'approved'
        && (row.ageMonthsMin === null || row.ageMonthsMin <= 3)
        && (row.ageMonthsMax === null || row.ageMonthsMax >= 4)
        && publicationEvidenceIsEligible(row, todayIso));
    });
    const hasAuthoritativeDesiredSource = target.desiredSourceIds.some((sourceId) => (
      sourcesById.get(sourceId)?.evidenceLevel === 'guideline'
    ));
    const citationEligible = evaluatePublicationEvidence(
      target.desiredSourceIds,
      desiredSourceRows,
      todayIso,
    ).allowed
      && sameStrings(eligibleDesiredSourceIds, target.desiredSourceIds)
      && hasAuthoritativeDesiredSource;
    const linkChanges = !sameStrings(target.initialSourceIds, target.desiredSourceIds);
    const expectedDesiredLinkUpdatedAt = linkChanges ? audit.updatedAt : target.linkInitialUpdatedAt;
    const contentInitialMatches = Boolean(content
      && contentIdentityMatches(content, target)
      && contentHash === target.contentInitialCanonicalSha256
      && initialAuthoredHash === target.contentInitialAuthoredSha256
      && content.clinicalStatus === 'clinical_review'
      && content.reviewRevision === target.contentInitialReviewRevision
      && content.updatedAt === target.contentInitialUpdatedAt);
    const desiredTemplateExact = desiredAuthoredHash === target.desiredAuthoredSha256
      && desiredSearchTextHash === target.desiredSearchTextSha256;
    const contentDesiredMatches = Boolean(content
      && postimage
      && audit.updatedAt !== null
      && contentIdentityMatches(content, target)
      && desiredContentMatches(content, target)
      && desiredTemplateExact
      && contentHash === postimage.contentCanonicalSha256
      && content.clinicalStatus === 'clinical_review'
      && content.reviewRevision === target.contentDesiredReviewRevision
      && content.updatedAt === audit.updatedAt
      && content.reviewerId === undefined
      && content.reviewerQualification === undefined
      && content.reviewerDisplayName === undefined
      && content.reviewScope === undefined
      && content.reviewedAt === undefined
      && content.nextReviewAt === undefined
      && content.reviewNote === undefined
      && content.aiPublicationReleaseId === undefined
      && content.aiPublishedAt === undefined);
    const linkInitialMatches = Boolean(link
      && linkIdentityMatches(link, target)
      && linkHash === target.linkInitialCanonicalSha256
      && link.updatedAt === target.linkInitialUpdatedAt
      && sameStrings(link.sourceIds, target.initialSourceIds));
    const linkDesiredMatches = Boolean(link
      && postimage
      && expectedDesiredLinkUpdatedAt !== null
      && linkIdentityMatches(link, target)
      && linkHash === postimage.linkCanonicalSha256
      && link.updatedAt === expectedDesiredLinkUpdatedAt
      && sameStrings(link.sourceIds, target.desiredSourceIds));
    const mediaExact = await rowsMatch(mediaRows, target.mediaPreimages);
    const reviewsExact = await rowsMatch(reviewRows, target.reviewPreimages);
    const desiredRevisionApprovals = reviewRows.filter((review) => (
      (review.reviewRevision === target.contentDesiredReviewRevision
        || review.contentVersion === target.contentDesiredReviewRevision)
      && review.decision === 'approved'
    )).length;
    const approvedDimensions = new Set(reviewRows.flatMap((review) => (
      (review.reviewRevision === target.contentDesiredReviewRevision
        || review.contentVersion === target.contentDesiredReviewRevision)
      && review.decision === 'approved'
      && typeof review.dimension === 'string'
        ? [review.dimension]
        : []
    )));
    const outstandingRequiredReviews = CLINICAL_TWO_SMALL_REQUIRED_REVIEWS
      .filter((dimension) => !approvedDimensions.has(dimension));
    return {
      target,
      public: {
        kind: target.kind,
        slug: target.slug,
        contentRows: contentRows.length,
        contentRowId: content ? String(content._id) : null,
        clinicalStatus: content?.clinicalStatus ?? null,
        reviewRevision: content?.reviewRevision ?? null,
        contentUpdatedAt: content?.updatedAt ?? null,
        contentInitialMatches,
        desiredTemplateExact,
        contentDesiredMatches,
        linkRows: linkRows.length,
        linkRowId: link ? String(link._id) : null,
        sourceIds: link ? [...link.sourceIds] : [],
        linkUpdatedAt: link?.updatedAt ?? null,
        linkInitialMatches,
        linkDesiredMatches,
        citationEligible,
        eligibleDesiredSourceIds,
        mediaRows: mediaRows.length,
        mediaExact,
        reviewRows: reviewRows.length,
        reviewsExact,
        desiredRevisionApprovals,
        outstandingRequiredReviews,
        aiContentAuditRows: aiContentAudits.length,
        aiReleaseRows: aiReleases.length,
      },
    };
  }));

  const blockers: string[] = [];
  if (!allLinksBounded) blockers.push('evidence reverse-dependency snapshot exceeded 1,000 rows');
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  for (const source of sourceResults) {
    if (source.public.rows !== 1) blockers.push(`source row count is not one: ${source.expected.sourceId}`);
    else if (!source.public.exact) blockers.push(`source preimage drifted: ${source.expected.sourceId}`);
    if (source.evidenceAuditRows !== 0) blockers.push(`source gained an AI evidence audit: ${source.expected.sourceId}`);
  }
  for (const inspected of inspectedTargets) {
    const state = inspected.public;
    if (state.contentRows !== 1) blockers.push(`content row count is not one: ${state.slug}`);
    if (state.linkRows !== 1) blockers.push(`link row count is not one: ${state.kind}:${state.slug}`);
    if (!state.desiredTemplateExact) blockers.push(`frozen desired content drifted: ${state.slug}`);
    if (!state.mediaExact) blockers.push(`media preimage drifted: ${state.slug}`);
    if (!state.reviewsExact) blockers.push(`review history drifted: ${state.slug}`);
    if (state.desiredRevisionApprovals !== 0) blockers.push(`desired revision already has approvals: ${state.slug}`);
    if (state.aiContentAuditRows !== 0) blockers.push(`content gained an AI audit: ${state.slug}`);
    if (state.aiReleaseRows !== 0) blockers.push(`content gained an AI release: ${state.slug}`);
    if (!state.citationEligible) blockers.push(`desired citations are not authoritative, age-compatible and eligible: ${state.slug}`);
  }

  const reverseInitialMatches = reverseResults.every((row) => row.initialMatches);
  const reverseDesiredMatches = reverseResults.every((row) => row.desiredMatches);
  const allInitialMatches = inspectedTargets.every((row) => (
    row.public.contentInitialMatches && row.public.linkInitialMatches
  ));
  const allDesiredMatches = inspectedTargets.every((row) => (
    row.public.contentDesiredMatches && row.public.linkDesiredMatches
  ));
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact
    && allDesiredMatches && reverseDesiredMatches) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0
    && allInitialMatches && reverseInitialMatches) {
    phase = 'ready';
  } else {
    if (audit.rows === 0 && !allInitialMatches) blockers.push('Production content/link preimage drifted');
    if (audit.rows === 0 && !reverseInitialMatches) blockers.push('Production source reverse dependencies drifted');
    if (audit.rows === 1 && audit.exact && !allDesiredMatches) blockers.push('release audit exists but content/link postimage drifted');
    if (audit.rows === 1 && audit.exact && !reverseDesiredMatches) blockers.push('release audit exists but reverse dependencies drifted');
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
    phase,
    todayIso,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    allLinksRows: allLinks.length,
    allLinksBounded,
    targets: inspectedTargets.map((row) => row.public),
    sources: sourceResults.map((row) => row.public),
    reverseDependencies: reverseResults,
    aiEvidenceAuditRows: sourceResults.reduce((sum, row) => sum + row.evidenceAuditRows, 0),
  };
}

/** Read-only, bounded, exact-state preflight for the two frozen corrections. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(CLINICAL_TWO_SMALL_CAS_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

function desiredPatch(target: ClinicalTwoSmallTarget): Partial<Doc<'libraryContent'>> {
  const desired = target.desiredContent;
  return {
    type: desired.type,
    slug: desired.slug,
    ageGroupKey: desired.ageGroupKey,
    domainKey: desired.domainKey,
    category: desired.category,
    titleMm: desired.titleMm,
    titleEn: desired.titleEn,
    summaryMm: desired.summaryMm,
    summaryEn: desired.summaryEn,
    tags: [...desired.tags],
    difficulty: desired.difficulty,
    durationMinutes: desired.durationMinutes,
    offline: desired.offline,
    data: desired.data,
    source: desired.source,
    version: desired.version,
    searchText: desired.searchText,
    requiredReviewDimensions: [...CLINICAL_TWO_SMALL_REQUIRED_REVIEWS],
    reviewRevision: target.contentDesiredReviewRevision,
    clinicalStatus: 'clinical_review',
    reviewerId: undefined,
    reviewerQualification: undefined,
    reviewerDisplayName: undefined,
    reviewScope: undefined,
    reviewedAt: undefined,
    nextReviewAt: undefined,
    reviewNote: undefined,
    aiPublicationReleaseId: undefined,
    aiPublishedAt: undefined,
  };
}

/** Atomically corrects both rows without approving or publishing either one. */
export const apply = internalMutation({
  args: { releaseId: v.literal(CLINICAL_TWO_SMALL_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(CLINICAL_TWO_SMALL_CAS_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentUpdated: v.number(),
    linksUpdated: v.number(),
    sourcesPreserved: v.number(),
    mediaPreserved: v.number(),
    reviewsPreserved: v.number(),
    requiredFreshReviews: v.number(),
    publicationDecisionMade: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks audited timestamp');
      return {
        releaseId: CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentUpdated: 0,
        linksUpdated: 0,
        sourcesPreserved: before.sources.length,
        mediaPreserved: before.targets.reduce((sum, row) => sum + row.mediaRows, 0),
        reviewsPreserved: before.targets.reduce((sum, row) => sum + row.reviewRows, 0),
        requiredFreshReviews: CLINICAL_TWO_SMALL_REQUIRED_REVIEWS.length * before.targets.length,
        publicationDecisionMade: false,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Clinical two-small CAS preflight blocked: ${before.blockers.join('; ')}`);
    }

    const rechecked = await preflightState(ctx, now);
    if (rechecked.phase !== 'ready') {
      throw new Error('Clinical two-small state changed after preflight');
    }

    for (const target of CLINICAL_TWO_SMALL_TARGETS) {
      await ctx.db.patch(target.contentId as Id<'libraryContent'>, {
        ...desiredPatch(target),
        updatedAt: now,
      });
      if (!sameStrings(target.initialSourceIds, target.desiredSourceIds)) {
        await ctx.db.patch(target.linkId as Id<'evidenceLinks'>, {
          sourceIds: [...target.desiredSourceIds],
          updatedAt: now,
        });
      }
    }

    const postimages = await Promise.all(CLINICAL_TWO_SMALL_TARGETS.map(async (target) => {
      const [content, link] = await Promise.all([
        ctx.db.get(target.contentId as Id<'libraryContent'>),
        ctx.db.get(target.linkId as Id<'evidenceLinks'>),
      ]);
      if (!content || !link) throw new Error(`Postimage row disappeared: ${target.slug}`);
      return {
        slug: target.slug,
        contentCanonicalSha256: await sha256Canonical(content),
        linkCanonicalSha256: await sha256Canonical(link),
      };
    }));

    const postLinkSnapshot = await ctx.db.query('evidenceLinks').take(allLinkLimit);
    if (postLinkSnapshot.length >= allLinkLimit) {
      throw new Error('Clinical two-small postflight reverse-dependency bound exceeded');
    }
    const reversePostimages = await Promise.all(CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES.map(
      async (expected) => {
        const rows = sortById(postLinkSnapshot.filter((link) => (
          link.sourceIds.includes(expected.sourceId)
        )));
        if (rows.length !== expected.desiredCount) {
          throw new Error(`Clinical two-small reverse-dependency count drifted: ${expected.sourceId}`);
        }
        const canonicalSha256 = await sha256Canonical(rows);
        if (expected.desiredCanonicalSha256 !== null
          && canonicalSha256 !== expected.desiredCanonicalSha256) {
          throw new Error(`Clinical two-small fixed reverse postimage drifted: ${expected.sourceId}`);
        }
        return { sourceId: expected.sourceId, rows: rows.length, canonicalSha256 };
      },
    ));

    await logAudit(
      ctx,
      null,
      releaseAction,
      'libraryContent,evidenceLinks',
      undefined,
      CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, postimages, reversePostimages),
      },
    );

    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Clinical two-small CAS postimage validation failed; transaction rolled back');
    }
    return {
      releaseId: CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentUpdated: CLINICAL_TWO_SMALL_TARGETS.length,
      linksUpdated: CLINICAL_TWO_SMALL_TARGETS.filter((target) => (
        !sameStrings(target.initialSourceIds, target.desiredSourceIds)
      )).length,
      sourcesPreserved: after.sources.length,
      mediaPreserved: after.targets.reduce((sum, row) => sum + row.mediaRows, 0),
      reviewsPreserved: after.targets.reduce((sum, row) => sum + row.reviewRows, 0),
      requiredFreshReviews: CLINICAL_TWO_SMALL_REQUIRED_REVIEWS.length * after.targets.length,
      publicationDecisionMade: false,
      updatedAt: now,
    };
  },
});
