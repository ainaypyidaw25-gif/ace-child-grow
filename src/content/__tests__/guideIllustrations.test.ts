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
  'gd_5_6m_social',
  'gd_7_9m_cognitive',
  'gd_7_9m_communication',
  'gd_7_9m_emotional',
  'gd_7_9m_safety',
  'gd_7_9m_self_help',
  'gd_7_9m_social',
] as const;

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
