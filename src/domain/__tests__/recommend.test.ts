import { describe, it, expect } from 'vitest';
import {
  eligibleActivities,
  rankActivities,
  buildDailyPlan,
  type RecommendableActivity,
} from '../activities/recommend';

const A = (id: string, domain: RecommendableActivity['domain'], min: number, max: number): RecommendableActivity => ({
  id, domain, ageMinMonths: min, ageMaxMonths: max, titleMm: id, titleEn: id,
});

const catalogue: RecommendableActivity[] = [
  A('gm-baby', 'gross_motor', 0, 6),
  A('sp-mid', 'speech_language', 5, 12),
  A('fm-mid', 'fine_motor', 10, 18),
  A('cog-old', 'cognitive', 24, 48),
  A('se-mid', 'social_emotional', 12, 36),
];

describe('activity recommendation', () => {
  it('never returns an activity outside the age range', () => {
    const res = eligibleActivities(11, catalogue);
    expect(res.map((a) => a.id).sort()).toEqual(['fm-mid', 'sp-mid']);
    for (const a of res) {
      expect(11).toBeGreaterThanOrEqual(a.ageMinMonths);
      expect(11).toBeLessThanOrEqual(a.ageMaxMonths);
    }
  });

  it('returns nothing for invalid ages', () => {
    expect(eligibleActivities(-3, catalogue)).toEqual([]);
    expect(eligibleActivities(Number.NaN, catalogue)).toEqual([]);
  });

  it('prioritizes emerging domains', () => {
    const ranked = rankActivities({
      ageMonths: 11,
      catalogue,
      emergingDomains: ['fine_motor'],
    });
    expect(ranked[0].id).toBe('fm-mid');
  });

  it('de-prioritizes recently completed activities', () => {
    const ranked = rankActivities({
      ageMonths: 11,
      catalogue,
      recentActivityIds: ['fm-mid'],
    });
    expect(ranked[0].id).toBe('sp-mid');
  });

  it('builds a 3-slot plan preferring domain variety', () => {
    const plan = buildDailyPlan({ ageMonths: 30, catalogue });
    const picked = [plan.morning, plan.afternoon, plan.evening].filter(Boolean);
    const domains = picked.map((p) => p!.domain);
    expect(new Set(domains).size).toBe(domains.length); // all distinct domains
  });

  it('returns null slots when nothing is eligible', () => {
    const plan = buildDailyPlan({ ageMonths: 200, catalogue });
    expect(plan.morning).toBeNull();
    expect(plan.afternoon).toBeNull();
    expect(plan.evening).toBeNull();
  });
});
