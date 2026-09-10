import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import generatedSeed from '../../../convex/seedData.json';
import {
  SIX_PICTURE_STORY_SUCCESSOR_SOURCE_IDS,
  SIX_PICTURE_STORY_SUCCESSOR_TARGETS,
} from '../../../convex/lib/sixPictureStorySuccessorScope';
import { CONTENT_SEED } from '../seed';
import { activityIllustration } from '../activityIllustrations';
import { sourcesForContent } from '../../evidence/links';

const expectedHashes = {
  act_picture_story_2_5y: '19945dbc54348ce0db792279da97a0aaa46a6d02b4c6c1f136b4f99610dea97f',
  act_picture_story_3y: '52ee5c636e565f573e81321d1d16b31e6305983b04fa7ffb605264ccc5e432bd',
  act_picture_story_3_5y: '032e702f1181c8c27a86eefdbef58064576c6b2a78fd23888c4d478b1968a36f',
  act_picture_story_4y: '2edcc87d6c1a3ef0b3ebf0ea770c1708b09977706b95f3fa19a9f21d1b6b35b6',
  act_picture_story_4_5y: '203283865fea550004abd3fb26976a8f8dc70f48e19ac10f72d4e3ea637618c0',
  act_picture_story_5y: '662915ccae1a89a2c1bd7303601bf4224f9c0a3df26bfe7779a918e1187fc9cb',
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

describe('six source-corrected picture-story activity successors', () => {
  it('pins the exact target revisions, bilingual copy and two-source evidence list', () => {
    expect(SIX_PICTURE_STORY_SUCCESSOR_TARGETS).toEqual([
      { slug: 'act_picture_story_2_5y', currentRevision: 5, successorRevision: 6 },
      { slug: 'act_picture_story_3y', currentRevision: 5, successorRevision: 6 },
      { slug: 'act_picture_story_3_5y', currentRevision: 6, successorRevision: 7 },
      { slug: 'act_picture_story_4y', currentRevision: 5, successorRevision: 6 },
      { slug: 'act_picture_story_4_5y', currentRevision: 5, successorRevision: 6 },
      { slug: 'act_picture_story_5y', currentRevision: 5, successorRevision: 6 },
    ]);
    expect(SIX_PICTURE_STORY_SUCCESSOR_SOURCE_IDS).toEqual([
      'aap-power-of-play-2018',
      'cdc-milestones-2026',
    ]);

    for (const target of SIX_PICTURE_STORY_SUCCESSOR_TARGETS) {
      const row = CONTENT_SEED.find((item) => item.slug === target.slug);
      expect(row, target.slug).toBeDefined();
      expect(row!.type, target.slug).toBe('activity');
      expect(hash(frozenCopy(row!)), target.slug).toBe(expectedHashes[target.slug]);
      expect(sourcesForContent(target.slug, 'activity'), target.slug)
        .toEqual(SIX_PICTURE_STORY_SUCCESSOR_SOURCE_IDS);
    }
  });

  it('keeps generated CLI seed rows byte-semantic with their canonical source rows', () => {
    for (const target of SIX_PICTURE_STORY_SUCCESSOR_TARGETS) {
      const canonical = CONTENT_SEED.find((item) => item.slug === target.slug);
      const generated = generatedSeed.find((item) => item.slug === target.slug);
      expect(generated, target.slug).toEqual(canonical);
    }
  });

  it('keeps copy optional and non-assessment without duplicating the governed AI disclosure', () => {
    for (const target of SIX_PICTURE_STORY_SUCCESSOR_TARGETS) {
      const row = CONTENT_SEED.find((item) => item.slug === target.slug)!;
      const data = JSON.stringify(row.data);
      expect(row.data.evidenceSummary, target.slug).toBe(
        'Official play and milestone sources informed this optional picture-story activity. It is not a developmental test.',
      );
      expect(data, target.slug).toContain('not a developmental test');
      expect(data, target.slug).not.toContain('age-adapted');
      expect(data, target.slug).not.toContain('AI review notice');
      expect(data, target.slug).not.toContain('AI စစ်ဆေးမှု အသိပေးချက်');
      expect(row, target.slug).not.toHaveProperty('reviewerId');
      expect(row, target.slug).not.toHaveProperty('reviewerQualification');
    }
  });

  it('preserves exact hidden placeholder media and adds no target-specific asset claim', () => {
    for (const target of SIX_PICTURE_STORY_SUCCESSOR_TARGETS) {
      const row = CONTENT_SEED.find((item) => item.slug === target.slug)!;
      expect(row.media, target.slug).toEqual([
        { kind: 'illustration', placeholder: true, offline: true },
        { kind: 'video', placeholder: true },
      ]);
      expect(activityIllustration(target.slug), target.slug).toBeUndefined();
    }
  });

  it('cannot restore the removed 2012 WHO attribution through the canonical link builder', () => {
    for (const target of SIX_PICTURE_STORY_SUCCESSOR_TARGETS) {
      expect(sourcesForContent(target.slug, 'activity'), target.slug)
        .not.toContain('who-care-for-child-development-2012');
    }
  });
});
