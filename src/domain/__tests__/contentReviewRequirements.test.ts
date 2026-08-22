import { describe, expect, it } from 'vitest';
import {
  EDUCATION_REVIEW_DIMENSIONS,
  FOCUSED_SPECIALIST_REVIEW_SLUGS,
  requiredPublicationReviews,
  requiresSpecialistReview,
  specialistReviewReason,
} from '../../../convex/lib/contentReviewRequirements';

describe('risk-scoped content review requirements', () => {
  it('always requires an explicit child-development decision before publication', () => {
    expect(EDUCATION_REVIEW_DIMENSIONS).toContain('child_development');
  });

  it('does not require clinical approval for ordinary parent education', () => {
    expect(requiredPublicationReviews({ slug: 'act_story_sequence', data: { safety: { en: 'None specific.' } } }))
      .toEqual(EDUCATION_REVIEW_DIMENSIONS);
  });

  it('routes the exact seven emergency-wording records to specialist review', () => {
    expect(FOCUSED_SPECIALIST_REVIEW_SLUGS).toHaveLength(7);
    for (const slug of FOCUSED_SPECIALIST_REVIEW_SLUGS) {
      expect(specialistReviewReason({ slug })).toBe('focused_emergency_wording');
      expect(requiredPublicationReviews({ slug })).toEqual([...EDUCATION_REVIEW_DIMENSIONS, 'clinical']);
    }
  });

  it('detects newly-authored diagnosis, treatment, medication, dosage, individualized, and emergency decisions', () => {
    for (const wording of [
      'Diagnose the condition from these signs.',
      'This treatment should be started at home.',
      'Give the child this medication.',
      'Give this dosage.',
      'Personalized treatment is provided here.',
      'Seek emergency medical care immediately.',
      'Call your local emergency number.',
    ]) {
      expect(requiresSpecialistReview({ slug: 'future-item', summaryEn: wording }), wording).toBe(true);
    }
  });

  it('does not turn non-diagnostic disclaimers or preview-only printable metadata into clinical triggers', () => {
    for (const data of [
      { note: 'This content does not diagnose. This is not a diagnosis. It is general parent education.' },
      { evidenceSummary: 'This is a non-diagnostic observation tool.' },
      { note: 'This checklist is not a diagnostic tool.' },
      { note: 'This guide is not intended to diagnose or treat and does not provide a diagnosis or treatment.' },
    ]) {
      expect(requiresSpecialistReview({ slug: 'ordinary-printable', data }), JSON.stringify(data)).toBe(false);
    }
    expect(requiresSpecialistReview({
      type: 'printable',
      slug: 'preview-only-checklist',
      summaryEn: 'Catalogue preview: the future PDF will cover medicine safety and emergency signs.',
      data: { availability: 'preview_only' },
    })).toBe(false);
    expect(requiresSpecialistReview({
      type: 'printable',
      slug: 'explicitly-risk-scoped-preview',
      data: { availability: 'preview_only' },
      requiredReviewDimensions: ['clinical'],
    })).toBe(true);
  });
});
