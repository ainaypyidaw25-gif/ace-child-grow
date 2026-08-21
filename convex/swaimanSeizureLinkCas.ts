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
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsEligible,
} from './lib/evidencePublicationGate';
import {
  SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
  SWAIMAN_SEIZURE_LINK_CAS_SOURCE_FIXTURE_SHA256,
  SWAIMAN_SEIZURE_LINK_CAS_TARGET,
  SWAIMAN_SEIZURE_SOURCE_PREIMAGES,
  type SwaimanSeizureSourcePreimage,
} from './lib/swaimanSeizureLinkCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const releaseAction = 'release.swaiman_seizure_redundant_unlink';
const expectedEligibleDesiredSourceIds = [
  'nhs-sids-2025',
  'nice-ng143-fever-2019',
] as const;

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

const targetStateValidator = v.object({
  kind: v.literal('safety_rule'),
  slug: v.literal('seizure'),
  linkRows: v.number(),
  libraryRows: v.number(),
  linkId: v.union(v.string(), v.null()),
  sourceIds: v.array(v.string()),
  createdAt: v.union(v.number(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  initialMatches: v.boolean(),
  desiredMatches: v.boolean(),
  citationEligible: v.boolean(),
  eligibleDesiredSourceIds: v.array(v.string()),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID),
  phase: phaseValidator,
  todayIso: v.string(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  blockers: v.array(v.string()),
  target: targetStateValidator,
  sources: v.array(sourceStateValidator),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function linkIdentityMatches(row: Doc<'evidenceLinks'>): boolean {
  const actual = row as unknown as Record<string, unknown>;
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
    Object.keys(actual).sort((left, right) => left.localeCompare(right)),
    expectedKeys,
  )
    && String(row._id) === SWAIMAN_SEIZURE_LINK_CAS_TARGET.linkId
    && row._creationTime === SWAIMAN_SEIZURE_LINK_CAS_TARGET.creationTime
    && row.kind === SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind
    && row.slug === SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug
    && row.createdAt === SWAIMAN_SEIZURE_LINK_CAS_TARGET.createdAt;
}

async function sourceMatches(
  row: Doc<'evidenceSources'>,
  expected: SwaimanSeizureSourcePreimage,
): Promise<boolean> {
  return String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && row.sourceId === expected.sourceId
    && await sha256Canonical(row) === expected.exactCanonicalSha256;
}

function auditBeforeJson(): string {
  return JSON.stringify({
    target: {
      kind: SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind,
      slug: SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug,
      linkId: SWAIMAN_SEIZURE_LINK_CAS_TARGET.linkId,
      sourceIds: SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds,
      updatedAt: SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialUpdatedAt,
    },
  });
}

function auditAfterJson(updatedAt: number): string {
  return JSON.stringify({
    target: {
      kind: SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind,
      slug: SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug,
      linkId: SWAIMAN_SEIZURE_LINK_CAS_TARGET.linkId,
      sourceIds: SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds,
      updatedAt,
    },
    sourcesPreserved: SWAIMAN_SEIZURE_SOURCE_PREIMAGES.map((source) => source.sourceId),
    eligibleDesiredSourceIds: expectedEligibleDesiredSourceIds,
    citationEligible: true,
    sourceFixtureSha256: SWAIMAN_SEIZURE_LINK_CAS_SOURCE_FIXTURE_SHA256,
  });
}

async function releaseAuditState(ctx: DatabaseContext): Promise<{
  rows: number;
  exact: boolean;
  updatedAt: number | null;
}> {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction))
    .take(2);
  if (rows.length !== 1) return { rows: rows.length, exact: false, updatedAt: null };
  const row = rows[0];
  let updatedAt: number | null = null;
  try {
    const detail = JSON.parse(row.after ?? '{}') as { target?: { updatedAt?: unknown } };
    if (typeof detail.target?.updatedAt === 'number') updatedAt = detail.target.updatedAt;
  } catch {
    updatedAt = null;
  }
  const exact = updatedAt !== null
    && row.actorId === undefined
    && row.entityTable === 'evidenceLinks'
    && row.entityId === undefined
    && row.summary === SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt);
  return { rows: 1, exact, updatedAt: exact ? updatedAt : null };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const todayIso = todayIsoUtc(new Date(now));
  const audit = await releaseAuditState(ctx);
  const sourceResults = await Promise.all(SWAIMAN_SEIZURE_SOURCE_PREIMAGES.map(async (expected) => {
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
  }));
  const sourcesById = new Map(
    sourceResults.flatMap((result) => result.row
      ? [[result.expected.sourceId, result.row] as const]
      : []),
  );
  const desiredSources = SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds.flatMap((sourceId) => {
    const row = sourcesById.get(sourceId);
    return row ? [row] : [];
  });
  const eligibleDesiredSourceIds = desiredSources
    .filter((source) => source.reviewStatus === 'approved'
      && publicationEvidenceIsEligible(source, todayIso))
    .map((source) => source.sourceId)
    .sort((left, right) => left.localeCompare(right));

  const [linkRows, libraryRows] = await Promise.all([
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind)
      .eq('slug', SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug)).take(2),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q
      .eq('slug', SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug)).take(1),
  ]);
  const link = linkRows.length === 1 ? linkRows[0] : null;
  const identityMatches = link !== null && linkIdentityMatches(link);
  const initialMatches = Boolean(
    identityMatches
    && link?.updatedAt === SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialUpdatedAt
    && sameStrings(link.sourceIds, SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds),
  );
  const desiredMatches = Boolean(
    identityMatches
    && audit.updatedAt !== null
    && link?.updatedAt === audit.updatedAt
    && sameStrings(link.sourceIds, SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds),
  );
  const citationEligible = evaluatePublicationEvidence(
    SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds,
    desiredSources,
    todayIso,
  ).allowed;

  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  for (const result of sourceResults) {
    if (result.public.rows !== 1) {
      blockers.push(`source row count is not one: ${result.expected.sourceId}`);
    } else if (!result.public.exact) {
      blockers.push(`source preimage drifted: ${result.expected.sourceId}`);
    }
  }
  if (linkRows.length !== 1) blockers.push('seizure link row count is not one');
  if (libraryRows.length !== 0) blockers.push('seizure safety rule gained a library row');
  if (!citationEligible) blockers.push('desired seizure citations are not publication-eligible');
  if (!sameStrings(eligibleDesiredSourceIds, expectedEligibleDesiredSourceIds)) {
    blockers.push('eligible desired seizure citation set drifted');
  }

  const allSourcesExact = sourceResults.every((result) => result.public.exact);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact && desiredMatches
    && allSourcesExact && libraryRows.length === 0) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0 && initialMatches
    && allSourcesExact && libraryRows.length === 0) {
    phase = 'ready';
  } else {
    if (audit.rows === 0 && !initialMatches) blockers.push('production seizure-link preimage drifted');
    if (audit.rows === 0 && link !== null && linkIdentityMatches(link)
      && sameStrings(link.sourceIds, SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds)) {
      blockers.push('desired seizure-link postimage exists without the release audit');
    }
    if (audit.rows === 1 && audit.exact && !desiredMatches) {
      blockers.push('release audit exists but seizure-link postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
    phase,
    todayIso,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    target: {
      kind: SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind,
      slug: SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug,
      linkRows: linkRows.length,
      libraryRows: libraryRows.length,
      linkId: link ? String(link._id) : null,
      sourceIds: link ? [...link.sourceIds] : [],
      createdAt: link?.createdAt ?? null,
      updatedAt: link?.updatedAt ?? null,
      initialMatches,
      desiredMatches,
      citationEligible,
      eligibleDesiredSourceIds,
    },
    sources: sourceResults.map((result) => result.public),
  };
}

/** Read-only exact-state preflight for the seizure safety-rule citation link. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

/** Atomically removes only the redundant/inconsistent Swaiman citation. */
export const apply = internalMutation({
  args: { releaseId: v.literal(SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    linksUpdated: v.number(),
    sourcesPreserved: v.number(),
    citationsEligible: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks audited timestamp');
      return {
        releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        linksUpdated: 0,
        sourcesPreserved: before.sources.length,
        citationsEligible: before.target.citationEligible,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Swaiman seizure-link CAS preflight blocked: ${before.blockers.join('; ')}`);
    }

    const linkRows = await ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind)
      .eq('slug', SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug)).take(2);
    if (linkRows.length !== 1
      || !linkIdentityMatches(linkRows[0])
      || linkRows[0].updatedAt !== SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialUpdatedAt
      || !sameStrings(linkRows[0].sourceIds, SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds)) {
      throw new Error('Seizure evidence link changed after preflight');
    }
    const sourceRows: Doc<'evidenceSources'>[] = [];
    for (const expected of SWAIMAN_SEIZURE_SOURCE_PREIMAGES) {
      const rows = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId))
        .take(2);
      if (rows.length !== 1 || !await sourceMatches(rows[0], expected)) {
        throw new Error(`Seizure citation source changed after preflight: ${expected.sourceId}`);
      }
      sourceRows.push(rows[0]);
    }
    const desiredSources = SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds.flatMap((sourceId) => {
      const source = sourceRows.find((row) => row.sourceId === sourceId);
      return source ? [source] : [];
    });
    if (!evaluatePublicationEvidence(
      SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds,
      desiredSources,
      before.todayIso,
    ).allowed) {
      throw new Error('Seizure citations became ineligible after preflight');
    }

    await ctx.db.patch(linkRows[0]._id, {
      sourceIds: [...SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds],
      updatedAt: now,
    });
    await logAudit(
      ctx,
      null,
      releaseAction,
      'evidenceLinks',
      undefined,
      SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now),
      },
    );

    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Swaiman seizure-link CAS postimage validation failed; transaction rolled back');
    }
    return {
      releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      linksUpdated: 1,
      sourcesPreserved: after.sources.length,
      citationsEligible: after.target.citationEligible,
      updatedAt: now,
    };
  },
});
