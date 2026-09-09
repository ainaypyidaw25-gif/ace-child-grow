import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OfflineRecord } from '../../domain/offline/offlineLibrary';

const { readAllRecords, saveRecords, removeOfflineMedia } = vi.hoisted(() => ({
  readAllRecords: vi.fn<() => Promise<OfflineRecord[]>>(),
  saveRecords: vi.fn<(
    put: OfflineRecord[],
    remove?: string[],
  ) => Promise<boolean>>(),
  removeOfflineMedia: vi.fn<(cacheKeys: string[]) => Promise<boolean>>(),
}));

vi.mock('convex/react', () => ({ useQuery: vi.fn() }));
vi.mock('../offlineStore', () => ({ readAllRecords, saveRecords }));
vi.mock('../offlineMediaStore', () => ({
  cacheOfflineMediaForContent: vi.fn(),
  clearOfflineMedia: vi.fn(),
  isOfflineMediaStorageAvailable: vi.fn(),
  keepExistingOfflineMedia: vi.fn(),
  removeOfflineMedia,
}));

import { withdrawUnavailableOfflineContent } from '../useOfflineLibrary';

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
  removeOfflineMedia.mockResolvedValue(true);
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
