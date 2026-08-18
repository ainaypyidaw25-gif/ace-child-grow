import { describe, expect, it } from 'vitest';
import { seedPayload } from '../seed';
import { SOURCE_BY_ID } from '../../evidence/sources';
import { sourcesForContent } from '../../evidence/links';
import { resolveReviewStatus } from '../../evidence/types';

const row = seedPayload().find((item) => item.slug === 'sn_selective_mutism');

if (!row) throw new Error('Missing seed row: sn_selective_mutism');

const data = row.data as {
  possibleSigns: Array<{ mm: string; en: string }>;
  homeSupport: Array<{ mm: string; en: string }>;
  professionalSupport: Array<{ mm: string; en: string }>;
  references: string[];
};

describe('selective mutism claim and evidence corrections', () => {
  it('avoids an absolute differential diagnosis from speech across settings', () => {
    expect(data.possibleSigns[2].mm).toContain('ပုံမှန်လက္ခဏာပုံစံနှင့် မကိုက်နိုင်ပါ');
    expect(data.possibleSigns[2].en).toContain('may not fit the usual pattern');
    expect(data.possibleSigns[2].en).not.toContain('this is not selective mutism');
    expect(data.possibleSigns[2].en).toContain('hearing and speech-language evaluation');
  });

  it('separates bargaining from clinician-planned reinforcement', () => {
    expect(data.homeSupport[0].mm).toContain('အဆင့်လိုက် အားပေးမှုအစီအစဉ်');
    expect(data.homeSupport[0].en).toContain('planned, gradual reinforcement programme');
    expect(data.homeSupport[0].en).not.toContain('do not offer rewards');
  });

  it('keeps anxiety treatment central without excluding speech-language care', () => {
    expect(data.professionalSupport[0].mm).toContain('တွဲဖက် စကားပြော/ဘာသာစကား အခက်အခဲ');
    expect(data.professionalSupport[0].en).toContain('coexisting speech or language difficulty');
    expect(data.professionalSupport[0].en).not.toContain('not by speech exercises');
  });

  it('links direct topic-specific sources instead of generic substitutes', () => {
    const ids = sourcesForContent('sn_selective_mutism', 'special_need');
    expect(ids).toEqual([
      'who-anxiety-disorders-2025',
      'who-icd11-cddr-2024',
      'nhs-selective-mutism-2023',
      'asha-selective-mutism',
      'jr-selective-mutism-interventions-2023',
    ]);
    expect(ids).not.toContain('asha-spoken-language-disorders');
    expect(ids).not.toContain('nice-ph40-social-emotional-2012');
    expect(data.references.some((reference) => reference.includes('10.1002/jcv2.12166'))).toBe(true);
  });

  it('keeps undated ASHA guidance evidence-required while dated sources await human review', () => {
    expect(resolveReviewStatus(SOURCE_BY_ID.get('asha-selective-mutism')!)).toBe('evidence_required');
    for (const id of [
      'who-anxiety-disorders-2025',
      'who-icd11-cddr-2024',
      'nhs-selective-mutism-2023',
      'jr-selective-mutism-interventions-2023',
    ]) {
      expect(resolveReviewStatus(SOURCE_BY_ID.get(id)!), id).toBe('awaiting_review');
    }
  });
});
