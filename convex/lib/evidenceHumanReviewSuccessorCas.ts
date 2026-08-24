import { v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { logAudit } from '../audit';
import { canonicalJson, sha256Canonical } from './aiAuditHash';
import {
  evidenceIsOutdated,
  isStrictIsoDate,
  todayIsoUtc,
} from './evidenceFreshness';
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsEligible,
} from './evidencePublicationGate';
import type {
  EvidenceHumanReviewSuccessorExactRow,
  EvidenceHumanReviewSuccessorSpec,
} from './evidenceHumanReviewSuccessorCasData';
import { isPersistedReleaseGovernedSource } from './clinicalReviewBatchProvenance';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const maxLinkRows = 5_000;
const humanReviewAction = 'evidence.setReview';

const phaseValidator = v.union(
  v.literal('awaiting_human_review'),
  v.literal('ready'),
  v.literal('applied'),
  v.literal('blocked'),
);

export const evidenceHumanReviewSuccessorResultValidator = v.object({
  releaseId: v.string(),
  phase: phaseValidator,
  blockers: v.array(v.string()),
  todayIso: v.string(),
  priorReleaseAuditRows: v.number(),
  priorReleaseAuditExact: v.boolean(),
  successorAuditRows: v.number(),
  successorAuditExact: v.boolean(),
  establishedAt: v.union(v.number(), v.null()),
  sourceRows: v.number(),
  sourceStatus: v.union(v.string(), v.null()),
  stagedSourceExact: v.boolean(),
  sourceMetadataExact: v.boolean(),
  sourceCanonicalSha256: v.union(v.string(), v.null()),
  sourceCitationEligible: v.boolean(),
  humanReviewAuditRows: v.number(),
  humanReviewAuditExact: v.boolean(),
  humanReviewAuditCanonicalSha256: v.union(v.string(), v.null()),
  reviewerProfileExact: v.boolean(),
  persistedReleaseGovernedSource: v.boolean(),
  aiEvidenceAuditRows: v.number(),
  supportingSourcesExact: v.boolean(),
  contentsExact: v.boolean(),
  linksExact: v.boolean(),
  reviewsExact: v.boolean(),
  mediaExact: v.boolean(),
  aiContentAuditRows: v.number(),
  aiPublicationReleaseRows: v.number(),
  targetCitationSetsEligible: v.boolean(),
  reverseDependencyKeys: v.array(v.string()),
  reverseDependenciesExact: v.boolean(),
  scannedLinkRows: v.number(),
  dataRowsChanged: v.literal(0),
});

export type EvidenceHumanReviewSuccessorState = {
  releaseId: string;
  phase: 'awaiting_human_review' | 'ready' | 'applied' | 'blocked';
  blockers: string[];
  todayIso: string;
  priorReleaseAuditRows: number;
  priorReleaseAuditExact: boolean;
  successorAuditRows: number;
  successorAuditExact: boolean;
  establishedAt: number | null;
  sourceRows: number;
  sourceStatus: string | null;
  stagedSourceExact: boolean;
  sourceMetadataExact: boolean;
  sourceCanonicalSha256: string | null;
  sourceCitationEligible: boolean;
  humanReviewAuditRows: number;
  humanReviewAuditExact: boolean;
  humanReviewAuditCanonicalSha256: string | null;
  reviewerProfileExact: boolean;
  persistedReleaseGovernedSource: boolean;
  aiEvidenceAuditRows: number;
  supportingSourcesExact: boolean;
  contentsExact: boolean;
  linksExact: boolean;
  reviewsExact: boolean;
  mediaExact: boolean;
  aiContentAuditRows: number;
  aiPublicationReleaseRows: number;
  targetCitationSetsEligible: boolean;
  reverseDependencyKeys: string[];
  reverseDependenciesExact: boolean;
  scannedLinkRows: number;
  dataRowsChanged: 0;
};

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

async function rowMatches(
  row: { _id: unknown; _creationTime: number },
  expected: EvidenceHumanReviewSuccessorExactRow,
): Promise<boolean> {
  const actualHash = await sha256Canonical(row);
  const fixtureHash = expected.document
    ? await sha256Canonical(expected.document)
    : expected.exactCanonicalSha256;
  return String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && fixtureHash === expected.exactCanonicalSha256
    && actualHash === expected.exactCanonicalSha256;
}

async function rowsMatch(
  rows: Array<{ _id: unknown; _creationTime: number }>,
  expected: readonly EvidenceHumanReviewSuccessorExactRow[],
): Promise<boolean> {
  if (rows.length !== expected.length) return false;
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  for (const preimage of expected) {
    const row = byId.get(preimage.rowId);
    if (!row || !await rowMatches(row, preimage)) return false;
  }
  return true;
}

function sourceWithoutHumanReviewFields(
  source: Record<string, unknown>,
): Record<string, unknown> {
  const {
    reviewStatus: _reviewStatus,
    reviewer: _reviewer,
    reviewerQualification: _reviewerQualification,
    reviewDate: _reviewDate,
    nextReviewDate: _nextReviewDate,
    reviewNote: _reviewNote,
    reviewerId: _reviewerId,
    reviewScope: _reviewScope,
    updatedAt: _updatedAt,
    ...stable
  } = source;
  void _reviewStatus;
  void _reviewer;
  void _reviewerQualification;
  void _reviewDate;
  void _nextReviewDate;
  void _reviewNote;
  void _reviewerId;
  void _reviewScope;
  void _updatedAt;
  return stable;
}

function sourceMetadataMatches(
  source: Doc<'evidenceSources'>,
  staged: EvidenceHumanReviewSuccessorSpec['stagedSource'],
): boolean {
  return String(source._id) === staged.rowId
    && source._creationTime === staged.creationTime
    && canonicalJson(sourceWithoutHumanReviewFields(source))
      === canonicalJson(sourceWithoutHumanReviewFields(staged.document));
}

function expectedHumanReviewAuditStringsForDate(
  source: Doc<'evidenceSources'>,
  auditDateIso: string,
): {
  before: string;
  after: string;
  summary: string;
} | null {
  if (source.reviewStatus !== 'approved'
    || !source.reviewer?.trim()
    || !source.reviewerQualification?.trim()
    || !source.reviewDate?.trim()) return null;
  const note = source.reviewNote?.trim();
  const outdated = evidenceIsOutdated(source, auditDateIso);
  return {
    before: 'awaiting_review / no reviewer / no date',
    after: `approved / ${source.reviewer.trim()} (${source.reviewerQualification.trim()}) / ${source.reviewDate}${note ? ` / note: ${note}` : ''}`,
    summary: `awaiting_review → approved by ${source.reviewer.trim()} (${source.reviewerQualification.trim()})${outdated ? ' · outdated-source advisory acknowledged in reviewer note' : ''}`,
  };
}

async function humanReviewAuditMatches(
  row: Doc<'auditLogs'>,
  source: Doc<'evidenceSources'>,
  spec: EvidenceHumanReviewSuccessorSpec,
): Promise<boolean> {
  const expected = expectedHumanReviewAuditStringsForDate(
    source,
    todayIsoUtc(new Date(row._creationTime)),
  );
  return expected !== null
    && source.reviewerId !== undefined
    && row._creationTime > spec.priorRelease.creationTime
    && row._creationTime >= source.updatedAt
    && String(row.actorId) === String(source.reviewerId)
    && row.action === humanReviewAction
    && row.entityTable === 'evidenceSources'
    && row.entityId === source.sourceId
    && row.result === 'ok'
    && row.before === expected.before
    && row.after === expected.after
    && row.summary === expected.summary;
}

function reviewerProfileMatches(
  source: Doc<'evidenceSources'>,
  profiles: Doc<'parentProfiles'>[],
): boolean {
  if (profiles.length !== 1
    || source.reviewerId === undefined
    || !source.reviewer?.trim()
    || !source.reviewerQualification?.trim()
    || source.reviewScope !== 'education') return false;
  const profile = profiles[0];
  const owner = profile.staffRole === 'owner'
    || (profile.staffRole === undefined && profile.isStaff === true);
  const reviewerName = profile.displayName?.trim()
    || 'ACE Child Grow Owner / Education Reviewer';
  return owner
    && profile.userId === source.reviewerId
    && profile.staffQualification?.trim() === source.reviewerQualification.trim()
    && reviewerName === source.reviewer.trim();
}

function approvedSourceStateIsValid(
  source: Doc<'evidenceSources'>,
  spec: EvidenceHumanReviewSuccessorSpec,
  todayIso: string,
): boolean {
  const stagedUpdatedAt = spec.stagedSource.document.updatedAt;
  return source.reviewStatus === 'approved'
    && source.reviewScope === 'education'
    && source.reviewerId !== undefined
    && Boolean(source.reviewer?.trim())
    && Boolean(source.reviewerQualification?.trim())
    && Boolean(source.reviewDate && isStrictIsoDate(source.reviewDate))
    && typeof source.updatedAt === 'number'
    && typeof stagedUpdatedAt === 'number'
    && source.updatedAt > stagedUpdatedAt
    && publicationEvidenceIsEligible(source, todayIso);
}

type SuccessorSnapshot = {
  sourceHash: string;
  humanReviewAuditHash: string;
  humanReviewAuditRowId: string;
  humanReviewAuditCreationTime: number;
  reviewerProfileHash: string;
  reviewerId: string;
  reviewer: string;
  reviewerQualification: string;
  reviewDate: string;
  nextReviewDate: string | null;
  reviewNote: string | null;
};

function stableTargetsAuditData(spec: EvidenceHumanReviewSuccessorSpec) {
  return spec.targets.map((target) => ({
    key: `${target.kind}:${target.slug}`,
    content: {
      rowId: target.content.rowId,
      canonicalSha256: target.content.exactCanonicalSha256,
    },
    link: {
      rowId: target.link.rowId,
      canonicalSha256: target.link.exactCanonicalSha256,
    },
    reviews: target.reviews.map((row) => ({
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
    media: target.media.map((row) => ({
      rowId: row.rowId,
      canonicalSha256: row.exactCanonicalSha256,
    })),
  }));
}

function successorAuditBeforeJson(
  spec: EvidenceHumanReviewSuccessorSpec,
  snapshot: SuccessorSnapshot,
): string {
  return JSON.stringify({
    priorReleaseAudit: {
      releaseId: spec.priorRelease.releaseId,
      rowId: spec.priorRelease.rowId,
      canonicalSha256: spec.priorRelease.exactCanonicalSha256,
    },
    stagedSourcePreimage: {
      sourceId: spec.sourceId,
      rowId: spec.stagedSource.rowId,
      canonicalSha256: spec.stagedSource.exactCanonicalSha256,
      reviewStatus: 'awaiting_review',
    },
    qualifiedHumanReview: {
      rowId: snapshot.humanReviewAuditRowId,
      creationTime: snapshot.humanReviewAuditCreationTime,
      canonicalSha256: snapshot.humanReviewAuditHash,
      reviewerProfileCanonicalSha256: snapshot.reviewerProfileHash,
      reviewerId: snapshot.reviewerId,
      reviewer: snapshot.reviewer,
      reviewerQualification: snapshot.reviewerQualification,
      reviewDate: snapshot.reviewDate,
      nextReviewDate: snapshot.nextReviewDate,
      reviewNote: snapshot.reviewNote,
    },
    stableTargets: stableTargetsAuditData(spec),
    supportingSources: spec.supportingSources.map((source) => ({
      sourceId: source.sourceId,
      rowId: source.rowId,
      canonicalSha256: source.exactCanonicalSha256,
    })),
    reverseDependencyKeys: spec.reverseDependencyKeys,
    sourceVersionAiEvidenceAudits: 0,
    aiContentAudits: 0,
    aiPublicationReleases: 0,
  });
}

function successorAuditAfterJson(
  spec: EvidenceHumanReviewSuccessorSpec,
  snapshot: SuccessorSnapshot,
  establishedAt: number,
): string {
  return JSON.stringify({
    releaseId: spec.releaseId,
    establishedAt,
    source: {
      sourceId: spec.sourceId,
      rowId: spec.stagedSource.rowId,
      canonicalSha256: snapshot.sourceHash,
      reviewStatus: 'approved',
      reviewerId: snapshot.reviewerId,
      reviewer: snapshot.reviewer,
      reviewerQualification: snapshot.reviewerQualification,
      reviewDate: snapshot.reviewDate,
      nextReviewDate: snapshot.nextReviewDate,
      reviewNote: snapshot.reviewNote,
      citationEligible: true,
      aiEvidenceAuditRows: 0,
    },
    qualifiedHumanReviewAudit: {
      rowId: snapshot.humanReviewAuditRowId,
      creationTime: snapshot.humanReviewAuditCreationTime,
      canonicalSha256: snapshot.humanReviewAuditHash,
      reviewerProfileCanonicalSha256: snapshot.reviewerProfileHash,
    },
    priorReleaseAuditPreserved: {
      rowId: spec.priorRelease.rowId,
      canonicalSha256: spec.priorRelease.exactCanonicalSha256,
    },
    stableTargets: stableTargetsAuditData(spec),
    reverseDependencyKeys: spec.reverseDependencyKeys,
    dataRowsChanged: 0,
    publicationDecision: 'not_made',
    genericImportsProtected: true,
  });
}

async function exactPriorAudit(
  row: Doc<'auditLogs'>,
  spec: EvidenceHumanReviewSuccessorSpec,
): Promise<boolean> {
  return String(row._id) === spec.priorRelease.rowId
    && row._creationTime === spec.priorRelease.creationTime
    && row.action === spec.priorRelease.action
    && row.summary === spec.priorRelease.releaseId
    && row.result === 'ok'
    && await sha256Canonical(row) === spec.priorRelease.exactCanonicalSha256;
}

async function successorAuditState(
  rows: Doc<'auditLogs'>[],
  spec: EvidenceHumanReviewSuccessorSpec,
  snapshot: SuccessorSnapshot | null,
): Promise<{ rows: number; exact: boolean; establishedAt: number | null }> {
  if (rows.length !== 1 || snapshot === null) {
    return { rows: rows.length, exact: false, establishedAt: null };
  }
  const row = rows[0];
  let establishedAt: number | null = null;
  try {
    const parsed = JSON.parse(row.after ?? '{}') as { establishedAt?: unknown };
    establishedAt = typeof parsed.establishedAt === 'number'
      ? parsed.establishedAt : null;
  } catch {
    establishedAt = null;
  }
  const exact = establishedAt !== null
    && row.actorId === undefined
    && row.action === spec.releaseAction
    && row.entityTable === 'evidenceSources'
    && row.entityId === spec.sourceId
    && row.summary === spec.releaseId
    && row.result === 'ok'
    && row.before === successorAuditBeforeJson(spec, snapshot)
    && row.after === successorAuditAfterJson(spec, snapshot, establishedAt);
  return {
    rows: 1,
    exact,
    establishedAt: exact ? establishedAt : null,
  };
}

export async function evidenceHumanReviewSuccessorPreflight(
  ctx: DatabaseContext,
  spec: EvidenceHumanReviewSuccessorSpec,
  todayIso: string,
): Promise<EvidenceHumanReviewSuccessorState> {
  const targetRows = await Promise.all(spec.targets.map(async (target) => {
    const [contents, links, reviews, media, aiAudits, aiReleases] = await Promise.all([
      ctx.db.query('libraryContent').withIndex('by_slug', (q) =>
        q.eq('slug', target.slug)).take(2),
      ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
        .eq('kind', target.kind).eq('slug', target.slug)).take(2),
      ctx.db.query('contentReviews').withIndex('by_content', (q) =>
        q.eq('contentSlug', target.slug)).take(target.reviews.length + 1),
      ctx.db.query('libraryMedia').withIndex('by_content', (q) =>
        q.eq('contentSlug', target.slug)).take(target.media.length + 1),
      ctx.db.query('aiContentAudits').withIndex(
        'by_content_revision_and_updated_at',
        (q) => q.eq('contentSlug', target.slug),
      ).take(1),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
        q.eq('targetKey', `${target.kind}:${target.slug}`)).take(1),
    ]);
    return { target, contents, links, reviews, media, aiAudits, aiReleases };
  }));

  const [sourceRows, priorAuditRows, successorAuditRows, humanReviewAuditRows,
    allLinks, ...supportingSourceRows] = await Promise.all([
    ctx.db.query('evidenceSources').withIndex('by_source_id', (q) =>
      q.eq('sourceId', spec.sourceId)).take(2),
    ctx.db.query('auditLogs').withIndex('by_action', (q) =>
      q.eq('action', spec.priorRelease.action)).take(2),
    ctx.db.query('auditLogs').withIndex('by_action', (q) =>
      q.eq('action', spec.releaseAction)).take(2),
    ctx.db.query('auditLogs').withIndex(
      'by_action_and_entity_table_and_entity_id_and_result',
      (q) => q.eq('action', humanReviewAction)
        .eq('entityTable', 'evidenceSources')
        .eq('entityId', spec.sourceId)
        .eq('result', 'ok'),
    ).take(2),
    ctx.db.query('evidenceLinks').take(maxLinkRows + 1),
    ...spec.supportingSources.map((expected) =>
      ctx.db.query('evidenceSources').withIndex('by_source_id', (q) =>
        q.eq('sourceId', expected.sourceId)).take(2)),
  ]);

  const source = sourceRows.length === 1 ? sourceRows[0] : null;
  const sourceHash = source ? await sha256Canonical(source) : null;
  const stagedSourceExact = Boolean(source
    && await rowMatches(source, spec.stagedSource));
  const sourceMetadataExact = Boolean(source
    && sourceMetadataMatches(source, spec.stagedSource));
  const sourceCitationEligible = Boolean(source
    && publicationEvidenceIsEligible(source, todayIso));

  const priorReleaseAuditExact = priorAuditRows.length === 1
    && await exactPriorAudit(priorAuditRows[0], spec);
  const humanReviewAudit = humanReviewAuditRows.length === 1
    ? humanReviewAuditRows[0] : null;
  const humanReviewAuditExact = Boolean(source && humanReviewAudit
    && await humanReviewAuditMatches(humanReviewAudit, source, spec));
  const humanReviewAuditHash = humanReviewAuditExact && humanReviewAudit
    ? await sha256Canonical(humanReviewAudit) : null;

  const profiles = source?.reviewerId
    ? await ctx.db.query('parentProfiles').withIndex('by_user', (q) =>
      q.eq('userId', source.reviewerId as Id<'users'>)).take(2)
    : [];
  const reviewerProfileExact = Boolean(source
    && reviewerProfileMatches(source, profiles));
  const reviewerProfileHash = reviewerProfileExact
    ? await sha256Canonical(profiles[0]) : null;
  const persistedReleaseGovernedSource = await isPersistedReleaseGovernedSource(
    ctx,
    spec.sourceId,
  );
  const aiEvidenceAuditRows = source
    ? (await ctx.db.query('aiEvidenceAudits').withIndex(
        'by_source_and_updated_at',
        (q) => q.eq('sourceId', source.sourceId)
          .eq('sourceUpdatedAt', source.updatedAt),
      ).take(1)).length
    : 0;

  const supportingSourcesExact = supportingSourceRows.length
    === spec.supportingSources.length
    && (await Promise.all(supportingSourceRows.map(async (rows, index) =>
      rows.length === 1 && await rowMatches(rows[0], spec.supportingSources[index]))))
      .every(Boolean);
  const contentsExact = (await Promise.all(targetRows.map(({ target, contents }) =>
    rowsMatch(contents, [target.content])))).every(Boolean);
  const linksExact = (await Promise.all(targetRows.map(({ target, links }) =>
    rowsMatch(links, [target.link])))).every(Boolean);
  const reviewsExact = (await Promise.all(targetRows.map(({ target, reviews }) =>
    rowsMatch(reviews, target.reviews)))).every(Boolean);
  const mediaExact = (await Promise.all(targetRows.map(({ target, media }) =>
    rowsMatch(media, target.media)))).every(Boolean);
  const aiContentAuditRows = targetRows.reduce(
    (count, target) => count + target.aiAudits.length, 0,
  );
  const aiPublicationReleaseRows = targetRows.reduce(
    (count, target) => count + target.aiReleases.length, 0,
  );

  const liveSources = [
    ...supportingSourceRows.flatMap((rows) => rows),
    ...sourceRows,
  ];
  const targetCitationSetsEligible = targetRows.every(({ links }) => {
    if (links.length !== 1) return false;
    return evaluatePublicationEvidence(links[0].sourceIds, liveSources, todayIso).allowed;
  });
  const reverseDependencyKeys = allLinks
    .filter((link) => link.sourceIds.includes(spec.sourceId))
    .map((link) => `${link.kind}:${link.slug}`)
    .sort((left, right) => left.localeCompare(right));
  const reverseDependenciesExact = sameStrings(
    reverseDependencyKeys,
    spec.reverseDependencyKeys,
  );

  const approvedStateValid = Boolean(source
    && sourceMetadataExact
    && approvedSourceStateIsValid(source, spec, todayIso));
  const snapshot: SuccessorSnapshot | null = source
    && sourceHash
    && humanReviewAudit
    && humanReviewAuditHash
    && source.reviewerId
    && source.reviewer
    && source.reviewerQualification
    && source.reviewDate
    ? {
        sourceHash,
        humanReviewAuditHash,
        humanReviewAuditRowId: String(humanReviewAudit._id),
        humanReviewAuditCreationTime: humanReviewAudit._creationTime,
        reviewerProfileHash: reviewerProfileHash ?? (() => {
          if (successorAuditRows.length !== 1) return '';
          try {
            const parsed = JSON.parse(successorAuditRows[0].after ?? '{}') as {
              qualifiedHumanReviewAudit?: {
                reviewerProfileCanonicalSha256?: unknown;
              };
            };
            return typeof parsed.qualifiedHumanReviewAudit
              ?.reviewerProfileCanonicalSha256 === 'string'
              ? parsed.qualifiedHumanReviewAudit.reviewerProfileCanonicalSha256 : '';
          } catch {
            return '';
          }
        })(),
        reviewerId: String(source.reviewerId),
        reviewer: source.reviewer,
        reviewerQualification: source.reviewerQualification,
        reviewDate: source.reviewDate,
        nextReviewDate: source.nextReviewDate,
        reviewNote: source.reviewNote?.trim() || null,
      }
    : null;
  const successorAudit = await successorAuditState(
    successorAuditRows,
    spec,
    snapshot,
  );

  const blockers: string[] = [];
  if (!isStrictIsoDate(todayIso)) blockers.push('todayIso is invalid');
  if (priorAuditRows.length !== 1) blockers.push('prior release audit row count is not one');
  if (priorAuditRows.length === 1 && !priorReleaseAuditExact) {
    blockers.push('prior release audit is malformed or drifted');
  }
  if (successorAuditRows.length > 1) blockers.push('duplicate successor audit rows');
  if (successorAuditRows.length === 1 && !successorAudit.exact) {
    blockers.push('successor audit is malformed or drifted');
  }
  if (sourceRows.length !== 1) blockers.push('staged source row count is not one');
  if (!sourceMetadataExact) blockers.push('staged source non-review metadata drifted');
  if (humanReviewAuditRows.length > 1) blockers.push('duplicate successful human review audits');
  if (persistedReleaseGovernedSource) {
    blockers.push('staged source is governed by a persisted clinical release batch');
  }
  if (aiEvidenceAuditRows !== 0) {
    blockers.push('unexpected AI evidence audit exists for staged source version');
  }
  if (!supportingSourcesExact) blockers.push('supporting evidence source preimage drifted');
  if (!contentsExact) blockers.push('content postimage drifted');
  if (!linksExact) blockers.push('evidence-link postimage drifted');
  if (!reviewsExact) blockers.push('content review history drifted');
  if (!mediaExact) blockers.push('media postimage drifted');
  if (aiContentAuditRows !== 0) blockers.push('unexpected AI content audit exists');
  if (aiPublicationReleaseRows !== 0) blockers.push('unexpected AI publication release exists');
  if (allLinks.length > maxLinkRows) blockers.push('evidence-link reverse scan exceeded bound');
  if (!reverseDependenciesExact) blockers.push('staged source reverse dependencies drifted');
  if (!targetCitationSetsEligible) blockers.push('target citation set is not eligible');

  let phase: EvidenceHumanReviewSuccessorState['phase'] = 'blocked';
  if (blockers.length === 0
    && successorAudit.rows === 0
    && humanReviewAuditRows.length === 0
    && stagedSourceExact
    && source?.reviewStatus === 'awaiting_review'
    && !sourceCitationEligible) {
    phase = 'awaiting_human_review';
  } else if (blockers.length === 0
    && successorAudit.rows === 0
    && humanReviewAuditRows.length === 1
    && humanReviewAuditExact
    && approvedStateValid
    && reviewerProfileExact
    && sourceCitationEligible) {
    phase = 'ready';
  } else if (blockers.length === 0
    && successorAudit.rows === 1
    && successorAudit.exact
    && humanReviewAuditRows.length === 1
    && humanReviewAuditExact
    && approvedStateValid
    && sourceCitationEligible) {
    phase = 'applied';
  } else if (blockers.length === 0) {
    if (successorAudit.rows === 0 && humanReviewAuditRows.length === 0
      && !stagedSourceExact) blockers.push('awaiting-review source preimage drifted');
    if (humanReviewAuditRows.length === 1 && !humanReviewAuditExact) {
      blockers.push('successful human review audit is malformed or not a direct approval');
    }
    if (humanReviewAuditRows.length === 1 && !approvedStateValid) {
      blockers.push('approved source state is invalid or ineligible');
    }
    if (successorAudit.rows === 0 && humanReviewAuditRows.length === 1
      && !reviewerProfileExact) blockers.push('qualified owner reviewer profile does not match');
    if (successorAudit.rows === 1 && !successorAudit.exact) {
      blockers.push('successor audit exists but exact postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: spec.releaseId,
    phase,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    todayIso,
    priorReleaseAuditRows: priorAuditRows.length,
    priorReleaseAuditExact,
    successorAuditRows: successorAudit.rows,
    successorAuditExact: successorAudit.exact,
    establishedAt: successorAudit.establishedAt,
    sourceRows: sourceRows.length,
    sourceStatus: source?.reviewStatus ?? null,
    stagedSourceExact,
    sourceMetadataExact,
    sourceCanonicalSha256: sourceHash,
    sourceCitationEligible,
    humanReviewAuditRows: humanReviewAuditRows.length,
    humanReviewAuditExact,
    humanReviewAuditCanonicalSha256: humanReviewAuditHash,
    reviewerProfileExact,
    persistedReleaseGovernedSource,
    aiEvidenceAuditRows,
    supportingSourcesExact,
    contentsExact,
    linksExact,
    reviewsExact,
    mediaExact,
    aiContentAuditRows,
    aiPublicationReleaseRows,
    targetCitationSetsEligible,
    reverseDependencyKeys,
    reverseDependenciesExact,
    scannedLinkRows: allLinks.length,
    dataRowsChanged: 0,
  };
}

export async function establishEvidenceHumanReviewSuccessor<
  const Spec extends EvidenceHumanReviewSuccessorSpec,
>(
  ctx: MutationCtx,
  spec: Spec,
): Promise<{
  releaseId: Spec['releaseId'];
  applied: boolean;
  alreadyApplied: boolean;
  dataRowsChanged: 0;
  establishedAt: number;
}> {
  const todayIso = todayIsoUtc();
  const before = await evidenceHumanReviewSuccessorPreflight(ctx, spec, todayIso);
  if (before.phase === 'applied') {
    if (before.establishedAt === null) throw new Error('Applied successor lacks timestamp');
    return {
      releaseId: spec.releaseId,
      applied: false,
      alreadyApplied: true,
      dataRowsChanged: 0,
      establishedAt: before.establishedAt,
    };
  }
  if (before.phase !== 'ready') {
    throw new Error(
      `${spec.releaseId} preflight blocked: ${before.blockers.join('; ')}`,
    );
  }
  const rechecked = await evidenceHumanReviewSuccessorPreflight(ctx, spec, todayIso);
  if (rechecked.phase !== 'ready') throw new Error('State changed after preflight');
  if (!rechecked.sourceCanonicalSha256
    || !rechecked.humanReviewAuditCanonicalSha256) {
    throw new Error('Ready successor is missing exact source or human audit hash');
  }

  const sourceRows = await ctx.db.query('evidenceSources')
    .withIndex('by_source_id', (q) => q.eq('sourceId', spec.sourceId)).take(2);
  const humanAuditRows = await ctx.db.query('auditLogs').withIndex(
    'by_action_and_entity_table_and_entity_id_and_result',
    (q) => q.eq('action', humanReviewAction)
      .eq('entityTable', 'evidenceSources')
      .eq('entityId', spec.sourceId)
      .eq('result', 'ok'),
  ).take(2);
  if (sourceRows.length !== 1 || humanAuditRows.length !== 1) {
    throw new Error('Exact approval rows disappeared after preflight');
  }
  const source = sourceRows[0];
  if (!source.reviewerId || !source.reviewer
    || !source.reviewerQualification || !source.reviewDate) {
    throw new Error('Exact approved source identity disappeared after preflight');
  }
  const profiles = await ctx.db.query('parentProfiles').withIndex('by_user', (q) =>
    q.eq('userId', source.reviewerId as Id<'users'>)).take(2);
  if (!reviewerProfileMatches(source, profiles)) {
    throw new Error('Qualified owner reviewer profile changed after preflight');
  }
  const snapshot: SuccessorSnapshot = {
    sourceHash: rechecked.sourceCanonicalSha256,
    humanReviewAuditHash: rechecked.humanReviewAuditCanonicalSha256,
    humanReviewAuditRowId: String(humanAuditRows[0]._id),
    humanReviewAuditCreationTime: humanAuditRows[0]._creationTime,
    reviewerProfileHash: await sha256Canonical(profiles[0]),
    reviewerId: String(source.reviewerId),
    reviewer: source.reviewer,
    reviewerQualification: source.reviewerQualification,
    reviewDate: source.reviewDate,
    nextReviewDate: source.nextReviewDate,
    reviewNote: source.reviewNote?.trim() || null,
  };
  const establishedAt = Date.now();
  await logAudit(
    ctx,
    null,
    spec.releaseAction,
    'evidenceSources',
    spec.sourceId,
    spec.releaseId,
    {
      result: 'ok',
      before: successorAuditBeforeJson(spec, snapshot),
      after: successorAuditAfterJson(spec, snapshot, establishedAt),
    },
  );
  const after = await evidenceHumanReviewSuccessorPreflight(ctx, spec, todayIso);
  if (after.phase !== 'applied') {
    throw new Error(
      `${spec.releaseId} postflight failed; transaction rolled back: ${after.blockers.join('; ')}`,
    );
  }
  return {
    releaseId: spec.releaseId,
    applied: true,
    alreadyApplied: false,
    dataRowsChanged: 0,
    establishedAt,
  };
}
