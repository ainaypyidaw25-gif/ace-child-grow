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
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_ACTION,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED_SHA256,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_EXPIRES_AT,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_FIXTURE_SHA256,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS,
  CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
  CHILD_DEVELOPMENT_REFREEZE_PREDECESSOR_BATCH_ID,
  CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS,
  childDevelopmentRefreezeCorrectionPreflightValidator,
  type ChildDevelopmentRefreezeCorrectionPreflight,
  type ChildDevelopmentRefreezeCorrectionTarget,
} from './lib/childDevelopmentRefreezeCorrectionData';
import { CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS } from './lib/childDevelopmentRefreezeCorrectionCopy';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type AuditedPostimage = { slug: string; canonicalSha256: string };

const maxRelatedRows = 200;
const maxRegistryBatches = 30;
const maxRegistryAssignments = 150;
const maxRegistryReceipts = 30;
const sourceTransitionSlugs = new Set<string>(
  CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS,
);

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sortById<T extends { _id: unknown }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) =>
    String(left._id).localeCompare(String(right._id)));
}

function sortSources<T extends { sourceId: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) => left.sourceId.localeCompare(right.sourceId));
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

function desiredPatch(
  target: ChildDevelopmentRefreezeCorrectionTarget,
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
    requiredReviewDimensions: [...CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS],
    reviewRevision: target.desiredReviewRevision,
    clinicalStatus: 'clinical_review',
    reviewerId: undefined,
    reviewerQualification: undefined,
    reviewerDisplayName: undefined,
    reviewScope: undefined,
    reviewedAt: undefined,
    nextReviewAt: undefined,
    reviewNote: undefined,
  };
}

function expectedContentPostimage(
  target: ChildDevelopmentRefreezeCorrectionTarget,
  updatedAt: number,
): Record<string, unknown> {
  return {
    ...target.content,
    ...desiredPatch(target),
    updatedAt,
  };
}

function targetChangesLink(target: ChildDevelopmentRefreezeCorrectionTarget): boolean {
  return !sameStrings(target.link.sourceIds, target.desiredLink.sourceIds);
}

function expectedLinkPostimage(
  target: ChildDevelopmentRefreezeCorrectionTarget,
  updatedAt: number,
): Record<string, unknown> {
  if (!targetChangesLink(target)) return target.link;
  return {
    ...target.link,
    sourceIds: [...target.desiredLink.sourceIds],
    updatedAt,
  };
}

function auditBeforeJson(): string {
  const sourceApproval = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.sourceApproval;
  return JSON.stringify({
    fixtureSha256: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_FIXTURE_SHA256,
    desiredFixtureSha256: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED_SHA256,
    predecessorBatchId: CHILD_DEVELOPMENT_REFREEZE_PREDECESSOR_BATCH_ID,
    stoppedDecisionSetDigest: CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
    approvedSource: {
      sourceId: sourceApproval.source.sourceId,
      sourceUpdatedAt: sourceApproval.source.updatedAt,
      approvalAuditId: sourceApproval.audit._id,
      reviewerProfileId: sourceApproval.reviewerProfile._id,
    },
    targets: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.map((target) => ({
      kind: target.kind,
      slug: target.slug,
      contentId: target.content._id,
      reviewRevision: target.content.reviewRevision,
      desiredReviewRevision: target.desiredReviewRevision,
      linkId: target.link._id,
      desiredSourceIds: target.desiredLink.sourceIds,
    })),
    publicationDecision: 'not_made',
  });
}

function auditAfterJson(
  updatedAt: number,
  contentPostimages: readonly AuditedPostimage[],
  linkPostimages: readonly AuditedPostimage[],
): string {
  return JSON.stringify({
    updatedAt,
    targets: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.map((target) => {
      const postimage = contentPostimages.find((candidate) => candidate.slug === target.slug);
      if (!postimage) throw new Error(`Missing child-development postimage: ${target.slug}`);
      return {
        kind: target.kind,
        slug: target.slug,
        contentId: target.content._id,
        canonicalSha256: postimage.canonicalSha256,
        reviewRevision: target.desiredReviewRevision,
        clinicalStatus: 'clinical_review',
      };
    }),
    links: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS
      .filter((target) => targetChangesLink(target))
      .map((target) => {
        const postimage = linkPostimages.find((candidate) => candidate.slug === target.slug);
        if (!postimage) throw new Error(`Missing child-development link postimage: ${target.slug}`);
        return {
          kind: target.kind,
          slug: target.slug,
          linkId: target.link._id,
          canonicalSha256: postimage.canonicalSha256,
          sourceIds: target.desiredLink.sourceIds,
        };
      }),
    semanticContentRowsChanged: 4,
    revisionOnlyRowsChanged: 10,
    linksUpdated: 2,
    reviewHistoryMediaAndAiPreserved: true,
    allSixReviewDimensionsReset: true,
    desiredRevisionApprovals: 0,
    publicationDecision: 'not_made',
  });
}

async function releaseAuditState(ctx: DatabaseContext) {
  const rows = await ctx.db.query('auditLogs')
    .withIndex('by_action', (q) => q.eq(
      'action',
      CHILD_DEVELOPMENT_REFREEZE_CORRECTION_ACTION,
    ))
    .take(2);
  if (rows.length !== 1) {
    return {
      rows: rows.length,
      exact: false,
      updatedAt: null as number | null,
      contentPostimages: [] as AuditedPostimage[],
      linkPostimages: [] as AuditedPostimage[],
    };
  }
  const row = rows[0];
  let updatedAt: number | null = null;
  let contentPostimages: AuditedPostimage[] = [];
  let linkPostimages: AuditedPostimage[] = [];
  try {
    const parsed = JSON.parse(row.after ?? '{}') as {
      updatedAt?: unknown;
      targets?: Array<{ slug?: unknown; canonicalSha256?: unknown }>;
      links?: Array<{ slug?: unknown; canonicalSha256?: unknown }>;
    };
    if (typeof parsed.updatedAt === 'number'
      && Array.isArray(parsed.targets)
      && Array.isArray(parsed.links)) {
      updatedAt = parsed.updatedAt;
      contentPostimages = parsed.targets.flatMap((target) => (
        typeof target.slug === 'string' && typeof target.canonicalSha256 === 'string'
          ? [{ slug: target.slug, canonicalSha256: target.canonicalSha256 }]
          : []
      ));
      linkPostimages = parsed.links.flatMap((target) => (
        typeof target.slug === 'string' && typeof target.canonicalSha256 === 'string'
          ? [{ slug: target.slug, canonicalSha256: target.canonicalSha256 }]
          : []
      ));
    }
  } catch {
    updatedAt = null;
    contentPostimages = [];
    linkPostimages = [];
  }
  const exact = updatedAt !== null
    && Number.isFinite(updatedAt)
    && contentPostimages.length === CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.length
    && new Set(contentPostimages.map((postimage) => postimage.slug)).size
      === contentPostimages.length
    && linkPostimages.length === sourceTransitionSlugs.size
    && new Set(linkPostimages.map((postimage) => postimage.slug)).size === linkPostimages.length
    && row.actorId === undefined
    && row.entityTable === 'libraryContent'
    && row.entityId === undefined
    && row.summary === CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID
    && row.result === 'ok'
    && row.before === auditBeforeJson()
    && row.after === auditAfterJson(updatedAt, contentPostimages, linkPostimages);
  return {
    rows: 1,
    exact,
    updatedAt: exact ? updatedAt : null,
    contentPostimages: exact ? contentPostimages : [],
    linkPostimages: exact ? linkPostimages : [],
  };
}

async function sourceApprovalExact(ctx: DatabaseContext): Promise<boolean> {
  const fixture = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.sourceApproval;
  const sources = await ctx.db.query('evidenceSources')
    .withIndex('by_source_id', (q) => q.eq('sourceId', fixture.source.sourceId))
    .take(2);
  const audits = await ctx.db.query('auditLogs')
    .withIndex('by_action_and_entity_table_and_entity_id_and_result', (q) => q
      .eq('action', 'evidence.setReview')
      .eq('entityTable', 'evidenceSources')
      .eq('entityId', fixture.source.sourceId)
      .eq('result', 'ok'))
    .take(2);
  const profiles = fixture.source.reviewerId
    ? await ctx.db.query('parentProfiles')
      .withIndex('by_user', (q) => q.eq(
        'userId',
        fixture.source.reviewerId as Id<'users'>,
      ))
      .take(2)
    : [];
  return sources.length === 1
    && audits.length === 1
    && profiles.length === 1
    && canonicalJson(sources[0]) === canonicalJson(fixture.source)
    && canonicalJson(audits[0]) === canonicalJson(fixture.audit)
    && canonicalJson(profiles[0]) === canonicalJson(fixture.reviewerProfile)
    && String(sources[0].reviewerId) === String(audits[0].actorId)
    && String(profiles[0].userId) === String(sources[0].reviewerId)
    && sources[0].reviewStatus === 'approved'
    && sources[0].reviewer === 'Phyo Ko Ko'
    && sources[0].reviewerQualification === 'MBBS'
    && sources[0].reviewScope === 'education'
    && sources[0].reviewNote === undefined
    && profiles[0].isStaff === true
    && profiles[0].staffRole === 'clinical_reviewer'
    && profiles[0].displayName === 'Phyo Ko Ko'
    && profiles[0].staffQualification === 'MBBS';
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
  const fixture = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.registry;
  const registryExact = batchesPage.length <= maxRegistryBatches
    && assignmentsPage.length <= maxRegistryAssignments
    && receiptsPage.length <= maxRegistryReceipts
    && canonicalJson(batches) === canonicalJson(fixture.batches)
    && canonicalJson(assignments) === canonicalJson(fixture.assignments)
    && canonicalJson(receipts) === canonicalJson(fixture.receipts);

  const predecessor = batches.find(
    (row) => row.batchId === CHILD_DEVELOPMENT_REFREEZE_PREDECESSOR_BATCH_ID,
  );
  const decisions = [];
  for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
    const assignment = assignments.find((row) => (
      row.batchId === CHILD_DEVELOPMENT_REFREEZE_PREDECESSOR_BATCH_ID
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
    batchId: CHILD_DEVELOPMENT_REFREEZE_PREDECESSOR_BATCH_ID,
    freezeDigest: predecessor.freezeDigest,
    decisions,
  }) : null;
  return {
    registryExact,
    decisionSetExact: digest === CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
  };
}

async function inspectTarget(
  ctx: DatabaseContext,
  target: ChildDevelopmentRefreezeCorrectionTarget,
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
        .withIndex('by_content_revision_and_updated_at', (q) => q.eq('contentSlug', target.slug))
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
  for (const frozenSource of target.sources) {
    const rows = await ctx.db.query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', frozenSource.sourceId)).take(2);
    if (rows.length !== 1) {
      sourceRowsUnique = false;
      continue;
    }
    sources.push(rows[0]);
    evidenceAudits.push(...await ctx.db.query('aiEvidenceAudits')
      .withIndex('by_source_and_updated_at', (q) => q
        .eq('sourceId', frozenSource.sourceId).eq('sourceUpdatedAt', rows[0].updatedAt))
      .take(maxRelatedRows + 1));
  }
  const sortedSources = sortSources(sources);
  const ai = {
    contentAudits: sortById(contentAudits.slice(0, maxRelatedRows)),
    evidenceAudits: sortById(evidenceAudits.slice(0, maxRelatedRows)),
    releases: sortById(releases.slice(0, maxRelatedRows)),
    runs: [],
  };
  const [desiredAuthoredHash, desiredSearchTextHash, desiredSourceIdsHash] =
    await Promise.all([
      sha256Canonical(authoredSnapshot(target.desiredContent)),
      sha256Canonical(target.desiredContent.searchText),
      sha256Canonical(target.desiredLink.sourceIds),
    ]);
  const desiredTemplateExact = desiredAuthoredHash === target.desiredAuthoredCanonicalSha256
    && desiredSearchTextHash === target.desiredSearchTextCanonicalSha256
    && desiredSourceIdsHash === target.desiredLinkSourceIdsCanonicalSha256;
  const contentInitialExact = Boolean(content
    && canonicalJson(content) === canonicalJson(target.content));
  const contentPostimage = audit.contentPostimages.find(
    (candidate) => candidate.slug === target.slug,
  );
  const contentDesiredExact = Boolean(content
    && contentPostimage
    && audit.updatedAt !== null
    && desiredTemplateExact
    && canonicalJson(content) === canonicalJson(expectedContentPostimage(target, audit.updatedAt))
    && await sha256Canonical(content) === contentPostimage.canonicalSha256);
  const linkInitialExact = Boolean(link
    && canonicalJson(link) === canonicalJson(target.link));
  const linkPostimage = audit.linkPostimages.find(
    (candidate) => candidate.slug === target.slug,
  );
  const linkDesiredExact = !targetChangesLink(target)
    ? linkInitialExact
    : Boolean(link
      && linkPostimage
      && audit.updatedAt !== null
      && canonicalJson(link) === canonicalJson(expectedLinkPostimage(target, audit.updatedAt))
      && await sha256Canonical(link) === linkPostimage.canonicalSha256);
  const sourcesExact = sourceRowsUnique
    && canonicalJson(sortedSources) === canonicalJson(target.sources);
  const sourceById = new Map(sortedSources.map((source) => [source.sourceId, source]));
  const desiredSources = target.desiredLink.sourceIds.flatMap((sourceId) => {
    const source = sourceById.get(sourceId);
    return source ? [source] : [];
  });
  const citationsEligible = desiredSources.length === target.desiredLink.sourceIds.length
    && evaluatePublicationEvidence(target.desiredLink.sourceIds, desiredSources, todayIso).allowed;
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
    linkInitialExact,
    linkDesiredExact,
    sourcesExact,
    citationsEligible,
    mediaExact,
    reviewsExact,
    aiExact,
    desiredRevisionApprovals: approvedDimensions.size,
    outstandingRequiredReviews: CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS
      .filter((dimension) => !approvedDimensions.has(dimension)),
  };
}

export async function childDevelopmentRefreezeCorrectionPreflightState(
  ctx: DatabaseContext,
  checkedAt: number,
): Promise<ChildDevelopmentRefreezeCorrectionPreflight> {
  const checkedAtIsValid = Number.isFinite(checkedAt);
  const todayIso = todayIsoUtc(new Date(checkedAtIsValid ? checkedAt : 0));
  const [fixtureHash, desiredHash, audit, registry, approvalExact] = await Promise.all([
    sha256Canonical(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES),
    sha256Canonical(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED),
    releaseAuditState(ctx),
    registryAndDecisionState(ctx),
    sourceApprovalExact(ctx),
  ]);
  const fixtureExact = fixtureHash === CHILD_DEVELOPMENT_REFREEZE_CORRECTION_FIXTURE_SHA256;
  const desiredFixtureExact = desiredHash
    === CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED_SHA256;
  const targets = [];
  for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
    targets.push(await inspectTarget(ctx, target, todayIso, audit));
  }
  const blockers: string[] = [];
  if (!checkedAtIsValid) blockers.push('server clock is invalid');
  if (audit.rows === 0 && checkedAt >= CHILD_DEVELOPMENT_REFREEZE_CORRECTION_EXPIRES_AT) {
    blockers.push('correction window expired');
  }
  if (!fixtureExact) blockers.push('frozen fixture drifted');
  if (!desiredFixtureExact) blockers.push('desired fixture drifted');
  if (!registry.registryExact) blockers.push('clinical registry preimage drifted');
  if (!registry.decisionSetExact) blockers.push('stopped decision set drifted');
  if (!approvalExact) blockers.push('qualified CDC source approval drifted');
  if (audit.rows > 1) blockers.push('duplicate release audit rows');
  if (audit.rows === 1 && !audit.exact) blockers.push('release audit malformed or drifted');
  for (const target of targets) {
    if (target.contentRows !== 1) blockers.push(`content row count is not one: ${target.slug}`);
    if (!target.desiredTemplateExact) blockers.push(`desired template drifted: ${target.slug}`);
    if (!target.sourcesExact) blockers.push(`evidence source snapshot drifted: ${target.slug}`);
    if (!target.citationsEligible) blockers.push(`citations are not eligible: ${target.slug}`);
    if (!target.mediaExact) blockers.push(`media snapshot drifted: ${target.slug}`);
    if (!target.reviewsExact) blockers.push(`review history drifted: ${target.slug}`);
    if (!target.aiExact) blockers.push(`AI snapshot drifted: ${target.slug}`);
    if (target.desiredRevisionApprovals !== 0) {
      blockers.push(`desired revision already has approvals: ${target.slug}`);
    }
  }
  const allInitial = targets.every((target) => (
    target.contentInitialExact && target.linkInitialExact
  ));
  const allDesired = targets.every((target) => (
    target.contentDesiredExact && target.linkDesiredExact
  ));
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (blockers.length === 0 && audit.rows === 0 && allInitial) phase = 'ready';
  else if (blockers.length === 0 && audit.rows === 1 && audit.exact && allDesired) {
    phase = 'applied';
  } else {
    if (audit.rows === 0 && !allInitial) blockers.push('Production preimage drifted');
    if (audit.rows === 1 && audit.exact && !allDesired) {
      blockers.push('audited postimage drifted');
    }
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
    phase,
    checkedAt,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    fixtureExact,
    desiredFixtureExact,
    registryExact: registry.registryExact,
    decisionSetExact: registry.decisionSetExact,
    sourceApprovalExact: approvalExact,
    releaseAuditRows: audit.rows,
    releaseAuditExact: audit.exact,
    releaseUpdatedAt: audit.updatedAt,
    targets,
  };
}

export const preflightAt = internalQuery({
  args: {
    releaseId: v.literal(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID),
    checkedAt: v.number(),
  },
  returns: childDevelopmentRefreezeCorrectionPreflightValidator,
  handler: async (ctx, args) => childDevelopmentRefreezeCorrectionPreflightState(
    ctx,
    args.checkedAt,
  ),
});

export const apply = internalMutation({
  args: { releaseId: v.literal(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID) },
  returns: v.object({
    releaseId: v.literal(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    contentUpdated: v.number(),
    semanticContentUpdated: v.number(),
    revisionOnlyContentUpdated: v.number(),
    linksUpdated: v.number(),
    publicationDecisionMade: v.literal(false),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const before = await childDevelopmentRefreezeCorrectionPreflightState(ctx, now);
    if (before.phase === 'applied') {
      if (before.releaseUpdatedAt === null) throw new Error('Applied correction lacks timestamp');
      return {
        releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        contentUpdated: 0,
        semanticContentUpdated: 0,
        revisionOnlyContentUpdated: 0,
        linksUpdated: 0,
        publicationDecisionMade: false as const,
        updatedAt: before.releaseUpdatedAt,
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Child-development refreeze correction blocked: ${before.blockers.join('; ')}`);
    }
    const rechecked = await childDevelopmentRefreezeCorrectionPreflightState(ctx, now);
    if (rechecked.phase !== 'ready') throw new Error('Correction state changed after preflight');

    for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
      await ctx.db.patch(target.content._id as Id<'libraryContent'>, {
        ...desiredPatch(target),
        updatedAt: now,
      });
    }
    for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
      if (!targetChangesLink(target)) continue;
      await ctx.db.patch(target.link._id as Id<'evidenceLinks'>, {
        sourceIds: [...target.desiredLink.sourceIds],
        updatedAt: now,
      });
    }

    const contentPostimages: AuditedPostimage[] = [];
    const linkPostimages: AuditedPostimage[] = [];
    for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
      const content = await ctx.db.get(target.content._id as Id<'libraryContent'>);
      if (!content) throw new Error(`Child-development postimage disappeared: ${target.slug}`);
      contentPostimages.push({
        slug: target.slug,
        canonicalSha256: await sha256Canonical(content),
      });
      if (targetChangesLink(target)) {
        const link = await ctx.db.get(target.link._id as Id<'evidenceLinks'>);
        if (!link) throw new Error(`Child-development link disappeared: ${target.slug}`);
        linkPostimages.push({
          slug: target.slug,
          canonicalSha256: await sha256Canonical(link),
        });
      }
    }
    await logAudit(
      ctx,
      null,
      CHILD_DEVELOPMENT_REFREEZE_CORRECTION_ACTION,
      'libraryContent',
      undefined,
      CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
      {
        result: 'ok',
        before: auditBeforeJson(),
        after: auditAfterJson(now, contentPostimages, linkPostimages),
      },
    );
    const after = await childDevelopmentRefreezeCorrectionPreflightState(ctx, now);
    if (after.phase !== 'applied') {
      throw new Error('Child-development correction postflight failed; transaction rolled back');
    }
    return {
      releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      contentUpdated: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.length,
      semanticContentUpdated: 4,
      revisionOnlyContentUpdated: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.length - 4,
      linksUpdated: sourceTransitionSlugs.size,
      publicationDecisionMade: false as const,
      updatedAt: now,
    };
  },
});
