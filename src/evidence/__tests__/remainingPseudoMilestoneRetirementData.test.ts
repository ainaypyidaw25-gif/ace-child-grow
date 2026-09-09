import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';
import {
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS as CENTRAL_RETIREMENT_SLUGS,
} from '../../../convex/lib/contentRetirements';
import linkPreimages from '../../../convex/lib/remainingPseudoMilestoneRetirementLinks.json';
import {
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS,
} from '../../../convex/lib/remainingPseudoMilestoneRetirementData';
import { EVIDENCE_LINKS } from '../links';

describe('remaining pseudo-milestone exact retirement artifacts', () => {
  it('freezes exactly 23 unique production content/link preimages', () => {
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS).toHaveLength(23);
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS).toHaveLength(23);
    expect(new Set(REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS).size).toBe(23);
    expect(linkPreimages).toHaveLength(23);
    expect(new Set(linkPreimages.map((link) => link.slug)).size).toBe(23);
    expect(new Set(linkPreimages.map((link) => link._id)).size).toBe(23);
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.filter(
      (target) => target.expectedClinicalStatus === 'published',
    )).toHaveLength(4);

    for (const target of REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS) {
      const link = linkPreimages.find((candidate) => candidate.slug === target.slug);
      expect(link, target.slug).toBeDefined();
      expect(target.type, target.slug).toBe('milestone');
      expect(target.linkId, target.slug).toBe(link?._id);
      expect(target.expectedLinkUpdatedAt, target.slug).toBe(link?.updatedAt);
      expect(target.expectedSourceIds, target.slug).toEqual(link?.sourceIds);
      expect(target.expectedMediaCount, target.slug).toBe(target.expectedMediaRows.length);
      expect(target.expectedAiReleaseCount, target.slug).toBe(0);
    }
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.reduce(
      (sum, target) => sum + target.expectedMediaCount,
      0,
    )).toBe(1);
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.find(
      (target) => target.slug === 'ms_10_12m_self_help_1',
    )?.expectedMediaRows).toEqual([{
      id: 'm17br3277rcvr1hemj8r0ffn1x8bcg53',
      creationTime: 1_785_219_622_944.1829,
      contentSlug: 'ms_10_12m_self_help_1',
      kind: 'animation',
      accessLevel: 'premium',
      licenseType: 'Original work — all rights reserved',
      note: 'Original ACE animation production brief — upload, rights check, and professional review required.',
      offline: true,
      placeholder: true,
      reviewStatus: 'planned',
      rightsOwner: 'ACE Child Grow',
      sortOrder: 23,
    }]);
  });

  it('binds the exact target set to the central seed exclusion guard', () => {
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.map((target) => target.slug))
      .toEqual(CENTRAL_RETIREMENT_SLUGS);
    const seedSlugs = new Set(seedData.map((item) => item.slug));
    for (const slug of REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS) {
      expect(seedSlugs.has(slug), `${slug} remains in convex/seedData.json`).toBe(false);
      expect(EVIDENCE_LINKS.some((link) => link.kind === 'milestone' && link.slug === slug),
        `${slug} remains in the active local evidence graph`).toBe(false);
    }
  });

  it('preserves the full ordered historical production link arrays as archive preimages', () => {
    const safety = REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.find(
      (target) => target.slug === 'ms_13_18m_safety_1',
    );
    expect(safety?.expectedSourceIds).toEqual([
      'aap-milestones-2022',
      'cdc-milestones-2026',
      'aap-surveillance-2020',
      'aap-drowning-2021',
      'tb-bright-futures-4e-2017',
      'nhs-child-accident-2025',
      'hc-child-ems-2026',
    ]);
  });
});
