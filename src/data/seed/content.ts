// Sample development content (Phase 24).
//
// EVERY item here is marked reviewStatus: 'clinical_review' — it is illustrative,
// concisely original wording, and MUST NOT be presented to parents as approved
// guidance until a qualified clinical reviewer approves it. The UI renders a
// "Clinical Review Required" badge for any non-'published' content.
//
// This file is a representative sample across age groups. The full catalogue
// (8 milestones / 5 activities / 2 lessons / 1 safety tip / 1 awareness tip per
// age group) is generated and reviewed through the Admin CMS — see
// docs/content/clinical-review-policy.md. Do not hardcode the entire catalogue
// as "published".

import type { DevelopmentDomain } from '../../domain/types';

export type SeedReviewStatus = 'draft' | 'clinical_review' | 'published';

export interface SeedMilestone {
  domain: DevelopmentDomain;
  ageMinMonths: number;
  ageMaxMonths: number;
  titleMm: string;
  titleEn: string;
  questionMm: string;
  questionEn: string;
  whyItMattersEn: string;
  reviewStatus: SeedReviewStatus;
}

export const SAMPLE_MILESTONES: SeedMilestone[] = [
  {
    domain: 'gross_motor', ageMinMonths: 0, ageMaxMonths: 2,
    titleMm: 'ဝမ်းလျားမှောက်နေစဉ် ခေါင်းမော့နိုင်ခြင်း',
    titleEn: 'Lifts head during tummy time',
    questionMm: 'ကလေးကို ဝမ်းလျားမှောက်ထားချိန်တွင် ခေါင်းကို ခဏ မော့နိုင်ပါသလား။',
    questionEn: 'Can your baby briefly lift their head during tummy time?',
    whyItMattersEn: 'Early neck strength supports later sitting and crawling.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'social_emotional', ageMinMonths: 0, ageMaxMonths: 2,
    titleMm: 'ပြုံးပြခြင်း',
    titleEn: 'Smiles in response to you',
    questionMm: 'ကလေးက သင့်ကို မြင်ရပါက ပြုံးပြပါသလား။',
    questionEn: 'Does your baby smile back when you smile at them?',
    whyItMattersEn: 'Social smiling is an early sign of connection and communication.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'speech_language', ageMinMonths: 5, ageMaxMonths: 6,
    titleMm: 'အသံများ တုပြောခြင်း',
    titleEn: 'Babbles and makes sounds',
    questionMm: 'ကလေးက "ဘ" "မ" ကဲ့သို့ အသံများ ထုတ်ပါသလား။',
    questionEn: 'Does your baby make babbling sounds like “ba” or “ma”?',
    whyItMattersEn: 'Babbling is practice for first words and language.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'gross_motor', ageMinMonths: 7, ageMaxMonths: 9,
    titleMm: 'အထောက်မပါဘဲ ထိုင်ခြင်း',
    titleEn: 'Sits without support',
    questionMm: 'ကလေးက အထောက်အကူမပါဘဲ ထိုင်နိုင်ပါသလား။',
    questionEn: 'Can your baby sit without support?',
    whyItMattersEn: 'Independent sitting frees the hands for play and exploration.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'fine_motor', ageMinMonths: 10, ageMaxMonths: 12,
    titleMm: 'လက်ချောင်းဖြင့် ကောက်ယူခြင်း',
    titleEn: 'Picks up small objects with finger and thumb',
    questionMm: 'ကလေးက သေးငယ်သောအရာကို လက်မနှင့် လက်ညှိုးဖြင့် ကောက်ယူနိုင်ပါသလား။',
    questionEn: 'Can your child pick up a small object using thumb and finger?',
    whyItMattersEn: 'The pincer grasp supports self-feeding and later writing.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'speech_language', ageMinMonths: 13, ageMaxMonths: 18,
    titleMm: 'စကားလုံးအနည်းငယ် ပြောခြင်း',
    titleEn: 'Says a few single words',
    questionMm: 'ကလေးက "မမ" "ဖေဖေ" အပြင် စကားလုံးအချို့ ပြောပါသလား။',
    questionEn: 'Does your child say a few words besides “mama” and “dada”?',
    whyItMattersEn: 'First words show growing understanding and expression.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'cognitive', ageMinMonths: 24, ageMaxMonths: 36,
    titleMm: 'ရုပ်ပုံအမည်ပြောခြင်း',
    titleEn: 'Names familiar pictures',
    questionMm: 'ကလေးက စာအုပ်ထဲက အသိရုပ်ပုံများကို အမည်ပြောနိုင်ပါသလား။',
    questionEn: 'Can your child name familiar pictures in a book?',
    whyItMattersEn: 'Naming shows vocabulary and understanding are growing together.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'self_help', ageMinMonths: 48, ageMaxMonths: 60,
    titleMm: 'ကိုယ်တိုင် ဝတ်စုံဝတ်ခြင်း',
    titleEn: 'Dresses with little help',
    questionMm: 'ကလေးက အကူအညီအနည်းငယ်ဖြင့် ကိုယ်တိုင် အဝတ်ဝတ်နိုင်ပါသလား။',
    questionEn: 'Can your child dress themselves with little help?',
    whyItMattersEn: 'Dressing builds independence and fine-motor sequencing.',
    reviewStatus: 'clinical_review',
  },
];

export interface SeedActivity {
  domain: DevelopmentDomain;
  ageMinMonths: number;
  ageMaxMonths: number;
  titleMm: string;
  titleEn: string;
  objectiveMm: string;
  objectiveEn: string;
  materialsMm: string;
  materialsEn: string;
  durationMinutes: number;
  safetyNoteMm: string;
  safetyNoteEn: string;
  reviewStatus: SeedReviewStatus;
}

export const SAMPLE_ACTIVITIES: SeedActivity[] = [
  {
    domain: 'gross_motor', ageMinMonths: 0, ageMaxMonths: 2,
    titleMm: 'မှောက်လျက် ကစားချိန်', titleEn: 'Gentle tummy time',
    objectiveMm: 'လည်ပင်းနှင့် ပခုံးကြွက်သားများ သန်စွမ်းလာစေရန်။',
    objectiveEn: 'Build neck and shoulder strength.',
    materialsMm: 'သန့်ရှင်း၍ ခိုင်ခံ့ပြားချပ်သော နေရာနှင့် အကြိုက်ဆုံး ကစားစရာ။',
    materialsEn: 'A clean, firm, flat surface and a favourite toy.',
    durationMinutes: 3,
    safetyNoteMm: 'အမြဲ စောင့်ကြည့်ပါ။ ကလေး စိတ်ညစ်/ပင်ပန်းရင် ရပ်ပါ။ အိပ်ချိန်တွင် လုံးဝ မလုပ်ပါနှင့်။',
    safetyNoteEn: 'Always supervise. Stop if the baby is upset or tired. Never during sleep.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'speech_language', ageMinMonths: 5, ageMaxMonths: 9,
    titleMm: 'အသံ တုပြန်ကစားခြင်း', titleEn: 'Copy-the-sound game',
    objectiveMm: 'အသံထွက်ခြင်းနှင့် အလှည့်ကျ ဆက်သွယ်ခြင်းကို အားပေးရန်။',
    objectiveEn: 'Encourage babbling and turn-taking.',
    materialsMm: 'သင့်အသံနှင့် မျက်နှာသာ လိုအပ်ပါသည်။',
    materialsEn: 'Just your voice and face.',
    durationMinutes: 5,
    safetyNoteMm: 'ပျော်ရွှင်စွာ လုပ်ပါ။ ကလေး၏ စိတ်ဝင်စားမှုကို လိုက်ပါ။',
    safetyNoteEn: 'Keep it playful; follow the child’s interest.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'fine_motor', ageMinMonths: 10, ageMaxMonths: 18,
    titleMm: 'ခွက်ထဲ ထည့်ကစားခြင်း', titleEn: 'Drop objects into a cup',
    objectiveMm: 'လက်ချောင်းဖြင့် ကိုင်ဆွဲ၍ လွှတ်ချခြင်းကို လေ့ကျင့်ရန်။',
    objectiveEn: 'Practise the pincer grasp and release.',
    materialsMm: 'ခွက်တစ်လုံးနှင့် ကလေးပါးစပ်ထက် ကြီးသော ဘေးကင်းသည့် ပစ္စည်းများ။',
    materialsEn: 'A cup and large, safe objects (bigger than the child’s mouth).',
    durationMinutes: 8,
    safetyNoteMm: 'ကြီးသောပစ္စည်းသာ သုံးပါ — လည်ချောင်းတွင်းပိတ်နိုင်သည်။ အနီးကပ် စောင့်ကြည့်ပါ။',
    safetyNoteEn: 'Use large objects only — choking risk. Supervise closely.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'cognitive', ageMinMonths: 24, ageMaxMonths: 48,
    titleMm: 'ပုံစာအုပ် အတူဖတ်ခြင်း', titleEn: 'Shared picture-book reading',
    objectiveMm: 'ဝေါဟာရနှင့် အာရုံစိုက်နိုင်စွမ်း တိုးတက်စေရန်။',
    objectiveEn: 'Grow vocabulary and attention.',
    materialsMm: 'ပုံပါသော စာအုပ်တစ်အုပ်။',
    materialsEn: 'Any picture book.',
    durationMinutes: 10,
    safetyNoteMm: 'တိတ်ဆိတ်၍ သက်တောင့်သက်သာ နေရာတွင် ကလေးကို စာမျက်နှာလှန်ခိုင်းပါ။',
    safetyNoteEn: 'A calm, comfortable space; let the child turn pages.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'social_emotional', ageMinMonths: 13, ageMaxMonths: 36,
    titleMm: 'ဝှက်တမ်းရှာတမ်း ကစားခြင်း', titleEn: 'Peekaboo and hide-and-find',
    objectiveMm: 'ပစ္စည်းများ ဆက်ရှိနေသည်ဟု နားလည်မှုနှင့် ပျော်ရွှင်သော ဆက်ဆံမှုကို အားပေးရန်။',
    objectiveEn: 'Support object permanence and joyful connection.',
    materialsMm: 'အဝတ်စ တစ်ခု။',
    materialsEn: 'A small cloth.',
    durationMinutes: 5,
    safetyNoteMm: 'နူးညံ့စွာ၊ စိတ်အေးချမ်းစေအောင် ကစားပါ။',
    safetyNoteEn: 'Keep it gentle and reassuring.',
    reviewStatus: 'clinical_review',
  },
];

export interface SeedAwarenessTopic {
  slug: string;
  titleMm: string;
  titleEn: string;
  whatItMeansMm: string;
  whatItMeansEn: string;
  whatItDoesNotMeanMm: string;
  whatItDoesNotMeanEn: string;
  reviewStatus: SeedReviewStatus;
}

export const SAMPLE_AWARENESS: SeedAwarenessTopic[] = [
  {
    slug: 'autism-spectrum',
    titleMm: 'အော်တစ်ဇင်', titleEn: 'Autism Spectrum',
    whatItMeansMm: 'လူတစ်ဦး ဆက်သွယ်ပြောဆိုပုံ၊ ကစားပုံနှင့် ပတ်ဝန်းကျင်ကို ခံစားပုံ ကွဲပြားခြင်း ဖြစ်သည်။',
    whatItMeansEn: 'A difference in how a person communicates, plays, and experiences the world.',
    whatItDoesNotMeanMm: 'ကလေးသည် သင်ယူ၍မရ၊ ဆက်ဆံ၍မရ (သို့) ပျော်ရွှင်စွာ မနေနိုင်ဟု မဆိုလိုပါ။',
    whatItDoesNotMeanEn: 'It does not mean a child cannot learn, connect, or have a happy life.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'speech-language-delay',
    titleMm: 'စကားနှင့် ဘာသာစကား နှောင့်နှေးမှု', titleEn: 'Speech and Language Delay',
    whatItMeansMm: 'ကလေးသည် စကားပြောခြင်း (သို့) နားလည်ခြင်းကို ပုံမှန်ထက် ပိုနှေးကွေးစွာ ဖွံ့ဖြိုးနေခြင်း ဖြစ်သည်။',
    whatItMeansEn: 'A child is developing speech or understanding more slowly than typical.',
    whatItDoesNotMeanMm: 'ကလေး ဉာဏ်ရည်နိမ့်သည် (သို့) စကားဘယ်တော့မှ မပြောနိုင်ဟု မဆိုလိုပါ။',
    whatItDoesNotMeanEn: 'It does not mean a child is not intelligent or will never talk.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'adhd',
    titleMm: 'အာရုံစူးစိုက်မှုနှင့် လှုပ်ရှားမှု (ADHD)', titleEn: 'ADHD',
    whatItMeansMm: 'အာရုံစိုက်မှု၊ လှုပ်ရှားမှုအဆင့်နှင့် စိတ်ထိန်းချုပ်မှုတွင် ကွဲပြားမှုများ ဖြစ်သည်။',
    whatItMeansEn: 'Differences in attention, activity level, and impulse control.',
    whatItDoesNotMeanMm: 'ကလေး “ဆိုးသည်” (သို့) မိဘ ပြုစုပုံ ညံ့သည်ဟု မဆိုလိုပါ။',
    whatItDoesNotMeanEn: 'It does not mean a child is “naughty” or badly parented.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'hearing-loss',
    titleMm: 'အကြားအာရုံ ချို့တဲ့မှု', titleEn: 'Hearing Loss',
    whatItMeansMm: 'အသံအချို့ (သို့) အားလုံးကို ကြားနိုင်စွမ်း လျော့နည်းခြင်း ဖြစ်သည်။',
    whatItMeansEn: 'Reduced ability to hear some or all sounds.',
    whatItDoesNotMeanMm: 'စောစီးစွာ ကူညီပေးပါက အကြားအာရုံချို့တဲ့သော ကလေးများ ဆက်သွယ်ပြောဆို၍ ကောင်းစွာ ရှင်သန်နိုင်ပါသည်။',
    whatItDoesNotMeanEn: 'With early support, children with hearing loss communicate and thrive.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'cerebral-palsy',
    titleMm: 'ဦးနှောက်ဆိုင်ရာ ကြွက်သားထိန်းချုပ်မှု (Cerebral Palsy)', titleEn: 'Cerebral Palsy',
    whatItMeansMm: 'ဦးနှောက် စောစီးစွာ ဖွံ့ဖြိုးမှုကြောင့် လှုပ်ရှားမှုနှင့် ကိုယ်ဟန်အနေအထားတွင် ကွဲပြားမှု ဖြစ်သည်။',
    whatItMeansEn: 'A difference in movement and posture from early brain development.',
    whatItDoesNotMeanMm: 'ကလေး၏ ဉာဏ်ရည် (သို့) အလားအလာကို ဆုံးဖြတ်ပေးသည် မဟုတ်ပါ။',
    whatItDoesNotMeanEn: 'It does not define a child’s intelligence or potential.',
    reviewStatus: 'clinical_review',
  },
];

export interface SeedLesson {
  category: string;
  categoryKey: 'learn.category.speech' | 'learn.category.play' | 'learn.category.sleep' | 'learn.category.visit';
  titleMm: string;
  titleEn: string;
  summaryMm: string;
  summaryEn: string;
  readingMinutes: number;
  reviewStatus: SeedReviewStatus;
}

export const SAMPLE_LESSONS: SeedLesson[] = [
  {
    category: 'Speech and Communication', categoryKey: 'learn.category.speech',
    titleMm: 'ကလေးနှင့် စကားပြောခြင်း', titleEn: 'Talking with your baby',
    summaryMm: 'နေ့စဉ်လုပ်ရိုးလုပ်စဉ်တွင် စကားပြောခြင်းက ဘာသာစကားဖွံ့ဖြိုးမှုကို အားပေးသည်။',
    summaryEn: 'Everyday talking during routines helps language grow.',
    readingMinutes: 4, reviewStatus: 'clinical_review',
  },
  {
    category: 'Play and Learning', categoryKey: 'learn.category.play',
    titleMm: 'ကစားခြင်းဖြင့် သင်ယူခြင်း', titleEn: 'Learning through play',
    summaryMm: 'ရိုးရှင်းသောကစားနည်းများက အသိဉာဏ်နှင့် လက်လှုပ်ရှားမှုကို တည်ဆောက်ပေးသည်။',
    summaryEn: 'Simple play builds thinking and motor skills.',
    readingMinutes: 5, reviewStatus: 'clinical_review',
  },
  {
    category: 'Sleep', categoryKey: 'learn.category.sleep',
    titleMm: 'ကျန်းမာသော အိပ်စက်မှု အလေ့အထ', titleEn: 'Healthy sleep habits',
    summaryMm: 'တည်ငြိမ်သော အိပ်ရာဝင်ချိန် အစီအစဉ်က ကလေးအိပ်စက်မှုကို ကူညီသည်။',
    summaryEn: 'A steady bedtime routine supports better sleep.',
    readingMinutes: 3, reviewStatus: 'clinical_review',
  },
  {
    category: 'Preparing for a Professional Visit', categoryKey: 'learn.category.visit',
    titleMm: 'ဆရာဝန်ပြရန် ပြင်ဆင်ခြင်း', titleEn: 'Preparing for a professional visit',
    summaryMm: 'မေးခွန်းများနှင့် မှတ်တမ်းများ ကြိုတင်ပြင်ဆင်ခြင်းက ဆွေးနွေးမှုကို ပိုအကျိုးရှိစေသည်။',
    summaryEn: 'Bring questions and records to make the visit more useful.',
    readingMinutes: 4, reviewStatus: 'clinical_review',
  },
];

/** Guard used by UI + tests: content is shown as guidance ONLY when published. */
export function isApprovedForParents(reviewStatus: SeedReviewStatus): boolean {
  return reviewStatus === 'published';
}
