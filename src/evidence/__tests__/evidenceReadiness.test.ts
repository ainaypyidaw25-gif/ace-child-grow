import { describe, expect, it } from 'vitest';
import {
  evidenceLinkReadinessCounts,
  publishedSlugsWithoutApprovedEvidence,
} from '../../../convex/evidence';

describe('published evidence readiness', () => {
  const today = '2026-08-18';
  const sources = [
    { sourceId: 'approved-a', reviewStatus: 'approved', evidenceLevel: 'guideline', year: 2025, reviewDate: '2026-08-01', nextReviewDate: '2028-08-01', verifiedOn: '2026-08-01' },
    { sourceId: 'awaiting-b', reviewStatus: 'awaiting_review', evidenceLevel: 'guideline', year: 2025, reviewDate: null, nextReviewDate: null, verifiedOn: '2026-08-01' },
    { sourceId: 'retired-c', reviewStatus: 'retired', evidenceLevel: 'guideline', year: 2025, reviewDate: '2026-08-01', nextReviewDate: '2028-08-01', verifiedOn: '2026-08-01' },
    { sourceId: 'stale-d', reviewStatus: 'approved', evidenceLevel: 'guideline', year: 2025, reviewDate: '2024-01-01', nextReviewDate: '2026-08-17', verifiedOn: '2024-01-01' },
    { sourceId: 'old-reviewed-e', reviewStatus: 'approved', evidenceLevel: 'guideline', year: 2017, reviewDate: '2026-08-01', nextReviewDate: '2028-08-01', verifiedOn: '2026-08-01' },
    { sourceId: 'required-f', reviewStatus: 'evidence_required', evidenceLevel: 'guideline', year: 2025, reviewDate: null, nextReviewDate: null, verifiedOn: '2026-08-01' },
  ];

  it('reports a linked published slug when none of its sources are parent-visible', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['linked-awaiting'],
      [{ slug: 'linked-awaiting', sourceIds: ['awaiting-b', 'retired-c'] }],
      sources,
      today,
    )).toEqual(['linked-awaiting']);
  });

  it('accepts a published slug when at least one linked source is approved', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['mixed-sources'],
      [{ slug: 'mixed-sources', sourceIds: ['awaiting-b', 'approved-a'] }],
      sources,
      today,
    )).toEqual([]);
  });

  it('also reports missing links and returns exact slugs deterministically', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['z-missing', 'a-approved', 'm-awaiting'],
      [
        { slug: 'a-approved', sourceIds: ['approved-a'] },
        { slug: 'm-awaiting', sourceIds: ['awaiting-b'] },
      ],
      sources,
      today,
    )).toEqual(['m-awaiting', 'z-missing']);
  });

  it('reports a slug with a stale approved citation even when another is current', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['mixed-current-stale'],
      [{ slug: 'mixed-current-stale', sourceIds: ['approved-a', 'stale-d'] }],
      sources,
      today,
    )).toEqual(['mixed-current-stale']);
  });

  it('does not withdraw a slug solely because a reviewed source is old', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['reviewed-old-source'],
      [{ slug: 'reviewed-old-source', sourceIds: ['old-reviewed-e'] }],
      sources,
      today,
    )).toEqual([]);
  });

  it('reports a mixed link that still contains evidence-required metadata', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['mixed-required'],
      [{ slug: 'mixed-required', sourceIds: ['approved-a', 'required-f'] }],
      sources,
      today,
    )).toEqual(['mixed-required']);
  });
});

describe('active evidence-link readiness', () => {
  it('retains archived citations as exact audit history without counting them as active', () => {
    expect(evidenceLinkReadinessCounts(
      [
        { kind: 'milestone', slug: 'active-milestone' },
        { kind: 'milestone', slug: 'archived-b' },
        { kind: 'milestone', slug: 'archived-a' },
        { kind: 'safety_rule', slug: 'no-library-row' },
      ],
      [
        { type: 'milestone', slug: 'active-milestone', clinicalStatus: 'published' },
        { type: 'milestone', slug: 'archived-a', clinicalStatus: 'archived' },
        { type: 'milestone', slug: 'archived-b', clinicalStatus: 'archived' },
      ],
    )).toEqual({
      activeLinks: 2,
      activeLinkedSlugs: 2,
      preservedArchivedLinks: [
        'milestone:archived-a',
        'milestone:archived-b',
      ],
    });
  });

  it('keeps unknown or unpublished non-archived links inside the fail-closed active count', () => {
    expect(evidenceLinkReadinessCounts(
      [
        { kind: 'milestone', slug: 'draft-row' },
        { kind: 'activity', slug: 'stale-or-unknown' },
      ],
      [{ type: 'milestone', slug: 'draft-row', clinicalStatus: 'clinical_review' }],
    )).toMatchObject({ activeLinks: 2, preservedArchivedLinks: [] });
  });
});
