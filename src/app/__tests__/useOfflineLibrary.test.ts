import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OfflineRecord } from '../../domain/offline/offlineLibrary';

const {
  cacheOfflineMediaForContent,
  clearOfflineMedia,
  convexQuery,
  isOfflineMediaStorageAvailable,
  keepExistingOfflineMedia,
  readAllRecords,
  saveRecords,
  removeOfflineMedia,
} = vi.hoisted(() => ({
  cacheOfflineMediaForContent: vi.fn(),
  clearOfflineMedia: vi.fn(),
  convexQuery: vi.fn(),
  isOfflineMediaStorageAvailable: vi.fn(),
  keepExistingOfflineMedia: vi.fn(),
  readAllRecords: vi.fn<() => Promise<OfflineRecord[]>>(),
  saveRecords: vi.fn<(
    put: OfflineRecord[],
    remove?: string[],
  ) => Promise<boolean>>(),
  removeOfflineMedia: vi.fn<(cacheKeys: string[]) => Promise<boolean>>(),
}));

vi.mock('convex/react', () => ({ useQuery: vi.fn() }));
vi.mock('../../lib/convexClient', () => ({ convex: { query: convexQuery } }));
vi.mock('../offlineStore', () => ({ readAllRecords, saveRecords }));
vi.mock('../offlineMediaStore', () => ({
  cacheOfflineMediaForContent,
  clearOfflineMedia,
  isOfflineMediaStorageAvailable,
  keepExistingOfflineMedia,
  removeOfflineMedia,
}));

import {
  useDownloadedLibrary,
  useOfflineDownload,
  withdrawUnavailableOfflineContent,
} from '../useOfflineLibrary';

function offlineRecord(slug: string, cacheKey?: string): OfflineRecord {
  return {
    _id: `id-${slug}`,
    slug,
    type: 'milestone',
    titleMm: slug,
    titleEn: slug,
    tags: [],
    clinicalStatus: 'published',
    data: {},
    savedAt: 1,
    media: cacheKey ? [{
      id: `media-${slug}`,
      kind: 'illustration',
      cacheKey,
      mimeType: 'image/webp',
      sizeBytes: 10,
      savedAt: 1,
    }] : [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  isOfflineMediaStorageAvailable.mockReturnValue(false);
  clearOfflineMedia.mockResolvedValue(true);
  keepExistingOfflineMedia.mockImplementation(async (media) => media);
  removeOfflineMedia.mockResolvedValue(true);
  saveRecords.mockResolvedValue(true);
});

describe('automatic offline publication withdrawal', () => {
  it('removes unavailable text and its media while retaining published rows', async () => {
    const retired = offlineRecord('ms_5_6m_gross_motor_1', 'cache-retired');
    const published = offlineRecord('ms_5_6m_gross_motor_2', 'cache-published');
    readAllRecords.mockResolvedValue([retired, published]);
    saveRecords.mockResolvedValue(true);

    await expect(withdrawUnavailableOfflineContent([published.slug]))
      .resolves.toEqual({ ok: true, removed: 1 });
    expect(saveRecords).toHaveBeenCalledWith([published], [retired.slug]);
    expect(removeOfflineMedia).toHaveBeenCalledWith(['cache-retired']);
  });

  it('does not remove media or report withdrawal when the text transaction fails', async () => {
    const retired = offlineRecord('ms_5_6m_gross_motor_1', 'cache-retired');
    readAllRecords.mockResolvedValue([retired]);
    saveRecords.mockResolvedValue(false);

    await expect(withdrawUnavailableOfflineContent([]))
      .resolves.toEqual({ ok: false, removed: 0 });
    expect(removeOfflineMedia).not.toHaveBeenCalled();
  });

  it('does not write when the complete manifest matches stored content', async () => {
    const published = offlineRecord('ms_5_6m_gross_motor_2');
    readAllRecords.mockResolvedValue([published]);

    await expect(withdrawUnavailableOfflineContent([published.slug]))
      .resolves.toEqual({ ok: true, removed: 0 });
    expect(saveRecords).not.toHaveBeenCalled();
    expect(removeOfflineMedia).not.toHaveBeenCalled();
  });
});

describe('source-bound offline download', () => {
  const row = {
    _id: 'id-guide',
    slug: 'guide_sleep',
    type: 'guide',
    clinicalStatus: 'published',
    publicationLane: 'ai_audited' as const,
    titleMm: 'အိပ်စက်ခြင်း',
    titleEn: 'Sleep',
    tags: ['sleep'],
    data: {},
  };
  const source = {
    sourceId: 'nhs-sleep',
    org: 'NHS',
    title: 'Sleep and young children',
    url: 'https://www.nhs.uk/conditions/baby/health/sleep/',
  };
  const atomicItem = {
    ...row,
    clinicalStatus: 'clinical_review',
    titleMm: 'ဆာဗာမှ အသစ်',
    titleEn: 'Fresh server copy',
    data: { body: { mm: 'အသစ်', en: 'fresh' } },
  };

  it('stores the newer atomic content snapshot instead of the stale caller row', async () => {
    readAllRecords.mockResolvedValue([]);
    convexQuery.mockResolvedValue({
      allowed: true,
      item: atomicItem,
      sources: [{ ...source, reviewer: 'not for offline storage', reviewNote: 'private' }],
    });
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row])).resolves.toMatchObject({ ok: true, saved: 1 });
    });

    expect(convexQuery).toHaveBeenCalledWith(expect.anything(), {
      slug: row.slug,
      kind: row.type,
    });
    expect(saveRecords).toHaveBeenCalledWith([
      expect.objectContaining({
        titleEn: 'Fresh server copy',
        data: { body: { mm: 'အသစ်', en: 'fresh' } },
        references: [source],
      }),
    ], []);
    const saved = saveRecords.mock.calls[0][0][0];
    expect(saved.titleEn).not.toBe(row.titleEn);
    expect(saved.references?.[0]).not.toHaveProperty('reviewer');
    expect(saved.references?.[0]).not.toHaveProperty('reviewNote');
  });

  it.each([
    { allowed: false, sources: [] },
    { allowed: true, item: atomicItem, sources: [] },
    { allowed: true, item: atomicItem, sources: [{ ...source, url: 'http://example.com/source' }] },
  ])('keeps the complete prior cache unchanged when source verification fails', async (evidence) => {
    const prior = { ...offlineRecord(row.slug), references: [source] };
    readAllRecords.mockResolvedValue([prior]);
    convexQuery.mockResolvedValue(evidence);
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row])).resolves.toEqual({
        ok: false,
        saved: 0,
        removed: 0,
        mediaSaved: 0,
        failure: 'sources',
      });
    });

    expect(saveRecords).not.toHaveBeenCalled();
    expect(cacheOfflineMediaForContent).not.toHaveBeenCalled();
    expect(removeOfflineMedia).not.toHaveBeenCalled();
  });

  it('keeps the complete prior cache unchanged when the source request throws', async () => {
    readAllRecords.mockResolvedValue([{ ...offlineRecord(row.slug), references: [source] }]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockRejectedValue(new Error('offline during refresh'));
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row])).resolves.toMatchObject({ ok: false, failure: 'sources' });
    });

    expect(saveRecords).not.toHaveBeenCalled();
    expect(cacheOfflineMediaForContent).not.toHaveBeenCalled();
    expect(removeOfflineMedia).not.toHaveBeenCalled();
  });

  it('writes no AI media and removes legacy AI media after a successful refresh', async () => {
    const prior = offlineRecord(row.slug, 'https://offline/old-media');
    readAllRecords.mockResolvedValue([{ ...prior, publicationLane: 'ai_audited', references: [source] }]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockResolvedValue({
      allowed: true,
      item: atomicItem,
      sources: [source],
    });
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row])).resolves.toMatchObject({ ok: true, mediaSaved: 0 });
    });

    expect(cacheOfflineMediaForContent).not.toHaveBeenCalled();
    expect(saveRecords).toHaveBeenCalledWith([
      expect.objectContaining({ media: [] }),
    ], []);
    expect(convexQuery).toHaveBeenCalledTimes(1);
    expect(convexQuery).toHaveBeenCalledWith(expect.anything(), { slug: row.slug, kind: row.type });
    expect(removeOfflineMedia).toHaveBeenCalledWith([prior.media![0].cacheKey]);
  });

  it('fails before human media caching, saving or publishing when legacy AI media cannot be removed', async () => {
    const prior = offlineRecord(row.slug, 'https://offline/old-media');
    readAllRecords.mockResolvedValue([{ ...prior, publicationLane: 'ai_audited', references: [source] }]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockResolvedValue({
      allowed: true,
      item: atomicItem,
      sources: [source],
    });
    removeOfflineMedia.mockResolvedValue(false);
    const humanRow = {
      ...row,
      _id: 'id-human',
      slug: 'lesson-human',
      type: 'lesson',
      publicationLane: 'human_reviewed' as const,
    };
    const downloaded = renderHook(() => useDownloadedLibrary());
    await waitFor(() => expect(downloaded.result.current.loaded).toBe(true));
    const publishedBeforeAttempt = downloaded.result.current.records;
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row, humanRow])).resolves.toEqual({
        ok: false,
        saved: 0,
        removed: 0,
        mediaSaved: 0,
        failure: 'storage',
      });
    });

    expect(removeOfflineMedia).toHaveBeenCalledWith([prior.media![0].cacheKey]);
    expect(convexQuery).toHaveBeenCalledTimes(1);
    expect(convexQuery).toHaveBeenCalledWith(expect.anything(), { slug: row.slug, kind: row.type });
    expect(cacheOfflineMediaForContent).not.toHaveBeenCalled();
    expect(saveRecords).not.toHaveBeenCalled();
    expect(downloaded.result.current.records).toBe(publishedBeforeAttempt);
  });

  it('keeps partial valid media for conventional human-reviewed downloads', async () => {
    const humanRow = {
      ...row,
      _id: 'id-human',
      slug: 'lesson_human',
      type: 'lesson',
      publicationLane: 'human_reviewed' as const,
    };
    const firstCandidate = {
      id: 'human-media-1',
      kind: 'illustration',
      url: 'https://cdn.example/human-1.png',
      storageUrl: null,
      mimeType: 'image/png',
      altMm: null,
      altEn: 'Human-reviewed image',
      captionMm: null,
      captionEn: null,
      transcriptMm: null,
      transcriptEn: null,
      durationSeconds: null,
      attributionMm: null,
      attributionEn: null,
      accessLevel: 'free_sample',
    };
    const secondCandidate = {
      ...firstCandidate,
      id: 'human-media-2',
      url: 'https://cdn.example/human-2.png',
    };
    const cachedMedia = {
      id: firstCandidate.id,
      kind: 'illustration' as const,
      cacheKey: 'https://offline/human-media-1',
      mimeType: 'image/png',
      sizeBytes: 20,
      savedAt: 2,
    };

    readAllRecords.mockResolvedValue([]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockResolvedValue([firstCandidate, secondCandidate]);
    cacheOfflineMediaForContent.mockResolvedValue([cachedMedia]);
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([humanRow]))
        .resolves.toMatchObject({ ok: true, saved: 1, mediaSaved: 1 });
    });

    expect(cacheOfflineMediaForContent).toHaveBeenCalledWith(
      humanRow.slug,
      [firstCandidate, secondCandidate],
      expect.any(Number),
    );
    expect(saveRecords).toHaveBeenCalledWith([
      expect.objectContaining({ slug: humanRow.slug, media: [cachedMedia] }),
    ], []);
  });

  it('keeps conventional human-reviewed downloads compatible without an evidence lookup', async () => {
    readAllRecords.mockResolvedValue([]);
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([{ ...row, publicationLane: 'human_reviewed' }]))
        .resolves.toMatchObject({ ok: true, saved: 1 });
    });

    expect(convexQuery).not.toHaveBeenCalled();
    expect(saveRecords).toHaveBeenCalledWith([
      expect.objectContaining({ slug: row.slug, publicationLane: 'human_reviewed' }),
    ], []);
  });
});
