import { describe, expect, it } from 'vitest';

import {
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  isRetiredMilestoneSlug,
} from '../../../convex/lib/contentRetirements';
import { EVIDENCE_LINKS } from '../../evidence/links';
import { seedPayload } from '../seed';
import { INFANT_CONTENT } from '../seed/infant';
import { MILESTONES } from '../seed/milestones';
import { OLDER_AUTHORED_CONTENT } from '../seed/older';

const EXACT_REMAINING_PSEUDO_MILESTONE_SLUGS = [
  'ms_13_18m_safety_1',
  'ms_19_24m_safety_1',
  'ms_2y_safety_1',
  'ms_2_5y_safety_1',
  'ms_3y_safety_1',
  'ms_3_5y_safety_1',
  'ms_4y_safety_1',
  'ms_4_5y_safety_1',
  'ms_5y_safety_1',
  'ms_5y_safety_2',
  'ms_5y_safety_3',
  'ms_4y_gross_motor_1',
  'ms_10_12m_fine_motor_2',
  'ms_10_12m_self_help_1',
  'ms_3y_self_help_3',
  'ms_4y_problem_solving_1',
  'ms_3_5y_gross_motor_2',
  'ms_3y_social_2',
  'ms_3y_self_help_2',
  'ms_5y_cognitive_2',
  'ms_5y_gross_motor_2',
  'ms_4_5y_daily_routine_1',
  'ms_4y_self_help_4',
] as const;

describe('remaining scored pseudo-milestone source retirement', () => {
  it('uses one exact, duplicate-free 23-slug central guard', () => {
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID).toBe(
      '2026-08-21-remaining-pseudo-milestones',
    );
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS).toEqual(
      EXACT_REMAINING_PSEUDO_MILESTONE_SLUGS,
    );
    expect(REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS).toHaveLength(23);
    expect(new Set(REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS).size).toBe(23);

    for (const slug of EXACT_REMAINING_PSEUDO_MILESTONE_SLUGS) {
      expect(isRetiredMilestoneSlug(slug), slug).toBe(true);
    }
  });

  it('omits all 23 from deterministic seed/import payloads without deleting authored history', () => {
    const seededSlugs = new Set(seedPayload().map((item) => item.slug));
    const authoredMilestoneSlugs = new Set(
      [...MILESTONES, ...INFANT_CONTENT, ...OLDER_AUTHORED_CONTENT]
        .filter((item) => item.type === 'milestone')
        .map((item) => item.slug),
    );

    for (const slug of EXACT_REMAINING_PSEUDO_MILESTONE_SLUGS) {
      expect(seededSlugs.has(slug), slug).toBe(false);
      expect(authoredMilestoneSlugs.has(slug), slug).toBe(true);
    }
  });

  it('omits active seed links while retaining the separate frozen production preimages', () => {
    for (const slug of EXACT_REMAINING_PSEUDO_MILESTONE_SLUGS) {
      expect(EVIDENCE_LINKS.filter(
        (candidate) => candidate.kind === 'milestone' && candidate.slug === slug,
      ), slug).toHaveLength(0);
    }
  });
});
