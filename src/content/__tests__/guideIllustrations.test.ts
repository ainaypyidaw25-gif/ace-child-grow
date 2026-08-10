import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  GUIDE_ILLUSTRATIONS,
  guideIllustration,
} from '../guideIllustrations';

const PRODUCTION_GUIDE_SLUGS = [
  'gd_birth_2m_cognitive',
  'gd_birth_2m_communication',
  'gd_birth_2m_daily_routine',
  'gd_birth_2m_emotional',
  'gd_birth_2m_fine_motor',
  'gd_birth_2m_gross_motor',
  'gd_birth_2m_nutrition',
  'gd_birth_2m_play',
  'gd_birth_2m_safety',
  'gd_birth_2m_sleep',
  'gd_birth_2m_social',
  'gd_3_4m_cognitive',
  'gd_3_4m_communication',
  'gd_3_4m_daily_routine',
  'gd_3_4m_emotional',
  'gd_3_4m_fine_motor',
  'gd_3_4m_gross_motor',
  'gd_3_4m_nutrition',
  'gd_3_4m_play',
  'gd_3_4m_safety',
  'gd_3_4m_sleep',
  'gd_3_4m_social',
  'gd_5_6m_cognitive',
  'gd_5_6m_communication',
  'gd_5_6m_daily_routine',
  'gd_5_6m_emotional',
  'gd_5_6m_fine_motor',
  'gd_5_6m_gross_motor',
  'gd_5_6m_language',
  'gd_5_6m_nutrition',
  'gd_5_6m_play',
  'gd_5_6m_safety',
  'gd_5_6m_sleep',
  'gd_5_6m_social',
  'gd_5_6m_speech',
  'gd_7_9m_cognitive',
  'gd_7_9m_communication',
  'gd_7_9m_daily_routine',
  'gd_7_9m_emotional',
  'gd_7_9m_fine_motor',
  'gd_7_9m_gross_motor',
  'gd_7_9m_language',
  'gd_7_9m_nutrition',
  'gd_7_9m_safety',
  'gd_7_9m_self_help',
  'gd_7_9m_sleep',
  'gd_7_9m_social',
  'gd_7_9m_speech',
  'gd_10_12m_cognitive',
  'gd_10_12m_communication',
  'gd_10_12m_daily_routine',
  'gd_10_12m_emotional',
  'gd_10_12m_fine_motor',
  'gd_10_12m_gross_motor',
  'gd_10_12m_language',
  'gd_10_12m_nutrition',
  'gd_10_12m_play',
  'gd_10_12m_safety',
  'gd_10_12m_self_help',
  'gd_10_12m_sleep',
  'gd_10_12m_social',
  'gd_10_12m_speech',
] as const;

const PRODUCTION_7_9M_GUIDE_SLUGS = PRODUCTION_GUIDE_SLUGS.filter(
  (slug) => slug.startsWith('gd_7_9m_'),
);

const PRODUCTION_10_12M_GUIDE_SLUGS = PRODUCTION_GUIDE_SLUGS.filter(
  (slug) => slug.startsWith('gd_10_12m_'),
);

describe('Production guide illustrations', () => {
  it('maps every owner-authorized Production slug directly to one unique versioned WebP', () => {
    expect(Object.keys(GUIDE_ILLUSTRATIONS).sort()).toEqual(
      [...PRODUCTION_GUIDE_SLUGS].sort(),
    );

    const paths = PRODUCTION_GUIDE_SLUGS.map((slug) => guideIllustration(slug));
    expect(new Set(paths).size).toBe(PRODUCTION_GUIDE_SLUGS.length);

    PRODUCTION_GUIDE_SLUGS.forEach((slug) => {
      expect(guideIllustration(slug)).toMatch(
        new RegExp(`^/guides/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('has no domain, age-group, type, or unknown-slug fallback', () => {
    expect(guideIllustration('social')).toBeUndefined();
    expect(guideIllustration('7_9m')).toBeUndefined();
    expect(guideIllustration('guide')).toBeUndefined();
    expect(guideIllustration('unknown')).toBeUndefined();
  });

  it('maps all 13 exact 7–9 month Production slugs without a shared asset', () => {
    expect(PRODUCTION_7_9M_GUIDE_SLUGS).toHaveLength(13);

    const paths = PRODUCTION_7_9M_GUIDE_SLUGS.map((slug) => guideIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/guides/gd_7_9m_'))).toBe(true);
    expect(new Set(paths).size).toBe(13);
  });

  it('maps all 14 exact 10–12 month Production slugs without a shared asset', () => {
    expect(PRODUCTION_10_12M_GUIDE_SLUGS).toHaveLength(14);

    const paths = PRODUCTION_10_12M_GUIDE_SLUGS.map((slug) => guideIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/guides/gd_10_12m_'))).toBe(true);
    expect(new Set(paths).size).toBe(14);
  });

  it('resolves every mapping to the content-hashed file under public', () => {
    for (const assetPath of Object.values(GUIDE_ILLUSTRATIONS)) {
      const filePath = resolve(process.cwd(), 'public', assetPath.slice(1));
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeLessThan(500 * 1024);

      const digest = createHash('sha256')
        .update(readFileSync(filePath))
        .digest('hex')
        .slice(0, 10);
      expect(basename(filePath)).toContain(`.${digest}.webp`);
    }
  });

  it('keeps every asset at a responsive 4:3 WebP size', async () => {
    for (const assetPath of Object.values(GUIDE_ILLUSTRATIONS)) {
      const metadata = await sharp(resolve(process.cwd(), 'public', assetPath.slice(1))).metadata();
      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBe(1200);
      expect(metadata.height).toBe(900);
    }
  });

  it('renders the exact-slug mapping on guide detail pages', () => {
    const detailSource = readFileSync(
      resolve(process.cwd(), 'src/screens/ContentDetail.tsx'),
      'utf8',
    );

    expect(detailSource).toContain('guideIllustration(item.slug)');
    expect(detailSource).toContain('data-testid="guide-illustration"');
    expect(detailSource).toContain('className="aspect-[4/3]');
  });
});
