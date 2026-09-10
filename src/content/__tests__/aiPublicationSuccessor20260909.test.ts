import { describe, expect, it, vi } from 'vitest';
import seedData from '../../../convex/seedData.json';
// Archived math seed pins the diagnostic successor's original content snapshot.
import archivedMathSeed from '../../domain/__tests__/fixtures/aiEarlyMathSeedBefore20260910.json';
import type { Doc } from '../../../convex/_generated/dataModel';
import {
  aiContentSnapshot,
  aiEvidenceLinkSnapshot,
  aiEvidenceSnapshot,
  sha256Canonical,
} from '../../../convex/lib/aiAuditHash';
import { AI_PUBLICATION_AUDIT_ARTIFACT } from '../../../convex/lib/aiPublicationAuditArtifact';
import {
  aiPublicationTargetKey,
  AI_PUBLICATION_POLICY_VERSION,
} from '../../../convex/lib/aiPublicationPolicy';
import { aiReleaseMatchesCurrentState } from '../../../convex/lib/aiPublicationVisibility';
import { AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT } from '../../../convex/lib/aiPublicationSuccessor20260909AuditArtifact';
import {
  aiPublicationSuccessor20260909ReleaseId,
  aiPublicationSuccessor20260909SourceFullSnapshot,
  AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT_HASH,
  AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID,
  AI_PUBLICATION_SUCCESSOR_20260909_TARGETS,
} from '../../../convex/lib/aiPublicationSuccessor20260909Data';

describe('AI educational-preview 2026-09-09 successor artifact', () => {
  it('pins the immutable fresh artifact and preserves the predecessor generation', async () => {
    expect(await sha256Canonical(AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT))
      .toBe(AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT_HASH);
    expect(aiPublicationSuccessor20260909ReleaseId(
      AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0],
    )).toContain(AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID);
    expect(AI_PUBLICATION_AUDIT_ARTIFACT.releaseId).not.toBe(
      AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT.releaseId,
    );
    expect(AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID).not.toContain('2026-08-19');
  });

  it('binds the exact archived content, link and full source snapshots', async () => {
    for (const target of AI_PUBLICATION_SUCCESSOR_20260909_TARGETS) {
      const seed = target.slug === archivedMathSeed.slug
        ? structuredClone(archivedMathSeed)
        : seedData.find((row) => row.slug === target.slug);
      expect(seed).toBeDefined();
      expect(await sha256Canonical(aiContentSnapshot({
        ...seed!,
        reviewRevision: target.reviewRevision,
      }))).toBe(target.contentSnapshotHash);
      expect(await sha256Canonical(aiEvidenceLinkSnapshot({
        kind: target.type,
        slug: target.slug,
        sourceIds: [target.sourceSnapshot.sourceId],
      }))).toBe(target.linkSnapshotHash);
      expect(await sha256Canonical(aiEvidenceSnapshot(target.sourceSnapshot)))
        .toBe(target.sourceSnapshotHash);
      expect(await sha256Canonical(
        aiPublicationSuccessor20260909SourceFullSnapshot(target.sourceSnapshot),
      )).toBe(target.sourceFullSnapshotHash);
      expect(target.sourceSnapshot.reviewStatus).toBe('approved');
      expect(target.sourceSnapshot.reviewerQualification).toBe('MBBS');
    }
  });

  it('pins the provenance anomaly as blocked and runtime rejects this diagnostic release', async () => {
    const blockedTarget = AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT.targets.find(
      (target) => target.slug === 'lsn_early_math',
    );
    expect(blockedTarget).toMatchObject({
      verdict: 'blocked',
      blockers: [expect.stringContaining('unrelated UNICEF report')],
    });

    const query = vi.fn(() => {
      throw new Error('blocked successor must be rejected before database reads');
    });
    const contentId = AI_PUBLICATION_SUCCESSOR_20260909_TARGETS[0].contentId;
    const readable = await aiReleaseMatchesCurrentState(
      { db: { query } } as never,
      {
        _id: contentId,
        type: 'lesson',
        slug: 'lsn_early_math',
      } as Doc<'libraryContent'>,
      {
        releaseId: `${AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID}:lesson:lsn_early_math`,
        auditArtifactHash: AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT_HASH,
        status: 'active',
        contentId,
        contentType: 'lesson',
        contentSlug: 'lsn_early_math',
        targetKey: aiPublicationTargetKey('lesson', 'lsn_early_math'),
        policyVersion: AI_PUBLICATION_POLICY_VERSION,
      } as Doc<'aiPublicationReleases'>,
      Date.now(),
      '2026-09-09',
    );
    expect(readable).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });
});
