import { describe, it, expect } from 'vitest';
import { ageLabels } from '../age/ageLabel';

const d = (s: string) => new Date(s + 'T00:00:00Z');

describe('age labels', () => {
  it('formats English years and months', () => {
    const l = ageLabels(d('2022-01-15'), d('2025-07-15'), 'en');
    expect(l.chronological).toBe('3 years 6 months');
    expect(l.totalMonths).toBe(42);
  });

  it('formats Myanmar years and months', () => {
    const l = ageLabels(d('2024-01-01'), d('2025-04-01'), 'mm');
    expect(l.chronological).toContain('နှစ်');
    expect(l.chronological).toContain('လ');
  });

  it('adds a corrected label for a premature child within cutoff', () => {
    const l = ageLabels(d('2025-01-01'), d('2025-07-01'), 'en', {
      gestationalWeeks: 32,
      useCorrected: true,
    });
    expect(l.corrected).toBeDefined();
    expect(l.chronological).toBe('6 months');
  });

  it('omits corrected label for a full-term child', () => {
    const l = ageLabels(d('2025-01-01'), d('2025-07-01'), 'en', {
      gestationalWeeks: 40,
      useCorrected: true,
    });
    expect(l.corrected).toBeUndefined();
  });
});
