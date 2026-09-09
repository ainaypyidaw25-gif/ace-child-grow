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
} from './aiPublicationReleaseData';
import { todayIsoUtc } from './evidenceFreshness';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

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
      .take(AI_PUBLICATION_MAX_ACTIVE_RELEASES + 1),
  ]);
  if (configs.length !== 1 || !configs[0].enabled) return { complete: configs.length <= 1, releases: [] };
  if (releases.length > AI_PUBLICATION_MAX_ACTIVE_RELEASES) return { complete: false, releases: [] };
  const keys = new Set<string>();
  for (const release of releases) {
    const expectedKey = aiPublicationTargetKey(release.contentType, release.contentSlug);
    if (
      !isAiPublicationTarget(release.contentType, release.contentSlug)
      || release.targetKey !== expectedKey
      || keys.has(expectedKey)
    ) {
      return { complete: false, releases: [] };
    }
    keys.add(expectedKey);
  }
  return { complete: true, releases };
}

async function matchingCompletedRun(
  ctx: DatabaseContext,
  runId: string,
  release: Doc<'aiPublicationReleases'>,
  expectedOutputHash: string,
  expectedSummary: string,
): Promise<boolean> {
  const rows = await ctx.db
    .query('aiAuditRuns')
    .withIndex('by_run_id', (q) => q.eq('runId', runId))
    .take(2);
  return rows.length === 1
    && rows[0].status === 'completed'
    && rows[0].releaseId === release.releaseId
    && rows[0].provider === AI_PUBLICATION_AUDIT_ARTIFACT.provider
    && rows[0].model === AI_PUBLICATION_AUDIT_ARTIFACT.model
    && rows[0].modelVersion === AI_PUBLICATION_AUDIT_ARTIFACT.modelVersion
    && rows[0].policyVersion === AI_PUBLICATION_POLICY_VERSION
    && rows[0].gitCommit === release.gitCommit
    && rows[0].targetCount === 1
    && rows[0].summary === expectedSummary
    && arraysEqual(rows[0].limitations, AI_PUBLICATION_AUDIT_ARTIFACT.limitations)
    && rows[0].startedAt === AI_PUBLICATION_AUDIT_ARTIFACT.auditStartedAt
    && rows[0].completedAt === AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt
    && rows[0].outputHash === expectedOutputHash;
}

export async function aiReleaseMatchesCurrentState(
  ctx: DatabaseContext,
  content: Doc<'libraryContent'>,
  release: Doc<'aiPublicationReleases'>,
  now: number,
  todayIso: string,
): Promise<boolean> {
  const artifactHash = await sha256Canonical(AI_PUBLICATION_AUDIT_ARTIFACT);
  const artifactTarget = AI_PUBLICATION_AUDIT_ARTIFACT.targets.find(
    (target) => target.type === content.type && target.slug === content.slug,
  );
  if (
    artifactHash !== AI_PUBLICATION_AUDIT_ARTIFACT_HASH
    || !artifactTarget
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
    AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt
    + (AI_PUBLICATION_MAX_RELEASE_DAYS - 1) * 86_400_000,
  ).toISOString().slice(0, 10);
  const expectedLimitations = [...artifactTarget.limitations, ...AI_PUBLICATION_AUDIT_ARTIFACT.limitations];
  const expectedRunSummary = `${AI_PUBLICATION_AUDIT_ARTIFACT.summary} Target: ${content.type}:${content.slug}.`;

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
    && contentAudits[0].auditedAt === AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt
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
      && audits[0].auditedAt === AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt
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
    ));
  }));
  return sourceResults.every(Boolean);
}

export async function contentIsAiParentReadable(
  ctx: DatabaseContext,
  content: Doc<'libraryContent'>,
  now = Date.now(),
  todayIso = todayIsoUtc(new Date(now)),
): Promise<boolean> {
  if (!isAiPublicationTarget(content.type, content.slug)) return false;
  const control = await activeAiPublicationControl(ctx);
  if (!control.complete) return false;
  const release = control.releases.find(
    (candidate) => candidate.targetKey === aiPublicationTargetKey(content.type, content.slug),
  );
  return release ? await aiReleaseMatchesCurrentState(ctx, content, release, now, todayIso) : false;
}

/** Resolve the at-most-three AI release rows for the offline/public manifest. */
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
