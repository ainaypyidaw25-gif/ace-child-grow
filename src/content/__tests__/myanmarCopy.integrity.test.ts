import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { CONTENT_SEED } from '../seed';
import { isRetiredMilestoneSlug } from '../../../convex/lib/contentRetirements';

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
      ['ms_13_18m_fine_motor_2', 'စာအုပ် စာမျက်နှာများကို လှန်လှောကြည့်နိုင်ခြင်း'],
    ]);

    for (const [slug, titleMm] of expectedTitles) {
      const item = CONTENT_SEED.find((entry) => entry.slug === slug);
      if (isRetiredMilestoneSlug(slug)) {
        expect(item, slug + ' must remain retired from the seed').toBeUndefined();
        continue;
      }
      expect(item, slug + ' must remain in the seed').toBeDefined();
      expect(item?.titleMm, slug).toBe(titleMm);
      expect(item?.searchText, slug + ' searchText').toContain(titleMm.toLowerCase());
    }
  });

  it('keeps the second reviewer language batch on its exact milestone records', () => {
    const expectedTitles = new Map<string, string>([
      ['ms_13_18m_nutrition_1', 'မိသားစု စားသုံးသော အစားအစာ အမျိုးမျိုးကို ကိုယ်တိုင် ကိုင်တွယ်စားသောက်ရန် ကြိုးစားခြင်း'],
      ['ms_13_18m_safety_1', '"မလုပ်နဲ့" သို့မဟုတ် အန္တရာယ် သတိပေးစကားကို တစ်ခါတရံ တုံ့ပြန်သတိပြုတတ်ခြင်း'],
      ['ms_13_18m_sleep_1', 'တစ်နေ့လျှင် နေ့ခင်းအိပ်ချိန် နှစ်ကြိမ်မှ တစ်ကြိမ်တည်းဆီသို့ စတင်ကူးပြောင်းလာခြင်း'],
      ['ms_19_24m_nutrition_1', 'ဇွန်းကို ပိုမိုကျွမ်းကျင်စွာ သုံးနိုင်ခြင်းနှင့် အဖုံးမပါသော ရိုးရိုးခွက်ဖြင့် သောက်တတ်ခြင်း'],
      ['ms_19_24m_safety_1', 'သတိပေးထားသော အန္တရာယ်ရှိသည့် အရာဝတ္ထုများကို သတိထားရှောင်ရှားတတ်ခြင်း'],
      ['ms_19_24m_sleep_1', 'ပုံမှန် အိပ်ရာဝင် အလေ့အထအတိုင်း တည်ငြိမ်စွာ အိပ်ပျော်နိုင်ခြင်း'],
      ['ms_19_24m_social_1', 'အခြား ကလေးများကို မြင်တွေ့ရလျှင် ပျော်ရွှင်တက်ကြွပြီး ၎င်းတို့ ကစားသည့်အနီးသို့ ဝင်ရောက်ကစားခြင်း'],
      ['ms_2_5y_nutrition_1', 'အစားအစာအသစ်များကို ဖိအားမပေးဘဲ ထပ်ခါတလဲလဲ ကျွေးကြည့်ခြင်းဖြင့် လက်ခံစားသုံးလာနိုင်ခြင်း'],
      ['ms_2_5y_play_1', 'ဟန်ဆောင်ကစားရာတွင် ပစ္စည်းတစ်ခုကို အခြားအရာတစ်ခုအဖြစ် စိတ်ကူးဖြင့် အစားထိုးကစားခြင်း'],
      ['ms_2_5y_safety_1', 'အန္တရာယ်ရှိသော အရာဝတ္ထုအချို့ကို မေးမြန်းသည့်အခါ အမည်ပြောပြနိုင်ခြင်း'],
      ['ms_2_5y_self_help_3', 'အိမ်သာသုံးစွဲခြင်းကို စတင်လေ့ကျင့်နေခြင်း (Potty training)'],
      ['ms_2_5y_self_help_4', 'လူကြီး အကူအညီဖြင့် သွားတိုက်ခြင်း'],
      ['ms_2_5y_self_help_5', 'ကိုယ်တိုင် လက်ဆေးခြင်းနှင့် လက်သုတ်ခြင်း ပြုလုပ်နိုင်ခြင်း'],
      ['ms_2_5y_sleep_1', 'နေ့ခင်းတစ်ကြိမ်သာ အိပ်တော့ခြင်းနှင့် အိပ်ရာဝင်ချိန်တွင် အိပ်ရန် ငြင်းဆန်ဂျီကျတတ်ခြင်း'],
      ['ms_2y_cognitive_1', 'အဆင့် ၂ ဆင့်ပါသော ညွှန်ကြားချက်ကို ဆက်တိုက် လိုက်နာနိုင်ခြင်း'],
      ['ms_2y_nutrition_1', 'မိသားစု ထမင်းဝိုင်းတွင် ကိုယ်တိုင် စားသောက်နိုင်သော်လည်း အစားရွေးတတ်ခြင်း (Picky eating)'],
      ['ms_2y_safety_1', 'ရိုးရှင်းသော ဘေးကင်းရေး စည်းမျဉ်းတစ်ခုကို တစ်ခါတရံ လိုက်နာတတ်ခြင်း'],
      ['ms_2y_self_help_1', 'ရိုးရှင်းသော အိမ်မှုကိစ္စငယ်များတွင် ပါဝင်ကူညီလုပ်ဆောင်ခြင်း'],
      ['ms_2y_self_help_2', 'အိမ်သာသုံးစွဲရန် စိတ်ဝင်စားမှု သို့မဟုတ် အဆင်သင့်ဖြစ်မှု လက္ခဏာများ ပြသခြင်း'],
      ['ms_2y_sleep_1', 'ညဘက်တွင် လန့်နိုးခြင်း နည်းပါးလာပြီး နှစ်ခြိုက်စွာ အိပ်ပျော်နိုင်ခြင်း'],
      ['ms_3_5y_nutrition_1', 'မိသားစု ထမင်းဝိုင်းတွင် အချိန်အတိုင်းအတာတစ်ခုအထိ ငြိမ်သက်စွာ ထိုင်၍ စားသောက်နိုင်ခြင်း'],
      ['ms_3_5y_safety_1', 'မတော်တဆ ဖြစ်သည့်အခါ ယုံကြည်ရသော လူကြီးထံ ချက်ချင်း အကူအညီတောင်းခံတတ်ခြင်း'],
      ['ms_3_5y_sleep_1', 'အိပ်ရာဝင် အလေ့အထ၏ အဆင့်များကို ကြိုတင်သိရှိပြီး လိုက်နာနိုင်ခြင်း'],
    ]);

    for (const [slug, titleMm] of expectedTitles) {
      const item = CONTENT_SEED.find((entry) => entry.slug === slug);
      if (isRetiredMilestoneSlug(slug)) {
        expect(item, slug + ' must remain retired from the seed').toBeUndefined();
        continue;
      }
      expect(item, slug + ' must remain in the seed').toBeDefined();
      expect(item?.titleMm, slug).toBe(titleMm);
      expect(item?.searchText, slug + ' searchText').toContain(titleMm.toLowerCase());
    }
  });

  it('keeps the safe record-level copy from reviewer language batch four', () => {
    const expectedTitles = new Map<string, string>([
      ['ms_7_9m_social_3', 'မျက်နှာဖုံးတမ်း ကစားခြင်းကို နှစ်သက်ပြီး ကြိုတင်မျှော်လင့်တတ်ခြင်း'],
      ['ms_birth_2m_gross_motor_3', 'နိုးနေချိန်တွင် လက်နှင့် ခြေထောက်များကို တက်ကြွစွာ လှုပ်ရှားကန်ကျောက်ခြင်း'],
    ]);

    for (const [slug, titleMm] of expectedTitles) {
      const item = CONTENT_SEED.find((entry) => entry.slug === slug);
      expect(item, slug + ' must remain in the seed').toBeDefined();
      expect(item?.titleMm, slug).toBe(titleMm);
      expect(item?.searchText, slug + ' searchText').toContain(titleMm.toLowerCase());
    }

    const adhd = CONTENT_SEED.find((entry) => entry.slug === 'sn_adhd');
    const autism = CONTENT_SEED.find((entry) => entry.slug === 'sn_autism');
    expect(JSON.stringify(adhd?.data), 'sn_adhd copy').toContain('နေရာနှစ်ခုနှင့်အထက်');
    expect(JSON.stringify(adhd?.data), 'sn_adhd copy').toContain('ခေတ္တ ကိုယ်လက်လှုပ်ရှား အနားယူချိန်များ');
    expect(JSON.stringify(autism?.data), 'sn_autism copy').toContain('မိမိတို့နည်းလမ်းဖြင့် ကွဲပြားစွာ ဖော်ပြတတ်ကြခြင်း');
    expect(JSON.stringify(autism?.data), 'sn_autism copy').toContain('နေ့စဉ် ကျွမ်းကျင်မှုစွမ်းရည်များ');
  });
});
