import type { ReviewerManualQueueGroup } from './reviewerManualQueue';

export type ReviewerManualResolution = {
  reportItem: number;
  claimId: string;
  group: ReviewerManualQueueGroup;
  decision: 'accepted_for_implementation';
  decidedOn: '2026-08-21';
  targets: string[];
  evidenceSourceIds: string[];
  resolutionMm: string;
  resolutionEn: string;
};

/**
 * Owner-authorized Batch 4 implementation decisions from 2026-08-21.
 *
 * These entries record where each report prompt was resolved. They are not a
 * clinician credential, source approval, content publication decision, or a
 * substitute for the revision-bound review and evidence gates.
 */
export const REVIEWER_MANUAL_RESOLUTIONS: ReviewerManualResolution[] = [
  {
    reportItem: 78,
    claimId: 't2.type.activity',
    group: 'content_type_summary',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: ['all active activity records → data.safety', 'public ContentDetail → activity safety section'],
    evidenceSourceIds: [],
    resolutionMm: 'Activity အားလုံးတွင် MM/EN safety field ရှိကြောင်း အတည်ပြုပြီး အသက်အရွယ်နှင့် activity အလိုက် ရှိပြီးသား record-specific safety ကို ဆက်သုံးထားသည်။ Infant-only sleep wording ကို older-child activity အားလုံးထဲ မကူးထည့်ပါ။',
    resolutionEn: 'Confirmed that every active activity has MM/EN safety copy and retained record-specific, age-appropriate safety. Infant-only sleep wording is not copied into every older-child activity.',
  },
  {
    reportItem: 79,
    claimId: 't2.type.lesson',
    group: 'content_type_summary',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: ['lesson:lsn_healthy_sleep → data.body'],
    evidenceSourceIds: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022'],
    resolutionMm: 'အိပ်ရာမဝင်မီ screen ရှောင်ခြင်း၊ အလင်းလျှော့ခြင်းနှင့် ငြိမ်သက်သော activity ရွေးခြင်းကို healthy-sleep lesson body တွင် MM/EN ထည့်ထားသည်။',
    resolutionEn: 'Added bilingual pre-bed screen avoidance, dimmed light, and a quiet activity to the healthy-sleep lesson body.',
  },
  {
    reportItem: 80,
    claimId: 't2.type.milestone',
    group: 'content_type_summary',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: ['public MilestoneDemo → pre-checklist framing', 'public ContentDetail → milestone framing'],
    evidenceSourceIds: ['aap-surveillance-2020', 'cdc-milestones-2026'],
    resolutionMm: 'Milestone များကို pass/fail သို့မဟုတ် diagnosis အဖြစ် မသုံးရန်နှင့် skill loss/စိုးရိမ်ချက်ရှိပါက ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ရန် public UI တွင် MM/EN note ထည့်ထားသည်။',
    resolutionEn: 'Added bilingual public UI framing that milestones are not pass/fail or diagnosis and that lost skills or concerns should be discussed with a health worker.',
  },
  {
    reportItem: 81,
    claimId: 't2.type.printable',
    group: 'content_type_summary',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: ['public ContentDetail → printable use note'],
    evidenceSourceIds: [],
    resolutionMm: 'Printable များသည် အိမ်တွင် မှတ်သားရန်သာဖြစ်ပြီး diagnosis မဟုတ်ကြောင်း၊ ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးရာတွင် သုံးရန်ဖြစ်ကြောင်း type-level MM/EN note ထည့်ထားသည်။',
    resolutionEn: 'Added a bilingual type-level note that printables are for home observation and discussion with a health worker, not diagnosis.',
  },
  {
    reportItem: 82,
    claimId: 't2.type.story',
    group: 'content_type_summary',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: ['public ContentDetail → story framing'],
    evidenceSourceIds: [],
    resolutionMm: 'Story များကို ဘာသာစကား၊ စိတ်ကူးဉာဏ်နှင့် မိဘ–ကလေး အတူတကွဆက်သွယ်မှုအတွက် သင်ယူရေး/ဖျော်ဖြေရေး content အဖြစ် public UI တွင် ဖော်ပြထားသည်။',
    resolutionEn: 'Framed stories in the public UI as learning and entertainment content supporting language, imagination, and shared caregiver-child connection.',
  },
  {
    reportItem: 83,
    claimId: 't2.choking.under4',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: [
      'guide:gd_13_18m_nutrition → data.safety',
      'guide:gd_19_24m_nutrition → data.safety',
      'guide:gd_2y_nutrition → data.safety',
      'guide:gd_2_5y_nutrition → data.safety',
      'guide:gd_3y_nutrition → data.safety',
      'guide:gd_3_5y_nutrition → data.safety',
    ],
    evidenceSourceIds: ['hc-choking-prevention-2026'],
    resolutionMm: 'အသက် ၄ နှစ်အောက် nutrition guides ခြောက်ခုတွင် အစားအစာဖြတ်တောက်ပုံ၊ ရှောင်ရန်အစားအစာ၊ မတ်မတ်ထိုင်စားခြင်းနှင့် လူကြီးအနီးရှိခြင်းကို MM/EN ထည့်ပြီး direct source ချိတ်ထားသည်။',
    resolutionEn: 'Added bilingual cutting, food-avoidance, seated-eating, and close-supervision guidance to the six nutrition guides below age four and linked the direct source.',
  },
  {
    reportItem: 84,
    claimId: 't2.fever.no_number',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: [
      'guide:gd_birth_2m_sleep → data.redFlags/referral',
      'guide:gd_birth_2m_emotional → data.redFlags/referral',
      'guide:gd_birth_2m_safety → data.redFlags/referral',
      'guide:gd_3_4m_emotional → data.redFlags/referral',
      'guide:gd_3_4m_safety → data.redFlags/referral',
      'guide:gd_3_4m_daily_routine → data.redFlags/referral',
      'guide:gd_5_6m_safety → data.redFlags/referral',
      'guide:gd_5_6m_daily_routine → data.redFlags/referral',
      'guide:gd_7_9m_emotional → data.redFlags/referral',
      'guide:gd_7_9m_sleep → data.redFlags/referral',
      'guide:gd_7_9m_safety → data.redFlags/referral',
      'guide:gd_7_9m_daily_routine → data.redFlags/referral',
    ],
    evidenceSourceIds: ['nice-ng143-fever-2019', 'who-imci-sick-young-infant-2019', 'who-imci-chart-2014'],
    resolutionMm: 'လက်ရှိ MM/EN fields ထဲရှိ <3 လ 38°C နှင့် 3–6 လ 39°C thresholds၊ emergency signs နှင့် referral tier များကို exact target inventory ဖြင့် အတည်ပြုထားသည်။',
    resolutionEn: 'Confirmed the existing bilingual under-3-month 38°C and 3–6-month 39°C thresholds, emergency signs, and referral tiers against an exact target inventory.',
  },
  {
    reportItem: 85,
    claimId: 't2.fever.under3m_wording',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: [
      'guide:gd_birth_2m_sleep → data.redFlags/referral',
      'guide:gd_birth_2m_emotional → data.redFlags/referral',
      'guide:gd_birth_2m_safety → data.redFlags/referral',
    ],
    evidenceSourceIds: ['nice-ng143-fever-2019', 'who-imci-sick-young-infant-2019'],
    resolutionMm: 'မွေးကင်း–၂ လ target သုံးခုတွင် 38°C နှင့်အထက်ကို စောင့်မနေဘဲ ချက်ချင်းစစ်ဆေးရန် wording ကို အတည်ပြုထားသည်။',
    resolutionEn: 'Confirmed immediate, do-not-wait wording for 38°C or above in the three birth-to-two-month targets.',
  },
  {
    reportItem: 86,
    claimId: 't2.nutrition.5_6m_urgency',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: ['guide:gd_5_6m_nutrition → data.redFlags/referral'],
    evidenceSourceIds: ['hc-child-ems-2026'],
    resolutionMm: 'အလေးချိန်၊ ထပ်ခါအန်/ဝမ်းလျှော၊ မျိုချ/တစ်ဆို့မှုနှင့် ရေဓာတ်ခန်းခြောက်မှု fields ကို အတည်ပြုပြီး significant dehydration emergency source ကို exact guide link တွင် ထည့်ထားသည်။',
    resolutionEn: 'Confirmed the weight, repeated vomiting/diarrhoea, swallowing/choking, and dehydration fields and added the significant-dehydration emergency source to the exact guide link.',
  },
  {
    reportItem: 87,
    claimId: 't2.rash.nonblanching',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: [
      'guide:gd_birth_2m_emotional → data.redFlags/referral',
      'guide:gd_birth_2m_safety → data.redFlags/referral',
      'guide:gd_3_4m_emotional → data.redFlags/referral',
      'guide:gd_3_4m_sleep → data.redFlags/referral',
      'guide:gd_3_4m_safety → data.redFlags/referral',
      'guide:gd_3_4m_daily_routine → data.redFlags/referral',
      'guide:gd_5_6m_sleep → data.redFlags/referral',
      'guide:gd_5_6m_safety → data.redFlags/referral',
      'guide:gd_5_6m_daily_routine → data.redFlags/referral',
    ],
    evidenceSourceIds: ['nice-ng143-fever-2019'],
    resolutionMm: 'မွေးကင်းမှ ၆ လအထိ exact target ကို စာရင်းပိတ်ပြီး ဖိသော်လည်းမပျောက်သော rash ကို emergency အဖြစ် ဖော်ပြထားသည့် MM/EN copy ကို အတည်ပြုထားသည်။',
    resolutionEn: 'Closed the exact birth-to-six-month inventory and confirmed bilingual emergency wording for a rash that does not fade under pressure.',
  },
  {
    reportItem: 88,
    claimId: 't2.sleep.birth2m_urgency',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: ['guide:gd_birth_2m_sleep → data.redFlags/referral'],
    evidenceSourceIds: ['nice-ng143-fever-2019', 'hc-child-ems-2026'],
    resolutionMm: 'အသက်ရှူရပ်/ခက်/ညည်းသံ၊ ပြာခြင်း၊ မနိုးနိုင်ခြင်း၊ floppy ဖြစ်ခြင်းနှင့် <3 လ 38°C fever ကို nearest-hospital-now tier ဖြင့် အတည်ပြုပြီး exact acute sources ချိတ်ထားသည်။',
    resolutionEn: 'Confirmed the nearest-hospital-now tier for breathing pauses/difficulty/grunting, blue colour, unresponsiveness, floppiness, and fever of 38°C or above under three months, with exact acute sources linked.',
  },
  {
    reportItem: 89,
    claimId: 't2.sleep.pacifier',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: [
      'guide:gd_birth_2m_sleep → data.safety',
      'guide:gd_3_4m_sleep → data.safety',
      'guide:gd_5_6m_sleep → data.safety',
      'guide:gd_7_9m_sleep → data.safety',
      'guide:gd_10_12m_sleep → data.safety',
    ],
    evidenceSourceIds: ['aap-safe-sleep-2022'],
    resolutionMm: '0–12 လ sleep guides အားလုံးတွင် nap/bedtime pacifier၊ breastfeeding အသားကျပြီးမှပေးခြင်းနှင့် ကျွတ်သွားလျှင် ပြန်မထည့်ရခြင်းကို conservative MM/EN wording ဖြင့် ပြည့်စုံစေထားသည်။',
    resolutionEn: 'Completed conservative bilingual pacifier wording across all 0–12-month sleep guides: offer at naps/bedtime, wait until breastfeeding is established, and do not reinsert after it falls out.',
  },
  {
    reportItem: 90,
    claimId: 't2.sleep.weighted_and_monitors',
    group: 'clinical_safety_gap',
    decision: 'accepted_for_implementation',
    decidedOn: '2026-08-21',
    targets: [
      'guide:gd_birth_2m_sleep → data.commonMistakes',
      'guide:gd_3_4m_sleep → data.commonMistakes',
      'guide:gd_5_6m_sleep → data.commonMistakes',
      'guide:gd_7_9m_sleep → data.commonMistakes',
      'guide:gd_10_12m_sleep → data.commonMistakes',
    ],
    evidenceSourceIds: ['aap-safe-sleep-2022'],
    resolutionMm: '0–12 လ sleep guides အားလုံးတွင် weighted sleep products မသုံးရန်နှင့် home monitors များသည် safe sleep ကို အစားမထိုးကြောင်း MM/EN copy ပြည့်စုံစေထားသည်။',
    resolutionEn: 'Completed bilingual wording across all 0–12-month sleep guides to avoid weighted sleep products and not use home monitors as a substitute for safe sleep.',
  },
];

export const REVIEWER_MANUAL_RESOLUTION_BY_REPORT = new Map(
  REVIEWER_MANUAL_RESOLUTIONS.map((resolution) => [resolution.reportItem, resolution]),
);
