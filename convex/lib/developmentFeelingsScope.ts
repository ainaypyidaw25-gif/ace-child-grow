/** Exact catalogue identities; caller-supplied types cannot bypass protection. */
export const DEVELOPMENT_FEELINGS_SLUGS = [
  'lsn_what_is_development',
  'lsn_big_feelings',
] as const;

export function isDevelopmentFeelingsSlug(slug: string): boolean {
  return DEVELOPMENT_FEELINGS_SLUGS.some((target) => target === slug);
}
