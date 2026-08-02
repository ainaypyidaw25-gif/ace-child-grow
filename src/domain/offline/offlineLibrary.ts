// Offline library: what may be kept on the device, and what a download needs to
// change.
//
// SAFETY: only PUBLISHED educational content is ever eligible. Private child
// records (growth, sleep, health, milestones, appointments) must never be
// written to offline storage — that rule is enforced here, at the only place
// that decides what gets stored, rather than trusted to each caller.

/**
 * The subset of a library row worth keeping offline: text, not media blobs.
 *
 * Optional fields stay OPTIONAL rather than nullable so a stored record is
 * structurally the same shape the reading screens already receive from the
 * server — a screen must not need to know where its data came from.
 */
export interface OfflineRecord {
  _id: string;
  slug: string;
  type: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  tags: string[];
  difficulty?: string;
  durationMinutes?: number;
  clinicalStatus: string;
  reviewScope?: string;
  source?: string;
  /** The bilingual payload the reading screens render. */
  data: unknown;
  /** When this copy was taken, so a refresh can report staleness. */
  savedAt: number;
  /** Public educational media cached separately in Cache Storage. */
  media?: OfflineMediaRecord[];
}

export interface OfflineMediaRecord {
  id: string;
  kind: 'illustration' | 'audio';
  cacheKey: string;
  mimeType: string;
  sizeBytes: number;
  savedAt: number;
  altMm?: string;
  altEn?: string;
  captionMm?: string;
  captionEn?: string;
  transcriptMm?: string;
  transcriptEn?: string;
  durationSeconds?: number;
  attributionMm?: string;
  attributionEn?: string;
}

export interface OfflineMediaCandidate {
  id: string;
  kind: string;
  url: string | null;
  storageUrl: string | null;
  mimeType: string | null;
  altMm: string | null;
  altEn: string | null;
  captionMm: string | null;
  captionEn: string | null;
  transcriptMm: string | null;
  transcriptEn: string | null;
  durationSeconds: number | null;
  attributionMm: string | null;
  attributionEn: string | null;
}

export function offlineMediaSource(candidate: OfflineMediaCandidate): string | null {
  return candidate.storageUrl ?? candidate.url;
}

/** Keep the first media release deliberately bounded to images and audio. */
export function isDownloadableMedia(candidate: OfflineMediaCandidate): boolean {
  const source = offlineMediaSource(candidate);
  if (!source || !['illustration', 'audio'].includes(candidate.kind)) return false;
  try {
    return new URL(source).protocol === 'https:';
  } catch {
    return false;
  }
}

/** A library row as the parent-facing queries return it. */
export interface LibraryRowLike {
  _id: string;
  slug: string;
  type: string;
  clinicalStatus: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  tags?: string[];
  difficulty?: string;
  durationMinutes?: number;
  data?: unknown;
  reviewScope?: string;
  source?: string;
}

export function isDownloadable(row: LibraryRowLike): boolean {
  return row.clinicalStatus === 'published';
}

export function toOfflineRecord(row: LibraryRowLike, savedAt: number): OfflineRecord {
  return {
    _id: row._id,
    slug: row.slug,
    type: row.type,
    titleMm: row.titleMm,
    titleEn: row.titleEn,
    summaryMm: row.summaryMm,
    summaryEn: row.summaryEn,
    ageGroupKey: row.ageGroupKey,
    domainKey: row.domainKey,
    category: row.category,
    tags: row.tags ?? [],
    difficulty: row.difficulty,
    durationMinutes: row.durationMinutes,
    clinicalStatus: row.clinicalStatus,
    reviewScope: row.reviewScope,
    source: row.source,
    data: row.data ?? {},
    savedAt,
  };
}

/**
 * Keep only what a parent may hold offline. Anything not published is dropped
 * here, so an upstream query change can never leak review-stage content onto a
 * device where it would survive the item being unpublished.
 */
export function selectDownloadable(rows: LibraryRowLike[], savedAt: number): OfflineRecord[] {
  return rows.filter(isDownloadable).map((row) => toOfflineRecord(row, savedAt));
}

/** Rough on-device size. Exact bytes need the storage engine; this is for the UI. */
export function estimateBytes(record: OfflineRecord): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Blob([JSON.stringify(record)]).size;
  } catch {
    return JSON.stringify(record).length;
  }
}

export function totalBytes(records: OfflineRecord[]): number {
  return records.reduce((sum, record) => sum + estimateBytes(record), 0);
}

export function totalMediaBytes(records: OfflineRecord[]): number {
  return records.reduce(
    (sum, record) => sum + (record.media ?? []).reduce((mediaSum, media) => mediaSum + media.sizeBytes, 0),
    0,
  );
}

export function totalMediaCount(records: OfflineRecord[]): number {
  return records.reduce((sum, record) => sum + (record.media?.length ?? 0), 0);
}

export interface DownloadPlan {
  /** Records to write (new or changed). */
  put: OfflineRecord[];
  /** Slugs held on the device that are no longer published, to remove. */
  remove: string[];
  unchanged: number;
}

/**
 * Compare what is available now against what the device already holds.
 *
 * `remove` matters as much as `put`: when content is unpublished — because a
 * reviewer found a problem with it — a device that already downloaded it must
 * drop it on the next refresh rather than keep showing withdrawn guidance.
 */
export function buildDownloadPlan(
  available: OfflineRecord[],
  stored: Array<Pick<OfflineRecord, 'slug' | 'savedAt'>>,
): DownloadPlan {
  const storedBySlug = new Map(stored.map((record) => [record.slug, record]));
  const availableSlugs = new Set(available.map((record) => record.slug));
  const put: OfflineRecord[] = [];
  let unchanged = 0;

  for (const record of available) {
    const existing = storedBySlug.get(record.slug);
    if (existing) unchanged += 1;
    put.push(record);
  }

  const remove = stored
    .map((record) => record.slug)
    .filter((slug) => !availableSlugs.has(slug));

  return { put, remove, unchanged };
}

export interface LibraryFilter {
  type: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  q?: string;
}

/**
 * Apply the same filtering the server query does, so a screen reading from the
 * device shows the same set it would online — just without live updates.
 */
export function filterOfflineRecords(records: OfflineRecord[], filter: LibraryFilter): OfflineRecord[] {
  const needle = filter.q?.trim().toLowerCase();
  return records
    .filter((record) => record.type === filter.type)
    .filter((record) => !filter.ageGroupKey || record.ageGroupKey === filter.ageGroupKey)
    .filter((record) => !filter.domainKey || record.domainKey === filter.domainKey)
    .filter((record) => !filter.category || record.category === filter.category)
    .filter((record) => {
      if (!needle) return true;
      const haystack = [
        record.slug, record.titleMm, record.titleEn,
        record.summaryMm ?? '', record.summaryEn ?? '', record.tags.join(' '),
      ].join(' ').toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Group counts by content type, for the summary line. */
export function countByType(records: Array<Pick<OfflineRecord, 'type'>>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) counts[record.type] = (counts[record.type] ?? 0) + 1;
  return counts;
}
