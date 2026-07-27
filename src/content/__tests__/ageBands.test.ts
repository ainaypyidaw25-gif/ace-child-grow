import { describe, expect, it } from 'vitest';
import { resolveAgeGroup } from '../taxonomy';

describe('content age-band resolution', () => {
  it.each([
    [12, '10_12m'],
    [13, '13_18m'],
    [18, '13_18m'],
    [24, '2y'],
    [25, '2y'],
    [30, '2_5y'],
    [31, '2_5y'],
    [36, '3y'],
    [37, '3y'],
    [42, '3_5y'],
    [43, '3_5y'],
    [48, '4y'],
    [49, '4y'],
    [54, '4_5y'],
    [55, '4_5y'],
    [60, '5y'],
    [61, '5y'],
  ])('maps %s months to %s', (months, expected) => {
    expect(resolveAgeGroup(months)?.key).toBe(expected);
  });

  it('does not resolve invalid or out-of-range ages', () => {
    expect(resolveAgeGroup(-1)).toBeUndefined();
    expect(resolveAgeGroup(Number.NaN)).toBeUndefined();
    expect(resolveAgeGroup(67)).toBeUndefined();
  });
});
