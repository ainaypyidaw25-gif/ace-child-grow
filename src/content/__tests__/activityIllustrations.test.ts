import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ACTIVITY_ILLUSTRATIONS, activityIllustration } from '../activityIllustrations';

const BIRTH_2M_ACTIVITY_SLUGS = [
  'act_texture_touch',
  'act_lullaby_and_rock',
  'act_first_book_share',
  'act_skin_to_skin_calm',
  'act_gentle_bicycle_legs',
  'act_face_to_face_talk',
  'act_tummy_time_mirror',
] as const;

const THREE_TO_FOUR_MONTH_ACTIVITY_SLUGS = [
  'act_sound_tracking',
  'act_copy_my_sound',
  'act_reach_for_the_toy',
  'act_peek_a_boo_cloth',
  'act_picture_book_naming',
  'act_rhythm_and_rock',
  'act_texture_basket_infant',
] as const;

const FIVE_TO_SIX_MONTH_ACTIVITY_SLUGS = [
  'act_babble_back_and_forth',
  'act_roll_and_reach',
  'act_mirror_hello',
  'act_board_book_point',
  'act_clap_and_sing_5_6m',
  'act_safe_touch_basket',
] as const;

const SEVEN_TO_NINE_MONTH_ACTIVITY_SLUGS = [
  'act_drum_and_pause',
  'act_lift_the_flap_book',
  'act_name_and_wait',
  'act_peekaboo',
  'act_sit_and_reach_ring',
  'act_two_texture_spoons',
  'act_wave_bye_bye',
] as const;

const THREE_YEAR_ACTIVITY_SLUGS = ['act_color_sort'] as const;

const TARGETED_ACTIVITY_SLUGS = [
  ...BIRTH_2M_ACTIVITY_SLUGS,
  ...THREE_TO_FOUR_MONTH_ACTIVITY_SLUGS,
  ...FIVE_TO_SIX_MONTH_ACTIVITY_SLUGS,
  ...SEVEN_TO_NINE_MONTH_ACTIVITY_SLUGS,
  ...THREE_YEAR_ACTIVITY_SLUGS,
] as const;

describe('published activity illustrations', () => {
  it('maps every targeted production slug to its own versioned WebP', () => {
    expect(Object.keys(ACTIVITY_ILLUSTRATIONS).sort()).toEqual(
      [...TARGETED_ACTIVITY_SLUGS].sort(),
    );

    const paths = TARGETED_ACTIVITY_SLUGS.map((slug) => activityIllustration(slug));
    expect(new Set(paths).size).toBe(TARGETED_ACTIVITY_SLUGS.length);

    TARGETED_ACTIVITY_SLUGS.forEach((slug) => {
      const ageGroup = SEVEN_TO_NINE_MONTH_ACTIVITY_SLUGS.includes(
        slug as (typeof SEVEN_TO_NINE_MONTH_ACTIVITY_SLUGS)[number],
      )
        ? '7_9m'
        : THREE_YEAR_ACTIVITY_SLUGS.includes(
              slug as (typeof THREE_YEAR_ACTIVITY_SLUGS)[number],
            )
          ? '3y'
          : FIVE_TO_SIX_MONTH_ACTIVITY_SLUGS.includes(
                slug as (typeof FIVE_TO_SIX_MONTH_ACTIVITY_SLUGS)[number],
              )
            ? '5_6m'
            : THREE_TO_FOUR_MONTH_ACTIVITY_SLUGS.includes(
                  slug as (typeof THREE_TO_FOUR_MONTH_ACTIVITY_SLUGS)[number],
                )
              ? '3_4m'
              : 'birth_2m';
      expect(activityIllustration(slug)).toMatch(
        new RegExp(`/activities/${ageGroup}/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('keeps every previously approved birth–2 month mapping unchanged', () => {
    expect(BIRTH_2M_ACTIVITY_SLUGS.map((slug) => activityIllustration(slug))).toEqual([
      '/activities/birth_2m/act_texture_touch.8b8fd36899.webp',
      '/activities/birth_2m/act_lullaby_and_rock.f4e2f5b20a.webp',
      '/activities/birth_2m/act_first_book_share.0b1174986f.webp',
      '/activities/birth_2m/act_skin_to_skin_calm.c855280097.webp',
      '/activities/birth_2m/act_gentle_bicycle_legs.ef67d5c21e.webp',
      '/activities/birth_2m/act_face_to_face_talk.6dcd162b62.webp',
      '/activities/birth_2m/act_tummy_time_mirror.15e0a5568d.webp',
    ]);
  });

  it('keeps every previously approved 3–4 month mapping unchanged', () => {
    expect(
      THREE_TO_FOUR_MONTH_ACTIVITY_SLUGS.map((slug) => activityIllustration(slug)),
    ).toEqual([
      '/activities/3_4m/act_sound_tracking.4cc5e73a1c.webp',
      '/activities/3_4m/act_copy_my_sound.0f2257dcb6.webp',
      '/activities/3_4m/act_reach_for_the_toy.70d1608428.webp',
      '/activities/3_4m/act_peek_a_boo_cloth.e45d080f3e.webp',
      '/activities/3_4m/act_picture_book_naming.4df4715aae.webp',
      '/activities/3_4m/act_rhythm_and_rock.547948f6a7.webp',
      '/activities/3_4m/act_texture_basket_infant.e670cf7869.webp',
    ]);
  });

  it('keeps every previously approved 5–6 month mapping unchanged', () => {
    expect(
      FIVE_TO_SIX_MONTH_ACTIVITY_SLUGS.map((slug) => activityIllustration(slug)),
    ).toEqual([
      '/activities/5_6m/act_babble_back_and_forth.f5cb049412.webp',
      '/activities/5_6m/act_roll_and_reach.ee83a6db44.webp',
      '/activities/5_6m/act_mirror_hello.8b5bc4a6ec.webp',
      '/activities/5_6m/act_board_book_point.1f396ad081.webp',
      '/activities/5_6m/act_clap_and_sing_5_6m.d81f12554d.webp',
      '/activities/5_6m/act_safe_touch_basket.c953264aef.webp',
    ]);
  });

  it('maps every published 7–9 month slug to its approved unique asset', () => {
    expect(
      SEVEN_TO_NINE_MONTH_ACTIVITY_SLUGS.map((slug) => activityIllustration(slug)),
    ).toEqual([
      '/activities/7_9m/act_drum_and_pause.86c0ba193b.webp',
      '/activities/7_9m/act_lift_the_flap_book.6c33f2de2d.webp',
      '/activities/7_9m/act_name_and_wait.9e9a12625f.webp',
      '/activities/7_9m/act_peekaboo.03b58f4431.webp',
      '/activities/7_9m/act_sit_and_reach_ring.305571520c.webp',
      '/activities/7_9m/act_two_texture_spoons.f811d80c0a.webp',
      '/activities/7_9m/act_wave_bye_bye.af8bd5d742.webp',
    ]);
  });

  it('maps every published 3-year slug to its approved unique asset', () => {
    expect(THREE_YEAR_ACTIVITY_SLUGS.map((slug) => activityIllustration(slug))).toEqual([
      '/activities/3y/act_color_sort.baca30dca4.webp',
    ]);
  });

  it('resolves every exact mapping to an optimized existing file', () => {
    Object.values(ACTIVITY_ILLUSTRATIONS).forEach((assetPath) => {
      const filePath = resolve(process.cwd(), 'public', assetPath.slice(1));
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeLessThan(500 * 1024);
    });
  });

  it('never resolves an age group, domain, category, or unknown fallback', () => {
    expect(activityIllustration('birth_2m')).toBeUndefined();
    expect(activityIllustration('3_4m')).toBeUndefined();
    expect(activityIllustration('5_6m')).toBeUndefined();
    expect(activityIllustration('7_9m')).toBeUndefined();
    expect(activityIllustration('3y')).toBeUndefined();
    expect(activityIllustration('fine_motor')).toBeUndefined();
    expect(activityIllustration('play')).toBeUndefined();
    expect(activityIllustration('unknown')).toBeUndefined();
  });

  it('renders exact activity assets while preserving fallback for other activities', () => {
    const detailSource = readFileSync(
      resolve(process.cwd(), 'src/screens/ContentDetail.tsx'),
      'utf8',
    );

    expect(detailSource).toContain('activityIllustration(item.slug)');
    expect(detailSource).toContain('data-testid="activity-illustration"');
    expect(detailSource).toContain('!mappedActivityIllustration');
    expect(detailSource).toContain('<ActivityScene domainKey={item.domainKey}');
  });
});
