/** Exact revision-bound fiction corrections; generic imports may not restore old copy. */
export const SEVEN_STORY_CORRECTION_SLUGS = [
  'st_little_seed',
  'st_ba_ba_sounds',
  'st_when_i_feel_angry',
  'st_taking_turns',
  'st_goodnight_moon_friend',
  'st_visit_to_doctor',
  'st_sharing_mango',
] as const;

// Match by slug even when an old caller sends a wrong type: imports upsert by slug.
export function isSevenStoryCorrectionSlug(slug: string): boolean {
  return SEVEN_STORY_CORRECTION_SLUGS.some(target => target === slug);
}
