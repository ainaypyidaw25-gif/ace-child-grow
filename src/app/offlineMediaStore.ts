import {
  isDownloadableMedia,
  offlineMediaSource,
  type OfflineMediaCandidate,
  type OfflineMediaRecord,
} from '../domain/offline/offlineLibrary';

// This cache is deliberately separate from Workbox. The native app removes old
// service-worker caches at startup, but downloaded educational media must remain
// available until the parent removes it from the Downloads screen.
export const OFFLINE_MEDIA_CACHE = 'ace-offline-educational-media-v1';
export const OFFLINE_MEDIA_BUDGET_BYTES = 32 * 1024 * 1024;
export const OFFLINE_MEDIA_ASSET_LIMIT_BYTES = 8 * 1024 * 1024;

const CACHE_PATH = '/__ace_offline_media__/';
const HEADER_SAVED_AT = 'x-ace-saved-at';
const HEADER_SIZE = 'x-ace-size';

function optional(value: string | null): string | undefined {
  return value ?? undefined;
}

export function isOfflineMediaStorageAvailable(): boolean {
  try {
    return typeof caches !== 'undefined' && caches !== null && typeof fetch === 'function';
  } catch {
    return false;
  }
}

export function offlineMediaCacheKey(assetId: string): string {
  const origin = typeof location !== 'undefined' && location.origin
    ? location.origin
    : 'https://offline.ace.invalid';
  return new URL(`${CACHE_PATH}${encodeURIComponent(assetId)}`, origin).toString();
}

export function mediaMimeMatchesKind(kind: string, mimeType: string): boolean {
  if (kind === 'illustration') return mimeType.startsWith('image/');
  if (kind === 'audio') return mimeType.startsWith('audio/');
  return false;
}

export interface CachedMediaEntry {
  cacheKey: string;
  sizeBytes: number;
  savedAt: number;
}

/** Oldest-first keys to remove so the incoming asset fits the device budget. */
export function planMediaEviction(
  entries: CachedMediaEntry[],
  incomingBytes: number,
  budgetBytes = OFFLINE_MEDIA_BUDGET_BYTES,
): string[] | null {
  if (incomingBytes <= 0 || incomingBytes > budgetBytes) return null;
  let used = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);
  if (used + incomingBytes <= budgetBytes) return [];
  const remove: string[] = [];
  for (const entry of [...entries].sort((a, b) => a.savedAt - b.savedAt)) {
    remove.push(entry.cacheKey);
    used -= entry.sizeBytes;
    if (used + incomingBytes <= budgetBytes) return remove;
  }
  return used + incomingBytes <= budgetBytes ? remove : null;
}

async function cacheEntries(cache: Cache, excluding: string): Promise<CachedMediaEntry[]> {
  const requests = await cache.keys();
  const entries: CachedMediaEntry[] = [];
  for (const request of requests) {
    if (request.url === excluding) continue;
    const response = await cache.match(request);
    if (!response) continue;
    entries.push({
      cacheKey: request.url,
      sizeBytes: Number(response.headers.get(HEADER_SIZE)) || 0,
      savedAt: Number(response.headers.get(HEADER_SAVED_AT)) || 0,
    });
  }
  return entries;
}

export async function cacheOfflineMediaAsset(
  contentSlug: string,
  candidate: OfflineMediaCandidate,
  savedAt = Date.now(),
): Promise<OfflineMediaRecord | null> {
  if (!isOfflineMediaStorageAvailable() || !isDownloadableMedia(candidate)) return null;
  const source = offlineMediaSource(candidate);
  if (!source) return null;

  try {
    const response = await fetch(source, { credentials: 'omit' });
    if (!response.ok || response.type === 'opaque') return null;
    const declaredLength = Number(response.headers.get('content-length')) || 0;
    if (declaredLength > OFFLINE_MEDIA_ASSET_LIMIT_BYTES) return null;

    const blob = await response.blob();
    const mimeType = candidate.mimeType || blob.type || response.headers.get('content-type') || '';
    if (
      blob.size <= 0
      || blob.size > OFFLINE_MEDIA_ASSET_LIMIT_BYTES
      || !mediaMimeMatchesKind(candidate.kind, mimeType)
    ) return null;

    const cacheKey = offlineMediaCacheKey(candidate.id);
    const cache = await caches.open(OFFLINE_MEDIA_CACHE);
    const eviction = planMediaEviction(await cacheEntries(cache, cacheKey), blob.size);
    if (eviction === null) return null;
    await Promise.all(eviction.map((key) => cache.delete(key)));

    const headers = new Headers({
      'content-type': mimeType,
      [HEADER_SAVED_AT]: String(savedAt),
      [HEADER_SIZE]: String(blob.size),
      'x-ace-content-slug': contentSlug,
    });
    await cache.put(cacheKey, new Response(blob, { status: 200, headers }));

    return {
      id: candidate.id,
      kind: candidate.kind as OfflineMediaRecord['kind'],
      cacheKey,
      mimeType,
      sizeBytes: blob.size,
      savedAt,
      altMm: optional(candidate.altMm),
      altEn: optional(candidate.altEn),
      captionMm: optional(candidate.captionMm),
      captionEn: optional(candidate.captionEn),
      transcriptMm: optional(candidate.transcriptMm),
      transcriptEn: optional(candidate.transcriptEn),
      durationSeconds: candidate.durationSeconds ?? undefined,
      attributionMm: optional(candidate.attributionMm),
      attributionEn: optional(candidate.attributionEn),
    };
  } catch {
    return null;
  }
}

export async function cacheOfflineMediaForContent(
  contentSlug: string,
  candidates: OfflineMediaCandidate[],
  savedAt = Date.now(),
): Promise<OfflineMediaRecord[]> {
  const records: OfflineMediaRecord[] = [];
  for (const candidate of candidates) {
    const record = await cacheOfflineMediaAsset(contentSlug, candidate, savedAt);
    if (record) records.push(record);
  }
  return records;
}

export async function readOfflineMediaObjectUrl(cacheKey: string): Promise<string | null> {
  if (!isOfflineMediaStorageAvailable()) return null;
  try {
    const response = await (await caches.open(OFFLINE_MEDIA_CACHE)).match(cacheKey);
    if (!response) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function keepExistingOfflineMedia(records: OfflineMediaRecord[]): Promise<OfflineMediaRecord[]> {
  if (!isOfflineMediaStorageAvailable()) return [];
  try {
    const cache = await caches.open(OFFLINE_MEDIA_CACHE);
    const checks = await Promise.all(records.map(async (record) => ({
      record,
      exists: Boolean(await cache.match(record.cacheKey)),
    })));
    return checks.filter(({ exists }) => exists).map(({ record }) => record);
  } catch {
    return [];
  }
}

export async function removeOfflineMedia(cacheKeys: string[]): Promise<boolean> {
  if (!isOfflineMediaStorageAvailable()) return cacheKeys.length === 0;
  try {
    const cache = await caches.open(OFFLINE_MEDIA_CACHE);
    await Promise.all([...new Set(cacheKeys)].map((key) => cache.delete(key)));
    return true;
  } catch {
    return false;
  }
}

export async function clearOfflineMedia(): Promise<boolean> {
  if (!isOfflineMediaStorageAvailable()) return true;
  try {
    await caches.delete(OFFLINE_MEDIA_CACHE);
    return true;
  } catch {
    return false;
  }
}
