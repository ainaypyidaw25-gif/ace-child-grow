import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';
import { LESSON_ILLUSTRATIONS, lessonIllustration } from '../lessonIllustrations';

const LANGUAGE_DEVELOPMENT_SLUGS = ['lsn_language_rich_home'] as const;
const PROBLEM_SOLVING_SLUGS = ['lsn_problem_solving_parenting'] as const;
const SCREEN_TIME_SLUGS = ['lsn_screen_time'] as const;
const SLEEP_SLUGS = ['lsn_healthy_sleep'] as const;
const AI_DETAIL_IMAGE_SLUGS = [
  'lsn_big_feelings',
  'lsn_early_math',
  'lsn_making_friends',
  'lsn_power_of_play',
  'lsn_reading_together',
  'lsn_talk_more',
  'lsn_what_is_development',
] as const;
const BLOCKED_SUCCESSOR_MEDIA_SLUGS = ['lsn_prepare_preschool', 'lsn_creativity'] as const;

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
      const filePath = resolve(process.cwd(), 'public', assetPath.slice(1));
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeLessThan(500 * 1024);

      const digest = createHash('sha256')
        .update(readFileSync(filePath))
        .digest('hex')
        .slice(0, 10);
      expect(basename(filePath)).toContain(`.${digest}.webp`);
    });
  });

  it('keeps every new AI-lane asset at a responsive 4:3 WebP size', async () => {
    for (const slug of AI_DETAIL_IMAGE_SLUGS) {
      const assetPath = lessonIllustration(slug)!;
      const metadata = await sharp(resolve(process.cwd(), 'public', assetPath.slice(1))).metadata();
      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBe(1200);
      expect(metadata.height).toBe(900);
    }
  });

  it('maps each new AI-lane lesson hero by exact slug without a fallback', () => {
    const paths = AI_DETAIL_IMAGE_SLUGS.map((slug) => lessonIllustration(slug));
    expect(new Set(paths).size).toBe(AI_DETAIL_IMAGE_SLUGS.length);
    AI_DETAIL_IMAGE_SLUGS.forEach((slug) => {
      expect(lessonIllustration(slug)).toMatch(
        new RegExp(`^/lessons/${slug}/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
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

describe('successor lesson illustration fail-closed policy', () => {
  it('hides static images that were not reviewed against the exact successor copy', () => {
    BLOCKED_SUCCESSOR_MEDIA_SLUGS.forEach((slug) => {
      expect(lessonIllustration(slug)).toBeUndefined();
    });
    expect(lessonIllustration('preparing_for_preschool')).toBeUndefined();
    expect(lessonIllustration('creativity')).toBeUndefined();
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
    ].map((slug) => lessonIllustration(slug));

    expect(assetPath).toBeDefined();
    expect(otherPaths).not.toContain(assetPath);
    expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    expect(lessonIllustration('problem_solving')).toBeUndefined();
  });
});

describe('published screen-time lesson illustrations', () => {
  it('maps every targeted production slug to its own versioned WebP', () => {
    const paths = SCREEN_TIME_SLUGS.map((slug) => lessonIllustration(slug));

    expect(new Set(paths).size).toBe(SCREEN_TIME_SLUGS.length);
    SCREEN_TIME_SLUGS.forEach((slug) => {
      expect(lessonIllustration(slug)).toMatch(
        new RegExp(`/lessons/screen_time/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('uses a unique file that exists and never falls back by category', () => {
    const assetPath = lessonIllustration(SCREEN_TIME_SLUGS[0]);
    const otherPaths = [
      ...LANGUAGE_DEVELOPMENT_SLUGS,
      ...PROBLEM_SOLVING_SLUGS,
    ].map((slug) => lessonIllustration(slug));

    expect(assetPath).toBeDefined();
    expect(otherPaths).not.toContain(assetPath);
    expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    expect(lessonIllustration('screen_time')).toBeUndefined();
  });
});

describe('published sleep lesson illustrations', () => {
  it('maps every targeted production slug to its own versioned WebP', () => {
    const paths = SLEEP_SLUGS.map((slug) => lessonIllustration(slug));

    expect(new Set(paths).size).toBe(SLEEP_SLUGS.length);
    SLEEP_SLUGS.forEach((slug) => {
      expect(lessonIllustration(slug)).toMatch(
        new RegExp(`/lessons/sleep/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('uses a unique file that exists and never falls back by category', () => {
    const assetPath = lessonIllustration(SLEEP_SLUGS[0]);
    const otherPaths = [
      ...LANGUAGE_DEVELOPMENT_SLUGS,
      ...PROBLEM_SOLVING_SLUGS,
      ...SCREEN_TIME_SLUGS,
    ].map((slug) => lessonIllustration(slug));

    expect(assetPath).toBeDefined();
    expect(otherPaths).not.toContain(assetPath);
    expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    expect(lessonIllustration('sleep')).toBeUndefined();
  });
});
