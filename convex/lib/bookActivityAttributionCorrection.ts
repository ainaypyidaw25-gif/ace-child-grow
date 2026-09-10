/**
 * Exact source-attribution corrections must not be undone by generic seeds.
 * These slugs are reserved for the revision-bound correction/review workflow;
 * neither an old seed nor a historical errata release may rewrite their body,
 * media or review state. Match by slug even if a stale caller supplies a wrong
 * type, because library content is upserted by slug.
 */
export const BOOK_ACTIVITY_ATTRIBUTION_CORRECTION_SLUGS = [
  'act_board_book_point',
  'act_lift_the_flap_book',
  'act_first_words_book_share',
] as const;

export function isBookActivityAttributionCorrectionSlug(slug: string): boolean {
  return BOOK_ACTIVITY_ATTRIBUTION_CORRECTION_SLUGS.some((target) => target === slug);
}
