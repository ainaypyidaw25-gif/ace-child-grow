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
  act_sound_tracking:
    '/activities/3_4m/act_sound_tracking.4cc5e73a1c.webp',
  act_copy_my_sound:
    '/activities/3_4m/act_copy_my_sound.0f2257dcb6.webp',
  act_reach_for_the_toy:
    '/activities/3_4m/act_reach_for_the_toy.70d1608428.webp',
  act_peek_a_boo_cloth:
    '/activities/3_4m/act_peek_a_boo_cloth.e45d080f3e.webp',
  act_picture_book_naming:
    '/activities/3_4m/act_picture_book_naming.4df4715aae.webp',
  act_rhythm_and_rock:
    '/activities/3_4m/act_rhythm_and_rock.547948f6a7.webp',
  act_texture_basket_infant:
    '/activities/3_4m/act_texture_basket_infant.e670cf7869.webp',
};

export function activityIllustration(slug: string): string | undefined {
  return ACTIVITY_ILLUSTRATIONS[slug];
}
