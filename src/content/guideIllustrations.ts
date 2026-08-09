export const GUIDE_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  gd_birth_2m_cognitive:
    '/guides/gd_birth_2m_cognitive.ab5c096dbf.webp',
  gd_birth_2m_communication:
    '/guides/gd_birth_2m_communication.dfb919eff7.webp',
  gd_birth_2m_daily_routine:
    '/guides/gd_birth_2m_daily_routine.bb306b07b9.webp',
  gd_birth_2m_emotional:
    '/guides/gd_birth_2m_emotional.2456e64699.webp',
  gd_birth_2m_fine_motor:
    '/guides/gd_birth_2m_fine_motor.6090c1ac8d.webp',
  gd_birth_2m_gross_motor:
    '/guides/gd_birth_2m_gross_motor.95520ad071.webp',
  gd_birth_2m_nutrition:
    '/guides/gd_birth_2m_nutrition.5015e31552.webp',
  gd_birth_2m_play:
    '/guides/gd_birth_2m_play.b779fe5a19.webp',
  gd_birth_2m_safety:
    '/guides/gd_birth_2m_safety.edd2756676.webp',
  gd_birth_2m_sleep:
    '/guides/gd_birth_2m_sleep.3bf5cea75b.webp',
  gd_birth_2m_social:
    '/guides/gd_birth_2m_social.d03fb94d44.webp',
  gd_5_6m_social:
    '/guides/gd_5_6m_social.f45ff11649.webp',
  gd_7_9m_cognitive:
    '/guides/gd_7_9m_cognitive.573c2f0d30.webp',
  gd_7_9m_communication:
    '/guides/gd_7_9m_communication.bdb749e2a3.webp',
  gd_7_9m_emotional:
    '/guides/gd_7_9m_emotional.73eabf88fb.webp',
  gd_7_9m_safety:
    '/guides/gd_7_9m_safety.d33c9acaf9.webp',
  gd_7_9m_self_help:
    '/guides/gd_7_9m_self_help.cdfac6e4bf.webp',
  gd_7_9m_social:
    '/guides/gd_7_9m_social.2a908691eb.webp',
};

export function guideIllustration(slug: string): string | undefined {
  return GUIDE_ILLUSTRATIONS[slug];
}
