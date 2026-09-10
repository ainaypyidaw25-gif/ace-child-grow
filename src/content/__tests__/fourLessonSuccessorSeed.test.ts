import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import generatedSeed from '../../../convex/seedData.json';
import { CONTENT_SEED } from '../seed';
import { sourcesForContent } from '../../evidence/links';

const expected = {
  lsn_talk_more: {
    hash: '4017e4a25d907e3576699933c859b95f9c56e7571395d2bd8b2d6d1288e39e51',
    sources: ['cdc-milestones-2026', 'jr-weisleder-2013'],
  },
  lsn_making_friends: {
    hash: '633ac88e574d16bb488312f03c891e8154f6064b77acac90ceba5eb16a78c20c',
    sources: ['aap-power-of-play-2018', 'cdc-positive-parenting-preschoolers-2026'],
  },
  lsn_creativity: {
    hash: '6019626c1edda1a31f8457fa45181df601b0385ceea04269c0731803046e044f',
    sources: ['aap-power-of-play-2018', 'cdc-positive-parenting-preschoolers-2026'],
  },
  lsn_prepare_preschool: {
    hash: 'cb2324f5c24b488b1f9f6570c7c37f7f837ac51d0930e6dc86cbb668c625ff7f',
    sources: ['cdc-milestones-2026', 'cdc-positive-parenting-preschoolers-2026'],
  },
} as const;

function frozenCopy(row: (typeof CONTENT_SEED)[number]) {
  return {
    titleMm: row.titleMm,
    titleEn: row.titleEn,
    summaryMm: row.summaryMm,
    summaryEn: row.summaryEn,
    data: row.data,
  };
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

describe('four source-corrected lesson successors', () => {
  it('pins each exact bilingual copy and exact evidence list', () => {
    for (const [slug, target] of Object.entries(expected)) {
      const row = CONTENT_SEED.find((item) => item.slug === slug);
      expect(row, slug).toBeDefined();
      expect(hash(frozenCopy(row!)), slug).toBe(target.hash);
      expect(sourcesForContent(slug, 'lesson'), slug).toEqual(target.sources);
      const body = row!.data.body as { mm: string; en: string };
      expect(body.en, slug).toMatch(/^AI review notice —/);
      expect(body.mm, slug).toMatch(/^AI စစ်ဆေးမှု အသိပေးချက် —/);
    }
  });

  it('keeps generated CLI seed rows byte-semantic with their canonical source rows', () => {
    for (const slug of Object.keys(expected)) {
      const canonical = CONTENT_SEED.find((item) => item.slug === slug);
      const generated = generatedSeed.find((item) => item.slug === slug);
      expect(generated, slug).toEqual(canonical);
    }
  });

  it('does not restore the removed stale or unsupported attributions', () => {
    expect(sourcesForContent('lsn_talk_more', 'lesson')).not.toContain('nhs-learn-to-talk-2023');
    for (const slug of ['lsn_making_friends', 'lsn_prepare_preschool']) {
      expect(sourcesForContent(slug, 'lesson')).not.toContain('us-hhs-head-start-elof-2015');
    }
    expect(sourcesForContent('lsn_prepare_preschool', 'lesson')).not.toContain('tb-handbook-ecse-2016');
  });
});
