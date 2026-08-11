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
