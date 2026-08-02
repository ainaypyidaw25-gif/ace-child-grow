import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OfflineMediaCandidate } from '../../domain/offline/offlineLibrary';
import {
  cacheOfflineMediaAsset,
  mediaMimeMatchesKind,
  offlineMediaCacheKey,
  planMediaEviction,
} from '../offlineMediaStore';

afterEach(() => {
  vi.unstubAllGlobals();
});

const candidate = (over: Partial<OfflineMediaCandidate> = {}): OfflineMediaCandidate => ({
  id: 'asset_1',
  kind: 'illustration',
  url: 'https://storage.example/asset.png',
  storageUrl: null,
  mimeType: 'image/png',
  altMm: 'ပုံ',
  altEn: 'Picture',
  captionMm: null,
  captionEn: null,
  transcriptMm: null,
  transcriptEn: null,
  durationSeconds: null,
  attributionMm: null,
  attributionEn: null,
  ...over,
});

describe('offline media policy', () => {
  it('uses an app-owned synthetic key rather than persisting a signed source URL', () => {
    expect(offlineMediaCacheKey('asset/1')).toContain('/__ace_offline_media__/asset%2F1');
    expect(offlineMediaCacheKey('asset/1')).not.toContain('storage.example');
  });

  it('matches images and audio to their declared kind', () => {
    expect(mediaMimeMatchesKind('illustration', 'image/webp')).toBe(true);
    expect(mediaMimeMatchesKind('audio', 'audio/mpeg')).toBe(true);
    expect(mediaMimeMatchesKind('audio', 'text/html')).toBe(false);
  });

  it('evicts oldest assets until an incoming asset fits', () => {
    expect(planMediaEviction([
      { cacheKey: 'old', sizeBytes: 5, savedAt: 1 },
      { cacheKey: 'new', sizeBytes: 4, savedAt: 2 },
    ], 5, 10)).toEqual(['old']);
  });

  it('refuses an asset larger than the whole budget', () => {
    expect(planMediaEviction([], 11, 10)).toBeNull();
  });
});

describe('caching a media response', () => {
  it('stores response bytes and returns a portable manifest row', async () => {
    const stored = new Map<string, Response>();
    const fakeCache = {
      keys: vi.fn(async () => [...stored.keys()].map((url) => new Request(url))),
      match: vi.fn(async (request: RequestInfo | URL) => {
        const key = typeof request === 'string' ? request : request.toString();
        return stored.get(key)?.clone();
      }),
      put: vi.fn(async (request: RequestInfo | URL, response: Response) => {
        const key = typeof request === 'string' ? request : request.toString();
        stored.set(key, response.clone());
      }),
      delete: vi.fn(async (request: RequestInfo | URL) => {
        const key = typeof request === 'string' ? request : request.toString();
        return stored.delete(key);
      }),
    } as unknown as Cache;
    vi.stubGlobal('caches', {
      open: vi.fn(async () => fakeCache),
      delete: vi.fn(async () => true),
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      new Blob(['png'], { type: 'image/png' }),
      { status: 200, headers: { 'content-type': 'image/png' } },
    )));

    const result = await cacheOfflineMediaAsset('story_one', candidate(), 123);

    expect(result).toMatchObject({ id: 'asset_1', kind: 'illustration', savedAt: 123 });
    expect(result?.sizeBytes).toBeGreaterThan(0);
    expect(result?.cacheKey).toContain('/__ace_offline_media__/asset_1');
    expect(fakeCache.put).toHaveBeenCalledOnce();
  });
});
