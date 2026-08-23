import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import { todayIsoUtc } from './lib/evidenceFreshness';
import { publicationEvidenceIsEligible } from './lib/evidencePublicationGate';
import {
  AAP_DROWNING_2021_DESIRED_REVERSE_KEYS,
  AAP_DROWNING_2021_INITIAL_REVERSE_KEYS,
  AAP_DROWNING_2021_SOURCE_ID,
  CDC_PRESCHOOL_SOURCE_ID,
  CDC_TODDLER_SOURCE_ID,
  GD_19_24M_SAFETY_DESIRED_COPY,
  GD_19_24M_SAFETY_INITIAL_COPY,
  OLDER_SAFETY_2026_RELEASE_ID,
  OLDER_SAFETY_2026_STAGED_SOURCES,
  OLDER_SAFETY_2026_TARGETS,
  OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES,
  OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS,
  type OlderSafetyStagedSource,
  type OlderSafetyTarget,
} from './lib/olderSafety2026CasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const releaseAction = 'release.older_safety_current_evidence';
const sourceStageAction = 'release.older_safety_current_evidence.sources_staged';
const maxLinkRows = 500;
const maxRelatedRows = 50;

const phaseValidator = v.union(
  v.literal('sources_absent'),
  v.literal('source_review_required'),
  v.literal('ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const sourceStateValidator = v.object({
  sourceId: v.string(),
  rows: v.number(),
  rowId: v.union(v.string(), v.null()),
  metadataExact: v.boolean(),
  initialExact: v.boolean(),
  reviewStatus: v.union(v.string(), v.null()),
  reviewScope: v.union(v.string(), v.null()),
  reviewerId: v.union(v.string(), v.null()),
  reviewerQualification: v.union(v.string(), v.null()),
  reviewDate: v.union(v.string(), v.null()),
  eligible: v.boolean(),
});

const targetStateValidator = v.object({
  slug: v.string(),
  contentRows: v.number(),
  linkRows: v.number(),
  contentInitialMatches: v.boolean(),
  contentDesiredMatches: v.boolean(),
  linkInitialMatches: v.boolean(),
  linkDesiredMatches: v.boolean(),
  ageCovered: v.boolean(),
  mediaRows: v.number(),
  reviewRows: v.number(),
  aiReleaseRows: v.number(),
  aiAuditRows: v.number(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(OLDER_SAFETY_2026_RELEASE_ID),
  phase: phaseValidator,
  todayIso: v.string(),
  targetCount: v.literal(9),
  sourcesAbsent: v.number(),
  sourcesAwaitingHumanReview: v.array(v.string()),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  scannedLinkRows: v.number(),
  reverseDependencyCount: v.number(),
  reverseDependenciesExact: v.boolean(),
  blockers: v.array(v.string()),
  sources: v.array(sourceStateValidator),
  targets: v.array(targetStateValidator),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sourceSearchText(source: OlderSafetyStagedSource): string {
  return [
    source.org,
    source.title,
    source.authors ?? '',
    source.url,
    source.doi ?? '',
    source.isbn ?? '',
    ...source.keywords,
    ...source.topics,
  ].join(' ').toLowerCase();
}

function sourceMetadataMatches(
  row: Doc<'evidenceSources'>,
  expected: OlderSafetyStagedSource,
): boolean {
  return row.sourceId === expected.sourceId
    && row.org === expected.org
    && row.orgKey === expected.orgKey
    && row.title === expected.title
    && row.authors === expected.authors
    && row.year === expected.year
    && row.edition === expected.edition
    && row.country === expected.country
    && row.language === expected.language
    && row.url === expected.url
    && row.doi === expected.doi
    && row.isbn === expected.isbn
    && row.pmid === expected.pmid
    && row.evidenceLevel === expected.evidenceLevel
    && sameStrings(row.keywords, expected.keywords)
    && sameStrings(row.topics, expected.topics)
    && row.ageMonthsMin === expected.ageMonthsMin
    && row.ageMonthsMax === expected.ageMonthsMax
    && row.verifiedOn === expected.verifiedOn
    && row.verifiedNote === expected.verifiedNote
    && row.searchText === sourceSearchText(expected);
}

function contentIdentityMatches(
  row: Doc<'libraryContent'>,
  target: OlderSafetyTarget,
): boolean {
  return String(row._id) === target.contentId
    && row._creationTime === target.contentCreationTime
    && row.createdAt === target.contentCreatedAt
    && row.type === target.kind
    && row.slug === target.slug;
}

function linkIdentityMatches(
  row: Doc<'evidenceLinks'>,
  target: OlderSafetyTarget,
): boolean {
  return String(row._id) === target.linkId
    && row._creationTime === target.linkCreationTime
    && row.createdAt === target.linkCreatedAt
    && row.kind === target.kind
    && row.slug === target.slug;
}

function replaceExactlyTwice(value: string, before: string, after: string): string {
  if (value.split(before).length - 1 !== 2) {
    throw new Error(`Expected exactly two frozen search-text occurrences: ${before}`);
  }
  return value.split(before).join(after);
}

function desiredContentPatch(
  row: Doc<'libraryContent'>,
  target: OlderSafetyTarget,
  updatedAt: number,
): Partial<Doc<'libraryContent'>> {
  const common = {
    clinicalStatus: 'clinical_review',
    reviewRevision: target.contentInitialReviewRevision + 1,
    reviewerId: undefined,
    reviewerQualification: undefined,
    reviewerDisplayName: undefined,
    reviewScope: undefined,
    reviewedAt: undefined,
    nextReviewAt: undefined,
    reviewNote: undefined,
    updatedAt,
  } as const;
  if (target.slug !== 'gd_19_24m_safety') return common;

  if (!row.data || typeof row.data !== 'object' || Array.isArray(row.data)) {
    throw new Error('gd_19_24m_safety data is not an object');
  }
  const data = row.data as Record<string, unknown>;
  const why = data.why as { mm?: unknown; en?: unknown } | undefined;
  if (why?.mm !== GD_19_24M_SAFETY_INITIAL_COPY.mm
    || why.en !== GD_19_24M_SAFETY_INITIAL_COPY.en
    || row.summaryMm !== GD_19_24M_SAFETY_INITIAL_COPY.mm
    || row.summaryEn !== GD_19_24M_SAFETY_INITIAL_COPY.en) {
    throw new Error('gd_19_24m_safety frozen copy drifted');
  }

  let searchText = replaceExactlyTwice(
    row.searchText,
    GD_19_24M_SAFETY_INITIAL_COPY.mm.toLowerCase(),
    GD_19_24M_SAFETY_DESIRED_COPY.mm.toLowerCase(),
  );
  searchText = replaceExactlyTwice(
    searchText,
    GD_19_24M_SAFETY_INITIAL_COPY.en.toLowerCase(),
    GD_19_24M_SAFETY_DESIRED_COPY.en.toLowerCase(),
  );
  return {
    ...common,
    summaryMm: GD_19_24M_SAFETY_DESIRED_COPY.mm,
    summaryEn: GD_19_24M_SAFETY_DESIRED_COPY.en,
    data: {
      ...data,
      why: {
        mm: GD_19_24M_SAFETY_DESIRED_COPY.mm,
        en: GD_19_24M_SAFETY_DESIRED_COPY.en,
      },
      evidenceSummary: GD_19_24M_SAFETY_DESIRED_COPY.evidenceSummary,
    },
    searchText,
  };
}

type AuditedTarget = {
  slug: string;
  contentCanonicalSha256: string;
  linkCanonicalSha256: string;
};

type AuditedSource = {
  sourceId: string;
  rowId: string;
  canonicalSha256: string;
  reviewerId: string;
  reviewer: string;
  reviewerQualification: string;
  reviewScope: string;
  reviewDate: string;
  nextReviewDate: string | null;
};

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  targets: AuditedTarget[];
  sources: AuditedSource[];
};

function auditBeforeJson(): string {
  return JSON.stringify({
    targets: OLDER_SAFETY_2026_TARGETS.map((target) => ({
      slug: target.slug,
      contentId: target.contentId,
      contentCanonicalSha256: target.contentInitialCanonicalSha256,
      contentReviewRevision: target.contentInitialReviewRevision,
      linkId: target.linkId,
      linkCanonicalSha256: target.linkInitialCanonicalSha256,
      sourceIds: target.initialSourceIds,
      media: [],
      reviews: [],
      aiPublicationReleases: [],
      aiContentAudits: [],
    })),
    preservedSources: OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES,
    stagedSourceIds: OLDER_SAFETY_2026_STAGED_SOURCES.map((source) => source.sourceId),
    aap2021ReverseDependencyKeys: AAP_DROWNING_2021_INITIAL_REVERSE_KEYS,
    scannedLinkBound: maxLinkRows,
  });
}

function auditAfterJson(
  updatedAt: number,
  targets: readonly AuditedTarget[],
  sources: readonly AuditedSource[],
): string {
  return JSON.stringify({
    updatedAt,
    targets: OLDER_SAFETY_2026_TARGETS.map((target) => {
      const audited = targets.find((candidate) => candidate.slug === target.slug);
      if (!audited) throw new Error(`Missing audited target: ${target.slug}`);
      return {
        slug: target.slug,
        contentId: target.contentId,
        contentCanonicalSha256: audited.contentCanonicalSha256,
        contentReviewRevision: target.contentInitialReviewRevision + 1,
        linkId: target.linkId,
        linkCanonicalSha256: audited.linkCanonicalSha256,
        sourceIds: target.desiredSourceIds,
      };
    }),
    approvedSources: sources,
    oldAapSourcePreserved: OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES[0],
    aap2021ReverseDependencyKeys: AAP_DROWNING_2021_DESIRED_REVERSE_KEYS,
    reviewDimensionsOutstanding: OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS,
    publicationDecision: 'not_made',
    genericImportsProtected: true,
  });
}

async function releaseAuditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction)).take(2);
  if (rows.length !== 1) {
    return { rows: rows.length, exact: false, updatedAt: null, targets: [], sources: [] };
  }
  const row = rows[0];
  let updatedAt: number | null = null;
  let targets: AuditedTarget[] = [];
  let sources: AuditedSource[] = [];
  try {
    const parsed = JSON.parse(row.after ?? '{}') as Record<string, unknown>;
    if (typeof parsed.updatedAt !== 'number'
      || !Array.isArray(parsed.targets)
      || !Array.isArray(parsed.approvedSources)) throw new Error('malformed audit');
    updatedAt = parsed.updatedAt;
    targets = parsed.targets.map((value) => {
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.slug !== 'string'
        || typeof candidate.contentCanonicalSha256 !== 'string'
        || typeof candidate.linkCanonicalSha256 !== 'string') throw new Error('bad target');
      return {
        slug: candidate.slug,
        contentCanonicalSha256: candidate.contentCanonicalSha256,
        linkCanonicalSha256: candidate.linkCanonicalSha256,
      };
    });
    sources = parsed.approvedSources.map((value) => {
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.sourceId !== 'string'
        || typeof candidate.rowId !== 'string'
        || typeof candidate.canonicalSha256 !== 'string'
        || typeof candidate.reviewerId !== 'string'
        || typeof candidate.reviewer !== 'string'
        || typeof candidate.reviewerQualification !== 'string'
        || typeof candidate.reviewScope !== 'string'
        || typeof candidate.reviewDate !== 'string'
        || (candidate.nextReviewDate !== null
          && typeof candidate.nextReviewDate !== 'string')) throw new Error('bad source');
      return {
        sourceId: candidate.sourceId,
        rowId: candidate.rowId,
        canonicalSha256: candidate.canonicalSha256,
        reviewerId: candidate.reviewerId,
        reviewer: candidate.reviewer,
        reviewerQualification: candidate.reviewerQualification,
        reviewScope: candidate.reviewScope,
        reviewDate: candidate.reviewDate,
        nextReviewDate: candidate.nextReviewDate,
      };
    });
  } catch {
    updatedAt = null;
    targets = [];
    sources = [];
  }
  const exact = updatedAt !== null
    && targets.length === OLDER_SAFETY_2026_TARGETS.length
    && sources.length === OLDER_SAFETY_2026_STAGED_SOURCES.length
    && row.actorId === undefined
    && row.entityTable === 'libraryContent,evidenceLinks,evidenceSources'
    && row.entityId === undefined
    && row.summary === OLDER_SAFETY_2026_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, targets, sources);
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    targets: exact ? targets : [],
    sources: exact ? sources : [],
  };
}

async function inspectSources(ctx: DatabaseContext, todayIso: string) {
  const staged = await Promise.all(OLDER_SAFETY_2026_STAGED_SOURCES.map(async (expected) => {
    const rows = await ctx.db.query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId)).take(2);
    const row = rows.length === 1 ? rows[0] : null;
    const canonicalSha256 = row ? await sha256Canonical(row) : null;
    const metadataExact = Boolean(row && sourceMetadataMatches(row, expected));
    const eligible = Boolean(row
      && metadataExact
      && row.reviewStatus === 'approved'
      && row.reviewerId
      && row.reviewer?.trim()
      && row.reviewerQualification?.trim()
      && row.reviewScope
      && row.reviewDate
      && publicationEvidenceIsEligible(row, todayIso));
    return {
      row,
      expected,
      canonicalSha256,
      public: {
        sourceId: expected.sourceId,
        rows: rows.length,
        rowId: row ? String(row._id) : null,
        metadataExact,
        initialExact: false,
        reviewStatus: row?.reviewStatus ?? null,
        reviewScope: row?.reviewScope ?? null,
        reviewerId: row?.reviewerId ? String(row.reviewerId) : null,
        reviewerQualification: row?.reviewerQualification ?? null,
        reviewDate: row?.reviewDate ?? null,
        eligible,
      },
    };
  }));
  const existing = await Promise.all(OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES.map(
    async (expected) => {
      const rows = await ctx.db.query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId)).take(2);
      const row = rows.length === 1 ? rows[0] : null;
      const canonicalSha256 = row ? await sha256Canonical(row) : null;
      const initialExact = Boolean(row
        && String(row._id) === expected.rowId
        && row._creationTime === expected.creationTime
        && canonicalSha256 === expected.canonicalSha256);
      return {
        row,
        expected: null,
        canonicalSha256,
        public: {
          sourceId: expected.sourceId,
          rows: rows.length,
          rowId: row ? String(row._id) : null,
          metadataExact: initialExact,
          initialExact,
          reviewStatus: row?.reviewStatus ?? null,
          reviewScope: row?.reviewScope ?? null,
          reviewerId: row?.reviewerId ? String(row.reviewerId) : null,
          reviewerQualification: row?.reviewerQualification ?? null,
          reviewDate: row?.reviewDate ?? null,
          eligible: Boolean(row && initialExact
            && row.reviewStatus === 'approved'
            && publicationEvidenceIsEligible(row, todayIso)),
        },
      };
    },
  ));
  return [...existing, ...staged];
}

function targetHasExactAgeSource(
  target: OlderSafetyTarget,
  sourceRows: ReadonlyMap<string, Doc<'evidenceSources'>>,
): boolean {
  const requiredId = target.ageMonthsMin >= 36
    ? CDC_PRESCHOOL_SOURCE_ID
    : CDC_TODDLER_SOURCE_ID;
  const source = sourceRows.get(requiredId);
  return Boolean(source
    && source.ageMonthsMin !== null
    && source.ageMonthsMin <= target.ageMonthsMin
    && source.ageMonthsMax !== null
    && source.ageMonthsMax >= target.ageMonthsMax);
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const todayIso = todayIsoUtc(new Date(now));
  const [audit, sources, allLinks] = await Promise.all([
    releaseAuditState(ctx),
    inspectSources(ctx, todayIso),
    ctx.db.query('evidenceLinks').take(maxLinkRows + 1),
  ]);
  const sourceRows = new Map(sources.flatMap((source) =>
    source.row ? [[source.public.sourceId, source.row] as const] : []));
  const reverseKeys = allLinks.filter((link) =>
    link.sourceIds.includes(AAP_DROWNING_2021_SOURCE_ID))
    .map((link) => `${link.kind}:${link.slug}`)
    .sort((left, right) => left.localeCompare(right));
  const expectedReverseKeys = audit.exact
    ? AAP_DROWNING_2021_DESIRED_REVERSE_KEYS
    : AAP_DROWNING_2021_INITIAL_REVERSE_KEYS;
  const reverseDependenciesExact = allLinks.length <= maxLinkRows
    && sameStrings(reverseKeys, expectedReverseKeys);

  const inspectedTargets = await Promise.all(OLDER_SAFETY_2026_TARGETS.map(async (target) => {
    const [contentRows, linkRows, mediaRows, reviewRows, aiReleaseRows, aiAuditRows] =
      await Promise.all([
        ctx.db.query('libraryContent').withIndex('by_slug', (q) => q
          .eq('slug', target.slug)).take(2),
        ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
          .eq('kind', target.kind).eq('slug', target.slug)).take(2),
        ctx.db.query('libraryMedia').withIndex('by_content', (q) => q
          .eq('contentSlug', target.slug)).take(maxRelatedRows + 1),
        ctx.db.query('contentReviews').withIndex('by_content', (q) => q
          .eq('contentSlug', target.slug)).take(maxRelatedRows + 1),
        ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
          .eq('targetKey', `${target.kind}:${target.slug}`)).take(2),
        ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) => q
          .eq('contentSlug', target.slug)).take(maxRelatedRows + 1),
      ]);
    const content = contentRows.length === 1 ? contentRows[0] : null;
    const link = linkRows.length === 1 ? linkRows[0] : null;
    const [contentHash, linkHash] = await Promise.all([
      content ? sha256Canonical(content) : null,
      link ? sha256Canonical(link) : null,
    ]);
    const audited = audit.targets.find((candidate) => candidate.slug === target.slug);
    const contentInitialMatches = Boolean(content
      && contentIdentityMatches(content, target)
      && content.clinicalStatus === 'clinical_review'
      && content.reviewRevision === target.contentInitialReviewRevision
      && content.updatedAt === target.contentInitialUpdatedAt
      && content.aiPublicationReleaseId === undefined
      && content.aiPublishedAt === undefined
      && contentHash === target.contentInitialCanonicalSha256);
    const contentDesiredMatches = Boolean(content && audited && audit.updatedAt !== null
      && contentIdentityMatches(content, target)
      && content.clinicalStatus === 'clinical_review'
      && content.reviewRevision === target.contentInitialReviewRevision + 1
      && content.updatedAt === audit.updatedAt
      && content.reviewerId === undefined
      && content.reviewerQualification === undefined
      && content.reviewerDisplayName === undefined
      && content.reviewScope === undefined
      && content.reviewedAt === undefined
      && content.nextReviewAt === undefined
      && content.reviewNote === undefined
      && content.aiPublicationReleaseId === undefined
      && content.aiPublishedAt === undefined
      && contentHash === audited.contentCanonicalSha256);
    const linkInitialMatches = Boolean(link
      && linkIdentityMatches(link, target)
      && link.updatedAt === target.linkInitialUpdatedAt
      && sameStrings(link.sourceIds, target.initialSourceIds)
      && linkHash === target.linkInitialCanonicalSha256);
    const linkDesiredMatches = Boolean(link && audited && audit.updatedAt !== null
      && linkIdentityMatches(link, target)
      && link.updatedAt === audit.updatedAt
      && sameStrings(link.sourceIds, target.desiredSourceIds)
      && linkHash === audited.linkCanonicalSha256);
    return {
      target,
      content,
      link,
      public: {
        slug: target.slug,
        contentRows: contentRows.length,
        linkRows: linkRows.length,
        contentInitialMatches,
        contentDesiredMatches,
        linkInitialMatches,
        linkDesiredMatches,
        ageCovered: targetHasExactAgeSource(target, sourceRows),
        mediaRows: mediaRows.length,
        reviewRows: reviewRows.length,
        aiReleaseRows: aiReleaseRows.length,
        aiAuditRows: aiAuditRows.length,
      },
    };
  }));

  const blockers: string[] = [];
  if (allLinks.length > maxLinkRows) blockers.push('evidence-link scan exceeded safety bound');
  if (!reverseDependenciesExact) blockers.push('AAP 2021 reverse dependencies drifted');
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  for (const source of sources.filter((candidate) => candidate.expected === null)) {
    if (!source.public.initialExact) blockers.push(`existing source drifted: ${source.public.sourceId}`);
    if (!source.public.eligible) blockers.push(`existing source is not eligible: ${source.public.sourceId}`);
  }
  for (const source of sources.filter((candidate) => candidate.expected !== null)) {
    if (source.public.rows > 0 && !source.public.metadataExact) {
      blockers.push(`staged source metadata drifted: ${source.public.sourceId}`);
    }
    if (audit.exact) {
      const audited = audit.sources.find(
        (candidate) => candidate.sourceId === source.public.sourceId,
      );
      if (!audited
        || !source.row
        || !source.public.eligible
        || String(source.row._id) !== audited.rowId
        || source.canonicalSha256 !== audited.canonicalSha256
        || String(source.row.reviewerId) !== audited.reviewerId
        || source.row.reviewer !== audited.reviewer
        || source.row.reviewerQualification !== audited.reviewerQualification
        || source.row.reviewScope !== audited.reviewScope
        || source.row.reviewDate !== audited.reviewDate
        || source.row.nextReviewDate !== audited.nextReviewDate) {
        blockers.push(`approved staged source postimage drifted: ${source.public.sourceId}`);
      }
    }
  }
  for (const target of inspectedTargets) {
    const state = target.public;
    if (state.contentRows !== 1) blockers.push(`content row count is not one: ${state.slug}`);
    if (state.linkRows !== 1) blockers.push(`link row count is not one: ${state.slug}`);
    if (state.mediaRows !== 0) blockers.push(`media preimage drifted: ${state.slug}`);
    if (state.reviewRows !== 0) blockers.push(`review preimage drifted: ${state.slug}`);
    if (state.aiReleaseRows !== 0) blockers.push(`AI release preimage drifted: ${state.slug}`);
    if (state.aiAuditRows !== 0) blockers.push(`AI audit preimage drifted: ${state.slug}`);
  }

  const sourcesAbsent = sources.filter((source) => source.expected !== null
    && source.public.rows === 0).length;
  const sourcesAwaitingHumanReview = sources.filter((source) => source.expected !== null
    && source.public.rows === 1
    && source.public.metadataExact
    && !source.public.eligible).map((source) => source.public.sourceId);
  const allInitial = inspectedTargets.every((target) =>
    target.public.contentInitialMatches && target.public.linkInitialMatches);
  const allDesired = inspectedTargets.every((target) =>
    target.public.contentDesiredMatches && target.public.linkDesiredMatches);
  const allAgeCovered = inspectedTargets.every((target) => target.public.ageCovered);
  const allNewEligible = sources.filter((source) => source.expected !== null)
    .every((source) => source.public.eligible);

  let phase: 'sources_absent' | 'source_review_required' | 'ready' | 'blocked' | 'applied' =
    'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact && allDesired) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0 && allInitial) {
    if (sourcesAbsent === OLDER_SAFETY_2026_STAGED_SOURCES.length) phase = 'sources_absent';
    else if (sourcesAbsent === 0 && sourcesAwaitingHumanReview.length > 0) {
      phase = 'source_review_required';
    } else if (sourcesAbsent === 0 && allNewEligible && allAgeCovered) phase = 'ready';
  }
  if (phase === 'blocked' && audit.rows === 0 && !allInitial) {
    blockers.push('one or more content/link Production preimages drifted');
  }
  if (phase === 'blocked' && audit.rows === 1 && audit.exact && !allDesired) {
    blockers.push('release audit exists but one or more postimages drifted');
  }
  if (phase === 'blocked' && sourcesAbsent > 0
    && sourcesAbsent !== OLDER_SAFETY_2026_STAGED_SOURCES.length) {
    blockers.push('staged source set is partial');
  }
  if (phase === 'blocked' && !allAgeCovered && sourcesAbsent === 0) {
    blockers.push('one or more target age bands lack exact age-matched evidence');
  }

  return {
    releaseId: OLDER_SAFETY_2026_RELEASE_ID,
    phase,
    todayIso,
    targetCount: 9 as const,
    sourcesAbsent,
    sourcesAwaitingHumanReview,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    scannedLinkRows: allLinks.length,
    reverseDependencyCount: reverseKeys.length,
    reverseDependenciesExact,
    blockers,
    sources: sources.map((source) => source.public),
    targets: inspectedTargets.map((target) => target.public),
    _private: { audit, sources, inspectedTargets },
  };
}

export const preflight = internalQuery({
  args: { now: v.optional(v.number()) },
  returns: preflightResultValidator,
  handler: async (ctx, args) => {
    const { _private, ...result } = await preflightState(ctx, args.now ?? Date.now());
    void _private;
    return result;
  },
});

export const stageSources = internalMutation({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    code: v.union(
      v.literal('staged'),
      v.literal('already_staged'),
      v.literal('blocked'),
    ),
    inserted: v.number(),
    blockers: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const rows = await Promise.all(OLDER_SAFETY_2026_STAGED_SOURCES.map(
      async (source) => ctx.db.query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', source.sourceId)).take(2),
    ));
    const counts = rows.map((sourceRows) => sourceRows.length);
    if (counts.every((count) => count === 1)) {
      const exact = rows.every((sourceRows, index) =>
        sourceMetadataMatches(sourceRows[0], OLDER_SAFETY_2026_STAGED_SOURCES[index]));
      return exact
        ? { ok: true, code: 'already_staged' as const, inserted: 0, blockers: [] }
        : {
            ok: false,
            code: 'blocked' as const,
            inserted: 0,
            blockers: ['one or more staged source metadata rows drifted'],
          };
    }
    if (!counts.every((count) => count === 0)) {
      return {
        ok: false,
        code: 'blocked' as const,
        inserted: 0,
        blockers: ['source staging is partial or duplicated'],
      };
    }

    const now = Date.now();
    const inserted: Array<{ sourceId: string; rowId: string; canonicalSha256: string }> = [];
    for (const source of OLDER_SAFETY_2026_STAGED_SOURCES) {
      const rowId = await ctx.db.insert('evidenceSources', {
        ...source,
        keywords: [...source.keywords],
        topics: [...source.topics],
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewDate: null,
        nextReviewDate: null,
        searchText: sourceSearchText(source),
        createdAt: now,
        updatedAt: now,
      });
      const row = await ctx.db.get(rowId);
      if (!row) throw new Error(`Staged source disappeared: ${source.sourceId}`);
      inserted.push({
        sourceId: source.sourceId,
        rowId: String(rowId),
        canonicalSha256: await sha256Canonical(row),
      });
    }
    await logAudit(
      ctx,
      null,
      sourceStageAction,
      'evidenceSources',
      undefined,
      OLDER_SAFETY_2026_RELEASE_ID,
      {
        result: 'ok',
        before: JSON.stringify({ absentSourceIds: OLDER_SAFETY_2026_STAGED_SOURCES
          .map((source) => source.sourceId) }),
        after: JSON.stringify({
          inserted,
          reviewStatus: 'awaiting_review',
          humanApprovalRequired: true,
        }),
      },
    );
    return { ok: true, code: 'staged' as const, inserted: inserted.length, blockers: [] };
  },
});

export const apply = internalMutation({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    phase: phaseValidator,
    updated: v.number(),
    blockers: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const state = await preflightState(ctx, Date.now());
    if (state.phase === 'applied') {
      return { ok: true, phase: 'applied' as const, updated: 0, blockers: [] };
    }
    if (state.phase !== 'ready') {
      const blockers = [...state.blockers];
      if (state.phase === 'sources_absent') blockers.push('stage exact sources first');
      if (state.phase === 'source_review_required') {
        blockers.push(`explicit human source review required: ${state.sourcesAwaitingHumanReview.join(', ')}`);
      }
      return { ok: false, phase: state.phase, updated: 0, blockers };
    }

    const now = Date.now();
    const auditedTargets: AuditedTarget[] = [];
    for (const inspected of state._private.inspectedTargets) {
      if (!inspected.content || !inspected.link) {
        throw new Error(`Missing frozen target: ${inspected.target.slug}`);
      }
      const contentPatch = desiredContentPatch(inspected.content, inspected.target, now);
      const linkPatch = { sourceIds: [...inspected.target.desiredSourceIds], updatedAt: now };
      await ctx.db.patch(inspected.content._id, contentPatch);
      await ctx.db.patch(inspected.link._id, linkPatch);
      auditedTargets.push({
        slug: inspected.target.slug,
        contentCanonicalSha256: await sha256Canonical({ ...inspected.content, ...contentPatch }),
        linkCanonicalSha256: await sha256Canonical({ ...inspected.link, ...linkPatch }),
      });
    }
    const auditedSources: AuditedSource[] = await Promise.all(state._private.sources
      .filter((source) => source.expected !== null)
      .map(async (source) => {
        if (!source.row?.reviewerId
          || !source.row.reviewer?.trim()
          || !source.row.reviewerQualification?.trim()
          || !source.row.reviewScope
          || !source.row.reviewDate) {
          throw new Error(`Approved source identity disappeared: ${source.public.sourceId}`);
        }
        return {
          sourceId: source.public.sourceId,
          rowId: String(source.row._id),
          canonicalSha256: await sha256Canonical(source.row),
          reviewerId: String(source.row.reviewerId),
          reviewer: source.row.reviewer,
          reviewerQualification: source.row.reviewerQualification,
          reviewScope: source.row.reviewScope,
          reviewDate: source.row.reviewDate,
          nextReviewDate: source.row.nextReviewDate,
        };
      }));
    await logAudit(
      ctx,
      null,
      releaseAction,
      'libraryContent,evidenceLinks,evidenceSources',
      undefined,
      OLDER_SAFETY_2026_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, auditedTargets, auditedSources),
      },
    );
    return {
      ok: true,
      phase: 'applied' as const,
      updated: OLDER_SAFETY_2026_TARGETS.length,
      blockers: [],
    };
  },
});
