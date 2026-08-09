export const GUIDE_ILLUSTRATIONS: Readonly<Record<string, string>> = {
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
