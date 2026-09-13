import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  filterOfflineRecords,
  hasValidOfflineReferences,
  sanitizeOfflineReferences,
  selectDownloadable,
  toOfflineRecord,
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
  const sourceBoundRecords = records.filter(hasValidOfflineReferences);
  memoryCache = sourceBoundRecords;
  for (const notify of subscribers) notify(sourceBoundRecords);
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

export interface OfflineWithdrawalOutcome {
  ok: boolean;
  removed: number;
}

/**
 * Remove device-held text and media that are absent from a complete live
 * publication manifest. The server publishes only current parent-readable
 * slugs, so an archived/unpublished row disappears automatically on reconnect
 * rather than waiting for the parent to tap “Update download”.
 */
export async function withdrawUnavailableOfflineContent(
  publishedSlugs: string[],
): Promise<OfflineWithdrawalOutcome> {
  const stored = await readAllRecords();
  const published = new Set(publishedSlugs);
  const remove = stored.filter((record) => !published.has(record.slug));
  if (remove.length === 0) return { ok: true, removed: 0 };

  const keep = stored.filter((record) => published.has(record.slug));
  const ok = await saveRecords(keep, remove.map((record) => record.slug));
  if (!ok) return { ok: false, removed: 0 };

  await removeOfflineMedia(
    remove.flatMap((record) => (record.media ?? []).map((media) => media.cacheKey)),
  );
  publish(keep);
  return { ok: true, removed: remove.length };
}

/** Run once per live manifest revision from the authenticated app shell. */
export function useOfflineWithdrawal(): void {
  const manifest = useQuery(api.library.publicationManifest);
  const manifestKey = manifest?.complete ? manifest.slugs.join('\u0000') : null;

  useEffect(() => {
    if (!manifest?.complete || manifestKey === null) return;
    void withdrawUnavailableOfflineContent(manifest.slugs);
  }, [manifest, manifestKey]);
}

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
  const remote = useQuery(api.library.listByType, { ...filter, audience: 'parent' }) as LibraryResult;
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
  failure?: 'sources' | 'storage';
}

const TYPES_WITH_MEDIA = new Set(['activity', 'lesson', 'story', 'special_need', 'printable']);

async function addOfflineReferences(
  available: OfflineRecord[],
  savedAt: number,
): Promise<{ ok: true; records: OfflineRecord[] } | { ok: false }> {
  let convex: typeof import('../lib/convexClient')['convex'];
  try {
    ({ convex } = await import('../lib/convexClient'));
  } catch {
    return { ok: false };
  }

  const enriched = [...available];
  let nextIndex = 0;
  let failed = false;
  const worker = async () => {
    while (nextIndex < enriched.length) {
      const index = nextIndex;
      nextIndex += 1;
      const candidate = enriched[index];
      if (candidate.publicationLane !== 'ai_audited') continue;
      try {
        const result = await convex.query(api.offlineLibrary.getAiSnapshot, {
          slug: candidate.slug,
          kind: candidate.type,
        });
        if (
          !result.allowed
          || result.item.slug !== candidate.slug
          || result.item.type !== candidate.type
          || result.item.clinicalStatus !== 'clinical_review'
          || result.item.publicationLane !== 'ai_audited'
        ) {
          failed = true;
          continue;
        }
        const references = sanitizeOfflineReferences(result.sources);
        if (!references) {
          failed = true;
          continue;
        }
        // Never combine the caller's possibly stale list row with a later
        // evidence response. Persist only the content returned by the same
        // server transaction as these exact citations.
        enriched[index] = {
          ...toOfflineRecord(result.item, savedAt),
          references,
        };
      } catch {
        failed = true;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(4, enriched.length) }, () => worker()));
  return failed ? { ok: false } : { ok: true, records: enriched };
}

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
      if (record.publicationLane === 'ai_audited') {
        // The current AI release gate is text-only: parent-readable AI rows
        // require placeholder-only media with no URL or storage object. Never
        // query, reuse, or copy legacy same-slug media into that lane.
        enriched[index] = { ...record, media: [] };
        continue;
      }
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
    // Evidence is required for the AI-audited publication lane. Resolve its
    // current parent-visible citations before touching media or IndexedDB. If
    // any lookup fails, the previous download remains intact in full. The
    // conventional human-reviewed catalogue keeps its existing offline
    // compatibility contract and is not blocked by an absent citation row.
    const sourceResult = await addOfflineReferences(selected, now);
    if (!sourceResult.ok) {
      return { ok: false, saved: 0, removed: 0, mediaSaved: 0, failure: 'sources' };
    }
    const legacyAiKeys = [...new Set(stored
      .filter((record) => record.publicationLane === 'ai_audited')
      .flatMap((record) => record.media ?? [])
      .map((media) => media.cacheKey))];
    // The current AI publication lane is text-only. Remove every legacy AI
    // byte before any conventional media refresh can evict committed bytes;
    // if Cache Storage cannot confirm deletion, retain the previous IDB
    // manifest and fail closed without mutating the human media cache.
    if (legacyAiKeys.length > 0 && !(await removeOfflineMedia(legacyAiKeys))) {
      return { ok: false, saved: 0, removed: 0, mediaSaved: 0, failure: 'storage' };
    }
    const available = await addOfflineMedia(sourceResult.records, stored, now);
    const availableSlugs = new Set(available.map((record) => record.slug));
    // Anything held on the device that is no longer published must go: a
    // reviewer withdrawing content should not leave it readable offline.
    const remove = stored.map((r) => r.slug).filter((slug) => !availableSlugs.has(slug));
    const currentKeys = new Set(available.flatMap((record) => (record.media ?? []).map((media) => media.cacheKey)));
    const ok = await saveRecords(available, remove);
    if (ok) {
      const legacyAiKeySet = new Set(legacyAiKeys);
      const staleKeys = stored
        .flatMap((record) => record.media ?? [])
        .map((media) => media.cacheKey)
        .filter((cacheKey) => !currentKeys.has(cacheKey) && !legacyAiKeySet.has(cacheKey));
      await removeOfflineMedia(staleKeys);
      publish(available);
    }
    return {
      ok,
      saved: available.length,
      removed: remove.length,
      mediaSaved: available.reduce((sum, record) => sum + (record.media?.length ?? 0), 0),
      failure: ok ? undefined : 'storage',
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
