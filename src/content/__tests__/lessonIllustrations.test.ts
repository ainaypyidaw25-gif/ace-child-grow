import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LESSON_ILLUSTRATIONS, lessonIllustration } from '../lessonIllustrations';

const LANGUAGE_DEVELOPMENT_SLUGS = ['lsn_language_rich_home'] as const;

describe('published language-development lesson illustrations', () => {
  it('maps every targeted production slug to its own versioned WebP', () => {
    const paths = LANGUAGE_DEVELOPMENT_SLUGS.map((slug) => lessonIllustration(slug));

    expect(new Set(paths).size).toBe(LANGUAGE_DEVELOPMENT_SLUGS.length);
    LANGUAGE_DEVELOPMENT_SLUGS.forEach((slug) => {
      expect(lessonIllustration(slug)).toMatch(
        new RegExp(`/lessons/language_development/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('resolves every mapped asset to an existing file under public', () => {
    Object.values(LESSON_ILLUSTRATIONS).forEach((assetPath) => {
      expect(existsSync(resolve(process.cwd(), 'public', assetPath.slice(1)))).toBe(true);
    });
  });

  it('does not provide a category or unknown-slug fallback', () => {
    expect(lessonIllustration('language_development')).toBeUndefined();
    expect(lessonIllustration('unknown')).toBeUndefined();
  });

  it('renders the exact-slug mapping on lesson detail pages', () => {
    const detailSource = readFileSync(
      resolve(process.cwd(), 'src/screens/ContentDetail.tsx'),
      'utf8',
    );

    expect(detailSource).toContain("lessonIllustration(item.slug)");
    expect(detailSource).toContain('data-testid="lesson-illustration"');
    expect(detailSource).toContain('className="aspect-[4/3]');
  });
});
