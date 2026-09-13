export const STORY_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  st_ba_ba_sounds:
    '/stories/st_ba_ba_sounds.5248d497b0.webp',
  st_first_day_school:
    '/stories/st_first_day_school.a440d58f45.webp',
  st_goodnight_moon_friend:
    '/stories/st_goodnight_moon_friend.3277dec574.webp',
  st_little_seed:
    '/stories/st_little_seed.46d4e79b59.webp',
  st_sharing_mango:
    '/stories/st_sharing_mango.2dd66b6393.webp',
  st_taking_turns:
    '/stories/st_taking_turns.ece7af8fbf.webp',
  st_visit_to_doctor:
    '/stories/st_visit_to_doctor.510f7446cc.webp',
  st_waiting_at_clinic:
    '/stories/st_waiting_at_clinic.3d58cc8c4c.webp',
  st_when_i_feel_angry:
    '/stories/st_when_i_feel_angry.939e6bd987.webp',
};

export function storyIllustration(slug: string): string | undefined {
  return STORY_ILLUSTRATIONS[slug];
}
