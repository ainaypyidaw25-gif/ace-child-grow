import { v } from 'convex/values';
import { internalMutation, internalQuery, type QueryCtx, type MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { logAudit } from './audit';
import { aiContentSnapshot, aiEvidenceLinkSnapshot, aiEvidenceSnapshot, sha256Canonical } from './lib/aiAuditHash';
import { TWO_STORIES_ARTIFACT as artifact, TWO_STORIES_ARTIFACT_HASH as artifactHash } from './lib/aiTwoStoriesPublication20260910Artifact';
import { TWO_STORIES_PREIMAGE as expected, TWO_STORIES_SCHOOL_SOURCE as schoolSource, TWO_STORIES_RELEASE_ROOT as root, TWO_STORIES_RELEASE_DAYS, twoStoriesReleaseId, twoStoriesRunId } from './lib/aiTwoStoriesPublication20260910Data';
import { AI_PUBLICATION_POLICY_VERSION, aiAuditFreshForActivation, aiPublicationMasterEnabled, aiPublicationTargetKey, sourceMayEnterAiPublication } from './lib/aiPublicationPolicy';
import { activeAiParentReadableContent, aiReleaseMatchesCurrentState, contentIsAiParentReadable } from './lib/aiPublicationVisibility';
import { assertNoPersistedReleaseGovernedContent } from './lib/clinicalReviewBatchProvenance';
import { todayIsoUtc } from './lib/evidenceFreshness';

type Ctx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type TargetState = Awaited<ReturnType<typeof readState>>['targets'][number];
const day = 86_400_000;
const slugs = expected.targets.map((target) => target.slug);
const nextAuditDate = new Date(artifact.auditCompletedAt + (TWO_STORIES_RELEASE_DAYS - 1) * day).toISOString().slice(0, 10);
export const TWO_STORIES_VISIBILITY_CUTOFF = Date.parse(`${nextAuditDate}T23:59:59.999Z`) + 1;
const reportValidator = v.object({
  releaseRoot: v.string(), artifactHash: v.string(), phase: v.union(v.literal('ready'), v.literal('staged'), v.literal('enabled'), v.literal('drift')),
  activeReleaseCount: v.number(), generation: v.union(v.number(), v.null()), mathUnchanged: v.boolean(), mathReadable: v.boolean(),
  humanReviewsUnchanged: v.boolean(), oldSourcesUnchanged: v.boolean(), predecessorsUnchanged: v.boolean(),
  targets: v.array(v.object({ slug: v.string(), revision: v.union(v.number(), v.null()), parentReadable: v.boolean() })),
});
const omit = (value: object, keys: string[]) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
const preservedContent = (value: object) => omit(value, ['updatedAt', 'reviewRevision', 'aiPublicationReleaseId', 'aiPublishedAt']);
const sourceMetadata = (value: object) => omit(value, ['_id', '_creationTime', 'createdAt', 'updatedAt']);

async function readState(ctx: Ctx) {
  const [configs, active, math, newSources, targets] = await Promise.all([
    ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q.eq('key', 'global')).take(2),
    ctx.db.query('aiPublicationReleases').withIndex('by_status', (q) => q.eq('status', 'active')).take(4),
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', 'lsn_early_math')).take(2),
    ctx.db.query('evidenceSources').withIndex('by_source_id', (q) => q.eq('sourceId', schoolSource.sourceId)).take(2),
    Promise.all(expected.targets.map(async (target) => {
      const slug = target.slug;
      const runId = twoStoriesRunId(slug);
      const [contents, links, sources, reviews, predecessors, releases, runs, contentAudits, evidenceAudits, media] = await Promise.all([
        ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', slug)).take(2),
        ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q.eq('kind', 'story').eq('slug', slug)).take(2),
        ctx.db.query('evidenceSources').withIndex('by_source_id', (q) => q.eq('sourceId', target.sourceId)).take(2),
        ctx.db.query('contentReviews').withIndex('by_content', (q) => q.eq('contentSlug', slug)).take(101),
        ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q.eq('targetKey', aiPublicationTargetKey('story', slug))).take(10),
        ctx.db.query('aiPublicationReleases').withIndex('by_release_id', (q) => q.eq('releaseId', twoStoriesReleaseId(slug))).take(2),
        ctx.db.query('aiAuditRuns').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
        ctx.db.query('aiContentAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
        ctx.db.query('aiEvidenceAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
        ctx.db.query('libraryMedia').withIndex('by_content', (q) => q.eq('contentSlug', slug)).take(101),
      ]);
      return { target, contents, links, sources, reviews, predecessors, releases, runs, contentAudits, evidenceAudits, media };
    })),
  ]);
  return { configs, active, math, newSources, targets };
}

async function verifyArtifact(now: number) {
  if (await sha256Canonical(artifact) !== artifactHash || artifact.targets.length !== 2
    || new Set(artifact.targets.map((target) => target.slug)).size !== 2
    || artifact.targets.some((target) => target.type !== 'story' || !slugs.includes(target.slug as typeof slugs[number])
      || target.verdict !== 'pass' || target.independentAgentResults.length !== 2
      || !target.independentAgentResults.some((result) => result.role === 'source_research')
      || !target.independentAgentResults.some((result) => result.role === 'semantic_audit')
      || target.independentAgentResults.some((result) => result.verdict !== 'pass'))
    || !aiAuditFreshForActivation(artifact.auditCompletedAt, now) || now >= TWO_STORIES_VISIBILITY_CUTOFF) {
    throw new Error('Exact two-story independent audit missing, stale or drifted');
  }
}

/** Construct the prospective row to validate staged audits without exposing it. */
function releaseSnapshot(target: TargetState, source: Doc<'evidenceSources'>, gitCommit: string, operator: string) {
  const content = target.contents[0];
  const link = target.links[0];
  const audited = artifact.targets.find((row) => row.slug === target.target.slug)!;
  const runId = twoStoriesRunId(target.target.slug);
  return {
    releaseId: twoStoriesReleaseId(content.slug), targetKey: aiPublicationTargetKey('story', content.slug),
    contentId: content._id, contentType: 'story', contentSlug: content.slug, status: 'active' as const,
    reviewRevision: target.target.desiredRevision, contentUpdatedAt: content.updatedAt, contentSnapshotHash: audited.contentSnapshotHash,
    evidenceLinkUpdatedAt: link.updatedAt, evidenceLinkSnapshotHash: audited.evidenceLinkSnapshotHash,
    sourceSnapshots: [{ sourceId: source.sourceId, sourceUpdatedAt: source.updatedAt, sourceSnapshotHash: audited.sourceSnapshotHash, evidenceAuditRunId: runId }],
    contentAuditRunId: runId, auditArtifactHash: artifactHash, policyVersion: AI_PUBLICATION_POLICY_VERSION,
    gitCommit, operator, createdAt: content.updatedAt, expiresAt: artifact.auditCompletedAt + TWO_STORIES_RELEASE_DAYS * day,
  };
}

async function preflightState(ctx: Ctx, now: number) {
  await assertNoPersistedReleaseGovernedContent(ctx, slugs);
  const state = await readState(ctx);
  const mathUnchanged = await sha256Canonical(state.math) === expected.mathFullHash
    && await sha256Canonical(state.active.filter((release) => release.releaseId === expected.mathReleaseId)) === expected.mathReleaseFullHash;
  const mathReadable = state.math.length === 1 && await contentIsAiParentReadable(ctx, state.math[0], now);
  const configExact = await sha256Canonical(state.configs) === expected.configFullHash;
  const humanReviewsUnchanged = (await Promise.all(state.targets.map(async (row) => row.reviews.length < 101
    && await sha256Canonical(row.reviews) === row.target.reviewsFullHash))).every(Boolean);
  const oldSourcesUnchanged = (await Promise.all(state.targets.map(async (row) => row.sources.length === 1
    && await sha256Canonical(row.sources) === row.target.sourceFullHash))).every(Boolean);
  const predecessorsUnchanged = (await Promise.all(state.targets.map(async (row) => row.predecessors.length < 10
    && await sha256Canonical(row.predecessors.filter((release) => release.releaseId !== twoStoriesReleaseId(row.target.slug))) === row.target.predecessorsFullHash))).every(Boolean);
  const common = mathUnchanged && mathReadable && configExact && humanReviewsUnchanged && oldSourcesUnchanged && predecessorsUnchanged
    && (await Promise.all(state.targets.map(async (row) => row.contents.length === 1 && row.links.length === 1
      && row.contents[0]._id === row.target.contentId && row.contents[0].clinicalStatus === 'clinical_review'
      && await sha256Canonical(preservedContent(row.contents[0])) === row.target.preservedContentHash
      && row.media.length < 101 && row.media.every((media) => media.placeholder && !media.url && !media.storageId)
      && await sha256Canonical(row.media) === row.target.mediaFullHash))).every(Boolean);
  const initial = common && state.active.length === 1 && state.newSources.length === 0
    && (await Promise.all(state.targets.map(async (row) => row.releases.length === 0 && row.runs.length === 0
      && row.contentAudits.length === 0 && row.evidenceAudits.length === 0
      && await sha256Canonical(row.contents) === row.target.contentFullHash
      && await sha256Canonical(row.links) === row.target.linkFullHash))).every(Boolean);
  const correctedSourceExact = state.newSources.length === 1
    && await sha256Canonical(sourceMetadata(state.newSources[0])) === await sha256Canonical(schoolSource);
  const applied = common && correctedSourceExact && (await Promise.all(state.targets.map(async (row) => {
    if (row.contents.length !== 1 || row.links.length !== 1 || row.runs.length !== 1) return false;
    const content = row.contents[0];
    const source = row.target.slug === 'st_first_day_school' ? state.newSources[0] : row.sources[0];
    if (content.reviewRevision !== row.target.desiredRevision || !source) return false;
    if (row.target.slug === 'st_first_day_school') {
      if (row.links[0].updatedAt !== content.updatedAt || source.updatedAt !== content.updatedAt
        || source.createdAt !== content.updatedAt || await sha256Canonical(omit(row.links[0], ['sourceIds', 'updatedAt'])) !== row.target.linkPreservedHash) return false;
    } else if (await sha256Canonical(row.links) !== row.target.linkFullHash) return false;
    const prospective = releaseSnapshot(row, source, row.runs[0].gitCommit, 'prospective validation only');
    return aiReleaseMatchesCurrentState(ctx,
      { ...content, aiPublicationReleaseId: prospective.releaseId, aiPublishedAt: prospective.createdAt },
      { ...prospective, _id: 'prospective' as Id<'aiPublicationReleases'>, _creationTime: prospective.createdAt }, now, todayIsoUtc(new Date(now)));
  }))).every(Boolean);
  const staged = applied && state.active.length === 1 && state.targets.every((row) => row.releases.length === 0
    && !row.contents[0].aiPublicationReleaseId && row.contents[0].aiPublishedAt === undefined);
  const enabled = applied && state.active.length === 3 && (await Promise.all(state.targets.map(async (row) => row.releases.length === 1
    && state.active.some((release) => release._id === row.releases[0]._id)
    && await aiReleaseMatchesCurrentState(ctx, row.contents[0], row.releases[0], now, todayIsoUtc(new Date(now)))))).every(Boolean);
  const phase = initial ? 'ready' : staged ? 'staged' : enabled ? 'enabled' : 'drift';
  return { state, report: {
    releaseRoot: root, artifactHash, phase, activeReleaseCount: state.active.length, generation: state.configs.length === 1 ? state.configs[0].generation : null,
    mathUnchanged, mathReadable, humanReviewsUnchanged, oldSourcesUnchanged, predecessorsUnchanged,
    targets: await Promise.all(state.targets.map(async (row) => ({ slug: row.target.slug, revision: row.contents[0]?.reviewRevision ?? null,
      parentReadable: row.contents.length === 1 && await contentIsAiParentReadable(ctx, row.contents[0], now) }))),
  } as const };
}

export const preflight = internalQuery({ args: {}, returns: reportValidator, handler: async (ctx) => (await preflightState(ctx, Date.now())).report });
export const postflight = internalQuery({ args: {}, returns: reportValidator, handler: async (ctx) => (await preflightState(ctx, Date.now())).report });

/** Archives actual AI audits and corrects only the school source/link. No release row or pointer is created here. */
export const stage = internalMutation({
  args: { releaseRoot: v.literal(root), operator: v.string(), gitCommit: v.string() }, returns: reportValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.report.phase === 'staged' || before.report.phase === 'enabled') return before.report;
    if (before.report.phase !== 'ready' || !aiPublicationMasterEnabled()) throw new Error('Two-story exact preimage drifted; no writes');
    if (!args.operator.trim() || args.operator.length > 160 || !/^[a-f0-9]{40}$/.test(args.gitCommit)) throw new Error('Invalid operator/commit');
    await verifyArtifact(now);
    const newSourceId = await ctx.db.insert('evidenceSources', { ...schoolSource, createdAt: now, updatedAt: now });
    const newSource = (await ctx.db.get(newSourceId))!;
    for (const row of before.state.targets) {
      const slug = row.target.slug;
      const target = artifact.targets.find((item) => item.slug === slug)!;
      const source = slug === 'st_first_day_school' ? newSource : row.sources[0];
      if (slug === 'st_first_day_school') await ctx.db.patch(row.links[0]._id, { sourceIds: [schoolSource.sourceId], updatedAt: now });
      const link = (await ctx.db.get(row.links[0]._id))!;
      await ctx.db.patch(row.contents[0]._id, { reviewRevision: row.target.desiredRevision, updatedAt: now });
      const content = (await ctx.db.get(row.contents[0]._id))!;
      if (!sourceMayEnterAiPublication(source, todayIsoUtc(new Date(now)))
        || await sha256Canonical(aiContentSnapshot(content)) !== target.contentSnapshotHash
        || await sha256Canonical(aiEvidenceLinkSnapshot(link)) !== target.evidenceLinkSnapshotHash
        || await sha256Canonical(aiEvidenceSnapshot(source)) !== target.sourceSnapshotHash) throw new Error('Audited story snapshot mismatch; transaction rolls back');
      const runId = twoStoriesRunId(slug);
      const releaseId = twoStoriesReleaseId(slug);
      const targetArtifactHash = await sha256Canonical(target);
      const outputHash = (kind?: string) => sha256Canonical({ artifactHash, targetArtifactHash, ...(kind ? { kind } : {}) });
      const limitations = [...target.limitations, ...artifact.limitations];
      await ctx.db.insert('aiAuditRuns', { runId, releaseId, status: 'completed', provider: artifact.provider, model: artifact.model,
        modelVersion: artifact.modelVersion, policyVersion: AI_PUBLICATION_POLICY_VERSION, gitCommit: args.gitCommit, targetCount: 1,
        summary: `${artifact.summary} Target: story:${slug}.`, limitations: [...artifact.limitations], startedAt: artifact.auditStartedAt,
        completedAt: artifact.auditCompletedAt, outputHash: await outputHash() });
      await ctx.db.insert('aiEvidenceAudits', { runId, sourceId: source.sourceId, sourceUpdatedAt: source.updatedAt,
        sourceSnapshotHash: target.sourceSnapshotHash, verdict: 'pass', claimScope: target.claimScope, urlsChecked: [target.sourceUrl],
        findings: [...target.evidenceFindings], limitations, auditedAt: artifact.auditCompletedAt, nextAuditDate, outputHash: await outputHash('evidence') });
      await ctx.db.insert('aiContentAudits', { runId, contentSlug: slug, contentType: 'story', reviewRevision: row.target.desiredRevision,
        contentUpdatedAt: now, contentSnapshotHash: target.contentSnapshotHash, evidenceLinkUpdatedAt: link.updatedAt,
        evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash, sourceIds: [source.sourceId], verdict: 'pass', checks: [...target.contentChecks],
        limitations, auditedAt: artifact.auditCompletedAt, nextAuditDate, outputHash: await outputHash('content') });
    }
    const after = await preflightState(ctx, now);
    if (after.report.phase !== 'staged' || after.report.targets.some((target) => target.parentReadable)) throw new Error('Staged read-back failed; transaction rolls back');
    await logAudit(ctx, null, 'library.ai_two_stories.staged', 'aiAuditRuns', root,
      `${args.operator} staged two actual AI audits and one corrected source/link; no publication or human approval.`, { before: JSON.stringify(before.report), after: JSON.stringify(after.report) });
    return after.report;
  },
});

/** Atomically publishes both exact stories; the existing math row/control is untouched. */
export const activate = internalMutation({
  args: { releaseRoot: v.literal(root), expectedGeneration: v.literal(3), operator: v.string() }, returns: reportValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.report.phase === 'enabled') return before.report;
    if (before.report.phase !== 'staged' || !aiPublicationMasterEnabled()) throw new Error('Exact staged two-story gate required');
    if (!args.operator.trim() || args.operator.length > 160) throw new Error('Invalid operator');
    await verifyArtifact(now);
    for (const row of before.state.targets) {
      const source = row.target.slug === 'st_first_day_school' ? before.state.newSources[0] : row.sources[0];
      const release = releaseSnapshot(row, source, row.runs[0].gitCommit, args.operator);
      await ctx.db.insert('aiPublicationReleases', release);
      await ctx.db.patch(row.contents[0]._id, { aiPublicationReleaseId: release.releaseId, aiPublishedAt: release.createdAt });
    }
    const expiryScheduledFunctionId = await ctx.scheduler.runAt(TWO_STORIES_VISIBILITY_CUTOFF, internal.aiTwoStoriesPublication20260910.expire, { releaseRoot: root });
    const after = await preflightState(ctx, now);
    const readable = await activeAiParentReadableContent(ctx, now);
    const keys = readable.rows.map((row) => row.slug).sort();
    if (after.report.phase !== 'enabled' || !readable.complete || JSON.stringify(keys) !== JSON.stringify(['lsn_early_math', ...slugs].sort())) {
      throw new Error('Exact three-item parent read-back failed; transaction rolls back');
    }
    await logAudit(ctx, null, 'library.ai_two_stories.enabled', 'aiPublicationReleases', root,
      `${args.operator} published two explicitly AI-reviewed fictional stories; math and human approvals unchanged.`,
      { before: JSON.stringify(before.report), after: JSON.stringify({ ...after.report, expiryScheduledFunctionId: String(expiryScheduledFunctionId), visibilityCutoff: TWO_STORIES_VISIBILITY_CUTOFF }) });
    return after.report;
  },
});

/** One bounded scheduled write invalidates reactive cached reads at the exact cutoff. */
export const expire = internalMutation({
  args: { releaseRoot: v.literal(root) }, returns: v.object({ revoked: v.number(), pointersCleared: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    if (now < TWO_STORIES_VISIBILITY_CUTOFF) throw new Error('Two-story expiry cannot run early');
    const rows = await Promise.all(expected.targets.map(async (target) => {
      const releases = await ctx.db.query('aiPublicationReleases').withIndex('by_release_id', (q) => q.eq('releaseId', twoStoriesReleaseId(target.slug))).take(2);
      if (releases.length > 1 || (releases[0] && (releases[0].contentId !== target.contentId || releases[0].contentSlug !== target.slug
        || releases[0].contentType !== 'story' || releases[0].auditArtifactHash !== artifactHash))) throw new Error('Expiry exact identity drifted');
      return releases[0];
    }));
    let revoked = 0;
    let pointersCleared = 0;
    for (const release of rows) {
      if (!release || release.status === 'revoked') continue;
      await ctx.db.patch(release._id, { status: 'revoked', revokedAt: now, revokeReason: 'Scheduled exact AI audit expiry; no human decision changed.' });
      revoked++;
      const content = await ctx.db.get(release.contentId);
      if (content?.aiPublicationReleaseId === release.releaseId) {
        await ctx.db.patch(content._id, { aiPublicationReleaseId: undefined, aiPublishedAt: undefined });
        pointersCleared++;
      }
    }
    if (revoked) await logAudit(ctx, null, 'library.ai_two_stories.expired', 'aiPublicationReleases', root, 'Withdrew only this exact two-story AI release at its scheduled expiry.');
    return { revoked, pointersCleared };
  },
});
