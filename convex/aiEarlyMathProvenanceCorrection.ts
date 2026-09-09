import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { sha256Canonical } from './lib/aiAuditHash';
import { AI_PUBLICATION_CONFIG_KEY } from './lib/aiPublicationPolicy';
import {
  AI_EARLY_MATH_PROVENANCE_CORRECTION_CAPTURED_AT,
  AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
  AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC,
} from './lib/aiEarlyMathProvenanceCorrectionData';
import { isPersistedReleaseGovernedSource } from './lib/clinicalReviewBatchProvenance';
import {
  evidenceIsOutdated,
  todayIsoUtc,
} from './lib/evidenceFreshness';
import { publicationEvidenceIsEligible } from './lib/evidencePublicationGate';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const MAX_LINK_ROWS = 5_000;
const HUMAN_REVIEW_ACTION = 'evidence.setReview';

const phaseValidator = v.union(
  v.literal('correction_ready'),
  v.literal('awaiting_human_review'),
  v.literal('human_review_recorded'),
  v.literal('blocked'),
);

const preflightResultValidator = v.object({
  releaseId: v.literal(AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID),
  phase: phaseValidator,
  blockers: v.array(v.string()),
  capturedAt: v.literal(AI_EARLY_MATH_PROVENANCE_CORRECTION_CAPTURED_AT),
  todayIso: v.string(),
  sourceRows: v.number(),
  sourceStatus: v.union(v.string(), v.null()),
  sourceFullCanonicalSha256: v.union(v.string(), v.null()),
  sourceStableMetadataCanonicalSha256: v.union(v.string(), v.null()),
  sourceExactPreimage: v.boolean(),
  sourceHumanReviewFieldsCleared: v.boolean(),
  unrelatedHumanReviewAuditRows: v.number(),
  unrelatedHumanReviewAuditExact: v.boolean(),
  correctionAuditRows: v.number(),
  correctionAuditExact: v.boolean(),
  correctedAt: v.union(v.number(), v.null()),
  successorHumanReviewAuditExact: v.boolean(),
  reviewerProfileExact: v.boolean(),
  sourceBoundHumanNote: v.boolean(),
  sourceCitationEligible: v.boolean(),
  targetLinkRows: v.number(),
  targetLinkExact: v.boolean(),
  scannedLinkRows: v.number(),
  reverseDependencyKeys: v.array(v.string()),
  reverseDependenciesExact: v.boolean(),
  persistedReleaseGovernedSource: v.boolean(),
  aiEvidenceAuditRows: v.number(),
  aiPublicationReleaseRows: v.number(),
  aiPublicationConfigRows: v.number(),
  aiPublicationConfigEnabled: v.boolean(),
  dataRowsChanged: v.literal(0),
  humanReviewDecision: v.literal('not_made'),
  publicationDecision: v.literal('not_made'),
});

type PreflightState = {
  releaseId: typeof AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID;
  phase: 'correction_ready' | 'awaiting_human_review' | 'human_review_recorded' | 'blocked';
  blockers: string[];
  capturedAt: typeof AI_EARLY_MATH_PROVENANCE_CORRECTION_CAPTURED_AT;
  todayIso: string;
  sourceRows: number;
  sourceStatus: string | null;
  sourceFullCanonicalSha256: string | null;
  sourceStableMetadataCanonicalSha256: string | null;
  sourceExactPreimage: boolean;
  sourceHumanReviewFieldsCleared: boolean;
  unrelatedHumanReviewAuditRows: number;
  unrelatedHumanReviewAuditExact: boolean;
  correctionAuditRows: number;
  correctionAuditExact: boolean;
  correctedAt: number | null;
  successorHumanReviewAuditExact: boolean;
  reviewerProfileExact: boolean;
  sourceBoundHumanNote: boolean;
  sourceCitationEligible: boolean;
  targetLinkRows: number;
  targetLinkExact: boolean;
  scannedLinkRows: number;
  reverseDependencyKeys: string[];
  reverseDependenciesExact: boolean;
  persistedReleaseGovernedSource: boolean;
  aiEvidenceAuditRows: number;
  aiPublicationReleaseRows: number;
  aiPublicationConfigRows: number;
  aiPublicationConfigEnabled: boolean;
  dataRowsChanged: 0;
  humanReviewDecision: 'not_made';
  publicationDecision: 'not_made';
};

export function aiEarlyMathStableSourceMetadata(
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

function stagedSourceDocument(
  source: Doc<'evidenceSources'>,
  correctedAt: number,
): Record<string, unknown> {
  return {
    ...source,
    reviewStatus: 'awaiting_review',
    reviewer: null,
    reviewerQualification: undefined,
    reviewDate: null,
    nextReviewDate: null,
    reviewNote: undefined,
    reviewerId: undefined,
    reviewScope: undefined,
    updatedAt: correctedAt,
  };
}

export function aiEarlyMathCorrectionAuditBeforeJson(): string {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
  return JSON.stringify({
    releaseId: spec.releaseId,
    capturedAt: AI_EARLY_MATH_PROVENANCE_CORRECTION_CAPTURED_AT,
    sourcePreimage: {
      sourceId: spec.source.sourceId,
      rowId: spec.source.rowId,
      creationTime: spec.source.creationTime,
      updatedAt: spec.source.updatedAt,
      canonicalSha256: spec.source.exactCanonicalSha256,
      stableMetadataCanonicalSha256: spec.source.stableMetadataCanonicalSha256,
      reviewStatus: 'approved',
      reviewDate: spec.source.reviewDate,
      reviewerId: spec.source.reviewerId,
      reviewerSha256: spec.source.reviewerSha256,
      reviewerQualificationSha256: spec.source.reviewerQualificationSha256,
      unrelatedReviewNoteSha256: spec.source.unrelatedReviewNoteSha256,
    },
    unrelatedHumanReviewAudit: {
      rowId: spec.unrelatedHumanReviewAudit.rowId,
      creationTime: spec.unrelatedHumanReviewAudit.creationTime,
      canonicalSha256: spec.unrelatedHumanReviewAudit.exactCanonicalSha256,
    },
    dependency: {
      kind: spec.dependency.kind,
      slug: spec.dependency.slug,
      rowId: spec.dependency.rowId,
      canonicalSha256: spec.dependency.exactCanonicalSha256,
    },
    aiEvidenceAuditRows: 0,
    aiPublicationReleaseRows: 0,
  });
}

export function aiEarlyMathCorrectionAuditAfterJson(
  correctedAt: number,
  sourceCanonicalSha256: string,
): string {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
  return JSON.stringify({
    releaseId: spec.releaseId,
    correctedAt,
    source: {
      sourceId: spec.source.sourceId,
      rowId: spec.source.rowId,
      canonicalSha256: sourceCanonicalSha256,
      stableMetadataCanonicalSha256: spec.source.stableMetadataCanonicalSha256,
      reviewStatus: 'awaiting_review',
      humanReviewFieldsCleared: true,
    },
    historicalAuditPreserved: {
      rowId: spec.unrelatedHumanReviewAudit.rowId,
      canonicalSha256: spec.unrelatedHumanReviewAudit.exactCanonicalSha256,
    },
    dataRowsChanged: 1,
    humanReviewDecision: 'not_made',
    publicationDecision: 'not_made',
  });
}

async function exactRow(
  row: { _id: unknown; _creationTime: number },
  expected: { rowId: string; creationTime: number; exactCanonicalSha256: string },
): Promise<boolean> {
  return String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && await sha256Canonical(row) === expected.exactCanonicalSha256;
}

function sourceHumanReviewFieldsCleared(source: Doc<'evidenceSources'>): boolean {
  return source.reviewStatus === 'awaiting_review'
    && source.reviewer === null
    && source.reviewerQualification === undefined
    && source.reviewDate === null
    && source.nextReviewDate === null
    && source.reviewNote === undefined
    && source.reviewerId === undefined
    && source.reviewScope === undefined;
}

function sourceBoundHumanNote(source: Doc<'evidenceSources'>): boolean {
  const note = source.reviewNote?.trim().toLowerCase() ?? '';
  return note.length > 0
    && !note.includes('unicef')
    && note.includes('head start')
    && (note.includes('elof') || note.includes('early learning outcomes framework'));
}

function expectedHumanAuditStrings(
  source: Doc<'evidenceSources'>,
  auditCreationTime: number,
): { before: string; after: string; summary: string } | null {
  if (source.reviewStatus !== 'approved'
    || !source.reviewer?.trim()
    || !source.reviewerQualification?.trim()
    || !source.reviewDate?.trim()) return null;
  const note = source.reviewNote?.trim();
  const outdated = evidenceIsOutdated(source, todayIsoUtc(new Date(auditCreationTime)));
  return {
    before: 'awaiting_review / no reviewer / no date',
    after: `approved / ${source.reviewer.trim()} (${source.reviewerQualification.trim()}) / ${source.reviewDate}${note ? ` / note: ${note}` : ''}`,
    summary: `awaiting_review → approved by ${source.reviewer.trim()} (${source.reviewerQualification.trim()})${outdated ? ' · outdated-source advisory acknowledged in reviewer note' : ''}`,
  };
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
  const clinicalReviewer = profile.staffRole === 'clinical_reviewer'
    && Boolean(profile.displayName?.trim());
  const expectedReviewer = profile.displayName?.trim()
    || 'ACE Child Grow Owner / Education Reviewer';
  return (owner || clinicalReviewer)
    && profile.userId === source.reviewerId
    && profile.staffQualification?.trim() === source.reviewerQualification.trim()
    && expectedReviewer === source.reviewer.trim();
}

async function correctionAuditState(
  rows: Doc<'auditLogs'>[],
  source: Doc<'evidenceSources'> | null,
): Promise<{
  exact: boolean;
  correctedAt: number | null;
  row: Doc<'auditLogs'> | null;
}> {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
  if (rows.length !== 1 || source === null) {
    return { exact: false, correctedAt: null, row: null };
  }
  const row = rows[0];
  let correctedAt: number | null = null;
  try {
    const parsed = JSON.parse(row.after ?? '{}') as { correctedAt?: unknown };
    correctedAt = typeof parsed.correctedAt === 'number' && Number.isFinite(parsed.correctedAt)
      ? parsed.correctedAt : null;
  } catch {
    correctedAt = null;
  }
  if (correctedAt === null) return { exact: false, correctedAt: null, row };
  const stagedHash = await sha256Canonical(stagedSourceDocument(source, correctedAt));
  const exact = row.actorId === undefined
    && row._creationTime >= correctedAt
    && row.action === spec.action
    && row.entityTable === 'evidenceSources'
    && row.entityId === spec.source.sourceId
    && row.summary === spec.releaseId
    && row.result === 'ok'
    && row.before === aiEarlyMathCorrectionAuditBeforeJson()
    && row.after === aiEarlyMathCorrectionAuditAfterJson(correctedAt, stagedHash);
  return { exact, correctedAt: exact ? correctedAt : null, row };
}

async function successorHumanReviewAuditMatches(
  rows: Doc<'auditLogs'>[],
  source: Doc<'evidenceSources'>,
  correction: Awaited<ReturnType<typeof correctionAuditState>>,
): Promise<boolean> {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
  if (!correction.exact || !correction.row || correction.correctedAt === null
    || rows.length !== 2) return false;
  const successor = rows.find((row) => String(row._id) !== spec.unrelatedHumanReviewAudit.rowId);
  if (!successor) return false;
  const expected = expectedHumanAuditStrings(source, successor._creationTime);
  return expected !== null
    && source.reviewerId !== undefined
    && successor._creationTime > correction.row._creationTime
    && successor._creationTime >= source.updatedAt
    && String(successor.actorId) === String(source.reviewerId)
    && successor.action === HUMAN_REVIEW_ACTION
    && successor.entityTable === 'evidenceSources'
    && successor.entityId === spec.source.sourceId
    && successor.result === 'ok'
    && successor.before === expected.before
    && successor.after === expected.after
    && successor.summary === expected.summary;
}

async function preflightState(
  ctx: DatabaseContext,
  now: number,
): Promise<PreflightState> {
  const todayIso = todayIsoUtc(new Date(now));
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
  const [sourceRows, targetLinks, allLinks, humanAuditRows, correctionAuditRows,
    aiPublicationReleaseRows, aiPublicationConfigRows, persistedReleaseGovernedSource] = await Promise.all([
    ctx.db.query('evidenceSources').withIndex('by_source_id', (q) =>
      q.eq('sourceId', spec.source.sourceId)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', spec.dependency.kind).eq('slug', spec.dependency.slug)).take(2),
    ctx.db.query('evidenceLinks').take(MAX_LINK_ROWS + 1),
    ctx.db.query('auditLogs').withIndex(
      'by_action_and_entity_table_and_entity_id_and_result',
      (q) => q.eq('action', HUMAN_REVIEW_ACTION)
        .eq('entityTable', 'evidenceSources')
        .eq('entityId', spec.source.sourceId)
        .eq('result', 'ok'),
    ).take(3),
    ctx.db.query('auditLogs').withIndex(
      'by_action_and_entity_table_and_entity_id_and_result',
      (q) => q.eq('action', spec.action)
        .eq('entityTable', 'evidenceSources')
        .eq('entityId', spec.source.sourceId)
        .eq('result', 'ok'),
    ).take(2),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
      q.eq('targetKey', `${spec.dependency.kind}\u0000${spec.dependency.slug}`)).take(1),
    ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) =>
      q.eq('key', AI_PUBLICATION_CONFIG_KEY)).take(2),
    isPersistedReleaseGovernedSource(ctx, spec.source.sourceId),
  ]);

  const source = sourceRows.length === 1 ? sourceRows[0] : null;
  const sourceFullHash = source ? await sha256Canonical(source) : null;
  const stableMetadataHash = source
    ? await sha256Canonical(aiEarlyMathStableSourceMetadata(source)) : null;
  const unrelatedAudit = humanAuditRows.find(
    (row) => String(row._id) === spec.unrelatedHumanReviewAudit.rowId,
  );
  const unrelatedHumanReviewAuditExact = Boolean(
    unrelatedAudit && await exactRow(unrelatedAudit, spec.unrelatedHumanReviewAudit),
  );
  const targetLinkExact = targetLinks.length === 1
    && await exactRow(targetLinks[0], spec.dependency);
  const reverseDependencies = allLinks.filter(
    (link) => link.sourceIds.includes(spec.source.sourceId),
  );
  const reverseDependencyKeys = reverseDependencies
    .map((link) => `${link.kind}:${link.slug}`).sort();
  const reverseDependenciesExact = allLinks.length <= MAX_LINK_ROWS
    && reverseDependencies.length === 1
    && targetLinkExact
    && String(reverseDependencies[0]._id) === spec.dependency.rowId;
  const correction = await correctionAuditState(correctionAuditRows, source);

  const aiEvidenceAuditRows = source
    ? await ctx.db.query('aiEvidenceAudits').withIndex(
        'by_source_and_updated_at',
        (q) => q.eq('sourceId', source.sourceId).eq('sourceUpdatedAt', source.updatedAt),
      ).take(1)
    : [];
  const profiles = source?.reviewerId
    ? await ctx.db.query('parentProfiles').withIndex('by_user', (q) =>
      q.eq('userId', source.reviewerId as Id<'users'>)).take(2)
    : [];

  const sourceExactPreimage = Boolean(
    source
    && String(source._id) === spec.source.rowId
    && source._creationTime === spec.source.creationTime
    && source.updatedAt === spec.source.updatedAt
    && source.reviewStatus === 'approved'
    && source.reviewDate === spec.source.reviewDate
    && String(source.reviewerId) === spec.source.reviewerId
    && source.reviewScope === spec.source.reviewScope
    && sourceFullHash === spec.source.exactCanonicalSha256
    && stableMetadataHash === spec.source.stableMetadataCanonicalSha256
    && await sha256Canonical(source.reviewer) === spec.source.reviewerSha256
    && await sha256Canonical(source.reviewerQualification)
      === spec.source.reviewerQualificationSha256
    && await sha256Canonical(source.reviewNote) === spec.source.unrelatedReviewNoteSha256,
  );
  const humanFieldsCleared = Boolean(source && sourceHumanReviewFieldsCleared(source));
  const sourceBoundNote = Boolean(source && sourceBoundHumanNote(source));
  const sourceCitationEligible = Boolean(source
    && publicationEvidenceIsEligible(source, todayIso));
  const profileExact = Boolean(source && reviewerProfileMatches(source, profiles));
  const successorHumanAuditExact = Boolean(source && await successorHumanReviewAuditMatches(
    humanAuditRows,
    source,
    correction,
  ));
  const aiPublicationConfigEnabled = aiPublicationConfigRows.length === 1
    && aiPublicationConfigRows[0].enabled;

  const blockers: string[] = [];
  if (sourceRows.length !== 1) blockers.push('source row is missing or duplicated');
  if (source && stableMetadataHash !== spec.source.stableMetadataCanonicalSha256) {
    blockers.push('Head Start ELOF source metadata drifted');
  }
  if (!unrelatedHumanReviewAuditExact) {
    blockers.push('historical unrelated human-review audit is missing or drifted');
  }
  if (humanAuditRows.length > 2) blockers.push('unexpected extra successful human-review audit exists');
  if (!targetLinkExact) blockers.push('lsn_early_math evidence link drifted');
  if (!reverseDependenciesExact) blockers.push('source reverse dependencies drifted or exceeded the scan bound');
  if (correctionAuditRows.length > 1) blockers.push('duplicate correction audit rows exist');
  if (persistedReleaseGovernedSource) {
    blockers.push('source belongs to a persisted frozen clinical release');
  }
  if (aiEvidenceAuditRows.length !== spec.expectedAiEvidenceAuditRows) {
    blockers.push('current source version has an unexpected AI evidence audit');
  }
  if (aiPublicationReleaseRows.length !== spec.expectedAiPublicationReleaseRows) {
    blockers.push('lsn_early_math has an unexpected AI publication release');
  }
  if (aiPublicationConfigRows.length > 1 || aiPublicationConfigEnabled) {
    blockers.push('AI publication control is enabled or duplicated');
  }

  let phase: PreflightState['phase'] = 'blocked';
  if (blockers.length === 0
    && sourceExactPreimage
    && humanAuditRows.length === 1
    && correctionAuditRows.length === 0) {
    phase = 'correction_ready';
  } else if (blockers.length === 0
    && correction.exact
    && correction.correctedAt !== null
    && source?.updatedAt === correction.correctedAt
    && humanFieldsCleared
    && humanAuditRows.length === 1) {
    phase = 'awaiting_human_review';
  } else if (blockers.length === 0
    && correction.exact
    && source?.reviewStatus === 'approved'
    && sourceBoundNote
    && sourceCitationEligible
    && profileExact
    && successorHumanAuditExact) {
    phase = 'human_review_recorded';
  } else if (blockers.length === 0) {
    if (source?.reviewStatus === 'approved' && correction.exact && !sourceBoundNote) {
      blockers.push('new human review note is not bound to the Head Start ELOF source');
    } else if (source?.reviewStatus === 'approved' && correction.exact && !profileExact) {
      blockers.push('new human reviewer profile is missing, duplicated or unauthorized');
    } else if (source?.reviewStatus === 'approved' && correction.exact && !successorHumanAuditExact) {
      blockers.push('new human-review audit does not match the approved source row');
    } else {
      blockers.push('source is neither the frozen preimage nor an exact correction successor state');
    }
  }

  return {
    releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    phase,
    blockers,
    capturedAt: AI_EARLY_MATH_PROVENANCE_CORRECTION_CAPTURED_AT,
    todayIso,
    sourceRows: sourceRows.length,
    sourceStatus: source?.reviewStatus ?? null,
    sourceFullCanonicalSha256: sourceFullHash,
    sourceStableMetadataCanonicalSha256: stableMetadataHash,
    sourceExactPreimage,
    sourceHumanReviewFieldsCleared: humanFieldsCleared,
    unrelatedHumanReviewAuditRows: humanAuditRows.length,
    unrelatedHumanReviewAuditExact,
    correctionAuditRows: correctionAuditRows.length,
    correctionAuditExact: correction.exact,
    correctedAt: correction.correctedAt,
    successorHumanReviewAuditExact: successorHumanAuditExact,
    reviewerProfileExact: profileExact,
    sourceBoundHumanNote: sourceBoundNote,
    sourceCitationEligible,
    targetLinkRows: targetLinks.length,
    targetLinkExact,
    scannedLinkRows: allLinks.length,
    reverseDependencyKeys,
    reverseDependenciesExact,
    persistedReleaseGovernedSource,
    aiEvidenceAuditRows: aiEvidenceAuditRows.length,
    aiPublicationReleaseRows: aiPublicationReleaseRows.length,
    aiPublicationConfigRows: aiPublicationConfigRows.length,
    aiPublicationConfigEnabled,
    dataRowsChanged: 0,
    humanReviewDecision: 'not_made',
    publicationDecision: 'not_made',
  };
}

/** Read-only, exact-state diagnostic. This function never records a review decision. */
export const preflight = internalQuery({
  args: {
    releaseId: v.literal(AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID),
  },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

/**
 * Clear only the unrelated historical review fields after an exact CAS check.
 * The corrected source is deliberately left awaiting_review. A later,
 * authenticated human must review the actual Head Start ELOF source through
 * the ordinary evidence review workflow.
 */
export const prepare = internalMutation({
  args: {
    releaseId: v.literal(AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID),
  },
  returns: v.object({
    releaseId: v.literal(AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    sourceRowsChanged: v.union(v.literal(0), v.literal(1)),
    auditRowsCreated: v.union(v.literal(0), v.literal(1)),
    correctedAt: v.number(),
    humanReviewDecision: v.literal('not_made'),
    publicationDecision: v.literal('not_made'),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'awaiting_human_review'
      || before.phase === 'human_review_recorded') {
      if (before.correctedAt === null) throw new Error('Exact successor lacks correctedAt');
      return {
        releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        sourceRowsChanged: 0 as const,
        auditRowsCreated: 0 as const,
        correctedAt: before.correctedAt,
        humanReviewDecision: 'not_made' as const,
        publicationDecision: 'not_made' as const,
      };
    }
    if (before.phase !== 'correction_ready') {
      throw new Error(`AI early-math provenance correction blocked: ${before.blockers.join('; ')}`);
    }
    const rechecked = await preflightState(ctx, now);
    if (rechecked.phase !== 'correction_ready') throw new Error('State changed after preflight');

    const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
    const sourceRows = await ctx.db.query('evidenceSources').withIndex('by_source_id', (q) =>
      q.eq('sourceId', spec.source.sourceId)).take(2);
    if (sourceRows.length !== 1 || !await exactRow(sourceRows[0], spec.source)) {
      throw new Error('Exact source preimage disappeared after preflight');
    }
    const source = sourceRows[0];
    const correctedAt = now;
    await ctx.db.patch(source._id, {
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewerQualification: undefined,
      reviewDate: null,
      nextReviewDate: null,
      reviewNote: undefined,
      reviewerId: undefined,
      reviewScope: undefined,
      updatedAt: correctedAt,
    });
    const staged = await ctx.db.get(source._id);
    if (!staged
      || !sourceHumanReviewFieldsCleared(staged)
      || await sha256Canonical(aiEarlyMathStableSourceMetadata(staged))
        !== spec.source.stableMetadataCanonicalSha256
      || staged.updatedAt !== correctedAt) {
      throw new Error('Correction postimage drifted; transaction rolled back');
    }
    const stagedHash = await sha256Canonical(staged);
    await logAudit(
      ctx,
      null,
      spec.action,
      'evidenceSources',
      spec.source.sourceId,
      spec.releaseId,
      {
        result: 'ok',
        before: aiEarlyMathCorrectionAuditBeforeJson(),
        after: aiEarlyMathCorrectionAuditAfterJson(correctedAt, stagedHash),
      },
    );

    const after = await preflightState(ctx, now);
    if (after.phase !== 'awaiting_human_review' || after.correctedAt !== correctedAt) {
      throw new Error(`Correction postflight failed; transaction rolled back: ${after.blockers.join('; ')}`);
    }
    return {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      sourceRowsChanged: 1 as const,
      auditRowsCreated: 1 as const,
      correctedAt,
      humanReviewDecision: 'not_made' as const,
      publicationDecision: 'not_made' as const,
    };
  },
});
