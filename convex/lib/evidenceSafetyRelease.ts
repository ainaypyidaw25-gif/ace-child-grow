/**
 * Production-bound evidence/safety correction release.
 *
 * The seed importer deliberately protects published rows, so this release is
 * the only path that may reconcile the reviewed source metadata and the exact
 * parent-facing corrections below. Substantive edits return to review at a new
 * revision; metadata-only updates retain their current publication decision.
 */
export const PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID =
  '2026-08-11-published-evidence-safety' as const;

export const LEGACY_PENDING_REVIEW_SOURCE =
  'ACE Child Grow editorial draft — general developmental guidance, pending native-Myanmar and clinical review' as const;

export const EVIDENCE_REVIEWED_EDUCATION_SOURCE =
  'ACE Child Grow editorial content — evidence-mapped general child-development and parent-education guidance' as const;

/** Parent-visible wording/age/safety corrections that must invalidate old reviews. */
export const PUBLISHED_CONTENT_CORRECTION_SLUGS = [
  'ms_5_6m_cognitive_2',
  'ms_5_6m_gross_motor_2',
  'ms_2y_gross_motor_1',
  'ms_3y_cognitive_1',
  'ms_4y_gross_motor_1',
  'ms_4y_school_readiness_1',
  'ms_5y_school_readiness_1',
  'ms_2_5y_fine_motor_1',
  'ms_2y_speech_1',
  'act_story_sequence',
  'st_when_i_feel_angry',
  'st_little_seed',
  'lsn_screen_time',
] as const;

/** Only emergency-decision wording on these records needs specialist review. */
export const FOCUSED_SPECIALIST_REVIEW_SLUGS = [
  'ms_birth_2m_emotional_1',
  'ms_birth_2m_nutrition_1',
  'ms_birth_2m_sleep_1',
  'ms_3_4m_sleep_1',
  'ms_5_6m_sleep_1',
  'gd_7_9m_safety',
  'gd_7_9m_emotional',
] as const;

const correctionSlugs = new Set<string>(PUBLISHED_CONTENT_CORRECTION_SLUGS);
const specialistSlugs = new Set<string>(FOCUSED_SPECIALIST_REVIEW_SLUGS);

export function isPublishedContentCorrectionSlug(slug: string): boolean {
  return correctionSlugs.has(slug);
}

export function isFocusedSpecialistReviewSlug(slug: string): boolean {
  return specialistSlugs.has(slug);
}
