export const ACTIVITY_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  act_texture_touch:
    '/activities/birth_2m/act_texture_touch.8b8fd36899.webp',
  act_lullaby_and_rock:
    '/activities/birth_2m/act_lullaby_and_rock.f4e2f5b20a.webp',
  act_first_book_share:
    '/activities/birth_2m/act_first_book_share.0b1174986f.webp',
  act_skin_to_skin_calm:
    '/activities/birth_2m/act_skin_to_skin_calm.c855280097.webp',
  act_gentle_bicycle_legs:
    '/activities/birth_2m/act_gentle_bicycle_legs.ef67d5c21e.webp',
  act_face_to_face_talk:
    '/activities/birth_2m/act_face_to_face_talk.6dcd162b62.webp',
  act_tummy_time_mirror:
    '/activities/birth_2m/act_tummy_time_mirror.15e0a5568d.webp',
};

export function activityIllustration(slug: string): string | undefined {
  return ACTIVITY_ILLUSTRATIONS[slug];
}
