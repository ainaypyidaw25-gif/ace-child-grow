import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apply,
  emergencyDisable,
  enable,
  preflight,
} from '../../../convex/aiPublication';
import seedData from '../../../convex/seedData.json';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { AI_PUBLICATION_AUDIT_ARTIFACT } from '../../../convex/lib/aiPublicationAuditArtifact';
import { aiPublicationTargetKey, AI_PUBLICATION_POLICY_VERSION } from '../../../convex/lib/aiPublicationPolicy';
import { contentIsAiParentReadable } from '../../../convex/lib/aiPublicationVisibility';
import {
  AI_PUBLICATION_RELEASE_ID,
  AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
  AI_PUBLICATION_RELEASE_SOURCE_HASHES,
  AI_PUBLICATION_RELEASE_SOURCES,
  AI_PUBLICATION_RELEASE_TARGETS,
} from '../../../convex/lib/aiPublicationReleaseData';

type Row = Record<string, unknown>;

function emptyContext() {
  const insert = vi.fn(async () => 'inserted-id');
  const patch = vi.fn(async () => undefined);
  const query = vi.fn(() => {
    const terminal = {
      unique: async () => null,
      take: async () => [] as Row[],
      collect: async () => [] as Row[],
      order: () => terminal,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = { eq: (): unknown => q };
        callback(q);
        return terminal;
      },
    };
  });
  return {
    db: {
      query,
      get: vi.fn(async () => null),
      insert,
      patch,
    },
  };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof emptyContext>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

async function appliedContext(options?: {
  duplicateConfig?: boolean;
  duplicateRelease?: boolean;
  duplicateAudit?: boolean;
  expireRelease?: boolean;
  tamperContent?: boolean;
  tamperSource?: boolean;
  now?: number;
}) {
  const now = options?.now ?? Date.now();
  const nextAuditDate = new Date(AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt + 89 * 86_400_000)
    .toISOString().slice(0, 10);
  const tables: Record<string, Row[]> = {
    aiPublicationConfig: [{
      _id: 'config-1',
      key: 'global',
      enabled: true,
      generation: 1,
      reason: 'test',
      operator: 'test',
      updatedAt: now,
    }],
    aiPublicationReleases: [],
    aiAuditRuns: [],
    aiContentAudits: [],
    aiEvidenceAudits: [],
    evidenceSources: [],
    evidenceLinks: [],
    libraryContent: [],
  };
  const byId = new Map<string, Row>();

  for (const target of AI_PUBLICATION_RELEASE_TARGETS) {
    const sourceSeed = AI_PUBLICATION_RELEASE_SOURCES.find(
      (candidate) => candidate.sourceId === target.desiredSourceIds[0],
    )!;
    const sourceId = `source:${sourceSeed.sourceId}`;
    const contentId = `content:${target.slug}`;
    const linkId = `link:${target.slug}`;
    const runId = `${AI_PUBLICATION_RELEASE_ID}:audit:${target.type}:${target.slug}`;
    const releaseId = `${AI_PUBLICATION_RELEASE_ID}:${target.type}:${target.slug}`;
    const artifactTarget = AI_PUBLICATION_AUDIT_ARTIFACT.targets.find(
      (candidate) => candidate.type === target.type && candidate.slug === target.slug,
    )!;
    const targetArtifactHash = await sha256Canonical(artifactTarget);
    const runOutputHash = await sha256Canonical({
      artifactHash: AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
      targetArtifactHash,
    });
    const contentOutputHash = await sha256Canonical({
      artifactHash: AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
      targetArtifactHash,
      kind: 'content',
    });
    const evidenceOutputHash = await sha256Canonical({
      artifactHash: AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
      targetArtifactHash,
      kind: 'evidence',
    });
    const seed = seedData.find((candidate) => candidate.slug === target.slug)!;
    const content = {
      ...seed,
      _id: contentId,
      _creationTime: now,
      reviewRevision: target.desiredReviewRevision,
      clinicalStatus: 'clinical_review',
      aiPublicationReleaseId: releaseId,
      aiPublishedAt: now,
      updatedAt: now,
      ...(options?.tamperContent && target.slug === 'lsn_early_math'
        ? { titleEn: `${seed.titleEn} changed` }
        : {}),
    };
    const link = {
      _id: linkId,
      _creationTime: now,
      kind: target.type,
      slug: target.slug,
      sourceIds: [...target.desiredSourceIds],
      createdAt: now,
      updatedAt: now,
    };
    const source = {
      ...sourceSeed,
      _id: sourceId,
      _creationTime: now,
      searchText: sourceSeed.title.toLowerCase(),
      createdAt: now,
      updatedAt: now,
      ...(options?.tamperSource && target.slug === 'lsn_early_math'
        ? { title: `${sourceSeed.title} changed` }
        : {}),
    };
    const run = {
      _id: `run:${runId}`,
      _creationTime: now,
      runId,
      releaseId,
      status: 'completed',
      provider: AI_PUBLICATION_AUDIT_ARTIFACT.provider,
      model: AI_PUBLICATION_AUDIT_ARTIFACT.model,
      modelVersion: AI_PUBLICATION_AUDIT_ARTIFACT.modelVersion,
      policyVersion: AI_PUBLICATION_POLICY_VERSION,
      gitCommit: 'a'.repeat(40),
      targetCount: 1,
      summary: `${AI_PUBLICATION_AUDIT_ARTIFACT.summary} Target: ${target.type}:${target.slug}.`,
      limitations: [...AI_PUBLICATION_AUDIT_ARTIFACT.limitations],
      startedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditStartedAt,
      completedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
      outputHash: runOutputHash,
    };
    const contentAudit = {
      _id: `content-audit:${runId}`,
      _creationTime: now,
      runId,
      contentSlug: target.slug,
      contentType: target.type,
      reviewRevision: target.desiredReviewRevision,
      contentUpdatedAt: now,
      contentSnapshotHash: target.desiredContentSnapshotHash,
      evidenceLinkUpdatedAt: now,
      evidenceLinkSnapshotHash: target.desiredLinkSnapshotHash,
      sourceIds: [...target.desiredSourceIds],
      verdict: 'pass',
      checks: [...artifactTarget.contentChecks],
      limitations: [...artifactTarget.limitations, ...AI_PUBLICATION_AUDIT_ARTIFACT.limitations],
      auditedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
      nextAuditDate,
      outputHash: contentOutputHash,
    };
    const evidenceAudit = {
      _id: `evidence-audit:${runId}`,
      _creationTime: now,
      runId,
      sourceId: sourceSeed.sourceId,
      sourceUpdatedAt: now,
      sourceSnapshotHash: AI_PUBLICATION_RELEASE_SOURCE_HASHES[sourceSeed.sourceId],
      verdict: 'pass',
      claimScope: artifactTarget.claimScope,
      urlsChecked: [artifactTarget.sourceUrl],
      findings: [...artifactTarget.evidenceFindings],
      limitations: [...artifactTarget.limitations, ...AI_PUBLICATION_AUDIT_ARTIFACT.limitations],
      auditedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
      nextAuditDate,
      outputHash: evidenceOutputHash,
    };
    const release = {
      _id: `release:${releaseId}`,
      _creationTime: now,
      releaseId,
      targetKey: aiPublicationTargetKey(target.type, target.slug),
      contentId,
      contentType: target.type,
      contentSlug: target.slug,
      status: 'active',
      reviewRevision: target.desiredReviewRevision,
      contentUpdatedAt: now,
      contentSnapshotHash: target.desiredContentSnapshotHash,
      evidenceLinkUpdatedAt: now,
      evidenceLinkSnapshotHash: target.desiredLinkSnapshotHash,
      sourceSnapshots: [{
        sourceId: sourceSeed.sourceId,
        sourceUpdatedAt: now,
        sourceSnapshotHash: AI_PUBLICATION_RELEASE_SOURCE_HASHES[sourceSeed.sourceId],
        evidenceAuditRunId: runId,
      }],
      contentAuditRunId: runId,
      auditArtifactHash: AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
      policyVersion: AI_PUBLICATION_POLICY_VERSION,
      gitCommit: 'a'.repeat(40),
      operator: 'test',
      createdAt: now,
      expiresAt: options?.expireRelease && target.slug === 'lsn_early_math'
        ? now - 1
        : AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt + 90 * 86_400_000,
    };
    tables.libraryContent.push(content);
    tables.evidenceLinks.push(link);
    tables.evidenceSources.push(source);
    tables.aiAuditRuns.push(run);
    tables.aiContentAudits.push(contentAudit);
    tables.aiEvidenceAudits.push(evidenceAudit);
    tables.aiPublicationReleases.push(release);
    byId.set(contentId, content);
    byId.set(linkId, link);
    byId.set(sourceId, source);
  }
  if (options?.duplicateConfig) tables.aiPublicationConfig.push({ ...tables.aiPublicationConfig[0], _id: 'config-2' });
  if (options?.duplicateRelease) tables.aiPublicationReleases.push({ ...tables.aiPublicationReleases[0], _id: 'release-duplicate' });
  if (options?.duplicateAudit) tables.aiContentAudits.push({ ...tables.aiContentAudits[0], _id: 'content-audit-duplicate' });

  const insert = vi.fn(async (table: string, row: Row) => {
    const id = `${table}:inserted`;
    tables[table] ??= [];
    tables[table].push({ ...row, _id: id, _creationTime: now });
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (row) Object.assign(row, value);
  });
  const query = vi.fn((table: string) => {
    const makeTerminal = (conditions: Array<[string, unknown]> = []) => {
      const filtered = () => (tables[table] ?? []).filter((row) => conditions.every(
        ([field, value]) => row[field] === value,
      ));
      const terminal = {
        unique: async () => filtered()[0] ?? null,
        take: async (count: number) => filtered().slice(0, count),
        collect: async () => filtered(),
        order: () => terminal,
      };
      return terminal;
    };
    return {
      ...makeTerminal(),
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const conditions: Array<[string, unknown]> = [];
        const q = {
          eq: (field: string, value: unknown): unknown => {
            conditions.push([field, value]);
            return q;
          },
        };
        callback(q);
        return makeTerminal(conditions);
      },
    };
  });
  return {
    now,
    contents: tables.libraryContent,
    context: { db: { query, get: vi.fn(async (id: string) => byId.get(id) ?? null), insert, patch } },
  };
}

describe('AI publication registered handlers', () => {
  const previousMaster = process.env.AI_PUBLICATION_ENABLED;

  afterEach(() => {
    vi.restoreAllMocks();
    if (previousMaster === undefined) delete process.env.AI_PUBLICATION_ENABLED;
    else process.env.AI_PUBLICATION_ENABLED = previousMaster;
  });

  it('reports drift and makes no writes when exact production preimages are absent', async () => {
    const context = emptyContext();
    await expect(handler(preflight)(context, { releaseId: AI_PUBLICATION_RELEASE_ID }))
      .resolves.toMatchObject({ phase: 'drift', sourceRowsFound: 0 });
    expect(context.db.insert).not.toHaveBeenCalled();
    expect(context.db.patch).not.toHaveBeenCalled();

    await expect(handler(apply)(context, {
      releaseId: AI_PUBLICATION_RELEASE_ID,
      operator: 'owner-authorized Codex release',
      gitCommit: 'a'.repeat(40),
    })).rejects.toThrow('preimage drifted');
    expect(context.db.insert).not.toHaveBeenCalled();
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('keeps the visibility master default-off before any database read', async () => {
    delete process.env.AI_PUBLICATION_ENABLED;
    const context = emptyContext();
    await expect(contentIsAiParentReadable(context as never, {
      type: 'lesson',
      slug: 'lsn_early_math',
    } as never)).resolves.toBe(false);
    expect(context.db.query).not.toHaveBeenCalled();
  });

  it('fails the shared runtime gate closed on duplicate, stale and expired state', async () => {
    process.env.AI_PUBLICATION_ENABLED = 'true';
    const valid = await appliedContext();
    await expect(contentIsAiParentReadable(
      valid.context as never,
      valid.contents[0] as never,
      valid.now,
      '2026-08-19',
    )).resolves.toBe(true);

    for (const variant of await Promise.all([
      appliedContext({ duplicateConfig: true }),
      appliedContext({ duplicateRelease: true }),
      appliedContext({ duplicateAudit: true }),
      appliedContext({ expireRelease: true }),
      appliedContext({ tamperContent: true }),
      appliedContext({ tamperSource: true }),
    ])) {
      await expect(contentIsAiParentReadable(
        variant.context as never,
        variant.contents[0] as never,
        variant.now,
        '2026-08-19',
      )).resolves.toBe(false);
    }
  });

  it('keeps an already-applied release idempotent with zero writes', async () => {
    process.env.AI_PUBLICATION_ENABLED = 'true';
    const applied = await appliedContext();
    await expect(handler(apply)(applied.context as never, {
      releaseId: AI_PUBLICATION_RELEASE_ID,
      operator: 'owner-authorized Codex release',
      gitCommit: 'a'.repeat(40),
    })).resolves.toMatchObject({ applied: false, alreadyApplied: true });
    expect(applied.context.db.insert).not.toHaveBeenCalled();
    expect(applied.context.db.patch).not.toHaveBeenCalled();
  });

  it('keeps an exact applied release idempotent after the seven-day activation window', async () => {
    process.env.AI_PUBLICATION_ENABLED = 'true';
    const staleNow = AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt + 8 * 86_400_000;
    const applied = await appliedContext({ now: staleNow });
    vi.spyOn(Date, 'now').mockReturnValue(staleNow);
    await expect(handler(apply)(applied.context as never, {
      releaseId: AI_PUBLICATION_RELEASE_ID,
      operator: 'owner-authorized Codex release',
      gitCommit: 'a'.repeat(40),
    })).resolves.toMatchObject({ applied: false, alreadyApplied: true });
    expect(applied.context.db.insert).not.toHaveBeenCalled();
    expect(applied.context.db.patch).not.toHaveBeenCalled();
  });

  it('enforces the enable generation CAS before any write', async () => {
    process.env.AI_PUBLICATION_ENABLED = 'true';
    const applied = await appliedContext();
    await expect(handler(enable)(applied.context as never, {
      releaseId: AI_PUBLICATION_RELEASE_ID,
      expectedGeneration: 0,
      operator: 'production operator',
      reason: 'activation test',
    })).rejects.toThrow('generation changed');
    expect(applied.context.db.insert).not.toHaveBeenCalled();
    expect(applied.context.db.patch).not.toHaveBeenCalled();
  });

  it('emergency-disables an absent control idempotently without a generation CAS', async () => {
    const context = emptyContext();
    await expect(handler(emergencyDisable)(context, {
      releaseId: AI_PUBLICATION_RELEASE_ID,
      operator: 'production operator',
      reason: 'rollback drill',
    })).resolves.toEqual({ enabled: false, generation: 1, rowsChanged: 1 });
    expect(context.db.insert).toHaveBeenCalledWith('aiPublicationConfig', expect.objectContaining({
      key: 'global',
      enabled: false,
      generation: 1,
    }));
    expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'library.ai_publication_control.disabled',
    }));
  });
});
