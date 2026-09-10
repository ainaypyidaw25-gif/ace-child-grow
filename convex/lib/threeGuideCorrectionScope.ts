/** Exact health/development guide corrections; generic imports must not restore stale copy. */
export const THREE_GUIDE_CORRECTION_SLUGS = [
  'gd_birth_2m_nutrition',
  'gd_13_18m_fine_motor',
  'gd_10_12m_safety',
] as const;

// Imports upsert by slug, so a malformed or stale type must not evade protection.
export function isThreeGuideCorrectionSlug(slug: string): boolean {
  return THREE_GUIDE_CORRECTION_SLUGS.some(target => target === slug);
}
