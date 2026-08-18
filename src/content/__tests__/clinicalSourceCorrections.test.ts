import { describe, expect, it } from 'vitest';
import { seedPayload } from '../seed';
import { sourcesForContent } from '../../evidence/links';
import { SOURCE_BY_ID } from '../../evidence/sources';
import { resolveReviewStatus } from '../../evidence/types';

const rows = new Map(seedPayload().map((row) => [row.slug, row]));

function dataFor(slug: string): Record<string, unknown> {
  const row = rows.get(slug);
  if (!row) throw new Error(`Missing seed row: ${slug}`);
  return row.data as Record<string, unknown>;
}

describe('clinically sourced content corrections', () => {
  it('preserves the AAP Down syndrome hearing and universal sleep-study schedule', () => {
    const home = dataFor('sn_down_syndrome').homeSupport as Array<{ mm: string; en: string }>;
    expect(home[2].en).toContain('rescreen at 6 months');
    expect(home[2].en).toContain('every 6 months');
    expect(home[2].en).toContain('annually thereafter');
    expect(home[5].en).toContain('every child with Down syndrome between ages 3 and 4');
    expect(home[5].mm).toContain('ကလေးတိုင်းကို အသက် ၃ နှစ်မှ ၄ နှစ်ကြား');
    expect(sourcesForContent('sn_down_syndrome', 'special_need')).toContain(
      'aap-down-syndrome-supervision-2022',
    );
  });

  it('keeps the preschool ADHD medication exception after first-line behavioural care', () => {
    const support = dataFor('sn_adhd').professionalSupport as Array<{ mm: string; en: string }>;
    expect(support[1].en).toContain('first-line when available');
    expect(support[1].en).toContain('may consider methylphenidate');
    expect(support[1].en).toContain('moderate-to-severe functional impairment');
    expect(support[1].mm).toContain('methylphenidate');
    expect(sourcesForContent('sn_adhd', 'special_need')).toEqual(
      expect.arrayContaining(['aap-adhd-guideline-2019', 'cdc-adhd-clinical-care-2026']),
    );
  });

  it('uses an individualized cerebral-palsy activity plan instead of blanket exercise bans', () => {
    const home = dataFor('sn_cerebral_palsy').homeSupport as Array<{ mm: string; en: string }>;
    expect(home).toHaveLength(2);
    expect(home[0].en).toContain("agreed with your child’s physiotherapist");
    expect(home[1].en).toContain('continue safe play and physical activity');
    expect(JSON.stringify(home)).not.toContain('avoid strengthening exercises');
    expect(sourcesForContent('sn_cerebral_palsy', 'special_need')).toContain(
      'nhs-cerebral-palsy-treatment-2023',
    );
  });

  it('supports early dyslexia risk identification without waiting for school failure', () => {
    const signs = dataFor('sn_dyslexia').possibleSigns as Array<{ mm: string; en: string }>;
    expect(signs[2].en).toContain('can be identified before school');
    expect(signs[2].en).toContain('Do not wait for repeated school failure');
    expect(signs[2].mm).toContain('ကျောင်းတွင် အကြိမ်ကြိမ် အခက်အခဲကြုံမှသာ');
    const ids = sourcesForContent('sn_dyslexia', 'special_need');
    expect(ids).toEqual(expect.arrayContaining([
      'ida-dyslexia-definition-2025',
      'aap-dyslexia-early-identification-2020',
      'nhs-dyslexia-children-2026',
    ]));
    expect(ids).not.toContain('asha-spoken-language-disorders');
  });

  it('aligns allergen advice to CDC and NIAID high-risk criteria in both languages', () => {
    const faq = dataFor('gd_5_6m_nutrition').faq as Array<{
      a: { mm: string; en: string };
    }>;
    expect(faq[1].a.en).toContain('severe eczema or egg allergy');
    expect(faq[1].a.mm).toContain('ပြင်းထန်သော အရေပြားရောင်ရမ်းနာ သို့မဟုတ် ဥနှင့် ဓာတ်မတည့်မှု');
    expect(faq[1].a.en).not.toContain('family history');
    expect(faq[1].a.mm).not.toContain('မိသားစုရာဇဝင်');
    expect(sourcesForContent('gd_5_6m_nutrition', 'guide')).toEqual(
      expect.arrayContaining(['cdc-introduce-solid-foods-2026', 'jr-niaid-peanut-prevention-2017']),
    );
  });

  it('removes mouth-sized pebbles and beans from toddler fine-motor play', () => {
    const data = dataFor('gd_13_18m_fine_motor');
    const text = JSON.stringify({
      observationQuestions: data.observationQuestions,
      dailyActivities: data.dailyActivities,
      outdoor: data.outdoor,
      lowCost: data.lowCost,
      safety: data.safety,
    });
    expect(text).toContain('too large to fit in the mouth');
    expect(text).toContain('age-appropriate shape and texture');
    expect(text).not.toContain('pebbles');
    expect(text).not.toContain('large beans');
    expect(text).not.toContain('Picks up small items');
    expect(JSON.stringify(data.dailyActivities)).not.toContain('ပစ္စည်းငယ်များ');
    expect(text).toContain('supervise closely');
    expect(sourcesForContent('gd_13_18m_fine_motor', 'guide')).toContain(
      'hc-choking-prevention-2026',
    );
  });

  it('keeps every newly verified source non-approved pending named human review', () => {
    for (const id of [
      'aap-down-syndrome-supervision-2022',
      'aap-adhd-guideline-2019',
      'aap-dyslexia-early-identification-2020',
      'cdc-adhd-clinical-care-2026',
      'cdc-introduce-solid-foods-2026',
      'cdc-ehdi-toolkit-2024',
      'cdc-hearing-treatment-2024',
      'nhs-cerebral-palsy-symptoms-2023',
      'nhs-cerebral-palsy-treatment-2023',
      'nhs-learning-disabilities-2025',
      'nhs-dcd-diagnosis-2023',
      'nhs-dyslexia-children-2026',
      'ida-dyslexia-definition-2025',
      'jr-niaid-peanut-prevention-2017',
    ]) {
      expect(resolveReviewStatus(SOURCE_BY_ID.get(id)!), id).not.toBe('approved');
    }
  });

  it('classifies the AAP dyslexia article as a narrative review, not a systematic review', () => {
    expect(SOURCE_BY_ID.get('aap-dyslexia-early-identification-2020')?.evidenceLevel)
      .toBe('narrative_review');
  });

  it('uses canonical CDC ADHD metadata and preserves overdue publisher dates', () => {
    const cdc = SOURCE_BY_ID.get('cdc-adhd-clinical-care-2026')!;
    expect(cdc.url).toBe('https://www.cdc.gov/adhd/hcp/clinical-care/index.html');
    expect(cdc.evidenceLevel).toBe('parent_education');
    expect(cdc.verifiedNote).toContain('July 30, 2026');
    expect(SOURCE_BY_ID.get('nhs-selective-mutism-2023')?.nextReviewDate)
      .toBe('2026-02-17');
  });

  it('maps each changed clinical claim to its direct topic source', () => {
    expect(sourcesForContent('sn_cerebral_palsy', 'special_need'))
      .toContain('nhs-cerebral-palsy-symptoms-2023');
    expect(sourcesForContent('sn_hearing_loss', 'special_need'))
      .toEqual(expect.arrayContaining(['cdc-ehdi-toolkit-2024', 'cdc-hearing-treatment-2024']));
    expect(sourcesForContent('sn_learning_disability', 'special_need'))
      .toContain('nhs-learning-disabilities-2025');
    expect(sourcesForContent('sn_developmental_coordination_disorder', 'special_need'))
      .toContain('nhs-dcd-diagnosis-2023');
  });
});
