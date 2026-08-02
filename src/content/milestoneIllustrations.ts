export const MILESTONE_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  ms_birth_2m_sleep_1: '/milestones/birth_2m/ms_birth_2m_sleep_1.f05be35ccb.webp',
  ms_birth_2m_nutrition_1: '/milestones/birth_2m/ms_birth_2m_nutrition_1.edc97d5258.webp',
  ms_birth_2m_play_1: '/milestones/birth_2m/ms_birth_2m_play_1.1ac5a0cc60.webp',
  ms_birth_2m_emotional_1: '/milestones/birth_2m/ms_birth_2m_emotional_1.b285af305d.webp',
  ms_birth_2m_communication_2: '/milestones/birth_2m/ms_birth_2m_communication_2.91a35482c7.webp',
  ms_birth_2m_cognitive_1: '/milestones/birth_2m/ms_birth_2m_cognitive_1.c634d8cbef.webp',
  ms_birth_2m_fine_motor_1: '/milestones/birth_2m/ms_birth_2m_fine_motor_1.68379a9b05.webp',
  ms_birth_2m_gross_motor_2: '/milestones/birth_2m/ms_birth_2m_gross_motor_2.73d9d6124a.webp',
  ms_birth_2m_social_2: '/milestones/birth_2m/ms_birth_2m_social_2.f0c3f13888.webp',
  ms_birth_2m_communication_1: '/milestones/birth_2m/ms_birth_2m_communication_1.56f5402a78.webp',
  ms_birth_2m_social_1: '/milestones/birth_2m/ms_birth_2m_social_1.44283ad7b3.webp',
  ms_birth_2m_gross_motor_1: '/milestones/birth_2m/ms_birth_2m_gross_motor_1.6f3082cd94.webp',
};

export function milestoneIllustration(slug: string): string | undefined {
  return MILESTONE_ILLUSTRATIONS[slug];
}
