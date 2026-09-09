import { describe, expect, it } from 'vitest';
import { seedPayload } from '../seed';

function item(slug: string) {
  const found = seedPayload().find((entry) => entry.slug === slug);
  if (!found) throw new Error(`Seed item not found: ${slug}`);
  return found;
}

describe('Burmese semantic parity corrections', () => {
  it('retains both independent toilet use and handwashing in the five-year milestone', () => {
    expect(item('ms_5y_self_help_1').titleMm).toBe(
      'အိမ်သာသုံးခြင်းနှင့် လက်ဆေးခြင်းကို ကိုယ်တိုင်လုပ်ခြင်း',
    );
    expect(item('ms_5y_self_help_1').data).toMatchObject({
      observeMm: 'အိမ်သာကို ကိုယ်တိုင်သုံးပြီး လက်ကိုလည်း ကိုယ်တိုင် ဆေးကြောနိုင်ပါသလား။',
      observeEn: 'Uses the toilet and washes hands alone?',
    });
  });

  it('states directly that suitable glasses help vision', () => {
    expect(JSON.stringify(item('sn_visual_impairment').data)).toContain(
      'မဟုတ်ပါ။ သင့်လျော်သော မျက်မှန်သည် အမြင်အာရုံ ကောင်းမွန်စေရန် ကူညီပါသည်။',
    );
  });

  it('uses natural hand-transfer and story-title wording', () => {
    expect(item('ms_7_9m_fine_motor_1').data).toMatchObject({
      observeMm: 'ကစားစရာကို လက်တစ်ဖက်မှ အခြားလက်တစ်ဖက်သို့ ပြောင်းကိုင်ပါသလား။',
    });
    expect(item('st_goodnight_moon_friend').titleMm).toBe('ကောင်းသောညပါ၊ လမင်းလေးရေ');
  });
});
