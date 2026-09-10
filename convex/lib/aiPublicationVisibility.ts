import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import {
  aiAuditIsCurrent,
  aiPublicationMasterEnabled,
  aiPublicationTargetKey,
  AI_PUBLICATION_CONFIG_KEY,
  AI_PUBLICATION_MAX_ACTIVE_RELEASES,
  AI_PUBLICATION_MAX_RELEASE_DAYS,
  AI_PUBLICATION_MAX_SOURCES_PER_RELEASE,
  AI_PUBLICATION_POLICY_VERSION,
  arraysEqual,
  isAiPublicationTarget,
  isSha256Hex,
  sourceMayEnterAiPublication,
} from './aiPublicationPolicy';
import {
  aiContentSnapshot,
  aiEvidenceLinkSnapshot,
  aiEvidenceSnapshot,
  sha256Canonical,
} from './aiAuditHash';
import { AI_PUBLICATION_AUDIT_ARTIFACT } from './aiPublicationAuditArtifact';
import {
  AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
  AI_PUBLICATION_RELEASE_ID,
} from './aiPublicationReleaseData';
import { EARLY_MATH_AUDIT_ARTIFACT, EARLY_MATH_AUDIT_ARTIFACT_HASH } from './aiEarlyMathPublication20260910Artifact';
import { EARLY_MATH_RELEASE_ROOT, EARLY_MATH_RELEASE_DAYS } from './aiEarlyMathPublication20260910Data';
import { TWO_STORIES_ARTIFACT, TWO_STORIES_ARTIFACT_HASH } from './aiTwoStoriesPublication20260910Artifact';
import { TWO_STORIES_RELEASE_ROOT, TWO_STORIES_RELEASE_DAYS } from './aiTwoStoriesPublication20260910Data';
import type { AiPublicationAuditTargetArtifact } from './aiPublicationAuditArtifact';
import { SEVEN_STORIES_ARTIFACT, SEVEN_STORIES_ARTIFACT_HASH } from './aiSevenStoriesPublication20260910Artifact';
import { SEVEN_STORIES_RELEASE_ROOT, SEVEN_STORIES_RELEASE_DAYS, SEVEN_STORIES_POLICY_VERSION, SEVEN_STORIES_SLUGS } from './aiSevenStoriesPublication20260910Data';
import { READING_TOGETHER_ARTIFACT, READING_TOGETHER_ARTIFACT_HASH } from './aiReadingTogetherPublication20260910Artifact';
import {
  READING_TOGETHER_POLICY_VERSION,
  READING_TOGETHER_RELEASE_DAYS,
  READING_TOGETHER_RELEASE_ROOT,
  READING_TOGETHER_SLUG,
} from './aiReadingTogetherPublication20260910Data';
import { todayIsoUtc } from './evidenceFreshness';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

type AuditArtifact = Omit<typeof AI_PUBLICATION_AUDIT_ARTIFACT, 'artifactId' | 'releaseId' | 'model' | 'modelVersion' | 'auditedWorkspaceBaseCommit' | 'auditStartedAt' | 'auditCompletedAt' | 'summary' | 'limitations' | 'targets'> & {
  artifactId: string; releaseId: string; model: string; modelVersion: string;
  auditedWorkspaceBaseCommit: string; auditStartedAt: number; auditCompletedAt: number;
  summary: string; limitations: readonly string[]; targets: readonly AiPublicationAuditTargetArtifact[];
};

export type SevenStoryAuditSourceArtifact = {
  sourceId: string; sourceSnapshotHash: string; sourceUrl: string; claimScope: string;
  urlsChecked: readonly string[]; evidenceFindings: readonly string[]; limitations: readonly string[];
};
export type Schema2AuditTargetArtifact = {
  type: 'lesson' | 'story'; slug: string; contentSnapshotHash: string; evidenceLinkSnapshotHash: string;
  verdict: 'pass'; sources: readonly SevenStoryAuditSourceArtifact[];
  mediaSnapshotHash: string; mediaCount: number;
  independentAgentResults: AiPublicationAuditTargetArtifact['independentAgentResults'];
  contentChecks: readonly string[]; limitations: readonly string[];
};
export type Schema2AuditArtifact = Omit<AuditArtifact, 'schemaVersion' | 'policyVersion' | 'targets'> & {
  schemaVersion: 2; policyVersion: string; targets: readonly Schema2AuditTargetArtifact[];
};
type RegisteredArtifact =
  | { kind: 'legacy'; artifact: AuditArtifact; hash: string; releaseDays: number }
  | { kind: 'seven_stories'; artifact: Schema2AuditArtifact; hash: string; releaseDays: number }
  | { kind: 'reading_together'; artifact: Schema2AuditArtifact; hash: string; releaseDays: number };
const SEVEN_STORY_RUNTIME_SLUGS = new Set<string>([
  'st_little_seed', 'st_ba_ba_sounds', 'st_when_i_feel_angry', 'st_taking_turns',
  'st_goodnight_moon_friend', 'st_visit_to_doctor', 'st_sharing_mango',
]);
const SEVEN_STORY_MAX_SOURCES = 3;
const COMBINED_ACTIVE_LIMIT = AI_PUBLICATION_MAX_ACTIVE_RELEASES + 7 + 1;
function isSevenStoryTarget(type: string, slug: string): boolean {
  return type === 'story' && SEVEN_STORY_RUNTIME_SLUGS.has(slug);
}
function isReadingTogetherTarget(type: string, slug: string): boolean {
  return type === 'lesson' && slug === READING_TOGETHER_SLUG;
}
function sevenStoryArtifactHasExactScope(artifact: Schema2AuditArtifact): boolean {
  return artifact.schemaVersion === 2 && artifact.policyVersion === SEVEN_STORIES_POLICY_VERSION
    && artifact.releaseId === SEVEN_STORIES_RELEASE_ROOT
    && SEVEN_STORIES_SLUGS.length === 7 && new Set(SEVEN_STORIES_SLUGS).size === 7
    && SEVEN_STORIES_SLUGS.every(slug => SEVEN_STORY_RUNTIME_SLUGS.has(slug))
    && artifact.targets.length === 7 && new Set(artifact.targets.map(t => t.slug)).size === 7
    && artifact.targets.every(target => isSevenStoryTarget(target.type, target.slug)
      && target.verdict === 'pass' && isSha256Hex(target.contentSnapshotHash)
      && isSha256Hex(target.evidenceLinkSnapshotHash)
      && target.mediaCount === 3 && isSha256Hex(target.mediaSnapshotHash)
      && target.sources.length >= 2 && target.sources.length <= SEVEN_STORY_MAX_SOURCES
      && new Set(target.sources.map(source => source.sourceId)).size === target.sources.length
      && target.sources.every(source => isSha256Hex(source.sourceSnapshotHash)
        && source.urlsChecked.length > 0 && source.urlsChecked.length <= 10
        && source.urlsChecked.includes(source.sourceUrl)));
}
function readingTogetherArtifactHasExactScope(artifact: Schema2AuditArtifact): boolean {
  const target = artifact.targets[0];
  return artifact.schemaVersion === 2
    && artifact.policyVersion === READING_TOGETHER_POLICY_VERSION
    && artifact.releaseId === READING_TOGETHER_RELEASE_ROOT
    && artifact.targets.length === 1
    && Boolean(target)
    && isReadingTogetherTarget(target.type, target.slug)
    && target.verdict === 'pass'
    && isSha256Hex(target.contentSnapshotHash)
    && isSha256Hex(target.evidenceLinkSnapshotHash)
    && target.mediaCount === 1
    && isSha256Hex(target.mediaSnapshotHash)
    && target.sources.length === 3
    && new Set(target.sources.map(source => source.sourceId)).size === 3
    && target.sources.every(source => isSha256Hex(source.sourceSnapshotHash)
      && source.urlsChecked.length > 0 && source.urlsChecked.length <= 10
      && source.urlsChecked.includes(source.sourceUrl))
    && target.independentAgentResults.length === 2
    && target.independentAgentResults.every(result => result.verdict === 'pass')
    && target.independentAgentResults.some(result => result.role === 'source_research')
    && target.independentAgentResults.some(result => result.role === 'semantic_audit');
}

/** Explicit compiled registry: an arbitrary database hash cannot authorize publication. */
export function registeredAiPublicationArtifact(releaseId: string, artifactHash: string): RegisteredArtifact | null {
  const entries = [
    { artifact: AI_PUBLICATION_AUDIT_ARTIFACT, hash: AI_PUBLICATION_AUDIT_ARTIFACT_HASH, root: AI_PUBLICATION_RELEASE_ID, releaseDays: AI_PUBLICATION_MAX_RELEASE_DAYS },
    { artifact: EARLY_MATH_AUDIT_ARTIFACT, hash: EARLY_MATH_AUDIT_ARTIFACT_HASH, root: EARLY_MATH_RELEASE_ROOT, releaseDays: EARLY_MATH_RELEASE_DAYS },
    { artifact: TWO_STORIES_ARTIFACT, hash: TWO_STORIES_ARTIFACT_HASH, root: TWO_STORIES_RELEASE_ROOT, releaseDays: TWO_STORIES_RELEASE_DAYS },
  ];
  const legacy = entries.find((entry) => entry.hash === artifactHash && entry.artifact.targets.some(
    (target) => releaseId === `${entry.root}:${target.type}:${target.slug}`,
  ));
  if (legacy) return { ...legacy, kind: 'legacy' };
  const sevenArtifact: Schema2AuditArtifact = SEVEN_STORIES_ARTIFACT;
  if (artifactHash === SEVEN_STORIES_ARTIFACT_HASH && sevenStoryArtifactHasExactScope(sevenArtifact)
    && sevenArtifact.targets.some(target => releaseId === `${SEVEN_STORIES_RELEASE_ROOT}:story:${target.slug}`)) {
    return { kind: 'seven_stories', artifact: sevenArtifact, hash: SEVEN_STORIES_ARTIFACT_HASH, releaseDays: SEVEN_STORIES_RELEASE_DAYS };
  }
  const readingArtifact: Schema2AuditArtifact = READING_TOGETHER_ARTIFACT;
  if (artifactHash === READING_TOGETHER_ARTIFACT_HASH && readingTogetherArtifactHasExactScope(readingArtifact)
    && releaseId === `${READING_TOGETHER_RELEASE_ROOT}:lesson:${READING_TOGETHER_SLUG}`) {
    return { kind: 'reading_together', artifact: readingArtifact, hash: READING_TOGETHER_ARTIFACT_HASH, releaseDays: READING_TOGETHER_RELEASE_DAYS };
  }
  return null;
}

type ActiveControl = {
  complete: boolean;
  releases: Doc<'aiPublicationReleases'>[];
};

/** Missing, duplicate, disabled or over-budget control state always fails off. */
export async function activeAiPublicationControl(ctx: DatabaseContext): Promise<ActiveControl> {
  if (!aiPublicationMasterEnabled()) return { complete: true, releases: [] };
  const [configs, releases] = await Promise.all([
    ctx.db
      .query('aiPublicationConfig')
      .withIndex('by_key', (q) => q.eq('key', AI_PUBLICATION_CONFIG_KEY))
      .take(2),
    ctx.db
      .query('aiPublicationReleases')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .take(COMBINED_ACTIVE_LIMIT + 1),
  ]);
  if (configs.length !== 1 || !configs[0].enabled) return { complete: configs.length <= 1, releases: [] };
  if (releases.length > COMBINED_ACTIVE_LIMIT) return { complete: false, releases: [] };
  const keys = new Set<string>();
  const releaseIds = new Set<string>();
  for (const release of releases) {
    const expectedKey = aiPublicationTargetKey(release.contentType, release.contentSlug);
    if (
      !(isAiPublicationTarget(release.contentType, release.contentSlug)
        || isSevenStoryTarget(release.contentType, release.contentSlug)
        || isReadingTogetherTarget(release.contentType, release.contentSlug))
      || release.targetKey !== expectedKey
      || keys.has(expectedKey)
      || typeof release.releaseId !== 'string' || release.releaseId.length === 0
      || releaseIds.has(release.releaseId)
    ) {
      return { complete: false, releases: [] };
    }
    keys.add(expectedKey);
    releaseIds.add(release.releaseId);
  }
  if (releases.filter(r => isAiPublicationTarget(r.contentType, r.contentSlug)).length > AI_PUBLICATION_MAX_ACTIVE_RELEASES
    || releases.filter(r => isSevenStoryTarget(r.contentType, r.contentSlug)).length > 7
    || releases.filter(r => isReadingTogetherTarget(r.contentType, r.contentSlug)).length > 1) return { complete: false, releases: [] };
  return { complete: true, releases };
}

async function matchingCompletedRun(
  ctx: DatabaseContext,
  runId: string,
  release: Doc<'aiPublicationReleases'>,
  expectedOutputHash: string,
  expectedSummary: string,
  artifact: AuditArtifact | Schema2AuditArtifact,
): Promise<boolean> {
  const rows = await ctx.db
    .query('aiAuditRuns')
    .withIndex('by_run_id', (q) => q.eq('runId', runId))
    .take(2);
  return rows.length === 1
    && rows[0].status === 'completed'
    && rows[0].releaseId === release.releaseId
    && rows[0].provider === artifact.provider
    && rows[0].model === artifact.model
    && rows[0].modelVersion === artifact.modelVersion
    && rows[0].policyVersion === artifact.policyVersion
    && rows[0].gitCommit === release.gitCommit
    && rows[0].targetCount === 1
    && rows[0].summary === expectedSummary
    && arraysEqual(rows[0].limitations, artifact.limitations)
    && rows[0].startedAt === artifact.auditStartedAt
    && rows[0].completedAt === artifact.auditCompletedAt
    && rows[0].outputHash === expectedOutputHash;
}

export async function aiReleaseMatchesCurrentState(
  ctx: DatabaseContext,
  content: Doc<'libraryContent'>,
  release: Doc<'aiPublicationReleases'>,
  now: number,
  todayIso: string,
): Promise<boolean> {
  const registered = registeredAiPublicationArtifact(release.releaseId, release.auditArtifactHash);
  if (!registered) return false;
  if (registered.kind !== 'legacy') return schema2ReleaseMatchesCurrentState(ctx, content, release, now, todayIso, registered);
  const { artifact, releaseDays } = registered;
  const artifactHash = await sha256Canonical(artifact);
  const artifactTarget = artifact.targets.find(
    (target) => target.type === content.type && target.slug === content.slug,
  );
  if (
    artifactHash !== registered.hash
    || !artifactTarget
    || release.contentSnapshotHash !== artifactTarget.contentSnapshotHash
    || release.evidenceLinkSnapshotHash !== artifactTarget.evidenceLinkSnapshotHash
    || release.sourceSnapshots.length !== 1
    || release.sourceSnapshots[0].sourceId !== artifactTarget.sourceId
    || release.sourceSnapshots[0].sourceSnapshotHash !== artifactTarget.sourceSnapshotHash
    || release.status !== 'active'
    || release.contentId !== content._id
    || release.contentType !== content.type
    || release.contentSlug !== content.slug
    || release.targetKey !== aiPublicationTargetKey(content.type, content.slug)
    || release.auditArtifactHash !== artifactHash
    || release.policyVersion !== AI_PUBLICATION_POLICY_VERSION
    || content.clinicalStatus !== 'clinical_review'
    || content.aiPublicationReleaseId !== release.releaseId
    || content.aiPublishedAt !== release.createdAt
    || (content.reviewRevision ?? 1) !== release.reviewRevision
    || content.updatedAt !== release.contentUpdatedAt
    || !isSha256Hex(release.contentSnapshotHash)
    || !isSha256Hex(release.evidenceLinkSnapshotHash)
    || release.expiresAt < now
    || release.expiresAt > artifact.auditCompletedAt + releaseDays * 86_400_000
    || release.expiresAt - release.createdAt > AI_PUBLICATION_MAX_RELEASE_DAYS * 86_400_000
  ) return false;

  const targetArtifactHash = await sha256Canonical(artifactTarget);
  const expectedRunOutputHash = await sha256Canonical({ artifactHash, targetArtifactHash });
  const expectedContentOutputHash = await sha256Canonical({
    artifactHash,
    targetArtifactHash,
    kind: 'content',
  });
  const expectedEvidenceOutputHash = await sha256Canonical({
    artifactHash,
    targetArtifactHash,
    kind: 'evidence',
  });
  const expectedNextAuditDate = new Date(
    artifact.auditCompletedAt
    + (releaseDays - 1) * 86_400_000,
  ).toISOString().slice(0, 10);
  const expectedLimitations = [...artifactTarget.limitations, ...artifact.limitations];
  const expectedRunSummary = `${artifact.summary} Target: ${content.type}:${content.slug}.`;

  const contentHash = await sha256Canonical(aiContentSnapshot(content));
  if (contentHash !== release.contentSnapshotHash) return false;

  const link = await ctx.db
    .query('evidenceLinks')
    .withIndex('by_kind_slug', (q) => q.eq('kind', content.type).eq('slug', content.slug))
    .unique();
  if (
    !link
    || link.updatedAt !== release.evidenceLinkUpdatedAt
    || link.sourceIds.length < 1
    || link.sourceIds.length > AI_PUBLICATION_MAX_SOURCES_PER_RELEASE
    || new Set(link.sourceIds).size !== link.sourceIds.length
    || !arraysEqual(link.sourceIds, release.sourceSnapshots.map((snapshot) => snapshot.sourceId))
  ) return false;
  const linkHash = await sha256Canonical(aiEvidenceLinkSnapshot(link));
  if (linkHash !== release.evidenceLinkSnapshotHash) return false;

  const contentAudits = await ctx.db
    .query('aiContentAudits')
    .withIndex('by_run_id', (q) => q.eq('runId', release.contentAuditRunId))
    .take(2);
  const contentAudit = contentAudits.length === 1 && (
    contentAudits[0].contentSlug === content.slug
    && contentAudits[0].contentType === content.type
    && contentAudits[0].reviewRevision === release.reviewRevision
    && contentAudits[0].contentUpdatedAt === release.contentUpdatedAt
    && contentAudits[0].verdict === 'pass'
    && contentAudits[0].contentSnapshotHash === release.contentSnapshotHash
    && contentAudits[0].evidenceLinkUpdatedAt === release.evidenceLinkUpdatedAt
    && contentAudits[0].evidenceLinkSnapshotHash === release.evidenceLinkSnapshotHash
    && arraysEqual(contentAudits[0].sourceIds, link.sourceIds)
    && arraysEqual(contentAudits[0].checks, artifactTarget.contentChecks)
    && arraysEqual(contentAudits[0].limitations, expectedLimitations)
    && contentAudits[0].auditedAt === artifact.auditCompletedAt
    && contentAudits[0].nextAuditDate === expectedNextAuditDate
    && contentAudits[0].outputHash === expectedContentOutputHash
    && aiAuditIsCurrent(contentAudits[0].auditedAt, contentAudits[0].nextAuditDate, todayIso, now)
  ) ? contentAudits[0] : null;
  if (!contentAudit || !(await matchingCompletedRun(
    ctx,
    contentAudit.runId,
    release,
    expectedRunOutputHash,
    expectedRunSummary,
    artifact,
  ))) return false;

  const sourceResults = await Promise.all(release.sourceSnapshots.map(async (snapshot) => {
    if (!isSha256Hex(snapshot.sourceSnapshotHash)) return false;
    const source = await ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', snapshot.sourceId))
      .unique();
    if (
      !source
      || source.updatedAt !== snapshot.sourceUpdatedAt
      || !sourceMayEnterAiPublication(source, todayIso)
    ) return false;
    if (await sha256Canonical(aiEvidenceSnapshot(source)) !== snapshot.sourceSnapshotHash) return false;
    const audits = await ctx.db
      .query('aiEvidenceAudits')
      .withIndex('by_run_id', (q) => q.eq('runId', snapshot.evidenceAuditRunId))
      .take(2);
    const audit = audits.length === 1
      && audits[0].sourceId === snapshot.sourceId
      && audits[0].sourceUpdatedAt === snapshot.sourceUpdatedAt
      && audits[0].verdict === 'pass'
      && audits[0].sourceSnapshotHash === snapshot.sourceSnapshotHash
      && audits[0].claimScope === artifactTarget.claimScope
      && arraysEqual(audits[0].urlsChecked, [artifactTarget.sourceUrl])
      && arraysEqual(audits[0].findings, artifactTarget.evidenceFindings)
      && arraysEqual(audits[0].limitations, expectedLimitations)
      && audits[0].auditedAt === artifact.auditCompletedAt
      && audits[0].nextAuditDate === expectedNextAuditDate
      && audits[0].outputHash === expectedEvidenceOutputHash
      && aiAuditIsCurrent(audits[0].auditedAt, audits[0].nextAuditDate, todayIso, now)
      ? audits[0]
      : null;
    return Boolean(audit && await matchingCompletedRun(
      ctx,
      audit.runId,
      release,
      expectedRunOutputHash,
      expectedRunSummary,
      artifact,
    ));
  }));
  return sourceResults.every(Boolean);
}

/** Schema-2 lanes have an exact compiled artifact and one run per source.
 * They never consume contentReviews or synthesize a human approval. */
async function schema2ReleaseMatchesCurrentState(
  ctx: DatabaseContext,
  content: Doc<'libraryContent'>,
  release: Doc<'aiPublicationReleases'>,
  now: number,
  todayIso: string,
  registered: Extract<RegisteredArtifact, { kind: 'seven_stories' | 'reading_together' }>,
): Promise<boolean> {
  const { artifact, releaseDays } = registered;
  const artifactHash = await sha256Canonical(artifact);
  const target = artifact.targets.find(t => t.type === content.type && t.slug === content.slug);
  const exactScope = registered.kind === 'seven_stories'
    ? sevenStoryArtifactHasExactScope(artifact)
    : readingTogetherArtifactHasExactScope(artifact);
  const exactTarget = registered.kind === 'seven_stories'
    ? isSevenStoryTarget(content.type, content.slug)
    : isReadingTogetherTarget(content.type, content.slug);
  const expectedRevision = registered.kind === 'seven_stories' ? 3 : 4;
  if (!target || !exactScope || artifactHash !== registered.hash
    || releaseDays < 1 || releaseDays > AI_PUBLICATION_MAX_RELEASE_DAYS
    || ![now, release.createdAt, release.expiresAt, artifact.auditStartedAt, artifact.auditCompletedAt].every(Number.isFinite)
    || artifact.auditStartedAt > artifact.auditCompletedAt || artifact.auditCompletedAt > now
    || !/^[a-f0-9]{40}$/.test(release.gitCommit)
    || !exactTarget
    || content.clinicalStatus !== 'clinical_review' || content.reviewRevision !== expectedRevision
    || content.reviewerId !== undefined || content.reviewerQualification !== undefined
    || content.reviewerDisplayName !== undefined || content.reviewScope !== undefined
    || content.reviewedAt !== undefined || content.nextReviewAt !== undefined || content.reviewNote !== undefined
    || release.status !== 'active' || release.contentId !== content._id
    || release.contentType !== target.type || release.contentSlug !== content.slug
    || release.targetKey !== aiPublicationTargetKey(target.type, content.slug)
    || release.policyVersion !== artifact.policyVersion
    || content.aiPublicationReleaseId !== release.releaseId || content.aiPublishedAt !== release.createdAt
    || release.reviewRevision !== expectedRevision || release.contentUpdatedAt !== content.updatedAt
    || release.contentSnapshotHash !== target.contentSnapshotHash
    || release.evidenceLinkSnapshotHash !== target.evidenceLinkSnapshotHash
    || release.sourceSnapshots.length !== target.sources.length
    || !arraysEqual(release.sourceSnapshots.map(s => s.sourceId), target.sources.map(s => s.sourceId))
    || new Set(release.sourceSnapshots.map(s => s.evidenceAuditRunId)).size !== target.sources.length
    || release.sourceSnapshots.some(s => s.evidenceAuditRunId === release.contentAuditRunId)
    || release.expiresAt < now || release.createdAt > now
    || release.expiresAt > artifact.auditCompletedAt + releaseDays * 86_400_000
    || release.expiresAt - release.createdAt > releaseDays * 86_400_000
    || release.expiresAt <= release.createdAt
  ) return false;
  if (await sha256Canonical(aiContentSnapshot(content)) !== target.contentSnapshotHash) return false;
  const media = await ctx.db.query('libraryMedia')
    .withIndex('by_content', q => q.eq('contentSlug', content.slug)).take(101);
  if (media.length > 100 || media.length !== target.mediaCount
    || media.some(row => row.placeholder !== true || row.url !== undefined || row.storageId !== undefined)
    || await sha256Canonical([...media].sort((a, b) => String(a._id).localeCompare(String(b._id)))) !== target.mediaSnapshotHash) return false;
  const linkRows = await ctx.db.query('evidenceLinks')
    .withIndex('by_slug', q => q.eq('slug', content.slug)).take(2);
  const link = linkRows.length === 1 ? linkRows[0] : null;
  if (!link || link.kind !== target.type || link.updatedAt !== release.evidenceLinkUpdatedAt
    || !arraysEqual(link.sourceIds, target.sources.map(s => s.sourceId))
    || await sha256Canonical(aiEvidenceLinkSnapshot(link)) !== target.evidenceLinkSnapshotHash) return false;

  const targetArtifactHash = await sha256Canonical(target);
  const expectedRunOutputHash = await sha256Canonical({ artifactHash, targetArtifactHash });
  const expectedContentOutputHash = await sha256Canonical({ artifactHash, targetArtifactHash, kind: 'content' });
  const summary = `${artifact.summary} Target: ${target.type}:${content.slug}.`;
  const limitations = [...target.limitations, ...artifact.limitations];
  const nextAuditDate = new Date(artifact.auditCompletedAt + (releaseDays - 1) * 86_400_000).toISOString().slice(0, 10);
  const contentAudits = await ctx.db.query('aiContentAudits')
    .withIndex('by_run_id', q => q.eq('runId', release.contentAuditRunId)).take(2);
  const contentAudit = contentAudits.length === 1 ? contentAudits[0] : null;
  if (!contentAudit || contentAudit.contentSlug !== content.slug || contentAudit.contentType !== target.type
    || contentAudit.reviewRevision !== expectedRevision || contentAudit.contentUpdatedAt !== content.updatedAt
    || contentAudit.contentSnapshotHash !== target.contentSnapshotHash || contentAudit.verdict !== 'pass'
    || contentAudit.evidenceLinkUpdatedAt !== link.updatedAt || contentAudit.evidenceLinkSnapshotHash !== target.evidenceLinkSnapshotHash
    || !arraysEqual(contentAudit.sourceIds, link.sourceIds) || !arraysEqual(contentAudit.checks, target.contentChecks)
    || !arraysEqual(contentAudit.limitations, limitations) || contentAudit.auditedAt !== artifact.auditCompletedAt
    || contentAudit.nextAuditDate !== nextAuditDate || contentAudit.outputHash !== expectedContentOutputHash
    || !aiAuditIsCurrent(contentAudit.auditedAt, contentAudit.nextAuditDate, todayIso, now)
    || !await matchingCompletedRun(ctx, release.contentAuditRunId, release, expectedRunOutputHash, summary, artifact)) return false;

  const sourceChecks = await Promise.all(target.sources.map(async (expectedSource, index) => {
    const snapshot = release.sourceSnapshots[index];
    if (snapshot.sourceSnapshotHash !== expectedSource.sourceSnapshotHash) return false;
    const [sources, audits] = await Promise.all([
      ctx.db.query('evidenceSources').withIndex('by_source_id', q => q.eq('sourceId', expectedSource.sourceId)).take(2),
      ctx.db.query('aiEvidenceAudits').withIndex('by_run_id', q => q.eq('runId', snapshot.evidenceAuditRunId)).take(2),
    ]);
    const source = sources.length === 1 ? sources[0] : null;
    const audit = audits.length === 1 ? audits[0] : null;
    if (!source || source.updatedAt !== snapshot.sourceUpdatedAt || source.url !== expectedSource.sourceUrl
      || !sourceMayEnterAiPublication(source, todayIso)
      || await sha256Canonical(aiEvidenceSnapshot(source)) !== expectedSource.sourceSnapshotHash) return false;
    const sourceId = expectedSource.sourceId;
    const runOutputHash = await sha256Canonical({ artifactHash, targetArtifactHash, sourceId });
    const outputHash = await sha256Canonical({ artifactHash, targetArtifactHash, kind: 'evidence', sourceId });
    return Boolean(audit && audit.sourceId === sourceId && audit.sourceUpdatedAt === source.updatedAt
      && audit.sourceSnapshotHash === expectedSource.sourceSnapshotHash && audit.verdict === 'pass'
      && audit.claimScope === expectedSource.claimScope && arraysEqual(audit.urlsChecked, expectedSource.urlsChecked)
      && arraysEqual(audit.findings, expectedSource.evidenceFindings)
      && arraysEqual(audit.limitations, [...expectedSource.limitations, ...limitations])
      && audit.auditedAt === artifact.auditCompletedAt && audit.nextAuditDate === nextAuditDate
      && audit.outputHash === outputHash && aiAuditIsCurrent(audit.auditedAt, audit.nextAuditDate, todayIso, now)
      && await matchingCompletedRun(ctx, snapshot.evidenceAuditRunId, release, runOutputHash, `${summary} Source: ${sourceId}.`, artifact));
  }));
  return sourceChecks.every(Boolean);
}

export async function contentIsAiParentReadable(
  ctx: DatabaseContext,
  content: Doc<'libraryContent'>,
  now = Date.now(),
  todayIso = todayIsoUtc(new Date(now)),
): Promise<boolean> {
  if (!isAiPublicationTarget(content.type, content.slug)
    && !isSevenStoryTarget(content.type, content.slug)
    && !isReadingTogetherTarget(content.type, content.slug)) return false;
  const control = await activeAiPublicationControl(ctx);
  if (!control.complete) return false;
  const release = control.releases.find(
    (candidate) => candidate.targetKey === aiPublicationTargetKey(content.type, content.slug),
  );
  return release ? await aiReleaseMatchesCurrentState(ctx, content, release, now, todayIso) : false;
}

/** Resolve only the bounded legacy-three, seven stories and one reading lesson. */
export async function activeAiParentReadableContent(
  ctx: DatabaseContext,
  now = Date.now(),
): Promise<{ complete: boolean; rows: Doc<'libraryContent'>[] }> {
  const control = await activeAiPublicationControl(ctx);
  if (!control.complete) return { complete: false, rows: [] };
  const rows = await Promise.all(control.releases.map(async (release) => {
    const content = await ctx.db.get(release.contentId);
    if (!content) return null;
    return await aiReleaseMatchesCurrentState(ctx, content, release, now, todayIsoUtc(new Date(now)))
      ? content
      : null;
  }));
  return { complete: true, rows: rows.filter((row): row is Doc<'libraryContent'> => row !== null) };
}
