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
  CDC_AFM_SOURCE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_FIXTURE_SHA256,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES,
  SWAIMAN_SUDDEN_WEAKNESS_TARGET,
  type SwaimanSuddenWeaknessSourcePreimage,
} from './lib/swaimanSuddenWeaknessCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const releaseAction = 'release.swaiman_sudden_weakness_cleanup';
const maxLinkRows = 500;

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
  reviewer: v.union(v.string(), v.null()),
  reviewerQualification: v.union(v.string(), v.null()),
  reviewDate: v.union(v.string(), v.null()),
  nextReviewDate: v.union(v.string(), v.null()),
  verifiedOn: v.union(v.string(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  initialExact: v.boolean(),
  desiredExact: v.boolean(),
  includedInDesired: v.boolean(),
  eligible: v.boolean(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID),
  phase: phaseValidator,
  todayIso: v.string(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  blockers: v.array(v.string()),
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
  libraryRows: v.number(),
  scannedLinkRows: v.number(),
  reverseDependencyKeys: v.array(v.string()),
  reverseInitialMatches: v.boolean(),
  reverseDesiredMatches: v.boolean(),
  sources: v.array(sourceStateValidator),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function linkIdentityMatches(row: Doc<'evidenceLinks'>): boolean {
  const expectedKeys = [
    '_creationTime',
    '_id',
    'createdAt',
    'kind',
    'slug',
    'sourceIds',
    'updatedAt',
  ];
  return sameStrings(
    Object.keys(row).sort((left, right) => left.localeCompare(right)),
    expectedKeys,
  )
    && String(row._id) === SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkId
    && row._creationTime === SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkCreationTime
    && row.createdAt === SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkCreatedAt
    && row.kind === SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind
    && row.slug === SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug;
}

async function sourceInitialMatches(
  row: Doc<'evidenceSources'>,
  expected: SwaimanSuddenWeaknessSourcePreimage,
): Promise<boolean> {
  return String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && row.createdAt === expected.createdAt
    && row.sourceId === expected.sourceId
    && await sha256Canonical(row) === expected.initialCanonicalSha256;
}

function expectedSwaimanPostimage(updatedAt: number): Record<string, unknown> {
  const expected = SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES.find(
    (source) => source.sourceId === SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
  );
  if (!expected) throw new Error('Swaiman postimage identity is missing');
  return {
    _creationTime: expected.creationTime,
    _id: expected.rowId,
    ...SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED,
    createdAt: expected.createdAt,
    updatedAt,
  };
}

async function sourceDesiredMatches(
  row: Doc<'evidenceSources'>,
  expected: SwaimanSuddenWeaknessSourcePreimage,
  audit: AuditState,
): Promise<boolean> {
  if (expected.sourceId === CDC_AFM_SOURCE_ID) {
    return sourceInitialMatches(row, expected);
  }
  if (audit.updatedAt === null || audit.sourceCanonicalSha256 === null) return false;
  const [actualHash, expectedHash] = await Promise.all([
    sha256Canonical(row),
    sha256Canonical(expectedSwaimanPostimage(audit.updatedAt)),
  ]);
  return actualHash === expectedHash && actualHash === audit.sourceCanonicalSha256;
}

function auditBeforeJson(): string {
  return JSON.stringify({
    link: {
      kind: SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind,
      slug: SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug,
      rowId: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkId,
      canonicalSha256: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkInitialCanonicalSha256,
      sourceIds: SWAIMAN_SUDDEN_WEAKNESS_TARGET.initialSourceIds,
      updatedAt: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkInitialUpdatedAt,
    },
    sources: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES.map((source) => ({
      sourceId: source.sourceId,
      rowId: source.rowId,
      canonicalSha256: source.initialCanonicalSha256,
    })),
    swaimanReverseDependencyKeys: [
      `${SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind}:${SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug}`,
    ],
  });
}

function auditAfterJson(
  updatedAt: number,
  linkCanonicalSha256: string,
  sourceCanonicalSha256: string,
): string {
  return JSON.stringify({
    link: {
      kind: SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind,
      slug: SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug,
      rowId: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkId,
      canonicalSha256: linkCanonicalSha256,
      sourceIds: SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds,
      updatedAt,
    },
    source: {
      sourceId: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
      rowId: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES[1].rowId,
      canonicalSha256: sourceCanonicalSha256,
      reviewStatus: 'awaiting_review',
      updatedAt,
    },
    cdcSourcePreserved: CDC_AFM_SOURCE_ID,
    swaimanReverseDependencyKeys: [],
    citationEligible: true,
    sourceFixtureSha256: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_FIXTURE_SHA256,
  });
}

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  linkCanonicalSha256: string | null;
  sourceCanonicalSha256: string | null;
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
      linkCanonicalSha256: null,
      sourceCanonicalSha256: null,
    };
  }
  const row = rows[0];
  let updatedAt: number | null = null;
  let linkCanonicalSha256: string | null = null;
  let sourceCanonicalSha256: string | null = null;
  try {
    const detail = JSON.parse(row.after ?? '{}') as {
      link?: { canonicalSha256?: unknown; updatedAt?: unknown };
      source?: { canonicalSha256?: unknown; updatedAt?: unknown };
    };
    if (typeof detail.link?.updatedAt === 'number'
      && detail.link.updatedAt === detail.source?.updatedAt) {
      updatedAt = detail.link.updatedAt;
    }
    if (typeof detail.link?.canonicalSha256 === 'string') {
      linkCanonicalSha256 = detail.link.canonicalSha256;
    }
    if (typeof detail.source?.canonicalSha256 === 'string') {
      sourceCanonicalSha256 = detail.source.canonicalSha256;
    }
  } catch {
    updatedAt = null;
  }
  const exact = updatedAt !== null
    && linkCanonicalSha256 !== null
    && sourceCanonicalSha256 !== null
    && row.actorId === undefined
    && row.entityTable === 'evidenceLinks,evidenceSources'
    && row.entityId === undefined
    && row.summary === SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, linkCanonicalSha256, sourceCanonicalSha256);
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    linkCanonicalSha256: exact ? linkCanonicalSha256 : null,
    sourceCanonicalSha256: exact ? sourceCanonicalSha256 : null,
  };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const todayIso = todayIsoUtc(new Date(now));
  const [audit, linkRows, libraryRows, allLinks] = await Promise.all([
    releaseAuditState(ctx),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind)
      .eq('slug', SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug)).take(2),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q
      .eq('slug', SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug)).take(1),
    ctx.db.query('evidenceLinks').take(maxLinkRows + 1),
  ]);

  const sourceResults = await Promise.all(SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES.map(
    async (expected) => {
      const rows = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId))
        .take(2);
      const row = rows.length === 1 ? rows[0] : null;
      const initialExact = row !== null && await sourceInitialMatches(row, expected);
      const desiredExact = row !== null && await sourceDesiredMatches(row, expected, audit);
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
          reviewer: row?.reviewer ?? null,
          reviewerQualification: row?.reviewerQualification ?? null,
          reviewDate: row?.reviewDate ?? null,
          nextReviewDate: row?.nextReviewDate ?? null,
          verifiedOn: row?.verifiedOn ?? null,
          updatedAt: row?.updatedAt ?? null,
          initialExact,
          desiredExact,
          includedInDesired: expected.includedInDesired,
          eligible,
        },
      };
    },
  ));

  const sourcesById = new Map(sourceResults.flatMap((result) => result.row
    ? [[result.expected.sourceId, result.row] as const]
    : []));
  const desiredSources = SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds.flatMap((sourceId) => {
    const row = sourcesById.get(sourceId);
    return row ? [row] : [];
  });
  const eligibleDesiredSourceIds = desiredSources
    .filter((source) => source.reviewStatus === 'approved'
      && publicationEvidenceIsEligible(source, todayIso))
    .map((source) => source.sourceId)
    .sort((left, right) => left.localeCompare(right));
  const citationEligible = evaluatePublicationEvidence(
    SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds,
    desiredSources,
    todayIso,
  ).allowed;

  const link = linkRows.length === 1 ? linkRows[0] : null;
  const linkHash = link ? await sha256Canonical(link) : null;
  const initialMatches = Boolean(link
    && linkIdentityMatches(link)
    && link.updatedAt === SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkInitialUpdatedAt
    && linkHash === SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkInitialCanonicalSha256
    && sameStrings(link.sourceIds, SWAIMAN_SUDDEN_WEAKNESS_TARGET.initialSourceIds));
  const desiredMatches = Boolean(link
    && linkIdentityMatches(link)
    && audit.updatedAt !== null
    && link.updatedAt === audit.updatedAt
    && linkHash === audit.linkCanonicalSha256
    && sameStrings(link.sourceIds, SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds));

  const reverseDependencyKeys = allLinks
    .filter((candidate) => candidate.sourceIds.includes(SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID))
    .map((candidate) => `${candidate.kind}:${candidate.slug}`)
    .sort((left, right) => left.localeCompare(right));
  const expectedInitialReverse = [
    `${SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind}:${SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug}`,
  ];
  const reverseInitialMatches = sameStrings(reverseDependencyKeys, expectedInitialReverse);
  const reverseDesiredMatches = reverseDependencyKeys.length === 0;

  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  if (linkRows.length !== 1) blockers.push('sudden-weakness link row count is not one');
  if (libraryRows.length !== 0) blockers.push('sudden-weakness safety rule gained a library row');
  if (allLinks.length > maxLinkRows) blockers.push('evidence-link reverse scan exceeded bound');
  if (!citationEligible) blockers.push('desired sudden-weakness citation is not eligible');
  if (!sameStrings(eligibleDesiredSourceIds, [CDC_AFM_SOURCE_ID])) {
    blockers.push('eligible sudden-weakness citation set drifted');
  }
  for (const result of sourceResults) {
    if (result.public.rows !== 1) {
      blockers.push(`source row count is not one: ${result.expected.sourceId}`);
    }
  }

  const allSourcesInitialExact = sourceResults.every((result) => result.public.initialExact);
  const allSourcesDesiredExact = sourceResults.every((result) => result.public.desiredExact);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact
    && desiredMatches && allSourcesDesiredExact && reverseDesiredMatches) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0
    && initialMatches && allSourcesInitialExact && reverseInitialMatches) {
    phase = 'ready';
  } else {
    if (audit.rows === 0 && !initialMatches) {
      blockers.push('production sudden-weakness link preimage drifted');
    }
    if (audit.rows === 0 && !allSourcesInitialExact) {
      blockers.push('production sudden-weakness source preimage drifted');
    }
    if (audit.rows === 0 && !reverseInitialMatches) {
      blockers.push('Swaiman reverse dependencies drifted');
    }
    if (audit.rows === 0 && link
      && sameStrings(link.sourceIds, SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds)) {
      blockers.push('desired sudden-weakness link exists without the release audit');
    }
    if (audit.rows === 1 && audit.exact
      && (!desiredMatches || !allSourcesDesiredExact || !reverseDesiredMatches)) {
      blockers.push('release audit exists but sudden-weakness postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
    phase,
    todayIso,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    link: {
      rows: linkRows.length,
      rowId: link ? String(link._id) : null,
      sourceIds: link ? [...link.sourceIds] : [],
      updatedAt: link?.updatedAt ?? null,
      initialMatches,
      desiredMatches,
      citationEligible,
      eligibleDesiredSourceIds,
    },
    libraryRows: libraryRows.length,
    scannedLinkRows: allLinks.length,
    reverseDependencyKeys,
    reverseInitialMatches,
    reverseDesiredMatches,
    sources: sourceResults.map((result) => result.public),
  };
}

/** Read-only exact-state preflight for the final Swaiman citation dependency. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

/** Atomically narrows sudden-weakness citations and resets the unused textbook review. */
export const apply = internalMutation({
  args: { releaseId: v.literal(SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    linksUpdated: v.number(),
    sourcesReset: v.number(),
    reverseDependenciesRemaining: v.number(),
    citationsEligible: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    await assertNoPersistedReleaseGovernedContent(ctx, [SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug]);
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks audited timestamp');
      return {
        releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        linksUpdated: 0,
        sourcesReset: 0,
        reverseDependenciesRemaining: before.reverseDependencyKeys.length,
        citationsEligible: before.link.citationEligible,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(
        `Swaiman sudden-weakness CAS preflight blocked: ${before.blockers.join('; ')}`,
      );
    }

    const rechecked = await preflightState(ctx, now);
    if (rechecked.phase !== 'ready') {
      throw new Error('Swaiman sudden-weakness state changed after preflight');
    }

    const sourcePreimage = SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES.find(
      (source) => source.sourceId === SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
    );
    if (!sourcePreimage) throw new Error('Swaiman source identity is missing');

    await ctx.db.patch(
      SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkId as Id<'evidenceLinks'>,
      {
        sourceIds: [...SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds],
        updatedAt: now,
      },
    );
    await ctx.db.patch(
      sourcePreimage.rowId as Id<'evidenceSources'>,
      {
        ...SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED,
        keywords: [...SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED.keywords],
        topics: [...SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED.topics],
        reviewerQualification: undefined,
        reviewNote: undefined,
        reviewerId: undefined,
        reviewScope: undefined,
        updatedAt: now,
      },
    );

    const [linkAfter, sourceAfter] = await Promise.all([
      ctx.db.get(SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkId as Id<'evidenceLinks'>),
      ctx.db.get(sourcePreimage.rowId as Id<'evidenceSources'>),
    ]);
    if (!linkAfter || !sourceAfter) throw new Error('Swaiman cleanup postimage row disappeared');
    const [linkCanonicalSha256, sourceCanonicalSha256] = await Promise.all([
      sha256Canonical(linkAfter),
      sha256Canonical(sourceAfter),
    ]);

    await logAudit(
      ctx,
      null,
      releaseAction,
      'evidenceLinks,evidenceSources',
      undefined,
      SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, linkCanonicalSha256, sourceCanonicalSha256),
      },
    );

    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Swaiman sudden-weakness postimage validation failed; transaction rolled back');
    }
    return {
      releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      linksUpdated: 1,
      sourcesReset: 1,
      reverseDependenciesRemaining: after.reverseDependencyKeys.length,
      citationsEligible: after.link.citationEligible,
      updatedAt: now,
    };
  },
});
