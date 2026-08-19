import { describe, expect, it } from 'vitest';
import { unprotectedCitationGapKeys } from '../../../convex/lib/evidenceImportSafety';

const current = {
  sourceId: 'current',
  reviewStatus: 'approved',
  evidenceLevel: 'guideline',
  year: 2024,
  reviewDate: '2026-01-01',
  nextReviewDate: '2027-01-01',
  verifiedOn: '2026-01-01',
};

describe('evidence source import safety', () => {
  it('blocks a live non-library rule when its last eligible citation is reset', () => {
    expect(unprotectedCitationGapKeys(
      [{
        kind: 'safety_rule',
        slug: 'emergency_message',
        sourceIds: ['reset', 'pending'],
      }],
      [
        { ...current, sourceId: 'reset', reviewStatus: 'awaiting_review' },
        { ...current, sourceId: 'pending', reviewStatus: 'awaiting_review' },
      ],
      new Set(),
      '2026-08-18',
    )).toEqual(['safety_rule:emergency_message']);
  });

  it('allows the reset after one replacement citation is professionally approved', () => {
    expect(unprotectedCitationGapKeys(
      [{
        kind: 'safety_rule',
        slug: 'emergency_message',
        sourceIds: ['reset', 'replacement'],
      }],
      [
        { ...current, sourceId: 'reset', reviewStatus: 'awaiting_review' },
        { ...current, sourceId: 'replacement' },
      ],
      new Set(),
      '2026-08-18',
    )).toEqual([]);
  });

  it('leaves clinical-review library rows to the existing fail-closed content gate', () => {
    expect(unprotectedCitationGapKeys(
      [{
        kind: 'guide',
        slug: 'gd_birth_2m_safety',
        sourceIds: ['reset'],
      }],
      [{ ...current, sourceId: 'reset', reviewStatus: 'awaiting_review' }],
      new Set(['gd_birth_2m_safety']),
      '2026-08-18',
    )).toEqual([]);
  });

  it('treats expired approvals as ineligible replacements', () => {
    expect(unprotectedCitationGapKeys(
      [{
        kind: 'hope_topic',
        slug: 'example',
        sourceIds: ['expired'],
      }],
      [{ ...current, sourceId: 'expired', nextReviewDate: '2026-08-17' }],
      new Set(),
      '2026-08-18',
    )).toEqual(['hope_topic:example']);
  });
});
