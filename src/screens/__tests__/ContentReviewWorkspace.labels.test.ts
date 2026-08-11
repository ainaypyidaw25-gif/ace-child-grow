import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectEditableFields,
  contentTypeLabel,
  decisionLabel,
  dimensionLabel,
  findReviewSearchResults,
  formatEditorFieldReference,
  HIDDEN_SYSTEM_FIELDS,
  humanizeField,
  reviewFieldElementId,
  updateStructuredField,
  type EditableField,
} from '../ContentReviewWorkspace';

function field(key: string, path: string[], language: EditableField['language']): EditableField {
  return { key, path, language, value: '', multiline: false, list: false };
}

describe('reviewer content field labels', () => {
  const searchCandidate = (overrides: Partial<Parameters<typeof findReviewSearchResults>[0][number]> = {}) => ({
    slug: 'activity-one',
    titleMm: 'နေ့စဉ် ကစားခြင်း',
    titleEn: 'Daily play',
    type: 'activity',
    category: 'play',
    ageGroupKey: '2y',
    domainKey: 'motor',
    clinicalStatus: 'clinical_review',
    reviewScope: null,
    reviewRevision: 5,
    priority: 'P3',
    riskClass: 'A',
    riskReasons: [],
    activeReviewers: [],
    priorityStatus: 'unreviewed',
    ...overrides,
  });

  it('searches the entire permitted review catalogue and ranks exact PDF identifiers first', () => {
    const rows = [
      searchCandidate({ slug: 'daily-routine', titleEn: 'Daily routine', type: 'guide' }),
      searchCandidate({ slug: 'daily-song', titleEn: 'Daily song', type: 'activity' }),
      searchCandidate({ slug: 'other', titleEn: 'Other' }),
    ];
    expect(findReviewSearchResults(rows, 'daily-song').map((row) => row.slug)).toEqual(['daily-song']);
    expect(findReviewSearchResults(rows, 'daily').map((row) => row.slug)).toEqual(['daily-routine', 'daily-song']);
  });

  it('finds review rows by bilingual title and revision metadata', () => {
    const rows = [searchCandidate(), searchCandidate({ slug: 'other', titleMm: 'အခြား', titleEn: 'Other', reviewRevision: 2 })];
    expect(findReviewSearchResults(rows, 'နေ့စဉ်').map((row) => row.slug)).toEqual(['activity-one']);
    expect(findReviewSearchResults(rows, 'activity 5').map((row) => row.slug)).toEqual(['activity-one']);
  });

  it('localises content types instead of exposing storage keys', () => {
    expect(contentTypeLabel('special_need', 'mm')).toBe('အထူးလိုအပ်ချက်');
    expect(contentTypeLabel('special_need', 'en')).toBe('Special needs');
    expect(contentTypeLabel('unknown_legacy_type', 'mm')).toBe('unknown_legacy_type');
  });

  it('gives direct bilingual milestone fields clear Myanmar labels', () => {
    expect(humanizeField(field('encouragementMm', ['encouragementMm'], 'mm'), 'mm')).toBe('အားပေးစကား');
    expect(humanizeField(field('encouragementEn', ['encouragementEn'], 'en'), 'mm')).toBe('အားပေးစကား (English)');
    expect(humanizeField(field('redMm', ['redMm'], 'mm'), 'mm')).toBe('သတိပြုရမည့်အချက်');
  });

  it('turns nested bilingual FAQ keys into plain numbered labels', () => {
    expect(humanizeField(field('mm', ['faq', '0', 'q', 'mm'], 'mm'), 'mm')).toBe('မေးခွန်း 1 (မြန်မာ)');
    expect(humanizeField(field('en', ['faq', '0', 'q', 'en'], 'en'), 'mm')).toBe('မေးခွန်း 1 (English)');
    expect(humanizeField(field('mm', ['faq', '1', 'a', 'mm'], 'mm'), 'mm')).toBe('အဖြေ 2 (မြန်မာ)');
  });

  it('labels common reviewer sections without exposing data keys', () => {
    expect(humanizeField(field('mm', ['safety', '0', 'mm'], 'mm'), 'mm')).toBe('ဘေးကင်းရေး သတိပြုရန် 1 (မြန်မာ)');
    expect(humanizeField(field('en', ['encouragement', 'en'], 'en'), 'en')).toBe('Encouragement (English)');
    expect(humanizeField(field('mm', ['actionToday', 'mm'], 'mm'), 'mm')).toBe('ယနေ့ စတင်လုပ်ဆောင်ရန် (မြန်မာ)');
    expect(humanizeField(field('mm', ['parentTips', '2', 'mm'], 'mm'), 'mm')).toBe('မိဘအတွက် အကြံပြုချက် 3 (မြန်မာ)');
    expect(humanizeField(field('en', ['redFlags', '0', 'en'], 'en'), 'en')).toBe('Warning sign 1 (English)');
  });

  it('shows the same one-based field reference printed on the PDF and creates a safe focus id', () => {
    expect(formatEditorFieldReference(['quiz', '0', 'options', '0', 'mm']))
      .toBe('quiz[1].options[1].mm');
    expect(reviewFieldElementId('data.quiz.0.options.0.mm'))
      .toBe('review-field-data-quiz-0-options-0-mm');
  });

  it('keeps system metadata out of the plain-language editor', () => {
    const fields = collectEditableFields({
      body: { mm: 'မိဘဖတ်ရန်စာ', en: 'Parent-facing copy' },
      editorialStatus: 'reference_verified',
      evidenceSummary: 'internal evidence note',
      format: 'A4 PDF',
      readingLevel: 'easy',
    });

    expect(fields.map((entry) => entry.path.join('.'))).toEqual(['body.mm', 'body.en']);
  });

  it('turns string lists into one plain multiline field and ignores non-text values', () => {
    const fields = collectEditableFields({
      stepsMm: ['ပထမအဆင့်', 'ဒုတိယအဆင့်'],
      readingMinutes: 3,
      offline: true,
      empty: [],
    });

    expect(fields).toEqual([
      expect.objectContaining({
        key: 'stepsMm',
        value: 'ပထမအဆင့်\nဒုတိယအဆင့်',
        multiline: true,
        list: true,
      }),
    ]);
  });

  it('opens and edits reviewer fields without Array.prototype.at support', () => {
    const atDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, 'at');
    Object.defineProperty(Array.prototype, 'at', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    try {
      const content = {
        body: { mm: 'မိဘဖတ်ရန်စာ', en: 'Parent-facing copy' },
        stepsMm: ['ပထမအဆင့်', 'ဒုတိယအဆင့်'],
      };
      const fields = collectEditableFields(content);
      const bodyField = fields.find((entry) => entry.path.join('.') === 'body.en');
      const stepsField = fields.find((entry) => entry.path.join('.') === 'stepsMm');

      expect(bodyField).toBeDefined();
      expect(stepsField).toBeDefined();
      expect(updateStructuredField(content, bodyField!, 'Updated parent copy')).toEqual({
        ...content,
        body: { ...content.body, en: 'Updated parent copy' },
      });
      expect(updateStructuredField(content, stepsField!, 'ပထမအဆင့်\nနောက်ထပ်အဆင့်')).toEqual({
        ...content,
        stepsMm: ['ပထမအဆင့်', 'နောက်ထပ်အဆင့်'],
      });
    } finally {
      if (atDescriptor) Object.defineProperty(Array.prototype, 'at', atDescriptor);
      else Reflect.deleteProperty(Array.prototype, 'at');
    }

    const source = readFileSync(resolve(process.cwd(), 'src/screens/ContentReviewWorkspace.tsx'), 'utf8');
    expect(source).not.toContain('.at(');
  });

  it('falls back to the raw value instead of crashing on an unknown decision or dimension', () => {
    // Known values still resolve to their localized label.
    expect(decisionLabel('approved', 'en')).toBe('Approve this revision');
    expect(dimensionLabel('clinical', 'mm')).toBe('အထူးကျွမ်းကျင်သူ ဘေးကင်းရေးသုံးသပ်မှု');
    // A legacy/unrecognized string from the database must not throw — it is
    // shown verbatim so the "Review item" tab keeps rendering.
    expect(decisionLabel('legacy_rejected', 'en')).toBe('legacy_rejected');
    expect(decisionLabel('', 'mm')).toBe('');
    expect(dimensionLabel('translation', 'en')).toBe('translation');
  });

  it('does not render or parse raw JSON in the reviewer editor', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/screens/ContentReviewWorkspace.tsx'), 'utf8');

    expect(source).not.toContain('setDataText');
    expect(source).not.toContain('JSON.parse(dataText)');
    expect(source).not.toContain('Advanced structured content');
    expect(source).toContain('No technical format is required.');
    expect(source).toContain('You have unsaved changes. Change items without saving?');
    expect(source).toContain('mayEditContent(access.role)');
    expect(source).toContain('You may correct wording directly while reviewing.');
    expect(source).toContain('disabled={busy}');
    expect(source).toContain('overflow-x-auto');
    expect(source).toContain("L('ခွဲခြားမှု အကြိုစစ်ဆေးရန်', 'Import preview')");
  });

  it('never exposes raw mm/en data keys for the current content library', () => {
    const seedPath = resolve(process.cwd(), 'convex/seedData.json');
    const items = JSON.parse(readFileSync(seedPath, 'utf8')) as Array<{ data: unknown }>;
    const fields = items.flatMap((item) => collectEditableFields(item.data));
    const labels = fields.map((entry) => humanizeField(entry, 'mm'));

    expect(labels).not.toContain('mm');
    expect(labels).not.toContain('en');
    expect(labels.filter((label) => /^(mm|en) \d+$/i.test(label))).toEqual([]);
    expect([...new Set(labels.filter((label) => /^[A-Za-z_]/.test(label)))]).toEqual([]);
    expect(fields.filter((entry) => entry.path.some((segment) => HIDDEN_SYSTEM_FIELDS.has(segment)))).toEqual([]);
  });
});
