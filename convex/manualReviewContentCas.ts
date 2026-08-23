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
import {
  MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
  MANUAL_REVIEW_CONTENT_TARGETS,
  type ManualReviewContentTarget,
} from './lib/manualReviewContentCasData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type AuditedTarget = {
  slug: string;
  rowId: string;
  canonicalSha256: string;
  reviewRevision: number;
  updatedAt: number;
};

const releaseAction = 'release.manual_review_content_corrections';

const phaseValidator = v.union(
  v.literal('ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const targetStateValidator = v.object({
  type: v.string(),
  slug: v.string(),
  rows: v.number(),
  rowId: v.union(v.string(), v.null()),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
  aiPointerFree: v.boolean(),
  aiReleaseRows: v.number(),
  initialMatches: v.boolean(),
  desiredMatches: v.boolean(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID),
  phase: phaseValidator,
  targetCount: v.literal(8),
  initialMatchCount: v.number(),
  desiredMatchCount: v.number(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  blockers: v.array(v.string()),
  targets: v.array(targetStateValidator),
});

function auditBeforeJson(): string {
  return JSON.stringify({
    targetCount: MANUAL_REVIEW_CONTENT_TARGETS.length,
    targets: MANUAL_REVIEW_CONTENT_TARGETS.map((target) => ({
      type: target.type,
      slug: target.slug,
      rowId: target.contentId,
      canonicalSha256: target.initialCanonicalSha256,
      reviewRevision: target.initialReviewRevision,
      updatedAt: target.initialUpdatedAt,
      patchFields: target.patches.map((patch) => patch.field),
    })),
  });
}

function auditAfterJson(updatedAt: number, targets: readonly AuditedTarget[]): string {
  return JSON.stringify({
    targetCount: MANUAL_REVIEW_CONTENT_TARGETS.length,
    updatedAt,
    targets: MANUAL_REVIEW_CONTENT_TARGETS.map((target) => {
      const audited = targets.find((row) => row.slug === target.slug);
      if (!audited) throw new Error(`Missing audited postimage: ${target.slug}`);
      return {
        type: target.type,
        slug: target.slug,
        rowId: target.contentId,
        canonicalSha256: audited.canonicalSha256,
        clinicalStatus: 'clinical_review',
        reviewRevision: target.desiredReviewRevision,
        updatedAt,
        patchFields: target.patches.map((patch) => patch.field),
      };
    }),
    reviewAndAiStateCleared: true,
    publicationDecisionMade: false,
    evidenceLinksChanged: false,
  });
}

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  targets: AuditedTarget[];
};

async function releaseAuditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction))
    .take(2);
  if (rows.length !== 1) {
    return { rows: rows.length, exact: false, updatedAt: null, targets: [] };
  }

  const row = rows[0];
  let updatedAt: number | null = null;
  let targets: AuditedTarget[] = [];
  try {
    const parsed = JSON.parse(row.after ?? '{}') as {
      updatedAt?: unknown;
      targets?: unknown;
    };
    if (typeof parsed.updatedAt === 'number' && Array.isArray(parsed.targets)) {
      const candidates: AuditedTarget[] = [];
      for (const value of parsed.targets) {
        if (!value || typeof value !== 'object') throw new Error('invalid target');
        const candidate = value as Record<string, unknown>;
        if (typeof candidate.slug !== 'string'
          || typeof candidate.rowId !== 'string'
          || typeof candidate.canonicalSha256 !== 'string'
          || typeof candidate.reviewRevision !== 'number'
          || candidate.updatedAt !== parsed.updatedAt) {
          throw new Error('invalid audited target');
        }
        candidates.push({
          slug: candidate.slug,
          rowId: candidate.rowId,
          canonicalSha256: candidate.canonicalSha256,
          reviewRevision: candidate.reviewRevision,
          updatedAt: candidate.updatedAt as number,
        });
      }
      updatedAt = parsed.updatedAt;
      targets = candidates;
    }
  } catch {
    updatedAt = null;
    targets = [];
  }

  const exact = updatedAt !== null
    && targets.length === MANUAL_REVIEW_CONTENT_TARGETS.length
    && new Set(targets.map((target) => target.slug)).size === targets.length
    && row.actorId === undefined
    && row.entityTable === 'libraryContent'
    && row.entityId === undefined
    && row.summary === MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, targets);

  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    targets: exact ? targets : [],
  };
}

function contentIdentityMatches(
  row: Doc<'libraryContent'>,
  target: ManualReviewContentTarget,
): boolean {
  return String(row._id) === target.contentId
    && row._creationTime === target.contentCreationTime
    && row.type === target.type
    && row.slug === target.slug;
}

function aiPointerFree(row: Doc<'libraryContent'> | null): boolean {
  return Boolean(row
    && row.aiPublicationReleaseId === undefined
    && row.aiPublishedAt === undefined);
}

async function preflightState(ctx: DatabaseContext) {
  const audit = await releaseAuditState(ctx);
  const inspected = await Promise.all(MANUAL_REVIEW_CONTENT_TARGETS.map(async (target) => {
    const [rows, aiReleaseRows] = await Promise.all([
      ctx.db.query('libraryContent').withIndex('by_slug', (q) => q
        .eq('slug', target.slug)).take(2),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
        .eq('targetKey', `${target.type}:${target.slug}`)).take(1),
    ]);
    const row = rows.length === 1 ? rows[0] : null;
    const canonicalSha256 = row ? await sha256Canonical(row) : null;
    const audited = audit.targets.find((candidate) => candidate.slug === target.slug);
    const initialMatches = Boolean(row
      && contentIdentityMatches(row, target)
      && row.clinicalStatus === 'clinical_review'
      && row.reviewRevision === target.initialReviewRevision
      && row.updatedAt === target.initialUpdatedAt
      && aiPointerFree(row)
      && canonicalSha256 === target.initialCanonicalSha256);
    const desiredMatches = Boolean(row
      && audited
      && contentIdentityMatches(row, target)
      && row.clinicalStatus === 'clinical_review'
      && row.reviewRevision === target.desiredReviewRevision
      && row.updatedAt === audit.updatedAt
      && aiPointerFree(row)
      && row.reviewerId === undefined
      && row.reviewerQualification === undefined
      && row.reviewerDisplayName === undefined
      && row.reviewScope === undefined
      && row.reviewedAt === undefined
      && row.nextReviewAt === undefined
      && row.reviewNote === undefined
      && audited.rowId === target.contentId
      && audited.reviewRevision === target.desiredReviewRevision
      && audited.updatedAt === audit.updatedAt
      && canonicalSha256 === audited.canonicalSha256);
    return {
      target,
      row,
      public: {
        type: target.type,
        slug: target.slug,
        rows: rows.length,
        rowId: row ? String(row._id) : null,
        clinicalStatus: row?.clinicalStatus ?? null,
        reviewRevision: row?.reviewRevision ?? null,
        updatedAt: row?.updatedAt ?? null,
        aiPointerFree: aiPointerFree(row),
        aiReleaseRows: aiReleaseRows.length,
        initialMatches,
        desiredMatches,
      },
    };
  }));

  const blockers: string[] = [];
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  for (const result of inspected) {
    if (result.public.rows !== 1) {
      blockers.push(`content row count is not one: ${result.target.slug}`);
    }
    if (!result.public.aiPointerFree) {
      blockers.push(`content has an AI publication pointer: ${result.target.slug}`);
    }
    if (result.public.aiReleaseRows !== 0) {
      blockers.push(`content has an AI publication release: ${result.target.slug}`);
    }
  }

  const initialMatchCount = inspected.filter((result) => result.public.initialMatches).length;
  const desiredMatchCount = inspected.filter((result) => result.public.desiredMatches).length;
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0
    && audit.rows === 0
    && initialMatchCount === MANUAL_REVIEW_CONTENT_TARGETS.length) {
    phase = 'ready';
  } else if (blockers.length === 0
    && audit.rows === 1
    && audit.exact
    && desiredMatchCount === MANUAL_REVIEW_CONTENT_TARGETS.length) {
    phase = 'applied';
  } else {
    if (audit.rows === 0 && initialMatchCount !== MANUAL_REVIEW_CONTENT_TARGETS.length) {
      blockers.push('one or more Production content preimages drifted');
    }
    if (audit.rows === 1 && audit.exact
      && desiredMatchCount !== MANUAL_REVIEW_CONTENT_TARGETS.length) {
      blockers.push('release audit exists but one or more content postimages drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';

  return {
    releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
    phase,
    targetCount: 8 as const,
    initialMatchCount,
    desiredMatchCount,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    targets: inspected.map((result) => result.public),
  };
}

function patchedData(row: Doc<'libraryContent'>, target: ManualReviewContentTarget) {
  if (!row.data || typeof row.data !== 'object' || Array.isArray(row.data)) {
    throw new Error(`Content data is not an object: ${target.slug}`);
  }
  const data: Record<string, unknown> = { ...(row.data as Record<string, unknown>) };
  for (const patch of target.patches) data[patch.field] = structuredClone(patch.value);
  return data;
}

function searchText(row: Doc<'libraryContent'>, data: Record<string, unknown>): string {
  return [
    row.titleMm,
    row.titleEn,
    row.summaryMm ?? '',
    row.summaryEn ?? '',
    row.tags.join(' '),
    JSON.stringify(data),
  ].join(' ').toLowerCase();
}

/** Read-only exact-state preflight for the eight owner-accepted content corrections. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx),
});

/**
 * Atomically applies only the accepted fields and returns every changed row to
 * revision-bound review. This does not publish content or change citations.
 */
export const apply = internalMutation({
  args: { releaseId: v.literal(MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentUpdated: v.number(),
    evidenceLinksChanged: v.literal(0),
    publicationDecisionsMade: v.literal(0),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    await assertNoPersistedReleaseGovernedContent(
      ctx,
      MANUAL_REVIEW_CONTENT_TARGETS.map((target) => target.slug),
    );
    const now = Date.now();
    const before = await preflightState(ctx);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied release lacks audited timestamp');
      return {
        releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentUpdated: 0,
        evidenceLinksChanged: 0 as const,
        publicationDecisionsMade: 0 as const,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Manual-review content CAS preflight blocked: ${before.blockers.join('; ')}`);
    }

    const rechecked = await preflightState(ctx);
    if (rechecked.phase !== 'ready') {
      throw new Error('Manual-review content state changed after preflight');
    }

    for (const target of MANUAL_REVIEW_CONTENT_TARGETS) {
      const row = await ctx.db.get(target.contentId as Id<'libraryContent'>);
      if (!row || !contentIdentityMatches(row, target)) {
        throw new Error(`Manual-review content row disappeared: ${target.slug}`);
      }
      const data = patchedData(row, target);
      await ctx.db.patch(target.contentId as Id<'libraryContent'>, {
        data,
        searchText: searchText(row, data),
        reviewRevision: target.desiredReviewRevision,
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
      });
    }

    const postimages: AuditedTarget[] = [];
    for (const target of MANUAL_REVIEW_CONTENT_TARGETS) {
      const row = await ctx.db.get(target.contentId as Id<'libraryContent'>);
      if (!row || !contentIdentityMatches(row, target)) {
        throw new Error(`Manual-review postimage row disappeared: ${target.slug}`);
      }
      postimages.push({
        slug: target.slug,
        rowId: target.contentId,
        canonicalSha256: await sha256Canonical(row),
        reviewRevision: target.desiredReviewRevision,
        updatedAt: now,
      });
    }

    await logAudit(
      ctx,
      null,
      releaseAction,
      'libraryContent',
      undefined,
      MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, postimages),
      },
    );

    const after = await preflightState(ctx);
    if (after.phase !== 'applied') {
      throw new Error('Manual-review content CAS postimage validation failed; transaction rolled back');
    }
    return {
      releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentUpdated: MANUAL_REVIEW_CONTENT_TARGETS.length,
      evidenceLinksChanged: 0 as const,
      publicationDecisionsMade: 0 as const,
      updatedAt: now,
    };
  },
});
