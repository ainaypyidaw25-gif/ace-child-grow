import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';
import {
  MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
  MANUAL_REVIEW_CONTENT_TARGETS,
  isManualReviewContentCasTargetSlug,
} from '../../../convex/lib/manualReviewContentCasData';

describe('manual-review content CAS data', () => {
  it('freezes the exact eight owner-accepted targets and one revision step', () => {
    expect(MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID)
      .toBe('2026-08-22-manual-review-content-corrections-v1');
    expect(MANUAL_REVIEW_CONTENT_TARGETS.map((target) => target.slug)).toEqual([
      'gd_10_12m_sleep',
      'gd_13_18m_nutrition',
      'gd_19_24m_nutrition',
      'gd_2_5y_nutrition',
      'gd_2y_nutrition',
      'gd_3_5y_nutrition',
      'gd_3y_nutrition',
      'lsn_healthy_sleep',
    ]);
    for (const target of MANUAL_REVIEW_CONTENT_TARGETS) {
      expect(target.desiredReviewRevision).toBe(target.initialReviewRevision + 1);
      expect(target.initialCanonicalSha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('copies only the accepted fields from the deterministic authored seed', () => {
    for (const target of MANUAL_REVIEW_CONTENT_TARGETS) {
      const seed = seedData.find((row) => row.slug === target.slug);
      expect(seed).toBeDefined();
      const data = seed?.data as Record<string, unknown>;
      for (const patch of target.patches) {
        expect(data[patch.field], `${target.slug}:${patch.field}`).toEqual(patch.value);
      }
    }

    expect(MANUAL_REVIEW_CONTENT_TARGETS.map((target) => ({
      slug: target.slug,
      fields: target.patches.map((patch) => patch.field),
    }))).toEqual([
      { slug: 'gd_10_12m_sleep', fields: ['commonMistakes', 'safety'] },
      { slug: 'gd_13_18m_nutrition', fields: ['safety'] },
      { slug: 'gd_19_24m_nutrition', fields: ['safety'] },
      { slug: 'gd_2_5y_nutrition', fields: ['safety'] },
      { slug: 'gd_2y_nutrition', fields: ['safety'] },
      { slug: 'gd_3_5y_nutrition', fields: ['safety'] },
      { slug: 'gd_3y_nutrition', fields: ['safety'] },
      { slug: 'lsn_healthy_sleep', fields: ['body'] },
    ]);
  });

  it('guards only the exact eight slugs from broad seed imports', () => {
    for (const target of MANUAL_REVIEW_CONTENT_TARGETS) {
      expect(isManualReviewContentCasTargetSlug(target.slug)).toBe(true);
    }
    expect(isManualReviewContentCasTargetSlug('gd_birth_2m_sleep')).toBe(false);
    expect(isManualReviewContentCasTargetSlug('not-a-target')).toBe(false);
  });
});
