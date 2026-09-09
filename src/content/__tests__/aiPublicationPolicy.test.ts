import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';
import {
  aiContentSnapshot,
  aiEvidenceLinkSnapshot,
  aiEvidenceSnapshot,
  sha256Canonical,
} from '../../../convex/lib/aiAuditHash';
import {
  aiAuditFreshForActivation,
  aiAuditIsCurrent,
  AI_PUBLICATION_MAX_ACTIVE_RELEASES,
  AI_PUBLICATION_POLICY_VERSION,
  isAiPublicationTarget,
  sourceMayEnterAiPublication,
} from '../../../convex/lib/aiPublicationPolicy';
import {
  AI_PUBLICATION_AUDIT_ARTIFACT,
} from '../../../convex/lib/aiPublicationAuditArtifact';
import {
  AI_PUBLICATION_AUDIT_ARTIFACT_HASH,
  AI_PUBLICATION_RELEASE_SOURCE_HASHES,
  AI_PUBLICATION_RELEASE_SOURCES,
  AI_PUBLICATION_RELEASE_TARGETS,
} from '../../../convex/lib/aiPublicationReleaseData';

describe('AI educational-preview policy', () => {
  it('has an immutable exact three-item typed allowlist', () => {
    expect(AI_PUBLICATION_MAX_ACTIVE_RELEASES).toBe(3);
    expect(AI_PUBLICATION_POLICY_VERSION).toBe('ai-educational-preview-v1');
    expect(AI_PUBLICATION_RELEASE_TARGETS.map(({ type, slug }) => `${type}:${slug}`)).toEqual([
      'lesson:lsn_early_math',
      'story:st_waiting_at_clinic',
      'story:st_first_day_school',
    ]);
    expect(isAiPublicationTarget('story', 'st_first_day_school')).toBe(true);
    expect(isAiPublicationTarget('lesson', 'st_first_day_school')).toBe(false);
    expect(isAiPublicationTarget('story', 'a-fourth-item')).toBe(false);
  });

  it('locks desired content, link and database source hashes', async () => {
    expect(await sha256Canonical(AI_PUBLICATION_AUDIT_ARTIFACT))
      .toBe(AI_PUBLICATION_AUDIT_ARTIFACT_HASH);
    expect(AI_PUBLICATION_AUDIT_ARTIFACT.auditStartedAt)
      .toBeLessThanOrEqual(AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt);
    expect(AI_PUBLICATION_AUDIT_ARTIFACT.targets.map(({ type, slug }) => `${type}:${slug}`))
      .toEqual(AI_PUBLICATION_RELEASE_TARGETS.map(({ type, slug }) => `${type}:${slug}`));
    for (const target of AI_PUBLICATION_RELEASE_TARGETS) {
      const seed = seedData.find((row) => row.slug === target.slug);
      expect(seed).toBeDefined();
      expect(await sha256Canonical(aiContentSnapshot({
        ...seed!,
        reviewRevision: target.desiredReviewRevision,
      }))).toBe(target.desiredContentSnapshotHash);
      expect(await sha256Canonical(aiEvidenceLinkSnapshot({
        kind: target.type,
        slug: target.slug,
        sourceIds: target.desiredSourceIds,
      }))).toBe(target.desiredLinkSnapshotHash);
      const auditTarget = AI_PUBLICATION_AUDIT_ARTIFACT.targets.find(
        (candidate) => candidate.type === target.type && candidate.slug === target.slug,
      );
      expect(auditTarget).toMatchObject({
        verdict: 'pass',
        contentSnapshotHash: target.desiredContentSnapshotHash,
        evidenceLinkSnapshotHash: target.desiredLinkSnapshotHash,
        sourceId: target.desiredSourceIds[0],
      });
      expect(auditTarget?.independentAgentResults.map(({ role, verdict }) => ({ role, verdict })))
        .toEqual([
          { role: 'source_research', verdict: 'pass' },
          { role: 'semantic_audit', verdict: 'pass' },
        ]);
    }
    for (const source of AI_PUBLICATION_RELEASE_SOURCES) {
      expect(await sha256Canonical(aiEvidenceSnapshot(source)))
        .toBe(AI_PUBLICATION_RELEASE_SOURCE_HASHES[source.sourceId]);
    }
  });

  it('permits only dated, verified, unexpired HTTPS source snapshots', () => {
    const source = AI_PUBLICATION_RELEASE_SOURCES[0];
    expect(sourceMayEnterAiPublication(source, '2026-08-19')).toBe(true);
    expect(sourceMayEnterAiPublication({ ...source, reviewStatus: 'evidence_required' }, '2026-08-19')).toBe(false);
    expect(sourceMayEnterAiPublication({ ...source, reviewStatus: 'retired' }, '2026-08-19')).toBe(false);
    expect(sourceMayEnterAiPublication({ ...source, year: null }, '2026-08-19')).toBe(false);
    expect(sourceMayEnterAiPublication({ ...source, url: 'http://example.com' }, '2026-08-19')).toBe(false);
    expect(sourceMayEnterAiPublication({ ...source, nextReviewDate: '2026-08-18' }, '2026-08-19')).toBe(false);
  });

  it('requires a recent pass at activation and bounded ongoing expiry', () => {
    const day = 86_400_000;
    const now = Date.parse('2026-08-19T12:00:00Z');
    expect(aiAuditFreshForActivation(now - 7 * day, now)).toBe(true);
    expect(aiAuditFreshForActivation(now - 8 * day, now)).toBe(false);
    expect(aiAuditIsCurrent(now, '2026-11-16', '2026-08-19', now)).toBe(true);
    expect(aiAuditIsCurrent(now, '2026-08-18', '2026-08-19', now)).toBe(false);
    expect(aiAuditIsCurrent(now, '2027-01-01', '2026-08-19', now)).toBe(false);
  });
});
