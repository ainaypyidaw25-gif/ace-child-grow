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
import { evaluatePublicationEvidence } from './lib/evidencePublicationGate';
import { todayIsoUtc } from './lib/evidenceFreshness';
import {
  NATIVE_MYANMAR_REFREEZE_CORRECTION_ACTION,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_EXPIRES_AT,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_FIXTURE_SHA256,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS,
  NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST,
  NATIVE_MYANMAR_REFREEZE_PREDECESSOR_BATCH_ID,
  NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS,
  nativeMyanmarRefreezeCorrectionPreflightValidator,
  type NativeMyanmarRefreezeCorrectionPreflight,
  type NativeMyanmarRefreezeCorrectionTarget,
} from './lib/nativeMyanmarRefreezeCorrectionData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type AuditedPostimage = { slug: string; canonicalSha256: string };

const maxRelatedRows = 100;
const maxRegistryBatches = 20;
const maxRegistryAssignments = 100;
const maxRegistryReceipts = 20;

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sortById<T extends { _id: unknown }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) =>
    String(left._id).localeCompare(String(right._id)));
}

function authoredSnapshot(row: Partial<Doc<'libraryContent'>>): Record<string, unknown> {
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

function auditBeforeJson(): string {
  return JSON.stringify({
    fixtureSha256: NATIVE_MYANMAR_REFREEZE_CORRECTION_FIXTURE_SHA256,
    predecessorBatchId: NATIVE_MYANMAR_REFREEZE_PREDECESSOR_BATCH_ID,
    stoppedDecisionSetDigest: NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST,
    targets: NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.map((target) => ({
      kind: target.kind,
      slug: target.slug,
      contentId: target.content._id,
      reviewRevision: target.content.reviewRevision,
      desiredReviewRevision: target.desiredReviewRevision,
    })),
    publicationDecision: 'not_made',
  });
}

function auditAfterJson(updatedAt: number, postimages: readonly AuditedPostimage[]): string {
  return JSON.stringify({
    updatedAt,
    targets: NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.map((target) => {
      const postimage = postimages.find((candidate) => candidate.slug === target.slug);
      if (!postimage) throw new Error(`Missing native refreeze postimage: ${target.slug}`);
      return {
        kind: target.kind,
        slug: target.slug,
        contentId: target.content._id,
        canonicalSha256: postimage.canonicalSha256,
        reviewRevision: target.desiredReviewRevision,
        clinicalStatus: 'clinical_review',
      };
    }),
    confirmedMyanmarCopyPaths: [
      'guide:gd_birth_2m_sleep.data.safety.mm',
      'guide:gd_birth_2m_sleep.data.observationQuestions[1].mm',
      'guide:gd_birth_2m_sleep.data.encouragement.mm',
    ],
    semanticContentRowsChanged: 1,
    revisionOnlyRowsChanged: 13,
    linksSourcesMediaReviewsRegistryPreserved: true,
    desiredRevisionApprovals: 0,
    publicationDecision: 'not_made',
    aiStatePreserved: true,
  });
}

async function releaseAuditState(ctx: DatabaseContext) {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', NATIVE_MYANMAR_REFREEZE_CORRECTION_ACTION))
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
    const parsed = JSON.parse(row.after ?? '{}') as {
      updatedAt?: unknown;
      targets?: Array<{ slug?: unknown; canonicalSha256?: unknown }>;
    };
    if (typeof parsed.updatedAt === 'number' && Array.isArray(parsed.targets)) {
      updatedAt = parsed.updatedAt;
      postimages = parsed.targets.flatMap((target) => (
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
    && Number.isFinite(updatedAt)
    && postimages.length === NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.length
    && new Set(postimages.map((postimage) => postimage.slug)).size === postimages.length
    && row.actorId === undefined
    && row.entityTable === 'libraryContent'
    && row.entityId === undefined
    && row.summary === NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID
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

async function registryAndDecisionState(ctx: DatabaseContext) {
  const [batchesPage, assignmentsPage, receiptsPage] = await Promise.all([
    ctx.db.query('clinicalReviewBatches').take(maxRegistryBatches + 1),
    ctx.db.query('clinicalReviewAssignments').take(maxRegistryAssignments + 1),
    ctx.db.query('clinicalReviewBatchReceipts').take(maxRegistryReceipts + 1),
  ]);
  const batches = sortById(batchesPage.slice(0, maxRegistryBatches));
  const assignments = sortById(assignmentsPage.slice(0, maxRegistryAssignments));
  const receipts = sortById(receiptsPage.slice(0, maxRegistryReceipts));
  const fixtureRegistry = NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES.registry;
  const registryExact = batchesPage.length <= maxRegistryBatches
    && assignmentsPage.length <= maxRegistryAssignments
    && receiptsPage.length <= maxRegistryReceipts
    && canonicalJson(batches) === canonicalJson(fixtureRegistry.batches)
    && canonicalJson(assignments) === canonicalJson(fixtureRegistry.assignments)
    && canonicalJson(receipts) === canonicalJson(fixtureRegistry.receipts);

  const predecessor = batches.find(
    (row) => row.batchId === NATIVE_MYANMAR_REFREEZE_PREDECESSOR_BATCH_ID,
  );
  const decisions = [];
  for (const target of NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS) {
    const assignment = assignments.find((row) => (
      row.batchId === NATIVE_MYANMAR_REFREEZE_PREDECESSOR_BATCH_ID
      && row.contentSlug === target.slug
    ));
    if (!assignment) continue;
    const rows = await ctx.db.query('contentReviews')
      .withIndex('by_decision_key', (q) => q.eq('decisionKey', assignment.assignmentId))
      .take(2);
    if (rows.length === 1) {
      const row = rows[0];
      decisions.push({
        assignmentId: assignment.assignmentId,
        slug: target.slug,
        kind: target.kind,
        reviewRevision: row.reviewRevision,
        decision: row.decision,
        note: row.note?.trim() || null,
        reviewedAt: row.reviewedAt,
        receiptId: String(row._id),
      });
    } else if (rows.length > 1) {
      decisions.push({ duplicate: assignment.assignmentId });
    }
  }
  const digest = predecessor ? await sha256Canonical({
    batchId: NATIVE_MYANMAR_REFREEZE_PREDECESSOR_BATCH_ID,
    freezeDigest: predecessor.freezeDigest,
    decisions,
  }) : null;
  return {
    registryExact,
    decisionSetExact: digest === NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST,
  };
}

function contentIdentityMatches(
  row: Doc<'libraryContent'>,
  target: NativeMyanmarRefreezeCorrectionTarget,
): boolean {
  return String(row._id) === target.content._id
    && row._creationTime === target.content._creationTime
    && row.type === target.kind
    && row.slug === target.slug;
}

function desiredContentMatches(
  row: Doc<'libraryContent'>,
  target: NativeMyanmarRefreezeCorrectionTarget,
): boolean {
  return canonicalJson(authoredSnapshot(row)) === canonicalJson(authoredSnapshot(target.desiredContent))
    && row.searchText === target.desiredContent.searchText
    && row.reviewRevision === target.desiredReviewRevision
    && row.clinicalStatus === 'clinical_review'
    && sameStrings(row.requiredReviewDimensions ?? [], NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS)
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

async function inspectTarget(
  ctx: DatabaseContext,
  target: NativeMyanmarRefreezeCorrectionTarget,
  todayIso: string,
  audit: Awaited<ReturnType<typeof releaseAuditState>>,
) {
  const [contentRows, linkRows, mediaPage, reviewPage, contentAudits, releases] =
    await Promise.all([
      ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).take(2),
      ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
        .eq('kind', target.kind).eq('slug', target.slug)).take(2),
      ctx.db.query('libraryMedia').withIndex('by_content', (q) => q
        .eq('contentSlug', target.slug)).take(maxRelatedRows + 1),
      ctx.db.query('contentReviews').withIndex('by_content', (q) => q
        .eq('contentSlug', target.slug)).take(maxRelatedRows + 1),
      ctx.db.query('aiContentAudits')
        .withIndex('by_content_revision_and_updated_at', (q) => q
          .eq('contentSlug', target.slug))
        .take(maxRelatedRows + 1),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
        .eq('targetKey', `${target.kind}:${target.slug}`)).take(maxRelatedRows + 1),
    ]);
  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  const media = sortById(mediaPage.slice(0, maxRelatedRows));
  const reviews = sortById(reviewPage.slice(0, maxRelatedRows));
  const sources: Doc<'evidenceSources'>[] = [];
  const evidenceAudits: Doc<'aiEvidenceAudits'>[] = [];
  let sourceRowsUnique = true;
  for (const sourceId of target.link.sourceIds) {
    const rows = await ctx.db.query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', sourceId)).take(2);
    if (rows.length !== 1) {
      sourceRowsUnique = false;
      continue;
    }
    sources.push(rows[0]);
    evidenceAudits.push(...await ctx.db.query('aiEvidenceAudits')
      .withIndex('by_source_and_updated_at', (q) => q
        .eq('sourceId', sourceId).eq('sourceUpdatedAt', rows[0].updatedAt))
      .take(maxRelatedRows + 1));
  }
  const ai = {
    contentAudits: sortById(contentAudits.slice(0, maxRelatedRows)),
    evidenceAudits: sortById(evidenceAudits.slice(0, maxRelatedRows)),
    releases: sortById(releases.slice(0, maxRelatedRows)),
    runs: [],
  };
  const [desiredAuthoredHash, desiredSearchTextHash] = await Promise.all([
    sha256Canonical(authoredSnapshot(target.desiredContent)),
    sha256Canonical(target.desiredContent.searchText),
  ]);
  const desiredTemplateExact = desiredAuthoredHash === target.desiredAuthoredCanonicalSha256
    && desiredSearchTextHash === target.desiredSearchTextCanonicalSha256;
  const contentInitialExact = Boolean(content
    && contentIdentityMatches(content, target)
    && canonicalJson(content) === canonicalJson(target.content));
  const postimage = audit.postimages.find((candidate) => candidate.slug === target.slug);
  const contentDesiredExact = Boolean(content
    && postimage
    && audit.updatedAt !== null
    && contentIdentityMatches(content, target)
    && desiredTemplateExact
    && desiredContentMatches(content, target)
    && content.updatedAt === audit.updatedAt
    && await sha256Canonical(content) === postimage.canonicalSha256);
  const linkExact = Boolean(link && canonicalJson(link) === canonicalJson(target.link));
  const sourcesExact = sourceRowsUnique
    && canonicalJson(sources) === canonicalJson(target.sources);
  const citationsEligible = Boolean(link && sourcesExact
    && evaluatePublicationEvidence(link.sourceIds, sources, todayIso).allowed);
  const mediaExact = mediaPage.length <= maxRelatedRows
    && canonicalJson(media) === canonicalJson(target.media);
  const reviewsExact = reviewPage.length <= maxRelatedRows
    && canonicalJson(reviews) === canonicalJson(target.reviews);
  const aiExact = contentAudits.length <= maxRelatedRows
    && evidenceAudits.length <= maxRelatedRows
    && releases.length <= maxRelatedRows
    && canonicalJson(ai) === canonicalJson(target.ai);
  const approvedDimensions = new Set(reviews.flatMap((review) => (
    (review.reviewRevision === target.desiredReviewRevision
      || review.contentVersion === target.desiredReviewRevision)
    && review.decision === 'approved'
    && typeof review.dimension === 'string'
      ? [review.dimension]
      : []
  )));
  return {
    kind: target.kind,
    slug: target.slug,
    contentRows: contentRows.length,
    reviewRevision: content?.reviewRevision ?? null,
    contentInitialExact,
    contentDesiredExact,
    desiredTemplateExact,
    linkExact,
    sourcesExact,
    citationsEligible,
    mediaExact,
    reviewsExact,
    aiExact,
    desiredRevisionApprovals: approvedDimensions.size,
    outstandingRequiredReviews: NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS
      .filter((dimension) => !approvedDimensions.has(dimension)),
  };
}

export async function nativeMyanmarRefreezeCorrectionPreflightState(
  ctx: DatabaseContext,
  checkedAt: number,
): Promise<NativeMyanmarRefreezeCorrectionPreflight> {
  const checkedAtIsValid = Number.isFinite(checkedAt);
  const todayIso = todayIsoUtc(new Date(checkedAtIsValid ? checkedAt : 0));
  const [fixtureHash, audit, registry] = await Promise.all([
    sha256Canonical(NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES),
    releaseAuditState(ctx),
    registryAndDecisionState(ctx),
  ]);
  const fixtureExact = fixtureHash === NATIVE_MYANMAR_REFREEZE_CORRECTION_FIXTURE_SHA256;
  const targets = [];
  for (const target of NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS) {
    targets.push(await inspectTarget(ctx, target, todayIso, audit));
  }
  const blockers: string[] = [];
  if (!checkedAtIsValid) blockers.push('server clock is invalid');
  // Expiry prevents a delayed first write, but an exact audited postimage remains
  // observable and idempotently replayable after the correction window closes.
  if (audit.rows === 0 && checkedAt >= NATIVE_MYANMAR_REFREEZE_CORRECTION_EXPIRES_AT) {
    blockers.push('correction window expired');
  }
  if (!fixtureExact) blockers.push('frozen fixture drifted');
  if (!registry.registryExact) blockers.push('clinical registry preimage drifted');
  if (!registry.decisionSetExact) blockers.push('stopped decision set drifted');
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit malformed or drifted');
  for (const target of targets) {
    if (target.contentRows !== 1) blockers.push(`content row count is not one: ${target.slug}`);
    if (!target.desiredTemplateExact) blockers.push(`desired seed template drifted: ${target.slug}`);
    if (!target.linkExact) blockers.push(`evidence link drifted: ${target.slug}`);
    if (!target.sourcesExact) blockers.push(`evidence source snapshot drifted: ${target.slug}`);
    if (!target.citationsEligible) blockers.push(`citations are not eligible: ${target.slug}`);
    if (!target.mediaExact) blockers.push(`media snapshot drifted: ${target.slug}`);
    if (!target.reviewsExact) blockers.push(`review history drifted: ${target.slug}`);
    if (!target.aiExact) blockers.push(`AI snapshot drifted: ${target.slug}`);
    if (target.desiredRevisionApprovals !== 0) {
      blockers.push(`desired revision already has approvals: ${target.slug}`);
    }
  }
  const allInitial = targets.every((target) => target.contentInitialExact);
  const allDesired = targets.every((target) => target.contentDesiredExact);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 0 && allInitial) phase = 'ready';
  else if (blockers.length === 0 && audit.rows === 1 && audit.exact && allDesired) phase = 'applied';
  else {
    if (audit.rows === 0 && !allInitial) blockers.push('Production content preimage drifted');
    if (audit.rows === 1 && audit.exact && !allDesired) blockers.push('audited content postimage drifted');
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
    phase,
    checkedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    fixtureExact,
    registryExact: registry.registryExact,
    decisionSetExact: registry.decisionSetExact,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    targets,
  };
}

export const preflightAt = internalQuery({
  args: {
    releaseId: v.literal(NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID),
    checkedAt: v.number(),
  },
  returns: nativeMyanmarRefreezeCorrectionPreflightValidator,
  handler: async (ctx, args) => nativeMyanmarRefreezeCorrectionPreflightState(ctx, args.checkedAt),
});

function desiredPatch(
  target: NativeMyanmarRefreezeCorrectionTarget,
): Partial<Doc<'libraryContent'>> {
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
    requiredReviewDimensions: [...NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS],
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
  args: { releaseId: v.literal(NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentUpdated: v.number(),
    semanticContentUpdated: v.number(),
    revisionOnlyContentUpdated: v.number(),
    linksUpdated: v.literal(0),
    publicationDecisionMade: v.literal(false),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await nativeMyanmarRefreezeCorrectionPreflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied correction lacks timestamp');
      return {
        releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentUpdated: 0,
        semanticContentUpdated: 0,
        revisionOnlyContentUpdated: 0,
        linksUpdated: 0 as const,
        publicationDecisionMade: false as const,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Native-Myanmar refreeze correction blocked: ${before.blockers.join('; ')}`);
    }
    const rechecked = await nativeMyanmarRefreezeCorrectionPreflightState(ctx, now);
    if (rechecked.phase !== 'ready') throw new Error('Correction state changed after preflight');

    for (const target of NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS) {
      await ctx.db.patch(target.content._id as Id<'libraryContent'>, {
        ...desiredPatch(target),
        updatedAt: now,
      });
    }
    const postimages: AuditedPostimage[] = [];
    for (const target of NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS) {
      const row = await ctx.db.get(target.content._id as Id<'libraryContent'>);
      if (!row) throw new Error(`Native refreeze postimage disappeared: ${target.slug}`);
      postimages.push({ slug: target.slug, canonicalSha256: await sha256Canonical(row) });
    }
    await logAudit(
      ctx,
      null,
      NATIVE_MYANMAR_REFREEZE_CORRECTION_ACTION,
      'libraryContent',
      undefined,
      NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, postimages),
      },
    );
    const after = await nativeMyanmarRefreezeCorrectionPreflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Native-Myanmar correction postflight failed; transaction rolled back');
    }
    return {
      releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentUpdated: NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.length,
      semanticContentUpdated: 1,
      revisionOnlyContentUpdated: NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.length - 1,
      linksUpdated: 0 as const,
      publicationDecisionMade: false as const,
      updatedAt: now,
    };
  },
});
