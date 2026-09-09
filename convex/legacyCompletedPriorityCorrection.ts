import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { sha256Canonical } from './lib/aiAuditHash';
import { assertNoPersistedReleaseGovernedContent } from './lib/clinicalReviewBatchProvenance';
import {
  LEGACY_COMPLETED_PRIORITY_CORRECTION_ACTION,
  LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
  LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET,
} from './lib/legacyCompletedPriorityCorrectionData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const phaseValidator = v.union(
  v.literal('ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const stateValidator = v.object({
  releaseId: v.literal(LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID),
  phase: phaseValidator,
  blockers: v.array(v.string()),
  contentRows: v.number(),
  reviewRows: v.number(),
  aiReleaseRows: v.number(),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  initialMatches: v.boolean(),
  desiredMatches: v.boolean(),
  priorityStatus: v.union(v.string(), v.null()),
  updatedAt: v.union(v.number(), v.null()),
});

type AuditState = {
  rows: number;
  exact: boolean;
  updatedAt: number | null;
  postCanonicalSha256: string | null;
};

function auditBeforeJson(): string {
  const target = LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET;
  return JSON.stringify({
    releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    target: {
      type: target.type,
      slug: target.slug,
      contentId: target.contentId,
      contentCreationTime: target.contentCreationTime,
      reviewRevision: target.reviewRevision,
      priorityStatus: target.initialPriorityStatus,
      updatedAt: target.initialUpdatedAt,
      canonicalSha256: target.initialCanonicalSha256,
    },
    reviewRows: target.reviewRows,
    reviewRowsCanonicalSha256: target.reviewRowsCanonicalSha256,
  });
}

function auditAfterJson(updatedAt: number, postCanonicalSha256: string): string {
  const target = LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET;
  return JSON.stringify({
    releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    target: {
      type: target.type,
      slug: target.slug,
      contentId: target.contentId,
      contentCreationTime: target.contentCreationTime,
      reviewRevision: target.reviewRevision,
      priorityStatus: target.desiredPriorityStatus,
      updatedAt,
      canonicalSha256: postCanonicalSha256,
    },
    reviewRows: target.reviewRows,
    reviewRowsCanonicalSha256: target.reviewRowsCanonicalSha256,
    mutationScope: ['libraryContent.priorityStatus', 'libraryContent.updatedAt'],
    contentChanged: false,
    reviewsChanged: false,
    evidenceChanged: false,
    mediaChanged: false,
    aiPublicationChanged: false,
    publicationChanged: false,
  });
}

async function auditState(ctx: DatabaseContext): Promise<AuditState> {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', LEGACY_COMPLETED_PRIORITY_CORRECTION_ACTION))
    .take(2);
  if (rows.length !== 1) {
    return { rows: rows.length, exact: false, updatedAt: null, postCanonicalSha256: null };
  }

  const row = rows[0];
  let updatedAt: number | null = null;
  let postCanonicalSha256: string | null = null;
  try {
    const parsed = JSON.parse(row.after ?? '{}') as {
      target?: { updatedAt?: unknown; canonicalSha256?: unknown };
    };
    if (typeof parsed.target?.updatedAt === 'number'
      && typeof parsed.target.canonicalSha256 === 'string') {
      updatedAt = parsed.target.updatedAt;
      postCanonicalSha256 = parsed.target.canonicalSha256;
    }
  } catch {
    updatedAt = null;
    postCanonicalSha256 = null;
  }

  const exact = updatedAt !== null
    && postCanonicalSha256 !== null
    && row.actorId === undefined
    && row.entityTable === 'libraryContent'
    && row.entityId === LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.contentId
    && row.summary === LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, postCanonicalSha256);

  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    postCanonicalSha256: exact ? postCanonicalSha256 : null,
  };
}

function contentIdentityMatches(row: Doc<'libraryContent'>): boolean {
  const target = LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET;
  return String(row._id) === target.contentId
    && row._creationTime === target.contentCreationTime
    && row.type === target.type
    && row.slug === target.slug;
}

function aiPointerFree(row: Doc<'libraryContent'>): boolean {
  return row.aiPublicationReleaseId === undefined && row.aiPublishedAt === undefined;
}

async function snapshotState(ctx: DatabaseContext) {
  const target = LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET;
  const [contentRows, reviewRows, aiReleaseRows, audit] = await Promise.all([
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).take(2),
    ctx.db.query('contentReviews').withIndex('by_content', (q) => q.eq('contentSlug', target.slug))
      .take(target.reviewRows + 1),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
      .eq('targetKey', `${target.type}:${target.slug}`)).take(1),
    auditState(ctx),
  ]);
  const row = contentRows.length === 1 ? contentRows[0] : null;
  const contentCanonicalSha256 = row ? await sha256Canonical(row) : null;
  const orderedReviewRows = [...reviewRows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
  const reviewRowsCanonicalSha256 = await sha256Canonical(orderedReviewRows);
  const reviewStateExact = reviewRows.length === target.reviewRows
    && reviewRowsCanonicalSha256 === target.reviewRowsCanonicalSha256;

  const initialMatches = Boolean(row
    && contentIdentityMatches(row)
    && row.reviewRevision === target.reviewRevision
    && row.priorityStatus === target.initialPriorityStatus
    && row.updatedAt === target.initialUpdatedAt
    && aiPointerFree(row)
    && contentCanonicalSha256 === target.initialCanonicalSha256
    && reviewStateExact
    && aiReleaseRows.length === 0);

  const desiredMatches = Boolean(row
    && audit.exact
    && contentIdentityMatches(row)
    && row.reviewRevision === target.reviewRevision
    && row.priorityStatus === target.desiredPriorityStatus
    && row.updatedAt === audit.updatedAt
    && aiPointerFree(row)
    && contentCanonicalSha256 === audit.postCanonicalSha256
    && reviewStateExact
    && aiReleaseRows.length === 0);

  const blockers: string[] = [];
  if (contentRows.length !== 1) blockers.push(`content rows=${contentRows.length}; expected 1`);
  if (reviewRows.length !== target.reviewRows) blockers.push(`review rows=${reviewRows.length}; expected ${target.reviewRows}`);
  if (reviewRows.length === target.reviewRows
    && reviewRowsCanonicalSha256 !== target.reviewRowsCanonicalSha256) {
    blockers.push('review history drifted');
  }
  if (aiReleaseRows.length !== 0) blockers.push(`AI release rows=${aiReleaseRows.length}; expected 0`);
  if (audit.rows > 1) blockers.push(`release audit rows=${audit.rows}; expected at most 1`);
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  if (contentRows.length === 1 && !initialMatches && !desiredMatches) {
    blockers.push('content row does not match the exact initial or audited desired state');
  }
  if (desiredMatches && !audit.exact) blockers.push('desired state has no exact release audit');
  if (initialMatches && audit.rows !== 0) blockers.push('initial state has an unexpected release audit');

  const phase = desiredMatches && audit.exact && blockers.length === 0
    ? 'applied' as const
    : initialMatches && audit.rows === 0 && blockers.length === 0
      ? 'ready' as const
      : 'blocked' as const;

  return {
    releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    phase,
    blockers,
    contentRows: contentRows.length,
    reviewRows: reviewRows.length,
    aiReleaseRows: aiReleaseRows.length,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    initialMatches,
    desiredMatches,
    priorityStatus: row?.priorityStatus ?? null,
    updatedAt: row?.updatedAt ?? null,
  };
}

export const preflight = internalQuery({
  args: { releaseId: v.literal(LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID) },
  returns: stateValidator,
  handler: async (ctx) => snapshotState(ctx),
});

export const apply = internalMutation({
  args: { releaseId: v.literal(LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID) },
  returns: v.object({
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    updatedAt: v.union(v.number(), v.null()),
    state: stateValidator,
  }),
  handler: async (ctx) => {
    await assertNoPersistedReleaseGovernedContent(
      ctx,
      [LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.slug],
    );
    const before = await snapshotState(ctx);
    if (before.phase === 'applied') {
      return { applied: false, alreadyApplied: true, updatedAt: before.updatedAt, state: before };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Legacy completed-priority correction preflight blocked: ${before.blockers.join('; ')}`);
    }

    const target = LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET;
    const rows = await ctx.db.query('libraryContent').withIndex('by_slug', (q) => q
      .eq('slug', target.slug)).take(2);
    if (rows.length !== 1) throw new Error('Target row changed during correction');
    const row = rows[0];
    const currentHash = await sha256Canonical(row);
    if (!contentIdentityMatches(row)
      || row.priorityStatus !== target.initialPriorityStatus
      || row.reviewRevision !== target.reviewRevision
      || row.updatedAt !== target.initialUpdatedAt
      || currentHash !== target.initialCanonicalSha256) {
      throw new Error('Target preimage changed during correction');
    }

    const updatedAt = Date.now();
    await ctx.db.patch(row._id, {
      priorityStatus: target.desiredPriorityStatus,
      updatedAt,
    });
    const postimage = await ctx.db.get(row._id);
    if (!postimage) throw new Error('Target row disappeared during correction');
    const postCanonicalSha256 = await sha256Canonical(postimage);

    await ctx.db.insert('auditLogs', {
      action: LEGACY_COMPLETED_PRIORITY_CORRECTION_ACTION,
      entityTable: 'libraryContent',
      entityId: target.contentId,
      summary: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
      result: 'ok',
      before: auditBeforeJson(),
      after: auditAfterJson(updatedAt, postCanonicalSha256),
    });

    const after = await snapshotState(ctx);
    if (after.phase !== 'applied') {
      throw new Error(`Legacy completed-priority correction postflight blocked: ${after.blockers.join('; ')}`);
    }
    return { applied: true, alreadyApplied: false, updatedAt, state: after };
  },
});
