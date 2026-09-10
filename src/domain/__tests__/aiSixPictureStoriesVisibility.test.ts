import { afterEach, describe, expect, it, vi } from 'vitest';
import { SIX_PICTURE_STORIES_ARTIFACT as artifact, SIX_PICTURE_STORIES_ARTIFACT_HASH as artifactHash } from '../../../convex/lib/aiSixPictureStoriesPublication20260910Artifact';
import { SIX_PICTURE_STORIES_AGGREGATE_ACTIVE_CAP as aggregateActiveCap, SIX_PICTURE_STORIES_BATCH_GENERATION as batchGeneration, SIX_PICTURE_STORIES_PREIMAGE as preimages, SIX_PICTURE_STORIES_RELEASE_ROOT as root, SIX_PICTURE_STORIES_RELEASE_DAYS as releaseDays } from '../../../convex/lib/aiSixPictureStoriesPublication20260910Data';
import { FOUR_LESSONS_ARTIFACT, FOUR_LESSONS_ARTIFACT_HASH } from '../../../convex/lib/aiFourLessonsPublication20260910Artifact';
import { FOUR_LESSONS_RELEASE_DAYS } from '../../../convex/lib/aiFourLessonsPublication20260910Data';
import { TWO_LESSONS_ARTIFACT, TWO_LESSONS_ARTIFACT_HASH } from '../../../convex/lib/aiTwoLessonsPublication20260910Artifact';
import { TWO_LESSONS_RELEASE_DAYS } from '../../../convex/lib/aiTwoLessonsPublication20260910Data';
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
import {
  activeAiParentReadableContent,
  activeAiPublicationControl,
  contentIsAiParentReadable,
  registeredAiPublicationArtifact,
  type Schema2AuditArtifact,
} from '../../../convex/lib/aiPublicationVisibility';
import { AI_PUBLICATION_MAX_ACTIVE_RELEASES, isAiPublicationTarget } from '../../../convex/lib/aiPublicationPolicy';
import * as hashes from '../../../convex/lib/aiAuditHash';

type Row = Record<string, unknown>;
type Artifact = Schema2AuditArtifact | typeof EARLY_MATH_AUDIT_ARTIFACT | typeof TWO_STORIES_ARTIFACT;
const realHash = hashes.sha256Canonical;
const now = artifact.auditCompletedAt + 1_000;
const date = new Date(now).toISOString().slice(0, 10);
const firstSlug = 'act_picture_story_2_5y';
const firstReleaseId = `${root}:activity:${firstSlug}`;
const exactTargets = [
  { slug: 'act_picture_story_2_5y', revision: 6, sourceIds: ['aap-power-of-play-2018', 'cdc-milestones-2026'] },
  { slug: 'act_picture_story_3y', revision: 6, sourceIds: ['aap-power-of-play-2018', 'cdc-milestones-2026'] },
  { slug: 'act_picture_story_3_5y', revision: 7, sourceIds: ['aap-power-of-play-2018', 'cdc-milestones-2026'] },
  { slug: 'act_picture_story_4y', revision: 6, sourceIds: ['aap-power-of-play-2018', 'cdc-milestones-2026'] },
  { slug: 'act_picture_story_4_5y', revision: 6, sourceIds: ['aap-power-of-play-2018', 'cdc-milestones-2026'] },
  { slug: 'act_picture_story_5y', revision: 6, sourceIds: ['aap-power-of-play-2018', 'cdc-milestones-2026'] },
] as const;

function revisionFor(slug: string): number {
  if (slug === 'lsn_early_math') return 11;
  if (slug === 'lsn_reading_together' || slug === 'lsn_making_friends') return 4;
  if (slug === 'lsn_big_feelings' || slug === 'lsn_prepare_preschool') return 5;
  if (slug === 'lsn_creativity') return 6;
  if (slug === 'act_picture_story_3_5y') return 7;
  if (slug.startsWith('act_picture_story_')) return 6;
  return 3;
}

/** Complete synthetic payloads for every lane. Snapshot digest remapping is
 * limited to rows whose real payload cannot equal the compiled production
 * preimage. Artifact and audit-output hashes remain real. */
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
        sourceId: target.sourceId,
        sourceSnapshotHash: target.sourceSnapshotHash,
        sourceUrl: target.sourceUrl,
        claimScope: target.claimScope,
        urlsChecked: [target.sourceUrl],
        evidenceFindings: target.evidenceFindings,
        limitations: [],
      }];
      const revision = revisionFor(target.slug);
      const content: Row = {
        _id: `content-${target.slug}`,
        type: target.type,
        slug: target.slug,
        titleEn: `Synthetic ${target.slug}`,
        titleMm: 'စမ်းသပ်',
        tags: [],
        data: { body: { en: 'Synthetic education', mm: 'စမ်းသပ်' } },
        source: 'Synthetic',
        version: 1,
        reviewRevision: revision,
        clinicalStatus: 'clinical_review',
        updatedAt: 2,
        aiPublishedAt: now,
        aiPublicationReleaseId: id,
      };
      const link: Row = {
        _id: `link-${target.slug}`,
        kind: target.type,
        slug: target.slug,
        sourceIds: sources.map(source => source.sourceId),
        updatedAt: 2,
      };
      tables.libraryContent.push(content);
      tables.evidenceLinks.push(link);
      await map(hashes.aiContentSnapshot(content as never), target.contentSnapshotHash);
      await map(hashes.aiEvidenceLinkSnapshot(link as never), target.evidenceLinkSnapshotHash);
      if ('mediaCount' in target) {
        const media = Array.from({ length: target.mediaCount }, (_, index) => ({
          _id: `media-${target.slug}-${index}`,
          contentSlug: target.slug,
          kind: target.type === 'activity' && index === 1 ? 'video' : 'illustration',
          placeholder: true,
          ...(target.type === 'activity' && index === 0 ? { offline: true } : {}),
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
        releaseId: id,
        status: 'completed',
        provider: a.provider,
        model: a.model,
        modelVersion: a.modelVersion,
        policyVersion: a.policyVersion,
        gitCommit: 'a'.repeat(40),
        targetCount: 1,
        limitations: [...a.limitations],
        startedAt: a.auditStartedAt,
        completedAt: a.auditCompletedAt,
      };
      const contentRunId = `${id}:content`;
      tables.aiAuditRuns.push({
        ...runBase,
        _id: contentRunId,
        runId: contentRunId,
        summary,
        outputHash: await output(),
      });
      tables.aiContentAudits.push({
        _id: `${id}:content-audit`,
        runId: contentRunId,
        contentSlug: target.slug,
        contentType: target.type,
        reviewRevision: revision,
        contentUpdatedAt: 2,
        contentSnapshotHash: target.contentSnapshotHash,
        evidenceLinkUpdatedAt: 2,
        evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
        sourceIds: [...link.sourceIds as string[]],
        verdict: 'pass',
        checks: [...target.contentChecks],
        limitations,
        auditedAt: a.auditCompletedAt,
        nextAuditDate,
        outputHash: await output({ kind: 'content' }),
      });

      const snapshots: Row[] = [];
      for (const sourceArtifact of sources) {
        let source = tables.evidenceSources.find(row => row.sourceId === sourceArtifact.sourceId);
        if (!source) {
          source = {
            _id: `source-${sourceArtifact.sourceId}`,
            sourceId: sourceArtifact.sourceId,
            url: sourceArtifact.sourceUrl,
            updatedAt: 2,
            org: 'Synthetic publisher',
            orgKey: 'Synthetic',
            title: sourceArtifact.sourceId,
            authors: null,
            year: 2026,
            edition: null,
            country: null,
            language: 'en',
            doi: null,
            isbn: null,
            pmid: null,
            evidenceLevel: 'parent_education',
            reviewStatus: 'awaiting_review',
            keywords: [],
            topics: [],
            ageMonthsMin: null,
            ageMonthsMax: null,
            verifiedOn: date,
            verifiedNote: 'Synthetic source',
            nextReviewDate: null,
          };
          tables.evidenceSources.push(source);
        }
        await map(hashes.aiEvidenceSnapshot(source as never), sourceArtifact.sourceSnapshotHash);
        const runId = `${id}:evidence:${sourceArtifact.sourceId}`;
        tables.aiAuditRuns.push({
          ...runBase,
          _id: runId,
          runId,
          summary: schema2 ? `${summary} Source: ${sourceArtifact.sourceId}.` : summary,
          outputHash: await output(schema2 ? { sourceId: sourceArtifact.sourceId } : {}),
        });
        tables.aiEvidenceAudits.push({
          _id: `${runId}:audit`,
          runId,
          sourceId: sourceArtifact.sourceId,
          sourceUpdatedAt: 2,
          sourceSnapshotHash: sourceArtifact.sourceSnapshotHash,
          verdict: 'pass',
          claimScope: sourceArtifact.claimScope,
          urlsChecked: [...sourceArtifact.urlsChecked],
          findings: [...sourceArtifact.evidenceFindings],
          limitations: schema2 ? [...sourceArtifact.limitations, ...limitations] : limitations,
          auditedAt: a.auditCompletedAt,
          nextAuditDate,
          outputHash: await output({ kind: 'evidence', ...(schema2 ? { sourceId: sourceArtifact.sourceId } : {}) }),
        });
        snapshots.push({
          sourceId: sourceArtifact.sourceId,
          sourceUpdatedAt: 2,
          sourceSnapshotHash: sourceArtifact.sourceSnapshotHash,
          evidenceAuditRunId: runId,
        });
      }
      tables.aiPublicationReleases.push({
        _id: id,
        releaseId: id,
        targetKey: `${target.type}\0${target.slug}`,
        contentId: content._id,
        contentType: target.type,
        contentSlug: target.slug,
        status: 'active',
        reviewRevision: revision,
        contentUpdatedAt: 2,
        contentSnapshotHash: target.contentSnapshotHash,
        evidenceLinkUpdatedAt: 2,
        evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
        sourceSnapshots: snapshots,
        contentAuditRunId: contentRunId,
        auditArtifactHash: hash,
        policyVersion: a.policyVersion,
        gitCommit: 'a'.repeat(40),
        operator: 'Synthetic',
        createdAt: now,
        expiresAt: a.auditCompletedAt + days * 86_400_000,
      });
    }
  }

  if (previous) {
    await addLane(EARLY_MATH_AUDIT_ARTIFACT, EARLY_MATH_AUDIT_ARTIFACT_HASH, EARLY_MATH_RELEASE_DAYS);
    await addLane(TWO_STORIES_ARTIFACT, TWO_STORIES_ARTIFACT_HASH, TWO_STORIES_RELEASE_DAYS);
    await addLane(SEVEN_STORIES_ARTIFACT, SEVEN_STORIES_ARTIFACT_HASH, SEVEN_STORIES_RELEASE_DAYS);
    await addLane(READING_TOGETHER_ARTIFACT, READING_TOGETHER_ARTIFACT_HASH, READING_TOGETHER_RELEASE_DAYS);
    await addLane(POWER_OF_PLAY_ARTIFACT, POWER_OF_PLAY_ARTIFACT_HASH, POWER_OF_PLAY_RELEASE_DAYS);
    await addLane(TWO_LESSONS_ARTIFACT, TWO_LESSONS_ARTIFACT_HASH, TWO_LESSONS_RELEASE_DAYS);
    await addLane(FOUR_LESSONS_ARTIFACT, FOUR_LESSONS_ARTIFACT_HASH, FOUR_LESSONS_RELEASE_DAYS);
  }
  await addLane(artifact, artifactHash, releaseDays);

  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async value => {
    const digest = await realHash(value);
    return mappings.get(digest) ?? digest;
  });
  const ctx = { db: {
    async get(id: string) {
      return Object.values(tables).flat().find(row => row._id === id) ?? null;
    },
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const builder = {
        eq(key: string, value: unknown) {
          conditions.push([key, value]);
          return builder;
        },
      };
      const query = {
        withIndex(_index: string, callback: (q: typeof builder) => unknown) {
          callback(builder);
          return query;
        },
        async take(n: number) {
          return (tables[table] ?? [])
            .filter(row => conditions.every(([key, value]) => row[key] === value))
            .slice(0, n);
        },
        async unique() {
          const rows = await query.take(2);
          if (rows.length > 1) throw new Error('Duplicate');
          return rows[0] ?? null;
        },
      };
      return query;
    },
  } };
  return { ctx, tables };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('exact additive six-picture-story schema2 visibility', () => {
  it('pins the compiled artifact to the exact activity slugs, revisions, source order and media', async () => {
    expect(await realHash(artifact)).toBe(artifactHash);
    expect(artifact.targets).toHaveLength(6);
    expect(preimages.targets).toHaveLength(6);
    expect(batchGeneration).toBe(5);
    expect((artifact as typeof artifact & { batchGeneration: number }).batchGeneration).toBe(batchGeneration);
    expect(artifact.targets.map(target => ({
      slug: target.slug,
      revision: preimages.targets.find(preimage => preimage.slug === target.slug)?.desiredRevision,
      sourceIds: target.sources.map(source => source.sourceId),
    }))).toEqual(exactTargets);
    expect(artifact.targets.map(target => target.mediaCount)).toEqual([2, 2, 2, 2, 2, 2]);
    for (const target of exactTargets) {
      const id = `${root}:activity:${target.slug}`;
      expect(registeredAiPublicationArtifact(id, artifactHash)?.kind).toBe('six_picture_stories');
      expect(registeredAiPublicationArtifact(id.replace(':activity:', ':lesson:'), artifactHash)).toBeNull();
    }
    expect(registeredAiPublicationArtifact(`${root}:activity:act_story_sequence`, artifactHash)).toBeNull();
    expect(registeredAiPublicationArtifact(firstReleaseId, 'f'.repeat(64))).toBeNull();
    expect(isAiPublicationTarget('activity', firstSlug)).toBe(false);
    expect(AI_PUBLICATION_MAX_ACTIVE_RELEASES).toBe(3);
    expect(aggregateActiveCap).toBe(24);
  });

  it.each(['duplicate', 'unknown', 'extra', 'order', 'revision', 'source', 'source_hash', 'media', 'media_hash', 'missing_report'] as const)(
    'rejects compiled six-picture-story scope drift: %s', drift => {
      const mutableArtifact = artifact as unknown as { targets: Row[] };
      const originalTargets = mutableArtifact.targets;
      const mutablePreimages = preimages as unknown as { targets: Row[] };
      const originalPreimages = mutablePreimages.targets;
      try {
        mutableArtifact.targets = structuredClone(originalTargets);
        mutablePreimages.targets = structuredClone(originalPreimages);
        if (drift === 'duplicate') mutableArtifact.targets[5] = structuredClone(mutableArtifact.targets[0]);
        if (drift === 'unknown') mutableArtifact.targets[5].slug = 'act_story_sequence';
        if (drift === 'extra') mutableArtifact.targets.push(structuredClone(mutableArtifact.targets[0]));
        if (drift === 'order') mutableArtifact.targets.reverse();
        if (drift === 'revision') mutablePreimages.targets[5].desiredRevision = 7;
        if (drift === 'source') (mutableArtifact.targets[5].sources as Row[])[0].sourceId = 'cdc-positive-parenting-preschoolers-2026';
        if (drift === 'source_hash') (mutableArtifact.targets[5].sources as Row[])[0].sourceSnapshotHash = 'f'.repeat(64);
        if (drift === 'media') mutableArtifact.targets[5].mediaCount = 1;
        if (drift === 'media_hash') mutableArtifact.targets[5].mediaSnapshotHash = 'f'.repeat(64);
        if (drift === 'missing_report') mutableArtifact.targets[5].independentAgentResults = [];
        expect(registeredAiPublicationArtifact(firstReleaseId, artifactHash)).toBeNull();
      } finally {
        mutableArtifact.targets = originalTargets;
        mutablePreimages.targets = originalPreimages;
      }
    },
  );

  it('reads all six exact activities without human approvals or writes', async () => {
    const f = await fixture();
    const before = structuredClone(f.tables);
    const control = await activeAiPublicationControl(f.ctx as never);
    expect(control.complete).toBe(true);
    expect(control.releases).toHaveLength(6);
    expect(f.tables.aiPublicationConfig[0].generation).toBe(3);
    for (const content of f.tables.libraryContent) {
      expect(await contentIsAiParentReadable(f.ctx as never, content as never, now, date)).toBe(true);
    }
    expect(f.tables).toEqual(before);
  });

  it.each(['revision', 'source_hash', 'media_hash', 'artifact_bytes'] as const)(
    'fails dark for exact activity state drift: %s', async drift => {
      const f = await fixture();
      const content = f.tables.libraryContent.find(row => row.slug === 'act_picture_story_3_5y')!;
      const release = f.tables.aiPublicationReleases.find(row => row.contentSlug === content.slug)!;
      const originalSummary = artifact.summary;
      try {
        if (drift === 'revision') content.reviewRevision = 6;
        if (drift === 'source_hash') (release.sourceSnapshots as Row[])[0].sourceSnapshotHash = 'f'.repeat(64);
        if (drift === 'media_hash') {
          f.tables.libraryMedia.find(row => row.contentSlug === content.slug)!.note = 'changed';
        }
        if (drift === 'artifact_bytes') {
          (artifact as unknown as { summary: string }).summary = `${originalSummary} changed`;
        }
        expect(await contentIsAiParentReadable(f.ctx as never, content as never, now, date)).toBe(false);
      } finally {
        (artifact as unknown as { summary: string }).summary = originalSummary;
      }
    },
  );

  it('keeps the full synthetic prior eighteen plus the additive six readable', async () => {
    const f = await fixture(true);
    const before = structuredClone(f.tables);
    const control = await activeAiPublicationControl(f.ctx as never);
    expect(control.complete).toBe(true);
    expect(control.releases).toHaveLength(24);
    const result = await activeAiParentReadableContent(f.ctx as never, now);
    expect(result.complete).toBe(true);
    expect(result.rows).toHaveLength(24);
    expect(result.rows.map(row => row.slug).sort()).toEqual(
      f.tables.libraryContent.map(row => row.slug).sort(),
    );
    expect(f.tables).toEqual(before);
  });

  it.each(['unknown', 'duplicate_target', 'duplicate_release_id', 'overflow'] as const)(
    'fails dark for %s active control', async drift => {
      const f = await fixture(drift === 'overflow');
      if (drift === 'unknown') {
        f.tables.aiPublicationReleases.push({
          _id: 'unknown',
          status: 'active',
          releaseId: 'unknown',
          contentType: 'activity',
          contentSlug: 'act_unknown',
          targetKey: 'activity\0act_unknown',
        });
      } else if (drift === 'duplicate_release_id') {
        f.tables.aiPublicationReleases[1].releaseId = f.tables.aiPublicationReleases[0].releaseId;
      } else {
        f.tables.aiPublicationReleases.push({
          ...f.tables.aiPublicationReleases[0],
          _id: 'duplicate',
          releaseId: 'duplicate-release',
        });
      }
      const control = await activeAiPublicationControl(f.ctx as never);
      expect(control).toEqual({ complete: false, releases: [] });
      const result = await activeAiParentReadableContent(f.ctx as never, now);
      expect(result).toEqual({ complete: false, rows: [] });
    },
  );
});
