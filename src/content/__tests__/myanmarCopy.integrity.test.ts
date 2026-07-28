import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { CONTENT_SEED } from '../seed';

const BANNED_MYANMAR_FRAGMENTS = [
  'ကလ်း',
  'ချစ်စနာမည်',
  'အန်တံ',
  'ပါတ်တား',
  'choking',
  'screen ',
  ' screen',
  'peek-a-boo',
  'physiotherapist',
  'occupational therapist',
  'speech therapist',
  'flashcard',
  'babbling',
  'palmar grasp',
  'board book',
  'baby walker',
  'object permanence',
  'joint attention',
  'co-regulation',
  '(walker)',
  '(cruising)',
  '(attachment)',
  'အမှတ်တိုင်',
  'တစ်ခြားသူ',
  'လှန်ချ၍',
  'သင်ယူရမည့် ရည်မှန်းချက်',
  'အသံကို ပိုတိုးပါ',
  'ပက်လက်နှင့်',
  'ကလေးသိပ် သီချင်း',
  'ဖြည်းညှင်း ယိမ်း',
] as const;

function collectMyanmar(value: unknown, key = ''): string[] {
  if (typeof value === 'string') return key === 'mm' || key.endsWith('Mm') ? [value] : [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectMyanmar(entry));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([childKey, child]) => collectMyanmar(child, childKey));
}

describe('Myanmar copy quality', () => {
  it('contains none of the known typo, untranslated, or awkward legacy fragments', () => {
    for (const item of CONTENT_SEED) {
      const copy = [item.titleMm, item.summaryMm ?? '', ...collectMyanmar(item.data)].join('\n');
      for (const fragment of BANNED_MYANMAR_FRAGMENTS) {
        expect(copy, `${item.slug} contains “${fragment}”`).not.toContain(fragment);
      }
    }
  });

  it('keeps child-name labels consistent and free of the old typo', () => {
    for (const file of ['src/screens/AddChild.tsx', 'src/screens/EditChild.tsx']) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      expect(source).toContain('ကလေးအမည် (အိမ်ခေါ်အမည်)');
      expect(source).not.toContain('ချစ်စနာမည်');
      expect(source).not.toContain('ချစ်စနိုးအမည်');
    }
  });

  it('uses the correct Burmese term for developmental milestones in the library UI', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/screens/ContentLibrary.tsx'), 'utf8');
    expect(source).toContain("milestone: { mm: 'မှတ်တိုင်'");
    expect(source).not.toContain('အမှတ်တိုင်');
  });
});
