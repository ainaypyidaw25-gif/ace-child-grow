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
import { publicationEvidenceIsEligible } from './lib/evidencePublicationGate';
import { evidenceIsOutdated, todayIsoUtc } from './lib/evidenceFreshness';
import {
  desiredNutritionGuideData,
  desiredNutritionGuideSearchText,
  NUTRITION_GUIDES_CAS_RELEASE_ID,
  NUTRITION_GUIDES_CAS_TARGETS,
  NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES,
  NUTRITION_GUIDES_NEW_SOURCE_IDS,
  NUTRITION_GUIDES_NEW_SOURCES,
  NUTRITION_GUIDES_REQUIRED_REVIEW_DIMENSIONS,
  NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
  type NutritionGuideCasTarget,
  type NutritionNewSource,
} from './lib/nutritionGuidesCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type Phase = 'sources_absent' | 'awaiting_human_review' | 'ready' | 'applied' | 'blocked';

const sourceStageAction = 'release.nutrition_guides_sources_stage';
const contentReleaseAction = 'release.nutrition_guides_content_evidence_correction';

const resultValidator = v.object({
  releaseId: v.string(),
  phase: v.union(
    v.literal('sources_absent'),
    v.literal('awaiting_human_review'),
    v.literal('ready'),
    v.literal('applied'),
    v.literal('blocked'),
  ),
  blockers: v.array(v.string()),
  targetRows: v.number(),
  sourceRows: v.number(),
  eligibleNewSources: v.number(),
  reverseDependencies: v.number(),
  outstandingReviewDimensions: v.number(),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function exactRow(
  row: { _id: unknown; _creationTime: number } | null,
  expected: { rowId: string; creationTime: number; exactCanonicalSha256: string },
): Promise<boolean> {
  return row !== null
    && String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && await sha256Canonical(row) === expected.exactCanonicalSha256;
}

function sourceMetadata(source: NutritionNewSource): Record<string, unknown> {
  return {
    sourceId: source.sourceId,
    org: source.org,
    orgKey: source.orgKey,
    title: source.title,
    authors: source.authors,
    year: source.year,
    edition: source.edition,
    country: source.country,
    language: source.language,
    url: source.url,
    doi: source.doi,
    isbn: source.isbn,
    pmid: source.pmid,
    evidenceLevel: source.evidenceLevel,
    keywords: source.keywords,
    topics: source.topics,
    ageMonthsMin: source.ageMonthsMin,
    ageMonthsMax: source.ageMonthsMax,
    verifiedOn: source.verifiedOn,
    verifiedNote: source.verifiedNote,
    searchText: source.searchText,
  };
}

function newSourceMetadataMatches(row: Doc<'evidenceSources'>, expected: NutritionNewSource): boolean {
  return Object.entries(sourceMetadata(expected)).every(([key, value]) => (
    canonicalJson((row as unknown as Record<string, unknown>)[key]) === canonicalJson(value)
  ));
}

function sourceStageBeforeJson(): string {
  return JSON.stringify({
    releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    sourcesAbsent: [...NUTRITION_GUIDES_NEW_SOURCE_IDS],
    reverseDependencies: [],
    contentPreimages: NUTRITION_GUIDES_CAS_TARGETS.map((target) => ({
      slug: target.slug,
      contentCanonicalSha256: target.contentInitialCanonicalSha256,
      linkCanonicalSha256: target.linkInitialCanonicalSha256,
    })),
  });
}

type StagedAuditSource = {
  sourceId: string;
  rowId: string;
  creationTime: number;
  canonicalSha256: string;
  createdAt: number;
  updatedAt: number;
};

function sourceStageAfterJson(sources: readonly StagedAuditSource[]): string {
  return JSON.stringify({
    releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    reviewStatus: 'awaiting_review',
    reviewer: null,
    reviewDate: null,
    sources,
    reverseDependencies: [],
    nextStep: 'human_evidence_review_required_before_content_apply',
  });
}

async function sourceStageAudit(ctx: DatabaseContext) {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', sourceStageAction)).take(2);
  if (rows.length !== 1) {
    return { rows: rows.length, exact: false, creationTime: null, sources: [] as StagedAuditSource[] };
  }
  const row = rows[0];
  let sources: StagedAuditSource[] = [];
  try {
    const parsed = JSON.parse(row.after ?? '{}') as { sources?: StagedAuditSource[] };
    if (Array.isArray(parsed.sources)) sources = parsed.sources;
  } catch {
    sources = [];
  }
  const exact = row.actorId === undefined
    && row.entityTable === 'evidenceSources'
    && row.entityId === undefined
    && row.summary === NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID
    && row.result === 'ok'
    && row.before === sourceStageBeforeJson()
    && sources.length === NUTRITION_GUIDES_NEW_SOURCES.length
    && sameStrings(sources.map((source) => source.sourceId), NUTRITION_GUIDES_NEW_SOURCE_IDS)
    && row.after === sourceStageAfterJson(sources);
  return {
    rows: 1,
    exact,
    creationTime: exact ? row._creationTime : null,
    sources: exact ? sources : [],
  };
}

type HumanReviewAudit = {
  exact: boolean;
  rows: number;
};

async function humanReviewAudits(
  ctx: DatabaseContext,
  stageCreationTime: number | null,
  sources: readonly Doc<'evidenceSources'>[],
  todayIso: string,
): Promise<Map<string, HumanReviewAudit>> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', 'evidence.setReview')).take(5_001);
  if (rows.length > 5_000) throw new Error('Nutrition guide human-review audit scan exceeded 5,000 rows');
  const result = new Map<string, HumanReviewAudit>();
  for (const source of sources) {
    const successful = rows.filter((row) => (
      row.entityTable === 'evidenceSources'
      && row.entityId === source.sourceId
      && row.result === 'ok'
    ));
    const outdated = evidenceIsOutdated(
      { evidenceLevel: source.evidenceLevel ?? '', year: source.year ?? null },
      todayIso,
    );
    const reviewNote = source.reviewNote?.trim() || undefined;
    const expectedBefore = 'awaiting_review / no reviewer / no date';
    const expectedAfter = `approved / ${source.reviewer?.trim()} (${source.reviewerQualification?.trim()}) / ${source.reviewDate}${reviewNote ? ` / note: ${reviewNote}` : ''}`;
    const expectedSummary = `awaiting_review → approved by ${source.reviewer?.trim()} (${source.reviewerQualification?.trim()})${outdated ? ' · outdated-source advisory acknowledged in reviewer note' : ''}`;
    const audit = successful[0];
    result.set(source.sourceId, {
      rows: successful.length,
      exact: Boolean(successful.length === 1
        && audit
        && stageCreationTime !== null
        && audit._creationTime > stageCreationTime
        && audit._creationTime >= source.updatedAt
        && String(audit.actorId) === String(source.reviewerId)
        && audit.before === expectedBefore
        && audit.after === expectedAfter
        && audit.summary === expectedSummary
        && (!outdated || Boolean(reviewNote))),
    });
  }
  return result;
}

async function currentAiEvidenceAuditRows(
  ctx: DatabaseContext,
  row: Doc<'evidenceSources'> | null,
): Promise<number> {
  if (!row) return 0;
  return (await ctx.db.query('aiEvidenceAudits').withIndex('by_source_and_updated_at', (q) => q
    .eq('sourceId', row.sourceId).eq('sourceUpdatedAt', row.updatedAt)).take(1)).length;
}

type ContentReleaseAuditTarget = {
  slug: string;
  contentCanonicalSha256: string;
  linkCanonicalSha256: string;
  updatedAt: number;
};

type ContentReleaseAudit = {
  rows: number;
  exact: boolean;
  targets: ContentReleaseAuditTarget[];
  sourceHashes: Array<{ sourceId: string; canonicalSha256: string }>;
};

function contentReleaseBeforeJson(
  sourceHashes: readonly { sourceId: string; canonicalSha256: string }[],
): string {
  return JSON.stringify({
    releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    targets: NUTRITION_GUIDES_CAS_TARGETS.map((target) => ({
      slug: target.slug,
      contentCanonicalSha256: target.contentInitialCanonicalSha256,
      linkCanonicalSha256: target.linkInitialCanonicalSha256,
      reviewRevision: target.contentInitialReviewRevision,
    })),
    sourceHashes,
    reverseDependencies: [],
    mediaRows: 0,
    aiReleaseRows: 0,
    aiContentAuditRows: 0,
    aiEvidenceAuditRows: 0,
    reviewRows: NUTRITION_GUIDES_CAS_TARGETS.reduce((sum, target) => sum + target.reviews.length, 0),
  });
}

function contentReleaseAfterJson(
  targets: readonly ContentReleaseAuditTarget[],
  sourceHashes: readonly { sourceId: string; canonicalSha256: string }[],
): string {
  return JSON.stringify({
    releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    targets,
    sourceHashes,
    reverseDependencies: NUTRITION_GUIDES_NEW_SOURCE_IDS.map((sourceId) => ({
      sourceId,
      targetKeys: NUTRITION_GUIDES_CAS_TARGETS.map((target) => `${target.kind}:${target.slug}`),
    })),
    mediaRows: 0,
    aiReleaseRows: 0,
    aiContentAuditRows: 0,
    aiEvidenceAuditRows: 0,
    reviewsPreserved: NUTRITION_GUIDES_CAS_TARGETS.reduce((sum, target) => sum + target.reviews.length, 0),
    clinicalStatus: 'clinical_review',
    desiredRevisionApprovals: 0,
    outstandingRequiredReviews: NUTRITION_GUIDES_CAS_TARGETS.map((target) => ({
      slug: target.slug,
      dimensions: NUTRITION_GUIDES_REQUIRED_REVIEW_DIMENSIONS,
    })),
    publicationDecision: 'not_made',
  });
}

async function contentReleaseAudit(ctx: DatabaseContext): Promise<ContentReleaseAudit> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', contentReleaseAction)).take(2);
  if (rows.length !== 1) return { rows: rows.length, exact: false, targets: [], sourceHashes: [] };
  const row = rows[0];
  let targets: ContentReleaseAuditTarget[] = [];
  let sourceHashes: Array<{ sourceId: string; canonicalSha256: string }> = [];
  try {
    const parsed = JSON.parse(row.after ?? '{}') as {
      targets?: ContentReleaseAuditTarget[];
      sourceHashes?: Array<{ sourceId: string; canonicalSha256: string }>;
    };
    if (Array.isArray(parsed.targets)) targets = parsed.targets;
    if (Array.isArray(parsed.sourceHashes)) sourceHashes = parsed.sourceHashes;
  } catch {
    targets = [];
    sourceHashes = [];
  }
  const exact = row.actorId === undefined
    && row.entityTable === 'libraryContent,evidenceLinks'
    && row.entityId === undefined
    && row.summary === NUTRITION_GUIDES_CAS_RELEASE_ID
    && row.result === 'ok'
    && targets.length === NUTRITION_GUIDES_CAS_TARGETS.length
    && sourceHashes.length === NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES.length
      + NUTRITION_GUIDES_NEW_SOURCE_IDS.length
    && row.before === contentReleaseBeforeJson(sourceHashes)
    && row.after === contentReleaseAfterJson(targets, sourceHashes);
  return { rows: 1, exact, targets: exact ? targets : [], sourceHashes: exact ? sourceHashes : [] };
}

async function reverseDependencies(ctx: DatabaseContext) {
  const rows = await ctx.db.query('evidenceLinks').take(5_001);
  if (rows.length > 5_000) throw new Error('Nutrition guide reverse-dependency scan exceeded 5,000 rows');
  return rows.filter((row) => row.sourceIds.some((sourceId) => (
    NUTRITION_GUIDES_NEW_SOURCE_IDS.includes(sourceId as typeof NUTRITION_GUIDES_NEW_SOURCE_IDS[number])
  )));
}

async function targetState(ctx: DatabaseContext, target: NutritionGuideCasTarget) {
  const [contents, links, media, reviews, aiReleases, aiAudits] = await Promise.all([
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', target.kind).eq('slug', target.slug)).take(2),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) => q.eq('contentSlug', target.slug)).take(1),
    ctx.db.query('contentReviews').withIndex('by_content', (q) => q.eq('contentSlug', target.slug))
      .take(target.reviews.length + 1),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
      .eq('targetKey', `${target.kind}:${target.slug}`)).take(1),
    ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) => q
      .eq('contentSlug', target.slug)).take(1),
  ]);
  const content = contents.length === 1 ? contents[0] : null;
  const link = links.length === 1 ? links[0] : null;
  const reviewsExact = reviews.length === target.reviews.length
    && (await Promise.all(target.reviews.map(async (expected) => {
      const row = reviews.find((candidate) => String(candidate._id) === expected.rowId) ?? null;
      return exactRow(row, expected);
    }))).every(Boolean);
  const initialContent = await exactRow(content, {
    rowId: target.contentId,
    creationTime: target.contentCreationTime,
    exactCanonicalSha256: target.contentInitialCanonicalSha256,
  });
  const initialLink = await exactRow(link, {
    rowId: target.linkId,
    creationTime: target.linkCreationTime,
    exactCanonicalSha256: target.linkInitialCanonicalSha256,
  });
  return {
    target,
    content,
    link,
    initialContent: Boolean(initialContent && content
      && content.clinicalStatus === 'clinical_review'
      && content.reviewRevision === target.contentInitialReviewRevision
      && content.updatedAt === target.contentInitialUpdatedAt),
    initialLink: Boolean(initialLink && link
      && link.createdAt === target.linkCreatedAt
      && link.updatedAt === target.linkInitialUpdatedAt
      && sameStrings(link.sourceIds, target.initialSourceIds)),
    reviews,
    reviewsExact,
    desiredRevisionApprovals: reviews.filter((review) => (
      review.reviewRevision === target.contentDesiredReviewRevision && review.decision === 'approved'
    )).length,
    mediaRows: media.length,
    aiReleaseRows: aiReleases.length,
    aiContentAuditRows: aiAudits.length,
  };
}

async function sourceState(ctx: DatabaseContext, now: number) {
  const stageAudit = await sourceStageAudit(ctx);
  const existing = await Promise.all(NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES.map(
    async ([sourceId, rowId, creationTime, exactCanonicalSha256]) => {
      const rows = await ctx.db.query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', sourceId)).take(2);
      const row = rows.length === 1 ? rows[0] : null;
      return {
        sourceId,
        row,
        exact: await exactRow(row, { rowId, creationTime, exactCanonicalSha256 }),
        eligible: Boolean(row
          && row.reviewStatus === 'approved'
          && publicationEvidenceIsEligible(row, todayIsoUtc(new Date(now)))),
        aiEvidenceAuditRows: await currentAiEvidenceAuditRows(ctx, row),
      };
    },
  ));
  const fresh = await Promise.all(NUTRITION_GUIDES_NEW_SOURCES.map(async (expected) => {
    const rows = await ctx.db.query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId)).take(2);
    const row = rows.length === 1 ? rows[0] : null;
    const audited = stageAudit.sources.find((candidate) => candidate.sourceId === expected.sourceId);
    const identityExact = Boolean(row && audited
      && String(row._id) === audited.rowId
      && row._creationTime === audited.creationTime
      && row.createdAt === audited.createdAt);
    const metadataExact = Boolean(row && newSourceMetadataMatches(row, expected));
    const awaiting = Boolean(row && identityExact && metadataExact
      && row.reviewStatus === 'awaiting_review'
      && row.reviewer === null
      && row.reviewDate === null
      && row.nextReviewDate === null
      && row.reviewerId === undefined
      && row.reviewerQualification === undefined
      && row.reviewScope === undefined
      && row.reviewNote === undefined
      && row.updatedAt === audited?.updatedAt
      && await sha256Canonical(row) === audited?.canonicalSha256);
    return { expected, rows: rows.length, row, awaiting, metadataExact, identityExact };
  }));
  const reviewAudits = await humanReviewAudits(
    ctx,
    stageAudit.creationTime,
    fresh.flatMap((source) => source.row ? [source.row] : []),
    todayIsoUtc(new Date(now)),
  );
  const freshWithEligibility = await Promise.all(fresh.map(async (source) => {
    const reviewAudit = reviewAudits.get(source.expected.sourceId) ?? { rows: 0, exact: false };
    const eligible = Boolean(source.row && source.identityExact && source.metadataExact
      && source.row.reviewStatus === 'approved'
      && source.row.reviewer?.trim()
      && source.row.reviewerId
      && source.row.reviewerQualification?.trim()
      && source.row.reviewDate
      && source.row.reviewScope === 'education'
      && reviewAudit.exact
      && publicationEvidenceIsEligible(source.row, todayIsoUtc(new Date(now))));
    return {
      ...source,
      eligible,
      reviewAudit,
      aiEvidenceAuditRows: await currentAiEvidenceAuditRows(ctx, source.row),
    };
  }));
  return { stageAudit, existing, fresh: freshWithEligibility };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const [contentAudit, targets, sources, dependencies] = await Promise.all([
    contentReleaseAudit(ctx),
    Promise.all(NUTRITION_GUIDES_CAS_TARGETS.map((target) => targetState(ctx, target))),
    sourceState(ctx, now),
    reverseDependencies(ctx),
  ]);
  const blockers: string[] = [];
  if (sources.stageAudit.rows > 1) blockers.push('duplicate source-stage audit rows');
  if (sources.stageAudit.rows === 1 && !sources.stageAudit.exact) blockers.push('source-stage audit drifted');
  if (contentAudit.rows > 1) blockers.push('duplicate content-release audit rows');
  if (contentAudit.rows === 1 && !contentAudit.exact) blockers.push('content-release audit drifted');
  for (const source of sources.existing) {
    if (!source.exact) blockers.push(`approved source preimage drifted: ${source.sourceId}`);
    if (!source.eligible) blockers.push(`approved source is no longer citation-eligible: ${source.sourceId}`);
    if (source.aiEvidenceAuditRows !== 0) blockers.push(`AI evidence audit appeared: ${source.sourceId}`);
  }
  for (const source of sources.fresh) {
    if (source.aiEvidenceAuditRows !== 0) blockers.push(`AI evidence audit appeared: ${source.expected.sourceId}`);
    if (source.row?.reviewStatus === 'approved' && !source.reviewAudit.exact) {
      blockers.push(`human evidence review audit missing or drifted: ${source.expected.sourceId}`);
    }
  }
  for (const target of targets) {
    if (!target.reviewsExact) blockers.push(`review history drifted: ${target.target.slug}`);
    if (target.mediaRows !== 0) blockers.push(`media dependency appeared: ${target.target.slug}`);
    if (target.aiReleaseRows !== 0) blockers.push(`AI release appeared: ${target.target.slug}`);
    if (target.aiContentAuditRows !== 0) blockers.push(`AI content audit appeared: ${target.target.slug}`);
    if (target.desiredRevisionApprovals !== 0) {
      blockers.push(`desired revision already has approvals: ${target.target.slug}`);
    }
  }

  let phase: Phase = 'blocked';
  const allInitial = targets.every((target) => target.initialContent && target.initialLink);
  const allNewAbsent = sources.fresh.every((source) => source.rows === 0);
  const allNewEligible = sources.fresh.every((source) => source.eligible);
  const allNewReviewProgress = sources.fresh.every((source) => source.awaiting || source.eligible);
  const anyNewAwaiting = sources.fresh.some((source) => source.awaiting);
  if (contentAudit.rows === 0) {
    if (!allInitial) blockers.push('one or more exact target preimages drifted');
    if (dependencies.length !== 0) blockers.push('new source reverse dependencies appeared before apply');
    for (const source of sources.fresh) {
      if (source.rows > 1) blockers.push(`new source row count is not bounded: ${source.expected.sourceId}`);
      if (source.rows === 1 && (!source.identityExact || !source.metadataExact)) {
        blockers.push(`staged source identity or metadata drifted: ${source.expected.sourceId}`);
      }
    }
    if (blockers.length === 0 && sources.stageAudit.rows === 0 && allNewAbsent) {
      phase = 'sources_absent';
    } else if (blockers.length === 0 && sources.stageAudit.exact
      && allNewReviewProgress && anyNewAwaiting) {
      phase = 'awaiting_human_review';
    } else if (blockers.length === 0 && sources.stageAudit.exact && allNewEligible) {
      phase = 'ready';
    } else if (sources.stageAudit.rows === 0 && !allNewAbsent) {
      blockers.push('new evidence sources exist without the exact source-stage audit');
    } else if (sources.stageAudit.exact && !allNewReviewProgress) {
      blockers.push('new evidence source review state is neither exact awaiting-review nor eligible approved');
    }
  } else if (contentAudit.exact) {
    if (!allNewEligible) blockers.push('applied release lost eligible human-reviewed sources');
    if (dependencies.length !== NUTRITION_GUIDES_CAS_TARGETS.length) {
      blockers.push('applied reverse-dependency set drifted');
    }
    const sourceHashMap = new Map(contentAudit.sourceHashes.map((source) => [source.sourceId, source.canonicalSha256]));
    const allSourceHashesExact = (await Promise.all(
      [...sources.existing, ...sources.fresh].map(async (source) => Boolean(
        source.row
        && sourceHashMap.get('sourceId' in source ? source.sourceId : source.expected.sourceId)
          === await sha256Canonical(source.row),
      )),
    )).every(Boolean);
    const desiredTargets = await Promise.all(targets.map(async (state) => {
      const auditTarget = contentAudit.targets.find((candidate) => candidate.slug === state.target.slug);
      if (!state.content || !state.link || !auditTarget) return false;
      const desiredData = desiredNutritionGuideData(state.target.slug, state.content.data);
      const desiredSearch = desiredNutritionGuideSearchText(state.content, desiredData);
      return state.content.clinicalStatus === 'clinical_review'
        && state.content.reviewRevision === state.target.contentDesiredReviewRevision
        && canonicalJson(state.content.data) === canonicalJson(desiredData)
        && state.content.searchText === desiredSearch
        && state.content.updatedAt === auditTarget.updatedAt
        && state.link.updatedAt === auditTarget.updatedAt
        && sameStrings(state.link.sourceIds, state.target.desiredSourceIds)
        && await sha256Canonical(state.content) === auditTarget.contentCanonicalSha256
        && await sha256Canonical(state.link) === auditTarget.linkCanonicalSha256
        && state.content.reviewerId === undefined
        && state.content.reviewerQualification === undefined
        && state.content.reviewerDisplayName === undefined
        && state.content.reviewScope === undefined
        && state.content.reviewedAt === undefined
        && state.content.nextReviewAt === undefined
        && state.content.reviewNote === undefined
        && state.content.aiPublicationReleaseId === undefined
        && state.content.aiPublishedAt === undefined;
    }));
    if (!desiredTargets.every(Boolean)) blockers.push('applied content or link postimage drifted');
    if (!allSourceHashesExact) blockers.push('applied source hash set drifted');
    if (blockers.length === 0) phase = 'applied';
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    phase,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    targetRows: targets.filter((target) => target.content && target.link).length,
    sourceRows: sources.existing.filter((source) => source.row).length
      + sources.fresh.filter((source) => source.row).length,
    eligibleNewSources: sources.fresh.filter((source) => source.eligible).length,
    reverseDependencies: dependencies.length,
    outstandingReviewDimensions: NUTRITION_GUIDES_CAS_TARGETS.length
      * NUTRITION_GUIDES_REQUIRED_REVIEW_DIMENSIONS.length,
    _targets: targets,
    _sources: sources,
    _contentAudit: contentAudit,
  };
}

/** Read-only, exact two-phase status. This is internal-only and cannot be called by browsers. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(NUTRITION_GUIDES_CAS_RELEASE_ID) },
  returns: resultValidator,
  handler: async (ctx) => {
    const { _targets, _sources, _contentAudit, ...result } = await preflightState(ctx, Date.now());
    void _targets;
    void _sources;
    void _contentAudit;
    return result;
  },
});

/**
 * Phase one only: insert the two exact official source records as awaiting_review.
 * This mutation never approves a source and never touches content or links.
 */
export const stageSources = internalMutation({
  args: { releaseId: v.literal(NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID),
    staged: v.boolean(),
    alreadyStaged: v.boolean(),
    sourcesInserted: v.number(),
    humanReviewRequired: v.literal(true),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'awaiting_human_review' || before.phase === 'ready' || before.phase === 'applied') {
      return {
        releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
        staged: false,
        alreadyStaged: true,
        sourcesInserted: 0,
        humanReviewRequired: true as const,
      };
    }
    if (before.phase !== 'sources_absent') {
      throw new Error(`Nutrition source-stage preflight blocked: ${before.blockers.join('; ')}`);
    }
    const staged: StagedAuditSource[] = [];
    for (const source of NUTRITION_GUIDES_NEW_SOURCES) {
      const rowId = await ctx.db.insert('evidenceSources', {
        ...source,
        createdAt: now,
        updatedAt: now,
      });
      const row = await ctx.db.get(rowId);
      if (!row) throw new Error(`Staged source disappeared: ${source.sourceId}`);
      staged.push({
        sourceId: source.sourceId,
        rowId: String(row._id),
        creationTime: row._creationTime,
        canonicalSha256: await sha256Canonical(row),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
    await logAudit(ctx, null, sourceStageAction, 'evidenceSources', undefined,
      NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID, {
        result: 'ok',
        before: sourceStageBeforeJson(),
        after: sourceStageAfterJson(staged),
      });
    const after = await preflightState(ctx, now);
    if (after.phase !== 'awaiting_human_review') {
      throw new Error('Nutrition source-stage postimage failed; transaction rolled back');
    }
    return {
      releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
      staged: true,
      alreadyStaged: false,
      sourcesInserted: staged.length,
      humanReviewRequired: true as const,
    };
  },
});

/**
 * Phase two: exact atomic content+link CAS. It remains blocked until both staged
 * sources have independent, named, eligible human evidence reviews.
 */
export const apply = internalMutation({
  args: { releaseId: v.literal(NUTRITION_GUIDES_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(NUTRITION_GUIDES_CAS_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentRowsUpdated: v.number(),
    linkRowsUpdated: v.number(),
    publicationDecision: v.literal('not_made'),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      return {
        releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentRowsUpdated: 0,
        linkRowsUpdated: 0,
        publicationDecision: 'not_made' as const,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Nutrition guide CAS preflight blocked: ${before.blockers.join('; ')}`);
    }
    const sourceRows = [...before._sources.existing, ...before._sources.fresh]
      .map((source) => source.row)
      .filter((row): row is Doc<'evidenceSources'> => row !== null);
    const sourceHashes = await Promise.all(sourceRows.map(async (row) => ({
      sourceId: row.sourceId,
      canonicalSha256: await sha256Canonical(row),
    })));
    sourceHashes.sort((left, right) => left.sourceId.localeCompare(right.sourceId));

    for (const state of before._targets) {
      if (!state.content || !state.link) throw new Error(`Nutrition target disappeared: ${state.target.slug}`);
      const desiredData = desiredNutritionGuideData(state.target.slug, state.content.data);
      await ctx.db.patch(state.target.contentId as Id<'libraryContent'>, {
        data: desiredData,
        searchText: desiredNutritionGuideSearchText(state.content, desiredData),
        reviewRevision: state.target.contentDesiredReviewRevision,
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
        updatedAt: now,
      });
      await ctx.db.patch(state.target.linkId as Id<'evidenceLinks'>, {
        sourceIds: [...state.target.desiredSourceIds],
        updatedAt: now,
      });
    }

    const targetsAfter: ContentReleaseAuditTarget[] = [];
    for (const target of NUTRITION_GUIDES_CAS_TARGETS) {
      const [content, link] = await Promise.all([
        ctx.db.get(target.contentId as Id<'libraryContent'>),
        ctx.db.get(target.linkId as Id<'evidenceLinks'>),
      ]);
      if (!content || !link) throw new Error(`Nutrition postimage disappeared: ${target.slug}`);
      targetsAfter.push({
        slug: target.slug,
        contentCanonicalSha256: await sha256Canonical(content),
        linkCanonicalSha256: await sha256Canonical(link),
        updatedAt: now,
      });
    }
    await logAudit(ctx, null, contentReleaseAction, 'libraryContent,evidenceLinks', undefined,
      NUTRITION_GUIDES_CAS_RELEASE_ID, {
        result: 'ok',
        before: contentReleaseBeforeJson(sourceHashes),
        after: contentReleaseAfterJson(targetsAfter, sourceHashes),
      });
    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error(`Nutrition guide CAS postimage failed: ${after.blockers.join('; ')}`);
    }
    return {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentRowsUpdated: NUTRITION_GUIDES_CAS_TARGETS.length,
      linkRowsUpdated: NUTRITION_GUIDES_CAS_TARGETS.length,
      publicationDecision: 'not_made' as const,
    };
  },
});
