import { v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';

import { logAudit } from './audit';
import {
  aiContentSnapshot,
  aiEvidenceLinkSnapshot,
  aiEvidenceSnapshot,
  canonicalJson,
  sha256Canonical,
} from './lib/aiAuditHash';
import {
  aiAuditFreshForActivation,
  aiPublicationMasterEnabled,
  aiPublicationTargetKey,
  sourceMayEnterAiPublication,
} from './lib/aiPublicationPolicy';
import {
  activeAiParentReadableContent,
  contentIsAiParentReadable,
} from './lib/aiPublicationVisibility';
import { CLINICAL_REVIEW_BATCH_REGISTRY } from './lib/clinicalReviewBatchData';
import { isRegisteredReleaseContentTarget } from './lib/clinicalReviewBatchProvenance';
import { sevenStoriesPreservedRows } from './lib/aiSevenStoriesPreservation';
import {
  POWER_OF_PLAY_ARTIFACT as artifact,
  POWER_OF_PLAY_ARTIFACT_HASH as artifactHash,
} from './lib/aiPowerOfPlayPublication20260910Artifact';
import {
  POWER_OF_PLAY_DESIRED_FIELDS as seed,
  POWER_OF_PLAY_PRESERVATION as preservation,
  POWER_OF_PLAY_OLD_SCHEDULES as oldSchedules,
  POWER_OF_PLAY_CONTENT_RUN_ID as contentRunId,
  POWER_OF_PLAY_POLICY_VERSION as policyVersion,
  POWER_OF_PLAY_PREIMAGE as expected,
  POWER_OF_PLAY_RELEASE_DAYS as releaseDays,
  POWER_OF_PLAY_RELEASE_ID as releaseId,
  POWER_OF_PLAY_RELEASE_ROOT as root,
  POWER_OF_PLAY_SLUG as slug,
  powerOfPlaySourceRunId as sourceRunId,
} from './lib/aiPowerOfPlayPublication20260910Data';

type Ctx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type Target = (typeof artifact.targets)[number];
type Staged = { operator: string; gitCommit: string; stagedAt: number };
type Enabled = {
  operator: string;
  activatedAt: number;
  expiryScheduledFunctionId: string;
};


const day = 86_400_000;
const nextAuditDate = new Date(artifact.auditCompletedAt + (releaseDays - 1) * day)
  .toISOString().slice(0, 10);
export const POWER_OF_PLAY_VISIBILITY_CUTOFF =
  Date.parse(`${nextAuditDate}T23:59:59.999Z`) + 1;
const expiresAt = artifact.auditCompletedAt + releaseDays * day;
const identity = {
  releaseRoot: root,
  artifactHash,
  snapshotSha256: expected.snapshotSha256,
};
const identityValidators = {
  releaseRoot: v.literal(root),
  artifactHash: v.literal(artifactHash),
  snapshotSha256: v.literal(expected.snapshotSha256),
};
const previousSlugs = [
  'lsn_reading_together',
  'lsn_early_math',
  'st_waiting_at_clinic',
  'st_first_day_school',
  'st_little_seed',
  'st_ba_ba_sounds',
  'st_when_i_feel_angry',
  'st_taking_turns',
  'st_goodnight_moon_friend',
  'st_visit_to_doctor',
  'st_sharing_mango',
] as const;
const action = (phase: string) => `library.ai_power_of_play.${phase}`;
const equal = (left: unknown, right: unknown) => canonicalJson(left) === canonicalJson(right);
const strip = (row: object, keys: readonly string[]) =>
  Object.fromEntries(Object.entries(row).filter(([key]) => !keys.includes(key)));
const stripDb = (row: object) => strip(row, ['_id', '_creationTime']);
const sortedRows = <T extends { _id: unknown }>(rows: T[]): T[] =>
  [...rows].sort((left, right) => String(left._id).localeCompare(String(right._id)));

function preservedContent(row: Doc<'libraryContent'>) {
  return strip(row, [
    'summaryMm',
    'summaryEn',
    'data',
    'searchText',
    'reviewRevision',
    'updatedAt',
    'aiPublicationReleaseId',
    'aiPublishedAt',
  ]);
}
function assertIdentity(args: typeof identity) {
  if (!equal(args, identity)) throw new Error('Power-of-play release identity mismatch');
}
function validOperator(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
}
function assertFresh(now: number) {
  if (!aiPublicationMasterEnabled()
    || !aiAuditFreshForActivation(artifact.auditCompletedAt, now)
    || now < expected.capturedAt
    || now >= POWER_OF_PLAY_VISIBILITY_CUTOFF) {
    throw new Error('Exact AI audit is stale or master switch disabled');
  }
}
async function assertCompiledEvidence() {
  const preimage = strip(expected, ['snapshotSha256']);
  const target = artifact.targets[0];
  if ((await sha256Canonical(preimage)) !== expected.snapshotSha256
    || await sha256Canonical(preservation) !== expected.preservationHash
    || await sha256Canonical(oldSchedules) !== expected.oldSchedulesHash
    || await sha256Canonical(seed) !== expected.desiredFieldsHash
    || (await sha256Canonical(artifact)) !== artifactHash
    || artifact.schemaVersion !== 2
    || artifact.policyVersion !== policyVersion
    || artifact.releaseId !== root
    || artifact.targets.length !== 1
    || target.type !== 'lesson'
    || target.slug !== slug
    || target.verdict !== 'pass'
    || target.contentSnapshotHash !== expected.desiredContentSnapshotHash
    || target.evidenceLinkSnapshotHash !== expected.linkSnapshotHash
    || target.mediaCount !== expected.mediaCount
    || target.mediaSnapshotHash !== expected.mediaFullHash
    || !equal(target.sources.map((source) => source.sourceId), expected.sourceIds)
    || !equal(target.sources.map((source) => source.sourceSnapshotHash), expected.sourceIds.map((id) => expected.sourceRows.find((source) => source.sourceId === id)!.snapshotHash))
    || target.independentAgentResults.length !== 2
    || target.independentAgentResults.some((result) => result.verdict !== 'pass')
    || !target.independentAgentResults.some((result) => result.role === 'source_research')
    || !target.independentAgentResults.some((result) => result.role === 'semantic_audit')) {
    throw new Error('Compiled power-of-play evidence is missing or drifted');
  }
  return target;
}

async function receipt(ctx: Ctx, phase: string) {
  return ctx.db.query('auditLogs').withIndex('by_action', (q) => q.eq('action', action(phase))).take(2);
}
function parseReceipt<T>(
  rows: Doc<'auditLogs'>[],
  phase: string,
  validate: (payload: Record<string, unknown>) => boolean,
): T | null {
  if (rows.length !== 1) return null;
  const row = rows[0];
  try {
    const payload = JSON.parse(row.after ?? 'null') as Record<string, unknown>;
    if (!payload || typeof payload !== 'object' || !equal(payload.identity, identity)
      || !validate(payload) || row.actorId !== undefined
      || row.entityTable !== 'aiPublicationReleases' || row.entityId !== root
      || row.result !== 'ok' || row.summary !== phase || row.before !== JSON.stringify(identity)) return null;
    return payload as T;
  } catch {
    return null;
  }
}

const baseRun = (staged: Staged) => ({
  releaseId,
  status: 'completed' as const,
  provider: artifact.provider,
  model: artifact.model,
  modelVersion: artifact.modelVersion,
  policyVersion,
  gitCommit: staged.gitCommit,
  targetCount: 1,
  limitations: [...artifact.limitations],
  startedAt: artifact.auditStartedAt,
  completedAt: artifact.auditCompletedAt,
});

async function auditPayloads(
  target: Target,
  content: Doc<'libraryContent'>,
  link: Doc<'evidenceLinks'>,
  sources: Doc<'evidenceSources'>[],
  staged: Staged,
) {
  const targetArtifactHash = await sha256Canonical(target);
  const output = (extra: object = {}) => sha256Canonical({ artifactHash, targetArtifactHash, ...extra });
  const summary = `${artifact.summary} Target: lesson:${slug}.`;
  const limitations = [...target.limitations, ...artifact.limitations];
  const contentRun = {
    ...baseRun(staged),
    runId: contentRunId,
    summary,
    outputHash: await output(),
  };
  const contentAudit = {
    runId: contentRunId,
    contentSlug: slug,
    contentType: 'lesson',
    reviewRevision: expected.desiredRevision,
    contentUpdatedAt: content.updatedAt,
    contentSnapshotHash: target.contentSnapshotHash,
    evidenceLinkUpdatedAt: link.updatedAt,
    evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
    sourceIds: target.sources.map((source) => source.sourceId),
    verdict: 'pass' as const,
    checks: [...target.contentChecks],
    limitations,
    auditedAt: artifact.auditCompletedAt,
    nextAuditDate,
    outputHash: await output({ kind: 'content' }),
  };
  const evidence = await Promise.all(target.sources.map(async (sourceArtifact) => {
    const source = sources.find((row) => row.sourceId === sourceArtifact.sourceId)!;
    return {
      run: {
        ...baseRun(staged),
        runId: sourceRunId(sourceArtifact.sourceId),
        summary: `${summary} Source: ${sourceArtifact.sourceId}.`,
        outputHash: await output({ sourceId: sourceArtifact.sourceId }),
      },
      audit: {
        runId: sourceRunId(sourceArtifact.sourceId),
        sourceId: sourceArtifact.sourceId,
        sourceUpdatedAt: source.updatedAt,
        sourceSnapshotHash: sourceArtifact.sourceSnapshotHash,
        verdict: 'pass' as const,
        claimScope: sourceArtifact.claimScope,
        urlsChecked: [...sourceArtifact.urlsChecked],
        findings: [...sourceArtifact.evidenceFindings],
        limitations: [...sourceArtifact.limitations, ...limitations],
        auditedAt: artifact.auditCompletedAt,
        nextAuditDate,
        outputHash: await output({ kind: 'evidence', sourceId: sourceArtifact.sourceId }),
      },
    };
  }));
  return { contentRun, contentAudit, evidence };
}

function releasePayload(
  target: Target,
  content: Doc<'libraryContent'>,
  link: Doc<'evidenceLinks'>,
  sources: Doc<'evidenceSources'>[],
  staged: Staged,
  enabled: Enabled,
) {
  return {
    releaseId,
    targetKey: aiPublicationTargetKey('lesson', slug),
    contentId: content._id,
    contentType: 'lesson',
    contentSlug: slug,
    status: 'active' as const,
    reviewRevision: expected.desiredRevision,
    contentUpdatedAt: content.updatedAt,
    contentSnapshotHash: target.contentSnapshotHash,
    evidenceLinkUpdatedAt: link.updatedAt,
    evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
    sourceSnapshots: target.sources.map((sourceArtifact) => ({
      sourceId: sourceArtifact.sourceId,
      sourceUpdatedAt: sources.find((row) => row.sourceId === sourceArtifact.sourceId)!.updatedAt,
      sourceSnapshotHash: sourceArtifact.sourceSnapshotHash,
      evidenceAuditRunId: sourceRunId(sourceArtifact.sourceId),
    })),
    contentAuditRunId: contentRunId,
    auditArtifactHash: artifactHash,
    policyVersion,
    gitCommit: staged.gitCommit,
    operator: enabled.operator,
    createdAt: enabled.activatedAt,
    expiresAt,
  };
}

async function readTarget(ctx: Ctx) {
  const expectedRunIds = [contentRunId, ...expected.sourceIds.map(sourceRunId)];
  const [contents, links, sourceRows, reviews, media, assignments, releases, targetReleases,
    releaseRuns, contentAudits, runRows, evidenceRows, contentRowsByRun, configs] = await Promise.all([
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', slug)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_slug', (q) => q.eq('slug', slug)).take(2),
    Promise.all(expected.currentSourceIds.map((sourceId) =>
      ctx.db.query('evidenceSources').withIndex('by_source_id', (q) => q.eq('sourceId', sourceId)).take(2))),
    ctx.db.query('contentReviews').withIndex('by_content', (q) => q.eq('contentSlug', slug)).take(expected.reviewsCount + 1),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) => q.eq('contentSlug', slug)).take(expected.mediaCount + 1),
    ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target', (q) => q.eq('contentSlug', slug)).take(1),
    ctx.db.query('aiPublicationReleases').withIndex('by_release_id', (q) => q.eq('releaseId', releaseId)).take(2),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q.eq('targetKey', aiPublicationTargetKey('lesson', slug))).take(2),
    ctx.db.query('aiAuditRuns').withIndex('by_release_id', (q) => q.eq('releaseId', releaseId)).take(expectedRunIds.length + 1),
    ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at', (q) => q.eq('contentSlug', slug)).take(2),
    Promise.all(expectedRunIds.map((runId) => ctx.db.query('aiAuditRuns').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2))),
    Promise.all(expectedRunIds.map((runId) => ctx.db.query('aiEvidenceAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2))),
    Promise.all(expectedRunIds.map((runId) => ctx.db.query('aiContentAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2))),
    ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q.eq('key', 'global')).take(2),
  ]);
  return {
    expectedRunIds,
    contents,
    links,
    sourceRows,
    reviews,
    media,
    assignments,
    releases,
    targetReleases,
    releaseRuns,
    contentAudits,
    runRows,
    evidenceRows,
    contentRowsByRun,
    configs,
  };
}

async function inspect(ctx: Ctx, now: number) {
  const target = await assertCompiledEvidence();
  const [state, stageRows, enabledRows, withdrawnRows, expiredRows] = await Promise.all([
    readTarget(ctx),
    receipt(ctx, 'staged'),
    receipt(ctx, 'enabled'),
    receipt(ctx, 'withdrawn'),
    receipt(ctx, 'expired'),
  ]);
  const staged = parseReceipt<Staged>(stageRows, 'staged', (payload) =>
    typeof payload.stagedAt === 'number' && payload.stagedAt >= expected.capturedAt
    && aiAuditFreshForActivation(artifact.auditCompletedAt, payload.stagedAt)
    && typeof payload.gitCommit === 'string' && /^[a-f0-9]{40}$/.test(payload.gitCommit)
    && validOperator(payload.operator));
  const enabled = parseReceipt<Enabled>(enabledRows, 'enabled', (payload) =>
    typeof payload.activatedAt === 'number' && payload.activatedAt >= (staged?.stagedAt ?? Infinity)
    && aiAuditFreshForActivation(artifact.auditCompletedAt, payload.activatedAt)
    && validOperator(payload.operator) && typeof payload.expiryScheduledFunctionId === 'string');
  const blockers: string[] = [];
  const preservationChecks = await Promise.all(preservation.map(async (descriptor) => {
    let rows: { _id: unknown }[];
    if (descriptor.table === 'aiPublicationReleases' && descriptor.index === 'by_release_id') {
      rows = await ctx.db.query('aiPublicationReleases').withIndex('by_release_id', (q) => q.eq('releaseId', descriptor.key)).take(descriptor.count + 1);
    } else if (descriptor.table === 'aiEvidenceAudits' && descriptor.index === 'by_source_and_updated_at') {
      const audited = await ctx.db.query('aiEvidenceAudits').withIndex('by_source_and_updated_at', (q) => q.eq('sourceId', descriptor.key)).take(descriptor.count + 2);
      // Only this exact release's separately validated new audit may be added.
      rows = audited.filter((row) => !expected.sourceIds.some((sourceId) =>
        sourceId === descriptor.key && row.runId === sourceRunId(sourceId)));
    } else {
      rows = await sevenStoriesPreservedRows(ctx, descriptor);
    }
    return rows.length === descriptor.count && await sha256Canonical(sortedRows(rows)) === descriptor.hash;
  }));
  const scheduleChecks = await Promise.all(oldSchedules.map(async (descriptor) => {
    const row = await ctx.db.system.get(descriptor.id as Id<'_scheduled_functions'>);
    return Boolean(row && await sha256Canonical(row) === descriptor.hash);
  }));
  if (!preservationChecks.every(Boolean) || !scheduleChecks.every(Boolean)) {
    blockers.push('Exact previous-eleven dependency/history/audit/schedule preservation drift');
  }
  if (!Number.isFinite(now) || now < expected.capturedAt || !aiPublicationMasterEnabled()
    || (!enabled && !aiAuditFreshForActivation(artifact.auditCompletedAt, now))
    || now >= POWER_OF_PLAY_VISIBILITY_CUTOFF) blockers.push('Exact AI audit is stale or master switch disabled');
  if (stageRows.length && !staged) blockers.push('Stage receipt drift');
  if (enabledRows.length && !enabled) blockers.push('Activation receipt drift');
  if (withdrawnRows.length || expiredRows.length) blockers.push('This immutable release was withdrawn or expired');

  const content = state.contents.length === 1 ? state.contents[0] : null;
  const link = state.links.length === 1 ? state.links[0] : null;
  const allSources = state.sourceRows.flat();
  const sources = expected.sourceIds.map((id) => allSources.find((source) => source.sourceId === id)!).filter(Boolean);
  const configExact = state.configs.length === 1
    && state.configs[0].enabled
    && state.configs[0].generation === expected.expectedGeneration
    && await sha256Canonical(state.configs[0]) === expected.configFullHash;
  if (!configExact) blockers.push('Exact enabled generation-3 config drift');
  const dependenciesExact = Boolean(content && link
    && content._id === expected.contentId
    && content.type === 'lesson'
    && content.clinicalStatus === 'clinical_review'
    && await sha256Canonical(preservedContent(content)) === expected.preservedContentHash
    && link._id === expected.linkId && link.kind === 'lesson'
    && await sha256Canonical(strip(link, ['sourceIds', 'updatedAt'])) === expected.preservedLinkHash
    && (staged
      ? link.updatedAt === staged.stagedAt && equal(link.sourceIds, expected.sourceIds)
      : link.updatedAt === expected.linkUpdatedAt && await sha256Canonical(link) === expected.linkFullHash && equal(link.sourceIds, expected.currentSourceIds))
    && state.sourceRows.every((rows) => rows.length === 1)
    && await sha256Canonical(sortedRows(allSources)) === expected.sourcesFullHash
    && state.reviews.length === expected.reviewsCount
    && await sha256Canonical(sortedRows(state.reviews)) === expected.reviewsFullHash
    && state.media.length === expected.mediaCount
    && state.media.every((row) => row.placeholder === true && row.url === undefined && row.storageId === undefined)
    && await sha256Canonical(sortedRows(state.media)) === expected.mediaFullHash);
  if (!dependenciesExact) blockers.push('Exact content/source/link/review/media preimage drift');
  if (state.assignments.length !== expected.assignmentsCount
    || isRegisteredReleaseContentTarget('lesson', slug)
    || CLINICAL_REVIEW_BATCH_REGISTRY.some((entry) => entry.manifest.items.some((item) => item.slug === slug))) {
    blockers.push('Governed or assigned human-review batch blocks this AI lane');
  }
  const sourceFullExact = (await Promise.all(state.sourceRows.map(async (rows, index) =>
    rows.length === 1 && await sha256Canonical(rows[0]) === expected.sourceRows[index].fullHash))).every(Boolean);
  const sourceEligible = sources.length === expected.sourceIds.length && sources.every((source) => sourceMayEnterAiPublication(source, new Date(now).toISOString().slice(0, 10)));
  if (!sourceFullExact || !sourceEligible) blockers.push('Exact source hash or freshness/eligibility drift');

  const initial = Boolean(content && dependenciesExact && sourceFullExact
    && content.reviewRevision === 2 && content.updatedAt === expected.contentUpdatedAt
    && content.aiPublicationReleaseId === undefined && content.aiPublishedAt === undefined
    && await sha256Canonical(content) === expected.contentFullHash
    && state.releases.length === 0 && state.targetReleases.length === 0
    && state.releaseRuns.length === 0 && state.contentAudits.length === 0
    && state.runRows.every((rows) => rows.length === 0)
    && state.evidenceRows.every((rows) => rows.length === 0)
    && state.contentRowsByRun.every((rows) => rows.length === 0));

  let auditsExact = false;
  let released = false;
  if (content && link && staged && dependenciesExact && sourceFullExact) {
    const payload = await auditPayloads(target, content, link, sources, staged);
    const runs = [payload.contentRun, ...payload.evidence.map((entry) => entry.run)];
    auditsExact = content.reviewRevision === expected.desiredRevision
      && content.updatedAt === staged.stagedAt
      && content.summaryMm === seed.summaryMm && content.summaryEn === seed.summaryEn
      && content.searchText === seed.searchText && equal(content.data, seed.data)
      && await sha256Canonical(aiContentSnapshot(content)) === target.contentSnapshotHash
      && state.releaseRuns.length === runs.length
      && state.runRows.every((rows, index) => rows.length === 1 && equal(stripDb(rows[0]), runs[index]))
      && state.contentAudits.length === 1
      && state.contentRowsByRun[0].length === 1
      && equal(stripDb(state.contentAudits[0]), payload.contentAudit)
      && state.contentRowsByRun.slice(1).every((rows) => rows.length === 0)
      && state.evidenceRows[0].length === 0
      && payload.evidence.every((entry, index) => state.evidenceRows[index + 1].length === 1
        && equal(stripDb(state.evidenceRows[index + 1][0]), entry.audit));
    if (enabled && state.releases.length === 1 && state.targetReleases.length === 1
      && state.releases[0]._id === state.targetReleases[0]._id) {
      const release = releasePayload(target, content, link, sources, staged, enabled);
      released = equal(stripDb(state.releases[0]), release)
        && content.aiPublicationReleaseId === releaseId
        && content.aiPublishedAt === enabled.activatedAt;
    }
  }

  let expiryScheduleExact = enabled === null;
  if (enabled) {
    const schedule = await ctx.db.system.get(enabled.expiryScheduledFunctionId as Id<'_scheduled_functions'>);
    expiryScheduleExact = Boolean(schedule
      && schedule.name === 'aiPowerOfPlayPublication20260910.js:expire'
      && schedule.scheduledTime === POWER_OF_PLAY_VISIBILITY_CUTOFF
      && schedule.state.kind === 'pending'
      && equal(schedule.args, [identity]));
    if (!expiryScheduleExact) blockers.push('Exact reactive expiry schedule missing or drifted');
  }

  const readable = await activeAiParentReadableContent(ctx, now);
  const actualSlugs = readable.rows.map((row) => row.slug).sort();
  const readySlugs = [...previousSlugs].sort();
  const enabledSlugs = [...previousSlugs, slug].sort();
  const previousReadable = readable.complete && equal(actualSlugs, enabled ? enabledSlugs : readySlugs);
  if (!previousReadable) blockers.push('Existing AI previews or exact parent read-back drift');

  let phase: 'ready' | 'staged' | 'enabled' | 'drift' = 'drift';
  if (!blockers.length && initial && !staged && !enabled && !await contentIsAiParentReadable(ctx, content!, now)) phase = 'ready';
  else if (!blockers.length && staged && !enabled && auditsExact && state.releases.length === 0
    && state.targetReleases.length === 0
    && content?.aiPublicationReleaseId === undefined && content?.aiPublishedAt === undefined
    && !await contentIsAiParentReadable(ctx, content!, now)) phase = 'staged';
  else if (!blockers.length && staged && enabled && auditsExact && released
    && await contentIsAiParentReadable(ctx, content!, now)) phase = 'enabled';
  else if (!blockers.length) blockers.push('Exact lifecycle or complete audit coverage mismatch');

  return {
    state,
    target,
    content,
    link,
    sources,
    staged,
    enabled,
    report: {
      ...identity,
      phase,
      activeReleaseCount: readable.rows.length,
      previousReadable,
      expiryScheduleExact,
      reviewRevision: content?.reviewRevision ?? null,
      parentReadable: content ? await contentIsAiParentReadable(ctx, content, now) : false,
      blockers: [...new Set(blockers)].sort(),
    },
  };
}

const reportValidator = v.object({
  ...identityValidators,
  phase: v.union(v.literal('ready'), v.literal('staged'), v.literal('enabled'), v.literal('drift')),
  activeReleaseCount: v.number(),
  previousReadable: v.boolean(),
  expiryScheduleExact: v.boolean(),
  reviewRevision: v.union(v.number(), v.null()),
  parentReadable: v.boolean(),
  blockers: v.array(v.string()),
});

export const preflight = internalQuery({
  args: { ...identityValidators, checkedAt: v.number() },
  returns: reportValidator,
  handler: async (ctx, args) => {
    assertIdentity({ releaseRoot: args.releaseRoot, artifactHash: args.artifactHash, snapshotSha256: args.snapshotSha256 });
    return (await inspect(ctx, args.checkedAt)).report;
  },
});

/** Correct the exact copy and archive AI audits while keeping the item dark. */
export const stage = internalMutation({
  args: { ...identityValidators, operator: v.string(), gitCommit: v.string() },
  returns: reportValidator,
  handler: async (ctx, args) => {
    assertIdentity({ releaseRoot: args.releaseRoot, artifactHash: args.artifactHash, snapshotSha256: args.snapshotSha256 });
    if (!validOperator(args.operator) || !/^[a-f0-9]{40}$/.test(args.gitCommit)) throw new Error('Invalid operator/commit');
    const now = Date.now();
    const before = await inspect(ctx, now);
    if (before.report.phase === 'enabled' || before.report.phase === 'staged') return before.report;
    assertFresh(now);
    if (before.report.phase !== 'ready' || !before.content || !before.link) {
      throw new Error(`Power-of-play stage blocked: ${before.report.blockers.join('; ')}`);
    }
    const staged = { operator: args.operator, gitCommit: args.gitCommit, stagedAt: now };
    const desiredLink = { ...before.link, sourceIds: [...expected.sourceIds], updatedAt: now };
    const desired = {
      ...before.content,
      summaryMm: seed.summaryMm,
      summaryEn: seed.summaryEn,
      data: structuredClone(seed.data),
      searchText: seed.searchText,
      reviewRevision: expected.desiredRevision,
      updatedAt: now,
    };
    if (await sha256Canonical(aiContentSnapshot(desired)) !== before.target.contentSnapshotHash
      || await sha256Canonical(aiEvidenceLinkSnapshot(desiredLink)) !== before.target.evidenceLinkSnapshotHash) {
      throw new Error('Audited desired content/link hash mismatch');
    }
    for (const source of before.sources) {
      const sourceArtifact = before.target.sources.find((entry) => entry.sourceId === source.sourceId);
      if (!sourceArtifact || !sourceMayEnterAiPublication(source, new Date(now).toISOString().slice(0, 10))
        || await sha256Canonical(aiEvidenceSnapshot(source)) !== sourceArtifact.sourceSnapshotHash) {
        throw new Error('Audited source scope/freshness mismatch');
      }
    }
    await ctx.db.patch(before.content._id, {
      summaryMm: seed.summaryMm,
      summaryEn: seed.summaryEn,
      data: seed.data,
      searchText: seed.searchText,
      reviewRevision: expected.desiredRevision,
      updatedAt: now,
    });
    await ctx.db.patch(before.link._id, { sourceIds: [...expected.sourceIds], updatedAt: now });
    const corrected = { ...desired } as Doc<'libraryContent'>;
    const payload = await auditPayloads(before.target, corrected, desiredLink, before.sources, staged);
    await ctx.db.insert('aiAuditRuns', payload.contentRun);
    await ctx.db.insert('aiContentAudits', payload.contentAudit);
    for (const entry of payload.evidence) {
      await ctx.db.insert('aiAuditRuns', entry.run);
      await ctx.db.insert('aiEvidenceAudits', entry.audit);
    }
    await logAudit(ctx, null, action('staged'), 'aiPublicationReleases', root, 'staged', {
      result: 'ok', before: JSON.stringify(identity), after: JSON.stringify({ identity, ...staged }),
    });
    const after = await inspect(ctx, now);
    if (after.report.phase !== 'staged' || after.report.parentReadable || after.report.activeReleaseCount !== 11) {
      throw new Error('Stage postflight failed; transaction rolls back');
    }
    return after.report;
  },
});

/** Add the one immutable release and pointer atomically; human review stays untouched. */
export const activate = internalMutation({
  args: { ...identityValidators, expectedGeneration: v.literal(3), operator: v.string() },
  returns: reportValidator,
  handler: async (ctx, args) => {
    assertIdentity({ releaseRoot: args.releaseRoot, artifactHash: args.artifactHash, snapshotSha256: args.snapshotSha256 });
    if (args.expectedGeneration !== expected.expectedGeneration || !validOperator(args.operator)) throw new Error('Invalid generation/operator');
    const now = Date.now();
    const before = await inspect(ctx, now);
    if (before.report.phase === 'enabled') return before.report;
    assertFresh(now);
    if (before.report.phase !== 'staged' || !before.staged || !before.content || !before.link) {
      throw new Error(`Power-of-play activation blocked: ${before.report.blockers.join('; ')}`);
    }
    const expiryScheduledFunctionId = await ctx.scheduler.runAt(
      POWER_OF_PLAY_VISIBILITY_CUTOFF,
      internal.aiPowerOfPlayPublication20260910.expire,
      identity,
    );
    const enabled = { operator: args.operator, activatedAt: now, expiryScheduledFunctionId: String(expiryScheduledFunctionId) };
    const release = releasePayload(before.target, before.content, before.link, before.sources, before.staged, enabled);
    await ctx.db.insert('aiPublicationReleases', release);
    await ctx.db.patch(before.content._id, { aiPublicationReleaseId: releaseId, aiPublishedAt: now });
    await logAudit(ctx, null, action('enabled'), 'aiPublicationReleases', root, 'enabled', {
      result: 'ok', before: JSON.stringify(identity), after: JSON.stringify({ identity, ...enabled }),
    });
    const after = await inspect(ctx, now);
    if (after.report.phase !== 'enabled' || !after.report.parentReadable || after.report.activeReleaseCount !== 12) {
      throw new Error('Activation exact twelve-item readback failed; transaction rolls back');
    }
    return after.report;
  },
});

export const postflight = internalQuery({
  args: { ...identityValidators, checkedAt: v.number() },
  returns: reportValidator,
  handler: async (ctx, args) => {
    assertIdentity({ releaseRoot: args.releaseRoot, artifactHash: args.artifactHash, snapshotSha256: args.snapshotSha256 });
    return (await inspect(ctx, args.checkedAt)).report;
  },
});

async function terminate(ctx: MutationCtx, reason: 'expired' | 'withdrawn', now: number) {
  const releases = await ctx.db.query('aiPublicationReleases')
    .withIndex('by_release_id', (q) => q.eq('releaseId', releaseId)).take(2);
  if (releases.length > 1) throw new Error('Duplicate exact power-of-play release');
  const release = releases[0];
  if (release && (release.contentId !== expected.contentId || release.contentSlug !== slug
    || release.contentType !== 'lesson' || release.auditArtifactHash !== artifactHash
    || release.policyVersion !== policyVersion || release.targetKey !== aiPublicationTargetKey('lesson', slug))) {
    throw new Error('Withdrawal release identity drift');
  }
  let revoked = false;
  let pointersCleared = false;
  if (release?.status === 'active') {
    await ctx.db.patch(release._id, {
      status: 'revoked', revokedAt: now,
      revokeReason: `Exact power-of-play AI release ${reason}; no human decision changed.`,
    });
    revoked = true;
  }
  if (release) {
    const content = await ctx.db.get(release.contentId);
    if (content?.aiPublicationReleaseId === releaseId) {
      await ctx.db.patch(content._id, { aiPublicationReleaseId: undefined, aiPublishedAt: undefined });
      pointersCleared = true;
    }
  }
  const rows = await receipt(ctx, reason);
  if (rows.length > 1) throw new Error('Duplicate terminal receipt');
  if (!rows.length) await logAudit(ctx, null, action(reason), 'aiPublicationReleases', root, reason, {
    result: 'ok', before: JSON.stringify(identity), after: JSON.stringify({ identity, at: now, revoked, pointersCleared }),
  });
  return { revoked, pointersCleared };
}

const terminalValidator = v.object({ revoked: v.boolean(), pointersCleared: v.boolean() });
export const expire = internalMutation({
  args: identityValidators,
  returns: terminalValidator,
  handler: async (ctx, args) => {
    assertIdentity(args);
    if (Date.now() < POWER_OF_PLAY_VISIBILITY_CUTOFF) throw new Error('Expiry cannot run early');
    return terminate(ctx, 'expired', Date.now());
  },
});
export const withdraw = internalMutation({
  args: identityValidators,
  returns: terminalValidator,
  handler: async (ctx, args) => {
    assertIdentity(args);
    return terminate(ctx, 'withdrawn', Date.now());
  },
});
