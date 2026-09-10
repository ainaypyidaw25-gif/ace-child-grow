import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activate,
  expire,
  preflight,
  stage,
  withdraw,
  READING_TOGETHER_VISIBILITY_CUTOFF,
} from '../../../convex/aiReadingTogetherPublication20260910';
import { READING_TOGETHER_ARTIFACT_HASH as artifactHash } from '../../../convex/lib/aiReadingTogetherPublication20260910Artifact';
import {
  READING_TOGETHER_PREIMAGE as expected,
  READING_TOGETHER_RELEASE_ROOT as root,
  READING_TOGETHER_SLUG as slug,
} from '../../../convex/lib/aiReadingTogetherPublication20260910Data';
import * as hashes from '../../../convex/lib/aiAuditHash';
import * as visibility from '../../../convex/lib/aiPublicationVisibility';
import seedData from '../../../convex/seedData.json';

type Row = Record<string, unknown>;
const realHash = hashes.sha256Canonical;
const now = expected.capturedAt + 1_000;
const identity = { releaseRoot: root, artifactHash, snapshotSha256: expected.snapshotSha256 };
const invoke = (fn: unknown, ctx: unknown, args: Row) =>
  (fn as { _handler: (ctx: unknown, args: Row) => Promise<Row> })._handler(ctx, args);
const sorted = (rows: Row[]) => [...rows].sort((a, b) => String(a._id).localeCompare(String(b._id)));
const omit = (row: Row, keys: string[]) => Object.fromEntries(Object.entries(row).filter(([key]) => !keys.includes(key)));

async function fixture() {
  vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
  vi.spyOn(Date, 'now').mockReturnValue(now);
  const seed = structuredClone(seedData.find((row) => row.slug === slug)!) as Row;
  delete seed.media;
  const content: Row = {
    ...seed,
    _id: expected.contentId,
    _creationTime: 1,
    createdAt: 1,
    summaryMm: 'old mm',
    summaryEn: 'old en',
    data: { body: { mm: 'old', en: 'old' } },
    searchText: 'old',
    clinicalStatus: 'clinical_review',
    reviewRevision: 3,
    updatedAt: expected.contentUpdatedAt,
  };
  const link: Row = {
    _id: expected.linkId,
    _creationTime: 1,
    createdAt: 1,
    kind: 'lesson',
    slug,
    sourceIds: [...expected.sourceIds],
    updatedAt: expected.linkUpdatedAt,
  };
  const sources = expected.sourceRows.map((pin, index): Row => ({
    _id: `source-${index}`,
    _creationTime: 1,
    createdAt: 1,
    sourceId: pin.sourceId,
    org: 'Synthetic official source',
    orgKey: 'Synthetic',
    title: pin.sourceId,
    authors: null,
    year: 2024,
    edition: null,
    country: 'United States',
    language: 'en',
    url: pin.url,
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'parent_education',
    reviewStatus: 'approved',
    keywords: [],
    topics: [],
    ageMonthsMin: 0,
    ageMonthsMax: 60,
    verifiedOn: '2026-09-10',
    verifiedNote: 'Synthetic exact-scope fixture',
    nextReviewDate: '2027-09-10',
    updatedAt: pin.sourceUpdatedAt,
  }));
  const media: Row[] = [{
    _id: 'media-reading', _creationTime: 1, contentSlug: slug,
    kind: 'illustration', offline: true, placeholder: true,
  }];
  const config: Row = {
    _id: 'config', _creationTime: 1, key: 'global', enabled: true,
    generation: 3, operator: 'Synthetic', reason: 'Synthetic', updatedAt: 2,
  };
  const tables: Record<string, Row[]> = {
    libraryContent: [content], evidenceLinks: [link], evidenceSources: sources,
    contentReviews: [], libraryMedia: media, clinicalReviewAssignments: [],
    aiPublicationReleases: [], aiAuditRuns: [], aiContentAudits: [], aiEvidenceAudits: [],
    aiPublicationConfig: [config], auditLogs: [],
  };
  const mappings: [unknown, string][] = [
    [content, expected.contentFullHash],
    [omit(content, ['summaryMm', 'summaryEn', 'data', 'searchText', 'reviewRevision', 'updatedAt', 'aiPublicationReleaseId', 'aiPublishedAt']), expected.preservedContentHash],
    [link, expected.linkFullHash],
    [hashes.aiEvidenceLinkSnapshot(link as never), expected.linkSnapshotHash],
    [sorted(sources), expected.sourcesFullHash],
    [media, expected.mediaFullHash],
    [config, expected.configFullHash],
  ];
  for (const [index, source] of sources.entries()) {
    mappings.push([source, expected.sourceRows[index].fullHash]);
    mappings.push([hashes.aiEvidenceSnapshot(source as never), expected.sourceRows[index].snapshotHash]);
  }
  const desired = { ...content, summaryMm: seed.summaryMm, summaryEn: seed.summaryEn,
    data: seed.data, searchText: seed.searchText, reviewRevision: 4, updatedAt: now };
  mappings.push([hashes.aiContentSnapshot(desired as never), expected.desiredContentSnapshotHash]);
  const mapped = new Map(await Promise.all(mappings.map(async ([value, digest]) => [await realHash(value), digest] as const)));
  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async (value) => {
    const digest = await realHash(value);
    return mapped.get(digest) ?? digest;
  });
  const schedules = new Map<string, Row>();
  const db = {
    system: { async get(id: string) { return schedules.get(id) ?? null; } },
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const builder = { eq(key: string, value: unknown) { conditions.push([key, value]); return builder; } };
      const query = {
        withIndex(_index: string, callback: (q: typeof builder) => unknown) { callback(builder); return query; },
        async take(count: number) {
          return (tables[table] ?? []).filter((row) => conditions.every(([key, value]) => row[key] === value)).slice(0, count);
        },
        async unique() { const rows = await query.take(2); if (rows.length > 1) throw new Error('duplicate'); return rows[0] ?? null; },
      };
      return query;
    },
    async get(id: string) { return Object.values(tables).flat().find((row) => row._id === id) ?? null; },
    insert: vi.fn(async (table: string, value: Row) => {
      const id = `new-${table}-${tables[table].length}`;
      tables[table].push({ ...value, _id: id, _creationTime: now });
      return id;
    }),
    patch: vi.fn(async (id: string, value: Row) => {
      const row = await db.get(id); if (!row) throw new Error('missing');
      for (const [key, entry] of Object.entries(value)) entry === undefined ? delete row[key] : row[key] = entry;
    }),
  };
  const scheduler = { runAt: vi.fn(async (time: number, _ref: unknown, args: Row) => {
    const id = 'reading-expiry';
    schedules.set(id, { _id: id, name: 'aiReadingTogetherPublication20260910.js:expire',
      scheduledTime: time, state: { kind: 'pending' }, args: [args] });
    return id;
  }) };
  const previous = Array.from({ length: 10 }, (_, index) => ({
    _id: `old-${index}`, slug: [
      'lsn_early_math', 'st_waiting_at_clinic', 'st_first_day_school', 'st_little_seed',
      'st_ba_ba_sounds', 'st_when_i_feel_angry', 'st_taking_turns', 'st_goodnight_moon_friend',
      'st_visit_to_doctor', 'st_sharing_mango',
    ][index],
  }));
  vi.spyOn(visibility, 'contentIsAiParentReadable').mockImplementation(async (_ctx, row) =>
    row.slug === slug && row.aiPublicationReleaseId === `${root}:lesson:${slug}`);
  vi.spyOn(visibility, 'activeAiParentReadableContent').mockImplementation(async () => ({
    complete: true,
    rows: [...previous, ...(content.aiPublicationReleaseId ? [content] : [])] as never,
  }));
  const ctx = { db, scheduler };
  async function transaction(fn: unknown, extra: Row) {
    const before = structuredClone(tables);
    const scheduledBefore = structuredClone([...schedules]);
    try { return await invoke(fn, ctx, { ...identity, ...extra }); }
    catch (error) {
      for (const key of Object.keys(tables)) tables[key] = before[key];
      schedules.clear(); for (const [key, value] of scheduledBefore) schedules.set(key, value);
      throw error;
    }
  }
  return { ctx, tables, content, link, sources, media, config, schedules, transaction };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('exact reading-together AI publication lifecycle', () => {
  it('stages corrected copy dark, activates only one release, and preserves sources, links, media, reviews and config', async () => {
    const f = await fixture();
    const preserved = structuredClone({ link: f.link, sources: f.sources, media: f.media, config: f.config, reviews: f.tables.contentReviews });
    expect(await invoke(preflight, f.ctx, { ...identity, checkedAt: now })).toMatchObject({ phase: 'ready', activeReleaseCount: 10, parentReadable: false });
    expect(await f.transaction(stage, { operator: 'Synthetic operator', gitCommit: 'a'.repeat(40) }))
      .toMatchObject({ phase: 'staged', activeReleaseCount: 10, parentReadable: false, reviewRevision: 4 });
    expect(f.tables.aiAuditRuns).toHaveLength(4);
    expect(f.tables.aiContentAudits).toHaveLength(1);
    expect(f.tables.aiEvidenceAudits).toHaveLength(3);
    expect(f.tables.aiPublicationReleases).toHaveLength(0);
    expect(await f.transaction(activate, { operator: 'Synthetic operator', expectedGeneration: 3 }))
      .toMatchObject({ phase: 'enabled', activeReleaseCount: 11, parentReadable: true });
    expect(f.tables.aiPublicationReleases).toHaveLength(1);
    expect(f.content.aiPublicationReleaseId).toBe(`${root}:lesson:${slug}`);
    expect({ link: f.link, sources: f.sources, media: f.media, config: f.config, reviews: f.tables.contentReviews }).toEqual(preserved);
    expect(f.content.reviewerId).toBeUndefined();
  });

  it.each(['content', 'source', 'link', 'media', 'review', 'assignment', 'config'] as const)('fails before writes on %s drift', async (drift) => {
    const f = await fixture();
    if (drift === 'content') f.content.titleEn = 'changed';
    if (drift === 'source') f.sources[0].title = 'changed';
    if (drift === 'link') f.link.sourceIds = [];
    if (drift === 'media') f.media[0].url = 'https://example.invalid/image.png';
    if (drift === 'review') f.tables.contentReviews.push({ _id: 'review', contentSlug: slug });
    if (drift === 'assignment') f.tables.clinicalReviewAssignments.push({ _id: 'assignment', contentSlug: slug });
    if (drift === 'config') f.config.generation = 4;
    await expect(f.transaction(stage, { operator: 'Synthetic operator', gitCommit: 'a'.repeat(40) })).rejects.toThrow();
    expect(f.tables.aiAuditRuns).toHaveLength(0);
    expect(f.tables.aiPublicationReleases).toHaveLength(0);
  });

  it.each(['target_release', 'published_pointer'] as const)('refuses activation after staged %s collision', async (drift) => {
    const f = await fixture();
    await f.transaction(stage, { operator: 'Synthetic operator', gitCommit: 'a'.repeat(40) });
    if (drift === 'target_release') f.tables.aiPublicationReleases.push({
      _id: 'collision', releaseId: 'other-root', targetKey: `lesson\0${slug}`,
      contentType: 'lesson', contentSlug: slug, status: 'revoked',
    });
    if (drift === 'published_pointer') f.content.aiPublishedAt = now;
    expect(await invoke(preflight, f.ctx, { ...identity, checkedAt: now })).toMatchObject({ phase: 'drift' });
    await expect(f.transaction(activate, { operator: 'Synthetic operator', expectedGeneration: 3 })).rejects.toThrow();
    expect(f.tables.aiPublicationReleases.some((row) => row.releaseId === `${root}:lesson:${slug}`)).toBe(false);
  });

  it('withdraws exact release without changing human/source state and scheduled expiry rejects early', async () => {
    const f = await fixture();
    await f.transaction(stage, { operator: 'Synthetic operator', gitCommit: 'a'.repeat(40) });
    await f.transaction(activate, { operator: 'Synthetic operator', expectedGeneration: 3 });
    await expect(invoke(expire, f.ctx, identity)).rejects.toThrow('early');
    expect(await invoke(withdraw, f.ctx, identity)).toEqual({ revoked: true, pointersCleared: true });
    expect(f.tables.aiPublicationReleases[0].status).toBe('revoked');
    expect(f.content.aiPublicationReleaseId).toBeUndefined();
    vi.spyOn(Date, 'now').mockReturnValue(READING_TOGETHER_VISIBILITY_CUTOFF);
    expect(await invoke(expire, f.ctx, identity)).toEqual({ revoked: false, pointersCleared: false });
  });
});
