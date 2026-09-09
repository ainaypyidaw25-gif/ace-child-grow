import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { v } from 'convex/values';
import seedData from './seedData.json';
import { logAudit } from './audit';
import {
  aiContentSnapshot,
  aiEvidenceLinkSnapshot,
  aiEvidenceSnapshot,
  sha256Canonical,
} from './lib/aiAuditHash';
import {
  AI_PUBLICATION_AUDIT_ARTIFACT,
  type AiPublicationAuditTargetArtifact,
} from './lib/aiPublicationAuditArtifact';
import {
  aiAuditFreshForActivation,
  aiPublicationMasterEnabled,
  aiPublicationTargetKey,
  AI_PUBLICATION_CONFIG_KEY,
  AI_PUBLICATION_MAX_ACTIVE_RELEASES,
  AI_PUBLICATION_MAX_RELEASE_DAYS,
  AI_PUBLICATION_POLICY_VERSION,
  arraysEqual,
  sourceMayEnterAiPublication,
} from './lib/aiPublicationPolicy';
import {
  AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
  AI_PUBLICATION_RELEASE_ID,
  AI_PUBLICATION_RELEASE_SOURCE_HASHES,
  AI_PUBLICATION_RELEASE_SOURCES,
  AI_PUBLICATION_RELEASE_TARGETS,
  type AiReleaseSourceSeed,
  type AiReleaseTargetData,
} from './lib/aiPublicationReleaseData';
import { aiReleaseMatchesCurrentState } from './lib/aiPublicationVisibility';
import { assertNoPersistedReleaseGovernedContent } from './lib/clinicalReviewBatchProvenance';
import { todayIsoUtc } from './lib/evidenceFreshness';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

type SeedItem = {
  type: string;
  slug: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  tags: string[];
  difficulty?: string;
  durationMinutes?: number;
  offline?: boolean;
  data: unknown;
  source: string;
  version: number;
  clinicalStatus: string;
  searchText: string;
};

const desiredSeedBySlug = new Map(
  (seedData as unknown as SeedItem[]).map((item) => [item.slug, item]),
);

const targetSlugValidator = v.union(
  v.literal('lsn_early_math'),
  v.literal('st_waiting_at_clinic'),
  v.literal('st_first_day_school'),
);

const preflightTargetValidator = v.object({
  type: v.string(),
  slug: targetSlugValidator,
  contentFound: v.boolean(),
  linkFound: v.boolean(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  contentUpdatedAt: v.union(v.number(), v.null()),
  contentSnapshotHash: v.union(v.string(), v.null()),
  linkUpdatedAt: v.union(v.number(), v.null()),
  linkSnapshotHash: v.union(v.string(), v.null()),
  sourceIds: v.array(v.string()),
  releaseRows: v.number(),
  auditRows: v.number(),
  initialExact: v.boolean(),
  appliedExact: v.boolean(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(AI_PUBLICATION_RELEASE_ID),
  phase: v.union(v.literal('ready'), v.literal('applied'), v.literal('drift')),
  configRows: v.number(),
  configEnabled: v.boolean(),
  sourceRowsFound: v.number(),
  sourceRowsExact: v.number(),
  targets: v.array(preflightTargetValidator),
});

const applyResultValidator = v.object({
  releaseId: v.literal(AI_PUBLICATION_RELEASE_ID),
  applied: v.boolean(),
  alreadyApplied: v.boolean(),
  sourcesCreated: v.number(),
  linksUpdated: v.number(),
  contentUpdated: v.number(),
  auditsCreated: v.number(),
  releasesCreated: v.number(),
});

function boundedText(value: string, field: string, max: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new Error(`${field} must be 1-${max} characters`);
  return trimmed;
}

function assertArtifactText(value: string, field: string, max: number): void {
  if (!value || value.trim() !== value || value.length > max) {
    throw new Error(`AI audit artifact ${field} must be 1-${max} trimmed characters`);
  }
}

function arrayWithinBounds(values: readonly unknown[], min: number, max: number): boolean {
  const length: number = values.length;
  return length >= min && length <= max;
}

function artifactTargetKey(target: Pick<AiPublicationAuditTargetArtifact, 'type' | 'slug'>): string {
  return aiPublicationTargetKey(target.type, target.slug);
}

async function verifiedAuditArtifact(now: number) {
  const artifactHash = await sha256Canonical(AI_PUBLICATION_AUDIT_ARTIFACT);
  if (artifactHash !== AI_PUBLICATION_AUDIT_ARTIFACT_HASH) {
    throw new Error('AI audit artifact hash drifted');
  }
  if (
    AI_PUBLICATION_AUDIT_ARTIFACT.schemaVersion !== 1
    || AI_PUBLICATION_AUDIT_ARTIFACT.releaseId !== AI_PUBLICATION_RELEASE_ID
    || AI_PUBLICATION_AUDIT_ARTIFACT.policyVersion !== AI_PUBLICATION_POLICY_VERSION
    || !/^[a-f0-9]{40}$/.test(AI_PUBLICATION_AUDIT_ARTIFACT.auditedWorkspaceBaseCommit)
    || !Number.isFinite(AI_PUBLICATION_AUDIT_ARTIFACT.auditStartedAt)
    || !Number.isFinite(AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt)
    || AI_PUBLICATION_AUDIT_ARTIFACT.auditStartedAt > AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt
    || !aiAuditFreshForActivation(AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt, now)
  ) {
    throw new Error('AI audit artifact metadata is invalid or stale');
  }
  assertArtifactText(AI_PUBLICATION_AUDIT_ARTIFACT.artifactId, 'artifactId', 160);
  assertArtifactText(AI_PUBLICATION_AUDIT_ARTIFACT.provider, 'provider', 128);
  assertArtifactText(AI_PUBLICATION_AUDIT_ARTIFACT.model, 'model', 128);
  assertArtifactText(AI_PUBLICATION_AUDIT_ARTIFACT.modelVersion, 'modelVersion', 128);
  assertArtifactText(AI_PUBLICATION_AUDIT_ARTIFACT.summary, 'summary', 2_000);
  if (
    !arrayWithinBounds(AI_PUBLICATION_AUDIT_ARTIFACT.limitations, 1, 10)
    || AI_PUBLICATION_AUDIT_ARTIFACT.targets.length !== AI_PUBLICATION_RELEASE_TARGETS.length
  ) {
    throw new Error('AI audit artifact bounds are invalid');
  }
  AI_PUBLICATION_AUDIT_ARTIFACT.limitations.forEach((value, index) => {
    assertArtifactText(value, `limitations[${index}]`, 500);
  });

  const byTarget = new Map<string, AiPublicationAuditTargetArtifact>();
  for (const target of AI_PUBLICATION_AUDIT_ARTIFACT.targets) {
    const key = artifactTargetKey(target);
    if (byTarget.has(key)) throw new Error(`Duplicate target in AI audit artifact: ${target.slug}`);
    if (
      target.verdict !== 'pass'
      || target.independentAgentResults.length !== 2
      || new Set(target.independentAgentResults.map((result) => result.role)).size !== 2
      || target.independentAgentResults.some((result) => result.verdict !== 'pass')
      || !arrayWithinBounds(target.evidenceFindings, 1, 10)
      || !arrayWithinBounds(target.contentChecks, 1, 10)
      || !arrayWithinBounds(target.limitations, 1, 10)
    ) {
      throw new Error(`AI audit artifact target is incomplete: ${target.slug}`);
    }
    assertArtifactText(target.claimScope, `${target.slug}.claimScope`, 1_000);
    assertArtifactText(target.sourceUrl, `${target.slug}.sourceUrl`, 2_000);
    for (const [field, values, max] of [
      ['evidenceFindings', target.evidenceFindings, 1_000],
      ['contentChecks', target.contentChecks, 500],
      ['limitations', target.limitations, 500],
    ] as const) {
      values.forEach((value, index) => assertArtifactText(value, `${target.slug}.${field}[${index}]`, max));
    }
    target.independentAgentResults.forEach((result, index) => {
      assertArtifactText(result.report, `${target.slug}.agentResults[${index}]`, 2_000);
    });
    byTarget.set(key, target);
  }

  for (const releaseTarget of AI_PUBLICATION_RELEASE_TARGETS) {
    const auditTarget = byTarget.get(artifactTargetKey(releaseTarget));
    const sourceId = releaseTarget.desiredSourceIds[0];
    const source = AI_PUBLICATION_RELEASE_SOURCES.find((candidate) => candidate.sourceId === sourceId);
    if (
      !auditTarget
      || !source
      || auditTarget.contentSnapshotHash !== releaseTarget.desiredContentSnapshotHash
      || auditTarget.evidenceLinkSnapshotHash !== releaseTarget.desiredLinkSnapshotHash
      || auditTarget.sourceId !== sourceId
      || auditTarget.sourceSnapshotHash !== AI_PUBLICATION_RELEASE_SOURCE_HASHES[sourceId]
      || auditTarget.sourceUrl !== source.url
    ) {
      throw new Error(`AI audit artifact does not bind the exact release snapshot: ${releaseTarget.slug}`);
    }
  }
  return { artifactHash, byTarget };
}

function releaseIdFor(target: AiReleaseTargetData): string {
  return `${AI_PUBLICATION_RELEASE_ID}:${target.type}:${target.slug}`;
}

function runIdFor(target: AiReleaseTargetData): string {
  return `${AI_PUBLICATION_RELEASE_ID}:audit:${target.type}:${target.slug}`;
}

function sourceSearchText(source: AiReleaseSourceSeed): string {
  return [
    source.org,
    source.title,
    source.authors ?? '',
    source.url,
    source.doi ?? '',
    source.isbn ?? '',
    ...source.keywords,
    ...source.topics,
  ].join(' ').toLowerCase();
}

function desiredContentPatch(seed: SeedItem, target: AiReleaseTargetData, now: number) {
  return {
    type: seed.type,
    slug: seed.slug,
    ageGroupKey: seed.ageGroupKey,
    domainKey: seed.domainKey,
    category: seed.category,
    titleMm: seed.titleMm,
    titleEn: seed.titleEn,
    summaryMm: seed.summaryMm,
    summaryEn: seed.summaryEn,
    tags: seed.tags,
    difficulty: seed.difficulty,
    durationMinutes: seed.durationMinutes,
    offline: seed.offline,
    data: seed.data,
    source: seed.source,
    version: seed.version,
    reviewRevision: target.desiredReviewRevision,
    clinicalStatus: 'clinical_review' as const,
    reviewerId: undefined,
    reviewerQualification: undefined,
    reviewerDisplayName: undefined,
    reviewScope: undefined,
    reviewedAt: undefined,
    nextReviewAt: undefined,
    reviewNote: undefined,
    aiPublicationReleaseId: undefined,
    aiPublishedAt: undefined,
    searchText: seed.searchText,
    updatedAt: now,
  };
}

async function targetPreflight(
  ctx: DatabaseContext,
  target: AiReleaseTargetData,
  now: number,
) {
  const runId = runIdFor(target);
  const [content, link, releases, runs, contentAudits, evidenceAudits] = await Promise.all([
    ctx.db.query('libraryContent').withIndex('by_slug', (q) => q.eq('slug', target.slug)).unique(),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) => q
      .eq('kind', target.type)
      .eq('slug', target.slug)).unique(),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
      .eq('targetKey', aiPublicationTargetKey(target.type, target.slug))).take(2),
    ctx.db.query('aiAuditRuns').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
    ctx.db.query('aiContentAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
    ctx.db.query('aiEvidenceAudits').withIndex('by_run_id', (q) => q.eq('runId', runId)).take(2),
  ]);
  const contentSnapshotHash = content
    ? await sha256Canonical(aiContentSnapshot(content))
    : null;
  const linkSnapshotHash = link
    ? await sha256Canonical(aiEvidenceLinkSnapshot(link))
    : null;
  const initialExact = Boolean(
    content
    && link
    && releases.length === 0
    && runs.length === 0
    && contentAudits.length === 0
    && evidenceAudits.length === 0
    && content.type === target.type
    && content.clinicalStatus === target.initialClinicalStatus
    && (content.reviewRevision ?? 1) === target.initialReviewRevision
    && content.updatedAt === target.initialContentUpdatedAt
    && contentSnapshotHash === target.initialContentSnapshotHash
    && link.updatedAt === target.initialLinkUpdatedAt
    && arraysEqual(link.sourceIds, target.initialSourceIds)
    && linkSnapshotHash === target.initialLinkSnapshotHash,
  );
  const appliedExact = Boolean(
    content
    && releases.length === 1
    && releases[0].releaseId === releaseIdFor(target)
    && await aiReleaseMatchesCurrentState(ctx, content, releases[0], now, todayIsoUtc(new Date(now))),
  );
  return {
    type: target.type,
    slug: target.slug,
    contentFound: content !== null,
    linkFound: link !== null,
    clinicalStatus: content?.clinicalStatus ?? null,
    reviewRevision: content ? (content.reviewRevision ?? 1) : null,
    contentUpdatedAt: content?.updatedAt ?? null,
    contentSnapshotHash,
    linkUpdatedAt: link?.updatedAt ?? null,
    linkSnapshotHash,
    sourceIds: link?.sourceIds ?? [],
    releaseRows: releases.length,
    auditRows: runs.length + contentAudits.length + evidenceAudits.length,
    initialExact,
    appliedExact,
  };
}

async function preflightState(ctx: DatabaseContext, now: number) {
  const [targets, configs, sourceRows] = await Promise.all([
    Promise.all(AI_PUBLICATION_RELEASE_TARGETS.map((target) => targetPreflight(ctx, target, now))),
    ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q
      .eq('key', AI_PUBLICATION_CONFIG_KEY)).take(2),
    Promise.all(AI_PUBLICATION_RELEASE_SOURCES.map((source) => ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', source.sourceId))
      .unique())),
  ]);
  let sourceRowsExact = 0;
  for (const source of sourceRows) {
    if (!source) continue;
    const expectedHash = AI_PUBLICATION_RELEASE_SOURCE_HASHES[source.sourceId];
    if (expectedHash && await sha256Canonical(aiEvidenceSnapshot(source)) === expectedHash) {
      sourceRowsExact += 1;
    }
  }
  const allInitial = targets.every((target) => target.initialExact) && sourceRows.every((row) => row === null);
  const allApplied = targets.every((target) => target.appliedExact)
    && sourceRowsExact === AI_PUBLICATION_RELEASE_SOURCES.length;
  return {
    releaseId: AI_PUBLICATION_RELEASE_ID,
    phase: allApplied ? 'applied' as const : allInitial ? 'ready' as const : 'drift' as const,
    configRows: configs.length,
    configEnabled: configs.length === 1 && configs[0].enabled,
    sourceRowsFound: sourceRows.filter(Boolean).length,
    sourceRowsExact,
    targets,
  };
}

/** Read-only exact-state check; run this against production before applying. */
export const preflight = internalQuery({
  args: { releaseId: v.literal(AI_PUBLICATION_RELEASE_ID) },
  returns: preflightResultValidator,
  handler: async (ctx) => await preflightState(ctx, Date.now()),
});

/**
 * One narrowly guarded transaction for the three owner-authorized educational
 * previews. It creates advisory AI provenance only; it never writes a human
 * reviewer, contentReview approval or evidence approval.
 */
export const apply = internalMutation({
  args: {
    releaseId: v.literal(AI_PUBLICATION_RELEASE_ID),
    operator: v.string(),
    gitCommit: v.string(),
  },
  returns: applyResultValidator,
  handler: async (ctx, args) => {
    await assertNoPersistedReleaseGovernedContent(
      ctx,
      AI_PUBLICATION_RELEASE_TARGETS.map((target) => target.slug),
    );
    const operator = boundedText(args.operator, 'operator', 160);
    if (!/^[a-f0-9]{40}$/.test(args.gitCommit)) throw new Error('gitCommit must be a 40-character lowercase SHA');
    const now = Date.now();
    const before = await preflightState(ctx, now);
    if (before.phase === 'applied') {
      return {
        releaseId: AI_PUBLICATION_RELEASE_ID,
        applied: false,
        alreadyApplied: true,
        sourcesCreated: 0,
        linksUpdated: 0,
        contentUpdated: 0,
        auditsCreated: 0,
        releasesCreated: 0,
      };
    }
    if (before.phase !== 'ready') throw new Error('AI publication release preimage drifted; no writes applied');
    const verifiedArtifact = await verifiedAuditArtifact(now);
    if (before.configEnabled) throw new Error('AI publication control must be off while the release is staged');
    if (before.configRows > 1) throw new Error('Duplicate AI publication controls; fail closed');

    const activeReleases = await ctx.db
      .query('aiPublicationReleases')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .take(AI_PUBLICATION_MAX_ACTIVE_RELEASES + 1);
    if (activeReleases.length !== 0) throw new Error('Unexpected active AI publication release exists');

    const desiredRows: Array<{
      target: AiReleaseTargetData;
      seed: SeedItem;
      content: Doc<'libraryContent'>;
      link: Doc<'evidenceLinks'>;
      contentPatch: ReturnType<typeof desiredContentPatch>;
    }> = [];
    for (const target of AI_PUBLICATION_RELEASE_TARGETS) {
      const seed = desiredSeedBySlug.get(target.slug);
      if (!seed || seed.type !== target.type || seed.clinicalStatus !== 'clinical_review') {
        throw new Error(`Release seed mismatch: ${target.slug}`);
      }
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', target.slug))
        .unique();
      const link = await ctx.db
        .query('evidenceLinks')
        .withIndex('by_kind_slug', (q) => q.eq('kind', target.type).eq('slug', target.slug))
        .unique();
      if (!content || !link) throw new Error(`Release target missing: ${target.slug}`);
      const contentPatch = desiredContentPatch(seed, target, now);
      const desiredContent = { ...content, ...contentPatch };
      const desiredContentHash = await sha256Canonical(aiContentSnapshot(desiredContent));
      const desiredLinkHash = await sha256Canonical(aiEvidenceLinkSnapshot({
        kind: target.type,
        slug: target.slug,
        sourceIds: target.desiredSourceIds,
      }));
      if (desiredContentHash !== target.desiredContentSnapshotHash) {
        throw new Error(`Desired content hash drifted: ${target.slug}`);
      }
      if (desiredLinkHash !== target.desiredLinkSnapshotHash) {
        throw new Error(`Desired evidence-link hash drifted: ${target.slug}`);
      }
      desiredRows.push({ target, seed, content, link, contentPatch });
    }

    const todayIso = todayIsoUtc(new Date(now));
    for (const source of AI_PUBLICATION_RELEASE_SOURCES) {
      if (!sourceMayEnterAiPublication(source, todayIso)) {
        throw new Error(`Source is not eligible for the AI lane: ${source.sourceId}`);
      }
      const sourceHash = await sha256Canonical(aiEvidenceSnapshot(source));
      if (sourceHash !== AI_PUBLICATION_RELEASE_SOURCE_HASHES[source.sourceId]) {
        throw new Error(`Desired source hash drifted: ${source.sourceId}`);
      }
    }

    const insertedSources = new Map<string, Doc<'evidenceSources'>>();
    for (const source of AI_PUBLICATION_RELEASE_SOURCES) {
      const id = await ctx.db.insert('evidenceSources', {
        ...source,
        searchText: sourceSearchText(source),
        createdAt: now,
        updatedAt: now,
      });
      const row = await ctx.db.get(id);
      if (!row) throw new Error(`Inserted source could not be read: ${source.sourceId}`);
      insertedSources.set(source.sourceId, row);
    }

    for (const row of desiredRows) {
      await ctx.db.patch(row.link._id, {
        sourceIds: [...row.target.desiredSourceIds],
        updatedAt: now,
      });
      await ctx.db.patch(row.content._id, row.contentPatch);
    }

    const nextAuditDate = new Date(
      AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt
      + (AI_PUBLICATION_MAX_RELEASE_DAYS - 1) * 86_400_000,
    )
      .toISOString().slice(0, 10);
    const expiresAt = AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt
      + AI_PUBLICATION_MAX_RELEASE_DAYS * 86_400_000;
    let auditRowsCreated = 0;

    for (const row of desiredRows) {
      const sourceId = row.target.desiredSourceIds[0];
      const source = insertedSources.get(sourceId);
      if (!source) throw new Error(`Release source missing after insert: ${sourceId}`);
      const releaseId = releaseIdFor(row.target);
      const runId = runIdFor(row.target);
      const sourceHash = await sha256Canonical(aiEvidenceSnapshot(source));
      const contentHash = row.target.desiredContentSnapshotHash;
      const linkHash = row.target.desiredLinkSnapshotHash;
      const targetArtifact = verifiedArtifact.byTarget.get(artifactTargetKey(row.target));
      if (!targetArtifact) throw new Error(`Verified AI audit artifact target missing: ${row.target.slug}`);
      const targetArtifactHash = await sha256Canonical(targetArtifact);
      const outputHash = await sha256Canonical({
        artifactHash: verifiedArtifact.artifactHash,
        targetArtifactHash,
      });
      await ctx.db.insert('aiAuditRuns', {
        runId,
        releaseId,
        status: 'completed',
        provider: AI_PUBLICATION_AUDIT_ARTIFACT.provider,
        model: AI_PUBLICATION_AUDIT_ARTIFACT.model,
        modelVersion: AI_PUBLICATION_AUDIT_ARTIFACT.modelVersion,
        policyVersion: AI_PUBLICATION_POLICY_VERSION,
        gitCommit: args.gitCommit,
        targetCount: 1,
        summary: `${AI_PUBLICATION_AUDIT_ARTIFACT.summary} Target: ${row.target.type}:${row.target.slug}.`,
        limitations: [...AI_PUBLICATION_AUDIT_ARTIFACT.limitations],
        startedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditStartedAt,
        completedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
        outputHash,
      });
      await ctx.db.insert('aiEvidenceAudits', {
        runId,
        sourceId,
        sourceUpdatedAt: source.updatedAt,
        sourceSnapshotHash: sourceHash,
        verdict: 'pass',
        claimScope: targetArtifact.claimScope,
        urlsChecked: [targetArtifact.sourceUrl],
        findings: [...targetArtifact.evidenceFindings],
        limitations: [...targetArtifact.limitations, ...AI_PUBLICATION_AUDIT_ARTIFACT.limitations],
        auditedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
        nextAuditDate,
        outputHash: await sha256Canonical({
          artifactHash: verifiedArtifact.artifactHash,
          targetArtifactHash,
          kind: 'evidence',
        }),
      });
      await ctx.db.insert('aiContentAudits', {
        runId,
        contentSlug: row.target.slug,
        contentType: row.target.type,
        reviewRevision: row.target.desiredReviewRevision,
        contentUpdatedAt: now,
        contentSnapshotHash: contentHash,
        evidenceLinkUpdatedAt: now,
        evidenceLinkSnapshotHash: linkHash,
        sourceIds: [sourceId],
        verdict: 'pass',
        checks: [...targetArtifact.contentChecks],
        limitations: [...targetArtifact.limitations, ...AI_PUBLICATION_AUDIT_ARTIFACT.limitations],
        auditedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
        nextAuditDate,
        outputHash: await sha256Canonical({
          artifactHash: verifiedArtifact.artifactHash,
          targetArtifactHash,
          kind: 'content',
        }),
      });
      auditRowsCreated += 3;

      await ctx.db.insert('aiPublicationReleases', {
        releaseId,
        targetKey: aiPublicationTargetKey(row.target.type, row.target.slug),
        contentId: row.content._id,
        contentType: row.target.type,
        contentSlug: row.target.slug,
        status: 'active',
        reviewRevision: row.target.desiredReviewRevision,
        contentUpdatedAt: now,
        contentSnapshotHash: contentHash,
        evidenceLinkUpdatedAt: now,
        evidenceLinkSnapshotHash: linkHash,
        sourceSnapshots: [{
          sourceId,
          sourceUpdatedAt: source.updatedAt,
          sourceSnapshotHash: sourceHash,
          evidenceAuditRunId: runId,
        }],
        contentAuditRunId: runId,
        auditArtifactHash: verifiedArtifact.artifactHash,
        policyVersion: AI_PUBLICATION_POLICY_VERSION,
        gitCommit: args.gitCommit,
        operator,
        createdAt: now,
        expiresAt,
      });
      await ctx.db.patch(row.content._id, {
        aiPublicationReleaseId: releaseId,
        aiPublishedAt: now,
      });
    }

    await logAudit(
      ctx,
      null,
      'library.ai_publication_release.staged',
      'aiPublicationReleases',
      AI_PUBLICATION_RELEASE_ID,
      `${operator} staged exactly three disclosed AI-audited educational previews; no human approval was written.`,
      {
        before: JSON.stringify({ targets: before.targets.map((target) => ({
          type: target.type,
          slug: target.slug,
          status: target.clinicalStatus,
          revision: target.reviewRevision,
          contentHash: target.contentSnapshotHash,
          linkHash: target.linkSnapshotHash,
        })) }),
        after: JSON.stringify({
          policyVersion: AI_PUBLICATION_POLICY_VERSION,
          auditArtifactHash: verifiedArtifact.artifactHash,
          auditCompletedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
          gitCommit: args.gitCommit,
          targets: AI_PUBLICATION_RELEASE_TARGETS.map((target) => ({
            type: target.type,
            slug: target.slug,
            status: 'clinical_review',
            revision: target.desiredReviewRevision,
            contentHash: target.desiredContentSnapshotHash,
            linkHash: target.desiredLinkSnapshotHash,
          })),
        }),
      },
    );

    return {
      releaseId: AI_PUBLICATION_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      sourcesCreated: AI_PUBLICATION_RELEASE_SOURCES.length,
      linksUpdated: desiredRows.length,
      contentUpdated: desiredRows.length,
      auditsCreated: auditRowsCreated,
      releasesCreated: desiredRows.length,
    };
  },
});

const controlResultValidator = v.object({
  enabled: v.boolean(),
  generation: v.number(),
  rowsChanged: v.number(),
});

/** Enable only after all three exact releases are current and the env master is on. */
export const enable = internalMutation({
  args: {
    releaseId: v.literal(AI_PUBLICATION_RELEASE_ID),
    expectedGeneration: v.number(),
    operator: v.string(),
    reason: v.string(),
  },
  returns: controlResultValidator,
  handler: async (ctx, args) => {
    const operator = boundedText(args.operator, 'operator', 160);
    const reason = boundedText(args.reason, 'reason', 500);
    if (!Number.isInteger(args.expectedGeneration) || args.expectedGeneration < 0) {
      throw new Error('expectedGeneration must be a non-negative integer');
    }
    if (!aiPublicationMasterEnabled()) throw new Error('AI publication environment master is disabled');
    const configs = await ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q
      .eq('key', AI_PUBLICATION_CONFIG_KEY)).take(2);
    if (configs.length > 1) throw new Error('Duplicate AI publication controls; fail closed');
    const currentGeneration = configs[0]?.generation ?? 0;
    if (currentGeneration !== args.expectedGeneration) throw new Error('AI publication control generation changed');

    const now = Date.now();
    const activeReleases = await ctx.db.query('aiPublicationReleases').withIndex(
      'by_status',
      (q) => q.eq('status', 'active'),
    ).take(AI_PUBLICATION_MAX_ACTIVE_RELEASES + 1);
    const expectedReleaseIds = new Set(AI_PUBLICATION_RELEASE_TARGETS.map(releaseIdFor));
    if (
      activeReleases.length !== AI_PUBLICATION_MAX_ACTIVE_RELEASES
      || activeReleases.some((release) => !expectedReleaseIds.has(release.releaseId))
    ) {
      throw new Error('Active AI release set is not the exact three-item allowlist');
    }
    for (const target of AI_PUBLICATION_RELEASE_TARGETS) {
      const releases = await ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
        .eq('targetKey', aiPublicationTargetKey(target.type, target.slug))).take(2);
      if (releases.length !== 1 || releases[0].releaseId !== releaseIdFor(target)) {
        throw new Error(`Expected one exact release for ${target.slug}`);
      }
      const content = await ctx.db.get(releases[0].contentId);
      if (!content || !(await aiReleaseMatchesCurrentState(ctx, content, releases[0], now, todayIsoUtc(new Date(now))))) {
        throw new Error(`AI release is stale or incomplete: ${target.slug}`);
      }
      const contentAudits = await ctx.db.query('aiContentAudits').withIndex(
        'by_run_id',
        (q) => q.eq('runId', releases[0].contentAuditRunId),
      ).take(2);
      if (contentAudits.length !== 1 || !aiAuditFreshForActivation(contentAudits[0].auditedAt, now)) {
        throw new Error(`AI audit is not recent enough to activate: ${target.slug}`);
      }
    }

    const nextGeneration = currentGeneration + 1;
    if (configs[0]) {
      await ctx.db.patch(configs[0]._id, {
        enabled: true,
        generation: nextGeneration,
        reason,
        operator,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('aiPublicationConfig', {
        key: AI_PUBLICATION_CONFIG_KEY,
        enabled: true,
        generation: nextGeneration,
        reason,
        operator,
        updatedAt: now,
      });
    }
    await logAudit(ctx, null, 'library.ai_publication_control.enabled', 'aiPublicationConfig',
      AI_PUBLICATION_CONFIG_KEY, `${operator}: ${reason}`, {
        before: JSON.stringify({ enabled: configs[0]?.enabled ?? false, generation: currentGeneration }),
        after: JSON.stringify({ enabled: true, generation: nextGeneration }),
      });
    return { enabled: true, generation: nextGeneration, rowsChanged: 1 };
  },
});

/** Emergency kill switch: idempotent and deliberately has no stale-CAS requirement. */
export const emergencyDisable = internalMutation({
  args: {
    releaseId: v.literal(AI_PUBLICATION_RELEASE_ID),
    operator: v.string(),
    reason: v.string(),
  },
  returns: controlResultValidator,
  handler: async (ctx, args) => {
    const operator = boundedText(args.operator, 'operator', 160);
    const reason = boundedText(args.reason, 'reason', 500);
    const configs = await ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q
      .eq('key', AI_PUBLICATION_CONFIG_KEY)).take(20);
    const now = Date.now();
    if (configs.length === 0) {
      await ctx.db.insert('aiPublicationConfig', {
        key: AI_PUBLICATION_CONFIG_KEY,
        enabled: false,
        generation: 1,
        reason,
        operator,
        updatedAt: now,
      });
      await logAudit(ctx, null, 'library.ai_publication_control.disabled', 'aiPublicationConfig',
        AI_PUBLICATION_CONFIG_KEY, `${operator}: ${reason}`);
      return { enabled: false, generation: 1, rowsChanged: 1 };
    }
    let generation = 0;
    for (const config of configs) {
      generation = Math.max(generation, config.generation + 1);
      await ctx.db.patch(config._id, {
        enabled: false,
        generation: config.generation + 1,
        reason,
        operator,
        updatedAt: now,
      });
    }
    await logAudit(ctx, null, 'library.ai_publication_control.disabled', 'aiPublicationConfig',
      AI_PUBLICATION_CONFIG_KEY, `${operator}: ${reason}`);
    return { enabled: false, generation, rowsChanged: configs.length };
  },
});

/** Append-only release revocation after the kill switch has been disabled. */
export const revoke = internalMutation({
  args: {
    releaseId: v.literal(AI_PUBLICATION_RELEASE_ID),
    operator: v.string(),
    reason: v.string(),
  },
  returns: v.object({ revoked: v.number(), alreadyRevoked: v.number() }),
  handler: async (ctx, args) => {
    const operator = boundedText(args.operator, 'operator', 160);
    const reason = boundedText(args.reason, 'reason', 500);
    const configs = await ctx.db.query('aiPublicationConfig').withIndex('by_key', (q) => q
      .eq('key', AI_PUBLICATION_CONFIG_KEY)).take(20);
    if (configs.some((config) => config.enabled)) throw new Error('Disable AI publication control before revoking');
    const now = Date.now();
    let revoked = 0;
    let alreadyRevoked = 0;
    for (const target of AI_PUBLICATION_RELEASE_TARGETS) {
      const releases = await ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) => q
        .eq('targetKey', aiPublicationTargetKey(target.type, target.slug))).take(2);
      if (releases.length !== 1 || releases[0].releaseId !== releaseIdFor(target)) {
        throw new Error(`Unexpected release state for ${target.slug}`);
      }
      const release = releases[0];
      if (release.status === 'revoked') {
        alreadyRevoked += 1;
        continue;
      }
      await ctx.db.patch(release._id, {
        status: 'revoked',
        revokedAt: now,
        revokeReason: `${operator}: ${reason}`,
      });
      const content = await ctx.db.get(release.contentId);
      if (content?.aiPublicationReleaseId === release.releaseId) {
        await ctx.db.patch(content._id, {
          aiPublicationReleaseId: undefined,
          aiPublishedAt: undefined,
        });
      }
      revoked += 1;
    }
    await logAudit(ctx, null, 'library.ai_publication_release.revoked', 'aiPublicationReleases',
      AI_PUBLICATION_RELEASE_ID, `${operator}: ${reason}`);
    return { revoked, alreadyRevoked };
  },
});
