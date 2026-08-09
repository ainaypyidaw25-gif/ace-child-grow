import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  PRINTABLE_ILLUSTRATIONS,
  printableIllustration,
} from '../printableIllustrations';

const PUBLISHED_PRINTABLE_SLUGS = [
  'prt_behavior_chart',
  'prt_checklist_10_12m',
  'prt_checklist_3_4m',
  'prt_checklist_5_6m',
  'prt_checklist_7_9m',
  'prt_communication_cards',
  'prt_doctor_visit_checklist',
  'prt_emotion_cards',
  'prt_flash_cards',
  'prt_growth_log',
  'prt_milestone_checklist',
  'prt_reward_chart',
  'prt_routine_chart',
  'prt_sleep_diary',
  'prt_visual_schedule',
] as const;

describe('published printable illustrations', () => {
  it('maps every published Production slug directly to one unique versioned WebP', () => {
    expect(Object.keys(PRINTABLE_ILLUSTRATIONS).sort()).toEqual(
      [...PUBLISHED_PRINTABLE_SLUGS].sort(),
    );

    const paths = PUBLISHED_PRINTABLE_SLUGS.map((slug) => printableIllustration(slug));
    expect(new Set(paths).size).toBe(PUBLISHED_PRINTABLE_SLUGS.length);

    PUBLISHED_PRINTABLE_SLUGS.forEach((slug) => {
      expect(printableIllustration(slug)).toMatch(
        new RegExp(`^/printables/${slug}\\.[a-f0-9]{10}\\.webp$`),
      );
    });
  });

  it('has no category, domain, or unknown-slug fallback', () => {
    expect(printableIllustration('checklist_5_6m')).toBeUndefined();
    expect(printableIllustration('printable')).toBeUndefined();
    expect(printableIllustration('unknown')).toBeUndefined();
  });

  it('resolves every mapping to the content-hashed file under public', () => {
    for (const assetPath of Object.values(PRINTABLE_ILLUSTRATIONS)) {
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
    for (const assetPath of Object.values(PRINTABLE_ILLUSTRATIONS)) {
      const metadata = await sharp(resolve(process.cwd(), 'public', assetPath.slice(1))).metadata();
      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBe(1200);
      expect(metadata.height).toBe(900);
    }
  });

  it('renders the exact-slug mapping on printable detail pages', () => {
    const detailSource = readFileSync(
      resolve(process.cwd(), 'src/screens/ContentDetail.tsx'),
      'utf8',
    );

    expect(detailSource).toContain('printableIllustration(item.slug)');
    expect(detailSource).toContain('data-testid="printable-illustration"');
    expect(detailSource).toContain('className="aspect-[4/3]');
  });
});
