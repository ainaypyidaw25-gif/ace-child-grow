import { describe, expect, it } from 'vitest';
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsCurrent,
  type PublicationEvidenceSource,
} from '../../../convex/lib/evidencePublicationGate';

const today = '2026-08-18';

function source(
  sourceId: string,
  overrides: Partial<PublicationEvidenceSource> = {},
): PublicationEvidenceSource {
  return {
    sourceId,
    reviewStatus: 'approved',
    evidenceLevel: 'guideline',
    year: 2025,
    reviewDate: '2026-08-01',
    nextReviewDate: '2028-08-01',
    verifiedOn: '2026-08-01',
    ...overrides,
  };
}

describe('publication evidence gate', () => {
  it('accepts a complete link with at least one current human-approved source', () => {
    const result = evaluatePublicationEvidence(
      ['approved', 'awaiting'],
      [source('approved'), source('awaiting', { reviewStatus: 'awaiting_review' })],
      today,
    );
    expect(result.allowed).toBe(true);
    expect(result.currentApprovedSourceIds).toEqual(['approved']);
  });

  it('does not treat awaiting or evidence-required records as approval', () => {
    const result = evaluatePublicationEvidence(
      ['awaiting', 'required'],
      [
        source('awaiting', { reviewStatus: 'awaiting_review' }),
        source('required', { reviewStatus: 'evidence_required' }),
      ],
      today,
    );
    expect(result.allowed).toBe(false);
    expect(result.currentApprovedSourceIds).toEqual([]);
  });

  it('rejects dangling and retired links even when another source is approved', () => {
    expect(evaluatePublicationEvidence(
      ['approved', 'missing'],
      [source('approved')],
      today,
    )).toMatchObject({ allowed: false, unknownSourceIds: ['missing'] });

    expect(evaluatePublicationEvidence(
      ['approved', 'retired'],
      [source('approved'), source('retired', { reviewStatus: 'retired' })],
      today,
    )).toMatchObject({ allowed: false, retiredSourceIds: ['retired'] });
  });

  it('does not count expired or outdated approvals as current evidence', () => {
    const expired = source('expired', { nextReviewDate: '2026-08-17' });
    const outdated = source('outdated', { year: 2017, nextReviewDate: '2027-01-01' });
    expect(publicationEvidenceIsCurrent(expired, today)).toBe(false);
    expect(publicationEvidenceIsCurrent(outdated, today)).toBe(false);
    expect(evaluatePublicationEvidence(
      ['expired', 'outdated'],
      [expired, outdated],
      today,
    )).toMatchObject({
      allowed: false,
      staleApprovedSourceIds: ['expired', 'outdated'],
    });
  });

  it('rejects malformed or future verification and review dates', () => {
    for (const invalid of [
      source('bad-review', { reviewDate: 'not-a-date', nextReviewDate: null }),
      source('bad-next', { nextReviewDate: '2026-02-30' }),
      source('future-review', { reviewDate: '2026-08-19' }),
      source('future-verification', { verifiedOn: '2026-08-19' }),
    ]) {
      expect(publicationEvidenceIsCurrent(invalid, today)).toBe(false);
    }
  });

  it('rejects a mixed link when any approved citation is stale', () => {
    const current = source('current');
    const stale = source('stale', { nextReviewDate: '2026-08-17' });
    expect(evaluatePublicationEvidence(
      ['current', 'stale'],
      [current, stale],
      today,
    )).toMatchObject({
      allowed: false,
      currentApprovedSourceIds: ['current'],
      staleApprovedSourceIds: ['stale'],
    });
  });

  it('derives a review due date when an explicit next-review date is absent', () => {
    expect(publicationEvidenceIsCurrent(source('derived', {
      nextReviewDate: null,
      reviewDate: '2026-01-01',
      evidenceLevel: 'guideline',
    }), today)).toBe(true);
    expect(publicationEvidenceIsCurrent(source('never-checked', {
      nextReviewDate: null,
      reviewDate: null,
      verifiedOn: null,
    }), today)).toBe(false);
  });
});
