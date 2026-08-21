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
import { evaluatePublicationEvidence } from './lib/evidencePublicationGate';
import {
  INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES,
  INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
  INHERENT_PUBLIC_LINK_CAS_SNAPSHOT_SHA256,
  INHERENT_PUBLIC_LINK_CAS_TARGETS,
  type InherentPublicCitationSourcePreimage,
  type InherentPublicLinkCasTarget,
} from './lib/inherentPublicLinkCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const releaseAction = 'release.inherent_public_citation_links';
const expectedSourceIds = [...new Set(
  INHERENT_PUBLIC_LINK_CAS_TARGETS.flatMap((target) => [...target.desiredSourceIds]),
)].sort((left, right) => left.localeCompare(right));

const phaseValidator = v.union(
  v.literal('ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const targetStateValidator = v.object({
  kind: v.string(),
  slug: v.string(),
  linkRows: v.number(),
  libraryRows: v.number(),
  linkId: v.union(v.string(), v.null()),
  sourceIds: v.array(v.string()),
  createdAt: v.union(v.number(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  initialMatches: v.boolean(),
  desiredMatches: v.boolean(),
  citationEligible: v.boolean(),
});

const sourceStateValidator = v.object({
  sourceId: v.string(),
  rows: v.number(),
  rowId: v.union(v.string(), v.null()),
  reviewStatus: v.union(v.string(), v.null()),
  reviewDate: v.union(v.string(), v.null()),
  nextReviewDate: v.union(v.string(), v.null()),
  verifiedOn: v.union(v.string(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  exact: v.boolean(),
  eligible: v.boolean(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(INHERENT_PUBLIC_LINK_CAS_RELEASE_ID),
  phase: phaseValidator,
  todayIso: v.string(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  blockers: v.array(v.string()),
  targets: v.array(targetStateValidator),
  sources: v.array(sourceStateValidator),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function linkIdentityMatches(
  row: Doc<'evidenceLinks'>,
  target: InherentPublicLinkCasTarget,
): boolean {
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
    && String(row._id) === target.linkId
    && row._creationTime === target.creationTime
    && row.kind === target.kind
    && row.slug === target.slug
    && row.createdAt === target.createdAt;
}

async function sourceMatches(
  row: Doc<'evidenceSources'>,
  expected: InherentPublicCitationSourcePreimage,
): Promise<boolean> {
  return await sha256Canonical(row) === expected.exactCanonicalSha256
    && String(row._id) === expected.rowId
    && row._creationTime === expected.creationTime
    && row.sourceId === expected.sourceId
    && row.org === expected.org
    && row.orgKey === expected.orgKey
    && row.title === expected.title
    && row.url === expected.url
    && row.evidenceLevel === expected.evidenceLevel
    && row.reviewStatus === expected.reviewStatus
    && row.reviewer === expected.reviewer
    && String(row.reviewerId) === expected.reviewerId
    && row.reviewerQualification === expected.reviewerQualification
    && row.reviewScope === expected.reviewScope
    && row.year === expected.year
    && row.reviewDate === expected.reviewDate
    && row.nextReviewDate === expected.nextReviewDate
    && row.verifiedOn === expected.verifiedOn
    && row.updatedAt === expected.updatedAt;
}

function auditBeforeJson(): string {
  return JSON.stringify({
    targets: INHERENT_PUBLIC_LINK_CAS_TARGETS.map((target) => ({
      kind: target.kind,
      slug: target.slug,
      linkId: target.linkId,
      sourceIds: target.initialSourceIds,
      updatedAt: target.initialUpdatedAt,
    })),
  });
}

function auditAfterJson(updatedAt: number): string {
  return JSON.stringify({
    targets: INHERENT_PUBLIC_LINK_CAS_TARGETS.map((target) => ({
      kind: target.kind,
      slug: target.slug,
      linkId: target.linkId,
      sourceIds: target.desiredSourceIds,
      updatedAt,
    })),
    sourcesPreserved: expectedSourceIds,
    citationEligible: true,
    snapshotSha256: INHERENT_PUBLIC_LINK_CAS_SNAPSHOT_SHA256,
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
    const detail = JSON.parse(row.after ?? '{}') as { targets?: Array<{ updatedAt?: unknown }> };
    const timestamps = detail.targets?.map((target) => target.updatedAt) ?? [];
    if (timestamps.length === INHERENT_PUBLIC_LINK_CAS_TARGETS.length
      && timestamps.every((value) => typeof value === 'number' && value === timestamps[0])) {
      updatedAt = timestamps[0] as number;
    }
  } catch {
    updatedAt = null;
  }
  const exact = updatedAt !== null
    && row.actorId === undefined
    && row.entityTable === 'evidenceLinks'
    && row.entityId === undefined
    && row.summary === INHERENT_PUBLIC_LINK_CAS_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt);
  return { rows: 1, exact, updatedAt: exact ? updatedAt : null };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const todayIso = todayIsoUtc(new Date(now));
  const audit = await releaseAuditState(ctx);
  const sourceResults = await Promise.all(
    INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.map(async (expected) => {
      const rows = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId))
        .take(2);
      const row = rows.length === 1 ? rows[0] : null;
      const exact = row !== null && await sourceMatches(row, expected);
      const eligible = row !== null && evaluatePublicationEvidence(
        [expected.sourceId],
        [row],
        todayIso,
      ).allowed;
      return {
        sourceId: expected.sourceId,
        rows: rows.length,
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
          exact,
          eligible,
        },
      };
    }),
  );
  const sourceRowsById = new Map(
    sourceResults.flatMap((result) => result.row ? [[result.sourceId, result.row] as const] : []),
  );

  const targetResults = await Promise.all(INHERENT_PUBLIC_LINK_CAS_TARGETS.map(async (target) => {
    const [linkRows, libraryRows] = await Promise.all([
      ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
        .eq('kind', target.kind)
        .eq('slug', target.slug)).take(2),
      ctx.db.query('libraryContent').withIndex('by_slug', (q) => q
        .eq('slug', target.slug)).take(1),
    ]);
    const link = linkRows.length === 1 ? linkRows[0] : null;
    const identityMatches = link !== null && linkIdentityMatches(link, target);
    const desiredSources = target.desiredSourceIds.flatMap((sourceId) => {
      const row = sourceRowsById.get(sourceId);
      return row ? [row] : [];
    });
    const citationEligible = evaluatePublicationEvidence(
      target.desiredSourceIds,
      desiredSources,
      todayIso,
    ).allowed;
    const initialMatches = Boolean(
      identityMatches
      && link?.updatedAt === target.initialUpdatedAt
      && sameStrings(link.sourceIds, target.initialSourceIds),
    );
    const desiredMatches = Boolean(
      identityMatches
      && audit.updatedAt !== null
      && link?.updatedAt === audit.updatedAt
      && sameStrings(link.sourceIds, target.desiredSourceIds),
    );
    return {
      target,
      link,
      public: {
        kind: target.kind,
        slug: target.slug,
        linkRows: linkRows.length,
        libraryRows: libraryRows.length,
        linkId: link ? String(link._id) : null,
        sourceIds: link ? [...link.sourceIds] : [],
        createdAt: link?.createdAt ?? null,
        updatedAt: link?.updatedAt ?? null,
        initialMatches,
        desiredMatches,
        citationEligible,
      },
    };
  }));

  const blockers: string[] = [];
  if (INHERENT_PUBLIC_LINK_CAS_TARGETS.length !== 4) {
    blockers.push('release target set is not exactly four rows');
  }
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  for (const result of sourceResults) {
    if (result.public.rows !== 1) {
      blockers.push(`citation source row count is not one: ${result.sourceId}`);
    } else if (!result.public.exact) {
      blockers.push(`citation source preimage drifted: ${result.sourceId}`);
    }
    if (!result.public.eligible) blockers.push(`citation source is not eligible: ${result.sourceId}`);
  }
  for (const result of targetResults) {
    const key = `${result.target.kind}:${result.target.slug}`;
    if (result.public.linkRows !== 1) blockers.push(`link row count is not one: ${key}`);
    if (result.public.libraryRows !== 0) blockers.push(`target is no longer inherently public: ${key}`);
    if (!result.public.citationEligible) blockers.push(`desired citations are not eligible: ${key}`);
  }

  const allSourcesExact = sourceResults.every((result) => result.public.exact);
  const allSourcesEligible = sourceResults.every((result) => result.public.eligible);
  const allInherentPublic = targetResults.every((result) => result.public.libraryRows === 0);
  const allInitial = targetResults.every((result) => result.public.initialMatches);
  const allDesired = targetResults.every((result) => result.public.desiredMatches);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact && allDesired
    && allSourcesExact && allSourcesEligible && allInherentPublic) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0 && allInitial
    && allSourcesExact && allSourcesEligible && allInherentPublic) {
    phase = 'ready';
  } else {
    if (audit.rows === 0 && !allInitial) blockers.push('production link preimages drifted');
    if (audit.rows === 0 && targetResults.every((result) => (
      result.link !== null
      && linkIdentityMatches(result.link, result.target)
      && sameStrings(result.link.sourceIds, result.target.desiredSourceIds)
    ))) blockers.push('desired link postimages exist without the release audit');
    if (audit.rows === 1 && audit.exact && !allDesired) {
      blockers.push('release audit exists but desired link postimages drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
    phase,
    todayIso,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    targets: targetResults.map((result) => result.public),
    sources: sourceResults.map((result) => result.public),
  };
}

/** Read-only exact-state preflight for the four inherently public citation links. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(INHERENT_PUBLIC_LINK_CAS_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

/**
 * Atomically narrows four inherently public link rows to their frozen,
 * claim-direct citation sets. Source metadata and library content are untouched.
 */
export const apply = internalMutation({
  args: { releaseId: v.literal(INHERENT_PUBLIC_LINK_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(INHERENT_PUBLIC_LINK_CAS_RELEASE_ID),
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
      if (before.releaseUpdatedAt === null) {
        throw new Error('Applied inherent-public link release is missing its audited timestamp');
      }
      return {
        releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        linksUpdated: 0,
        sourcesPreserved: before.sources.length,
        citationsEligible: before.targets.every((target) => target.citationEligible),
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Inherent-public link CAS preflight blocked: ${before.blockers.join('; ')}`);
    }

    const validated: Array<{
      target: InherentPublicLinkCasTarget;
      link: Doc<'evidenceLinks'>;
    }> = [];
    for (const target of INHERENT_PUBLIC_LINK_CAS_TARGETS) {
      const rows = await ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
        .eq('kind', target.kind)
        .eq('slug', target.slug)).take(2);
      if (rows.length !== 1
        || !linkIdentityMatches(rows[0], target)
        || rows[0].updatedAt !== target.initialUpdatedAt
        || !sameStrings(rows[0].sourceIds, target.initialSourceIds)) {
        throw new Error(`Inherent-public link changed after preflight: ${target.kind}:${target.slug}`);
      }
      validated.push({ target, link: rows[0] });
    }
    for (const expected of INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES) {
      const rows = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId))
        .take(2);
      if (rows.length !== 1
        || !await sourceMatches(rows[0], expected)
        || !evaluatePublicationEvidence([expected.sourceId], [rows[0]], before.todayIso).allowed) {
        throw new Error(`Citation source changed after preflight: ${expected.sourceId}`);
      }
    }

    for (const { target, link } of validated) {
      await ctx.db.patch(link._id, {
        sourceIds: [...target.desiredSourceIds],
        updatedAt: now,
      });
    }
    await logAudit(
      ctx,
      null,
      releaseAction,
      'evidenceLinks',
      undefined,
      INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now),
      },
    );

    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Inherent-public link CAS postimage validation failed; transaction rolled back');
    }
    return {
      releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      linksUpdated: validated.length,
      sourcesPreserved: after.sources.length,
      citationsEligible: after.targets.every((target) => target.citationEligible),
      updatedAt: now,
    };
  },
});
