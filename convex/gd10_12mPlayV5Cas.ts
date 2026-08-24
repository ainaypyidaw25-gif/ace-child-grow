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
import { evaluatePublicationEvidence } from './lib/evidencePublicationGate';
import {
  GD10_12M_PLAY_V5_CONTENT_PREIMAGE,
  GD10_12M_PLAY_V5_DESIRED_CONTENT,
  GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS,
  GD10_12M_PLAY_V5_FIXTURE_SHA256,
  GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS,
  GD10_12M_PLAY_V5_LINK_PREIMAGE,
  GD10_12M_PLAY_V5_MEDIA_PREIMAGES,
  GD10_12M_PLAY_V5_RELEASE_ACTION,
  GD10_12M_PLAY_V5_RELEASE_ID,
  GD10_12M_PLAY_V5_REQUIRED_REVIEWS,
  GD10_12M_PLAY_V5_REVERSE_PREIMAGES,
  GD10_12M_PLAY_V5_REVIEW_PREIMAGES,
  GD10_12M_PLAY_V5_SOURCE_PREIMAGES,
  GD10_12M_PLAY_V5_SOURCE_UNION_IDS,
  GD10_12M_PLAY_V5_TARGET,
  type Gd10_12mPlayV5ExactPreimage,
} from './lib/gd10_12mPlayV5CasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
const maxLinkRows = 5_000;
const targetKey = `${GD10_12M_PLAY_V5_TARGET.kind}:${GD10_12M_PLAY_V5_TARGET.slug}`;

const reverseResultValidator = v.object({
  sourceId: v.string(),
  rows: v.number(),
  canonicalSha256: v.string(),
  keys: v.array(v.string()),
  initialExact: v.boolean(),
  desiredExact: v.boolean(),
});

const resultValidator = v.object({
  releaseId: v.literal(GD10_12M_PLAY_V5_RELEASE_ID),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  blockers: v.array(v.string()),
  todayIso: v.string(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  contentRows: v.number(),
  contentInitialExact: v.boolean(),
  contentDesiredExact: v.boolean(),
  contentReviewRevision: v.union(v.number(), v.null()),
  linkRows: v.number(),
  linkInitialExact: v.boolean(),
  linkDesiredExact: v.boolean(),
  sourceRows: v.number(),
  sourcesExact: v.boolean(),
  citationsEligible: v.boolean(),
  reviewRows: v.number(),
  reviewsExact: v.boolean(),
  revision4ReviewRows: v.number(),
  revision5ReviewRows: v.number(),
  revision5Approvals: v.number(),
  mediaRows: v.number(),
  mediaExact: v.boolean(),
  aiContentAuditRows: v.number(),
  aiEvidenceAuditRows: v.number(),
  aiPublicationReleaseRows: v.number(),
  aiAuditRunRows: v.number(),
  allLinksRows: v.number(),
  allLinksBounded: v.boolean(),
  reverseDependencies: v.array(reverseResultValidator),
  outstandingRequiredReviews: v.array(v.string()),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sortedStrings(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

async function rowMatches(
  row: { _id: unknown; _creationTime: number },
  expected: Gd10_12mPlayV5ExactPreimage,
): Promise<boolean> {
  const [actualHash, fixtureHash] = await Promise.all([
    sha256Canonical(row),
    sha256Canonical(expected.document),
  ]);
  return String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && fixtureHash === expected.exactCanonicalSha256
    && actualHash === expected.exactCanonicalSha256;
}

async function rowsMatch(
  rows: Array<{ _id: unknown; _creationTime: number }>,
  expectedRows: readonly Gd10_12mPlayV5ExactPreimage[],
): Promise<boolean> {
  if (rows.length !== expectedRows.length) return false;
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  for (const expected of expectedRows) {
    const row = byId.get(expected.rowId);
    if (!row || !await rowMatches(row, expected)) return false;
  }
  return true;
}

function authoredSnapshot(row: Partial<Doc<'libraryContent'>>): Record<string, unknown> {
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

function contentIdentityMatches(row: Doc<'libraryContent'>): boolean {
  return String(row._id) === GD10_12M_PLAY_V5_TARGET.contentId
    && row._creationTime === GD10_12M_PLAY_V5_TARGET.contentCreationTime
    && row.createdAt === GD10_12M_PLAY_V5_TARGET.contentCreatedAt
    && row.type === GD10_12M_PLAY_V5_TARGET.kind
    && row.slug === GD10_12M_PLAY_V5_TARGET.slug;
}

function linkIdentityMatches(row: Doc<'evidenceLinks'>): boolean {
  return String(row._id) === GD10_12M_PLAY_V5_TARGET.linkId
    && row._creationTime === GD10_12M_PLAY_V5_TARGET.linkCreationTime
    && row.createdAt === GD10_12M_PLAY_V5_TARGET.linkCreatedAt
    && row.kind === GD10_12M_PLAY_V5_TARGET.kind
    && row.slug === GD10_12M_PLAY_V5_TARGET.slug;
}

function desiredReverseKeys(sourceId: string): string[] {
  const initial = GD10_12M_PLAY_V5_REVERSE_PREIMAGES
    .find((row) => row.sourceId === sourceId)?.keys ?? [];
  const desired = new Set(initial);
  if ((GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS as readonly string[]).includes(sourceId)) {
    desired.add(targetKey);
  } else {
    desired.delete(targetKey);
  }
  return sortedStrings([...desired]);
}

type ReverseState = {
  sourceId: string;
  rows: number;
  canonicalSha256: string;
  keys: string[];
};

async function inspectReverseDependencies(
  allLinks: Doc<'evidenceLinks'>[],
): Promise<ReverseState[]> {
  const sorted = [...allLinks].sort((left, right) =>
    String(left._id).localeCompare(String(right._id)));
  return await Promise.all(GD10_12M_PLAY_V5_SOURCE_UNION_IDS.map(async (sourceId) => {
    const rows = sorted.filter((row) => row.sourceIds.includes(sourceId));
    return {
      sourceId,
      rows: rows.length,
      canonicalSha256: await sha256Canonical(rows),
      keys: sortedStrings(rows.map((row) => `${row.kind}:${row.slug}`)),
    };
  }));
}

type AuditedReverse = {
  sourceId: string;
  rows: number;
  canonicalSha256: string;
};

function auditBeforeJson(): string {
  return JSON.stringify({
    content: {
      rowId: GD10_12M_PLAY_V5_CONTENT_PREIMAGE.rowId,
      canonicalSha256: GD10_12M_PLAY_V5_CONTENT_PREIMAGE.exactCanonicalSha256,
      reviewRevision: GD10_12M_PLAY_V5_TARGET.contentInitialReviewRevision,
      updatedAt: GD10_12M_PLAY_V5_TARGET.contentInitialUpdatedAt,
    },
    link: {
      rowId: GD10_12M_PLAY_V5_LINK_PREIMAGE.rowId,
      canonicalSha256: GD10_12M_PLAY_V5_LINK_PREIMAGE.exactCanonicalSha256,
      sourceIds: GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS,
      updatedAt: GD10_12M_PLAY_V5_TARGET.linkInitialUpdatedAt,
    },
    sources: GD10_12M_PLAY_V5_SOURCE_PREIMAGES.map((row) => ({
      sourceId: row.sourceId,
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    reverseDependencies: GD10_12M_PLAY_V5_REVERSE_PREIMAGES.map((row) => ({
      sourceId: row.sourceId,
      rows: row.count,
      canonicalSha256: row.canonicalSha256,
      keys: row.keys,
    })),
    reviews: GD10_12M_PLAY_V5_REVIEW_PREIMAGES.map((row) => ({
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    revision4Reviews: [],
    media: [],
    ai: {
      contentAudits: [],
      evidenceAudits: [],
      publicationReleases: [],
      auditRuns: [],
    },
    allLinkScanBound: maxLinkRows,
    fixtureSha256: GD10_12M_PLAY_V5_FIXTURE_SHA256,
  });
}

function auditAfterJson(input: {
  updatedAt: number;
  contentHash: string;
  linkHash: string;
  reverseDependencies: readonly AuditedReverse[];
}): string {
  return JSON.stringify({
    updatedAt: input.updatedAt,
    content: {
      rowId: GD10_12M_PLAY_V5_TARGET.contentId,
      canonicalSha256: input.contentHash,
      clinicalStatus: 'clinical_review',
      reviewRevision: GD10_12M_PLAY_V5_TARGET.contentDesiredReviewRevision,
    },
    link: {
      rowId: GD10_12M_PLAY_V5_TARGET.linkId,
      canonicalSha256: input.linkHash,
      sourceIds: GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS,
    },
    sourcesPreserved: GD10_12M_PLAY_V5_SOURCE_PREIMAGES.map((row) => ({
      sourceId: row.sourceId,
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    reverseDependencies: input.reverseDependencies.map((row) => ({
      ...row,
      keys: desiredReverseKeys(row.sourceId),
    })),
    reviewsPreserved: GD10_12M_PLAY_V5_REVIEW_PREIMAGES.map((row) => ({
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    revision5Approvals: 0,
    outstandingRequiredReviews: GD10_12M_PLAY_V5_REQUIRED_REVIEWS,
    mediaPreserved: [],
    aiCreated: false,
    publicationDecision: 'not_made',
    genericImportsProtected: true,
    fixtureSha256: GD10_12M_PLAY_V5_FIXTURE_SHA256,
  });
}

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  contentHash: string | null;
  linkHash: string | null;
  reverseDependencies: AuditedReverse[];
};

async function releaseAuditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', GD10_12M_PLAY_V5_RELEASE_ACTION)).take(2);
  if (rows.length !== 1) {
    return {
      rows: rows.length,
      exact: false,
      updatedAt: null,
      contentHash: null,
      linkHash: null,
      reverseDependencies: [],
    };
  }
  const row = rows[0];
  let updatedAt: number | null = null;
  let contentHash: string | null = null;
  let linkHash: string | null = null;
  let reverseDependencies: AuditedReverse[] = [];
  try {
    const parsed = JSON.parse(row.after ?? '{}') as Record<string, unknown>;
    const content = parsed.content as Record<string, unknown> | undefined;
    const link = parsed.link as Record<string, unknown> | undefined;
    if (typeof parsed.updatedAt !== 'number'
      || typeof content?.canonicalSha256 !== 'string'
      || typeof link?.canonicalSha256 !== 'string'
      || !Array.isArray(parsed.reverseDependencies)) throw new Error('malformed audit');
    updatedAt = parsed.updatedAt;
    contentHash = content.canonicalSha256;
    linkHash = link.canonicalSha256;
    reverseDependencies = parsed.reverseDependencies.map((value) => {
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.sourceId !== 'string'
        || typeof candidate.rows !== 'number'
        || typeof candidate.canonicalSha256 !== 'string') throw new Error('bad reverse row');
      return {
        sourceId: candidate.sourceId,
        rows: candidate.rows,
        canonicalSha256: candidate.canonicalSha256,
      };
    });
  } catch {
    updatedAt = null;
    contentHash = null;
    linkHash = null;
    reverseDependencies = [];
  }
  const exact = updatedAt !== null
    && contentHash !== null
    && linkHash !== null
    && reverseDependencies.length === GD10_12M_PLAY_V5_SOURCE_UNION_IDS.length
    && row.actorId === undefined
    && row.entityTable === 'libraryContent,evidenceLinks'
    && row.entityId === undefined
    && row.summary === GD10_12M_PLAY_V5_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson({
      updatedAt,
      contentHash,
      linkHash,
      reverseDependencies,
    });
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    contentHash: exact ? contentHash : null,
    linkHash: exact ? linkHash : null,
    reverseDependencies: exact ? reverseDependencies : [],
  };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const [audit, contentRows, linkRows, reviewRows, mediaRows, contentAudits,
    publicationReleases, allLinks] = await Promise.all([
    releaseAuditState(ctx),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) =>
      q.eq('slug', GD10_12M_PLAY_V5_TARGET.slug)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', GD10_12M_PLAY_V5_TARGET.kind)
      .eq('slug', GD10_12M_PLAY_V5_TARGET.slug)).take(2),
    ctx.db.query('contentReviews').withIndex('by_content', (q) =>
      q.eq('contentSlug', GD10_12M_PLAY_V5_TARGET.slug))
      .take(GD10_12M_PLAY_V5_REVIEW_PREIMAGES.length + 1),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) =>
      q.eq('contentSlug', GD10_12M_PLAY_V5_TARGET.slug))
      .take(GD10_12M_PLAY_V5_MEDIA_PREIMAGES.length + 1),
    ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) =>
      q.eq('contentSlug', GD10_12M_PLAY_V5_TARGET.slug)).take(1),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
      q.eq('targetKey', targetKey)).take(1),
    ctx.db.query('evidenceLinks').take(maxLinkRows + 1),
  ]);

  const sourceResults = await Promise.all(GD10_12M_PLAY_V5_SOURCE_PREIMAGES.map(
    async (expected) => {
      const [rows, evidenceAudits] = await Promise.all([
        ctx.db.query('evidenceSources').withIndex('by_source_id', (q) =>
          q.eq('sourceId', expected.sourceId)).take(2),
        ctx.db.query('aiEvidenceAudits').withIndex('by_source_and_updated_at', (q) =>
          q.eq('sourceId', expected.sourceId)).take(1),
      ]);
      return {
        expected,
        rows,
        evidenceAudits,
        exact: rows.length === 1 && await rowMatches(rows[0], expected),
      };
    },
  ));

  const sources = sourceResults.flatMap((result) => result.rows);
  const aiEvidenceAudits = sourceResults.flatMap((result) => result.evidenceAudits);
  const relevantRunIds = [...new Set([
    ...contentAudits.map((row) => row.runId),
    ...aiEvidenceAudits.map((row) => row.runId),
    ...publicationReleases.flatMap((row) => [
      row.contentAuditRunId,
      ...row.sourceSnapshots.map((source) => source.evidenceAuditRunId),
    ]),
  ])];
  const aiRunResults = await Promise.all(relevantRunIds.map(async (runId) =>
    await ctx.db.query('aiAuditRuns').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2)));
  const aiAuditRuns = aiRunResults.flat();

  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  const [contentHash, linkHash] = await Promise.all([
    content ? sha256Canonical(content) : null,
    link ? sha256Canonical(link) : null,
  ]);
  const contentInitialExact = Boolean(content
    && await rowMatches(content, GD10_12M_PLAY_V5_CONTENT_PREIMAGE)
    && content.reviewRevision === GD10_12M_PLAY_V5_TARGET.contentInitialReviewRevision
    && content.updatedAt === GD10_12M_PLAY_V5_TARGET.contentInitialUpdatedAt);
  const contentDesiredExact = Boolean(content
    && audit.updatedAt !== null
    && contentIdentityMatches(content)
    && canonicalJson(authoredSnapshot(content))
      === canonicalJson(authoredSnapshot(GD10_12M_PLAY_V5_DESIRED_CONTENT))
    && content.searchText === GD10_12M_PLAY_V5_DESIRED_CONTENT.searchText
    && sameStrings(content.requiredReviewDimensions ?? [], GD10_12M_PLAY_V5_REQUIRED_REVIEWS)
    && content.clinicalStatus === 'clinical_review'
    && content.reviewRevision === GD10_12M_PLAY_V5_TARGET.contentDesiredReviewRevision
    && content.reviewerId === undefined
    && content.reviewerQualification === undefined
    && content.reviewerDisplayName === undefined
    && content.reviewScope === undefined
    && content.reviewedAt === undefined
    && content.nextReviewAt === undefined
    && content.reviewNote === undefined
    && content.aiPublicationReleaseId === undefined
    && content.aiPublishedAt === undefined
    && content.updatedAt === audit.updatedAt
    && contentHash === audit.contentHash);

  const linkInitialExact = Boolean(link
    && await rowMatches(link, GD10_12M_PLAY_V5_LINK_PREIMAGE)
    && linkIdentityMatches(link)
    && link.updatedAt === GD10_12M_PLAY_V5_TARGET.linkInitialUpdatedAt
    && sameStrings(link.sourceIds, GD10_12M_PLAY_V5_INITIAL_SOURCE_IDS));
  const linkDesiredExact = Boolean(link
    && audit.updatedAt !== null
    && linkIdentityMatches(link)
    && link.updatedAt === audit.updatedAt
    && sameStrings(link.sourceIds, GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS)
    && linkHash === audit.linkHash);

  const reviewsExact = await rowsMatch(reviewRows, GD10_12M_PLAY_V5_REVIEW_PREIMAGES);
  const mediaExact = await rowsMatch(mediaRows, GD10_12M_PLAY_V5_MEDIA_PREIMAGES);
  const revision4Reviews = reviewRows.filter((row) =>
    row.reviewRevision === GD10_12M_PLAY_V5_TARGET.contentInitialReviewRevision
      || row.contentVersion === GD10_12M_PLAY_V5_TARGET.contentInitialReviewRevision);
  const revision5Reviews = reviewRows.filter((row) =>
    row.reviewRevision === GD10_12M_PLAY_V5_TARGET.contentDesiredReviewRevision
      || row.contentVersion === GD10_12M_PLAY_V5_TARGET.contentDesiredReviewRevision);
  const revision5Approvals = revision5Reviews.filter((row) => row.decision === 'approved');
  const approvedDimensions = new Set(revision5Approvals.flatMap((row) =>
    typeof row.dimension === 'string' ? [row.dimension] : []));
  const outstandingRequiredReviews = GD10_12M_PLAY_V5_REQUIRED_REVIEWS
    .filter((dimension) => !approvedDimensions.has(dimension));

  const sourcesExact = sourceResults.every((result) => result.rows.length === 1 && result.exact);
  const desiredSources = sources.filter((source) =>
    (GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS as readonly string[]).includes(source.sourceId));
  const citationsEligible = evaluatePublicationEvidence(
    GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS,
    desiredSources,
    todayIsoUtc(new Date(now)),
  ).allowed;

  const allLinksBounded = allLinks.length <= maxLinkRows;
  const reverseStates = await inspectReverseDependencies(allLinks);
  const reverseDependencies = reverseStates.map((state) => {
    const initial = GD10_12M_PLAY_V5_REVERSE_PREIMAGES
      .find((row) => row.sourceId === state.sourceId);
    const audited = audit.reverseDependencies
      .find((row) => row.sourceId === state.sourceId);
    return {
      ...state,
      initialExact: Boolean(initial
        && state.rows === initial.count
        && state.canonicalSha256 === initial.canonicalSha256
        && sameStrings(state.keys, initial.keys)),
      desiredExact: Boolean(audited
        && state.rows === audited.rows
        && state.canonicalSha256 === audited.canonicalSha256
        && sameStrings(state.keys, desiredReverseKeys(state.sourceId))),
    };
  });
  const reverseInitialExact = allLinksBounded
    && reverseDependencies.every((row) => row.initialExact);
  const reverseDesiredExact = allLinksBounded
    && reverseDependencies.every((row) => row.desiredExact);

  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  if (contentRows.length !== 1) blockers.push('content row count is not one');
  if (linkRows.length !== 1) blockers.push('link row count is not one');
  if (!sourcesExact) blockers.push('evidence source preimages drifted');
  if (!reviewsExact) blockers.push('complete review history drifted');
  if (revision4Reviews.length !== 0) blockers.push('revision 4 review preimage drifted');
  if (!mediaExact) blockers.push('media preimage drifted');
  if (contentAudits.length !== 0) blockers.push('unexpected AI content audit exists');
  if (aiEvidenceAudits.length !== 0) blockers.push('unexpected AI evidence audit exists');
  if (publicationReleases.length !== 0) blockers.push('unexpected AI publication release exists');
  if (aiAuditRuns.length !== 0) blockers.push('unexpected relevant AI audit run exists');
  if (revision5Reviews.length !== 0) blockers.push('revision 5 already has review rows');
  if (revision5Approvals.length !== 0) blockers.push('revision 5 already has approvals');
  if (!allLinksBounded) blockers.push('evidence-link reverse scan exceeded safety bound');
  if (!citationsEligible) blockers.push('desired evidence set is not publication eligible');

  const allInitial = contentInitialExact && linkInitialExact && reverseInitialExact;
  const allDesired = contentDesiredExact && linkDesiredExact && reverseDesiredExact;
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact && allDesired) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0 && allInitial) {
    phase = 'ready';
  } else {
    if (audit.rows === 0 && !contentInitialExact) blockers.push('content preimage drifted');
    if (audit.rows === 0 && !linkInitialExact) blockers.push('link preimage drifted');
    if (audit.rows === 0 && !reverseInitialExact) blockers.push('source reverse dependencies drifted');
    if (audit.rows === 1 && audit.exact && !allDesired) {
      blockers.push('release audit exists but postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: GD10_12M_PLAY_V5_RELEASE_ID,
    phase,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    todayIso: todayIsoUtc(new Date(now)),
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    contentRows: contentRows.length,
    contentInitialExact,
    contentDesiredExact,
    contentReviewRevision: content?.reviewRevision ?? null,
    linkRows: linkRows.length,
    linkInitialExact,
    linkDesiredExact,
    sourceRows: sources.length,
    sourcesExact,
    citationsEligible,
    reviewRows: reviewRows.length,
    reviewsExact,
    revision4ReviewRows: revision4Reviews.length,
    revision5ReviewRows: revision5Reviews.length,
    revision5Approvals: revision5Approvals.length,
    mediaRows: mediaRows.length,
    mediaExact,
    aiContentAuditRows: contentAudits.length,
    aiEvidenceAuditRows: aiEvidenceAudits.length,
    aiPublicationReleaseRows: publicationReleases.length,
    aiAuditRunRows: aiAuditRuns.length,
    allLinksRows: allLinks.length,
    allLinksBounded,
    reverseDependencies,
    outstandingRequiredReviews: [...outstandingRequiredReviews],
  };
}

/** Read-only, bounded, exact-state preflight for the rev4 → rev5 correction. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(GD10_12M_PLAY_V5_RELEASE_ID) },
  returns: resultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

function desiredContentPatch(updatedAt: number): Partial<Doc<'libraryContent'>> {
  const desired = GD10_12M_PLAY_V5_DESIRED_CONTENT as Partial<Doc<'libraryContent'>>;
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
    tags: desired.tags ? [...desired.tags] : [],
    difficulty: desired.difficulty,
    durationMinutes: desired.durationMinutes,
    offline: desired.offline,
    data: desired.data,
    source: desired.source,
    version: desired.version,
    searchText: desired.searchText,
    requiredReviewDimensions: [...GD10_12M_PLAY_V5_REQUIRED_REVIEWS],
    clinicalStatus: 'clinical_review',
    reviewRevision: GD10_12M_PLAY_V5_TARGET.contentDesiredReviewRevision,
    reviewerId: undefined,
    reviewerQualification: undefined,
    reviewerDisplayName: undefined,
    reviewScope: undefined,
    reviewedAt: undefined,
    nextReviewAt: undefined,
    reviewNote: undefined,
    aiPublicationReleaseId: undefined,
    aiPublishedAt: undefined,
    updatedAt,
  };
}

/**
 * Atomically invalidates rev4 and writes the safer rev5 draft. It never creates
 * a review, AI record, approval, publication decision, or source row.
 */
export const apply = internalMutation({
  args: { releaseId: v.literal(GD10_12M_PLAY_V5_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(GD10_12M_PLAY_V5_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentUpdated: v.number(),
    linksUpdated: v.number(),
    sourcesPreserved: v.number(),
    reviewsPreserved: v.number(),
    mediaPreserved: v.number(),
    requiredFreshReviews: v.number(),
    publicationDecisionMade: v.boolean(),
    aiRecordsCreated: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks timestamp');
      return {
        releaseId: GD10_12M_PLAY_V5_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentUpdated: 0,
        linksUpdated: 0,
        sourcesPreserved: before.sourceRows,
        reviewsPreserved: before.reviewRows,
        mediaPreserved: before.mediaRows,
        requiredFreshReviews: GD10_12M_PLAY_V5_REQUIRED_REVIEWS.length,
        publicationDecisionMade: false,
        aiRecordsCreated: 0,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`gd_10_12m_play v5 CAS preflight blocked: ${before.blockers.join('; ')}`);
    }
    const rechecked = await preflightState(ctx, now);
    if (rechecked.phase !== 'ready') throw new Error('State changed after preflight');

    await ctx.db.patch(
      GD10_12M_PLAY_V5_TARGET.contentId as Id<'libraryContent'>,
      desiredContentPatch(now),
    );
    await ctx.db.patch(
      GD10_12M_PLAY_V5_TARGET.linkId as Id<'evidenceLinks'>,
      {
        sourceIds: [...GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS],
        updatedAt: now,
      },
    );

    const [content, link, allLinks] = await Promise.all([
      ctx.db.get(GD10_12M_PLAY_V5_TARGET.contentId as Id<'libraryContent'>),
      ctx.db.get(GD10_12M_PLAY_V5_TARGET.linkId as Id<'evidenceLinks'>),
      ctx.db.query('evidenceLinks').take(maxLinkRows + 1),
    ]);
    if (!content || !link || allLinks.length > maxLinkRows) {
      throw new Error('CAS postimage row disappeared or reverse scan exceeded bound');
    }
    const reverseDependencies = await inspectReverseDependencies(allLinks);
    const [contentHash, linkHash] = await Promise.all([
      sha256Canonical(content),
      sha256Canonical(link),
    ]);
    const auditedReverse = reverseDependencies.map((row) => ({
      sourceId: row.sourceId,
      rows: row.rows,
      canonicalSha256: row.canonicalSha256,
    }));
    await logAudit(
      ctx,
      null,
      GD10_12M_PLAY_V5_RELEASE_ACTION,
      'libraryContent,evidenceLinks',
      undefined,
      GD10_12M_PLAY_V5_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson({
          updatedAt: now,
          contentHash,
          linkHash,
          reverseDependencies: auditedReverse,
        }),
      },
    );

    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error(
        `gd_10_12m_play v5 postimage failed; transaction rolled back: ${after.blockers.join('; ')}`,
      );
    }
    return {
      releaseId: GD10_12M_PLAY_V5_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentUpdated: 1,
      linksUpdated: 1,
      sourcesPreserved: after.sourceRows,
      reviewsPreserved: after.reviewRows,
      mediaPreserved: after.mediaRows,
      requiredFreshReviews: GD10_12M_PLAY_V5_REQUIRED_REVIEWS.length,
      publicationDecisionMade: false,
      aiRecordsCreated: 0,
      updatedAt: now,
    };
  },
});
