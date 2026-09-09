import { internalQuery, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import {
  aiContentSnapshot,
  aiEvidenceLinkSnapshot,
  aiEvidenceSnapshot,
  sha256Canonical,
} from './lib/aiAuditHash';
import {
  aiPublicationTargetKey,
  AI_PUBLICATION_CONFIG_KEY,
  AI_PUBLICATION_MAX_ACTIVE_RELEASES,
} from './lib/aiPublicationPolicy';
import { AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT } from './lib/aiPublicationSuccessor20260909AuditArtifact';
import {
  aiPublicationSuccessor20260909PredecessorSnapshot,
  aiPublicationSuccessor20260909ReleaseId,
  aiPublicationSuccessor20260909RunId,
  aiPublicationSuccessor20260909SourceFullSnapshot,
  AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT_HASH,
  AI_PUBLICATION_SUCCESSOR_20260909_EXPECTED_DISABLED_GENERATION,
  AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
  AI_PUBLICATION_SUCCESSOR_20260909_TARGETS,
  type AiPublicationSuccessor20260909Target,
} from './lib/aiPublicationSuccessor20260909Data';

const targetSlugValidator = v.union(
  v.literal('lsn_early_math'),
  v.literal('st_waiting_at_clinic'),
  v.literal('st_first_day_school'),
);

const targetResultValidator = v.object({
  type: v.union(v.literal('lesson'), v.literal('story')),
  slug: targetSlugValidator,
  contentExact: v.boolean(),
  linkExact: v.boolean(),
  sourceExact: v.boolean(),
  predecessorExact: v.boolean(),
  artifactVerdict: v.union(v.literal('pass'), v.literal('blocked')),
  successorRows: v.number(),
  successorAuditRows: v.number(),
  contentSnapshotHash: v.union(v.string(), v.null()),
  linkSnapshotHash: v.union(v.string(), v.null()),
  sourceSnapshotHash: v.union(v.string(), v.null()),
  sourceFullSnapshotHash: v.union(v.string(), v.null()),
  sourceUpdatedAt: v.union(v.number(), v.null()),
});

const resultValidator = v.object({
  releaseId: v.literal(AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID),
  phase: v.union(
    v.literal('disable_required'),
    v.literal('ready'),
    v.literal('blocked'),
  ),
  artifactExact: v.boolean(),
  configRows: v.number(),
  configEnabled: v.boolean(),
  configGeneration: v.union(v.number(), v.null()),
  activeReleaseRows: v.number(),
  targets: v.array(targetResultValidator),
  blockers: v.array(v.string()),
});

async function targetState(ctx: QueryCtx, target: AiPublicationSuccessor20260909Target) {
  const successorReleaseId = aiPublicationSuccessor20260909ReleaseId(target);
  const successorRunId = aiPublicationSuccessor20260909RunId(target);
  const [content, link, source, releases, runs, contentAudits, evidenceAudits] = await Promise.all([
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).unique(),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', target.type)
      .eq('slug', target.slug)).unique(),
    ctx.db.query('evidenceSources').withIndex('by_source_id', (q) => q
      .eq('sourceId', target.sourceSnapshot.sourceId)).unique(),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
      .eq('targetKey', aiPublicationTargetKey(target.type, target.slug))).take(3),
    ctx.db.query('aiAuditRuns').withIndex('by_run_id', (q) => q.eq('runId', successorRunId)).take(2),
    ctx.db.query('aiContentAudits').withIndex('by_run_id', (q) => q.eq('runId', successorRunId)).take(2),
    ctx.db.query('aiEvidenceAudits').withIndex('by_run_id', (q) => q.eq('runId', successorRunId)).take(2),
  ]);

  const contentSnapshotHash = content ? await sha256Canonical(aiContentSnapshot(content)) : null;
  const linkSnapshotHash = link ? await sha256Canonical(aiEvidenceLinkSnapshot(link)) : null;
  const sourceSnapshotHash = source ? await sha256Canonical(aiEvidenceSnapshot(source)) : null;
  const sourceFullSnapshotHash = source
    ? await sha256Canonical(aiPublicationSuccessor20260909SourceFullSnapshot(source))
    : null;
  const predecessor = releases.find((release) => release.releaseId === target.predecessorReleaseId);
  const predecessorSnapshotHash = predecessor
    ? await sha256Canonical(aiPublicationSuccessor20260909PredecessorSnapshot(predecessor))
    : null;
  const successorRows = releases.filter((release) => release.releaseId === successorReleaseId).length;
  const artifactTarget = AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT.targets.find(
    (candidate) => candidate.type === target.type && candidate.slug === target.slug,
  );

  const contentExact = Boolean(
    content
    && String(content._id) === target.contentId
    && content._creationTime === target.contentCreationTime
    && content.type === target.type
    && content.slug === target.slug
    && content.clinicalStatus === 'clinical_review'
    && (content.reviewRevision ?? 1) === target.reviewRevision
    && content.updatedAt === target.contentUpdatedAt
    && content.aiPublicationReleaseId === target.predecessorReleaseId
    && content.aiPublishedAt === target.contentUpdatedAt
    && contentSnapshotHash === target.contentSnapshotHash,
  );
  const linkExact = Boolean(
    link
    && String(link._id) === target.linkId
    && link._creationTime === target.linkCreationTime
    && link.updatedAt === target.linkUpdatedAt
    && linkSnapshotHash === target.linkSnapshotHash,
  );
  const sourceExact = Boolean(
    source
    && String(source._id) === target.sourceDocId
    && source._creationTime === target.sourceCreationTime
    && source.updatedAt === target.sourceUpdatedAt
    && sourceSnapshotHash === target.sourceSnapshotHash
    && sourceFullSnapshotHash === target.sourceFullSnapshotHash,
  );
  const predecessorExact = Boolean(
    predecessor
    && String(predecessor._id) === target.predecessorReleaseDocId
    && predecessor._creationTime === target.predecessorReleaseCreationTime
    && predecessorSnapshotHash === target.predecessorReleaseSnapshotHash
    && releases.length === 1,
  );

  return {
    type: target.type,
    slug: target.slug,
    contentExact,
    linkExact,
    sourceExact,
    predecessorExact,
    artifactVerdict: artifactTarget?.verdict ?? 'blocked',
    successorRows,
    successorAuditRows: runs.length + contentAudits.length + evidenceAudits.length,
    contentSnapshotHash,
    linkSnapshotHash,
    sourceSnapshotHash,
    sourceFullSnapshotHash,
    sourceUpdatedAt: source?.updatedAt ?? null,
  };
}

/**
 * Read-only exact-state gate for the immutable successor diagnostic artifact.
 * This frozen generation contains a blocked provenance verdict and therefore
 * cannot become ready under any control state. Correcting the source makes its
 * snapshot drift, so a separately reviewed release ID must be frozen before
 * any replacement can be considered.
 */
export const preflight = internalQuery({
  args: { releaseId: v.literal(AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID) },
  returns: resultValidator,
  handler: async (ctx) => {
    const [targets, configs, activeReleases, artifactHash] = await Promise.all([
      Promise.all(AI_PUBLICATION_SUCCESSOR_20260909_TARGETS.map((target) => targetState(ctx, target))),
      ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q
        .eq('key', AI_PUBLICATION_CONFIG_KEY)).take(2),
      ctx.db.query('aiPublicationReleases').withIndex('by_status', (q) => q
        .eq('status', 'active')).take(AI_PUBLICATION_MAX_ACTIVE_RELEASES + 1),
      sha256Canonical(AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT),
    ]);
    const artifactExact = artifactHash === AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT_HASH;
    const config = configs.length === 1 ? configs[0] : null;
    const exactTargets = targets.every((target) => (
      target.contentExact
      && target.linkExact
      && target.sourceExact
      && target.predecessorExact
      && target.successorRows === 0
      && target.successorAuditRows === 0
    ));
    const artifactTargetsPass = targets.every((target) => target.artifactVerdict === 'pass');
    const exactActivePredecessors = activeReleases.length === AI_PUBLICATION_SUCCESSOR_20260909_TARGETS.length
      && activeReleases.every((release) => AI_PUBLICATION_SUCCESSOR_20260909_TARGETS.some(
        (target) => release.releaseId === target.predecessorReleaseId,
      ));
    const blockers: string[] = [];
    if (!artifactExact) blockers.push('successor audit artifact hash drifted');
    for (const artifactTarget of AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT.targets) {
      if (artifactTarget.verdict === 'blocked') {
        blockers.push(`${artifactTarget.type}:${artifactTarget.slug} artifact verdict is blocked: ${artifactTarget.blockers.join(' ')}`);
      }
    }
    if (!exactTargets) blockers.push('content, link, source or predecessor release preimage drifted');
    if (!exactActivePredecessors) blockers.push('active release set is not the exact predecessor set');
    if (!config) blockers.push('AI publication control row is missing or duplicated');
    const baseExact = artifactExact
      && artifactTargetsPass
      && exactTargets
      && exactActivePredecessors
      && Boolean(config);
    let phase: 'disable_required' | 'ready' | 'blocked' = 'blocked';
    if (baseExact && config?.enabled && config.generation === 1) {
      phase = 'disable_required';
      blockers.push('emergency-disable the predecessor control and read back generation 2 before replacement');
    } else if (
      baseExact
      && config
      && !config.enabled
      && config.generation === AI_PUBLICATION_SUCCESSOR_20260909_EXPECTED_DISABLED_GENERATION
    ) {
      phase = 'ready';
    } else if (config && !config.enabled) {
      blockers.push(`control generation must be ${AI_PUBLICATION_SUCCESSOR_20260909_EXPECTED_DISABLED_GENERATION}`);
    } else if (config && config.generation !== 1) {
      blockers.push('enabled control generation drifted');
    }
    return {
      releaseId: AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
      phase,
      artifactExact,
      configRows: configs.length,
      configEnabled: config?.enabled ?? false,
      configGeneration: config?.generation ?? null,
      activeReleaseRows: activeReleases.length,
      targets,
      blockers,
    };
  },
});
