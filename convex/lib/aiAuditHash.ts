/** Deterministic JSON used only for bounded AI-audit snapshot hashing. */
export function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Audit snapshots require finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
  }
  throw new Error(`Unsupported audit snapshot value: ${typeof value}`);
}

export async function sha256Canonical(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type AiContentSnapshotInput = {
  type: string;
  slug: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  tags: readonly string[];
  difficulty?: string;
  durationMinutes?: number;
  offline?: boolean;
  data: unknown;
  source: string;
  version: number;
  reviewRevision?: number;
};

export function aiContentSnapshot(content: AiContentSnapshotInput): Record<string, unknown> {
  return {
    type: content.type,
    slug: content.slug,
    ageGroupKey: content.ageGroupKey,
    domainKey: content.domainKey,
    category: content.category,
    titleMm: content.titleMm,
    titleEn: content.titleEn,
    summaryMm: content.summaryMm,
    summaryEn: content.summaryEn,
    tags: content.tags,
    difficulty: content.difficulty,
    durationMinutes: content.durationMinutes,
    offline: content.offline,
    data: content.data,
    source: content.source,
    version: content.version,
    reviewRevision: content.reviewRevision ?? 1,
  };
}

export type AiEvidenceSnapshotInput = {
  sourceId: string;
  org: string;
  orgKey: string;
  title: string;
  authors: string | null;
  year: number | null;
  edition: string | null;
  country: string | null;
  language: string;
  url: string;
  doi: string | null;
  isbn: string | null;
  pmid: string | null;
  evidenceLevel: string;
  keywords: readonly string[];
  topics: readonly string[];
  ageMonthsMin: number | null;
  ageMonthsMax: number | null;
  verifiedOn: string | null;
  verifiedNote: string;
  nextReviewDate: string | null;
};

/** Human reviewer identity/status are deliberately absent from the AI hash. */
export function aiEvidenceSnapshot(source: AiEvidenceSnapshotInput): Record<string, unknown> {
  return {
    sourceId: source.sourceId,
    org: source.org,
    orgKey: source.orgKey,
    title: source.title,
    authors: source.authors,
    year: source.year,
    edition: source.edition,
    country: source.country,
    language: source.language,
    url: source.url,
    doi: source.doi,
    isbn: source.isbn,
    pmid: source.pmid,
    evidenceLevel: source.evidenceLevel,
    keywords: source.keywords,
    topics: source.topics,
    ageMonthsMin: source.ageMonthsMin,
    ageMonthsMax: source.ageMonthsMax,
    verifiedOn: source.verifiedOn,
    verifiedNote: source.verifiedNote,
    nextReviewDate: source.nextReviewDate,
  };
}

export function aiEvidenceLinkSnapshot(link: {
  kind: string;
  slug: string;
  sourceIds: readonly string[];
}): Record<string, unknown> {
  return { kind: link.kind, slug: link.slug, sourceIds: link.sourceIds };
}
