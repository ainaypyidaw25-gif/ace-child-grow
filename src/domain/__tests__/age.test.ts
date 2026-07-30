import { describe, it, expect } from 'vitest';
import {
  ageInDays,
  ageInMonths,
  chronologicalAge,
  correctedAge,
  developmentalAgeMonths,
  AgeInputError,
} from '../age/age';

const d = (s: string) => new Date(s + 'T00:00:00Z');

describe('ageInDays', () => {
  it('counts exact days', () => {
    expect(ageInDays(d('2025-01-01'), d('2025-01-31'))).toBe(30);
  });
  it('is 0 on the birth day', () => {
    expect(ageInDays(d('2025-06-15'), d('2025-06-15'))).toBe(0);
  });
  it('handles leap day correctly', () => {
    expect(ageInDays(d('2024-02-28'), d('2024-03-01'))).toBe(2); // 2024 is a leap year
    expect(ageInDays(d('2023-02-28'), d('2023-03-01'))).toBe(1);
  });
  it('throws on future birth date', () => {
    expect(() => ageInDays(d('2025-06-15'), d('2025-06-14'))).toThrowError(AgeInputError);
  });
  it('throws on invalid date', () => {
    expect(() => ageInDays(new Date('nope'), d('2025-01-01'))).toThrowError(AgeInputError);
  });
});

describe('ageInMonths', () => {
  it('is exact on monthly birthdays', () => {
    expect(ageInMonths(d('2024-01-15'), d('2024-07-15'))).toBe(6);
  });
  it('does not count an incomplete month', () => {
    expect(ageInMonths(d('2024-01-15'), d('2024-07-14'))).toBe(5);
  });
  it('handles year boundaries', () => {
    expect(ageInMonths(d('2023-12-31'), d('2025-01-01'))).toBe(12);
  });
  it('handles end-of-month birth dates', () => {
    // Born Jan 31; on Feb 28 not yet a full month (Feb has no 31st -> day 28 < 31)
    expect(ageInMonths(d('2024-01-31'), d('2024-02-28'))).toBe(0);
    expect(ageInMonths(d('2024-01-31'), d('2024-03-31'))).toBe(2);
  });
});

describe('chronologicalAge', () => {
  it('splits into years and months', () => {
    const a = chronologicalAge(d('2022-03-10'), d('2025-09-10'));
    expect(a.totalMonths).toBe(42);
    expect(a.years).toBe(3);
    expect(a.months).toBe(6);
  });
});

describe('correctedAge (premature)', () => {
  it('does not correct a full-term baby', () => {
    const c = correctedAge(d('2025-01-01'), d('2025-07-01'), 40);
    expect(c.applied).toBe(false);
    expect(c.reason).toBe('full_term');
    expect(c.totalMonths).toBe(6);
  });
  it('subtracts prematurity (born at 32 weeks = 8 weeks early ≈ 2 months)', () => {
    // chrono 6 months, correction 8 weeks ≈ 2 months -> corrected ≈ 4 months
    const c = correctedAge(d('2025-01-01'), d('2025-07-01'), 32);
    expect(c.applied).toBe(true);
    expect(c.correctionWeeks).toBe(8);
    expect(c.totalMonths).toBe(4);
  });
  it('never returns a negative corrected age', () => {
    const c = correctedAge(d('2025-01-01'), d('2025-02-01'), 28); // 12 wks early, 1 mo old
    expect(c.totalMonths).toBeGreaterThanOrEqual(0);
  });
  it('stops correcting past the cutoff', () => {
    const c = correctedAge(d('2022-01-01'), d('2025-01-01'), 30); // 3 years old
    expect(c.applied).toBe(false);
    expect(c.reason).toBe('past_cutoff');
  });
  it('rejects impossible gestational ages', () => {
    expect(() => correctedAge(d('2025-01-01'), d('2025-07-01'), 10)).toThrowError(AgeInputError);
    expect(() => correctedAge(d('2025-01-01'), d('2025-07-01'), 60)).toThrowError(AgeInputError);
  });
});

describe('developmentalAgeMonths', () => {
  it('honors the corrected-age preference within the supported window', () => {
    expect(developmentalAgeMonths(d('2026-01-01'), d('2026-07-01'), {
      useCorrectedAge: true,
      gestationalWeeks: 28,
    })).toBe(3);
  });

  it('uses chronological age when correction is not selected', () => {
    expect(developmentalAgeMonths(d('2026-01-01'), d('2026-07-01'), {
      useCorrectedAge: false,
      gestationalWeeks: 28,
    })).toBe(6);
  });
});
