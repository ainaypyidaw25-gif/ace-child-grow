import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LESSON_ILLUSTRATIONS, lessonIllustration } from '../lessonIllustrations';

const LANGUAGE_DEVELOPMENT_SLUGS = ['lsn_language_rich_home'] as const;
const PREPARING_FOR_PRESCHOOL_SLUGS = ['lsn_prepare_preschool'] as const;
const PROBLEM_SOLVING_SLUGS = ['lsn_problem_solving_parenting'] as const;

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

describe('published preparing-for-preschool lesson illustrations', () => {
  it('maps every targeted production slug to its own versioned WebP', () => {
    const paths = PREPARING_FOR_PRESCHOOL_SLUGS.map((slug) => lessonIllustration(slug));

    expect(new Set(paths).size).toBe(PREPARING_FOR_PRESCHOOL_SLUGS.length);
    PREPARING_FOR_PRESCHOOL_SLUGS.forEach((slug) => {
      expect(lessonIllustration(slug)).toMatch(
        new RegExp(`/lessons/preparing_for_preschool/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('uses a unique file that exists and never falls back by category', () => {
    const assetPath = lessonIllustration(PREPARING_FOR_PRESCHOOL_SLUGS[0]);
    const otherPaths = LANGUAGE_DEVELOPMENT_SLUGS.map((slug) => lessonIllustration(slug));

    expect(assetPath).toBeDefined();
    expect(otherPaths).not.toContain(assetPath);
    expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    expect(lessonIllustration('preparing_for_preschool')).toBeUndefined();
  });
});

describe('published problem-solving lesson illustrations', () => {
  it('maps every targeted production slug to its own versioned WebP', () => {
    const paths = PROBLEM_SOLVING_SLUGS.map((slug) => lessonIllustration(slug));

    expect(new Set(paths).size).toBe(PROBLEM_SOLVING_SLUGS.length);
    PROBLEM_SOLVING_SLUGS.forEach((slug) => {
      expect(lessonIllustration(slug)).toMatch(
        new RegExp(`/lessons/problem_solving/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('uses a unique file that exists and never falls back by category', () => {
    const assetPath = lessonIllustration(PROBLEM_SOLVING_SLUGS[0]);
    const otherPaths = [
      ...LANGUAGE_DEVELOPMENT_SLUGS,
      ...PREPARING_FOR_PRESCHOOL_SLUGS,
    ].map((slug) => lessonIllustration(slug));

    expect(assetPath).toBeDefined();
    expect(otherPaths).not.toContain(assetPath);
    expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    expect(lessonIllustration('problem_solving')).toBeUndefined();
  });
});
