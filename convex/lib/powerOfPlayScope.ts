/** Immutable catalogue identity; caller-supplied content type cannot bypass the guard. */
export const POWER_OF_PLAY_SLUG = 'lsn_power_of_play' as const;

export function isPowerOfPlaySlug(slug: string): boolean {
  return slug === POWER_OF_PLAY_SLUG;
}
