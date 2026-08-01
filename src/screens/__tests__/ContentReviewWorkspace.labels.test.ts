import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectEditableFields,
  decisionLabel,
  dimensionLabel,
  HIDDEN_SYSTEM_FIELDS,
  humanizeField,
  type EditableField,
} from '../ContentReviewWorkspace';

function field(key: string, path: string[], language: EditableField['language']): EditableField {
  return { key, path, language, value: '', multiline: false, list: false };
}

describe('reviewer content field labels', () => {
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

  it('falls back to the raw value instead of crashing on an unknown decision or dimension', () => {
    // Known values still resolve to their localized label.
    expect(decisionLabel('approved', 'en')).toBe('Approve this revision');
    expect(dimensionLabel('clinical', 'mm')).toBe('ဆေးဘက်ဆိုင်ရာ သုံးသပ်မှု');
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
