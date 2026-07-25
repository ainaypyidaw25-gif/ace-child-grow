// ACE Child Grow — Content Library taxonomy.
//
// This taxonomy powers the *content library* (lessons, activities, milestones,
// guides, special-needs topics, stories, printables). It is intentionally
// SEPARATE from the safety/rule engine's age bands in src/domain/types.ts —
// the safety engine is unchanged. The library uses a finer 14-band age model
// and the 16 developmental domains requested for content coverage.
//
// Nothing here diagnoses. Domains describe areas of growth, never disorders.

export interface AgeGroup {
  key: string;
  labelEn: string;
  labelMm: string;
  minMonths: number;
  maxMonths: number;
  order: number;
  /** School-readiness content applies from ~3 years. */
  schoolReadiness: boolean;
}

export const AGE_GROUPS: AgeGroup[] = [
  { key: 'birth_2m', labelEn: 'Birth–2 months', labelMm: 'မွေးကင်း – ၂ လ', minMonths: 0, maxMonths: 2, order: 1, schoolReadiness: false },
  { key: '3_4m', labelEn: '3–4 months', labelMm: '၃ – ၄ လ', minMonths: 3, maxMonths: 4, order: 2, schoolReadiness: false },
  { key: '5_6m', labelEn: '5–6 months', labelMm: '၅ – ၆ လ', minMonths: 5, maxMonths: 6, order: 3, schoolReadiness: false },
  { key: '7_9m', labelEn: '7–9 months', labelMm: '၇ – ၉ လ', minMonths: 7, maxMonths: 9, order: 4, schoolReadiness: false },
  { key: '10_12m', labelEn: '10–12 months', labelMm: '၁၀ – ၁၂ လ', minMonths: 10, maxMonths: 12, order: 5, schoolReadiness: false },
  { key: '13_18m', labelEn: '13–18 months', labelMm: '၁၃ – ၁၈ လ', minMonths: 13, maxMonths: 18, order: 6, schoolReadiness: false },
  { key: '19_24m', labelEn: '19–24 months', labelMm: '၁၉ – ၂၄ လ', minMonths: 19, maxMonths: 24, order: 7, schoolReadiness: false },
  { key: '2y', labelEn: '2 years', labelMm: '၂ နှစ်', minMonths: 24, maxMonths: 30, order: 8, schoolReadiness: false },
  { key: '2_5y', labelEn: '2.5 years', labelMm: '၂ နှစ်ခွဲ', minMonths: 30, maxMonths: 36, order: 9, schoolReadiness: false },
  { key: '3y', labelEn: '3 years', labelMm: '၃ နှစ်', minMonths: 36, maxMonths: 42, order: 10, schoolReadiness: true },
  { key: '3_5y', labelEn: '3.5 years', labelMm: '၃ နှစ်ခွဲ', minMonths: 42, maxMonths: 48, order: 11, schoolReadiness: true },
  { key: '4y', labelEn: '4 years', labelMm: '၄ နှစ်', minMonths: 48, maxMonths: 54, order: 12, schoolReadiness: true },
  { key: '4_5y', labelEn: '4.5 years', labelMm: '၄ နှစ်ခွဲ', minMonths: 54, maxMonths: 60, order: 13, schoolReadiness: true },
  { key: '5y', labelEn: '5 years', labelMm: '၅ နှစ်', minMonths: 60, maxMonths: 66, order: 14, schoolReadiness: true },
];

export const AGE_GROUP_KEYS = AGE_GROUPS.map((a) => a.key);

export interface Domain {
  key: string;
  labelEn: string;
  labelMm: string;
  order: number;
}

export const DOMAINS: Domain[] = [
  { key: 'gross_motor', labelEn: 'Gross Motor', labelMm: 'ကြွက်သားကြီး လှုပ်ရှားမှု', order: 1 },
  { key: 'fine_motor', labelEn: 'Fine Motor', labelMm: 'လက်ချောင်းငယ် လှုပ်ရှားမှု', order: 2 },
  { key: 'speech', labelEn: 'Speech', labelMm: 'စကားသံ ထွက်ဆိုမှု', order: 3 },
  { key: 'language', labelEn: 'Language', labelMm: 'ဘာသာစကား နားလည်မှု', order: 4 },
  { key: 'communication', labelEn: 'Communication', labelMm: 'ဆက်သွယ်ပြောဆိုမှု', order: 5 },
  { key: 'cognitive', labelEn: 'Cognitive', labelMm: 'အသိဉာဏ် ဖွံ့ဖြိုးမှု', order: 6 },
  { key: 'problem_solving', labelEn: 'Problem Solving', labelMm: 'ပြဿနာ ဖြေရှင်းခြင်း', order: 7 },
  { key: 'social', labelEn: 'Social', labelMm: 'လူမှုဆက်ဆံရေး', order: 8 },
  { key: 'emotional', labelEn: 'Emotional', labelMm: 'စိတ်ခံစားမှု', order: 9 },
  { key: 'self_help', labelEn: 'Self Help', labelMm: 'ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု', order: 10 },
  { key: 'play', labelEn: 'Play', labelMm: 'ကစားခြင်း', order: 11 },
  { key: 'nutrition', labelEn: 'Nutrition', labelMm: 'အာဟာရ', order: 12 },
  { key: 'sleep', labelEn: 'Sleep', labelMm: 'အိပ်စက်ခြင်း', order: 13 },
  { key: 'safety', labelEn: 'Safety', labelMm: 'ဘေးကင်းလုံခြုံရေး', order: 14 },
  { key: 'daily_routine', labelEn: 'Daily Routine', labelMm: 'နေ့စဉ် လုပ်ရိုးလုပ်စဉ်', order: 15 },
  { key: 'school_readiness', labelEn: 'School Readiness', labelMm: 'ကျောင်းအတွက် အသင့်ဖြစ်မှု', order: 16 },
];

export const DOMAIN_KEYS = DOMAINS.map((d) => d.key);

export const LESSON_CATEGORIES = [
  'understanding_development', 'learning_through_play', 'speech_development',
  'language_development', 'positive_parenting', 'nutrition', 'sleep', 'safety',
  'screen_time', 'emotional_development', 'social_skills', 'reading',
  'early_mathematics', 'creativity', 'problem_solving', 'special_needs_awareness',
  'preparing_for_preschool', 'preparing_for_school', 'doctor_visits',
  'parent_mental_health',
] as const;
export type LessonCategory = (typeof LESSON_CATEGORIES)[number];

export const SPECIAL_NEEDS_KEYS = [
  'autism', 'speech_delay', 'adhd', 'down_syndrome', 'cerebral_palsy',
  'hearing_loss', 'visual_impairment', 'global_developmental_delay',
  'learning_disability', 'sensory_processing', 'dyslexia',
  'developmental_coordination_disorder', 'selective_mutism',
] as const;
export type SpecialNeedKey = (typeof SPECIAL_NEEDS_KEYS)[number];

export const STORY_TYPES = [
  'picture', 'speech', 'emotion', 'social', 'bedtime', 'waiting', 'hospital',
  'school', 'sharing',
] as const;

export const PRINTABLE_TYPES = [
  'flash_cards', 'emotion_cards', 'communication_cards', 'routine_chart',
  'reward_chart', 'behavior_chart', 'visual_schedule', 'doctor_visit_checklist',
  'growth_log', 'sleep_diary', 'milestone_checklist',
  // Per-age-band parent checklists produced by the knowledge base. Guidance
  // sheets, never screening or diagnostic instruments.
  'checklist_birth_2m', 'checklist_3_4m', 'checklist_5_6m',
] as const;

export const CONTENT_TYPES = [
  'milestone', 'guide', 'activity', 'lesson', 'special_need', 'story', 'printable',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Clinical-review lifecycle. Nothing is 'published' until a reviewer approves. */
export const CLINICAL_STATUSES = ['draft', 'clinical_review', 'published'] as const;
export type ClinicalStatus = (typeof CLINICAL_STATUSES)[number];

export const ageGroup = (key: string) => AGE_GROUPS.find((a) => a.key === key);
export const domain = (key: string) => DOMAINS.find((d) => d.key === key);
