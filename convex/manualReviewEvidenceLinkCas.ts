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
import { assertNoPersistedReleaseGovernedContent } from './lib/clinicalReviewBatchProvenance';
import { todayIsoUtc } from './lib/evidenceFreshness';
import { evaluatePublicationEvidence, publicationEvidenceIsEligible } from './lib/evidencePublicationGate';
import {
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS,
  MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES,
  type ManualReviewEvidenceLinkCasTarget,
} from './lib/manualReviewEvidenceLinkCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
const releaseAction = 'release.manual_review_evidence_links';
const snapshotSha256 = '9ad5cacc700a17f3ec847aa341f98fe6d2d0fc0c996c9bf3caa69ffac3badde4';

const phaseValidator = v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied'));
const targetStateValidator = v.object({
  kind: v.literal('guide'), slug: v.string(), linkRows: v.number(), contentRows: v.number(),
  aiReleaseRows: v.number(), linkId: v.union(v.string(), v.null()), sourceIds: v.array(v.string()),
  linkUpdatedAt: v.union(v.number(), v.null()), contentId: v.union(v.string(), v.null()),
  contentStatus: v.union(v.string(), v.null()), contentReviewRevision: v.union(v.number(), v.null()),
  contentUpdatedAt: v.union(v.number(), v.null()), contentExact: v.boolean(),
  initialMatches: v.boolean(), desiredMatches: v.boolean(), citationEligible: v.boolean(),
});
const sourceStateValidator = v.object({
  sourceId: v.string(), rows: v.number(), rowId: v.union(v.string(), v.null()),
  reviewStatus: v.union(v.string(), v.null()), reviewDate: v.union(v.string(), v.null()),
  nextReviewDate: v.union(v.string(), v.null()), verifiedOn: v.union(v.string(), v.null()),
  exactDirectSource: v.boolean(), eligible: v.boolean(),
});
const preflightResultValidator = v.object({
  releaseId: v.literal(MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID), phase: phaseValidator,
  todayIso: v.string(), releaseAuditRows: v.number(), releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()), blockers: v.array(v.string()),
  targets: v.array(targetStateValidator), sources: v.array(sourceStateValidator),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function linkIdentityMatches(row: Doc<'evidenceLinks'>, target: ManualReviewEvidenceLinkCasTarget) {
  const keys = Object.keys(row).sort((left, right) => left.localeCompare(right));
  const expectedKeys = ['_creationTime', '_id', 'createdAt', 'kind', 'slug', 'sourceIds', 'updatedAt'];
  return sameStrings(keys, expectedKeys)
    && String(row._id) === target.linkId && row._creationTime === target.creationTime
    && row.createdAt === target.createdAt && row.kind === target.kind && row.slug === target.slug;
}

async function contentMatches(row: Doc<'libraryContent'>, target: ManualReviewEvidenceLinkCasTarget) {
  return String(row._id) === target.contentId && row._creationTime === target.contentCreationTime
    && row.type === target.kind && row.slug === target.slug
    && row.clinicalStatus === 'clinical_review'
    && row.reviewRevision === target.contentReviewRevision
    && row.updatedAt === target.contentUpdatedAt
    && row.aiPublicationReleaseId === undefined && row.aiPublishedAt === undefined
    && await sha256Canonical(row) === target.contentCanonicalSha256;
}

function auditBeforeJson(): string {
  return JSON.stringify({
    targets: MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map((target) => ({
      key: `${target.kind}:${target.slug}`, linkId: target.linkId,
      sourceIds: target.initialSourceIds, updatedAt: target.initialUpdatedAt,
      contentId: target.contentId, contentCanonicalSha256: target.contentCanonicalSha256,
      contentReviewRevision: target.contentReviewRevision,
    })),
  });
}

function auditAfterJson(updatedAt: number): string {
  return JSON.stringify({
    targets: MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map((target) => ({
      key: `${target.kind}:${target.slug}`, linkId: target.linkId,
      sourceIds: target.desiredSourceIds, updatedAt,
      contentId: target.contentId, contentCanonicalSha256: target.contentCanonicalSha256,
      contentReviewRevision: target.contentReviewRevision,
    })),
    exactDirectSources: MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES.map((source) => ({
      sourceId: source.sourceId, canonicalSha256: source.exactCanonicalSha256,
    })),
    contentRowsPreserved: true, sourceRowsPreserved: true, citationEligible: true,
    snapshotSha256,
  });
}

async function releaseAuditState(ctx: DatabaseContext) {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction)).take(2);
  if (rows.length !== 1) return { rows: rows.length, exact: false, updatedAt: null as number | null };
  const row = rows[0];
  let updatedAt: number | null = null;
  try {
    const parsed = JSON.parse(row.after ?? '{}') as { targets?: Array<{ updatedAt?: unknown }> };
    const values = parsed.targets?.map((target) => target.updatedAt) ?? [];
    if (values.length === 8 && values.every((value) => typeof value === 'number' && value === values[0])) {
      updatedAt = values[0] as number;
    }
  } catch { updatedAt = null; }
  const exact = updatedAt !== null && row.actorId === undefined
    && row.entityTable === 'evidenceLinks' && row.entityId === undefined
    && row.summary === MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID && row.result === 'ok'
    && row.before === auditBeforeJson() && row.after === auditAfterJson(updatedAt);
  return { rows: 1, exact, updatedAt: exact ? updatedAt : null };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const todayIso = todayIsoUtc(new Date(now));
  const audit = await releaseAuditState(ctx);
  const sourceIds = [...new Set(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS
    .flatMap((target) => [...target.desiredSourceIds]))].sort((a, b) => a.localeCompare(b));
  const exactById = new Map<string, typeof MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES[number]>(MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES
    .map((source) => [source.sourceId, source] as const));
  const sourceResults = await Promise.all(sourceIds.map(async (sourceId) => {
    const rows = await ctx.db.query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', sourceId)).take(2);
    const row = rows.length === 1 ? rows[0] : null;
    const expected = exactById.get(sourceId);
    const exactDirectSource = !expected || Boolean(row && String(row._id) === expected.rowId
      && row._creationTime === expected.creationTime
      && await sha256Canonical(row) === expected.exactCanonicalSha256);
    const eligible = Boolean(row && row.reviewStatus === 'approved'
      && publicationEvidenceIsEligible(row, todayIso));
    return { sourceId, row, public: {
      sourceId, rows: rows.length, rowId: row ? String(row._id) : null,
      reviewStatus: row?.reviewStatus ?? null, reviewDate: row?.reviewDate ?? null,
      nextReviewDate: row?.nextReviewDate ?? null, verifiedOn: row?.verifiedOn ?? null,
      exactDirectSource, eligible,
    } };
  }));
  const sourceById = new Map(sourceResults.flatMap((result) => result.row
    ? [[result.sourceId, result.row] as const] : []));

  const targetResults = await Promise.all(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map(async (target) => {
    const [linkRows, contentRows, aiRows] = await Promise.all([
      ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
        .eq('kind', target.kind).eq('slug', target.slug)).take(2),
      ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).take(2),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
        .eq('targetKey', `${target.kind}:${target.slug}`)).take(1),
    ]);
    const link = linkRows.length === 1 ? linkRows[0] : null;
    const content = contentRows.length === 1 ? contentRows[0] : null;
    const contentExact = Boolean(content && await contentMatches(content, target));
    const identity = Boolean(link && linkIdentityMatches(link, target));
    const initialMatches = Boolean(identity && link?.updatedAt === target.initialUpdatedAt
      && sameStrings(link.sourceIds, target.initialSourceIds));
    const desiredMatches = Boolean(identity && audit.updatedAt !== null
      && link?.updatedAt === audit.updatedAt && sameStrings(link.sourceIds, target.desiredSourceIds));
    const desiredSources = target.desiredSourceIds.flatMap((id) => {
      const source = sourceById.get(id); return source ? [source] : [];
    });
    const citationEligible = evaluatePublicationEvidence(
      target.desiredSourceIds, desiredSources, todayIso,
    ).allowed && desiredSources.every((source) => source.reviewStatus === 'approved'
      && publicationEvidenceIsEligible(source, todayIso));
    return { target, link, public: {
      kind: target.kind, slug: target.slug, linkRows: linkRows.length,
      contentRows: contentRows.length, aiReleaseRows: aiRows.length,
      linkId: link ? String(link._id) : null, sourceIds: link ? [...link.sourceIds] : [],
      linkUpdatedAt: link?.updatedAt ?? null, contentId: content ? String(content._id) : null,
      contentStatus: content?.clinicalStatus ?? null, contentReviewRevision: content?.reviewRevision ?? null,
      contentUpdatedAt: content?.updatedAt ?? null, contentExact,
      initialMatches, desiredMatches, citationEligible,
    } };
  }));

  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  for (const source of sourceResults) {
    if (source.public.rows !== 1) blockers.push(`source row count is not one: ${source.sourceId}`);
    if (!source.public.exactDirectSource) blockers.push(`direct source preimage drifted: ${source.sourceId}`);
    if (!source.public.eligible) blockers.push(`desired source is not approved/current: ${source.sourceId}`);
  }
  for (const result of targetResults) {
    const key = `${result.target.kind}:${result.target.slug}`;
    if (result.public.linkRows !== 1) blockers.push(`link row count is not one: ${key}`);
    if (result.public.contentRows !== 1) blockers.push(`content row count is not one: ${key}`);
    if (result.public.aiReleaseRows !== 0) blockers.push(`unexpected AI release row: ${key}`);
    if (!result.public.contentExact) blockers.push(`governing content preimage drifted: ${key}`);
    if (!result.public.citationEligible) blockers.push(`desired citations are not eligible: ${key}`);
  }
  const staticExact = sourceResults.every((result) => result.public.exactDirectSource
    && result.public.eligible) && targetResults.every((result) => result.public.contentExact
      && result.public.aiReleaseRows === 0 && result.public.citationEligible);
  const allInitial = targetResults.every((result) => result.public.initialMatches);
  const allDesired = targetResults.every((result) => result.public.desiredMatches);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 1 && audit.exact && allDesired && staticExact) {
    phase = 'applied';
  } else if (blockers.length === 0 && audit.rows === 0 && allInitial && staticExact) {
    phase = 'ready';
  } else {
    if (audit.rows === 0 && !allInitial) blockers.push('production link preimages drifted');
    if (audit.rows === 0 && targetResults.every((result) => result.link
      && linkIdentityMatches(result.link, result.target)
      && sameStrings(result.link.sourceIds, result.target.desiredSourceIds))) {
      blockers.push('desired link postimages exist without the release audit');
    }
    if (audit.rows === 1 && audit.exact && !allDesired) {
      blockers.push('release audit exists but desired link postimages drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID, phase, todayIso,
    releaseAuditRows: audit.rows, releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort((a, b) => a.localeCompare(b)),
    targets: targetResults.map((result) => result.public),
    sources: sourceResults.map((result) => result.public),
  };
}

/** Read-only preflight. It never infers or expands the owner-approved eight-row set. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx, Date.now()),
});

/** Atomically adds only the claim-direct sources; content and source rows are preserved. */
export const apply = internalMutation({
  args: { releaseId: v.literal(MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID),
    applied: v.boolean(), alreadyApplied: v.boolean(), linksUpdated: v.number(),
    contentRowsPreserved: v.number(), sourceRowsPreserved: v.number(),
    citationsEligible: v.boolean(), updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    await assertNoPersistedReleaseGovernedContent(
      ctx,
      MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map((target) => target.slug),
    );
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks audited timestamp');
      return {
        releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID, applied: false,
        alreadyApplied: true, linksUpdated: 0, contentRowsPreserved: 8,
        sourceRowsPreserved: before.sources.length, citationsEligible: true,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Manual-review evidence-link CAS preflight blocked: ${before.blockers.join('; ')}`);
    }

    const links: Array<{ target: ManualReviewEvidenceLinkCasTarget; row: Doc<'evidenceLinks'> }> = [];
    for (const target of MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS) {
      const [linkRows, contentRows, aiRows] = await Promise.all([
        ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
          .eq('kind', target.kind).eq('slug', target.slug)).take(2),
        ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).take(2),
        ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
          .eq('targetKey', `${target.kind}:${target.slug}`)).take(1),
      ]);
      if (linkRows.length !== 1 || !linkIdentityMatches(linkRows[0], target)
        || linkRows[0].updatedAt !== target.initialUpdatedAt
        || !sameStrings(linkRows[0].sourceIds, target.initialSourceIds)
        || contentRows.length !== 1 || !await contentMatches(contentRows[0], target)
        || aiRows.length !== 0) {
        throw new Error(`Target changed after preflight: ${target.kind}:${target.slug}`);
      }
      links.push({ target, row: linkRows[0] });
    }
    for (const expected of MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES) {
      const rows = await ctx.db.query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId)).take(2);
      if (rows.length !== 1 || String(rows[0]._id) !== expected.rowId
        || rows[0]._creationTime !== expected.creationTime
        || await sha256Canonical(rows[0]) !== expected.exactCanonicalSha256
        || rows[0].reviewStatus !== 'approved'
        || !publicationEvidenceIsEligible(rows[0], before.todayIso)) {
        throw new Error(`Direct source changed after preflight: ${expected.sourceId}`);
      }
    }
    for (const { target, row } of links) {
      await ctx.db.patch(row._id, { sourceIds: [...target.desiredSourceIds], updatedAt: now });
    }
    await logAudit(ctx, null, releaseAction, 'evidenceLinks', undefined,
      MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID, {
        result: 'ok', before: auditBeforeJson(), after: auditAfterJson(now),
      });
    const after = await preflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Manual-review evidence-link CAS postimage validation failed; transaction rolled back');
    }
    return {
      releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID, applied: true,
      alreadyApplied: false, linksUpdated: links.length, contentRowsPreserved: 8,
      sourceRowsPreserved: after.sources.length, citationsEligible: true, updatedAt: now,
    };
  },
});
