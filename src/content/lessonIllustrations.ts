export const LESSON_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  lsn_language_rich_home:
    '/lessons/language_development/lsn_language_rich_home.5490311de9.webp',
};

export function lessonIllustration(slug: string): string | undefined {
  return LESSON_ILLUSTRATIONS[slug];
}
