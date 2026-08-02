export type SearchValue = string | number | null | undefined | readonly SearchValue[];

export function normalizeSearchText(value: SearchValue): string {
  if (Array.isArray(value)) return value.map(normalizeSearchText).filter(Boolean).join(' ');
  if (value === null || value === undefined) return '';
  return String(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Match every word in the query against one combined, normalized search index.
 * This keeps Myanmar/English titles, slugs and metadata searchable together.
 */
export function matchesSearchQuery(query: string, values: readonly SearchValue[]): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  const haystack = normalizeSearchText(values);
  return normalizedQuery.split(' ').every((term) => haystack.includes(term));
}
