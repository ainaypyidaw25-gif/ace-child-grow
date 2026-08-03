export type ReviewSearchRow = {
  slug: string;
  type: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  category?: string;
  ageGroupKey?: string;
  domainKey?: string;
  clinicalStatus: string;
  reviewRevision?: number;
  searchText: string;
  data: unknown;
};

export type ReviewFieldMatch = {
  path: string;
  reference: string;
  language: 'mm' | 'en' | 'neutral';
  value: string;
};

export type ReviewSearchResult = {
  slug: string;
  type: string;
  titleMm: string;
  titleEn: string;
  category: string | null;
  ageGroupKey: string | null;
  domainKey: string | null;
  clinicalStatus: string;
  reviewRevision: number;
  matches: ReviewFieldMatch[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const HIDDEN_REVIEW_FIELDS = new Set([
  'editorialStatus',
  'evidenceSummary',
  'format',
  'readingLevel',
  'domains',
  'references',
  'relatedMilestones',
  'relatedLessons',
  'relatedActivities',
]);

export function normalizeReviewSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/gu, '')
    .replace(/[._·•()[\]{}:;/\\-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function matchesEveryTerm(query: string, values: string[]): boolean {
  const terms = normalizeReviewSearchText(query).split(' ').filter(Boolean);
  if (terms.length === 0) return false;
  const haystack = normalizeReviewSearchText(values.join(' '));
  return terms.every((term) => haystack.includes(term));
}

function matchesField(query: string, field: ReviewFieldMatch): boolean {
  const normalizedQuery = normalizeReviewSearchText(query);
  const locatorQuery = normalizedQuery.replace(
    /^\d+\s+(?=(?:quiz|options|objectives|instructions|takeaway|actiontoday|body|summary|title)\b)/iu,
    '',
  );
  const normalizedReference = normalizeReviewSearchText(field.reference);
  // PDF locators are ordered paths, not bags of words. Requiring the ordered
  // phrase prevents `quiz 1 options 1` from also matching option 2 merely
  // because the earlier quiz index contains the digit 1.
  const looksLikePdfLocator = /\d/u.test(locatorQuery)
    && /(?:quiz|options|objectives|instructions|takeaway|actiontoday|body|summary|title)/iu.test(locatorQuery);
  if (looksLikePdfLocator) return normalizedReference.includes(locatorQuery);
  return matchesEveryTerm(query, [field.reference, field.value]);
}

function fieldLanguage(path: string[], value: string): ReviewFieldMatch['language'] {
  const key = path[path.length - 1] ?? '';
  if (/mm$/i.test(key) || /[\u1000-\u109f]/u.test(value)) return 'mm';
  if (/en$/i.test(key)) return 'en';
  return 'neutral';
}

export function formatReviewFieldReference(path: string[]): string {
  const visible = path[0] === 'data' ? path.slice(1) : path[0] === 'meta' ? path.slice(1) : path;
  let reference = '';
  for (const segment of visible) {
    if (/^\d+$/.test(segment)) {
      reference += `[${Number(segment) + 1}]`;
    } else {
      reference += reference ? `.${segment}` : segment;
    }
  }
  return reference;
}

function collectDataFields(value: unknown, path: string[] = ['data']): ReviewFieldMatch[] {
  if (typeof value === 'string') {
    return [{
      path: path.join('.'),
      reference: formatReviewFieldReference(path),
      language: fieldLanguage(path, value),
      value,
    }];
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((entry) => typeof entry === 'string')) {
      const combined = value.join('\n');
      return [{
        path: path.join('.'),
        reference: formatReviewFieldReference(path),
        language: fieldLanguage(path, combined),
        value: combined,
      }];
    }
    return value.flatMap((entry, index) => collectDataFields(entry, [...path, String(index)]));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, entry]) => (
      HIDDEN_REVIEW_FIELDS.has(key) ? [] : collectDataFields(entry, [...path, key])
    ));
  }
  return [];
}

function searchableFields(row: ReviewSearchRow): ReviewFieldMatch[] {
  const fields: ReviewFieldMatch[] = [
    { path: 'meta.titleMm', reference: 'titleMm', language: 'mm', value: row.titleMm },
    { path: 'meta.titleEn', reference: 'titleEn', language: 'en', value: row.titleEn },
  ];
  if (row.summaryMm) fields.push({ path: 'meta.summaryMm', reference: 'summaryMm', language: 'mm', value: row.summaryMm });
  if (row.summaryEn) fields.push({ path: 'meta.summaryEn', reference: 'summaryEn', language: 'en', value: row.summaryEn });
  return [...fields, ...collectDataFields(row.data)];
}

function rankResult(row: ReviewSearchRow, query: string, matches: ReviewFieldMatch[]): number {
  const normalized = normalizeReviewSearchText(query);
  const slug = normalizeReviewSearchText(row.slug);
  const titles = [normalizeReviewSearchText(row.titleMm), normalizeReviewSearchText(row.titleEn)];
  if (slug === normalized || titles.includes(normalized)) return 0;
  if (slug.startsWith(normalized)) return 1;
  if (matches.some((match) => normalizeReviewSearchText(match.reference) === normalized)) return 2;
  if (matches.some((match) => normalizeReviewSearchText(match.value) === normalized)) return 3;
  return 4;
}

export function findReviewContentMatches(
  rows: ReviewSearchRow[],
  query: string,
  resultLimit = 50,
  fieldLimit = 8,
): ReviewSearchResult[] {
  if (!normalizeReviewSearchText(query)) return [];

  const candidates = rows
    .map((row, originalIndex) => {
      const fields = searchableFields(row);
      const matches = fields.filter((field) => matchesField(query, field));
      const metadataMatches = matchesEveryTerm(query, [
        row.slug,
        row.type,
        row.titleMm,
        row.titleEn,
        row.summaryMm ?? '',
        row.summaryEn ?? '',
        row.category ?? '',
        row.ageGroupKey ?? '',
        row.domainKey ?? '',
        row.clinicalStatus,
        row.searchText,
      ]);
      if (!metadataMatches && matches.length === 0) return null;
      return {
        originalIndex,
        rank: rankResult(row, query, matches),
        result: {
          slug: row.slug,
          type: row.type,
          titleMm: row.titleMm,
          titleEn: row.titleEn,
          category: row.category ?? null,
          ageGroupKey: row.ageGroupKey ?? null,
          domainKey: row.domainKey ?? null,
          clinicalStatus: row.clinicalStatus,
          reviewRevision: row.reviewRevision ?? 1,
          matches: matches.slice(0, fieldLimit).map((match) => ({
            ...match,
            value: match.value.length > 500 ? `${match.value.slice(0, 497)}…` : match.value,
          })),
        } satisfies ReviewSearchResult,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((left, right) => left.rank - right.rank || left.originalIndex - right.originalIndex);

  const normalizedQuery = normalizeReviewSearchText(query);
  const exactIdentifiers = candidates.filter(({ result }) => (
    normalizeReviewSearchText(result.slug) === normalizedQuery
    || normalizeReviewSearchText(result.titleMm) === normalizedQuery
    || normalizeReviewSearchText(result.titleEn) === normalizedQuery
  ));

  return (exactIdentifiers.length > 0 ? exactIdentifiers : candidates)
    .slice(0, resultLimit)
    .map((entry) => entry.result);
}
