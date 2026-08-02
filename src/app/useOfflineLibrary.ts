import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  filterOfflineRecords,
  selectDownloadable,
  type LibraryFilter,
  type LibraryRowLike,
  type OfflineRecord,
} from '../domain/offline/offlineLibrary';
import { readAllRecords, saveRecords } from './offlineStore';

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
}

/** Save the currently published library to the device. */
export function useOfflineDownload(): {
  download: (rows: LibraryRowLike[]) => Promise<DownloadOutcome>;
  clear: () => Promise<boolean>;
} {
  const download = useCallback(async (rows: LibraryRowLike[]): Promise<DownloadOutcome> => {
    const now = Date.now();
    const available = selectDownloadable(rows, now);
    const stored = await readAllRecords();
    const availableSlugs = new Set(available.map((record) => record.slug));
    // Anything held on the device that is no longer published must go: a
    // reviewer withdrawing content should not leave it readable offline.
    const remove = stored.map((r) => r.slug).filter((slug) => !availableSlugs.has(slug));
    const ok = await saveRecords(available, remove);
    if (ok) publish(available);
    return { ok, saved: available.length, removed: remove.length };
  }, []);

  const clear = useCallback(async (): Promise<boolean> => {
    const ok = await saveRecords([], (await readAllRecords()).map((r) => r.slug));
    if (ok) publish([]);
    return ok;
  }, []);

  return { download, clear };
}
