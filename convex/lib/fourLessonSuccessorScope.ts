/**
 * Exact catalogue identities for the four source-corrected lesson successors.
 *
 * Their copy and evidence links are revision-bound release inputs. Generic
 * admin imports, CLI seeds and historical errata must therefore leave both an
 * existing row and an absent row untouched. Match by slug even if a stale
 * caller supplies the wrong content kind, because content is upserted by slug.
 */
export const FOUR_LESSON_SUCCESSOR_SLUGS = [
  'lsn_talk_more',
  'lsn_making_friends',
  'lsn_creativity',
  'lsn_prepare_preschool',
] as const;

export function isFourLessonSuccessorSlug(slug: string): boolean {
  return FOUR_LESSON_SUCCESSOR_SLUGS.some((target) => target === slug);
}

export function isFourLessonSuccessorLink(kind: string, slug: string): boolean {
  return kind === 'lesson' && isFourLessonSuccessorSlug(slug);
}
