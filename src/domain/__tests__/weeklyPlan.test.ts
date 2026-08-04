import { describe, it, expect } from 'vitest';
import { buildWeeklyPlan, startOfWeek, isSameDay } from '../activities/weeklyPlan';

describe('buildWeeklyPlan', () => {
  it('returns 7 null-activity days for an empty catalogue', () => {
    const plan = buildWeeklyPlan([]);
    expect(plan).toHaveLength(7);
    expect(plan.every((day) => day.activity === null)).toBe(true);
    expect(plan.map((day) => day.dayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('cycles a short catalogue across all 7 days', () => {
    const catalogue = [{ slug: 'a' }, { slug: 'b' }];
    const plan = buildWeeklyPlan(catalogue);
    expect(plan.map((day) => day.activity?.slug)).toEqual(['a', 'b', 'a', 'b', 'a', 'b', 'a']);
  });

  it('places recently completed items after not-recent ones', () => {
    const catalogue = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    const plan = buildWeeklyPlan(catalogue, ['a']);
    expect(plan.map((day) => day.activity?.slug)).toEqual(['b', 'c', 'a', 'b', 'c', 'a', 'b']);
  });

  it('assigns a distinct activity per day when the catalogue has 7 or more items', () => {
    const catalogue = Array.from({ length: 9 }, (_, i) => ({ slug: `s${i}` }));
    const plan = buildWeeklyPlan(catalogue);
    expect(new Set(plan.map((day) => day.activity?.slug)).size).toBe(7);
  });
});

describe('startOfWeek', () => {
  it('returns the same Monday for every day of that week', () => {
    // 2026-08-03 is a Monday; 2026-08-09 is the following Sunday.
    const monday = new Date(2026, 7, 3, 0, 0, 0);
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(2026, 7, 3 + offset, 15, 30);
      const start = startOfWeek(day);
      expect(start.getFullYear()).toBe(monday.getFullYear());
      expect(start.getMonth()).toBe(monday.getMonth());
      expect(start.getDate()).toBe(monday.getDate());
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    }
  });
});

describe('isSameDay', () => {
  it('is true for two timestamps on the same calendar day', () => {
    const morning = new Date(2026, 7, 4, 6, 0).getTime();
    const night = new Date(2026, 7, 4, 23, 59).getTime();
    expect(isSameDay(morning, night)).toBe(true);
  });

  it('is false across a day boundary', () => {
    const lateNight = new Date(2026, 7, 4, 23, 59).getTime();
    const nextMorning = new Date(2026, 7, 5, 0, 1).getTime();
    expect(isSameDay(lateNight, nextMorning)).toBe(false);
  });
});
