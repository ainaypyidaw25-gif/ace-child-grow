import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';
import {
  CDC_TODDLERS_1_2_SOURCE_ID,
  CDC_TODDLERS_2_3_SOURCE_ID,
  CHILD_DEVELOPMENT_REFREEZE_COPY,
  CHILD_DEVELOPMENT_REFREEZE_SEMANTIC_SLUGS,
  CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS,
} from '../../../convex/lib/childDevelopmentRefreezeCorrectionCopy';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';

type Bilingual = { mm: string; en: string };

const authored = (slug: string) => {
  const row = CONTENT_SEED.find((candidate) => candidate.slug === slug);
  expect(row, `missing authored row ${slug}`).toBeDefined();
  return row!;
};

const generated = (slug: string) => {
  const row = seedData.find((candidate) => candidate.slug === slug);
  expect(row, `missing generated row ${slug}`).toBeDefined();
  return row!;
};

const dataFor = (row: { data: unknown }) => row.data as {
  why: Bilingual;
  dailyActivities: Bilingual[];
  parentTips: Bilingual[];
};

describe('child-development sequence-10 correction copy', () => {
  it('pins exactly four semantic slugs and two age-matched source transitions', () => {
    expect(CHILD_DEVELOPMENT_REFREEZE_SEMANTIC_SLUGS).toEqual([
      'gd_10_12m_nutrition',
      'gd_13_18m_safety',
      'gd_2y_safety',
      'gd_2_5y_safety',
    ]);
    expect(CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS).toEqual([
      'gd_2y_safety',
      'gd_2_5y_safety',
    ]);
  });

  it('keeps the 10–12-month feeding advice flexible and caregiver-led', () => {
    for (const row of [
      authored('gd_10_12m_nutrition'),
      generated('gd_10_12m_nutrition'),
    ]) {
      const data = dataFor(row);
      expect(data.dailyActivities[0])
        .toEqual(CHILD_DEVELOPMENT_REFREEZE_COPY.gd_10_12m_nutrition.dailyActivity);
      expect(data.parentTips[0])
        .toEqual(CHILD_DEVELOPMENT_REFREEZE_COPY.gd_10_12m_nutrition.parentTip);
      expect(data.dailyActivities[0].en).toContain('can vary from day to day');
      expect(data.dailyActivities[0].en).not.toContain('at least four to five');
      expect(data.dailyActivities[0].mm).not.toContain('အနည်းဆုံး ၄ မျိုးမှ ၅ မျိုး');
      expect(data.parentTips[0].mm).toBe(
        'မိဘက ဘာကို ဘယ်အချိန်ပေးမလဲ ဆုံးဖြတ်ပြီး၊ ကလေးက ဘယ်လောက်စားမလဲ ဆုံးဖြတ်ပါစေ။',
      );
    }
  });

  it('uses exact variation-safe mobility wording without changing unrelated daily copy', () => {
    for (const slug of ['gd_13_18m_safety', 'gd_2y_safety'] as const) {
      const expected = CHILD_DEVELOPMENT_REFREEZE_COPY[slug].why;
      for (const row of [authored(slug), generated(slug)]) {
        const data = dataFor(row);
        expect(data.why).toEqual(expected);
        expect(row.summaryMm).toBe(expected.mm);
        expect(row.summaryEn).toBe(expected.en);
      }
    }

    const thirteenToEighteen = dataFor(authored('gd_13_18m_safety'));
    expect(thirteenToEighteen.why.en).toContain('crawling');
    expect(thirteenToEighteen.why.en).toContain('pulling to stand');
    expect(thirteenToEighteen.why.en).toContain('beginning to walk');
    expect(thirteenToEighteen.why.en).not.toContain('new walker');
    expect(thirteenToEighteen.dailyActivities[0]).toEqual({
      mm: 'ကလေးအမြင့်မှ အခန်းတိုင်းကို ကြည့်ပြီး အန္တရာယ်ရှိရာများ ဖယ်ရှားပါ။',
      en: 'Check each room from the child’s height and remove hazards.',
    });

    const twoYears = dataFor(authored('gd_2y_safety'));
    expect(twoYears.why.en).toContain('mobility and speed increase');
    expect(twoYears.why.en).toContain('including when running begins');
    expect(twoYears.dailyActivities[0]).toEqual({
      mm: 'အပြင်ထွက်တိုင်း လူကြီးလက်ကိုင်ခြင်းကို လေ့ကျင့်ပါ။',
      en: 'Practise holding an adult’s hand outdoors.',
    });
  });

  it('changes only the 2.5-year rehearsal field and keeps its why copy intact', () => {
    for (const row of [authored('gd_2_5y_safety'), generated('gd_2_5y_safety')]) {
      const data = dataFor(row);
      expect(data.why).toEqual({
        mm: '၂ နှစ်ခွဲအရွယ်တွင် လမ်းမ၊ ရေ၊ မီး၊ ပြတင်းပေါက်နှင့် ဆေးဝါးအန္တရာယ်များကို လူကြီးက ဆက်လက်ကာကွယ်ရပါမည်။',
        en: 'At 2.5 years, adults still need to prevent traffic, water, burn, window, and medicine hazards.',
      });
      expect(data.dailyActivities[0])
        .toEqual(CHILD_DEVELOPMENT_REFREEZE_COPY.gd_2_5y_safety.dailyActivity);
      expect(data.dailyActivities[0].en).toContain('Stay close and model');
      expect(data.dailyActivities[0].en).toContain('trusted adult');
      expect(data.dailyActivities[0].en).toContain('do not rely on the child');
    }
  });

  it('moves both 2–3-year safety guides to the exact age-matched CDC source only', () => {
    for (const slug of CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS) {
      const link = EVIDENCE_LINKS.find(
        (candidate) => candidate.kind === 'guide' && candidate.slug === slug,
      );
      expect(link?.sourceIds, slug).toEqual([
        'aap-drowning-2026',
        'tb-bright-futures-4e-2017',
        CDC_TODDLERS_2_3_SOURCE_ID,
      ]);
      expect(link?.sourceIds, slug).not.toContain(CDC_TODDLERS_1_2_SOURCE_ID);
    }

    const youngerLink = EVIDENCE_LINKS.find(
      (candidate) => candidate.kind === 'guide' && candidate.slug === 'gd_13_18m_safety',
    );
    expect(youngerLink?.sourceIds).toContain(CDC_TODDLERS_1_2_SOURCE_ID);
    expect(youngerLink?.sourceIds).not.toContain(CDC_TODDLERS_2_3_SOURCE_ID);
  });
});
