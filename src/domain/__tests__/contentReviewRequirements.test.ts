import { describe, expect, it } from 'vitest';
import {
  EDUCATION_REVIEW_DIMENSIONS,
  FOCUSED_SPECIALIST_REVIEW_SLUGS,
  requiredPublicationReviews,
  requiresSpecialistReview,
} from '../../../convex/lib/contentReviewRequirements';

describe('risk-scoped content review requirements', () => {
  it('does not require clinical approval for ordinary parent education', () => {
    expect(requiredPublicationReviews({ slug: 'act_story_sequence', data: { safety: { en: 'None specific.' } } }))
      .toEqual(EDUCATION_REVIEW_DIMENSIONS);
  });

  it('routes the exact seven emergency-wording records to specialist review', () => {
    expect(FOCUSED_SPECIALIST_REVIEW_SLUGS).toHaveLength(7);
    for (const slug of FOCUSED_SPECIALIST_REVIEW_SLUGS) {
      expect(requiredPublicationReviews({ slug })).toEqual([...EDUCATION_REVIEW_DIMENSIONS, 'clinical']);
    }
  });

  it('detects newly-authored diagnosis, treatment, dosage, individualized, and emergency decisions', () => {
    for (const wording of [
      'Diagnose the condition from these signs.',
      'Treat the child at home.',
      'Give this dosage.',
      'Individualized treatment is provided here.',
      'Seek medical help immediately.',
    ]) {
      expect(requiresSpecialistReview({ slug: 'future-item', summaryEn: wording }), wording).toBe(true);
    }
  });

  it('does not turn non-diagnostic disclaimers into clinical triggers', () => {
    expect(requiresSpecialistReview({
      slug: 'ordinary-guide',
      data: { note: 'This content does not diagnose. This is not a diagnosis. It is general parent education.' },
    })).toBe(false);
  });
});
