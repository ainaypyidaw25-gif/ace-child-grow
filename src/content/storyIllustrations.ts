export const STORY_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  st_first_day_school:
    '/stories/st_first_day_school.a440d58f45.webp',
  st_little_seed:
    '/stories/st_little_seed.46d4e79b59.webp',
  st_when_i_feel_angry:
    '/stories/st_when_i_feel_angry.939e6bd987.webp',
};

export function storyIllustration(slug: string): string | undefined {
  return STORY_ILLUSTRATIONS[slug];
}
