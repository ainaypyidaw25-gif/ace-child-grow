import { v } from 'convex/values';
import { internalMutation, internalQuery, type QueryCtx, type MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';
import seedData from './seedData.json';
import { logAudit } from './audit';
import { aiContentSnapshot, aiEvidenceLinkSnapshot, aiEvidenceSnapshot, sha256Canonical } from './lib/aiAuditHash';
import { EARLY_MATH_AUDIT_ARTIFACT as artifact, EARLY_MATH_AUDIT_ARTIFACT_HASH as artifactHash } from './lib/aiEarlyMathPublication20260910Artifact';
import { EARLY_MATH_PREIMAGE as expected, EARLY_MATH_RELEASE_ID as releaseId, EARLY_MATH_RUN_ID as runId, EARLY_MATH_RELEASE_DAYS } from './lib/aiEarlyMathPublication20260910Data';
import { AI_PUBLICATION_POLICY_VERSION, aiAuditFreshForActivation, aiPublicationMasterEnabled, aiPublicationTargetKey, sourceMayEnterAiPublication } from './lib/aiPublicationPolicy';
import { activeAiParentReadableContent, aiReleaseMatchesCurrentState, contentIsAiParentReadable } from './lib/aiPublicationVisibility';
import { assertNoPersistedReleaseGovernedContent } from './lib/clinicalReviewBatchProvenance';
import { todayIsoUtc } from './lib/evidenceFreshness';

type Ctx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
const slug = 'lsn_early_math';
const seed = seedData.find((row) => row.type === 'lesson' && row.slug === slug)!;
const day = 86_400_000;
export const EARLY_MATH_VISIBILITY_CUTOFF = Math.min(
  artifact.auditCompletedAt + EARLY_MATH_RELEASE_DAYS * day,
  Date.parse(`${new Date(artifact.auditCompletedAt + (EARLY_MATH_RELEASE_DAYS - 1) * day).toISOString().slice(0, 10)}T23:59:59.999Z`) + 1,
);
const resultValidator = v.object({
  releaseId: v.string(), phase: v.union(v.literal('ready'), v.literal('staged'), v.literal('enabled'), v.literal('drift')),
  artifactHash: v.string(), parentReadable: v.boolean(), configEnabled: v.boolean(), generation: v.union(v.number(), v.null()),
  activeReleaseCount: v.number(), reviewRevision: v.union(v.number(), v.null()),
  contentHash: v.union(v.string(), v.null()), sourceUnchanged: v.boolean(), linkUnchanged: v.boolean(), humanReviewsUnchanged: v.boolean(),
});

function preservedContent(content: Doc<'libraryContent'>) {
  const result = { ...content } as Record<string, unknown>;
  for (const key of ['data', 'reviewRevision', 'updatedAt', 'searchText', 'aiPublicationReleaseId', 'aiPublishedAt']) delete result[key];
  return result;
}

async function readState(ctx: Ctx) {
  const [contents, links, sources, configs, releases, active, reviews, runs, contentAudits, evidenceAudits] = await Promise.all([
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', slug)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q.eq('kind', 'lesson').eq('slug', slug)).take(2),
    ctx.db.query('evidenceSources').withIndex('by_source_id', (q) => q.eq('sourceId', expected.sourceId)).take(2),
    ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q.eq('key', 'global')).take(2),
    ctx.db.query('aiPublicationReleases').withIndex('by_release_id', (q) => q.eq('releaseId', releaseId)).take(2),
    ctx.db.query('aiPublicationReleases').withIndex('by_status', (q) => q.eq('status', 'active')).take(4),
    ctx.db.query('contentReviews').withIndex('by_content', (q) => q.eq('contentSlug', slug)).take(101),
    ctx.db.query('aiAuditRuns').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
    ctx.db.query('aiContentAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
    ctx.db.query('aiEvidenceAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
  ]);
  return { contents, links, sources, configs, releases, active, reviews, runs, contentAudits, evidenceAudits };
}

async function verifiedArtifact(now: number) {
  if (await sha256Canonical(artifact) !== artifactHash || artifact.targets.length !== 1
    || artifact.targets[0].slug !== slug || artifact.targets[0].type !== 'lesson'
    || artifact.targets[0].sourceId !== expected.sourceId || artifact.targets[0].verdict !== 'pass'
    || artifact.targets[0].independentAgentResults.length < 2
    || artifact.targets[0].independentAgentResults.some((result) => result.verdict !== 'pass')
    || !aiAuditFreshForActivation(artifact.auditCompletedAt, now) || artifact.auditStartedAt > artifact.auditCompletedAt) {
    throw new Error('Exact independent AI audit artifact is missing, drifted or stale');
  }
  return artifact.targets[0];
}

async function preflightState(ctx: Ctx, now: number) {
  await assertNoPersistedReleaseGovernedContent(ctx, [slug]);
  const state = await readState(ctx);
  const { contents, links, sources, configs, releases, active, reviews, runs, contentAudits, evidenceAudits } = state;
  const content = contents.length === 1 ? contents[0] : null;
  const sourceUnchanged = sources.length === 1 && await sha256Canonical(sources[0]) === expected.sourceFullHash;
  const linkUnchanged = links.length === 1 && await sha256Canonical(links[0]) === expected.linkFullHash;
  const humanReviewsUnchanged = reviews.length < 101 && await sha256Canonical(reviews) === expected.reviewsFullHash;
  const configExact = configs.length === 1 && await sha256Canonical(configs[0]) === expected.configFullHash;
  const contentHash = content ? await sha256Canonical(aiContentSnapshot(content)) : null;
  const common = sourceUnchanged && linkUnchanged && humanReviewsUnchanged && content?._id === expected.contentId
    && content.clinicalStatus === 'clinical_review' && await sha256Canonical(preservedContent(content)) === expected.preservedContentHash;
  const initialExact = common && configExact && active.length === 0 && releases.length === 0 && runs.length === 0
    && contentAudits.length === 0 && evidenceAudits.length === 0 && await sha256Canonical(content) === expected.contentFullHash;
  const appliedExact = Boolean(common && releases.length === 1 && active.length === 1 && active[0]._id === releases[0]._id
    && content && content.reviewRevision === expected.desiredRevision && content.searchText === seed.searchText
    && await aiReleaseMatchesCurrentState(ctx, content, releases[0], now, todayIsoUtc(new Date(now))));
  const enabled = configs.length === 1 && configs[0].enabled && configs[0].generation === expected.generation + 1;
  const phase = initialExact ? 'ready' : appliedExact && configExact ? 'staged' : appliedExact && enabled ? 'enabled' : 'drift';
  return { state, report: {
    releaseId, phase, artifactHash, parentReadable: content ? await contentIsAiParentReadable(ctx, content, now) : false,
    configEnabled: configs.length === 1 && configs[0].enabled, generation: configs.length === 1 ? configs[0].generation : null,
    activeReleaseCount: active.length, reviewRevision: content?.reviewRevision ?? null, contentHash,
    sourceUnchanged, linkUnchanged, humanReviewsUnchanged,
  } as const };
}

export const preflight = internalQuery({ args: {}, returns: resultValidator, handler: async (ctx) => (await preflightState(ctx, Date.now())).report });

/** Archive the actual AI audit and exact successor. Human review tables are never written. */
export const stage = internalMutation({
  args: { releaseId: v.literal(releaseId), operator: v.string(), gitCommit: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.report.phase === 'staged' || before.report.phase === 'enabled') return before.report;
    if (before.report.phase !== 'ready') throw new Error('Early math exact preimage drifted; no writes');
    if (!args.operator.trim() || args.operator.length > 160 || !/^[a-f0-9]{40}$/.test(args.gitCommit)) throw new Error('Invalid operator or git commit');
    const target = await verifiedArtifact(now);
    const content = before.state.contents[0];
    const source = before.state.sources[0];
    const link = before.state.links[0];
    const desired = { ...content, data: seed.data, reviewRevision: expected.desiredRevision };
    if (!sourceMayEnterAiPublication(source, todayIsoUtc(new Date(now)))
      || await sha256Canonical(aiContentSnapshot(desired)) !== target.contentSnapshotHash
      || await sha256Canonical(aiEvidenceLinkSnapshot(link)) !== target.evidenceLinkSnapshotHash
      || await sha256Canonical(aiEvidenceSnapshot(source)) !== target.sourceSnapshotHash) throw new Error('Audited desired snapshot mismatch');
    const targetArtifactHash = await sha256Canonical(target);
    const outputHash = (kind?: string) => sha256Canonical({ artifactHash, targetArtifactHash, ...(kind ? { kind } : {}) });
    const limitations = [...target.limitations, ...artifact.limitations];
    const nextAuditDate = new Date(artifact.auditCompletedAt + (EARLY_MATH_RELEASE_DAYS - 1) * day).toISOString().slice(0, 10);
    await ctx.db.insert('aiAuditRuns', {
      runId, releaseId, status: 'completed', provider: artifact.provider, model: artifact.model, modelVersion: artifact.modelVersion,
      policyVersion: AI_PUBLICATION_POLICY_VERSION, gitCommit: args.gitCommit, targetCount: 1,
      summary: `${artifact.summary} Target: lesson:${slug}.`, limitations: [...artifact.limitations],
      startedAt: artifact.auditStartedAt, completedAt: artifact.auditCompletedAt, outputHash: await outputHash(),
    });
    await ctx.db.insert('aiEvidenceAudits', {
      runId, sourceId: source.sourceId, sourceUpdatedAt: source.updatedAt, sourceSnapshotHash: target.sourceSnapshotHash,
      verdict: 'pass', claimScope: target.claimScope, urlsChecked: [target.sourceUrl], findings: [...target.evidenceFindings], limitations,
      auditedAt: artifact.auditCompletedAt, nextAuditDate, outputHash: await outputHash('evidence'),
    });
    await ctx.db.insert('aiContentAudits', {
      runId, contentSlug: slug, contentType: 'lesson', reviewRevision: expected.desiredRevision, contentUpdatedAt: now,
      contentSnapshotHash: target.contentSnapshotHash, evidenceLinkUpdatedAt: link.updatedAt, evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
      sourceIds: [source.sourceId], verdict: 'pass', checks: [...target.contentChecks], limitations,
      auditedAt: artifact.auditCompletedAt, nextAuditDate, outputHash: await outputHash('content'),
    });
    await ctx.db.insert('aiPublicationReleases', {
      releaseId, targetKey: aiPublicationTargetKey('lesson', slug), contentId: content._id, contentType: 'lesson', contentSlug: slug,
      status: 'active', reviewRevision: expected.desiredRevision, contentUpdatedAt: now, contentSnapshotHash: target.contentSnapshotHash,
      evidenceLinkUpdatedAt: link.updatedAt, evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
      sourceSnapshots: [{ sourceId: source.sourceId, sourceUpdatedAt: source.updatedAt, sourceSnapshotHash: target.sourceSnapshotHash, evidenceAuditRunId: runId }],
      contentAuditRunId: runId, auditArtifactHash: artifactHash, policyVersion: AI_PUBLICATION_POLICY_VERSION, gitCommit: args.gitCommit,
      operator: args.operator, createdAt: now, expiresAt: artifact.auditCompletedAt + EARLY_MATH_RELEASE_DAYS * day,
    });
    await ctx.db.patch(content._id, { data: seed.data, searchText: seed.searchText, reviewRevision: expected.desiredRevision,
      updatedAt: now, aiPublicationReleaseId: releaseId, aiPublishedAt: now });
    // Date.now alone does not invalidate a cached Convex query. A bounded,
    // transactional scheduler write withdraws this exact release at expiry.
    const expiryScheduledFunctionId = await ctx.scheduler.runAt(EARLY_MATH_VISIBILITY_CUTOFF, internal.aiEarlyMathPublication20260910.expire, { releaseId });
    const after = await preflightState(ctx, now);
    if (after.report.phase !== 'staged' || after.report.parentReadable) throw new Error('Staged read-back failed; transaction rolls back');
    await logAudit(ctx, null, 'library.ai_early_math.staged', 'aiPublicationReleases', releaseId,
      `${args.operator} staged one explicitly AI-reviewed educational lesson; no human approval written.`, {
        before: JSON.stringify(before.report),
        after: JSON.stringify({ ...after.report, expiryScheduledFunctionId: String(expiryScheduledFunctionId), visibilityCutoff: EARLY_MATH_VISIBILITY_CUTOFF }),
      });
    return after.report;
  },
});

export const enable = internalMutation({
  args: { releaseId: v.literal(releaseId), expectedGeneration: v.literal(2), operator: v.string(), reason: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.report.phase === 'enabled' && before.report.parentReadable) return before.report;
    if (before.report.phase !== 'staged' || !aiPublicationMasterEnabled()) throw new Error('Exact singleton staged release and environment master required');
    if (!args.operator.trim() || args.operator.length > 160 || !args.reason.trim() || args.reason.length > 500) throw new Error('Invalid operator or reason');
    await verifiedArtifact(now);
    await ctx.db.patch(before.state.configs[0]._id, { enabled: true, generation: args.expectedGeneration + 1,
      updatedAt: now, operator: args.operator, reason: args.reason });
    const after = await preflightState(ctx, now);
    const readable = await activeAiParentReadableContent(ctx, now);
    if (after.report.phase !== 'enabled' || !after.report.parentReadable || !readable.complete
      || readable.rows.length !== 1 || readable.rows[0].slug !== slug) throw new Error('Parent-readable singleton postflight failed');
    await logAudit(ctx, null, 'library.ai_early_math.enabled', 'aiPublicationConfig', 'global',
      `${args.operator}: ${args.reason}`, { before: JSON.stringify(before.report), after: JSON.stringify(after.report) });
    return after.report;
  },
});

/** Independent parent-path read-back, not a mutation receipt. */
export const postflight = internalQuery({ args: {}, returns: resultValidator, handler: async (ctx) => (await preflightState(ctx, Date.now())).report });

/** One-time expiry for this immutable release; never modifies human decisions. */
export const expire = internalMutation({
  args: { releaseId: v.literal(releaseId) },
  returns: v.object({ releaseId: v.string(), revoked: v.boolean(), pointersCleared: v.boolean() }),
  handler: async (ctx) => {
    const now = Date.now();
    if (now < EARLY_MATH_VISIBILITY_CUTOFF) throw new Error('Early math expiry cannot run before its exact cutoff');
    const releases = await ctx.db.query('aiPublicationReleases').withIndex('by_release_id', (q) => q.eq('releaseId', releaseId)).take(2);
    if (releases.length > 1) throw new Error('Duplicate exact early math release; no expiry writes');
    const release = releases[0];
    if (!release || release.status === 'revoked') return { releaseId, revoked: false, pointersCleared: false };
    if (release.contentId !== expected.contentId || release.contentSlug !== slug || release.contentType !== 'lesson'
      || release.auditArtifactHash !== artifactHash) throw new Error('Expiry release identity drifted');
    await ctx.db.patch(release._id, { status: 'revoked', revokedAt: now, revokeReason: 'Scheduled exact AI audit expiry; no human review decision changed.' });
    const content = await ctx.db.get(release.contentId);
    const pointersCleared = content?.aiPublicationReleaseId === releaseId;
    if (content && pointersCleared) await ctx.db.patch(content._id, { aiPublicationReleaseId: undefined, aiPublishedAt: undefined });
    await logAudit(ctx, null, 'library.ai_early_math.expired', 'aiPublicationReleases', releaseId,
      'Scheduled withdrawal of the one exact AI-reviewed lesson; no human approval or unrelated release changed.');
    return { releaseId, revoked: true, pointersCleared };
  },
});
