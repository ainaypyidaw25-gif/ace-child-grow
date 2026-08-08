// Bulk find-and-replace across the content library's editable wording.
//
// Deliberately literal, never regex or fuzzy: the reviewer types exact text
// to find and exact text to replace it with, and every occurrence in every
// title/summary/body field is swapped identically. A regex or fuzzy match
// here would silently touch text the reviewer never saw, which is not
// acceptable for content that ships to parents. This keeps its own compact
// field walker rather than importing one from ContentReviewWorkspace.tsx or
// convex/lib/reviewSearch.ts — matching this codebase's existing precedent
// of each consumer (the single-item editor, the fuzzy PDF-locator search,
// and now this literal bulk tool) owning a walker tuned to its own needs,
// rather than forcing one shared implementation to serve three different
// matching semantics.

// Same exclusion as ContentReviewWorkspace.tsx's HIDDEN_SYSTEM_FIELDS and
// convex/library.ts's protectedContentDataFields: taxonomy/system fields are
// never wording a reviewer edits, so a bulk pass must not touch them either
// — the server also refuses these via mergeEditableContentData, but the
// preview should not claim a change that would not actually apply.
const HIDDEN_DATA_FIELDS = new Set([
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

export type ContentBulkEditItem = {
  slug: string;
  type: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  data: unknown;
  reviewRevision?: number;
};

export type BulkReplaceFieldMatch = {
  /** Human-readable key: 'titleMm' | 'titleEn' | 'summaryMm' | 'summaryEn' | 'data.<path>'. */
  field: string;
  reference: string;
  before: string;
  after: string;
  occurrences: number;
};

export type BulkReplaceItemPreview = {
  slug: string;
  type: string;
  titleMm: string;
  titleEn: string;
  fields: BulkReplaceFieldMatch[];
};

export type BulkReplaceItemPayload = {
  titleMm: string;
  titleEn: string;
  summaryMm: string | undefined;
  summaryEn: string | undefined;
  data: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatReference(path: string[]): string {
  let reference = '';
  for (const segment of path) {
    if (/^\d+$/.test(segment)) reference += `[${Number(segment) + 1}]`;
    else reference += reference ? `.${segment}` : segment;
  }
  return reference || 'data';
}

type DataField = { path: string[]; reference: string; value: string };

function collectDataFields(value: unknown, path: string[] = []): DataField[] {
  if (typeof value === 'string') {
    return [{ path, reference: formatReference(path), value }];
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((entry) => typeof entry === 'string')) {
      return [{ path, reference: formatReference(path), value: value.join('\n') }];
    }
    return value.flatMap((entry, index) => collectDataFields(entry, [...path, String(index)]));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, entry]) => (
      HIDDEN_DATA_FIELDS.has(key) ? [] : collectDataFields(entry, [...path, key])
    ));
  }
  return [];
}

/** Non-overlapping literal occurrence count — the same rule String.replaceAll uses. */
export function countOccurrences(text: string, query: string, caseSensitive: boolean): number {
  if (!query) return 0;
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

/**
 * Literal (non-regex) find-and-replace-all. Case-insensitive mode walks the
 * string itself rather than building a RegExp from arbitrary user input,
 * which could contain regex metacharacters (`.`, `(`, `)`, `*`, …) the
 * reviewer typed as plain text.
 */
export function replaceAllLiteral(text: string, query: string, replacement: string, caseSensitive: boolean): string {
  if (!query) return text;
  if (caseSensitive) return text.split(query).join(replacement);
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let result = '';
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery, cursor);
  while (index !== -1) {
    result += text.slice(cursor, index) + replacement;
    cursor = index + query.length;
    index = lowerText.indexOf(lowerQuery, cursor);
  }
  return result + text.slice(cursor);
}

const TITLE_SUMMARY_KEYS = ['titleMm', 'titleEn', 'summaryMm', 'summaryEn'] as const;

/** Preview which items/fields a find-and-replace would touch, without writing anything. */
export function previewBulkReplace(
  items: readonly ContentBulkEditItem[],
  query: string,
  replacement: string,
  caseSensitive: boolean,
): BulkReplaceItemPreview[] {
  if (!query) return [];
  const previews: BulkReplaceItemPreview[] = [];
  for (const item of items) {
    const fields: BulkReplaceFieldMatch[] = [];
    for (const key of TITLE_SUMMARY_KEYS) {
      const value = item[key] ?? '';
      const occurrences = countOccurrences(value, query, caseSensitive);
      if (occurrences > 0) {
        fields.push({
          field: key,
          reference: key,
          before: value,
          after: replaceAllLiteral(value, query, replacement, caseSensitive),
          occurrences,
        });
      }
    }
    for (const dataField of collectDataFields(item.data)) {
      const occurrences = countOccurrences(dataField.value, query, caseSensitive);
      if (occurrences > 0) {
        fields.push({
          field: `data.${dataField.path.join('.')}`,
          reference: dataField.reference,
          before: dataField.value,
          after: replaceAllLiteral(dataField.value, query, replacement, caseSensitive),
          occurrences,
        });
      }
    }
    if (fields.length > 0) {
      previews.push({ slug: item.slug, type: item.type, titleMm: item.titleMm, titleEn: item.titleEn, fields });
    }
  }
  return previews;
}

function applyToData(value: unknown, query: string, replacement: string, caseSensitive: boolean): unknown {
  if (typeof value === 'string') return replaceAllLiteral(value, query, replacement, caseSensitive);
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((entry) => typeof entry === 'string')) {
      return value.map((entry) => replaceAllLiteral(entry, query, replacement, caseSensitive));
    }
    return value.map((entry) => applyToData(entry, query, replacement, caseSensitive));
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => (
      [key, HIDDEN_DATA_FIELDS.has(key) ? entry : applyToData(entry, query, replacement, caseSensitive)]
    )));
  }
  return value;
}

/** Apply a find-and-replace to one item, returning the payload updateDraft expects. */
export function applyBulkReplaceToItem(
  item: ContentBulkEditItem,
  query: string,
  replacement: string,
  caseSensitive: boolean,
): BulkReplaceItemPayload {
  const replace = (text: string) => replaceAllLiteral(text, query, replacement, caseSensitive);
  return {
    titleMm: replace(item.titleMm),
    titleEn: replace(item.titleEn),
    summaryMm: item.summaryMm !== undefined ? replace(item.summaryMm) : undefined,
    summaryEn: item.summaryEn !== undefined ? replace(item.summaryEn) : undefined,
    data: applyToData(item.data, query, replacement, caseSensitive),
  };
}
