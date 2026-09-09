export const LESSON_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  lsn_language_rich_home:
    '/lessons/language_development/lsn_language_rich_home.5490311de9.webp',
  lsn_prepare_preschool:
    '/lessons/preparing_for_preschool/lsn_prepare_preschool.47a357b858.webp',
  lsn_problem_solving_parenting:
    '/lessons/problem_solving/lsn_problem_solving_parenting.c1c10a05e0.webp',
  lsn_screen_time:
    '/lessons/screen_time/lsn_screen_time.e95e1e09f4.webp',
  lsn_healthy_sleep:
    '/lessons/sleep/lsn_healthy_sleep.37bd1e6166.webp',
  lsn_creativity:
    '/lessons/creativity/lsn_creativity.3e8ca55af0.webp',
};

export function lessonIllustration(slug: string): string | undefined {
  return LESSON_ILLUSTRATIONS[slug];
}
