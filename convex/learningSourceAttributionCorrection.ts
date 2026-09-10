import { v } from 'convex/values';
import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from './_generated/server';
import { logAudit } from './audit';
import { canonicalJson, sha256Canonical } from './lib/aiAuditHash';
import { aiPublicationTargetKey } from './lib/aiPublicationPolicy';
import { isRegisteredReleaseContentTarget } from './lib/clinicalReviewBatchProvenance';
import { CLINICAL_REVIEW_BATCH_REGISTRY } from './lib/clinicalReviewBatchData';
import { BOOK_ACTIVITY_ATTRIBUTION_CORRECTION_SLUGS } from './lib/bookActivityAttributionCorrection';
import {
  LEARNING_ATTRIBUTION_RELEASE_ID as releaseId,
  LEARNING_ATTRIBUTION_SNAPSHOT_SHA256 as snapshotSha256,
  LEARNING_ATTRIBUTION_CAPTURED_AT as capturedAt,
  LEARNING_ATTRIBUTION_APPLY_BEFORE as applyBefore,
  LEARNING_ATTRIBUTION_TARGETS as targets,
  LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS as clearedFields,
  learningAttributionPreservedContent,
  learningAttributionSearchText,
} from './lib/learningSourceAttributionCorrectionData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type Postimage = { slug: string; hash: string };
const action = 'release.three_book_source_attribution_correction';
const argsValidator = { releaseId: v.literal(releaseId), snapshotSha256: v.literal(snapshotSha256) };
const resultValidator = v.object({
  releaseId: v.literal(releaseId), snapshotSha256: v.literal(snapshotSha256),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  targetCount: v.literal(3), auditRows: v.number(), auditExact: v.boolean(),
  updatedAt: v.union(v.number(), v.null()), blockers: v.array(v.string()),
  targets: v.array(v.object({
    slug: v.string(), reviewRevision: v.union(v.number(), v.null()),
    initialMatches: v.boolean(), desiredMatches: v.boolean(), dependenciesExact: v.boolean(),
    reviewHistoryCount: v.number(),
  })),
});

function assertIdentity(args: { releaseId: string; snapshotSha256: string }): void {
  if (args.releaseId !== releaseId || args.snapshotSha256 !== snapshotSha256) throw new Error('Correction identity mismatch');
  if (targets.length !== 3 || canonicalJson(targets.map(t => t.slug).sort()) !== canonicalJson([...BOOK_ACTIVITY_ATTRIBUTION_CORRECTION_SLUGS].sort())) {
    throw new Error('Correction manifest/seed guard scope mismatch');
  }
}
const sorted = <T extends { _id: unknown }>(rows: readonly T[]): T[] => [...rows].sort((a, b) => String(a._id).localeCompare(String(b._id)));
function beforeJson(): string {
  return JSON.stringify({ releaseId, snapshotSha256, targets: targets.map(t => ({ slug: t.slug, contentId: t.contentId, hash: t.initialFullHash, fromRevision: t.initialReviewRevision, toRevision: t.desiredReviewRevision, field: 'data.evidenceSummary' })) });
}
function afterJson(updatedAt: number, postimages: readonly Postimage[]): string {
  return JSON.stringify({ releaseId, snapshotSha256, updatedAt, postimages,
    humanDecisionsCreated: 0, publicationDecisionsMade: 0, linksSourcesReviewsMediaPreserved: true });
}

async function auditState(ctx: DatabaseContext) {
  const rows = await ctx.db.query('auditLogs').withIndex('by_action', q => q.eq('action', action)).take(2);
  let updatedAt: number | null = null;
  let postimages: Postimage[] = [];
  const row = rows.length === 1 ? rows[0] : null;
  if (row) {
    try {
      const parsed: unknown = JSON.parse(row.after ?? '{}');
      if (!parsed || typeof parsed !== 'object') throw new Error('Missing audit object');
      const value = parsed as { updatedAt?: unknown; postimages?: unknown };
      if (typeof value.updatedAt !== 'number' || !Number.isFinite(value.updatedAt)
        || value.updatedAt < capturedAt || value.updatedAt >= applyBefore || !Array.isArray(value.postimages)) throw new Error('Invalid audit bounds');
      updatedAt = value.updatedAt;
      postimages = value.postimages.map((p: unknown) => {
        if (!p || typeof p !== 'object') throw new Error('Invalid postimage');
        const record = p as Record<string, unknown>;
        if (typeof record.slug !== 'string' || typeof record.hash !== 'string' || !/^[a-f0-9]{64}$/.test(record.hash)) throw new Error('Invalid hash');
        return { slug: record.slug, hash: record.hash };
      });
    } catch { updatedAt = null; postimages = []; }
  }
  const exact = Boolean(row && updatedAt !== null && postimages.length === 3
    && postimages.every((p, i) => p.slug === targets[i].slug)
    && row.actorId === undefined && row.entityTable === 'libraryContent' && row.entityId === undefined
    && row.summary === releaseId && row.result === 'ok' && row.before === beforeJson()
    && row.after === afterJson(updatedAt, postimages));
  return { rows: rows.length, exact, updatedAt: exact ? updatedAt : null, postimages: exact ? postimages : [] };
}

async function inspect(ctx: DatabaseContext, now: number) {
  const audit = await auditState(ctx);
  const blockers: string[] = [];
  const inspected = await Promise.all(targets.map(async target => {
    const [contents, links, reviews, media, assignments, aiReleases, sourcesById] = await Promise.all([
      ctx.db.query('libraryContent').withIndex('by_slug', q => q.eq('slug', target.slug)).take(2),
      ctx.db.query('evidenceLinks').withIndex('by_slug', q => q.eq('slug', target.slug)).take(2),
      ctx.db.query('contentReviews').withIndex('by_content', q => q.eq('contentSlug', target.slug)).take(target.reviewsCount + 1),
      ctx.db.query('libraryMedia').withIndex('by_content', q => q.eq('contentSlug', target.slug)).take(target.mediaCount + 1),
      // Any persisted assignment, including orphan/pilot/history, requires a separately scoped refreeze decision.
      ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target', q => q.eq('contentSlug', target.slug)).take(1),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key', q => q.eq('targetKey', aiPublicationTargetKey('activity', target.slug))).take(1),
      Promise.all(target.sourceIds.map(id => ctx.db.query('evidenceSources').withIndex('by_source_id', q => q.eq('sourceId', id)).take(2))),
    ]);
    const content = contents.length === 1 ? contents[0] : null;
    const link = links.length === 1 ? links[0] : null;
    const hashes = await Promise.all([
      content ? sha256Canonical(content) : Promise.resolve(null),
      content ? sha256Canonical(learningAttributionPreservedContent(content)) : Promise.resolve(null),
      link ? sha256Canonical(link) : Promise.resolve(null),
      sha256Canonical(sorted(sourcesById.flat())), sha256Canonical(sorted(reviews)), sha256Canonical(sorted(media)),
    ]);
    const dependenciesExact = sourcesById.every(rows => rows.length === 1)
      && link?.kind === 'activity' && hashes[2] === target.linkFullHash
      && hashes[3] === target.sourcesFullHash && reviews.length === target.reviewsCount
      && hashes[4] === target.reviewsFullHash && media.length === target.mediaCount && hashes[5] === target.mediaFullHash;
    const governed = isRegisteredReleaseContentTarget('activity', target.slug) || assignments.length !== 0
      || CLINICAL_REVIEW_BATCH_REGISTRY.some(registration => registration.manifest.items.some(item => item.slug === target.slug));
    const data = content?.data && typeof content.data === 'object' && !Array.isArray(content.data)
      ? content.data as Record<string, unknown> : null;
    const identityExact = Boolean(content && content._id === target.contentId && content._creationTime === target.contentCreationTime
      && content.type === 'activity' && content.clinicalStatus === 'clinical_review'
      && content.aiPublicationReleaseId === undefined && content.aiPublishedAt === undefined && aiReleases.length === 0);
    const initialMatches = identityExact && content?.reviewRevision === target.initialReviewRevision
      && content.updatedAt === target.initialUpdatedAt && data?.evidenceSummary === target.before
      && hashes[0] === target.initialFullHash && hashes[1] === target.preservedContentHash;
    const postimage = audit.postimages.find(p => p.slug === target.slug);
    const desiredMatches = Boolean(identityExact && content && data && audit.exact
      && content.reviewRevision === target.desiredReviewRevision && content.updatedAt === audit.updatedAt
      && data.evidenceSummary === target.after && hashes[1] === target.preservedContentHash
      && hashes[0] === postimage?.hash && clearedFields.every(key => content[key] === undefined)
      && content.searchText === learningAttributionSearchText(content, data));
    if (!identityExact) blockers.push(`Content identity/status/AI state changed: ${target.slug}`);
    if (!dependenciesExact) blockers.push(`Source/link/review/media preimage changed: ${target.slug}`);
    if (governed) blockers.push(`Registered assignment requires explicit correction/refreeze: ${target.slug}`);
    return { content, target, fullHash: hashes[0], public: {
      slug: target.slug, reviewRevision: content?.reviewRevision ?? null,
      initialMatches, desiredMatches, dependenciesExact, reviewHistoryCount: reviews.length,
    } };
  }));
  if (audit.rows > 1 || (audit.rows === 1 && !audit.exact)) blockers.push('Correction audit is duplicated or malformed');
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (!blockers.length && audit.rows === 0 && inspected.every(t => t.public.initialMatches)) {
    if (!Number.isFinite(now) || now < capturedAt || now >= applyBefore) blockers.push('Correction window is not open');
    else phase = 'ready';
  } else if (!blockers.length && audit.exact && inspected.every(t => t.public.desiredMatches)) phase = 'applied';
  else if (!blockers.length) blockers.push('Exact content preimage/postimage mismatch');
  if (blockers.length) phase = 'blocked';
  return { inspected, result: { releaseId, snapshotSha256, phase, targetCount: 3 as const,
    auditRows: audit.rows, auditExact: audit.exact, updatedAt: audit.updatedAt,
    blockers: [...new Set(blockers)].sort(), targets: inspected.map(t => t.public) } };
}

export const preflight = internalQuery({
  // Explicit observation time prevents a cached query from implying the window is still open.
  // apply independently uses server time; a caller cannot extend the mutation window.
  args: { ...argsValidator, checkedAt: v.number() }, returns: resultValidator,
  handler: async (ctx, args) => { assertIdentity(args); return (await inspect(ctx, args.checkedAt)).result; },
});

export const apply = internalMutation({
  args: argsValidator,
  returns: v.object({
    releaseId: v.literal(releaseId), snapshotSha256: v.literal(snapshotSha256),
    alreadyApplied: v.boolean(), contentUpdated: v.number(), updatedAt: v.number(),
    humanDecisionsCreated: v.literal(0), publicationDecisionsMade: v.literal(0),
  }),
  handler: async (ctx, args) => {
    assertIdentity(args);
    const now = Date.now();
    const before = await inspect(ctx, now);
    const response = (alreadyApplied: boolean, updatedAt: number) => ({ releaseId, snapshotSha256,
      alreadyApplied, contentUpdated: alreadyApplied ? 0 : 3, updatedAt,
      humanDecisionsCreated: 0 as const, publicationDecisionsMade: 0 as const });
    if (before.result.phase === 'applied' && before.result.updatedAt !== null) return response(true, before.result.updatedAt);
    if (before.result.phase !== 'ready') throw new Error(`Attribution correction blocked: ${before.result.blockers.join('; ')}`);
    // A transaction reads all exact dependencies before its first write; Convex OCC protects concurrent changes.
    for (const { content, target } of before.inspected) {
      if (!content) throw new Error('Exact target disappeared');
      const data = { ...content.data as Record<string, unknown>, evidenceSummary: target.after };
      await ctx.db.patch(content._id, {
        data, searchText: learningAttributionSearchText(content, data),
        reviewRevision: target.desiredReviewRevision, clinicalStatus: 'clinical_review',
        reviewerId: undefined, reviewerQualification: undefined, reviewerDisplayName: undefined,
        reviewScope: undefined, reviewedAt: undefined, nextReviewAt: undefined, reviewNote: undefined,
        updatedAt: now,
      });
    }
    const postimages: Postimage[] = [];
    for (const { content, target } of before.inspected) {
      const row = await ctx.db.get(content!._id);
      if (!row) throw new Error('Attribution postimage disappeared');
      postimages.push({ slug: target.slug, hash: await sha256Canonical(row) });
    }
    // Internal system operation; no user/reviewer identity is fabricated.
    await logAudit(ctx, null, action, 'libraryContent', undefined, releaseId,
      { result: 'ok', before: beforeJson(), after: afterJson(now, postimages) });
    const after = await inspect(ctx, now);
    if (after.result.phase !== 'applied') throw new Error(`Attribution postflight failed; transaction rolled back: ${after.result.blockers.join('; ')}`);
    return response(false, now);
  },
});
