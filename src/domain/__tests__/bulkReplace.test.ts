import { describe, expect, it } from 'vitest';
import {
  applyBulkReplaceToItem,
  countOccurrences,
  previewBulkReplace,
  replaceAllLiteral,
  type ContentBulkEditItem,
} from '../content/bulkReplace';

describe('countOccurrences', () => {
  it('counts non-overlapping literal occurrences', () => {
    expect(countOccurrences('ရှာစေပါ ရှာစေပါ ရှာစေပါ', 'ရှာစေပါ', true)).toBe(3);
  });

  it('is case-sensitive by default and case-insensitive on request', () => {
    expect(countOccurrences('Sleep and sleep', 'sleep', true)).toBe(1);
    expect(countOccurrences('Sleep and sleep', 'sleep', false)).toBe(2);
  });

  it('returns 0 for an empty query rather than looping forever', () => {
    expect(countOccurrences('anything', '', true)).toBe(0);
  });

  it('does not double-count overlapping occurrences', () => {
    expect(countOccurrences('aaaa', 'aa', true)).toBe(2);
  });
});

describe('replaceAllLiteral', () => {
  it('replaces every literal occurrence', () => {
    expect(replaceAllLiteral('ရှာစေပါ ကို ရှာစေပါ', 'ရှာစေပါ', 'ရှာပါစေ', true)).toBe('ရှာပါစေ ကို ရှာပါစေ');
  });

  it('treats the query as literal text, not a regex', () => {
    expect(replaceAllLiteral('a.b.c', '.', '-', true)).toBe('a-b-c');
    expect(replaceAllLiteral('price: $5 (sale)', '(sale)', '', true)).toBe('price: $5 ');
  });

  it('replaces case-insensitively without corrupting untouched text', () => {
    expect(replaceAllLiteral('Sleep tracking and sleep tips', 'sleep', 'nap', false)).toBe('nap tracking and nap tips');
  });

  it('is a no-op for an empty query', () => {
    expect(replaceAllLiteral('unchanged', '', 'x', true)).toBe('unchanged');
  });
});

function item(overrides: Partial<ContentBulkEditItem> = {}): ContentBulkEditItem {
  return {
    slug: 'ms_1',
    type: 'milestone',
    titleMm: 'ခေါင်းစဉ်',
    titleEn: 'Title',
    summaryMm: undefined,
    summaryEn: undefined,
    data: {},
    reviewRevision: 1,
    ...overrides,
  };
}

describe('previewBulkReplace', () => {
  it('finds matches in title, summary, and nested data fields', () => {
    const items = [
      item({
        slug: 'ms_1',
        titleMm: 'ကလေးရှာစေပါ',
        summaryMm: 'ရှာစေပါ ဤနေရာတွင်',
        data: { observeMm: 'ရှာစေပါ ဆိုသည်မှာ', steps: ['step one', 'ရှာစေပါ two'] },
      }),
    ];
    const previews = previewBulkReplace(items, 'ရှာစေပါ', 'ရှာပါစေ', true);
    expect(previews).toHaveLength(1);
    const fieldKeys = previews[0]!.fields.map((f) => f.field).sort();
    expect(fieldKeys).toEqual(['data.observeMm', 'data.steps', 'summaryMm', 'titleMm']);
    const stepsField = previews[0]!.fields.find((f) => f.field === 'data.steps')!;
    expect(stepsField.occurrences).toBe(1);
    expect(stepsField.after).toContain('ရှာပါစေ two');
  });

  it('skips items with no occurrence of the query', () => {
    const items = [item({ titleMm: 'မတူညီသော စာသား' })];
    expect(previewBulkReplace(items, 'ရှာစေပါ', 'ရှာပါစေ', true)).toHaveLength(0);
  });

  it('returns nothing for an empty query', () => {
    const items = [item({ titleMm: 'ရှာစေပါ' })];
    expect(previewBulkReplace(items, '', 'x', true)).toHaveLength(0);
  });

  it('respects the case-sensitivity flag', () => {
    const items = [item({ titleEn: 'Sleep schedule' })];
    expect(previewBulkReplace(items, 'sleep', 'nap', true)).toHaveLength(0);
    expect(previewBulkReplace(items, 'sleep', 'nap', false)).toHaveLength(1);
  });

  it('never reports a match inside a protected/system field', () => {
    const items = [item({
      data: { domains: ['sleep'], evidenceSummary: 'sleep study', observeMm: 'no match here' },
    })];
    expect(previewBulkReplace(items, 'sleep', 'nap', true)).toHaveLength(0);
  });
});

describe('applyBulkReplaceToItem', () => {
  it('replaces title, summary and nested data, leaving untouched fields as-is', () => {
    const original = item({
      titleMm: 'ရှာစေပါ ခေါင်းစဉ်',
      titleEn: 'Untouched title',
      summaryMm: 'ရှာစေပါ အနှစ်ချုပ်',
      data: { observeMm: 'ရှာစေပါ ဆိုသည်မှာ', other: 'no match' },
    });
    const result = applyBulkReplaceToItem(original, 'ရှာစေပါ', 'ရှာပါစေ', true);
    expect(result.titleMm).toBe('ရှာပါစေ ခေါင်းစဉ်');
    expect(result.titleEn).toBe('Untouched title');
    expect(result.summaryMm).toBe('ရှာပါစေ အနှစ်ချုပ်');
    expect((result.data as { observeMm: string; other: string }).observeMm).toBe('ရှာပါစေ ဆိုသည်မှာ');
    expect((result.data as { observeMm: string; other: string }).other).toBe('no match');
  });

  it('leaves protected/system data fields untouched even when they contain the query text', () => {
    const original = item({ data: { domains: ['sleep'], evidenceSummary: 'sleep study' } });
    const result = applyBulkReplaceToItem(original, 'sleep', 'nap', true);
    expect((result.data as { domains: string[]; evidenceSummary: string }).domains).toEqual(['sleep']);
    expect((result.data as { domains: string[]; evidenceSummary: string }).evidenceSummary).toBe('sleep study');
  });

  it('preserves undefined summary fields as undefined, not empty strings', () => {
    const original = item({ summaryMm: undefined, summaryEn: undefined });
    const result = applyBulkReplaceToItem(original, 'x', 'y', true);
    expect(result.summaryMm).toBeUndefined();
    expect(result.summaryEn).toBeUndefined();
  });
});
