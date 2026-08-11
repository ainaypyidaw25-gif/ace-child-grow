import { describe, expect, it } from 'vitest';
import { publishedSlugsWithoutApprovedEvidence } from '../../../convex/evidence';

describe('published evidence readiness', () => {
  const sources = [
    { sourceId: 'approved-a', reviewStatus: 'approved' },
    { sourceId: 'awaiting-b', reviewStatus: 'awaiting_review' },
    { sourceId: 'retired-c', reviewStatus: 'retired' },
  ];

  it('reports a linked published slug when none of its sources are parent-visible', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['linked-awaiting'],
      [{ slug: 'linked-awaiting', sourceIds: ['awaiting-b', 'retired-c'] }],
      sources,
    )).toEqual(['linked-awaiting']);
  });

  it('accepts a published slug when at least one linked source is approved', () => {
    expect(publishedSlugsWithoutApprovedEvidence(
      ['mixed-sources'],
      [{ slug: 'mixed-sources', sourceIds: ['awaiting-b', 'approved-a'] }],
      sources,
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
    )).toEqual(['m-awaiting', 'z-missing']);
  });
});
