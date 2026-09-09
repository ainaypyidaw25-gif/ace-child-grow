import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { logAudit } from './audit';
import { canonicalJson, sha256Canonical } from './lib/aiAuditHash';
import { publicationEvidenceIsEligible } from './lib/evidencePublicationGate';
import { todayIsoUtc } from './lib/evidenceFreshness';
import {
  SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
  SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE,
  SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS,
  SKIN_TO_SKIN_REFREEZE_TARGETS,
  skinToSkinRefreezePreflightResultValidator,
  type SkinToSkinRefreezeDesiredContent,
  type SkinToSkinRefreezeTarget,
} from './lib/skinToSkinRefreezeCorrectionData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const releaseAction = 'release.skin_to_skin_refreeze_correction';
const rootBatchId = SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootBatchId;
const maxBatches = 5;
const maxAssignments = 20;

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sortById<T extends { _id: unknown }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

function authoredSnapshot(row: Partial<SkinToSkinRefreezeDesiredContent>): Record<string, unknown> {
  return {
    type: row.type,
    slug: row.slug,
    ageGroupKey: row.ageGroupKey,
    domainKey: row.domainKey,
    category: row.category,
    titleMm: row.titleMm,
    titleEn: row.titleEn,
    summaryMm: row.summaryMm,
    summaryEn: row.summaryEn,
    tags: row.tags,
    difficulty: row.difficulty,
    durationMinutes: row.durationMinutes,
    offline: row.offline,
    data: row.data,
    source: row.source,
    version: row.version,
  };
}

function desiredContentMatches(
  row: Doc<'libraryContent'>,
  target: SkinToSkinRefreezeTarget,
): boolean {
  const desired = target.desiredContent;
  return canonicalJson(authoredSnapshot(row)) === canonicalJson(authoredSnapshot(desired))
    && row.searchText === desired.searchText
    && row.reviewRevision === target.desiredReviewRevision
    && row.clinicalStatus === 'clinical_review'
    && sameStrings(row.requiredReviewDimensions ?? [], SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS)
    && row.reviewerId === undefined
    && row.reviewerQualification === undefined
    && row.reviewerDisplayName === undefined
    && row.reviewScope === undefined
    && row.reviewedAt === undefined
    && row.nextReviewAt === undefined
    && row.reviewNote === undefined
    && row.aiPublicationReleaseId === undefined
    && row.aiPublishedAt === undefined;
}

function contentIdentityMatches(
  row: Doc<'libraryContent'>,
  target: SkinToSkinRefreezeTarget,
): boolean {
  return String(row._id) === target.contentId
    && row._creationTime === target.contentCreationTime
    && row.type === target.kind
    && row.slug === target.slug;
}

function linkMatches(row: Doc<'evidenceLinks'>, target: SkinToSkinRefreezeTarget): boolean {
  return String(row._id) === target.linkId
    && row._creationTime === target.linkCreationTime
    && row.createdAt === target.linkCreatedAt
    && row.updatedAt === target.linkUpdatedAt
    && row.kind === target.kind
    && row.slug === target.slug
    && sameStrings(row.sourceIds, target.sourceIds);
}

function auditBeforeJson(): string {
  return JSON.stringify({
    targets: SKIN_TO_SKIN_REFREEZE_TARGETS.map((target) => ({
      kind: target.kind,
      slug: target.slug,
      contentId: target.contentId,
      contentCanonicalSha256: target.initialCanonicalSha256,
      reviewRevision: target.initialReviewRevision,
      updatedAt: target.initialUpdatedAt,
      linkCanonicalSha256: target.linkCanonicalSha256,
      sourcesCanonicalSha256: target.sourcesCanonicalSha256,
      mediaCanonicalSha256: target.mediaCanonicalSha256,
      reviewsCanonicalSha256: target.reviewsCanonicalSha256,
    })),
    registry: SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE,
    publicationDecision: 'not_made',
  });
}

type AuditedPostimage = {
  slug: string;
  canonicalSha256: string;
};

function auditAfterJson(updatedAt: number, postimages: readonly AuditedPostimage[]): string {
  return JSON.stringify({
    updatedAt,
    targets: SKIN_TO_SKIN_REFREEZE_TARGETS.map((target) => {
      const postimage = postimages.find((candidate) => candidate.slug === target.slug);
      if (!postimage) throw new Error(`Missing refreeze postimage: ${target.slug}`);
      return {
        kind: target.kind,
        slug: target.slug,
        contentId: target.contentId,
        canonicalSha256: postimage.canonicalSha256,
        authoredCanonicalSha256: target.desiredAuthoredSha256,
        searchTextCanonicalSha256: target.desiredSearchTextSha256,
        reviewRevision: target.desiredReviewRevision,
        clinicalStatus: 'clinical_review',
        requiredReviewDimensions: SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS,
      };
    }),
    linksSourcesMediaReviewsRegistryPreserved: true,
    priorDecisionsPreservedAppendOnly: true,
    desiredRevisionApprovals: 0,
    publicationDecision: 'not_made',
    aiStatePreserved: true,
  });
}

async function releaseAuditState(ctx: DatabaseContext) {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', releaseAction))
    .take(2);
  if (rows.length !== 1) {
    return {
      rows: rows.length,
      exact: false,
      updatedAt: null as number | null,
      postimages: [] as AuditedPostimage[],
    };
  }
  const row = rows[0];
  let updatedAt: number | null = null;
  let postimages: AuditedPostimage[] = [];
  try {
    const after = JSON.parse(row.after ?? '{}') as {
      updatedAt?: unknown;
      targets?: Array<{ slug?: unknown; canonicalSha256?: unknown }>;
    };
    if (typeof after.updatedAt === 'number' && Array.isArray(after.targets)) {
      updatedAt = after.updatedAt;
      postimages = after.targets.flatMap((target) => (
        typeof target.slug === 'string' && typeof target.canonicalSha256 === 'string'
          ? [{ slug: target.slug, canonicalSha256: target.canonicalSha256 }]
          : []
      ));
    }
  } catch {
    updatedAt = null;
    postimages = [];
  }
  const exact = updatedAt !== null
    && postimages.length === SKIN_TO_SKIN_REFREEZE_TARGETS.length
    && new Set(postimages.map((postimage) => postimage.slug)).size === postimages.length
    && row.actorId === undefined
    && row.entityTable === 'libraryContent'
    && row.entityId === undefined
    && row.summary === SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, postimages);
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    postimages: exact ? postimages : [],
  };
}

async function rootDecisionSetDigest(ctx: DatabaseContext): Promise<string | null> {
  const decisions = [];
  for (const target of SKIN_TO_SKIN_REFREEZE_TARGETS) {
    const assignments = await ctx.db.query('clinicalReviewAssignments')
      .withIndex('by_batch_id_and_ordinal', (q) => q.eq('batchId', rootBatchId))
      .take(3);
    const assignment = assignments.find((candidate) => candidate.contentSlug === target.slug);
    if (!assignment) return null;
    const rows = await ctx.db.query('contentReviews')
      .withIndex('by_decision_key', (q) => q.eq('decisionKey', assignment.assignmentId))
      .take(2);
    if (rows.length !== 1) return null;
    const row = rows[0];
    if (row.clinicalReviewBatchId !== rootBatchId
      || row.contentSlug !== target.slug
      || row.contentVersion !== target.initialReviewRevision
      || row.reviewRevision !== target.initialReviewRevision
      || row.dimension !== 'clinical') return null;
    decisions.push({
      assignmentId: assignment.assignmentId,
      slug: target.slug,
      kind: target.kind,
      reviewRevision: target.initialReviewRevision,
      decision: row.decision,
      note: row.note?.trim() || null,
      reviewedAt: row.reviewedAt,
      receiptId: String(row._id),
    });
  }
  const rootRows = await ctx.db.query('clinicalReviewBatches')
    .withIndex('by_batch_id', (q) => q.eq('batchId', rootBatchId)).take(2);
  if (rootRows.length !== 1) return null;
  return sha256Canonical({
    batchId: rootBatchId,
    freezeDigest: rootRows[0].freezeDigest,
    decisions,
  });
}

async function registryState(ctx: DatabaseContext) {
  const [batches, assignments, receipts] = await Promise.all([
    ctx.db.query('clinicalReviewBatches').take(maxBatches),
    ctx.db.query('clinicalReviewAssignments').take(maxAssignments),
    ctx.db.query('clinicalReviewBatchReceipts').take(2),
  ]);
  const [batchesHash, assignmentsHash, receiptsHash, decisionSetDigest] = await Promise.all([
    sha256Canonical(sortById(batches)),
    sha256Canonical(sortById(assignments)),
    sha256Canonical(sortById(receipts)),
    rootDecisionSetDigest(ctx),
  ]);
  const rootRows = batches.filter((batch) => batch.batchId === rootBatchId);
  const exact = batches.length === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.batchesCount
    && batches.length < maxBatches
    && batchesHash === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.batchesCanonicalSha256
    && assignments.length === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.assignmentsCount
    && assignments.length < maxAssignments
    && assignmentsHash === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.assignmentsCanonicalSha256
    && receipts.length === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.receiptsCount
    && receiptsHash === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.receiptsCanonicalSha256
    && rootRows.length === 1
    && rootRows[0].status === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootStatus
    && decisionSetDigest === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootDecisionSetCanonicalSha256;
  return {
    exact,
    rootStatus: rootRows.length === 1 ? rootRows[0].status : null,
    decisionSetExact:
      decisionSetDigest === SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootDecisionSetCanonicalSha256,
  };
}

async function inspectTarget(
  ctx: DatabaseContext,
  target: SkinToSkinRefreezeTarget,
  todayIso: string,
  audit: Awaited<ReturnType<typeof releaseAuditState>>,
) {
  const [contentRows, linkRows, mediaRows, reviewRows, aiContentAudits, aiReleases] =
    await Promise.all([
      ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).take(2),
      ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
        .eq('kind', target.kind).eq('slug', target.slug)).take(2),
      ctx.db.query('libraryMedia').withIndex('by_content', (q) => q
        .eq('contentSlug', target.slug)).take(target.mediaCount + 1),
      ctx.db.query('contentReviews').withIndex('by_content', (q) => q
        .eq('contentSlug', target.slug)).take(target.reviewCount + 1),
      ctx.db.query('aiContentAudits')
        .withIndex('by_content_revision_and_updated_at', (q) => q.eq('contentSlug', target.slug))
        .take(1),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
        .eq('targetKey', `${target.kind}:${target.slug}`)).take(1),
    ]);
  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  const sourceRows: Doc<'evidenceSources'>[] = [];
  let sourceRowsUnique = true;
  let aiEvidenceAuditRows = 0;
  for (const sourceId of target.sourceIds) {
    const rows = await ctx.db.query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', sourceId)).take(2);
    if (rows.length !== 1) {
      sourceRowsUnique = false;
      continue;
    }
    sourceRows.push(rows[0]);
    const audits = await ctx.db.query('aiEvidenceAudits')
      .withIndex('by_source_and_updated_at', (q) => q
        .eq('sourceId', sourceId).eq('sourceUpdatedAt', rows[0].updatedAt))
      .take(1);
    aiEvidenceAuditRows += audits.length;
  }
  const [contentHash, authoredHash, desiredAuthoredHash, desiredSearchTextHash, linkHash,
    sourceHash, mediaHash, reviewHash] = await Promise.all([
    content ? sha256Canonical(content) : null,
    content ? sha256Canonical(authoredSnapshot(content)) : null,
    sha256Canonical(authoredSnapshot(target.desiredContent)),
    sha256Canonical(target.desiredContent.searchText),
    link ? sha256Canonical(link) : null,
    sha256Canonical(sourceRows),
    sha256Canonical(sortById(mediaRows)),
    sha256Canonical(sortById(reviewRows)),
  ]);
  const desiredTemplateExact = desiredAuthoredHash === target.desiredAuthoredSha256
    && desiredSearchTextHash === target.desiredSearchTextSha256;
  const initialMatches = Boolean(content
    && contentIdentityMatches(content, target)
    && contentHash === target.initialCanonicalSha256
    && authoredHash === target.initialAuthoredSha256
    && content.reviewRevision === target.initialReviewRevision
    && content.updatedAt === target.initialUpdatedAt
    && content.clinicalStatus === 'clinical_review');
  const postimage = audit.postimages.find((candidate) => candidate.slug === target.slug);
  const desiredMatches = Boolean(content
    && postimage
    && audit.updatedAt !== null
    && contentIdentityMatches(content, target)
    && desiredContentMatches(content, target)
    && desiredTemplateExact
    && contentHash === postimage.canonicalSha256
    && content.updatedAt === audit.updatedAt);
  const linkExact = Boolean(link
    && linkMatches(link, target)
    && linkHash === target.linkCanonicalSha256);
  const sourcesExact = sourceRowsUnique
    && sourceRows.length === target.sourceIds.length
    && sourceHash === target.sourcesCanonicalSha256;
  const sourcesEligible = sourcesExact && sourceRows.every((source) => (
    source.reviewStatus === 'approved' && publicationEvidenceIsEligible(source, todayIso)
  ));
  const mediaExact = mediaRows.length === target.mediaCount
    && mediaHash === target.mediaCanonicalSha256;
  const reviewsExact = reviewRows.length === target.reviewCount
    && reviewHash === target.reviewsCanonicalSha256;
  const approvedDimensions = new Set(reviewRows.flatMap((review) => (
    (review.reviewRevision === target.desiredReviewRevision
      || review.contentVersion === target.desiredReviewRevision)
    && review.decision === 'approved'
    && typeof review.dimension === 'string'
      ? [review.dimension]
      : []
  )));
  const outstandingRequiredReviews = SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS
    .filter((dimension) => !approvedDimensions.has(dimension));
  return {
    kind: target.kind,
    slug: target.slug,
    contentRows: contentRows.length,
    contentRowId: content ? String(content._id) : null,
    reviewRevision: content?.reviewRevision ?? null,
    contentUpdatedAt: content?.updatedAt ?? null,
    initialMatches,
    desiredTemplateExact,
    desiredMatches,
    linkExact,
    sourcesExact,
    sourcesEligible,
    mediaExact,
    reviewsExact,
    aiContentAuditRows: aiContentAudits.length,
    aiPublicationReleaseRows: aiReleases.length,
    aiEvidenceAuditRows,
    desiredRevisionApprovals: approvedDimensions.size,
    outstandingRequiredReviews,
  };
}

export async function skinToSkinRefreezePreflightState(
  ctx: DatabaseContext,
  checkedAt: number,
) {
  const todayIso = todayIsoUtc(new Date(checkedAt));
  const [audit, registry] = await Promise.all([
    releaseAuditState(ctx),
    registryState(ctx),
  ]);
  const targets = [];
  for (const target of SKIN_TO_SKIN_REFREEZE_TARGETS) {
    targets.push(await inspectTarget(ctx, target, todayIso, audit));
  }
  const blockers: string[] = [];
  if (!Number.isFinite(checkedAt)) blockers.push('server clock is invalid');
  if (!registry.exact) blockers.push('clinical review registry or stopped decision set drifted');
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit is malformed or drifted');
  for (const target of targets) {
    if (target.contentRows !== 1) blockers.push(`content row count is not one: ${target.slug}`);
    if (!target.desiredTemplateExact) blockers.push(`desired seed template drifted: ${target.slug}`);
    if (!target.linkExact) blockers.push(`evidence link drifted: ${target.slug}`);
    if (!target.sourcesExact) blockers.push(`evidence source snapshot drifted: ${target.slug}`);
    if (!target.sourcesEligible) blockers.push(`evidence sources are not currently eligible: ${target.slug}`);
    if (!target.mediaExact) blockers.push(`media snapshot drifted: ${target.slug}`);
    if (!target.reviewsExact) blockers.push(`review history drifted: ${target.slug}`);
    if (target.aiContentAuditRows !== 0) blockers.push(`content AI audit exists: ${target.slug}`);
    if (target.aiPublicationReleaseRows !== 0) blockers.push(`AI release exists: ${target.slug}`);
    if (target.aiEvidenceAuditRows !== 0) blockers.push(`source-version AI audit exists: ${target.slug}`);
    if (target.desiredRevisionApprovals !== 0) blockers.push(`desired revision already has approvals: ${target.slug}`);
  }
  const allInitial = targets.every((target) => target.initialMatches);
  const allDesired = targets.every((target) => target.desiredMatches);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 0 && allInitial) phase = 'ready';
  else if (blockers.length === 0 && audit.rows === 1 && audit.exact && allDesired) phase = 'applied';
  else {
    if (audit.rows === 0 && !allInitial) blockers.push('Production content preimage drifted');
    if (audit.rows === 1 && audit.exact && !allDesired) blockers.push('audited content postimage drifted');
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
    phase,
    checkedAt,
    todayIso,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    rootBatchStatus: registry.rootStatus,
    rootDecisionSetExact: registry.decisionSetExact,
    registryExact: registry.exact,
    targets,
  };
}

export const preflightAt = internalQuery({
  args: {
    releaseId: v.literal(SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID),
    checkedAt: v.number(),
  },
  returns: skinToSkinRefreezePreflightResultValidator,
  handler: async (ctx, args) => skinToSkinRefreezePreflightState(ctx, args.checkedAt),
});

function desiredPatch(target: SkinToSkinRefreezeTarget): Partial<Doc<'libraryContent'>> {
  const desired = target.desiredContent;
  return {
    type: desired.type,
    slug: desired.slug,
    ageGroupKey: desired.ageGroupKey,
    domainKey: desired.domainKey,
    category: desired.category,
    titleMm: desired.titleMm,
    titleEn: desired.titleEn,
    summaryMm: desired.summaryMm,
    summaryEn: desired.summaryEn,
    tags: [...desired.tags],
    difficulty: desired.difficulty,
    durationMinutes: desired.durationMinutes,
    offline: desired.offline,
    data: desired.data,
    source: desired.source,
    version: desired.version,
    searchText: desired.searchText,
    requiredReviewDimensions: [...SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS],
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
  };
}

export const apply = internalMutation({
  args: { releaseId: v.literal(SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentUpdated: v.number(),
    linksUpdated: v.literal(0),
    reviewRowsPreserved: v.number(),
    requiredFreshReviews: v.number(),
    publicationDecisionMade: v.literal(false),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await skinToSkinRefreezePreflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied correction lacks timestamp');
      return {
        releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentUpdated: 0,
        linksUpdated: 0 as const,
        reviewRowsPreserved: before.targets.reduce((sum, target) => sum + (
          SKIN_TO_SKIN_REFREEZE_TARGETS.find((candidate) => candidate.slug === target.slug)
            ?.reviewCount ?? 0
        ), 0),
        requiredFreshReviews:
          SKIN_TO_SKIN_REFREEZE_TARGETS.length * SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS.length,
        publicationDecisionMade: false as const,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Skin-to-skin refreeze correction blocked: ${before.blockers.join('; ')}`);
    }
    const rechecked = await skinToSkinRefreezePreflightState(ctx, now);
    if (rechecked.phase !== 'ready') throw new Error('Correction state changed after preflight');

    for (const target of SKIN_TO_SKIN_REFREEZE_TARGETS) {
      await ctx.db.patch(target.contentId as Id<'libraryContent'>, {
        ...desiredPatch(target),
        updatedAt: now,
      });
    }
    const postimages = [];
    for (const target of SKIN_TO_SKIN_REFREEZE_TARGETS) {
      const content = await ctx.db.get(target.contentId as Id<'libraryContent'>);
      if (!content) throw new Error(`Correction postimage disappeared: ${target.slug}`);
      postimages.push({ slug: target.slug, canonicalSha256: await sha256Canonical(content) });
    }
    await logAudit(
      ctx,
      null,
      releaseAction,
      'libraryContent',
      undefined,
      SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, postimages),
      },
    );
    const after = await skinToSkinRefreezePreflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Correction postflight failed; transaction rolled back');
    }
    return {
      releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentUpdated: SKIN_TO_SKIN_REFREEZE_TARGETS.length,
      linksUpdated: 0 as const,
      reviewRowsPreserved: SKIN_TO_SKIN_REFREEZE_TARGETS
        .reduce((sum, target) => sum + target.reviewCount, 0),
      requiredFreshReviews:
        SKIN_TO_SKIN_REFREEZE_TARGETS.length * SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS.length,
      publicationDecisionMade: false as const,
      updatedAt: now,
    };
  },
});
