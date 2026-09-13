import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  STORY_ILLUSTRATIONS,
  storyIllustration,
} from '../storyIllustrations';

const PUBLISHED_STORY_SLUGS = [
  'st_first_day_school',
  'st_little_seed',
  'st_when_i_feel_angry',
] as const;

describe('published story illustrations', () => {
  it('maps every published Production slug directly to one unique versioned WebP', () => {
    expect(Object.keys(STORY_ILLUSTRATIONS).sort()).toEqual(
      [...PUBLISHED_STORY_SLUGS].sort(),
    );

    const paths = PUBLISHED_STORY_SLUGS.map((slug) => storyIllustration(slug));
    expect(new Set(paths).size).toBe(PUBLISHED_STORY_SLUGS.length);

    PUBLISHED_STORY_SLUGS.forEach((slug) => {
      expect(storyIllustration(slug)).toMatch(
        new RegExp(`^/stories/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('has no category, age-group, type, or unknown-slug fallback', () => {
    expect(storyIllustration('school')).toBeUndefined();
    expect(storyIllustration('4y')).toBeUndefined();
    expect(storyIllustration('story')).toBeUndefined();
    expect(storyIllustration('unknown')).toBeUndefined();
  });

  it('resolves every mapping to the content-hashed file under public', () => {
    for (const assetPath of Object.values(STORY_ILLUSTRATIONS)) {
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
    for (const assetPath of Object.values(STORY_ILLUSTRATIONS)) {
      const metadata = await sharp(resolve(process.cwd(), 'public', assetPath.slice(1))).metadata();
      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBe(1200);
      expect(metadata.height).toBe(900);
    }
  });

  it('renders the exact-slug mapping on story detail pages', () => {
    const detailSource = readFileSync(
      resolve(process.cwd(), 'src/screens/ContentDetail.tsx'),
      'utf8',
    );

    expect(detailSource).toContain('storyIllustration(item.slug)');
    expect(detailSource).toContain('data-testid="story-illustration"');
    expect(detailSource).toContain('className="aspect-[4/3]');
  });
});
