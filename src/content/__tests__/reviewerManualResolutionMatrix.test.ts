import { describe, expect, it } from 'vitest';
import { CONTENT_SEED } from '../seed';
import { REVIEWER_MANUAL_RESOLUTIONS } from '../reviewerManualResolutions';
import { EVIDENCE_LINKS } from '../../evidence/links';

const dataFor = (slug: string) => {
  const item = CONTENT_SEED.find((candidate) => candidate.slug === slug);
  if (!item) throw new Error(`Missing content item ${slug}`);
  return item.data as Record<string, unknown>;
};

const text = (value: unknown) => JSON.stringify(value);

describe('owner-authorized Batch 4 manual-review resolutions', () => {
  it('maps every report item 78–90 exactly once without claiming clinical or publication approval', () => {
    expect(REVIEWER_MANUAL_RESOLUTIONS.map((item) => item.reportItem)).toEqual([
      78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
    ]);
    expect(new Set(REVIEWER_MANUAL_RESOLUTIONS.map((item) => item.claimId)).size).toBe(13);
    expect(text(REVIEWER_MANUAL_RESOLUTIONS)).not.toMatch(/doctor approved|expert reviewed|clinically verified/i);
  });

  it('adds the healthy-sleep screen wording and exact under-four choking copy', () => {
    expect(text(dataFor('lsn_healthy_sleep').body)).toMatch(/မျက်နှာပြင်ကြည့်ခြင်းကို ရှောင်|avoid screens/i);

    const chokingTargets = [
      'gd_13_18m_nutrition',
      'gd_19_24m_nutrition',
      'gd_2y_nutrition',
      'gd_2_5y_nutrition',
      'gd_3y_nutrition',
      'gd_3_5y_nutrition',
    ];
    for (const slug of chokingTargets) {
      const safety = text(dataFor(slug).safety);
      expect(safety).toMatch(/အသက် ၄ နှစ်အောက်|under 4/i);
      expect(safety).toMatch(/လေးစိတ်|quarter/i);
      expect(safety).toMatch(/ဝက်အူချောင်း|sausage/i);
      expect(EVIDENCE_LINKS.find((link) => link.slug === slug)?.sourceIds).toContain('hc-choking-prevention-2026');
    }
  });

  it('keeps the exact 5–6 month dehydration fields and acute evidence link', () => {
    const nutrition = dataFor('gd_5_6m_nutrition');
    expect(text(nutrition.redFlags)).toMatch(/wet nappies|ဆီးအရေအတွက်/i);
    expect(text(nutrition.redFlags)).toMatch(/dry mouth|ပါးစပ် ခြောက်/i);
    expect(text(nutrition.redFlags)).toMatch(/sunken eyes|မျက်လုံး ချိုင့်/i);
    expect(text(nutrition.referral)).toMatch(/seek care immediately|ချက်ချင်း ပြသ/i);
    expect(EVIDENCE_LINKS.find((link) => link.slug === 'gd_5_6m_nutrition')?.sourceIds).toContain('hc-child-ems-2026');
  });

  it('keeps the newborn urgent sleep tier and adds its exact acute evidence links', () => {
    const sleep = dataFor('gd_birth_2m_sleep');
    expect(text(sleep.redFlags)).toMatch(/38°C/);
    expect(text(sleep.redFlags)).toMatch(/blue or grey|ပြာနှမ်း\/မီးခိုးရောင်/i);
    expect(text(sleep.referral)).toMatch(/nearest hospital immediately|အနီးဆုံး ဆေးရုံ/i);
    const sources = EVIDENCE_LINKS.find((link) => link.slug === 'gd_birth_2m_sleep')?.sourceIds ?? [];
    expect(sources).toEqual(expect.arrayContaining([
      'nice-ng143-fever-2019',
      'hc-child-ems-2026',
    ]));
  });

  it('covers pacifiers, weighted products and home monitors in every 0–12 month sleep guide', () => {
    const sleepTargets = [
      'gd_birth_2m_sleep',
      'gd_3_4m_sleep',
      'gd_5_6m_sleep',
      'gd_7_9m_sleep',
      'gd_10_12m_sleep',
    ];
    for (const slug of sleepTargets) {
      const itemText = text(dataFor(slug));
      expect(itemText).toMatch(/pacifier|နို့သီးခေါင်း/i);
      expect(itemText).toMatch(/weighted|အလေးချိန်ပါ/i);
      expect(itemText).toMatch(/home breathing|heart-rate monitor|အိမ်သုံး အသက်ရှူ|နှလုံးခုန် စောင့်ကြည့်/i);
      expect(EVIDENCE_LINKS.find((link) => link.slug === slug)?.sourceIds).toContain('aap-safe-sleep-2022');
    }
  });
});
