// Shared domain types for ACE Child Grow.
// These types back the safety-critical engines. They intentionally contain NO
// diagnostic concepts (no disease scores, no probabilities, no "abnormal" flags).

export type Locale = 'mm' | 'en';

export const DEVELOPMENT_DOMAINS = [
  'gross_motor',
  'fine_motor',
  'speech_language',
  'cognitive',
  'social_emotional',
  'play',
  'self_help',
  'growth_nutrition',
  'sleep',
  'safety_health',
] as const;
export type DevelopmentDomain = (typeof DEVELOPMENT_DOMAINS)[number];

export const AGE_GROUP_KEYS = [
  'birth_2m',
  '3_4m',
  '5_6m',
  '7_9m',
  '10_12m',
  '13_18m',
  '19_24m',
  '2_3y',
  '3_4y',
  '4_5y',
] as const;
export type AgeGroupKey = (typeof AGE_GROUP_KEYS)[number];

/** The four parent milestone answers. Order is meaningful for the rule engine. */
export const MILESTONE_ANSWERS = ['yes', 'sometimes', 'not_yet', 'not_sure'] as const;
export type MilestoneAnswer = (typeof MILESTONE_ANSWERS)[number];

/** Rule-engine result states. Never map these to any diagnosis. */
export type ResultState = 'green' | 'yellow' | 'orange' | 'red';
