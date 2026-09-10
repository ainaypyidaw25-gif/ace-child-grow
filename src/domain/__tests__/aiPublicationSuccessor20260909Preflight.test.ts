import { describe, expect, it, vi } from 'vitest';
import seedData from '../../../convex/seedData.json';
// Archived seed from d6e6f459b626bb1d1c448386388c66daea8e7074: preserve the blocked successor's exact input.
import archivedMathSeed from './fixtures/aiEarlyMathSeedBefore20260910.json';
import { preflight } from '../../../convex/aiPublicationSuccessor20260909';
import {
  aiPublicationTargetKey,
  AI_PUBLICATION_POLICY_VERSION,
} from '../../../convex/lib/aiPublicationPolicy';
import {
  AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
  AI_PUBLICATION_RELEASE_SOURCE_HASHES,
} from '../../../convex/lib/aiPublicationReleaseData';
import {
  aiPublicationSuccessor20260909RunId,
  AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
  AI_PUBLICATION_SUCCESSOR_20260909_TARGETS,
} from '../../../convex/lib/aiPublicationSuccessor20260909Data';

type Row = Record<string, unknown>;

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

function exactContext(options?: { driftSource?: boolean; disabled?: boolean }) {
  const tables: Record<string, Row[]> = {
    aiPublicationConfig: [{
      _id: 'qh78fvssgsbr7tr7240k8vr4t18csc63',
      _creationTime: 1_787_120_242_144.8044,
      key: 'global',
      enabled: !(options?.disabled ?? false),
      generation: options?.disabled ? 2 : 1,
      reason: 'exact control',
      operator: 'exact operator',
      updatedAt: 1_787_120_242_144,
    }],
    libraryContent: [],
    evidenceLinks: [],
    evidenceSources: [],
    aiPublicationReleases: [],
    aiAuditRuns: [],
    aiContentAudits: [],
    aiEvidenceAudits: [],
  };
  for (const target of AI_PUBLICATION_SUCCESSOR_20260909_TARGETS) {
    const seed = target.slug === archivedMathSeed.slug
      ? structuredClone(archivedMathSeed)
      : seedData.find((row) => row.slug === target.slug)!;
    tables.libraryContent.push({
      ...seed,
      _id: target.contentId,
      _creationTime: target.contentCreationTime,
      clinicalStatus: 'clinical_review',
      reviewRevision: target.reviewRevision,
      updatedAt: target.contentUpdatedAt,
      aiPublicationReleaseId: target.predecessorReleaseId,
      aiPublishedAt: target.contentUpdatedAt,
    });
    tables.evidenceLinks.push({
      _id: target.linkId,
      _creationTime: target.linkCreationTime,
      kind: target.type,
      slug: target.slug,
      sourceIds: [target.sourceSnapshot.sourceId],
      createdAt: 1_785_024_331_625,
      updatedAt: target.linkUpdatedAt,
    });
    tables.evidenceSources.push({
      ...target.sourceSnapshot,
      _id: target.sourceDocId,
      _creationTime: target.sourceCreationTime,
      createdAt: 1_787_120_210_772,
      updatedAt: options?.driftSource && target.slug === 'lsn_early_math'
        ? target.sourceUpdatedAt + 1
        : target.sourceUpdatedAt,
      searchText: target.sourceSnapshot.title.toLowerCase(),
    });
    const predecessorRunId = target.predecessorReleaseId.replace(
      `:${target.type}:${target.slug}`,
      `:audit:${target.type}:${target.slug}`,
    );
    tables.aiPublicationReleases.push({
      _id: target.predecessorReleaseDocId,
      _creationTime: target.predecessorReleaseCreationTime,
      releaseId: target.predecessorReleaseId,
      targetKey: aiPublicationTargetKey(target.type, target.slug),
      contentId: target.contentId,
      contentType: target.type,
      contentSlug: target.slug,
      status: 'active',
      reviewRevision: target.reviewRevision,
      contentUpdatedAt: target.contentUpdatedAt,
      contentSnapshotHash: target.contentSnapshotHash,
      evidenceLinkUpdatedAt: target.linkUpdatedAt,
      evidenceLinkSnapshotHash: target.linkSnapshotHash,
      sourceSnapshots: [{
        sourceId: target.sourceSnapshot.sourceId,
        sourceUpdatedAt: 1_787_120_210_772,
        sourceSnapshotHash: AI_PUBLICATION_RELEASE_SOURCE_HASHES[target.sourceSnapshot.sourceId],
        evidenceAuditRunId: predecessorRunId,
      }],
      contentAuditRunId: predecessorRunId,
      auditArtifactHash: AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
      policyVersion: AI_PUBLICATION_POLICY_VERSION,
      gitCommit: '5bcc6fd0f996066cf50dfb39ae2fce8f951e2559',
      operator: 'Owner-authorized Codex release operator',
      createdAt: 1_787_120_210_772,
      expiresAt: 1_794_895_168_000,
    });
  }

  const query = vi.fn((table: string) => {
    const makeTerminal = (conditions: Array<[string, unknown]> = []) => {
      const rows = () => tables[table].filter((row) => conditions.every(
        ([field, value]) => row[field] === value,
      ));
      const terminal = {
        unique: async () => rows()[0] ?? null,
        take: async (count: number) => rows().slice(0, count),
      };
      return terminal;
    };
    return {
      ...makeTerminal(),
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const conditions: Array<[string, unknown]> = [];
        const q = { eq: (field: string, value: unknown): unknown => {
          conditions.push([field, value]);
          return q;
        } };
        callback(q);
        return makeTerminal(conditions);
      },
    };
  });
  return { db: { query } };
}

describe('AI preview successor exact preflight', () => {
  it('blocks the release while the frozen early-math provenance verdict is blocked', async () => {
    const result = await handler(preflight)(exactContext(), {
      releaseId: AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
    }) as {
      phase: string;
      blockers: string[];
      targets: Array<{ slug: string; artifactVerdict: string; successorAuditRows: number }>;
    };
    expect(result.phase).toBe('blocked');
    expect(result.blockers).toEqual(expect.arrayContaining([
      expect.stringContaining('lesson:lsn_early_math artifact verdict is blocked'),
      expect.stringContaining('unrelated UNICEF report'),
    ]));
    expect(result.targets.find((target) => target.slug === 'lsn_early_math')?.artifactVerdict)
      .toBe('blocked');
    expect(result.targets.every((target) => target.successorAuditRows === 0)).toBe(true);
  });

  it('cannot become ready by disabling the control and still fails closed on drift', async () => {
    await expect(handler(preflight)(exactContext({ disabled: true }), {
      releaseId: AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining([expect.stringContaining('unrelated UNICEF report')]),
    });

    await expect(handler(preflight)(exactContext({ disabled: true, driftSource: true }), {
      releaseId: AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
    })).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining([
        expect.stringContaining('unrelated UNICEF report'),
        'content, link, source or predecessor release preimage drifted',
      ]),
    });
  });

  it('uses a release-specific run id so predecessor audits remain immutable', () => {
    const target = AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0];
    expect(aiPublicationSuccessor20260909RunId(target)).toContain('2026-09-09');
    expect(aiPublicationSuccessor20260909RunId(target)).not.toBe(
      target.predecessorReleaseId.replace(`:${target.type}:${target.slug}`, `:audit:${target.type}:${target.slug}`),
    );
  });
});
