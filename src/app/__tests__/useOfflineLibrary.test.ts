import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OfflineMediaRecord, OfflineRecord } from '../../domain/offline/offlineLibrary';

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

import { useOfflineDownload, withdrawUnavailableOfflineContent } from '../useOfflineLibrary';

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
      media: [],
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

  it('uses only current atomic AI media and never queries or reuses stale same-slug media', async () => {
    const staleMedia = {
      id: 'old-media',
      kind: 'illustration' as const,
      cacheKey: 'https://offline/old-media',
      mimeType: 'image/png',
      sizeBytes: 10,
      savedAt: 1,
    };
    const currentCandidate = {
      id: 'new-media',
      kind: 'illustration',
      url: 'https://cdn.example/new.png',
      storageUrl: null,
      mimeType: 'image/png',
      altMm: null,
      altEn: 'Current image',
      captionMm: null,
      captionEn: null,
      transcriptMm: null,
      transcriptEn: null,
      durationSeconds: null,
      attributionMm: null,
      attributionEn: null,
      accessLevel: 'free_sample',
    };
    const currentMedia = {
      id: 'new-media',
      kind: 'illustration' as const,
      cacheKey: 'https://offline/new-media',
      mimeType: 'image/png',
      sizeBytes: 20,
      savedAt: 2,
    };
    readAllRecords.mockResolvedValue([{
      ...offlineRecord(row.slug),
      publicationLane: 'ai_audited',
      references: [source],
      media: [staleMedia],
    }]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockResolvedValue({
      allowed: true,
      item: atomicItem,
      sources: [source],
      media: [currentCandidate],
    });
    cacheOfflineMediaForContent.mockResolvedValue([currentMedia]);
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row])).resolves.toMatchObject({ ok: true, mediaSaved: 1 });
    });

    expect(convexQuery).toHaveBeenCalledTimes(1);
    expect(convexQuery).toHaveBeenCalledWith(expect.anything(), { slug: row.slug, kind: row.type });
    expect(cacheOfflineMediaForContent).toHaveBeenCalledWith(
      row.slug,
      [currentCandidate],
      expect.any(Number),
      expect.any(String),
      false,
    );
    expect(saveRecords).toHaveBeenCalledWith([
      expect.objectContaining({ media: [currentMedia] }),
    ], []);
    expect(saveRecords.mock.calls[0][0][0].media).not.toContainEqual(staleMedia);
  });

  it('writes empty AI media instead of reusing stale media when the atomic snapshot has none', async () => {
    const prior = offlineRecord(row.slug, 'https://offline/old-media');
    readAllRecords.mockResolvedValue([{ ...prior, publicationLane: 'ai_audited', references: [source] }]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockResolvedValue({
      allowed: true,
      item: atomicItem,
      sources: [source],
      media: [],
    });
    cacheOfflineMediaForContent.mockResolvedValue([]);
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row])).resolves.toMatchObject({ ok: true, mediaSaved: 0 });
    });

    expect(cacheOfflineMediaForContent).not.toHaveBeenCalled();
    expect(saveRecords).toHaveBeenCalledWith([
      expect.objectContaining({ media: [] }),
    ], []);
  });

  it('preserves the prior AI record when any downloadable snapshot media cannot be cached', async () => {
    const prior = {
      ...offlineRecord(row.slug, 'https://offline/old-media'),
      publicationLane: 'ai_audited' as const,
      references: [source],
    };
    const currentCandidate = {
      id: 'new-media',
      kind: 'illustration',
      url: 'https://cdn.example/new.png',
      storageUrl: null,
      mimeType: 'image/png',
      altMm: null,
      altEn: 'Current image',
      captionMm: null,
      captionEn: null,
      transcriptMm: null,
      transcriptEn: null,
      durationSeconds: null,
      attributionMm: null,
      attributionEn: null,
      accessLevel: 'free_sample',
    };
    readAllRecords.mockResolvedValue([prior]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockResolvedValue({
      allowed: true,
      item: atomicItem,
      sources: [source],
      media: [
        currentCandidate,
        { ...currentCandidate, id: 'missing-media', url: 'https://cdn.example/missing.png' },
        { ...currentCandidate, id: 'ignored-video', kind: 'video', url: 'https://cdn.example/video.mp4' },
      ],
    });
    const stagedMedia = {
      id: 'new-media',
      kind: 'illustration' as const,
      cacheKey: 'https://offline/new-media@staged',
      mimeType: 'image/png',
      sizeBytes: 20,
      savedAt: 2,
    };
    cacheOfflineMediaForContent.mockResolvedValue([stagedMedia]);
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

    expect(cacheOfflineMediaForContent).toHaveBeenCalledWith(
      row.slug,
      [currentCandidate, expect.objectContaining({ id: 'missing-media' })],
      expect.any(Number),
      expect.any(String),
      false,
    );
    expect(saveRecords).not.toHaveBeenCalled();
    expect(removeOfflineMedia).toHaveBeenCalledWith([stagedMedia.cacheKey]);
    expect(removeOfflineMedia).not.toHaveBeenCalledWith(expect.arrayContaining([prior.media![0].cacheKey]));
  });

  it('disables eviction for a mixed batch and validates AI media only after every write completes', async () => {
    const humanRow = {
      ...row,
      _id: 'id-human',
      slug: 'lesson_human',
      type: 'lesson',
      publicationLane: 'human_reviewed' as const,
    };
    const aiCandidate = {
      id: 'ai-media',
      kind: 'illustration',
      url: 'https://cdn.example/ai.png',
      storageUrl: null,
      mimeType: 'image/png',
      altMm: null,
      altEn: 'AI snapshot image',
      captionMm: null,
      captionEn: null,
      transcriptMm: null,
      transcriptEn: null,
      durationSeconds: null,
      attributionMm: null,
      attributionEn: null,
      accessLevel: 'free_sample',
    };
    const humanCandidate = { ...aiCandidate, id: 'human-media', url: 'https://cdn.example/human.png' };
    const aiMedia = {
      id: aiCandidate.id,
      kind: 'illustration' as const,
      cacheKey: 'https://offline/ai-media@batch',
      mimeType: 'image/png',
      sizeBytes: 20,
      savedAt: 2,
    };
    const humanMedia = { ...aiMedia, id: humanCandidate.id, cacheKey: 'https://offline/human-media@batch' };
    let humanWriteComplete = false;

    readAllRecords.mockResolvedValue([]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery
      .mockResolvedValueOnce({
        allowed: true,
        item: atomicItem,
        sources: [source],
        media: [aiCandidate],
      })
      .mockResolvedValueOnce([humanCandidate]);
    cacheOfflineMediaForContent.mockImplementation(async (slug, _candidates, _savedAt, _generation, allowEviction) => {
      expect(allowEviction).toBe(false);
      if (slug === humanRow.slug) {
        humanWriteComplete = true;
        return [humanMedia];
      }
      return [aiMedia];
    });
    keepExistingOfflineMedia.mockImplementation(async (media) => {
      if (media.some((asset: OfflineMediaRecord) => asset.id === aiMedia.id)) {
        expect(humanWriteComplete).toBe(true);
      }
      return media;
    });
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row, humanRow]))
        .resolves.toMatchObject({ ok: true, saved: 2, mediaSaved: 2 });
    });

    expect(cacheOfflineMediaForContent).toHaveBeenCalledTimes(2);
    const generations = cacheOfflineMediaForContent.mock.calls.map((call) => call[3]);
    expect(new Set(generations).size).toBe(1);
    expect(saveRecords).toHaveBeenCalledWith([
      expect.objectContaining({ slug: row.slug, media: [aiMedia] }),
      expect.objectContaining({ slug: humanRow.slug, media: [humanMedia] }),
    ], []);
  });

  it('removes only staged generation keys when the record transaction fails', async () => {
    const prior = {
      ...offlineRecord(row.slug, 'https://offline/prior-media'),
      publicationLane: 'ai_audited' as const,
      references: [source],
    };
    const candidate = {
      id: 'current-media',
      kind: 'illustration',
      url: 'https://cdn.example/current.png',
      storageUrl: null,
      mimeType: 'image/png',
      altMm: null,
      altEn: null,
      captionMm: null,
      captionEn: null,
      transcriptMm: null,
      transcriptEn: null,
      durationSeconds: null,
      attributionMm: null,
      attributionEn: null,
      accessLevel: 'free_sample',
    };
    const staged = {
      id: candidate.id,
      kind: 'illustration' as const,
      cacheKey: 'https://offline/current-media@batch',
      mimeType: 'image/png',
      sizeBytes: 20,
      savedAt: 2,
    };
    readAllRecords.mockResolvedValue([prior]);
    isOfflineMediaStorageAvailable.mockReturnValue(true);
    convexQuery.mockResolvedValue({
      allowed: true,
      item: atomicItem,
      sources: [source],
      media: [candidate],
    });
    cacheOfflineMediaForContent.mockResolvedValue([staged]);
    saveRecords.mockResolvedValue(false);
    const { result } = renderHook(() => useOfflineDownload());

    await act(async () => {
      await expect(result.current.download([row]))
        .resolves.toMatchObject({ ok: false, failure: 'storage' });
    });

    expect(removeOfflineMedia).toHaveBeenCalledWith([staged.cacheKey]);
    expect(removeOfflineMedia).not.toHaveBeenCalledWith(expect.arrayContaining([prior.media![0].cacheKey]));
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
