import { describe, expect, it } from 'vitest';
import {
  evidenceImportReviewFields,
  evidenceImportReviewPolicy,
} from '../../../convex/lib/evidenceImportPolicy';

const approved = {
  reviewStatus: 'approved',
  reviewer: 'Named reviewer',
  reviewerQualification: 'MBBS',
  reviewDate: '2026-08-01',
  nextReviewDate: '2027-08-01',
  reviewNote: 'Checked the full source',
  reviewerId: 'user-1',
  reviewScope: 'clinical' as const,
};

describe('evidence import review policy', () => {
  it('preserves a human decision only for an identical, structurally usable record', () => {
    expect(evidenceImportReviewPolicy('approved', 'awaiting_review', false, false)).toEqual({
      resetReview: false,
      reviewStatus: 'approved',
    });
  });

  it('invalidates approval when publisher metadata or its due date changes', () => {
    expect(evidenceImportReviewPolicy('approved', 'awaiting_review', true, false)).toEqual({
      resetReview: true,
      reviewStatus: 'awaiting_review',
    });
    expect(evidenceImportReviewPolicy('approved', 'awaiting_review', false, true)).toEqual({
      resetReview: true,
      reviewStatus: 'awaiting_review',
    });
  });

  it('forces an undated or otherwise incomplete registry record to evidence_required', () => {
    expect(evidenceImportReviewPolicy('approved', 'evidence_required', false, false)).toEqual({
      resetReview: true,
      reviewStatus: 'evidence_required',
    });
  });

  it('keeps retired rows retired as audit history', () => {
    expect(evidenceImportReviewPolicy('retired', 'awaiting_review', true, true)).toEqual({
      resetReview: false,
      reviewStatus: 'retired',
    });
  });

  it('preserves every human review field on an identical import', () => {
    expect(evidenceImportReviewFields(approved, 'awaiting_review', false, null)).toEqual(approved);
  });

  it('clears every human review field when metadata changes', () => {
    expect(evidenceImportReviewFields(approved, 'awaiting_review', true, null)).toEqual({
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewerQualification: undefined,
      reviewDate: null,
      nextReviewDate: null,
      reviewNote: undefined,
      reviewerId: undefined,
      reviewScope: undefined,
    });
  });

  it('demotes a same-metadata approved row when the registry is structurally incomplete', () => {
    expect(evidenceImportReviewFields(approved, 'evidence_required', false, null)).toMatchObject({
      reviewStatus: 'evidence_required',
      reviewer: null,
      reviewDate: null,
    });
  });

  it('treats a changed publisher due date as metadata that needs a new review', () => {
    expect(
      evidenceImportReviewFields(approved, 'awaiting_review', false, '2026-02-17'),
    ).toMatchObject({
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewDate: null,
      nextReviewDate: '2026-02-17',
    });
  });
});
