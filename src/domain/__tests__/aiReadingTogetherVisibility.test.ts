import { afterEach, describe, expect, it, vi } from 'vitest';
import { READING_TOGETHER_ARTIFACT as artifact, READING_TOGETHER_ARTIFACT_HASH as artifactHash } from '../../../convex/lib/aiReadingTogetherPublication20260910Artifact';
import {
  READING_TOGETHER_RELEASE_ID as releaseId,
  READING_TOGETHER_CONTENT_RUN_ID as contentRunId,
  READING_TOGETHER_POLICY_VERSION as policy,
  READING_TOGETHER_PREIMAGE as preimage,
  READING_TOGETHER_SLUG as slug,
  READING_TOGETHER_RELEASE_DAYS as releaseDays,
  readingTogetherSourceRunId,
} from '../../../convex/lib/aiReadingTogetherPublication20260910Data';
import { SEVEN_STORIES_SLUGS } from '../../../convex/lib/aiSevenStoriesPublication20260910Data';
import { activeAiPublicationControl, contentIsAiParentReadable, registeredAiPublicationArtifact } from '../../../convex/lib/aiPublicationVisibility';
import { AI_PUBLICATION_MAX_ACTIVE_RELEASES, isAiPublicationTarget } from '../../../convex/lib/aiPublicationPolicy';
import * as hashes from '../../../convex/lib/aiAuditHash';

type Row = Record<string, unknown>;
const realHash = hashes.sha256Canonical;
const target = artifact.targets[0];
const now = artifact.auditCompletedAt + 1000;
const date = new Date(now).toISOString().slice(0, 10);
const expiresAt = artifact.auditCompletedAt + releaseDays * 86_400_000;
const nextAuditDate = new Date(artifact.auditCompletedAt + (releaseDays - 1) * 86_400_000).toISOString().slice(0, 10);

/** Only complete synthetic content/link/source/media preimages map to compiled
 * digests. The artifact and audit-output hashes remain real SHA-256. Altering
 * any mapped fixture value therefore invalidates its compiled hash. This is a
 * runtime unit test, not proof of a real production snapshot or activation. */
async function fixture() {
  const content = {
    _id: 'reading-content', type: 'lesson', slug, titleEn: 'Synthetic reading lesson', titleMm: 'စာအတူဖတ်ခြင်း',
    tags: [], data: { body: { en: 'Synthetic shared reading guidance', mm: 'စာအတူဖတ်ရန် လမ်းညွှန်ချက်' } },
    source: 'Synthetic AI-reviewed education', version: 1, reviewRevision: 4,
    clinicalStatus: 'clinical_review', updatedAt: 2, aiPublishedAt: now, aiPublicationReleaseId: releaseId,
  };
  const link = { _id: 'reading-link', kind: 'lesson', slug, sourceIds: target.sources.map(s => s.sourceId), updatedAt: 2 };
  const media = [{ _id: 'reading-media', contentSlug: slug, kind: 'illustration', placeholder: true }];
  const tables: Record<string, Row[]> = {
    libraryContent: [content], evidenceLinks: [link], libraryMedia: media, evidenceSources: [],
    aiPublicationConfig: [{ _id: 'config', key: 'global', enabled: true, generation: 3 }],
    aiPublicationReleases: [], aiAuditRuns: [], aiContentAudits: [], aiEvidenceAudits: [], contentReviews: [],
  };
  const mappings: [unknown, string][] = [
    [hashes.aiContentSnapshot(content), target.contentSnapshotHash],
    [hashes.aiEvidenceLinkSnapshot(link), target.evidenceLinkSnapshotHash],
    [media, target.mediaSnapshotHash],
  ];
  const targetArtifactHash = await realHash(target);
  const summary = `${artifact.summary} Target: lesson:${slug}.`;
  const limitations = [...target.limitations, ...artifact.limitations];
  const runBase = {
    releaseId, status: 'completed', provider: artifact.provider, model: artifact.model, modelVersion: artifact.modelVersion,
    policyVersion: policy, gitCommit: 'a'.repeat(40), targetCount: 1, limitations: [...artifact.limitations],
    startedAt: artifact.auditStartedAt, completedAt: artifact.auditCompletedAt,
  };
  tables.aiAuditRuns.push({ ...runBase, _id: contentRunId, runId: contentRunId, summary,
    outputHash: await realHash({ artifactHash, targetArtifactHash }) });
  tables.aiContentAudits.push({
    _id: 'reading-content-audit', runId: contentRunId, contentSlug: slug, contentType: 'lesson',
    reviewRevision: 4, contentUpdatedAt: 2, contentSnapshotHash: target.contentSnapshotHash,
    evidenceLinkUpdatedAt: 2, evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
    sourceIds: [...link.sourceIds], verdict: 'pass', checks: [...target.contentChecks], limitations,
    auditedAt: artifact.auditCompletedAt, nextAuditDate,
    outputHash: await realHash({ artifactHash, targetArtifactHash, kind: 'content' }),
  });
  const sourceSnapshots = [];
  for (const expected of target.sources) {
    const sourceId = expected.sourceId;
    const runId = readingTogetherSourceRunId(sourceId);
    const source = {
      _id: `source-${sourceId}`, sourceId, url: expected.sourceUrl, updatedAt: 2,
      org: 'Synthetic publisher', orgKey: 'Synthetic', title: sourceId, authors: null, year: 2026, edition: null,
      country: null, language: 'en', doi: null, isbn: null, pmid: null, evidenceLevel: 'parent_education',
      reviewStatus: 'awaiting_review', keywords: [], topics: [], ageMonthsMin: null, ageMonthsMax: null,
      verifiedOn: date, verifiedNote: 'Synthetic source scope', nextReviewDate: null,
    };
    mappings.push([hashes.aiEvidenceSnapshot(source), expected.sourceSnapshotHash]);
    tables.evidenceSources.push(source);
    tables.aiAuditRuns.push({ ...runBase, _id: runId, runId, summary: `${summary} Source: ${sourceId}.`,
      outputHash: await realHash({ artifactHash, targetArtifactHash, sourceId }) });
    tables.aiEvidenceAudits.push({
      _id: `audit-${sourceId}`, runId, sourceId, sourceUpdatedAt: 2, sourceSnapshotHash: expected.sourceSnapshotHash,
      verdict: 'pass', claimScope: expected.claimScope, urlsChecked: [...expected.urlsChecked],
      findings: [...expected.evidenceFindings], limitations: [...expected.limitations, ...limitations],
      auditedAt: artifact.auditCompletedAt, nextAuditDate,
      outputHash: await realHash({ artifactHash, targetArtifactHash, kind: 'evidence', sourceId }),
    });
    sourceSnapshots.push({ sourceId, sourceUpdatedAt: 2, sourceSnapshotHash: expected.sourceSnapshotHash, evidenceAuditRunId: runId });
  }
  const release: Row = {
    _id: 'reading-release', releaseId, targetKey: `lesson\0${slug}`, contentId: content._id,
    contentType: 'lesson', contentSlug: slug, status: 'active', reviewRevision: 4, contentUpdatedAt: 2,
    contentSnapshotHash: target.contentSnapshotHash, evidenceLinkUpdatedAt: 2, evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
    sourceSnapshots, contentAuditRunId: contentRunId, auditArtifactHash: artifactHash, policyVersion: policy,
    gitCommit: 'a'.repeat(40), operator: 'Synthetic operator', createdAt: now, expiresAt,
  };
  tables.aiPublicationReleases.push(release);
  const mapping = new Map(await Promise.all(mappings.map(async ([value, hash]) => [await realHash(value), hash] as const)));
  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async value => {
    const digest = await realHash(value);
    return mapping.get(digest) ?? digest;
  });
  const ctx = { db: {
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const builder = { eq(key: string, value: unknown) { conditions.push([key, value]); return builder; } };
      const query = {
        withIndex(_index: string, fn: (q: typeof builder) => unknown) { fn(builder); return query; },
        async take(count: number) {
          return (tables[table] ?? []).filter(row => conditions.every(([key, value]) => row[key] === value)).slice(0, count);
        },
      };
      return query;
    },
  } };
  return { ctx, tables, content: content as Row, release };
}

function addPreviousTen(tables: Record<string, Row[]>) {
  const identities = [
    ['lesson', 'lsn_early_math'], ['story', 'st_waiting_at_clinic'], ['story', 'st_first_day_school'],
    ...SEVEN_STORIES_SLUGS.map(s => ['story', s]),
  ];
  for (const [type, contentSlug] of identities) tables.aiPublicationReleases.push({
    _id: `previous-${contentSlug}`, releaseId: `previous-${contentSlug}`, status: 'active',
    contentType: type, contentSlug, targetKey: `${type}\0${contentSlug}`,
  });
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('exact reading-together lesson AI visibility', () => {
  it('pins real artifact and manifest identity plus every compiled dependency digest', async () => {
    expect(await realHash(artifact)).toBe(artifactHash);
    const { snapshotSha256, ...manifest } = preimage;
    expect(await realHash(manifest)).toBe(snapshotSha256);
    expect(artifact.targets).toHaveLength(1);
    expect(target.type).toBe('lesson');
    expect(target.slug).toBe(slug);
    expect(target.contentSnapshotHash).toBe(preimage.desiredContentSnapshotHash);
    expect(target.evidenceLinkSnapshotHash).toBe(preimage.linkSnapshotHash);
    expect(target.mediaSnapshotHash).toBe(preimage.mediaFullHash);
    expect(target.mediaCount).toBe(1);
    expect(preimage.desiredRevision).toBe(4);
    expect(target.sources.map(s => s.sourceId)).toEqual(preimage.sourceIds);
    expect(target.sources.map(s => s.sourceSnapshotHash)).toEqual(preimage.sourceRows.map(s => s.snapshotHash));
    expect(target.sources.map(s => s.sourceUrl)).toEqual(preimage.sourceRows.map(s => s.url));
  });

  it('registers only the exact new identity without extending the legacy allowlist', () => {
    expect(registeredAiPublicationArtifact(releaseId, artifactHash)?.kind).toBe('reading_together');
    expect(isAiPublicationTarget('lesson', slug)).toBe(false);
    expect(AI_PUBLICATION_MAX_ACTIVE_RELEASES).toBe(3);
    for (const id of [releaseId.replace(':lesson:', ':story:'), `${releaseId}-other`, releaseId.replace(slug, 'lsn_creativity')]) {
      expect(registeredAiPublicationArtifact(id, artifactHash)).toBeNull();
    }
    expect(registeredAiPublicationArtifact(releaseId, 'f'.repeat(64))).toBeNull();
  });

  it('allows schema2 r4 with three separately audited sources and no human approvals', async () => {
    vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture();
    const saved = structuredClone(f.tables);
    expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, now, date)).toBe(true);
    expect(f.tables.aiContentAudits).toHaveLength(1);
    expect(f.tables.aiEvidenceAudits).toHaveLength(3);
    expect(f.tables.aiAuditRuns).toHaveLength(4);
    expect(f.tables.contentReviews).toEqual([]);
    expect(f.tables).toEqual(saved);
  });

  it('admits control for legacy3 + stories7 + reading1 and preserves all rows', async () => {
    vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture();
    addPreviousTen(f.tables);
    const saved = structuredClone(f.tables);
    const control = await activeAiPublicationControl(f.ctx as never);
    expect(control.complete).toBe(true);
    expect(control.releases).toHaveLength(11);
    expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, now, date)).toBe(true);
    expect(f.tables).toEqual(saved);
    // Prior releases above are identity-only control fixtures, not runtime audit fixtures.
  });

  it.each([
    'master_off', 'disabled', 'duplicate_config', 'twelfth_active', 'duplicate_release_id', 'unknown_target',
    'copy', 'revision', 'human_summary', 'wrong_type', 'published_status', 'pointer', 'published_time', 'policy',
    'link_order', 'link_duplicate', 'source_change', 'source_retired', 'source_duplicate', 'source_missing',
    'evidence_missing', 'evidence_duplicate', 'shared_run', 'content_run_as_source', 'audit_hash', 'audit_urls',
    'audit_findings', 'audit_limitations', 'run_summary', 'run_hash', 'run_policy', 'run_duplicate',
    'content_audit_duplicate', 'content_audit_checks', 'content_run_missing', 'media_url', 'media_storage',
    'media_not_placeholder', 'media_metadata', 'media_missing', 'media_extra', 'expired', 'audit_date_expired',
  ] as const)('fails closed for %s', async drift => {
    vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture();
    const audit = f.tables.aiEvidenceAudits[1];
    const run = f.tables.aiAuditRuns.find(r => r.runId === audit.runId)!;
    const snapshots = f.release.sourceSnapshots as Row[];
    if (drift === 'master_off') vi.stubEnv('AI_PUBLICATION_ENABLED', 'false');
    if (drift === 'disabled') f.tables.aiPublicationConfig[0].enabled = false;
    if (drift === 'duplicate_config') f.tables.aiPublicationConfig.push({ ...f.tables.aiPublicationConfig[0] });
    if (drift === 'twelfth_active') { addPreviousTen(f.tables); f.tables.aiPublicationReleases.push({ ...f.release }); }
    if (drift === 'duplicate_release_id') { addPreviousTen(f.tables); f.tables.aiPublicationReleases[1].releaseId = releaseId; }
    if (drift === 'unknown_target') f.tables.aiPublicationReleases.push({ releaseId: 'other', status: 'active', contentType: 'lesson', contentSlug: 'lsn_unknown', targetKey: 'lesson\0lsn_unknown' });
    if (drift === 'copy') f.content.titleMm = 'Changed';
    if (drift === 'revision') f.content.reviewRevision = 3;
    if (drift === 'human_summary') f.content.reviewerId = 'not-an-actual-human-review';
    if (drift === 'wrong_type') f.content.type = 'story';
    if (drift === 'published_status') f.content.clinicalStatus = 'published';
    if (drift === 'pointer') f.content.aiPublicationReleaseId = 'wrong';
    if (drift === 'published_time') f.content.aiPublishedAt = now + 1;
    if (drift === 'policy') f.release.policyVersion = 'ai-educational-preview-v1';
    if (drift === 'link_order') (f.tables.evidenceLinks[0].sourceIds as string[]).reverse();
    if (drift === 'link_duplicate') f.tables.evidenceLinks.push({ ...f.tables.evidenceLinks[0], kind: 'story' });
    if (drift === 'source_change') f.tables.evidenceSources[1].title = 'Changed';
    if (drift === 'source_retired') f.tables.evidenceSources[1].reviewStatus = 'retired';
    if (drift === 'source_duplicate') f.tables.evidenceSources.push({ ...f.tables.evidenceSources[1] });
    if (drift === 'source_missing') f.tables.evidenceSources.splice(1, 1);
    if (drift === 'evidence_missing') f.tables.aiEvidenceAudits.splice(1, 1);
    if (drift === 'evidence_duplicate') f.tables.aiEvidenceAudits.push({ ...audit });
    if (drift === 'shared_run') snapshots[1].evidenceAuditRunId = snapshots[0].evidenceAuditRunId;
    if (drift === 'content_run_as_source') snapshots[1].evidenceAuditRunId = contentRunId;
    if (drift === 'audit_hash') audit.outputHash = 'f'.repeat(64);
    if (drift === 'audit_urls') audit.urlsChecked = ['https://example.com'];
    if (drift === 'audit_findings') audit.findings = ['invented'];
    if (drift === 'audit_limitations') audit.limitations = [];
    if (drift === 'run_summary') run.summary = 'invented';
    if (drift === 'run_hash') run.outputHash = 'f'.repeat(64);
    if (drift === 'run_policy') run.policyVersion = 'other';
    if (drift === 'run_duplicate') f.tables.aiAuditRuns.push({ ...run });
    if (drift === 'content_audit_duplicate') f.tables.aiContentAudits.push({ ...f.tables.aiContentAudits[0] });
    if (drift === 'content_audit_checks') f.tables.aiContentAudits[0].checks = [];
    if (drift === 'content_run_missing') f.tables.aiAuditRuns = f.tables.aiAuditRuns.filter(r => r.runId !== contentRunId);
    if (drift === 'media_url') f.tables.libraryMedia[0].url = 'https://example.com/new.png';
    if (drift === 'media_storage') f.tables.libraryMedia[0].storageId = 'unreviewed-storage';
    if (drift === 'media_not_placeholder') f.tables.libraryMedia[0].placeholder = false;
    if (drift === 'media_metadata') f.tables.libraryMedia[0].note = 'Changed';
    if (drift === 'media_missing') f.tables.libraryMedia = [];
    if (drift === 'media_extra') f.tables.libraryMedia.push({ ...f.tables.libraryMedia[0], _id: 'new' });
    const checkedAt = drift === 'expired' ? expiresAt + 1 : now;
    const checkedDate = drift === 'audit_date_expired'
      ? new Date(Date.parse(nextAuditDate) + 86_400_000).toISOString().slice(0, 10) : date;
    expect(await contentIsAiParentReadable(f.ctx as never, f.content as never, checkedAt, checkedDate)).toBe(false);
  });
});
