import { describe, expect, it } from 'vitest';
import {
  evidenceLinkReadinessCounts,
  publishedSlugsWithoutApprovedEvidence,
} from '../../../convex/evidence';

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
