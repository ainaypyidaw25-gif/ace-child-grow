import { describe, expect, it } from 'vitest';
import { seedPayload } from '../seed';
import { relatedContent, sourcesForContent } from '../../evidence/links';
import { SOURCE_BY_ID } from '../../evidence/sources';
import { resolveReviewStatus } from '../../evidence/types';
import { SAMPLE_AWARENESS } from '../../data/seed/content';

const rows = new Map(seedPayload().map((row) => [row.slug, row]));

function rowFor(slug: string) {
  const row = rows.get(slug);
  if (!row) throw new Error(`Missing seed row: ${slug}`);
  return row;
}

function dataFor(slug: string): Record<string, unknown> {
  return rowFor(slug).data as Record<string, unknown>;
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
    expect(faq[1].a.en).toContain('plain yogurt or cheese');
    expect(faq[1].a.en).toContain('not cow’s milk as a main drink before 12 months');
    expect(sourcesForContent('gd_5_6m_nutrition', 'guide')).toEqual(
      expect.arrayContaining([
        'cdc-introduce-solid-foods-2026',
        'cdc-cows-milk-2026',
        'jr-niaid-peanut-prevention-2017',
      ]),
    );
  });

  it('keeps strengths language individualized instead of making diagnostic-group promises', () => {
    const speech = dataFor('sn_speech_delay').strengths as Array<{ mm: string; en: string }>;
    expect(speech[1].en).toBe(
      'In some children, understanding may be stronger than spoken expression',
    );
    expect(speech[1].mm).toContain('ကလေးအချို့တွင်');

    const cp = dataFor('sn_cerebral_palsy').strengths as Array<{ mm: string; en: string }>;
    expect(cp[1].en).toContain('Each child has individual interests');
    expect(cp[1].en).not.toContain('Often strong communication');

    const vision = dataFor('sn_visual_impairment').strengths as Array<{ mm: string; en: string }>;
    expect(vision[0].en).toContain('accessible methods such as sound and touch');
    expect(vision[0].en).not.toContain('Strong hearing and touch senses');
    expect(sourcesForContent('sn_visual_impairment', 'special_need')).toEqual(
      expect.arrayContaining([
        'aap-visual-system-assessment-2016',
        'aap-visual-system-procedures-2016',
      ]),
    );
  });

  it('defines global developmental delay as two or more domains under age five', () => {
    const data = dataFor('sn_global_developmental_delay');
    expect((data.overview as { en: string }).en).toContain('two or more developmental domains');
    expect((data.overview as { en: string }).en).toContain('children under 5');
    expect((data.possibleSigns as Array<{ en: string }>)[0].en).toContain('two or more areas');
    expect(sourcesForContent('sn_global_developmental_delay', 'special_need')).toEqual(
      expect.arrayContaining([
        'aap-gdd-evaluation-2014',
        'aap-gdd-genetic-evaluation-2025',
      ]),
    );
  });

  it('states the outcome-specific ASI evidence instead of one blanket conclusion', () => {
    const support = dataFor('sn_sensory_processing').professionalSupport as Array<{
      mm: string; en: string;
    }>;
    expect(support[1].en).toContain('Ayres Sensory Integration® (ASI)');
    expect(support[1].en).toContain('individualized occupational-performance goals');
    expect(support[1].en).toContain('some autistic children');
    expect(support[1].en).toContain('has not shown benefit for behaviors of concern');
    expect(sourcesForContent('sn_sensory_processing', 'special_need')).toEqual(
      expect.arrayContaining(['jr-asi-systematic-review-2025', 'jr-senita-rct-2022']),
    );
  });

  it('uses CDC 12-month communication milestones without an early pointing threshold', () => {
    const flags = dataFor('gd_10_12m_communication').redFlags as Array<{ mm: string; en: string }>;
    expect(flags[0].en).toContain('does not wave bye-bye');
    expect(flags[0].en).toContain('understand “no”');
    expect(flags[0].en).not.toContain('no pointing');
  });

  it('uses current media evidence and preserves the responsive video-call exception', () => {
    const screenLesson = dataFor('lsn_screen_time');
    expect((screenLesson.body as { en: string }).en).toContain(
      'does not crowd out sleep, movement, reading, play, or face-to-face interaction',
    );
    expect((screenLesson.body as { en: string }).en).not.toContain('far better');
    expect((screenLesson.takeaway as { en: string }).en).toBe(
      'Look beyond minutes alone: consider the child, the content, co-use, and what media may crowd out.',
    );
    expect((screenLesson.actionToday as { en: string }).en).toContain(
      'co-use and talk about it',
    );
    const screenQuiz = (screenLesson.quiz as Array<{
      q: { mm: string; en: string };
      options: Array<{ mm: string; en: string }>;
    }>)[0];
    expect(screenQuiz.q.en).toContain('sedentary screen time');
    expect(screenQuiz.q.mm).toContain('အထိုင်လုပ်ဆောင်သည့် ဖန်သားပြင်ကြည့်ချိန်');
    expect(screenQuiz.options[0].en).toBe('not recommended');

    const newbornCommunication = dataFor('gd_birth_2m_communication');
    const newbornFaq = newbornCommunication.faq as Array<{ a: { mm: string; en: string } }>;
    expect(newbornFaq[1].a.en).toContain('more supportive of early learning and connection');
    expect(newbornFaq[1].a.en).not.toContain('far more');
    expect(newbornCommunication.evidenceSummary).toContain(
      '2026 AAP digital-ecosystems technical report',
    );
    expect(newbornCommunication.evidenceSummary).not.toContain('young minds');

    const threeToFour = dataFor('gd_3_4m_cognitive');
    const threeToFourFaq = threeToFour.faq as Array<{ a: { mm: string; en: string } }>;
    expect(threeToFourFaq[0].a.en).toContain('more supportive of learning');
    expect(threeToFourFaq[0].a.en).not.toContain('far more');

    const fiveToSixCommunication = dataFor('gd_5_6m_communication');
    expect((fiveToSixCommunication.safety as { en: string }).en).toContain(
      'Keep screen use very limited',
    );
    expect((fiveToSixCommunication.safety as { en: string }).en).toContain(
      'do not let it replace face-to-face interaction',
    );

    const sevenToNineCommunication = dataFor('gd_7_9m_communication');
    expect((sevenToNineCommunication.safety as { en: string }).en).toContain(
      'Keep screen use very limited',
    );
    expect((sevenToNineCommunication.safety as { en: string }).en).toContain(
      'do not let it replace face-to-face interaction',
    );

    const faq = dataFor('gd_5_6m_play').faq as Array<{ a: { mm: string; en: string } }>;
    expect(faq[0].a.en).toContain('live video call with family');
    expect(faq[0].a.en).toContain('when an adult helps the baby take part');
    expect(faq[0].a.mm).toContain('တိုက်ရိုက် ဗီဒီယိုခေါ်ဆိုမှု');
    expect(sourcesForContent('gd_5_6m_play', 'guide')).toEqual(expect.arrayContaining([
      'aap-digital-ecosystems-technical-2026',
      'hc-screen-time-5cs-infants-2024',
    ]));

    const fiveToSix = dataFor('gd_5_6m_cognitive');
    const fiveToSixMistakes = fiveToSix.commonMistakes as Array<{ mm: string; en: string }>;
    const fiveToSixFaq = fiveToSix.faq as Array<{ a: { mm: string; en: string } }>;
    expect(fiveToSixMistakes[2].en).toContain('should not replace live, responsive play');
    expect(fiveToSixFaq[1].a.en).toContain('learning from most screen media is limited');
    expect(fiveToSixFaq[1].a.en).not.toContain('do not learn from screens');

    const sevenToNineFaq = dataFor('gd_7_9m_cognitive').faq as Array<{
      a: { mm: string; en: string };
    }>;
    expect(sevenToNineFaq[1].a.en).toContain('Learning from most screen media is limited');
    expect(sevenToNineFaq[1].a.en).not.toContain('There is no evidence they help');

    const tenToTwelveFaq = dataFor('gd_10_12m_cognitive').faq as Array<{
      a: { mm: string; en: string };
    }>;
    const tenToTwelveSafety = dataFor('gd_10_12m_cognitive').safety as {
      mm: string; en: string;
    };
    expect(tenToTwelveSafety.en).toContain(
      'WHO guidance does not recommend sedentary screen time at this age',
    );
    expect(tenToTwelveSafety.en).toContain(
      'A live video call with family can be an interactive experience different from solo viewing',
    );
    expect(tenToTwelveSafety.en).not.toContain('WHO guidance advises no screen time');
    expect(tenToTwelveFaq[1].a.en).toContain(
      'less likely to learn from screen media than from live, responsive interaction',
    );
    expect(tenToTwelveFaq[1].a.en).not.toContain('learn very little from screens');
    expect(dataFor('gd_10_12m_cognitive').evidenceSummary).toContain(
      'HealthyChildren.org infant media guidance',
    );
    expect(dataFor('gd_10_12m_cognitive').evidenceSummary).not.toContain('Health Canada');

    for (const [slug, kind] of [
      ['gd_birth_2m_communication', 'guide'],
      ['gd_birth_2m_cognitive', 'guide'],
      ['gd_3_4m_cognitive', 'guide'],
      ['act_picture_book_naming', 'activity'],
      ['gd_5_6m_communication', 'guide'],
      ['gd_5_6m_cognitive', 'guide'],
      ['gd_7_9m_communication', 'guide'],
      ['gd_7_9m_cognitive', 'guide'],
    ] as const) {
      expect(sourcesForContent(slug, kind)).toContain('hc-screen-time-5cs-infants-2024');
    }
    expect(sourcesForContent('gd_10_12m_cognitive', 'guide')).not.toContain(
      'hc-screen-time-5cs-2024',
    );
    expect(sourcesForContent('lsn_screen_time', 'lesson')).toContain(
      'hc-screen-time-5cs-overview-2026',
    );
    expect(SOURCE_BY_ID.get('hc-screen-time-5cs-2024')).toMatchObject({
      ageMonthsMin: 24,
      ageMonthsMax: 59,
      verifiedOn: '2026-08-18',
    });
    expect(SOURCE_BY_ID.get('hc-screen-time-5cs-infants-2024')).toMatchObject({
      ageMonthsMin: 0,
      ageMonthsMax: 18,
      verifiedOn: '2026-08-18',
    });
  });

  it('replaces string-tied cupboards with reliable poison prevention and scoped urgency', () => {
    const safety = dataFor('gd_10_12m_safety');
    const lowCost = (safety.lowCost as Array<{ mm: string; en: string }>)[0];
    expect(lowCost.en).toContain('child-resistant latch or lock');
    expect(lowCost.en).toContain('locked cabinet out of sight and reach');
    expect(lowCost.en).not.toContain('string');
    const referral = safety.referral as { mm: string; en: string };
    expect(referral.en).toContain('suspected poison exposure or ingestion');
    expect(referral.en).toContain('Do not induce vomiting');
    expect(referral.en).not.toContain('For any injury');
    expect(sourcesForContent('gd_10_12m_safety', 'guide')).toContain(
      'hc-poison-prevention-2026',
    );
  });

  it('keeps infant speech links age-matched and uses cautious multilingual 24-month wording', () => {
    const guide = dataFor('gd_19_24m_speech').redFlags as Array<{ mm: string; en: string }>;
    expect(guide[0].en).toContain('no two-word combinations');
    expect(guide[0].en).toContain('across all languages used');

    const signs = dataFor('sn_speech_delay').possibleSigns as Array<{ mm: string; en: string }>;
    expect(signs[0].en).toContain('By 12 months');
    expect(signs[1].en).toContain('By 18 months');
    expect(signs[2].en).toContain('across all languages used');
    expect(signs[2].en).not.toContain('50');

    for (const slug of ['gd_5_6m_speech', 'gd_7_9m_speech', 'gd_10_12m_speech']) {
      expect(sourcesForContent(slug, 'guide')).not.toContain('asha-late-language-emergence');
    }
    expect(sourcesForContent('gd_19_24m_speech', 'guide')).not.toContain(
      'asha-speech-sound-disorders',
    );
    expect(sourcesForContent('sn_speech_delay', 'special_need')).toEqual(
      expect.arrayContaining(['cdc-milestones-2026', 'asha-late-language-emergence']),
    );
    expect(SOURCE_BY_ID.get('asha-late-language-emergence')).toMatchObject({
      year: null,
      ageMonthsMin: 24,
      ageMonthsMax: 48,
      reviewStatus: 'evidence_required',
    });
  });

  it('uses the 3-to-5-day food-introduction interval and the direct peanut-risk criteria', () => {
    const sevenToNine = JSON.stringify(dataFor('gd_7_9m_nutrition').faq);
    const tenToTwelve = JSON.stringify(dataFor('gd_10_12m_nutrition').safety);
    for (const text of [sevenToNine, tenToTwelve]) {
      expect(text).toContain('3 to 5 days');
      expect(text).toContain('severe eczema or egg allergy');
      expect(text).not.toContain('family history');
    }
    for (const slug of ['gd_7_9m_nutrition', 'gd_10_12m_nutrition']) {
      expect(sourcesForContent(slug, 'guide')).toEqual(
        expect.arrayContaining([
          'cdc-introduce-solid-foods-2026',
          'jr-niaid-peanut-prevention-2017',
        ]),
      );
    }
    expect(tenToTwelve).toContain('Avoid choking foods — whole nuts');
  });

  it('makes choking and cup practice instructions explicit without unsupported strength claims', () => {
    const selfHelp = dataFor('gd_10_12m_self_help');
    const mistakes = selfHelp.commonMistakes as Array<{ mm: string; en: string }>;
    expect(mistakes[1].en).toContain('cannot make sound or breathe, or turns blue');
    expect(mistakes[1].en).toContain('If coughing happens at every feed or often');
    expect((selfHelp.safety as { mm: string }).mm).toContain('ဘိုကျူလစ်ဇင်');
    expect((selfHelp.safety as { en: string }).en).toContain('whole nuts');
    expect((selfHelp.safety as { en: string }).en).toContain(
      'can contribute to tooth decay',
    );
    expect(sourcesForContent('gd_10_12m_self_help', 'guide')).not.toContain(
      'aota-early-intervention',
    );

    const texture = dataFor('act_two_texture_spoons');
    expect(JSON.stringify(texture)).toContain('age-appropriate shape and size');
    expect(sourcesForContent('act_two_texture_spoons', 'activity')).not.toContain(
      'asha-pediatric-feeding-swallowing',
    );

    const cup = dataFor('act_open_cup_sips');
    expect(rowFor('act_open_cup_sips').summaryEn).not.toContain('oral strength');
    expect(JSON.stringify(cup.instructions)).toContain('do not pour liquid into the mouth');
    expect((cup.safety as { en: string }).en).toContain('can contribute to tooth decay');
    expect(sourcesForContent('act_open_cup_sips', 'activity')).not.toContain(
      'asha-pediatric-feeding-swallowing',
    );
  });

  it('links exact DHH, AAC and sensory-policy sources instead of generic association pages', () => {
    expect(sourcesForContent('sn_hearing_loss', 'special_need')).toContain(
      'asha-language-communication-dhh',
    );
    expect(sourcesForContent('sn_hearing_loss', 'special_need')).not.toContain(
      'asha-spoken-language-disorders',
    );
    expect(sourcesForContent('prt_communication_cards', 'printable')).toContain('asha-aac');
    expect(sourcesForContent('sn_sensory_processing', 'special_need')).toContain(
      'aap-sensory-integration-2012',
    );
    expect(sourcesForContent('sn_visual_impairment', 'special_need')).toContain(
      'aap-visual-system-procedures-2016',
    );
    expect(sourcesForContent('sn_global_developmental_delay', 'special_need')).toContain(
      'aap-gdd-genetic-evaluation-2025',
    );
    expect(sourcesForContent('gd_5_6m_play', 'guide')).toContain(
      'aap-digital-ecosystems-technical-2026',
    );
    expect(sourcesForContent('lsn_screen_time', 'lesson')).toContain(
      'aap-digital-ecosystems-policy-2026',
    );
    expect(sourcesForContent('sn_sensory_processing', 'special_need')).not.toContain(
      'aota-early-intervention',
    );
    expect(SOURCE_BY_ID.get('aap-sensory-integration-2012')).toMatchObject({
      year: 2012,
      doi: '10.1542/peds.2012-0876',
      pmid: '22641765',
      reviewStatus: 'awaiting_review',
    });
  });

  it('does not use public textbook metadata as proof of detailed clinical claims', () => {
    expect(sourcesForContent('sn_cerebral_palsy', 'special_need')).not.toContain(
      'tb-swaiman-7e-2025',
    );
    expect(sourcesForContent('seizure', 'safety_rule')).not.toContain('tb-swaiman-7e-2025');
    expect(sourcesForContent('sudden_weakness', 'safety_rule')).not.toContain(
      'tb-swaiman-7e-2025',
    );
    expect(SOURCE_BY_ID.get('tb-swaiman-7e-2025')).toMatchObject({
      authors: 'Stephen Ashwal, MD; Phillip L. Pearl, MD',
      country: null,
      reviewStatus: 'awaiting_review',
      verifiedOn: '2026-08-18',
    });
  });

  it('keeps communication-card and cerebral-palsy awareness copy claim-accurate', () => {
    expect(rowFor('prt_communication_cards').summaryEn).toContain('needs, choices, and feelings');
    expect(rowFor('prt_communication_cards').summaryEn).not.toContain('pre-verbal');

    const cp = SAMPLE_AWARENESS.find((topic) => topic.slug === 'cerebral-palsy');
    expect(cp?.whatItMeansEn).toContain('developing brain');
    expect(cp?.whatItMeansEn).toContain('movement and posture');
    expect(sourcesForContent('cerebral-palsy', 'hope_topic')).not.toContain(
      'tb-swaiman-7e-2025',
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
      'aap-sensory-integration-2012',
      'aap-visual-system-assessment-2016',
      'aap-visual-system-procedures-2016',
      'aap-gdd-evaluation-2014',
      'aap-gdd-genetic-evaluation-2025',
      'aap-digital-ecosystems-policy-2026',
      'aap-digital-ecosystems-technical-2026',
      'hc-screen-time-5cs-overview-2026',
      'cdc-adhd-clinical-care-2026',
      'cdc-introduce-solid-foods-2026',
      'cdc-cows-milk-2026',
      'cdc-foods-avoid-limit-2026',
      'cdc-ehdi-toolkit-2024',
      'cdc-hearing-treatment-2024',
      'nhs-cerebral-palsy-symptoms-2023',
      'nhs-cerebral-palsy-treatment-2023',
      'nhs-learning-disabilities-2025',
      'nhs-dcd-diagnosis-2023',
      'nhs-dyslexia-children-2026',
      'ida-dyslexia-definition-2025',
      'jr-niaid-peanut-prevention-2017',
      'jr-asi-systematic-review-2025',
      'jr-senita-rct-2022',
      'hc-poison-prevention-2026',
      'asha-language-communication-dhh',
      'asha-aac',
      'who-imci-sick-young-infant-2019',
      'who-child-growth-standards-qa-2025',
    ]) {
      expect(resolveReviewStatus(SOURCE_BY_ID.get(id)!), id).not.toBe('approved');
    }
  });

  it('classifies the AAP dyslexia article as a narrative review, not a systematic review', () => {
    expect(SOURCE_BY_ID.get('aap-dyslexia-early-identification-2020')?.evidenceLevel)
      .toBe('narrative_review');
  });

  it('keeps the new clinical-source metadata exact and conservatively scoped', () => {
    expect(SOURCE_BY_ID.get('aap-visual-system-assessment-2016')).toMatchObject({
      doi: '10.1542/peds.2015-3596',
      ageMonthsMax: null,
    });
    expect(SOURCE_BY_ID.get('aap-visual-system-procedures-2016')).toMatchObject({
      doi: '10.1542/peds.2015-3597',
      pmid: '26644488',
      ageMonthsMax: null,
    });
    expect(SOURCE_BY_ID.get('aap-gdd-genetic-evaluation-2025')).toMatchObject({
      year: 2025,
      doi: '10.1542/peds.2025-072219',
      pmid: '40545261',
      evidenceLevel: 'expert_consensus',
    });
    expect(SOURCE_BY_ID.get('cdc-cows-milk-2026')).toMatchObject({
      ageMonthsMax: null,
      evidenceLevel: 'parent_education',
    });
    expect(SOURCE_BY_ID.get('hc-poison-prevention-2026')).toMatchObject({
      ageMonthsMax: null,
      evidenceLevel: 'parent_education',
    });
    expect(SOURCE_BY_ID.get('jr-asi-systematic-review-2025')?.title).toContain(
      'Ayres Sensory Integration®',
    );
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

  it('keeps WHO growth standards scoped to birth through 60 months', () => {
    expect(SOURCE_BY_ID.get('who-growth-standards-2006')).toMatchObject({
      authors: 'World Health Organization',
      year: 2006,
      evidenceLevel: 'cohort',
      ageMonthsMin: 0,
      ageMonthsMax: 60,
      verifiedOn: '2026-08-18',
    });
    expect(SOURCE_BY_ID.get('who-growth-standards-2006')?.verifiedNote)
      .not.toContain('12 February 2025');
    expect(SOURCE_BY_ID.get('who-child-growth-standards-qa-2025')).toMatchObject({
      title: 'Child growth standards',
      year: 2025,
      evidenceLevel: 'parent_education',
      ageMonthsMin: 0,
      ageMonthsMax: 60,
      verifiedOn: '2026-08-18',
    });
    expect(SOURCE_BY_ID.get('who-child-growth-standards-qa-2025')?.verifiedNote)
      .toContain('12 February 2025');
    expect(sourcesForContent('gd_4_5y_nutrition', 'guide'))
      .toEqual(expect.arrayContaining([
        'who-growth-standards-2006',
        'who-child-growth-standards-qa-2025',
      ]));
    expect(sourcesForContent('gd_5y_nutrition', 'guide'))
      .not.toContain('who-growth-standards-2006');
    expect(sourcesForContent('gd_5y_nutrition', 'guide'))
      .not.toContain('who-child-growth-standards-qa-2025');
  });

  it('uses age-specific WHO IMCI records without generic breathing overreach', () => {
    expect(SOURCE_BY_ID.get('who-imci-chart-2014')).toMatchObject({
      authors: 'WHO',
      evidenceLevel: 'guideline',
      ageMonthsMin: 2,
      ageMonthsMax: 60,
      verifiedOn: '2026-08-18',
    });
    expect(SOURCE_BY_ID.get('who-imci-sick-young-infant-2019')).toMatchObject({
      authors: 'WHO, UNICEF',
      year: 2019,
      edition: null,
      isbn: '978-92-4-151636-5',
      evidenceLevel: 'guideline',
      ageMonthsMin: 0,
      ageMonthsMax: 2,
      verifiedOn: '2026-08-18',
    });
    expect(sourcesForContent('gd_birth_2m_safety', 'guide'))
      .toContain('who-imci-sick-young-infant-2019');
    expect(sourcesForContent('gd_birth_2m_safety', 'guide'))
      .not.toContain('who-imci-chart-2014');
    expect(sourcesForContent('severe_breathing_difficulty', 'safety_rule'))
      .not.toContain('who-imci-chart-2014');
    expect(sourcesForContent('blue_lips', 'safety_rule'))
      .not.toContain('who-imci-chart-2014');
    for (const slug of ['unresponsiveness', 'severe_dehydration', 'emergency_message']) {
      expect(sourcesForContent(slug, 'safety_rule')).toEqual(expect.arrayContaining([
        'who-imci-chart-2014',
        'who-imci-sick-young-infant-2019',
      ]));
    }
  });

  it('preserves exact infant safety thresholds and Myanmar-English parity', () => {
    const birthNutrition = dataFor('gd_birth_2m_nutrition').safety as {
      mm: string; en: string;
    };
    expect(birthNutrition.mm).toContain('အသက် ၁၂ လအောက် ကလေးအား ပျားရည် မကျွေးပါနှင့်');
    expect(birthNutrition.mm).not.toContain('အသက် ၆ လအောက် ကလေးအား ပျားရည်');
    expect(sourcesForContent('gd_birth_2m_nutrition', 'guide'))
      .toContain('cdc-foods-avoid-limit-2026');

    const emotionalReferral = dataFor('gd_3_4m_emotional').referral as {
      mm: string; en: string;
    };
    expect(emotionalReferral.en).toContain('38°C (100.4°F) or above');
    expect(emotionalReferral.mm).toContain('၃၈°C (၁၀၀.၄°F) နှင့်အထက်');

    const threeToFourFaq = dataFor('gd_3_4m_safety').faq as Array<{
      a: { mm: string; en: string };
    }>;
    expect(threeToFourFaq[1].a.mm).toContain('ကိုယ်ခန္ဓာ ပျော့ခွေခြင်း');

    const fiveToSix = dataFor('gd_5_6m_safety');
    expect((fiveToSix.safety as { mm: string }).mm)
      .toContain('ဂေါ်လီလုံး၊ အခွံမာသီး');
    expect((fiveToSix.safety as { en: string }).en)
      .toContain('marbles, nuts');
    expect(JSON.stringify(fiveToSix.redFlags)).not.toContain('အသက် ၃ လကျော်');

    const sevenToNineFaq = dataFor('gd_7_9m_safety').faq as Array<{
      a: { mm: string; en: string };
    }>;
    expect(sevenToNineFaq[1].a.en).toContain('vomiting everything');
    expect(sevenToNineFaq[1].a.en).not.toContain('repeated vomiting');

    const daily = dataFor('gd_10_12m_daily_routine');
    const dailySafety = daily.safety as { mm: string; en: string };
    expect(dailySafety.en).toContain('severe difficulty breathing');
    expect(dailySafety.en).toContain('sunken eyes together with');
    expect(dailySafety.en).toContain('vomiting everything');
    expect(dailySafety.en).not.toContain('difficulty or fast breathing');
    expect((daily.redFlags as Array<{ en: string }>)[0].en)
      .toContain('Severe difficulty breathing');
    const dailyFaq = daily.faq as Array<{ a: { mm: string; en: string } }>;
    expect(dailyFaq[1].a.en).toContain('five days or longer');
    expect(dailyFaq[1].a.en).not.toContain('under three months');
  });

  it('keeps every infant sleep space free of loose blankets and covers', () => {
    for (const slug of [
      'gd_3_4m_sleep',
      'gd_5_6m_sleep',
      'gd_7_9m_sleep',
      'gd_10_12m_sleep',
    ]) {
      const materials = dataFor(slug).materials as { mm: string; en: string };
      expect(materials.en, slug).toContain('only a fitted sheet');
      expect(materials.en, slug).not.toMatch(/light (blanket|cover)/i);
      expect(materials.mm, slug).toContain('အိပ်ရာခင်းတစ်ထည်သာ');
      expect(materials.mm, slug).not.toMatch(/ပါးလွှာသော (စောင်|အဝတ်)/);
    }
    expect((dataFor('gd_10_12m_sleep').materials as { en: string }).en)
      .toContain('Keep the book outside the sleep space');
    for (const slug of ['gd_3_4m_sleep', 'gd_5_6m_sleep', 'gd_7_9m_sleep']) {
      const lowCost = dataFor(slug).lowCost as Array<{ mm: string; en: string }>;
      expect(JSON.stringify(lowCost), slug).toContain('meets safety standards');
      expect(JSON.stringify(lowCost), slug).toContain('only a fitted sheet');
    }
    for (const slug of [
      'gd_3_4m_sleep',
      'gd_5_6m_sleep',
      'gd_7_9m_sleep',
      'gd_10_12m_sleep',
    ]) {
      const safety = dataFor(slug).safety as { mm: string; en: string };
      expect(safety.en, slug).toContain('loose blankets');
      expect(safety.mm, slug).toContain('လွတ်နေသော စောင်');
      expect(safety.en, slug).not.toMatch(/thick (covers|bedding|quilts)/i);
    }
    expect((dataFor('gd_10_12m_sleep').safety as { mm: string }).mm)
      .toContain('အိမ်ကို ဆေးလိပ်ငွေ့ကင်းစင်စွာ ထားပါ');

    const newbornSafety = dataFor('gd_birth_2m_safety');
    expect((newbornSafety.materials as { en: string }).en).toContain('only a fitted sheet');
    expect((newbornSafety.materials as { en: string }).en).not.toContain('light bedding');
    expect((newbornSafety.materials as { mm: string }).mm).not.toContain('ပါးလွှာသော အဝတ်');
    expect(JSON.stringify(newbornSafety.lowCost)).toContain('meets safety standards');
  });

  it('requires rolling both ways before leaving an infant in the sleep position reached', () => {
    const threeToFourFaq = dataFor('gd_3_4m_sleep').faq as Array<{
      a: { mm: string; en: string };
    }>;
    expect(threeToFourFaq[0].a.en).toContain('roll both ways on her own');
    expect(threeToFourFaq[0].a.en).toContain(
      'If she cannot yet roll both ways, return her to her back',
    );

    for (const slug of ['gd_5_6m_sleep', 'gd_7_9m_sleep', 'gd_10_12m_sleep']) {
      const safety = dataFor(slug).safety as { mm: string; en: string };
      expect(safety.en, slug).toContain('roll both ways on her own');
      expect(safety.mm, slug).toContain('ဘက်နှစ်ဖက်စလုံး ကိုယ်တိုင် လှိမ့်နိုင်');
    }
    const sevenToNineFaq = dataFor('gd_7_9m_sleep').faq as Array<{
      a: { mm: string; en: string };
    }>;
    expect(sevenToNineFaq[1].a.en).toContain(
      'If she cannot yet roll both ways, return her to her back',
    );
  });

  it('keeps infant sleep escalation cautious without false reassurance or fever over-triage', () => {
    const fiveToSixFaq = dataFor('gd_5_6m_sleep').faq as Array<{
      a: { mm: string; en: string };
    }>;
    expect(fiveToSixFaq[2].a.en).toContain('usually not an emergency');
    expect(fiveToSixFaq[2].a.en).toContain('if breathing is abnormal');
    expect(fiveToSixFaq[2].a.en).toContain('sleep is seriously affecting the family');
    expect(fiveToSixFaq[2].a.en).not.toContain('no cause for concern');

    const sevenToNineFlags = dataFor('gd_7_9m_sleep').redFlags as Array<{
      mm: string; en: string;
    }>;
    expect(sevenToNineFlags[2].en).toContain('rash that does not fade under pressure');
    expect(sevenToNineFlags[2].en).toContain(
      'fever with difficulty breathing or being hard to wake',
    );
    expect(sevenToNineFlags[2].mm).toContain('ဖိကြည့်လျှင် မပျောက်သော အနီကွက်များ');
    expect(sevenToNineFlags[2].en).not.toContain('high fever');
  });

  it('presents bedtime strategies as optional and responsive rather than guaranteed', () => {
    const lesson = dataFor('lsn_healthy_sleep');
    expect((lesson.takeaway as { en: string }).en).toBe('A steady bedtime routine may help.');
    expect((lesson.actionToday as { en: string }).en).toBe(
      'Try one short, calm bedtime routine tonight.',
    );
    expect(JSON.stringify(lesson)).not.toContain('15 minutes earlier');

    const sleep = dataFor('gd_10_12m_sleep');
    expect(JSON.stringify(sleep.commonMistakes)).toContain('respond to your baby’s cues');
    expect(JSON.stringify(sleep.parentTips)).toContain('this may help her practise settling to sleep');
    expect(JSON.stringify(sleep)).not.toContain('so she learns to fall asleep herself');
    expect((sleep.why as { en: string }).en).toContain(
      'transition commonly happens gradually around 12–18 months',
    );
    expect((sleep.encouragement as { en: string }).en).toContain('may help over time');
    expect((lesson.body as { en: string }).en).toContain('may help sleep');
  });

  it('keeps sleep-source metadata exact, current to the audit date, and non-approved', () => {
    expect(SOURCE_BY_ID.get('jr-aasm-bedtime-2006')).toMatchObject({
      pmid: '17068979',
      doi: null,
      evidenceLevel: 'systematic_review',
      ageMonthsMin: 0,
      ageMonthsMax: 59,
      verifiedOn: '2026-08-18',
    });
    expect(SOURCE_BY_ID.get('jr-hiscock-sleep-rct-2002')).toMatchObject({
      pmid: '11991909',
      doi: '10.1136/bmj.324.7345.1062',
      evidenceLevel: 'rct',
      ageMonthsMin: 6,
      ageMonthsMax: 12,
      verifiedOn: '2026-08-18',
    });
    expect(SOURCE_BY_ID.get('jr-lecuelle-behavioral-insomnia-review-2024')).toMatchObject({
      pmid: '38394890',
      doi: '10.1016/j.smrv.2024.101909',
      evidenceLevel: 'systematic_review',
      ageMonthsMin: 2,
      ageMonthsMax: 72,
    });
    expect(SOURCE_BY_ID.get('jr-mindell-bedtime-routine-rct-2009')).toMatchObject({
      pmid: '19480226',
      doi: '10.1093/sleep/32.5.599',
      evidenceLevel: 'rct',
      ageMonthsMin: 7,
      ageMonthsMax: 36,
    });
    expect(SOURCE_BY_ID.get('jr-mindell-bedtime-routine-rct-2009')?.verifiedNote)
      .toContain('Johnson & Johnson');
    for (const id of [
      'jr-lecuelle-behavioral-insomnia-review-2024',
      'jr-mindell-bedtime-routine-rct-2009',
    ]) {
      expect(resolveReviewStatus(SOURCE_BY_ID.get(id)!), id).not.toBe('approved');
    }
  });

  it('limits AASM and Hiscock links to the exact claims and ages they studied', () => {
    expect(relatedContent('jr-aasm-bedtime-2006').guide.sort()).toEqual([
      'gd_10_12m_sleep',
      'gd_13_18m_sleep',
      'gd_19_24m_sleep',
      'gd_2_5y_sleep',
      'gd_2y_sleep',
      'gd_3_5y_sleep',
      'gd_3y_sleep',
      'gd_4_5y_sleep',
      'gd_4y_sleep',
      'gd_7_9m_sleep',
    ]);
    expect(relatedContent('jr-aasm-bedtime-2006').lesson).toEqual(['lsn_healthy_sleep']);
    expect(relatedContent('jr-aasm-bedtime-2006').milestone).toEqual([]);
    expect(relatedContent('jr-aasm-bedtime-2006').activity).toEqual([]);
    expect(sourcesForContent('gd_5y_sleep', 'guide')).not.toContain('jr-aasm-bedtime-2006');

    const hiscock = relatedContent('jr-hiscock-sleep-rct-2002');
    expect(hiscock.guide.sort()).toEqual(['gd_10_12m_sleep', 'gd_7_9m_sleep']);
    for (const kind of ['activity', 'lesson', 'milestone', 'printable'] as const) {
      expect(hiscock[kind]).toEqual([]);
    }
    for (const slug of ['gd_7_9m_sleep', 'gd_10_12m_sleep']) {
      expect(sourcesForContent(slug, 'guide')).toEqual(expect.arrayContaining([
        'jr-lecuelle-behavioral-insomnia-review-2024',
        'jr-mindell-bedtime-routine-rct-2009',
      ]));
    }
    expect(sourcesForContent('gd_3_4m_sleep', 'guide'))
      .not.toContain('jr-lecuelle-behavioral-insomnia-review-2024');
    expect(relatedContent('jr-lecuelle-behavioral-insomnia-review-2024').milestone)
      .toEqual([]);
    expect(relatedContent('jr-mindell-bedtime-routine-rct-2009').milestone)
      .toEqual(['ms_19_24m_sleep_1']);
  });
});
