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
  'peekaboo',
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
  'လက်ပြပါးခါ',
  'အကြီးလူများ',
  'ဖုန်းကလေး',
  'လက်ရုံးထဲ',
  'ကိုယ်ကျင့်တရား ချို့ယွင်းခြင်း',
  'ထူသော ရွက်ဖုံးစာအုပ်',
  'ပိုမိုစစ်မှန်စွာ',
] as const;

function collectMyanmar(value: unknown, key = ''): string[] {
  if (typeof value === 'string') return key === 'mm' || key.endsWith('Mm') ? [value] : [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectMyanmar(entry));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([childKey, child]) => collectMyanmar(child, childKey));
}

// Case and hyphenation vary ("Peekaboo" vs "peek-a-boo" vs "peekaboo") but the
// leaked-English-word defect is the same regardless — a straight .toContain()
// missed a capitalized, unhyphenated variant of an already-banned fragment
// once already (see ms_7_9m_social_3). Normalizing both sides closes that
// whole class of near-miss rather than chasing one variant at a time.
function normalizeForBanCheck(value: string): string {
  return value.toLowerCase().replace(/-/g, '');
}

describe('Myanmar copy quality', () => {
  it('contains none of the known typo, untranslated, or awkward legacy fragments', () => {
    for (const item of CONTENT_SEED) {
      const copy = [item.titleMm, item.summaryMm ?? '', ...collectMyanmar(item.data)].join('\n');
      const normalizedCopy = normalizeForBanCheck(copy);
      for (const fragment of BANNED_MYANMAR_FRAGMENTS) {
        expect(normalizedCopy, `${item.slug} contains “${fragment}”`).not.toContain(normalizeForBanCheck(fragment));
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

  it('keeps the first reviewer language batch on its exact milestone records', () => {
    const expectedTitles = new Map<string, string>([
      ['ms_10_12m_communication_3', '"တာ့တာ/ဘိုင်ဘိုင်" ဟု လက်ပြနှုတ်ဆက်ခြင်းနှင့် ချီပေးရန် လက်ဆန့်ပြခြင်း'],
      ['ms_10_12m_communication_4', 'မိဘက လက်ညှိုးထိုးပြသည့် အရာဝတ္ထုဆီသို့ လှည့်ကြည့်နိုင်ခြင်း'],
      ['ms_10_12m_fine_motor_2', 'လက်နှစ်ဖက်ဖြင့် လက်ခုပ်တီးနိုင်ခြင်း'],
      ['ms_10_12m_gross_motor_3', 'အမှီမပါဘဲ စက္ကန့်အနည်းငယ်ကြာ တစ်ဦးတည်း မတ်တပ်ရပ်နိုင်ခြင်း'],
      ['ms_10_12m_play_1', 'အရုပ်ဖုန်းဖြင့် စကားပြောသကဲ့သို့ ရိုးရှင်းသော ဟန်ဆောင်ကစားနည်း စတင်ခြင်း'],
      ['ms_10_12m_self_help_2', 'အဝတ်အစား ဝတ်ဆင်ချိန်တွင် လက် သို့မဟုတ် ခြေထောက်ကို လျှိုထည့်ပေးကာ ကူညီခြင်း'],
      ['ms_13_18m_cognitive_2', 'မေးမြန်းသည့်အခါ ခန္ဓာကိုယ်အစိတ်အပိုင်းများကို လက်ညှိုးထိုးပြနိုင်ခြင်း'],
      ['ms_13_18m_cognitive_3', 'လက်ဟန်ခြေဟန် မပါဘဲ စကားလုံးသက်သက်ဖြင့် ပေးသော ရိုးရှင်းသည့် ညွှန်ကြားချက်ကို လိုက်နာနိုင်ခြင်း'],
      ['ms_13_18m_emotional_1', 'စိတ်တိုင်းမကျသည့်အခါ ဂျီကျဒေါသထွက်တတ်ခြင်း'],
      ['ms_13_18m_fine_motor_2', 'စာအုပ် စာမျက်နှာများကို လှန်လှောကြည့်နိုင်ခြင်း'],
    ]);

    for (const [slug, titleMm] of expectedTitles) {
      const item = CONTENT_SEED.find((entry) => entry.slug === slug);
      expect(item, slug + ' must remain in the seed').toBeDefined();
      expect(item?.titleMm, slug).toBe(titleMm);
      expect(item?.searchText, slug + ' searchText').toContain(titleMm.toLowerCase());
    }
  });
});
