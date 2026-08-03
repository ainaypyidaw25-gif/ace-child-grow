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

describe('published birth–2 month activity illustrations', () => {
  it('maps every targeted production slug to its own versioned WebP', () => {
    expect(Object.keys(ACTIVITY_ILLUSTRATIONS).sort()).toEqual(
      [...BIRTH_2M_ACTIVITY_SLUGS].sort(),
    );

    const paths = BIRTH_2M_ACTIVITY_SLUGS.map((slug) => activityIllustration(slug));
    expect(new Set(paths).size).toBe(BIRTH_2M_ACTIVITY_SLUGS.length);

    BIRTH_2M_ACTIVITY_SLUGS.forEach((slug) => {
      expect(activityIllustration(slug)).toMatch(
        new RegExp(`/activities/birth_2m/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
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
