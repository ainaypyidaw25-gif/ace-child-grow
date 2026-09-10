import { afterEach, describe, expect, it, vi } from 'vitest';
import { TWO_LESSONS_ARTIFACT as artifact, TWO_LESSONS_ARTIFACT_HASH as artifactHash } from '../../../convex/lib/aiTwoLessonsPublication20260910Artifact';
import { TWO_LESSONS_PREIMAGE as preimages, TWO_LESSONS_RELEASE_ROOT as root, TWO_LESSONS_RELEASE_DAYS as releaseDays } from '../../../convex/lib/aiTwoLessonsPublication20260910Data';
import { POWER_OF_PLAY_ARTIFACT, POWER_OF_PLAY_ARTIFACT_HASH } from '../../../convex/lib/aiPowerOfPlayPublication20260910Artifact';
import { POWER_OF_PLAY_RELEASE_DAYS } from '../../../convex/lib/aiPowerOfPlayPublication20260910Data';
import { READING_TOGETHER_ARTIFACT, READING_TOGETHER_ARTIFACT_HASH } from '../../../convex/lib/aiReadingTogetherPublication20260910Artifact';
import { READING_TOGETHER_RELEASE_DAYS } from '../../../convex/lib/aiReadingTogetherPublication20260910Data';
import { SEVEN_STORIES_ARTIFACT, SEVEN_STORIES_ARTIFACT_HASH } from '../../../convex/lib/aiSevenStoriesPublication20260910Artifact';
import { SEVEN_STORIES_RELEASE_DAYS } from '../../../convex/lib/aiSevenStoriesPublication20260910Data';
import { EARLY_MATH_AUDIT_ARTIFACT, EARLY_MATH_AUDIT_ARTIFACT_HASH } from '../../../convex/lib/aiEarlyMathPublication20260910Artifact';
import { EARLY_MATH_RELEASE_DAYS } from '../../../convex/lib/aiEarlyMathPublication20260910Data';
import { TWO_STORIES_ARTIFACT, TWO_STORIES_ARTIFACT_HASH } from '../../../convex/lib/aiTwoStoriesPublication20260910Artifact';
import { TWO_STORIES_RELEASE_DAYS } from '../../../convex/lib/aiTwoStoriesPublication20260910Data';
import { activeAiParentReadableContent, activeAiPublicationControl, contentIsAiParentReadable, registeredAiPublicationArtifact, type Schema2AuditArtifact } from '../../../convex/lib/aiPublicationVisibility';
import { AI_PUBLICATION_MAX_ACTIVE_RELEASES, isAiPublicationTarget } from '../../../convex/lib/aiPublicationPolicy';
import * as hashes from '../../../convex/lib/aiAuditHash';

type Row = Record<string, unknown>;
type Artifact = Schema2AuditArtifact | typeof EARLY_MATH_AUDIT_ARTIFACT | typeof TWO_STORIES_ARTIFACT;
const realHash = hashes.sha256Canonical;
const now = artifact.auditCompletedAt + 1_000;
const date = new Date(now).toISOString().slice(0, 10);
const slug = 'lsn_what_is_development';
const releaseId = `${root}:lesson:${slug}`;

/** Complete synthetic payloads for every lane. Only content/link/source/media
 * snapshots map to pinned digests; artifacts and audit output hashes stay real.
 * No visibility helper is mocked. This does not substitute for a live packet. */
async function fixture(previous = false) {
  vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
  const tables: Record<string, Row[]> = {
    libraryContent: [], evidenceLinks: [], libraryMedia: [], evidenceSources: [],
    aiPublicationConfig: [{ _id: 'config', key: 'global', enabled: true, generation: 3 }],
    aiPublicationReleases: [], aiAuditRuns: [], aiContentAudits: [], aiEvidenceAudits: [], contentReviews: [],
  };
  const mappings = new Map<string, string>();
  const map = async (value: unknown, expected: string) => {
    const digest = await realHash(value);
    const existing = mappings.get(digest);
    if (existing && existing !== expected) throw new Error('Conflicting shared source snapshot fixture');
    mappings.set(digest, expected);
  };
  async function addLane(a: Artifact, hash: string, days: number) {
    for (const target of a.targets) {
      const id = `${a.releaseId}:${target.type}:${target.slug}`;
      const schema2 = 'sources' in target;
      const sources = 'sources' in target ? target.sources : [{
        sourceId: target.sourceId, sourceSnapshotHash: target.sourceSnapshotHash,
        sourceUrl: target.sourceUrl, claimScope: target.claimScope,
        urlsChecked: [target.sourceUrl], evidenceFindings: target.evidenceFindings, limitations: [],
      }];
      const revision = target.slug === 'lsn_early_math' ? 11 : target.slug === 'lsn_reading_together' ? 4 : target.slug === 'lsn_big_feelings' ? 5 : 3;
      const content: Row = {
        _id: `content-${target.slug}`, type: target.type, slug: target.slug,
        titleEn: `Synthetic ${target.slug}`, titleMm: 'စမ်းသပ်', tags: [],
        data: { body: { en: 'Synthetic education', mm: 'စမ်းသပ်' } }, source: 'Synthetic', version: 1,
        reviewRevision: revision, clinicalStatus: 'clinical_review', updatedAt: 2,
        aiPublishedAt: now, aiPublicationReleaseId: id,
      };
      const link: Row = { _id: `link-${target.slug}`, kind: target.type, slug: target.slug, sourceIds: sources.map(s => s.sourceId), updatedAt: 2 };
      tables.libraryContent.push(content);
      tables.evidenceLinks.push(link);
      await map(hashes.aiContentSnapshot(content as never), target.contentSnapshotHash);
      await map(hashes.aiEvidenceLinkSnapshot(link as never), target.evidenceLinkSnapshotHash);
      if ('mediaCount' in target) {
        const media = Array.from({ length: target.mediaCount }, (_, index) => ({
          _id: `media-${target.slug}-${index}`, contentSlug: target.slug, kind: 'illustration', placeholder: true,
        }));
        tables.libraryMedia.push(...media);
        await map(media, target.mediaSnapshotHash);
      }
      const targetArtifactHash = await realHash(target);
      const output = (extra: Row = {}) => realHash({ artifactHash: hash, targetArtifactHash, ...extra });
      const summary = `${a.summary} Target: ${target.type}:${target.slug}.`;
      const limitations = [...target.limitations, ...a.limitations];
      const nextAuditDate = new Date(a.auditCompletedAt + (days - 1) * 86_400_000).toISOString().slice(0, 10);
      const runBase = {
        releaseId: id, status: 'completed', provider: a.provider, model: a.model, modelVersion: a.modelVersion,
        policyVersion: a.policyVersion, gitCommit: 'a'.repeat(40), targetCount: 1, limitations: [...a.limitations],
        startedAt: a.auditStartedAt, completedAt: a.auditCompletedAt,
      };
      const contentRunId = `${id}:content`;
      tables.aiAuditRuns.push({ ...runBase, _id: contentRunId, runId: contentRunId, summary, outputHash: await output() });
      tables.aiContentAudits.push({
        _id: `${id}:content-audit`, runId: contentRunId, contentSlug: target.slug, contentType: target.type,
        reviewRevision: revision, contentUpdatedAt: 2, contentSnapshotHash: target.contentSnapshotHash,
        evidenceLinkUpdatedAt: 2, evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
        sourceIds: [...link.sourceIds as string[]], verdict: 'pass', checks: [...target.contentChecks], limitations,
        auditedAt: a.auditCompletedAt, nextAuditDate, outputHash: await output({ kind: 'content' }),
      });
      const snapshots: Row[] = [];
      for (const s of sources) {
        let source = tables.evidenceSources.find(row => row.sourceId === s.sourceId);
        if (!source) {
          source = {
            _id: `source-${s.sourceId}`, sourceId: s.sourceId, url: s.sourceUrl, updatedAt: 2,
            org: 'Synthetic publisher', orgKey: 'Synthetic', title: s.sourceId, authors: null,
            year: 2026, edition: null, country: null, language: 'en', doi: null, isbn: null, pmid: null,
            evidenceLevel: 'parent_education', reviewStatus: 'awaiting_review', keywords: [], topics: [],
            ageMonthsMin: null, ageMonthsMax: null, verifiedOn: date, verifiedNote: 'Synthetic source', nextReviewDate: null,
          };
          tables.evidenceSources.push(source);
        }
        await map(hashes.aiEvidenceSnapshot(source as never), s.sourceSnapshotHash);
        const runId = `${id}:evidence:${s.sourceId}`;
        tables.aiAuditRuns.push({ ...runBase, _id: runId, runId,
          summary: schema2 ? `${summary} Source: ${s.sourceId}.` : summary,
          outputHash: await output(schema2 ? { sourceId: s.sourceId } : {}),
        });
        tables.aiEvidenceAudits.push({
          _id: `${runId}:audit`, runId, sourceId: s.sourceId, sourceUpdatedAt: 2, sourceSnapshotHash: s.sourceSnapshotHash,
          verdict: 'pass', claimScope: s.claimScope, urlsChecked: [...s.urlsChecked], findings: [...s.evidenceFindings],
          limitations: schema2 ? [...s.limitations, ...limitations] : limitations,
          auditedAt: a.auditCompletedAt, nextAuditDate,
          outputHash: await output({ kind: 'evidence', ...(schema2 ? { sourceId: s.sourceId } : {}) }),
        });
        snapshots.push({ sourceId: s.sourceId, sourceUpdatedAt: 2, sourceSnapshotHash: s.sourceSnapshotHash, evidenceAuditRunId: runId });
      }
      tables.aiPublicationReleases.push({
        _id: id, releaseId: id, targetKey: `${target.type}\0${target.slug}`, contentId: content._id,
        contentType: target.type, contentSlug: target.slug, status: 'active', reviewRevision: revision, contentUpdatedAt: 2,
        contentSnapshotHash: target.contentSnapshotHash, evidenceLinkUpdatedAt: 2, evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
        sourceSnapshots: snapshots, contentAuditRunId: contentRunId, auditArtifactHash: hash, policyVersion: a.policyVersion,
        gitCommit: 'a'.repeat(40), operator: 'Synthetic', createdAt: now, expiresAt: a.auditCompletedAt + days * 86_400_000,
      });
    }
  }
  if (previous) {
    await addLane(EARLY_MATH_AUDIT_ARTIFACT, EARLY_MATH_AUDIT_ARTIFACT_HASH, EARLY_MATH_RELEASE_DAYS);
    await addLane(TWO_STORIES_ARTIFACT, TWO_STORIES_ARTIFACT_HASH, TWO_STORIES_RELEASE_DAYS);
    await addLane(SEVEN_STORIES_ARTIFACT, SEVEN_STORIES_ARTIFACT_HASH, SEVEN_STORIES_RELEASE_DAYS);
    await addLane(READING_TOGETHER_ARTIFACT, READING_TOGETHER_ARTIFACT_HASH, READING_TOGETHER_RELEASE_DAYS);
    await addLane(POWER_OF_PLAY_ARTIFACT, POWER_OF_PLAY_ARTIFACT_HASH, POWER_OF_PLAY_RELEASE_DAYS);
  }
  await addLane(artifact, artifactHash, releaseDays);
  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async value => {
    const digest = await realHash(value);
    return mappings.get(digest) ?? digest;
  });
  const ctx = { db: {
    async get(id: string) { return Object.values(tables).flat().find(row => row._id === id) ?? null; },
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const builder = { eq(key: string, value: unknown) { conditions.push([key, value]); return builder; } };
      const query = {
        withIndex(_index: string, callback: (q: typeof builder) => unknown) { callback(builder); return query; },
        async take(n: number) { return (tables[table] ?? []).filter(row => conditions.every(([k, v]) => row[k] === v)).slice(0, n); },
        async unique() { const rows = await query.take(2); if (rows.length > 1) throw new Error('Duplicate'); return rows[0] ?? null; },
      };
      return query;
    },
  } };
  return { ctx, tables,
    content: tables.libraryContent.find(row => row.slug === slug)!,
    release: tables.aiPublicationReleases.find(row => row.releaseId === releaseId)!,
  };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('exact two-lesson schema2 visibility', () => {
  it('pins the real artifact and accepts only its exact registered lesson', async () => {
    expect(await realHash(artifact)).toBe(artifactHash);
    expect(artifact.targets).toHaveLength(2);
    expect(preimages.targets.map(target => target.desiredRevision)).toEqual([3, 5]);
    expect(artifact.targets.map(target => target.sources.length)).toEqual([1, 1]);
    expect(artifact.targets[0].mediaCount).toBe(1);
    expect(registeredAiPublicationArtifact(releaseId, artifactHash)?.kind).toBe('two_lessons');
    expect(registeredAiPublicationArtifact(releaseId.replace(':lesson:', ':story:'), artifactHash)).toBeNull();
    expect(registeredAiPublicationArtifact(`${releaseId}-other`, artifactHash)).toBeNull();
    expect(registeredAiPublicationArtifact(releaseId, 'f'.repeat(64))).toBeNull();
    expect(isAiPublicationTarget('lesson', slug)).toBe(false);
    expect(AI_PUBLICATION_MAX_ACTIVE_RELEASES).toBe(3);
    expect(artifact.targets.map(target => target.slug)).toEqual(['lsn_what_is_development', 'lsn_big_feelings']);
    expect(artifact.targets.map(target => target.sources[0].sourceId)).toEqual(['cdc-monitoring-screening-2026', 'aap-toxic-stress-2021']);
    expect(registeredAiPublicationArtifact(`${root}:lesson:lsn_big_feelings`, artifactHash)?.kind).toBe('two_lessons');
    expect(registeredAiPublicationArtifact(`${root}:lesson:lsn_creativity`, artifactHash)).toBeNull();
  });

  it.each(['duplicate', 'unknown', 'extra', 'order', 'source', 'media', 'missing_report'] as const)(
    'rejects compiled batch scope drift: %s', drift => {
      const mutable = artifact as unknown as { targets: Row[] };
      const original = mutable.targets;
      try {
        mutable.targets = structuredClone(original);
        if (drift === 'duplicate') mutable.targets[1] = structuredClone(mutable.targets[0]);
        if (drift === 'unknown') mutable.targets[1].slug = 'lsn_creativity';
        if (drift === 'extra') mutable.targets.push(structuredClone(mutable.targets[0]));
        if (drift === 'order') mutable.targets.reverse();
        if (drift === 'source') (mutable.targets[1].sources as Row[])[0].sourceId = 'cdc-monitoring-screening-2026';
        if (drift === 'media') mutable.targets[1].mediaCount = 2;
        if (drift === 'missing_report') mutable.targets[1].independentAgentResults = [];
        expect(registeredAiPublicationArtifact(releaseId, artifactHash)).toBeNull();
      } finally { mutable.targets = original; }
    },
  );

  it.each(['copy', 'revision', 'swapped_source', 'source_audit', 'media', 'human_summary'] as const)(
    'fails dark for the second lesson independently: %s', async drift => {
      const f = await fixture();
      const content = f.tables.libraryContent.find(row => row.slug === 'lsn_big_feelings')!;
      const release = f.tables.aiPublicationReleases.find(row => row.contentSlug === content.slug)!;
      const link = f.tables.evidenceLinks.find(row => row.slug === content.slug)!;
      if (drift === 'copy') content.summaryMm = 'changed';
      if (drift === 'revision') content.reviewRevision = 3;
      if (drift === 'swapped_source') link.sourceIds = ['cdc-monitoring-screening-2026'];
      if (drift === 'source_audit') (release.sourceSnapshots as Row[])[0].evidenceAuditRunId = (f.release.sourceSnapshots as Row[])[0].evidenceAuditRunId;
      if (drift === 'media') f.tables.libraryMedia.find(row => row.contentSlug === content.slug)!.url = 'https://example.invalid/new.png';
      if (drift === 'human_summary') content.reviewScope = 'clinical';
      expect(await contentIsAiParentReadable(f.ctx as never, content as never, now, date)).toBe(false);
      expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, now, date)).toBe(true);
    },
  );

  it('reads exact r3 and r5 with separately bound audits and no human approvals or writes', async () => {
    const f = await fixture();
    const before = structuredClone(f.tables);
    expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, now, date)).toBe(true);
    expect(await contentIsAiParentReadable(f.ctx as never, f.tables.libraryContent[1] as never, now, date)).toBe(true);
    expect(f.tables.aiAuditRuns).toHaveLength(4);
    expect(f.tables.aiEvidenceAudits).toHaveLength(2);
    expect(f.tables).toEqual(before);
  });

  it('keeps all prior twelve actually readable alongside both new lessons with complete audits', async () => {
    const f = await fixture(true);
    const before = structuredClone(f.tables);
    expect((await activeAiPublicationControl(f.ctx as never)).releases).toHaveLength(14);
    const result = await activeAiParentReadableContent(f.ctx as never, now);
    expect(result.complete).toBe(true);
    expect(result.rows.map(row => row.slug).sort()).toEqual(f.tables.libraryContent.map(row => row.slug).sort());
    expect(result.rows).toHaveLength(14);
    for (const content of f.tables.libraryContent) {
      expect(await contentIsAiParentReadable(f.ctx as never, content as never, now, date)).toBe(true);
    }
    expect(f.tables).toEqual(before);
  });

  it.each(['copy', 'revision', 'type', 'status', 'human_summary', 'pointer', 'timestamp', 'policy',
    'link_extra', 'link_duplicate', 'source_missing', 'source_duplicate', 'source_drift', 'source_retired',
    'evidence_missing', 'evidence_duplicate', 'audit_hash', 'audit_urls', 'audit_findings', 'audit_limits',
    'run_duplicate', 'run_hash', 'run_summary', 'run_missing', 'shared_source_run', 'content_as_source_run',
    'content_audit_duplicate', 'content_audit_checks', 'media_url', 'media_storage', 'media_missing', 'media_extra',
    'media_changed', 'media_not_placeholder', 'expired', 'audit_expired', 'master_off', 'config_off', 'duplicate_config',
    'unknown_artifact', 'duplicate_target', 'duplicate_release_id', 'unknown_target', 'overflow'] as const)(
    'fails closed for %s', async drift => {
      const f = await fixture(drift === 'overflow');
      const audit = f.tables.aiEvidenceAudits.find(row => String(row.runId).startsWith(releaseId))!;
      const run = f.tables.aiAuditRuns.find(row => row.runId === audit.runId)!;
      const snapshots = f.release.sourceSnapshots as Row[];
      if (drift === 'copy') f.content.titleMm = 'changed';
      if (drift === 'revision') f.content.reviewRevision = 4;
      if (drift === 'type') f.content.type = 'story';
      if (drift === 'status') f.content.clinicalStatus = 'published';
      if (drift === 'human_summary') f.content.reviewerId = 'fabricated';
      if (drift === 'pointer') f.content.aiPublicationReleaseId = 'wrong';
      if (drift === 'timestamp') f.content.aiPublishedAt = now + 1;
      if (drift === 'policy') f.release.policyVersion = 'wrong';
      if (drift === 'link_extra') (f.tables.evidenceLinks[0].sourceIds as string[]).push('unreviewed-source');
      if (drift === 'link_duplicate') f.tables.evidenceLinks.push({ ...f.tables.evidenceLinks[0] });
      if (drift === 'source_missing') f.tables.evidenceSources.shift();
      if (drift === 'source_duplicate') f.tables.evidenceSources.push({ ...f.tables.evidenceSources[0] });
      if (drift === 'source_drift') f.tables.evidenceSources[0].title = 'changed';
      if (drift === 'source_retired') f.tables.evidenceSources[0].reviewStatus = 'retired';
      if (drift === 'evidence_missing') f.tables.aiEvidenceAudits.shift();
      if (drift === 'evidence_duplicate') f.tables.aiEvidenceAudits.push({ ...audit });
      if (drift === 'audit_hash') audit.outputHash = 'f'.repeat(64);
      if (drift === 'audit_urls') audit.urlsChecked = [];
      if (drift === 'audit_findings') audit.findings = ['invented'];
      if (drift === 'audit_limits') audit.limitations = [];
      if (drift === 'run_duplicate') f.tables.aiAuditRuns.push({ ...run });
      if (drift === 'run_hash') run.outputHash = 'f'.repeat(64);
      if (drift === 'run_summary') run.summary = 'invented';
      if (drift === 'run_missing') f.tables.aiAuditRuns = f.tables.aiAuditRuns.filter(row => row !== run);
      if (drift === 'shared_source_run') snapshots[0].evidenceAuditRunId = (f.tables.aiPublicationReleases[1].sourceSnapshots as Row[])[0].evidenceAuditRunId;
      if (drift === 'content_as_source_run') snapshots[0].evidenceAuditRunId = f.release.contentAuditRunId;
      if (drift === 'content_audit_duplicate') f.tables.aiContentAudits.push({ ...f.tables.aiContentAudits[0] });
      if (drift === 'content_audit_checks') f.tables.aiContentAudits[0].checks = [];
      if (drift === 'media_url') f.tables.libraryMedia[0].url = 'https://example.invalid/new.png';
      if (drift === 'media_storage') f.tables.libraryMedia[0].storageId = 'new';
      if (drift === 'media_missing') f.tables.libraryMedia = [];
      if (drift === 'media_extra') f.tables.libraryMedia.push({ ...f.tables.libraryMedia[0], _id: 'new' });
      if (drift === 'media_changed') f.tables.libraryMedia[0].note = 'changed';
      if (drift === 'media_not_placeholder') f.tables.libraryMedia[0].placeholder = false;
      if (drift === 'master_off') vi.stubEnv('AI_PUBLICATION_ENABLED', 'false');
      if (drift === 'config_off') f.tables.aiPublicationConfig[0].enabled = false;
      if (drift === 'duplicate_config') f.tables.aiPublicationConfig.push({ ...f.tables.aiPublicationConfig[0] });
      if (drift === 'unknown_artifact') f.release.auditArtifactHash = 'f'.repeat(64);
      if (drift === 'duplicate_target' || drift === 'overflow') f.tables.aiPublicationReleases.push({ ...f.release, _id: 'other', releaseId: 'other-root' });
      if (drift === 'duplicate_release_id') f.tables.aiPublicationReleases.push({ ...f.release, _id: 'other', targetKey: 'lesson\0lsn_reading_together', contentSlug: 'lsn_reading_together' });
      if (drift === 'unknown_target') f.tables.aiPublicationReleases.push({ _id: 'unknown', status: 'active', releaseId: 'unknown', contentType: 'lesson', contentSlug: 'lsn_creativity', targetKey: 'lesson\0lsn_creativity' });
      const checkedAt = drift === 'expired' ? Number(f.release.expiresAt) + 1 : now;
      const checkedDate = drift === 'audit_expired' ? '2099-01-01' : date;
      expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, checkedAt, checkedDate)).toBe(false);
    },
  );
});
