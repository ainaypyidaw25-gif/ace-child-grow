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
import { assertNoPersistedReleaseGovernedContent } from './lib/clinicalReviewBatchProvenance';
import { todayIsoUtc } from './lib/evidenceFreshness';
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsEligible,
} from './lib/evidencePublicationGate';
import {
  ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID,
  ASQ_DOCTOR_VISITS_MEDIA_PREIMAGES,
  ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES,
  ASQ_DOCTOR_VISITS_SOURCE_PREIMAGES,
  ASQ_DOCTOR_VISITS_TARGET,
  type AsqDoctorVisitsSourcePreimage,
} from './lib/asqDoctorVisitsLinkCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type ExactRowPreimage = {
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
};

const releaseAction = 'release.asq_doctor_visits_scope_unlink';

const phaseValidator = v.union(
  v.literal('ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const sourceStateValidator = v.object({
  sourceId: v.string(),
  rows: v.number(),
  rowId: v.union(v.string(), v.null()),
  reviewStatus: v.union(v.string(), v.null()),
  reviewDate: v.union(v.string(), v.null()),
  nextReviewDate: v.union(v.string(), v.null()),
  verifiedOn: v.union(v.string(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  includedInDesired: v.boolean(),
  exact: v.boolean(),
  eligible: v.boolean(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID),
  phase: phaseValidator,
  todayIso: v.string(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  blockers: v.array(v.string()),
  content: v.object({
    rows: v.number(),
    rowId: v.union(v.string(), v.null()),
    clinicalStatus: v.union(v.string(), v.null()),
    reviewRevision: v.union(v.number(), v.null()),
    updatedAt: v.union(v.number(), v.null()),
    initialMatches: v.boolean(),
    desiredMatches: v.boolean(),
  }),
  link: v.object({
    rows: v.number(),
    rowId: v.union(v.string(), v.null()),
    sourceIds: v.array(v.string()),
    updatedAt: v.union(v.number(), v.null()),
    initialMatches: v.boolean(),
    desiredMatches: v.boolean(),
    citationEligible: v.boolean(),
    eligibleDesiredSourceIds: v.array(v.string()),
  }),
  mediaRows: v.number(),
  mediaExact: v.boolean(),
  reviewRows: v.number(),
  reviewsExact: v.boolean(),
  aiReleaseRows: v.number(),
  sources: v.array(sourceStateValidator),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

async function rowMatches(
  row: { _id: unknown; _creationTime: number },
  expected: ExactRowPreimage,
): Promise<boolean> {
  return String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && await sha256Canonical(row) === expected.exactCanonicalSha256;
}

async function rowsMatch(
  rows: Array<{ _id: unknown; _creationTime: number }>,
  expectedRows: readonly ExactRowPreimage[],
): Promise<boolean> {
  if (rows.length !== expectedRows.length) return false;
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  for (const expected of expectedRows) {
    const row = byId.get(expected.rowId);
    if (!row || !await rowMatches(row, expected)) return false;
  }
  return true;
}

async function sourceMatches(
  row: Doc<'evidenceSources'>,
  expected: AsqDoctorVisitsSourcePreimage,
): Promise<boolean> {
  return row.sourceId === expected.sourceId && await rowMatches(row, expected);
}

function contentIdentityMatches(row: Doc<'libraryContent'>): boolean {
  return String(row._id) === ASQ_DOCTOR_VISITS_TARGET.contentId
    && row._creationTime === ASQ_DOCTOR_VISITS_TARGET.contentCreationTime
    && row.type === ASQ_DOCTOR_VISITS_TARGET.kind
    && row.slug === ASQ_DOCTOR_VISITS_TARGET.slug;
}

function linkIdentityMatches(row: Doc<'evidenceLinks'>): boolean {
  return String(row._id) === ASQ_DOCTOR_VISITS_TARGET.linkId
    && row._creationTime === ASQ_DOCTOR_VISITS_TARGET.linkCreationTime
    && row.createdAt === ASQ_DOCTOR_VISITS_TARGET.linkCreatedAt
    && row.kind === ASQ_DOCTOR_VISITS_TARGET.kind
    && row.slug === ASQ_DOCTOR_VISITS_TARGET.slug;
}

function auditBeforeJson(): string {
  return JSON.stringify({
    content: {
      rowId: ASQ_DOCTOR_VISITS_TARGET.contentId,
      canonicalSha256: ASQ_DOCTOR_VISITS_TARGET.contentInitialCanonicalSha256,
      reviewRevision: ASQ_DOCTOR_VISITS_TARGET.contentInitialReviewRevision,
      updatedAt: ASQ_DOCTOR_VISITS_TARGET.contentInitialUpdatedAt,
    },
    link: {
      rowId: ASQ_DOCTOR_VISITS_TARGET.linkId,
      canonicalSha256: ASQ_DOCTOR_VISITS_TARGET.linkInitialCanonicalSha256,
      sourceIds: ASQ_DOCTOR_VISITS_TARGET.initialSourceIds,
      updatedAt: ASQ_DOCTOR_VISITS_TARGET.linkInitialUpdatedAt,
    },
  });
}

function auditAfterJson(
  updatedAt: number,
  contentCanonicalSha256: string,
  linkCanonicalSha256: string,
): string {
  return JSON.stringify({
    content: {
      rowId: ASQ_DOCTOR_VISITS_TARGET.contentId,
      canonicalSha256: contentCanonicalSha256,
      clinicalStatus: 'clinical_review',
      reviewRevision: ASQ_DOCTOR_VISITS_TARGET.contentDesiredReviewRevision,
      updatedAt,
    },
    link: {
      rowId: ASQ_DOCTOR_VISITS_TARGET.linkId,
      canonicalSha256: linkCanonicalSha256,
      sourceIds: ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds,
      updatedAt,
    },
    sourcesPreserved: ASQ_DOCTOR_VISITS_SOURCE_PREIMAGES.map((row) => row.sourceId),
    mediaPreserved: ASQ_DOCTOR_VISITS_MEDIA_PREIMAGES.map((row) => row.rowId),
    reviewsPreserved: ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES.map((row) => row.rowId),
    citationEligible: true,
  });
}

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  contentCanonicalSha256: string | null;
  linkCanonicalSha256: string | null;
};

async function releaseAuditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction))
    .take(2);
  if (rows.length !== 1) {
    return {
      rows: rows.length,
      exact: false,
      updatedAt: null,
      contentCanonicalSha256: null,
      linkCanonicalSha256: null,
    };
  }
  const row = rows[0];
  let updatedAt: number | null = null;
  let contentCanonicalSha256: string | null = null;
  let linkCanonicalSha256: string | null = null;
  try {
    const detail = JSON.parse(row.after ?? '{}') as {
      content?: { canonicalSha256?: unknown; updatedAt?: unknown };
      link?: { canonicalSha256?: unknown; updatedAt?: unknown };
    };
    if (typeof detail.content?.updatedAt === 'number'
      && detail.content.updatedAt === detail.link?.updatedAt) {
      updatedAt = detail.content.updatedAt;
    }
    if (typeof detail.content?.canonicalSha256 === 'string') {
      contentCanonicalSha256 = detail.content.canonicalSha256;
    }
    if (typeof detail.link?.canonicalSha256 === 'string') {
      linkCanonicalSha256 = detail.link.canonicalSha256;
    }
  } catch {
    updatedAt = null;
  }
  const exact = updatedAt !== null
    && contentCanonicalSha256 !== null
    && linkCanonicalSha256 !== null
    && row.actorId === undefined
    && row.entityTable === 'libraryContent,evidenceLinks'
    && row.entityId === undefined
    && row.summary === ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, contentCanonicalSha256, linkCanonicalSha256);
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    contentCanonicalSha256: exact ? contentCanonicalSha256 : null,
    linkCanonicalSha256: exact ? linkCanonicalSha256 : null,
  };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const todayIso = todayIsoUtc(new Date(now));
  const [audit, contentRows, linkRows, mediaRows, reviewRows, aiReleaseRows] = await Promise.all([
    releaseAuditState(ctx),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q
      .eq('slug', ASQ_DOCTOR_VISITS_TARGET.slug)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', ASQ_DOCTOR_VISITS_TARGET.kind)
      .eq('slug', ASQ_DOCTOR_VISITS_TARGET.slug)).take(2),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) => q
      .eq('contentSlug', ASQ_DOCTOR_VISITS_TARGET.slug))
      .take(ASQ_DOCTOR_VISITS_MEDIA_PREIMAGES.length + 1),
    ctx.db.query('contentReviews').withIndex('by_content', (q) => q
      .eq('contentSlug', ASQ_DOCTOR_VISITS_TARGET.slug))
      .take(ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES.length + 1),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
      .eq('targetKey', `${ASQ_DOCTOR_VISITS_TARGET.kind}:${ASQ_DOCTOR_VISITS_TARGET.slug}`))
      .take(1),
  ]);

  const sourceResults = await Promise.all(ASQ_DOCTOR_VISITS_SOURCE_PREIMAGES.map(
    async (expected) => {
      const rows = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId))
        .take(2);
      const row = rows.length === 1 ? rows[0] : null;
      const exact = row !== null && await sourceMatches(row, expected);
      const eligible = row !== null && row.reviewStatus === 'approved'
        && publicationEvidenceIsEligible(row, todayIso);
      return {
        expected,
        row,
        public: {
          sourceId: expected.sourceId,
          rows: rows.length,
          rowId: row ? String(row._id) : null,
          reviewStatus: row?.reviewStatus ?? null,
          reviewDate: row?.reviewDate ?? null,
          nextReviewDate: row?.nextReviewDate ?? null,
          verifiedOn: row?.verifiedOn ?? null,
          updatedAt: row?.updatedAt ?? null,
          includedInDesired: expected.includedInDesired,
          exact,
          eligible,
        },
      };
    },
  ));
  const sourcesById = new Map(sourceResults.flatMap((result) => result.row
    ? [[result.expected.sourceId, result.row] as const]
    : []));
  const desiredSources = ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds.flatMap((sourceId) => {
    const row = sourcesById.get(sourceId);
    return row ? [row] : [];
  });
  const eligibleDesiredSourceIds = desiredSources
    .filter((row) => row.reviewStatus === 'approved'
      && publicationEvidenceIsEligible(row, todayIso))
    .map((row) => row.sourceId);
  const citationEligible = evaluatePublicationEvidence(
    ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds,
    desiredSources,
    todayIso,
  ).allowed;

  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  const contentHash = content ? await sha256Canonical(content) : null;
  const linkHash = link ? await sha256Canonical(link) : null;
  const contentInitialMatches = Boolean(content
    && contentIdentityMatches(content)
    && content.clinicalStatus === 'clinical_review'
    && content.reviewRevision === ASQ_DOCTOR_VISITS_TARGET.contentInitialReviewRevision
    && content.updatedAt === ASQ_DOCTOR_VISITS_TARGET.contentInitialUpdatedAt
    && contentHash === ASQ_DOCTOR_VISITS_TARGET.contentInitialCanonicalSha256);
  const contentDesiredMatches = Boolean(content
    && contentIdentityMatches(content)
    && audit.updatedAt !== null
    && content.clinicalStatus === 'clinical_review'
    && content.reviewRevision === ASQ_DOCTOR_VISITS_TARGET.contentDesiredReviewRevision
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
    && contentHash === audit.contentCanonicalSha256);
  const linkInitialMatches = Boolean(link
    && linkIdentityMatches(link)
    && link.updatedAt === ASQ_DOCTOR_VISITS_TARGET.linkInitialUpdatedAt
    && linkHash === ASQ_DOCTOR_VISITS_TARGET.linkInitialCanonicalSha256
    && sameStrings(link.sourceIds, ASQ_DOCTOR_VISITS_TARGET.initialSourceIds));
  const linkDesiredMatches = Boolean(link
    && linkIdentityMatches(link)
    && audit.updatedAt !== null
    && link.updatedAt === audit.updatedAt
    && linkHash === audit.linkCanonicalSha256
    && sameStrings(link.sourceIds, ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds));
  const mediaExact = await rowsMatch(mediaRows, ASQ_DOCTOR_VISITS_MEDIA_PREIMAGES);
  const reviewsExact = await rowsMatch(reviewRows, ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES);

  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  if (contentRows.length !== 1) blockers.push('doctor-visits content row count is not one');
  if (linkRows.length !== 1) blockers.push('doctor-visits link row count is not one');
  if (!mediaExact) blockers.push('doctor-visits media preimage drifted');
  if (!reviewsExact) blockers.push('doctor-visits review history drifted');
  if (aiReleaseRows.length !== 0) blockers.push('doctor-visits content gained an AI release');
  if (!citationEligible) blockers.push('desired doctor-visits citation is not publication-eligible');
  if (!sameStrings(eligibleDesiredSourceIds, ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds)) {
    blockers.push('eligible desired doctor-visits citation set drifted');
  }
  for (const result of sourceResults) {
    if (result.public.rows !== 1) {
      blockers.push(`source row count is not one: ${result.expected.sourceId}`);
    } else if (!result.public.exact) {
      blockers.push(`source preimage drifted: ${result.expected.sourceId}`);
    }
  }

  const allSourcesExact = sourceResults.every((result) => result.public.exact);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact
    && contentDesiredMatches && linkDesiredMatches && allSourcesExact) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0
    && contentInitialMatches && linkInitialMatches && allSourcesExact) {
    phase = 'ready';
  } else {
    if (audit.rows === 0 && !contentInitialMatches) {
      blockers.push('production doctor-visits content preimage drifted');
    }
    if (audit.rows === 0 && !linkInitialMatches) {
      blockers.push('production doctor-visits link preimage drifted');
    }
    if (audit.rows === 0 && link
      && sameStrings(link.sourceIds, ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds)) {
      blockers.push('desired doctor-visits link exists without the release audit');
    }
    if (audit.rows === 1 && audit.exact && (!contentDesiredMatches || !linkDesiredMatches)) {
      blockers.push('release audit exists but doctor-visits postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID,
    phase,
    todayIso,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    content: {
      rows: contentRows.length,
      rowId: content ? String(content._id) : null,
      clinicalStatus: content?.clinicalStatus ?? null,
      reviewRevision: content?.reviewRevision ?? null,
      updatedAt: content?.updatedAt ?? null,
      initialMatches: contentInitialMatches,
      desiredMatches: contentDesiredMatches,
    },
    link: {
      rows: linkRows.length,
      rowId: link ? String(link._id) : null,
      sourceIds: link ? [...link.sourceIds] : [],
      updatedAt: link?.updatedAt ?? null,
      initialMatches: linkInitialMatches,
      desiredMatches: linkDesiredMatches,
      citationEligible,
      eligibleDesiredSourceIds,
    },
    mediaRows: mediaRows.length,
    mediaExact,
    reviewRows: reviewRows.length,
    reviewsExact,
    aiReleaseRows: aiReleaseRows.length,
    sources: sourceResults.map((result) => result.public),
  };
}

/** Read-only exact-state preflight for the hidden doctor-visits lesson row. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

/** Atomically narrows the citations and invalidates prior content reviews. */
export const apply = internalMutation({
  args: { releaseId: v.literal(ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    linksUpdated: v.number(),
    contentInvalidated: v.number(),
    sourcesPreserved: v.number(),
    mediaPreserved: v.number(),
    reviewsPreserved: v.number(),
    citationsEligible: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    await assertNoPersistedReleaseGovernedContent(ctx, [ASQ_DOCTOR_VISITS_TARGET.slug]);
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks audited timestamp');
      return {
        releaseId: ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        linksUpdated: 0,
        contentInvalidated: 0,
        sourcesPreserved: before.sources.length,
        mediaPreserved: before.mediaRows,
        reviewsPreserved: before.reviewRows,
        citationsEligible: before.link.citationEligible,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`ASQ doctor-visits CAS preflight blocked: ${before.blockers.join('; ')}`);
    }

    const rechecked = await preflightState(ctx, now);
    if (rechecked.phase !== 'ready') {
      throw new Error('ASQ doctor-visits state changed after preflight');
    }

    await ctx.db.patch(
      ASQ_DOCTOR_VISITS_TARGET.contentId as Id<'libraryContent'>,
      {
        reviewRevision: ASQ_DOCTOR_VISITS_TARGET.contentDesiredReviewRevision,
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
      },
    );
    await ctx.db.patch(
      ASQ_DOCTOR_VISITS_TARGET.linkId as Id<'evidenceLinks'>,
      {
        sourceIds: [...ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds],
        updatedAt: now,
      },
    );

    const [contentAfter, linkAfter] = await Promise.all([
      ctx.db.get(ASQ_DOCTOR_VISITS_TARGET.contentId as Id<'libraryContent'>),
      ctx.db.get(ASQ_DOCTOR_VISITS_TARGET.linkId as Id<'evidenceLinks'>),
    ]);
    if (!contentAfter || !linkAfter) throw new Error('Doctor-visits postimage row disappeared');
    const [contentCanonicalSha256, linkCanonicalSha256] = await Promise.all([
      sha256Canonical(contentAfter),
      sha256Canonical(linkAfter),
    ]);

    await logAudit(
      ctx,
      null,
      releaseAction,
      'libraryContent,evidenceLinks',
      undefined,
      ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, contentCanonicalSha256, linkCanonicalSha256),
      },
    );

    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('ASQ doctor-visits CAS postimage validation failed; transaction rolled back');
    }
    return {
      releaseId: ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      linksUpdated: 1,
      contentInvalidated: 1,
      sourcesPreserved: after.sources.length,
      mediaPreserved: after.mediaRows,
      reviewsPreserved: after.reviewRows,
      citationsEligible: after.link.citationEligible,
      updatedAt: now,
    };
  },
});
