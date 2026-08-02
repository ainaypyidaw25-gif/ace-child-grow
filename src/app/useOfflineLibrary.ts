import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  filterOfflineRecords,
  selectDownloadable,
  type LibraryFilter,
  type LibraryRowLike,
  type OfflineMediaCandidate,
  type OfflineRecord,
} from '../domain/offline/offlineLibrary';
import { readAllRecords, saveRecords } from './offlineStore';
import {
  cacheOfflineMediaForContent,
  clearOfflineMedia,
  isOfflineMediaStorageAvailable,
  keepExistingOfflineMedia,
  removeOfflineMedia,
} from './offlineMediaStore';

// Convex delivers data over a WebSocket, so with no connection `useQuery` stays
// `undefined` forever — a downloaded copy is the only way a parent can read
// anything offline. These hooks keep that fallback in one place so screens do
// not each grow their own copy of the rule.

/** Cache of downloaded records, shared by every screen in the session. */
let memoryCache: OfflineRecord[] | null = null;
const subscribers = new Set<(records: OfflineRecord[]) => void>();

function publish(records: OfflineRecord[]): void {
  memoryCache = records;
  for (const notify of subscribers) notify(records);
}

/** Read the downloaded library, loading it from the device once per session. */
export function useDownloadedLibrary(): { records: OfflineRecord[]; loaded: boolean } {
  const [records, setRecords] = useState<OfflineRecord[] | null>(memoryCache);

  useEffect(() => {
    subscribers.add(setRecords);
    if (memoryCache === null) {
      void readAllRecords().then((stored) => publish(stored));
    }
    return () => {
      subscribers.delete(setRecords);
    };
  }, []);

  return { records: records ?? [], loaded: records !== null };
}

export type LibraryResult = { staff: boolean; items: LibraryRowLike[] } | undefined;

/**
 * The parent-facing library query with an offline fallback.
 *
 * Live server data always wins when it arrives. Only while the query is
 * unresolved — loading, or offline with no socket — do we fall back to the
 * downloaded copy, so a parent never sees a stale record in place of a fresh
 * one, and content withdrawn from publication disappears as soon as the app can
 * reach the server again.
 */
export function useLibraryContent(filter: LibraryFilter): LibraryResult {
  const remote = useQuery(api.library.listByType, filter) as LibraryResult;
  const { records, loaded } = useDownloadedLibrary();

  return useMemo(() => {
    if (remote !== undefined) return remote;
    if (!loaded || records.length === 0) return undefined;
    const items = filterOfflineRecords(records, filter);
    if (items.length === 0) return undefined;
    return { staff: false, items: items as unknown as LibraryRowLike[] };
  }, [remote, records, loaded, filter]);
}

export interface DownloadOutcome {
  ok: boolean;
  saved: number;
  removed: number;
  mediaSaved: number;
}

const TYPES_WITH_MEDIA = new Set(['activity', 'lesson', 'story', 'special_need', 'printable']);

async function addOfflineMedia(
  available: OfflineRecord[],
  stored: OfflineRecord[],
  savedAt: number,
): Promise<OfflineRecord[]> {
  if (!isOfflineMediaStorageAvailable()) return available.map((record) => ({ ...record, media: [] }));
  // Load the authenticated client only after the parent taps Download. Reading
  // any library screen stays lightweight and test mocks do not need a client.
  const { convex } = await import('../lib/convexClient');
  const storedBySlug = new Map(stored.map((record) => [record.slug, record]));
  const enriched = [...available];
  let nextIndex = 0;

  // A bounded worker pool avoids opening hundreds of simultaneous Convex reads
  // on a larger catalogue. Each read is still publication- and entitlement-
  // gated by media.listForContent on the server.
  const worker = async () => {
    while (nextIndex < enriched.length) {
      const index = nextIndex;
      nextIndex += 1;
      const record = enriched[index];
      if (!TYPES_WITH_MEDIA.has(record.type)) continue;
      try {
        const candidates = await convex.query(api.media.listForContent, { contentSlug: record.slug });
        const media = await cacheOfflineMediaForContent(
          record.slug,
          candidates as OfflineMediaCandidate[],
          savedAt,
        );
        enriched[index] = { ...record, media };
      } catch {
        // A temporary media failure must not throw away a previously downloaded
        // asset. Text download can still complete and the parent may retry later.
        enriched[index] = { ...record, media: storedBySlug.get(record.slug)?.media ?? [] };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(4, enriched.length) }, () => worker()));
  for (let index = 0; index < enriched.length; index += 1) {
    const media = await keepExistingOfflineMedia(enriched[index].media ?? []);
    enriched[index] = { ...enriched[index], media };
  }
  return enriched;
}

/** Save the currently published library to the device. */
export function useOfflineDownload(): {
  download: (rows: LibraryRowLike[]) => Promise<DownloadOutcome>;
  clear: () => Promise<boolean>;
} {
  const download = useCallback(async (rows: LibraryRowLike[]): Promise<DownloadOutcome> => {
    const now = Date.now();
    const selected = selectDownloadable(rows, now);
    const stored = await readAllRecords();
    const available = await addOfflineMedia(selected, stored, now);
    const availableSlugs = new Set(available.map((record) => record.slug));
    // Anything held on the device that is no longer published must go: a
    // reviewer withdrawing content should not leave it readable offline.
    const remove = stored.map((r) => r.slug).filter((slug) => !availableSlugs.has(slug));
    const ok = await saveRecords(available, remove);
    if (ok) {
      const currentKeys = new Set(available.flatMap((record) => (record.media ?? []).map((media) => media.cacheKey)));
      const staleKeys = stored
        .flatMap((record) => record.media ?? [])
        .map((media) => media.cacheKey)
        .filter((cacheKey) => !currentKeys.has(cacheKey));
      await removeOfflineMedia(staleKeys);
      publish(available);
    }
    return {
      ok,
      saved: available.length,
      removed: remove.length,
      mediaSaved: available.reduce((sum, record) => sum + (record.media?.length ?? 0), 0),
    };
  }, []);

  const clear = useCallback(async (): Promise<boolean> => {
    const ok = await saveRecords([], (await readAllRecords()).map((r) => r.slug));
    const mediaOk = await clearOfflineMedia();
    if (ok) publish([]);
    return ok && mediaOk;
  }, []);

  return { download, clear };
}
