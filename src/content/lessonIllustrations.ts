export const LESSON_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  lsn_big_feelings:
    '/lessons/lsn_big_feelings/lsn_big_feelings.bc16f1bff1.webp',
  lsn_early_math:
    '/lessons/lsn_early_math/lsn_early_math.5d079e41dd.webp',
  lsn_language_rich_home:
    '/lessons/language_development/lsn_language_rich_home.5490311de9.webp',
  lsn_making_friends:
    '/lessons/lsn_making_friends/lsn_making_friends.5342357f4c.webp',
  lsn_power_of_play:
    '/lessons/lsn_power_of_play/lsn_power_of_play.b298071ab2.webp',
  lsn_problem_solving_parenting:
    '/lessons/problem_solving/lsn_problem_solving_parenting.c1c10a05e0.webp',
  lsn_reading_together:
    '/lessons/lsn_reading_together/lsn_reading_together.d4ade1d3a7.webp',
  lsn_screen_time:
    '/lessons/screen_time/lsn_screen_time.e95e1e09f4.webp',
  lsn_healthy_sleep:
    '/lessons/sleep/lsn_healthy_sleep.37bd1e6166.webp',
  lsn_talk_more:
    '/lessons/lsn_talk_more/lsn_talk_more.fdb1ea691e.webp',
  lsn_what_is_development:
    '/lessons/lsn_what_is_development/lsn_what_is_development.3dcf39368f.webp',
};

export function lessonIllustration(slug: string): string | undefined {
  return LESSON_ILLUSTRATIONS[slug];
}
