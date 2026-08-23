import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import { publicationEvidenceIsEligible } from './lib/evidencePublicationGate';
import { todayIsoUtc } from './lib/evidenceFreshness';
import {
  CLINICAL_BLOCKER_FIXTURE_SHA256,
  UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES,
  UNICEF_SEEN_COUNTED_DESIRED_METADATA,
  UNICEF_SEEN_COUNTED_LINK_PREIMAGES,
  UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES,
  UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
  UNICEF_SEEN_COUNTED_REVERSE_KEYS,
  UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES,
  UNICEF_SEEN_COUNTED_SOURCE_ID,
  UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE,
  type ClinicalBlockerExactPreimage,
} from './lib/clinicalBlockerCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
const releaseAction = 'release.unicef_seen_counted_metadata';
const maxLinkRows = 5_000;

const resultValidator = v.object({
  releaseId: v.literal(UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  blockers: v.array(v.string()),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  sourceRows: v.number(),
  sourceInitialExact: v.boolean(),
  sourceDesiredExact: v.boolean(),
  sourceYear: v.union(v.number(), v.null()),
  sourceReviewStatus: v.union(v.string(), v.null()),
  sourceCitationEligible: v.boolean(),
  reverseDependencyKeys: v.array(v.string()),
  reverseDependenciesExact: v.boolean(),
  contentsExact: v.boolean(),
  linksExact: v.boolean(),
  reviewsExact: v.boolean(),
  mediaExact: v.boolean(),
  aiContentAuditRows: v.number(),
  aiPublicationReleaseRows: v.number(),
  lsnReviewRevision: v.union(v.number(), v.null()),
  contentRowsChanged: v.number(),
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

function expectedSourcePostimage(updatedAt: number): Record<string, unknown> {
  const {
    reviewerQualification: _reviewerQualification,
    reviewNote: _reviewNote,
    reviewerId: _reviewerId,
    reviewScope: _reviewScope,
    ...preserved
  } = UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.document;
  void _reviewerQualification;
  void _reviewNote;
  void _reviewerId;
  void _reviewScope;
  return {
    ...preserved,
    ...UNICEF_SEEN_COUNTED_DESIRED_METADATA,
    updatedAt,
  };
}

function preservedRowsJson(
  rows: readonly ClinicalBlockerExactPreimage[],
): Array<{ rowId: string; canonicalSha256: string }> {
  return rows.map((row) => ({
    rowId: row.rowId,
    canonicalSha256: row.exactCanonicalSha256,
  }));
}

function auditBeforeJson(): string {
  return JSON.stringify({
    source: {
      sourceId: UNICEF_SEEN_COUNTED_SOURCE_ID,
      rowId: UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.rowId,
      canonicalSha256: UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.exactCanonicalSha256,
      year: 2022,
      reviewStatus: 'approved',
    },
    reverseDependencyKeys: UNICEF_SEEN_COUNTED_REVERSE_KEYS,
    contents: preservedRowsJson(UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES),
    links: preservedRowsJson(UNICEF_SEEN_COUNTED_LINK_PREIMAGES),
    reviews: preservedRowsJson(UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES),
    media: preservedRowsJson(UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES),
    aiContentAudits: 0,
    aiPublicationReleases: 0,
    fixtureSha256: CLINICAL_BLOCKER_FIXTURE_SHA256,
  });
}

function auditAfterJson(updatedAt: number, sourceHash: string): string {
  return JSON.stringify({
    source: {
      sourceId: UNICEF_SEEN_COUNTED_SOURCE_ID,
      rowId: UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.rowId,
      canonicalSha256: sourceHash,
      year: 2021,
      verifiedOn: '2026-08-23',
      reviewStatus: 'awaiting_review',
      updatedAt,
    },
    stableLegacySourceIdRetained: true,
    reverseDependencyKeys: UNICEF_SEEN_COUNTED_REVERSE_KEYS,
    contentsPreserved: preservedRowsJson(UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES),
    linksPreserved: preservedRowsJson(UNICEF_SEEN_COUNTED_LINK_PREIMAGES),
    reviewsPreserved: preservedRowsJson(UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES),
    mediaPreserved: preservedRowsJson(UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES),
    contentRowsChanged: 0,
    lsnReviewRevision: 2,
    sourceHumanReviewRequired: true,
    sourceCitationEligible: false,
    fixtureSha256: CLINICAL_BLOCKER_FIXTURE_SHA256,
  });
}

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  sourceHash: string | null;
};

async function releaseAuditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction)).take(2);
  if (rows.length !== 1) {
    return { rows: rows.length, exact: false, updatedAt: null, sourceHash: null };
  }
  const row = rows[0];
  let detail: { source?: { canonicalSha256?: unknown; updatedAt?: unknown } } = {};
  try {
    detail = JSON.parse(row.after ?? '{}');
  } catch {
    detail = {};
  }
  const updatedAt = typeof detail.source?.updatedAt === 'number'
    ? detail.source.updatedAt : null;
  const sourceHash = typeof detail.source?.canonicalSha256 === 'string'
    ? detail.source.canonicalSha256 : null;
  const exact = updatedAt !== null
    && sourceHash !== null
    && row.actorId === undefined
    && row.entityTable === 'evidenceSources'
    && row.entityId === undefined
    && row.summary === UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, sourceHash);
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    sourceHash: exact ? sourceHash : null,
  };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const [audit, sourceRows, allLinks, lsnContents, snContents,
    lsnLinks, snLinks, lsnReviews, snReviews, lsnMedia, snMedia,
    lsnAiAudits, snAiAudits, lsnAiReleases, snAiReleases] = await Promise.all([
    releaseAuditState(ctx),
    ctx.db.query('evidenceSources').withIndex('by_source_id', (q) =>
      q.eq('sourceId', UNICEF_SEEN_COUNTED_SOURCE_ID)).take(2),
    ctx.db.query('evidenceLinks').take(maxLinkRows + 1),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) =>
      q.eq('slug', 'lsn_special_needs_awareness')).take(2),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) =>
      q.eq('slug', 'sn_learning_disability')).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', 'lesson').eq('slug', 'lsn_special_needs_awareness')).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', 'special_need').eq('slug', 'sn_learning_disability')).take(2),
    ctx.db.query('contentReviews').withIndex('by_content', (q) =>
      q.eq('contentSlug', 'lsn_special_needs_awareness'))
      .take(UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES.length + 1),
    ctx.db.query('contentReviews').withIndex('by_content', (q) =>
      q.eq('contentSlug', 'sn_learning_disability'))
      .take(UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES.length + 1),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) =>
      q.eq('contentSlug', 'lsn_special_needs_awareness'))
      .take(UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES.length + 1),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) =>
      q.eq('contentSlug', 'sn_learning_disability'))
      .take(UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES.length + 1),
    ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) =>
      q.eq('contentSlug', 'lsn_special_needs_awareness')).take(1),
    ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) =>
      q.eq('contentSlug', 'sn_learning_disability')).take(1),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
      q.eq('targetKey', 'lesson:lsn_special_needs_awareness')).take(1),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
      q.eq('targetKey', 'special_need:sn_learning_disability')).take(1),
  ]);
  const contents = [...lsnContents, ...snContents];
  const links = [...lsnLinks, ...snLinks];
  const reviews = [...lsnReviews, ...snReviews];
  const media = [...lsnMedia, ...snMedia];
  const aiContentAudits = [...lsnAiAudits, ...snAiAudits];
  const aiPublicationReleases = [...lsnAiReleases, ...snAiReleases];
  const source = sourceRows.length === 1 ? sourceRows[0] : null;
  const sourceInitialExact = Boolean(source
    && await rowMatches(source, UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE));
  const sourceDesiredExact = Boolean(source
    && audit.updatedAt !== null
    && await sha256Canonical(source) === audit.sourceHash
    && await sha256Canonical(source)
      === await sha256Canonical(expectedSourcePostimage(audit.updatedAt)));
  const reverseDependencyKeys = allLinks
    .filter((row) => row.sourceIds.includes(UNICEF_SEEN_COUNTED_SOURCE_ID))
    .map((row) => `${row.kind}:${row.slug}`)
    .sort((left, right) => left.localeCompare(right));
  const reverseDependenciesExact = sameStrings(
    reverseDependencyKeys,
    UNICEF_SEEN_COUNTED_REVERSE_KEYS,
  );
  const contentsExact = await rowsMatch(contents, UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES);
  const linksExact = await rowsMatch(links, UNICEF_SEEN_COUNTED_LINK_PREIMAGES);
  const reviewsExact = await rowsMatch(reviews, UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES);
  const mediaExact = await rowsMatch(media, UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES);
  const lsn = lsnContents.length === 1 ? lsnContents[0] : null;
  const sourceCitationEligible = Boolean(source
    && publicationEvidenceIsEligible(source, todayIsoUtc(new Date(now))));
  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  if (sourceRows.length !== 1) blockers.push('UNICEF source row count is not one');
  if (allLinks.length > maxLinkRows) blockers.push('evidence-link reverse scan exceeded bound');
  if (!reverseDependenciesExact) blockers.push('UNICEF reverse dependency set drifted');
  if (!contentsExact) blockers.push('reverse-consumer content preimage drifted');
  if (!linksExact) blockers.push('reverse-consumer link preimage drifted');
  if (!reviewsExact) blockers.push('reverse-consumer review history drifted');
  if (!mediaExact) blockers.push('reverse-consumer media preimage drifted');
  if (aiContentAudits.length !== 0) blockers.push('reverse consumer gained AI content audit');
  if (aiPublicationReleases.length !== 0) blockers.push('reverse consumer gained AI release');
  if (lsn?.reviewRevision !== 2) blockers.push('lesson revision is no longer 2');
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 0 && sourceInitialExact) {
    phase = 'ready';
  } else if (blockers.length === 0 && audit.rows === 1 && audit.exact
    && sourceDesiredExact && !sourceCitationEligible) {
    phase = 'applied';
  } else {
    if (audit.rows === 0 && !sourceInitialExact) blockers.push('UNICEF source preimage drifted');
    if (audit.rows === 1 && audit.exact
      && (!sourceDesiredExact || sourceCitationEligible)) {
      blockers.push('release audit exists but UNICEF source postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
    phase,
    blockers: [...new Set(blockers)].sort((a, b) => a.localeCompare(b)),
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    sourceRows: sourceRows.length,
    sourceInitialExact,
    sourceDesiredExact,
    sourceYear: source?.year ?? null,
    sourceReviewStatus: source?.reviewStatus ?? null,
    sourceCitationEligible,
    reverseDependencyKeys,
    reverseDependenciesExact,
    contentsExact,
    linksExact,
    reviewsExact,
    mediaExact,
    aiContentAuditRows: aiContentAudits.length,
    aiPublicationReleaseRows: aiPublicationReleases.length,
    lsnReviewRevision: lsn?.reviewRevision ?? null,
    contentRowsChanged: 0,
  };
}

export const preflight = internalQuery({
  args: { releaseId: v.literal(UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID) },
  returns: resultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

export const apply = internalMutation({
  args: { releaseId: v.literal(UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    sourcesUpdated: v.number(),
    sourceApprovalsReset: v.number(),
    contentRowsChanged: v.number(),
    reverseConsumersPreserved: v.number(),
    sourceCitationEligible: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks timestamp');
      return {
        releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        sourcesUpdated: 0,
        sourceApprovalsReset: 0,
        contentRowsChanged: 0,
        reverseConsumersPreserved: 2,
        sourceCitationEligible: before.sourceCitationEligible,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`UNICEF metadata CAS preflight blocked: ${before.blockers.join('; ')}`);
    }
    const rechecked = await preflightState(ctx, now);
    if (rechecked.phase !== 'ready') throw new Error('State changed after preflight');

    await ctx.db.patch(UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.rowId as Id<'evidenceSources'>, {
      ...UNICEF_SEEN_COUNTED_DESIRED_METADATA,
      reviewerQualification: undefined,
      reviewNote: undefined,
      reviewerId: undefined,
      reviewScope: undefined,
      updatedAt: now,
    });
    const source = await ctx.db.get(
      UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE.rowId as Id<'evidenceSources'>,
    );
    if (!source) throw new Error('UNICEF source postimage row disappeared');
    const sourceHash = await sha256Canonical(source);
    await logAudit(ctx, null, releaseAction, 'evidenceSources', undefined,
      UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID, {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, sourceHash),
      });
    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('UNICEF metadata postimage failed; transaction rolled back');
    }
    return {
      releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      sourcesUpdated: 1,
      sourceApprovalsReset: 1,
      contentRowsChanged: 0,
      reverseConsumersPreserved: after.reverseDependencyKeys.length,
      sourceCitationEligible: after.sourceCitationEligible,
      updatedAt: now,
    };
  },
});
