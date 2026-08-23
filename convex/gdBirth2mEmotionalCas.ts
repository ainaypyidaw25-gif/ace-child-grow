import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
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
  CLINICAL_BLOCKER_FIXTURE_SHA256,
  GD_BIRTH2M_EMOTIONAL_CONTENT_PREIMAGE,
  GD_BIRTH2M_EMOTIONAL_DESIRED_DATA,
  GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT,
  GD_BIRTH2M_EMOTIONAL_LINK_PREIMAGE,
  GD_BIRTH2M_EMOTIONAL_MEDIA_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
  GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS,
  GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_TARGET,
  NHS_SOOTHING_CRYING_BABY_DESIRED,
  NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
  type ClinicalBlockerExactPreimage,
} from './lib/clinicalBlockerCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
const releaseAction = 'release.gd_birth_2m_emotional_tier_evidence';
const maxLinkRows = 5_000;

const resultValidator = v.object({
  releaseId: v.literal(GD_BIRTH2M_EMOTIONAL_RELEASE_ID),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  blockers: v.array(v.string()),
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
  sourceIds: v.array(v.string()),
  existingSourcesExact: v.boolean(),
  newSourceRows: v.number(),
  newSourceInitialExact: v.boolean(),
  newSourceDesiredExact: v.boolean(),
  newSourceReviewStatus: v.union(v.string(), v.null()),
  reverseDependencyKeys: v.array(v.string()),
  reverseInitialExact: v.boolean(),
  reverseDesiredExact: v.boolean(),
  citationEligible: v.boolean(),
  reviewsExact: v.boolean(),
  reviewRows: v.number(),
  mediaExact: v.boolean(),
  mediaRows: v.number(),
  aiContentAuditRows: v.number(),
  aiPublicationReleaseRows: v.number(),
  desiredRevisionApprovals: v.number(),
  outstandingRequiredReviews: v.array(v.string()),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

async function rowMatches(
  row: { _id: unknown; _creationTime: number },
  expected: ClinicalBlockerExactPreimage,
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
  expected: readonly ClinicalBlockerExactPreimage[],
): Promise<boolean> {
  if (rows.length !== expected.length) return false;
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  for (const preimage of expected) {
    const row = byId.get(preimage.rowId);
    if (!row || !await rowMatches(row, preimage)) return false;
  }
  return true;
}

function expectedNewSourcePostimage(
  rowId: string,
  creationTime: number,
  updatedAt: number,
): Record<string, unknown> {
  return {
    _creationTime: creationTime,
    _id: rowId,
    ...NHS_SOOTHING_CRYING_BABY_DESIRED,
    createdAt: updatedAt,
    updatedAt,
  };
}

function auditBeforeJson(): string {
  return JSON.stringify({
    content: {
      rowId: GD_BIRTH2M_EMOTIONAL_TARGET.contentId,
      canonicalSha256: GD_BIRTH2M_EMOTIONAL_TARGET.contentInitialCanonicalSha256,
      reviewRevision: GD_BIRTH2M_EMOTIONAL_TARGET.contentInitialReviewRevision,
      updatedAt: GD_BIRTH2M_EMOTIONAL_TARGET.contentInitialUpdatedAt,
    },
    link: {
      rowId: GD_BIRTH2M_EMOTIONAL_TARGET.linkId,
      canonicalSha256: GD_BIRTH2M_EMOTIONAL_TARGET.linkInitialCanonicalSha256,
      sourceIds: GD_BIRTH2M_EMOTIONAL_TARGET.initialSourceIds,
      updatedAt: GD_BIRTH2M_EMOTIONAL_TARGET.linkInitialUpdatedAt,
    },
    sources: GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES.map((row) => ({
      sourceId: row.sourceId,
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    newSourceRows: 0,
    newSourceReverseDependencyKeys: [],
    reviewHistory: GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES.map((row) => ({
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    media: [],
    aiContentAudits: 0,
    aiPublicationReleases: 0,
    fixtureSha256: CLINICAL_BLOCKER_FIXTURE_SHA256,
  });
}

function auditAfterJson(input: {
  updatedAt: number;
  contentHash: string;
  linkHash: string;
  sourceHash: string;
  sourceRowId: string;
  sourceCreationTime: number;
}): string {
  return JSON.stringify({
    content: {
      rowId: GD_BIRTH2M_EMOTIONAL_TARGET.contentId,
      canonicalSha256: input.contentHash,
      clinicalStatus: 'clinical_review',
      reviewRevision: GD_BIRTH2M_EMOTIONAL_TARGET.contentDesiredReviewRevision,
      updatedAt: input.updatedAt,
    },
    link: {
      rowId: GD_BIRTH2M_EMOTIONAL_TARGET.linkId,
      canonicalSha256: input.linkHash,
      sourceIds: GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds,
      updatedAt: input.updatedAt,
    },
    newSource: {
      sourceId: NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
      rowId: input.sourceRowId,
      creationTime: input.sourceCreationTime,
      canonicalSha256: input.sourceHash,
      reviewStatus: 'awaiting_review',
      updatedAt: input.updatedAt,
    },
    existingSourcesPreserved: GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES.map((row) => ({
      sourceId: row.sourceId,
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    newSourceReverseDependencyKeys: [
      `${GD_BIRTH2M_EMOTIONAL_TARGET.kind}:${GD_BIRTH2M_EMOTIONAL_TARGET.slug}`,
    ],
    reviewsPreserved: GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES.map((row) => ({
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    desiredRevisionApprovals: 0,
    outstandingRequiredReviews: GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS,
    sourceHumanReviewRequired: true,
    newSourceCitationEligible: false,
    publicationDecision: 'not_made',
    citationEligible: true,
    fixtureSha256: CLINICAL_BLOCKER_FIXTURE_SHA256,
  });
}

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  contentHash: string | null;
  linkHash: string | null;
  sourceHash: string | null;
  sourceRowId: string | null;
  sourceCreationTime: number | null;
};

async function releaseAuditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction)).take(2);
  if (rows.length !== 1) {
    return {
      rows: rows.length,
      exact: false,
      updatedAt: null,
      contentHash: null,
      linkHash: null,
      sourceHash: null,
      sourceRowId: null,
      sourceCreationTime: null,
    };
  }
  const row = rows[0];
  let parsed: ReturnType<typeof auditAfterJson> | null = null;
  let detail: {
    content?: { canonicalSha256?: unknown; updatedAt?: unknown };
    link?: { canonicalSha256?: unknown; updatedAt?: unknown };
    newSource?: {
      canonicalSha256?: unknown;
      rowId?: unknown;
      creationTime?: unknown;
      updatedAt?: unknown;
    };
  } = {};
  try {
    detail = JSON.parse(row.after ?? '{}');
    parsed = row.after ?? null;
  } catch {
    detail = {};
  }
  const updatedAt = typeof detail.content?.updatedAt === 'number'
    && detail.content.updatedAt === detail.link?.updatedAt
    && detail.content.updatedAt === detail.newSource?.updatedAt
    ? detail.content.updatedAt : null;
  const contentHash = typeof detail.content?.canonicalSha256 === 'string'
    ? detail.content.canonicalSha256 : null;
  const linkHash = typeof detail.link?.canonicalSha256 === 'string'
    ? detail.link.canonicalSha256 : null;
  const sourceHash = typeof detail.newSource?.canonicalSha256 === 'string'
    ? detail.newSource.canonicalSha256 : null;
  const sourceRowId = typeof detail.newSource?.rowId === 'string'
    ? detail.newSource.rowId : null;
  const sourceCreationTime = typeof detail.newSource?.creationTime === 'number'
    ? detail.newSource.creationTime : null;
  const exact = updatedAt !== null
    && contentHash !== null
    && linkHash !== null
    && sourceHash !== null
    && sourceRowId !== null
    && sourceCreationTime !== null
    && row.actorId === undefined
    && row.entityTable === 'libraryContent,evidenceLinks,evidenceSources'
    && row.entityId === undefined
    && row.summary === GD_BIRTH2M_EMOTIONAL_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && parsed === auditAfterJson({
      updatedAt,
      contentHash,
      linkHash,
      sourceHash,
      sourceRowId,
      sourceCreationTime,
    });
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    contentHash: exact ? contentHash : null,
    linkHash: exact ? linkHash : null,
    sourceHash: exact ? sourceHash : null,
    sourceRowId: exact ? sourceRowId : null,
    sourceCreationTime: exact ? sourceCreationTime : null,
  };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const [audit, contentRows, linkRows, reviewRows, mediaRows, aiContentAudits,
    aiPublicationReleases, newSourceRows, allLinks] = await Promise.all([
    releaseAuditState(ctx),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) =>
      q.eq('slug', GD_BIRTH2M_EMOTIONAL_TARGET.slug)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', GD_BIRTH2M_EMOTIONAL_TARGET.kind)
      .eq('slug', GD_BIRTH2M_EMOTIONAL_TARGET.slug)).take(2),
    ctx.db.query('contentReviews').withIndex('by_content', (q) =>
      q.eq('contentSlug', GD_BIRTH2M_EMOTIONAL_TARGET.slug))
      .take(GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES.length + 1),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) =>
      q.eq('contentSlug', GD_BIRTH2M_EMOTIONAL_TARGET.slug))
      .take(GD_BIRTH2M_EMOTIONAL_MEDIA_PREIMAGES.length + 1),
    ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) =>
      q.eq('contentSlug', GD_BIRTH2M_EMOTIONAL_TARGET.slug)).take(1),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
      q.eq('targetKey',
        `${GD_BIRTH2M_EMOTIONAL_TARGET.kind}:${GD_BIRTH2M_EMOTIONAL_TARGET.slug}`))
      .take(1),
    ctx.db.query('evidenceSources').withIndex('by_source_id', (q) =>
      q.eq('sourceId', NHS_SOOTHING_CRYING_BABY_SOURCE_ID)).take(2),
    ctx.db.query('evidenceLinks').take(maxLinkRows + 1),
  ]);
  const existingSourceResults = await Promise.all(
    GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES.map(async (expected) => {
      const rows = await ctx.db.query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId)).take(2);
      return {
        rows,
        exact: rows.length === 1 && await rowMatches(rows[0], expected),
      };
    }),
  );
  const existingSourcesExact = existingSourceResults.every(
    (result) => result.rows.length === 1 && result.exact,
  );
  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  const contentHash = content ? await sha256Canonical(content) : null;
  const linkHash = link ? await sha256Canonical(link) : null;
  const contentInitialExact = Boolean(content
    && await rowMatches(content, GD_BIRTH2M_EMOTIONAL_CONTENT_PREIMAGE)
    && content.reviewRevision === GD_BIRTH2M_EMOTIONAL_TARGET.contentInitialReviewRevision
    && content.updatedAt === GD_BIRTH2M_EMOTIONAL_TARGET.contentInitialUpdatedAt);
  const contentDesiredExact = Boolean(content
    && String(content._id) === GD_BIRTH2M_EMOTIONAL_TARGET.contentId
    && content._creationTime === GD_BIRTH2M_EMOTIONAL_TARGET.contentCreationTime
    && content.type === GD_BIRTH2M_EMOTIONAL_TARGET.kind
    && content.slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug
    && canonicalJson(content.data) === canonicalJson(GD_BIRTH2M_EMOTIONAL_DESIRED_DATA)
    && content.searchText === GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT
    && content.clinicalStatus === 'clinical_review'
    && content.reviewRevision === GD_BIRTH2M_EMOTIONAL_TARGET.contentDesiredReviewRevision
    && content.reviewerId === undefined
    && content.reviewerQualification === undefined
    && content.reviewerDisplayName === undefined
    && content.reviewScope === undefined
    && content.reviewedAt === undefined
    && content.nextReviewAt === undefined
    && content.reviewNote === undefined
    && content.aiPublicationReleaseId === undefined
    && content.aiPublishedAt === undefined
    && audit.updatedAt !== null
    && content.updatedAt === audit.updatedAt
    && contentHash === audit.contentHash);
  const linkIdentityExact = Boolean(link
    && String(link._id) === GD_BIRTH2M_EMOTIONAL_TARGET.linkId
    && link._creationTime === GD_BIRTH2M_EMOTIONAL_TARGET.linkCreationTime
    && link.createdAt === GD_BIRTH2M_EMOTIONAL_TARGET.linkCreatedAt
    && link.kind === GD_BIRTH2M_EMOTIONAL_TARGET.kind
    && link.slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug);
  const linkInitialExact = Boolean(linkIdentityExact && link
    && await rowMatches(link, GD_BIRTH2M_EMOTIONAL_LINK_PREIMAGE));
  const linkDesiredExact = Boolean(linkIdentityExact && link
    && audit.updatedAt !== null
    && link.updatedAt === audit.updatedAt
    && sameStrings(link.sourceIds, GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds)
    && linkHash === audit.linkHash);
  const newSource = newSourceRows.length === 1 ? newSourceRows[0] : null;
  const newSourceInitialExact = newSourceRows.length === 0;
  const newSourceDesiredExact = Boolean(newSource
    && audit.updatedAt !== null
    && audit.sourceRowId !== null
    && audit.sourceCreationTime !== null
    && String(newSource._id) === audit.sourceRowId
    && newSource._creationTime === audit.sourceCreationTime
    && await sha256Canonical(newSource) === audit.sourceHash
    && await sha256Canonical(newSource)
      === await sha256Canonical(expectedNewSourcePostimage(
        audit.sourceRowId,
        audit.sourceCreationTime,
        audit.updatedAt,
      )));
  const reverseDependencyKeys = allLinks
    .filter((row) => row.sourceIds.includes(NHS_SOOTHING_CRYING_BABY_SOURCE_ID))
    .map((row) => `${row.kind}:${row.slug}`)
    .sort((left, right) => left.localeCompare(right));
  const expectedDesiredReverse = [
    `${GD_BIRTH2M_EMOTIONAL_TARGET.kind}:${GD_BIRTH2M_EMOTIONAL_TARGET.slug}`,
  ];
  const reverseInitialExact = reverseDependencyKeys.length === 0;
  const reverseDesiredExact = sameStrings(reverseDependencyKeys, expectedDesiredReverse);
  const reviewsExact = await rowsMatch(reviewRows, GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES);
  const mediaExact = await rowsMatch(mediaRows, GD_BIRTH2M_EMOTIONAL_MEDIA_PREIMAGES);
  const desiredRevisionApprovals = reviewRows.filter((row) =>
    row.reviewRevision === GD_BIRTH2M_EMOTIONAL_TARGET.contentDesiredReviewRevision
      && row.decision === 'approved').length;
  const approvedDimensions = new Set(reviewRows.flatMap((row) =>
    row.reviewRevision === GD_BIRTH2M_EMOTIONAL_TARGET.contentDesiredReviewRevision
      && row.decision === 'approved' && typeof row.dimension === 'string'
      ? [row.dimension] : []));
  const outstandingRequiredReviews = GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS
    .filter((dimension) => !approvedDimensions.has(dimension));
  const desiredSourceRows = [
    ...existingSourceResults.flatMap((result) => result.rows),
    ...newSourceRows,
  ].filter((source) => GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds
    .includes(source.sourceId as (typeof GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds)[number]));
  const citationEligible = evaluatePublicationEvidence(
    GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds,
    desiredSourceRows,
    todayIsoUtc(new Date(now)),
  ).allowed;
  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  if (contentRows.length !== 1) blockers.push('content row count is not one');
  if (linkRows.length !== 1) blockers.push('link row count is not one');
  if (!existingSourcesExact) blockers.push('existing evidence source preimage drifted');
  if (!reviewsExact) blockers.push('review history drifted');
  if (!mediaExact) blockers.push('media preimage drifted');
  if (aiContentAudits.length !== 0) blockers.push('unexpected AI content audit exists');
  if (aiPublicationReleases.length !== 0) blockers.push('unexpected AI publication release exists');
  if (desiredRevisionApprovals !== 0) blockers.push('revision 3 already has approvals');
  if (allLinks.length > maxLinkRows) blockers.push('evidence-link reverse scan exceeded bound');
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 0 && contentInitialExact
    && linkInitialExact && newSourceInitialExact && reverseInitialExact) {
    phase = 'ready';
  } else if (blockers.length === 0 && audit.rows === 1 && audit.exact
    && contentDesiredExact && linkDesiredExact && newSourceDesiredExact
    && reverseDesiredExact && citationEligible) {
    phase = 'applied';
  } else {
    if (audit.rows === 0 && !contentInitialExact) blockers.push('content preimage drifted');
    if (audit.rows === 0 && !linkInitialExact) blockers.push('link preimage drifted');
    if (audit.rows === 0 && !newSourceInitialExact) blockers.push('new NHS source already exists');
    if (audit.rows === 0 && !reverseInitialExact) blockers.push('new NHS source reverse dependencies exist');
    if (audit.rows === 1 && audit.exact
      && (!contentDesiredExact || !linkDesiredExact || !newSourceDesiredExact
        || !reverseDesiredExact || !citationEligible)) {
      blockers.push('release audit exists but postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
    phase,
    blockers: [...new Set(blockers)].sort((a, b) => a.localeCompare(b)),
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
    sourceIds: link ? [...link.sourceIds] : [],
    existingSourcesExact,
    newSourceRows: newSourceRows.length,
    newSourceInitialExact,
    newSourceDesiredExact,
    newSourceReviewStatus: newSource?.reviewStatus ?? null,
    reverseDependencyKeys,
    reverseInitialExact,
    reverseDesiredExact,
    citationEligible,
    reviewsExact,
    reviewRows: reviewRows.length,
    mediaExact,
    mediaRows: mediaRows.length,
    aiContentAuditRows: aiContentAudits.length,
    aiPublicationReleaseRows: aiPublicationReleases.length,
    desiredRevisionApprovals,
    outstandingRequiredReviews,
  };
}

export const preflight = internalQuery({
  args: { releaseId: v.literal(GD_BIRTH2M_EMOTIONAL_RELEASE_ID) },
  returns: resultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

export const apply = internalMutation({
  args: { releaseId: v.literal(GD_BIRTH2M_EMOTIONAL_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(GD_BIRTH2M_EMOTIONAL_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentInvalidated: v.number(),
    linksUpdated: v.number(),
    sourcesCreated: v.number(),
    citationsEligible: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks timestamp');
      return {
        releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentInvalidated: 0,
        linksUpdated: 0,
        sourcesCreated: 0,
        citationsEligible: before.citationEligible,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Birth-to-2-month emotional CAS preflight blocked: ${before.blockers.join('; ')}`);
    }
    const rechecked = await preflightState(ctx, now);
    if (rechecked.phase !== 'ready') throw new Error('State changed after preflight');

    const newSourceId = await ctx.db.insert('evidenceSources', {
      ...NHS_SOOTHING_CRYING_BABY_DESIRED,
      keywords: [...NHS_SOOTHING_CRYING_BABY_DESIRED.keywords],
      topics: [...NHS_SOOTHING_CRYING_BABY_DESIRED.topics],
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(GD_BIRTH2M_EMOTIONAL_TARGET.contentId as Id<'libraryContent'>, {
      data: GD_BIRTH2M_EMOTIONAL_DESIRED_DATA,
      searchText: GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT,
      clinicalStatus: 'clinical_review',
      reviewRevision: GD_BIRTH2M_EMOTIONAL_TARGET.contentDesiredReviewRevision,
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
    await ctx.db.patch(GD_BIRTH2M_EMOTIONAL_TARGET.linkId as Id<'evidenceLinks'>, {
      sourceIds: [...GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds],
      updatedAt: now,
    });
    const [content, link, source] = await Promise.all([
      ctx.db.get(GD_BIRTH2M_EMOTIONAL_TARGET.contentId as Id<'libraryContent'>),
      ctx.db.get(GD_BIRTH2M_EMOTIONAL_TARGET.linkId as Id<'evidenceLinks'>),
      ctx.db.get(newSourceId),
    ]);
    if (!content || !link || !source) throw new Error('CAS postimage row disappeared');
    const [contentHash, linkHash, sourceHash] = await Promise.all([
      sha256Canonical(content),
      sha256Canonical(link),
      sha256Canonical(source),
    ]);
    await logAudit(ctx, null, releaseAction,
      'libraryContent,evidenceLinks,evidenceSources', undefined,
      GD_BIRTH2M_EMOTIONAL_RELEASE_ID, {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson({
          updatedAt: now,
          contentHash,
          linkHash,
          sourceHash,
          sourceRowId: String(source._id),
          sourceCreationTime: source._creationTime,
        }),
      });
    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error(
        `Birth-to-2-month emotional postimage failed; transaction rolled back: ${after.blockers.join('; ')}; content=${after.contentDesiredExact}; link=${after.linkDesiredExact}; source=${after.newSourceDesiredExact}; reverse=${after.reverseDesiredExact}; citation=${after.citationEligible}`,
      );
    }
    return {
      releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentInvalidated: 1,
      linksUpdated: 1,
      sourcesCreated: 1,
      citationsEligible: after.citationEligible,
      updatedAt: now,
    };
  },
});
