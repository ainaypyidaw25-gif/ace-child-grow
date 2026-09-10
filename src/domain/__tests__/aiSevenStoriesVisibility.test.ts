import { afterEach, describe, expect, it, vi } from 'vitest';
import { SEVEN_STORIES_ARTIFACT as artifact, SEVEN_STORIES_ARTIFACT_HASH as artifactHash } from '../../../convex/lib/aiSevenStoriesPublication20260910Artifact';
import { SEVEN_STORIES_RELEASE_ROOT as root, SEVEN_STORIES_POLICY_VERSION as policy, SEVEN_STORIES_SLUGS as slugs } from '../../../convex/lib/aiSevenStoriesPublication20260910Data';
import { activeAiPublicationControl, contentIsAiParentReadable, registeredAiPublicationArtifact } from '../../../convex/lib/aiPublicationVisibility';
import { AI_PUBLICATION_MAX_ACTIVE_RELEASES, isAiPublicationTarget } from '../../../convex/lib/aiPublicationPolicy';
import * as hashes from '../../../convex/lib/aiAuditHash';

type Row = Record<string, unknown>;
const realHash = hashes.sha256Canonical;
const now = artifact.auditCompletedAt + 1000;
const date = new Date(now).toISOString().slice(0, 10);
const expiresAt = artifact.auditCompletedAt + 30 * 86_400_000;
const nextAuditDate = new Date(artifact.auditCompletedAt + 29 * 86_400_000).toISOString().slice(0, 10);

/** Only exact synthetic content/link/source/media preimages map to compiled
 * production digests. Artifact, per-target hashes and every audit-output hash
 * remain real SHA-256. Changed fixture data cannot reuse a preimage mapping. */
async function fixture() {
  const tables: Record<string, Row[]> = { libraryContent: [], libraryMedia: [], evidenceLinks: [], evidenceSources: [],
    aiPublicationConfig: [{ _id: 'config', key: 'global', enabled: true, generation: 3 }],
    aiPublicationReleases: [], aiContentAudits: [], aiEvidenceAudits: [], aiAuditRuns: [] };
  const mappings: [unknown, string][] = [];
  for (const target of artifact.targets) {
    const slug = target.slug, releaseId = `${root}:story:${slug}`, contentRunId = `${releaseId}:content`;
    const content = { _id: `content-${slug}`, type: 'story', slug, titleEn: `Synthetic ${slug}`, titleMm: 'ပုံပြင်',
      tags: [], data: { body: { en: 'Synthetic fiction', mm: 'စိတ်ကူးယဉ်ပုံပြင်' } }, source: 'Synthetic AI fiction',
      version: 1, reviewRevision: 3, clinicalStatus: 'clinical_review', updatedAt: 2, aiPublishedAt: now, aiPublicationReleaseId: releaseId };
    const link = { _id: `link-${slug}`, kind: 'story', slug, sourceIds: target.sources.map(s => s.sourceId), updatedAt: 2 };
    const media = ['illustration', 'audio', 'pdf'].map((kind, i) => ({ _id: `media-${slug}-${i}`, contentSlug: slug, kind, placeholder: true }));
    mappings.push([hashes.aiContentSnapshot(content), target.contentSnapshotHash], [hashes.aiEvidenceLinkSnapshot(link), target.evidenceLinkSnapshotHash], [media, target.mediaSnapshotHash]);
    const targetArtifactHash = await realHash(target), summary = `${artifact.summary} Target: story:${slug}.`;
    const limitations = [...target.limitations, ...artifact.limitations];
    const runBase = { releaseId, status: 'completed', provider: artifact.provider, model: artifact.model, modelVersion: artifact.modelVersion,
      policyVersion: policy, gitCommit: 'a'.repeat(40), targetCount: 1, limitations: [...artifact.limitations],
      startedAt: artifact.auditStartedAt, completedAt: artifact.auditCompletedAt };
    tables.aiAuditRuns.push({ ...runBase, _id: contentRunId, runId: contentRunId, summary,
      outputHash: await realHash({ artifactHash, targetArtifactHash }) });
    tables.aiContentAudits.push({ _id: `content-audit-${slug}`, runId: contentRunId, contentSlug: slug, contentType: 'story',
      reviewRevision: 3, contentUpdatedAt: 2, contentSnapshotHash: target.contentSnapshotHash, evidenceLinkUpdatedAt: 2,
      evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash, sourceIds: [...link.sourceIds], verdict: 'pass', checks: [...target.contentChecks],
      limitations, auditedAt: artifact.auditCompletedAt, nextAuditDate,
      outputHash: await realHash({ artifactHash, targetArtifactHash, kind: 'content' }) });
    const sourceSnapshots = [];
    for (const sourceTarget of target.sources) {
      const sourceId = sourceTarget.sourceId, evidenceRunId = `${releaseId}:source:${sourceId}`;
      const source = { _id: `source-${sourceId}`, sourceId, url: sourceTarget.sourceUrl, updatedAt: 2, org: 'Synthetic official source',
        orgKey: 'Synthetic', title: sourceId, authors: null, year: 2026, edition: null, country: null, language: 'en', doi: null,
        isbn: null, pmid: null, evidenceLevel: 'parent_education', reviewStatus: 'awaiting_review', keywords: [], topics: [],
        ageMonthsMin: null, ageMonthsMax: null, verifiedOn: date, verifiedNote: 'Synthetic scope', nextReviewDate: null };
      mappings.push([hashes.aiEvidenceSnapshot(source), sourceTarget.sourceSnapshotHash]);
      if (!tables.evidenceSources.some(s => s.sourceId === sourceId)) tables.evidenceSources.push(source);
      tables.aiAuditRuns.push({ ...runBase, _id: evidenceRunId, runId: evidenceRunId, summary: `${summary} Source: ${sourceId}.`,
        outputHash: await realHash({ artifactHash, targetArtifactHash, sourceId }) });
      tables.aiEvidenceAudits.push({ _id: `audit-${evidenceRunId}`, runId: evidenceRunId, sourceId, sourceUpdatedAt: 2,
        sourceSnapshotHash: sourceTarget.sourceSnapshotHash, verdict: 'pass', claimScope: sourceTarget.claimScope,
        urlsChecked: [...sourceTarget.urlsChecked], findings: [...sourceTarget.evidenceFindings],
        limitations: [...sourceTarget.limitations, ...limitations], auditedAt: artifact.auditCompletedAt, nextAuditDate,
        outputHash: await realHash({ artifactHash, targetArtifactHash, kind: 'evidence', sourceId }) });
      sourceSnapshots.push({ sourceId, sourceUpdatedAt: 2, sourceSnapshotHash: sourceTarget.sourceSnapshotHash, evidenceAuditRunId: evidenceRunId });
    }
    tables.libraryContent.push(content); tables.libraryMedia.push(...media); tables.evidenceLinks.push(link);
    tables.aiPublicationReleases.push({ _id: `release-${slug}`, releaseId, targetKey: `story\0${slug}`, contentId: content._id,
      contentType: 'story', contentSlug: slug, status: 'active', reviewRevision: 3, contentUpdatedAt: 2,
      contentSnapshotHash: target.contentSnapshotHash, evidenceLinkUpdatedAt: 2, evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
      sourceSnapshots, contentAuditRunId: contentRunId, auditArtifactHash: artifactHash, policyVersion: policy, gitCommit: 'a'.repeat(40),
      operator: 'Synthetic operator', createdAt: now, expiresAt });
  }
  const mapping = new Map(await Promise.all(mappings.map(async ([value, hash]) => [await realHash(value), hash] as const)));
  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async value => { const digest = await realHash(value); return mapping.get(digest) ?? digest; });
  const ctx = { db: {
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const builder = { eq(key: string, value: unknown) { conditions.push([key, value]); return builder; } };
      const query = { withIndex(_index: string, fn: (q: typeof builder) => unknown) { fn(builder); return query; },
        async take(count: number) { return (tables[table] ?? []).filter(row => conditions.every(([key, value]) => row[key] === value)).slice(0, count); },
        async unique() { const rows = await query.take(2); if (rows.length > 1) throw new Error('Duplicate'); return rows[0] ?? null; } };
      return query;
    },
  } };
  return { ctx, tables, content: tables.libraryContent[0], release: tables.aiPublicationReleases[0] };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe('exact-seven fiction multi-source visibility', () => {
  it('pins separate schema2 artifact without modifying legacy three-item eligibility', async () => {
    expect(await realHash(artifact)).toBe(artifactHash);
    expect(artifact.targets.map(t => t.slug)).toEqual(slugs);
    expect(AI_PUBLICATION_MAX_ACTIVE_RELEASES).toBe(3);
    for (const slug of slugs) {
      expect(isAiPublicationTarget('story', slug)).toBe(false);
      expect(registeredAiPublicationArtifact(`${root}:story:${slug}`, artifactHash)?.kind).toBe('seven_stories');
    }
    expect(registeredAiPublicationArtifact(`${root}:lesson:st_little_seed`, artifactHash)).toBeNull();
    expect(registeredAiPublicationArtifact(`${root}:story:unknown`, artifactHash)).toBeNull();
    expect(registeredAiPublicationArtifact(`${root}:story:st_little_seed`, 'f'.repeat(64))).toBeNull();
  });
  it('reads every exact source and admits seven plus three legacy identities without synthetic human reviews', async () => {
    vi.stubEnv('AI_PUBLICATION_ENABLED', 'true'); const f = await fixture();
    const preserved = structuredClone(f.tables);
    for (const content of f.tables.libraryContent) expect(await contentIsAiParentReadable(f.ctx as never, content as never, now, date)).toBe(true);
    expect(f.tables.aiEvidenceAudits).toHaveLength(18);
    expect(f.tables.aiAuditRuns).toHaveLength(25);
    expect(f.tables).toEqual(preserved);
    for (const [type, slug] of [['lesson', 'lsn_early_math'], ['story', 'st_waiting_at_clinic'], ['story', 'st_first_day_school']]) {
      f.tables.aiPublicationReleases.push({ releaseId: `legacy-${slug}`, status: 'active', contentType: type, contentSlug: slug, targetKey: `${type}\0${slug}` });
    }
    expect((await activeAiPublicationControl(f.ctx as never)).releases).toHaveLength(10);
    expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, now, date)).toBe(true);
  });
  it.each(['extra_target', 'missing_target', 'duplicate_target', 'nonstory', 'unknown_slug', 'duplicate_source', 'missing_registered_url'] as const)('rejects malformed compiled registry scope: %s', drift => {
    const targets = artifact.targets as unknown as Row[];
    const saved = [...targets];
    try {
      if (drift === 'extra_target') targets.push({ ...targets[0], slug: 'unreviewed-story' });
      if (drift === 'missing_target') targets.pop();
      if (drift === 'duplicate_target') targets[1] = targets[0];
      if (drift === 'nonstory') targets[0] = { ...targets[0], type: 'lesson' };
      if (drift === 'unknown_slug') targets[0] = { ...targets[0], slug: 'unreviewed-story' };
      const sources = targets[0].sources as Row[];
      if (drift === 'duplicate_source') targets[0] = { ...targets[0], sources: [sources[0], sources[0]] };
      if (drift === 'missing_registered_url') targets[0] = { ...targets[0], sources: [{ ...sources[0], urlsChecked: ['https://example.com'] }, ...sources.slice(1)] };
      expect(registeredAiPublicationArtifact(`${root}:story:st_little_seed`, artifactHash)).toBeNull();
    } finally { targets.splice(0, targets.length, ...saved); }
  });
  it.each(['master_off', 'disabled', 'duplicate_config', 'duplicate_target', 'duplicate_release_id', 'unknown_target', 'overflow', 'copy', 'revision',
    'human_summary', 'wrong_type', 'pointer', 'policy', 'link_order', 'link_duplicate', 'source_change', 'source_retired',
    'source_duplicate', 'source_missing', 'missing_second_audit', 'duplicate_audit', 'wrong_source_run', 'shared_source_run',
    'audit_hash', 'source_run_policy', 'source_run_summary', 'source_run_hash', 'urls', 'findings', 'limitations',
    'content_audit_duplicate', 'content_run_missing', 'content_checks', 'content_run_policy', 'source_run_duplicate',
    'media_url', 'media_metadata', 'media_overflow', 'expired'] as const)('fails dark after %s drift', async drift => {
    vi.stubEnv('AI_PUBLICATION_ENABLED', 'true'); const f = await fixture();
    const sourceId = artifact.targets[0].sources[1].sourceId;
    const audit = f.tables.aiEvidenceAudits.find(a => a.sourceId === sourceId && String(a.runId).startsWith(String(f.release.releaseId)))!;
    const run = f.tables.aiAuditRuns.find(r => r.runId === audit.runId)!;
    const snapshots = f.release.sourceSnapshots as Row[];
    if (drift === 'master_off') vi.stubEnv('AI_PUBLICATION_ENABLED', 'false');
    if (drift === 'disabled') f.tables.aiPublicationConfig[0].enabled = false;
    if (drift === 'duplicate_config') f.tables.aiPublicationConfig.push({ ...f.tables.aiPublicationConfig[0] });
    if (drift === 'duplicate_target') f.tables.aiPublicationReleases.push({ ...f.release });
    if (drift === 'duplicate_release_id') f.tables.aiPublicationReleases[1].releaseId = f.release.releaseId;
    if (drift === 'unknown_target') f.tables.aiPublicationReleases.push({ status: 'active', contentType: 'story', contentSlug: 'unknown', targetKey: 'story\0unknown' });
    if (drift === 'overflow') for (let i = 0; i < 4; i++) f.tables.aiPublicationReleases.push({ ...f.release });
    if (drift === 'copy') f.content.titleMm = 'Changed';
    if (drift === 'revision') f.content.reviewRevision = 4;
    if (drift === 'human_summary') f.content.reviewerId = 'forged';
    if (drift === 'wrong_type') f.content.type = 'lesson';
    if (drift === 'pointer') f.content.aiPublicationReleaseId = 'wrong';
    if (drift === 'policy') f.release.policyVersion = 'ai-educational-preview-v1';
    if (drift === 'link_order') (f.tables.evidenceLinks[0].sourceIds as string[]).reverse();
    if (drift === 'link_duplicate') f.tables.evidenceLinks.push({ ...f.tables.evidenceLinks[0], kind: 'guide' });
    if (drift === 'source_change') f.tables.evidenceSources.find(s => s.sourceId === sourceId)!.title = 'Changed';
    if (drift === 'source_retired') f.tables.evidenceSources.find(s => s.sourceId === sourceId)!.reviewStatus = 'retired';
    if (drift === 'source_duplicate') f.tables.evidenceSources.push({ ...f.tables.evidenceSources.find(s => s.sourceId === sourceId)! });
    if (drift === 'source_missing') f.tables.evidenceSources = f.tables.evidenceSources.filter(s => s.sourceId !== sourceId);
    if (drift === 'missing_second_audit') f.tables.aiEvidenceAudits = f.tables.aiEvidenceAudits.filter(a => a !== audit);
    if (drift === 'duplicate_audit') f.tables.aiEvidenceAudits.push({ ...audit });
    if (drift === 'wrong_source_run') snapshots[1].evidenceAuditRunId = f.release.contentAuditRunId;
    if (drift === 'shared_source_run') snapshots[1].evidenceAuditRunId = snapshots[0].evidenceAuditRunId;
    if (drift === 'audit_hash') audit.outputHash = 'f'.repeat(64);
    if (drift === 'source_run_policy') run.policyVersion = 'other';
    if (drift === 'source_run_summary') run.summary = 'invented';
    if (drift === 'source_run_hash') run.outputHash = 'f'.repeat(64);
    if (drift === 'urls') audit.urlsChecked = ['https://example.com'];
    if (drift === 'findings') audit.findings = ['invented'];
    if (drift === 'limitations') audit.limitations = [];
    if (drift === 'content_audit_duplicate') f.tables.aiContentAudits.push({ ...f.tables.aiContentAudits[0] });
    if (drift === 'content_run_missing') f.tables.aiAuditRuns = f.tables.aiAuditRuns.filter(r => r.runId !== f.release.contentAuditRunId);
    if (drift === 'content_checks') f.tables.aiContentAudits[0].checks = [];
    if (drift === 'content_run_policy') f.tables.aiAuditRuns.find(r => r.runId === f.release.contentAuditRunId)!.policyVersion = 'other';
    if (drift === 'source_run_duplicate') f.tables.aiAuditRuns.push({ ...run });
    if (drift === 'media_url') f.tables.libraryMedia[0].url = 'https://example.com/new.png';
    if (drift === 'media_metadata') f.tables.libraryMedia[0].note = 'unreviewed';
    if (drift === 'media_overflow') for (let i = 0; i < 101; i++) f.tables.libraryMedia.push({ ...f.tables.libraryMedia[0], _id: `overflow-${i}` });
    expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, drift === 'expired' ? expiresAt + 1 : now, date)).toBe(false);
  });
});
