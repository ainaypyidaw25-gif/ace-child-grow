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
    titleMm: 'ပါးစပ်လှဲအိပ်စဉ် ခေါင်းမ',
    titleEn: 'Lifts head during tummy time',
    questionMm: 'ကလေးက ပါးစပ်လှဲအိပ်နေစဉ် ခေါင်းကို ခဏတာ မတင်နိုင်ပါသလား။',
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
  objectiveEn: string;
  materialsEn: string;
  durationMinutes: number;
  safetyNoteEn: string;
  reviewStatus: SeedReviewStatus;
}

export const SAMPLE_ACTIVITIES: SeedActivity[] = [
  {
    domain: 'gross_motor', ageMinMonths: 0, ageMaxMonths: 2,
    titleMm: 'ပါးစပ်လှဲ ကစားချိန်', titleEn: 'Gentle tummy time',
    objectiveEn: 'Build neck and shoulder strength.',
    materialsEn: 'A clean, firm, flat surface and a favourite toy.',
    durationMinutes: 3,
    safetyNoteEn: 'Always supervise. Stop if the baby is upset or tired. Never during sleep.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'speech_language', ageMinMonths: 5, ageMaxMonths: 9,
    titleMm: 'အသံ တုံ့ပြန်ကစားခြင်း', titleEn: 'Copy-the-sound game',
    objectiveEn: 'Encourage babbling and turn-taking.',
    materialsEn: 'Just your voice and face.',
    durationMinutes: 5,
    safetyNoteEn: 'Keep it playful; follow the child’s interest.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'fine_motor', ageMinMonths: 10, ageMaxMonths: 18,
    titleMm: 'ခွက်ထဲ ထည့်ကစားခြင်း', titleEn: 'Drop objects into a cup',
    objectiveEn: 'Practise the pincer grasp and release.',
    materialsEn: 'A cup and large, safe objects (bigger than the child’s mouth).',
    durationMinutes: 8,
    safetyNoteEn: 'Use large objects only — choking risk. Supervise closely.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'cognitive', ageMinMonths: 24, ageMaxMonths: 48,
    titleMm: 'ပုံစာအုပ် အတူဖတ်ခြင်း', titleEn: 'Shared picture-book reading',
    objectiveEn: 'Grow vocabulary and attention.',
    materialsEn: 'Any picture book.',
    durationMinutes: 10,
    safetyNoteEn: 'A calm, comfortable space; let the child turn pages.',
    reviewStatus: 'clinical_review',
  },
  {
    domain: 'social_emotional', ageMinMonths: 13, ageMaxMonths: 36,
    titleMm: 'ဝှက်ပြီးရှာ ကစားခြင်း', titleEn: 'Peekaboo and hide-and-find',
    objectiveEn: 'Support object permanence and joyful connection.',
    materialsEn: 'A small cloth.',
    durationMinutes: 5,
    safetyNoteEn: 'Keep it gentle and reassuring.',
    reviewStatus: 'clinical_review',
  },
];

export interface SeedAwarenessTopic {
  slug: string;
  titleMm: string;
  titleEn: string;
  whatItMeansEn: string;
  whatItDoesNotMeanEn: string;
  reviewStatus: SeedReviewStatus;
}

export const SAMPLE_AWARENESS: SeedAwarenessTopic[] = [
  {
    slug: 'autism-spectrum',
    titleMm: 'အော်တစ်ဇင် စပက်ထရမ်', titleEn: 'Autism Spectrum',
    whatItMeansEn: 'A difference in how a person communicates, plays, and experiences the world.',
    whatItDoesNotMeanEn: 'It does not mean a child cannot learn, connect, or have a happy life.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'speech-language-delay',
    titleMm: 'စကားနှင့် ဘာသာစကား နှောင့်နှေးမှု', titleEn: 'Speech and Language Delay',
    whatItMeansEn: 'A child is developing speech or understanding more slowly than typical.',
    whatItDoesNotMeanEn: 'It does not mean a child is not intelligent or will never talk.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'adhd',
    titleMm: 'အာရုံစူးစိုက်မှုနှင့် လှုပ်ရှားမှု', titleEn: 'ADHD',
    whatItMeansEn: 'Differences in attention, activity level, and impulse control.',
    whatItDoesNotMeanEn: 'It does not mean a child is “naughty” or badly parented.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'hearing-loss',
    titleMm: 'အကြားအာရုံ ချို့တဲ့မှု', titleEn: 'Hearing Loss',
    whatItMeansEn: 'Reduced ability to hear some or all sounds.',
    whatItDoesNotMeanEn: 'With early support, children with hearing loss communicate and thrive.',
    reviewStatus: 'clinical_review',
  },
  {
    slug: 'cerebral-palsy',
    titleMm: 'ဦးနှောက်ဆိုင်ရာ ကြွက်သားထိန်းချုပ်မှု အခက်အခဲ', titleEn: 'Cerebral Palsy',
    whatItMeansEn: 'A difference in movement and posture from early brain development.',
    whatItDoesNotMeanEn: 'It does not define a child’s intelligence or potential.',
    reviewStatus: 'clinical_review',
  },
];

/** Guard used by UI + tests: content is shown as guidance ONLY when published. */
export function isApprovedForParents(reviewStatus: SeedReviewStatus): boolean {
  return reviewStatus === 'published';
}
