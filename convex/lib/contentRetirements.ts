/**
 * Exact, code-reviewed catalogue withdrawal. These six milestones duplicate a
 * later or better age-banded milestone and must not be reintroduced by a seed
 * refresh after the production rows have been archived.
 *
 * Pure by design: the seed registry, Convex migration and regression tests all
 * consume this one list, so the production withdrawal cannot drift from the
 * source withdrawal.
 */
export const DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-11-duplicate-milestones' as const;

export const DUPLICATE_MILESTONE_SLUGS = [
  'ms_5_6m_gross_motor_1',
  'ms_5_6m_speech_1',
  'ms_7_9m_gross_motor_1',
  'ms_5_6m_fine_motor_1',
  'ms_5_6m_language_1',
  'ms_5_6m_social_1',
] as const;

export type DuplicateMilestoneSlug = (typeof DUPLICATE_MILESTONE_SLUGS)[number];

const duplicateMilestoneSlugs = new Set<string>(DUPLICATE_MILESTONE_SLUGS);

export function isDuplicateMilestoneSlug(slug: string): slug is DuplicateMilestoneSlug {
  return duplicateMilestoneSlugs.has(slug);
}

/**
 * Exact withdrawal created by the PH40 claim-scope audit. These four records
 * were not supported as developmental milestones by their cited evidence;
 * removing them from the authored seed is insufficient because seed imports do
 * not archive production rows that disappear from the payload.
 *
 * The expected status and revision are the refreshed read-only production
 * snapshot from 2026-08-19. Keeping that preimage in code makes the mutation fail
 * closed if any target is reviewed or republished before the release runs.
 */
export const SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-18-social-emotional-milestones' as const;

export const SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS = [
  {
    slug: 'ms_3_4m_social_2',
    expectedClinicalStatus: 'clinical_review',
    expectedReviewRevision: 1,
  },
  {
    slug: 'ms_2_5y_social_3',
    expectedClinicalStatus: 'clinical_review',
    expectedReviewRevision: 2,
  },
  {
    slug: 'ms_13_18m_emotional_1',
    expectedClinicalStatus: 'clinical_review',
    expectedReviewRevision: 2,
  },
  {
    slug: 'ms_5y_emotional_1',
    expectedClinicalStatus: 'clinical_review',
    expectedReviewRevision: 1,
  },
] as const;

export type SocialEmotionalMilestoneRetirementTarget =
  (typeof SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS)[number];
export type SocialEmotionalMilestoneRetirementSlug =
  SocialEmotionalMilestoneRetirementTarget['slug'];

export const SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_SLUGS =
  SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS.map((target) => target.slug) as readonly SocialEmotionalMilestoneRetirementSlug[];

/**
 * Exact withdrawal found by the Bright Futures claim-scope audit. The authored
 * preschool template accidentally emitted the 5-year social skill "follows
 * rules and takes turns" as a self-help milestone, duplicating the valid
 * `ms_5y_social_2` row and attaching a false self-care explanation.
 *
 * The production preimage was read on 2026-08-19. Seed and evidence imports are
 * upsert-only, so this explicit archive transition is required in addition to
 * filtering the slug out of every future seed payload.
 */
export const BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-19-bright-futures-duplicate-milestone' as const;

export const BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET = {
  slug: 'ms_5y_self_help_2',
  expectedClinicalStatus: 'clinical_review',
  expectedReviewRevision: 5,
} as const;

export type BrightFuturesDuplicateMilestoneRetirementSlug =
  typeof BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.slug;

/** Additional exact retirement sets already applied in Production. */
export const PLAY_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-19-play-pseudo-milestones' as const;
export const PLAY_PSEUDO_MILESTONE_RETIREMENT_SLUGS = [
  'ms_5_6m_cognitive_2',
  'ms_3y_play_1',
] as const;

export const NUTRITION_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-19-textbook-nutrition-pseudo-milestones' as const;
export const NUTRITION_PSEUDO_MILESTONE_RETIREMENT_SLUGS = [
  'ms_2y_nutrition_1',
  'ms_2_5y_nutrition_1',
  'ms_3_5y_nutrition_1',
  'ms_4_5y_nutrition_1',
  'ms_5y_nutrition_1',
] as const;

export const SLEEP_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-19-sleep-pseudo-milestones' as const;
export const SLEEP_PSEUDO_MILESTONE_RETIREMENT_SLUGS = [
  'ms_birth_2m_sleep_1',
  'ms_3_4m_sleep_1',
  'ms_5_6m_sleep_1',
  'ms_13_18m_sleep_1',
  'ms_19_24m_sleep_1',
  'ms_2y_sleep_1',
  'ms_2_5y_sleep_1',
  'ms_3y_sleep_1',
  'ms_3_5y_sleep_1',
  'ms_4y_sleep_1',
  'ms_4_5y_sleep_1',
  'ms_5y_sleep_1',
] as const;

export const MOTOR_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-19-motor-pseudo-milestones' as const;
export const MOTOR_PSEUDO_MILESTONE_RETIREMENT_SLUGS = [
  'ms_birth_2m_gross_motor_2',
  'ms_3y_gross_motor_1',
  'ms_3y_gross_motor_2',
] as const;

/**
 * Exact local exclusion set for the remaining scored pseudo-milestones found
 * by the final milestone audit. The caregiver safety rows are teaching
 * prompts, not child checkpoints; the two infant rows are forward-looking
 * 15-month items; the remaining age-banded rows are unsupported, duplicated,
 * or misbanded observations. All 23 are unsafe to return from MilestoneDemo or
 * any future seed payload.
 *
 * Production archival is a separate fail-closed release built from exact live
 * preimages. Keeping that operation separate preserves content, response, and
 * evidence history while this guard immediately prevents source re-seeding and
 * stale published rows from contributing to checklist scoring.
 */
export const REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-21-remaining-pseudo-milestones' as const;

export const REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS = [
  'ms_13_18m_safety_1',
  'ms_19_24m_safety_1',
  'ms_2y_safety_1',
  'ms_2_5y_safety_1',
  'ms_3y_safety_1',
  'ms_3_5y_safety_1',
  'ms_4y_safety_1',
  'ms_4_5y_safety_1',
  'ms_5y_safety_1',
  'ms_5y_safety_2',
  'ms_5y_safety_3',
  'ms_4y_gross_motor_1',
  'ms_10_12m_fine_motor_2',
  'ms_10_12m_self_help_1',
  'ms_3y_self_help_3',
  'ms_4y_problem_solving_1',
  'ms_3_5y_gross_motor_2',
  'ms_3y_social_2',
  'ms_3y_self_help_2',
  'ms_5y_cognitive_2',
  'ms_5y_gross_motor_2',
  'ms_4_5y_daily_routine_1',
  'ms_4y_self_help_4',
] as const;

export type RemainingPseudoMilestoneRetirementSlug =
  (typeof REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS)[number];

export const FLASH_CARDS_PRINTABLE_RETIREMENT_RELEASE_ID =
  '2026-08-19-flash-cards-printable' as const;
export const FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG = 'prt_flash_cards' as const;

const retiredMilestoneSlugs = new Set<string>([
  ...DUPLICATE_MILESTONE_SLUGS,
  ...SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_SLUGS,
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.slug,
  ...PLAY_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...NUTRITION_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...SLEEP_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...MOTOR_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
]);

/** Central guard used by seed generation to prevent any retired slug returning. */
export function isRetiredMilestoneSlug(slug: string): boolean {
  return retiredMilestoneSlugs.has(slug);
}

const retiredContentKeys = new Set<string>([
  `printable:${FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG}`,
]);

const retiredContentSlugs = new Set<string>([
  ...retiredMilestoneSlugs,
  FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG,
]);

/**
 * Library content is addressed and upserted by slug, so server boundaries must
 * reject a retired slug even when a stale or hand-built client lies about its
 * type. This is deliberately stronger than the type-aware authored-item check.
 */
export function isRetiredContentSlug(slug: string): boolean {
  return retiredContentSlugs.has(slug);
}

/** Type-aware check for authored content and milestone-specific UI behavior. */
export function isRetiredContentItem(type: string, slug: string): boolean {
  return (type === 'milestone' && isRetiredMilestoneSlug(slug))
    || retiredContentKeys.has(`${type}:${slug}`);
}
