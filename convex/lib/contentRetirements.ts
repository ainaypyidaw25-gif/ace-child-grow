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
 * The expected status and revision are the read-only production snapshot from
 * 2026-08-18. Keeping that preimage in code makes the production mutation fail
 * closed if any target is reviewed or republished before the release runs.
 */
export const SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID =
  '2026-08-18-social-emotional-milestones' as const;

export const SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS = [
  {
    slug: 'ms_3_4m_social_2',
    expectedClinicalStatus: 'published',
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

const retiredMilestoneSlugs = new Set<string>([
  ...DUPLICATE_MILESTONE_SLUGS,
  ...SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_SLUGS,
]);

/** Central guard used by seed generation to prevent any retired slug returning. */
export function isRetiredMilestoneSlug(slug: string): boolean {
  return retiredMilestoneSlugs.has(slug);
}
