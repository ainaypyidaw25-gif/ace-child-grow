import { describe, it, expect } from 'vitest';
import { kgToLb, lbToKg, cmToIn, inToCm, toKg, toCm, round, UnitError } from '../growth/units';

describe('unit conversion', () => {
  it('kg <-> lb round-trips', () => {
    expect(round(kgToLb(10))).toBe(22.05);
    expect(round(lbToKg(kgToLb(7.5)), 4)).toBe(7.5);
  });
  it('cm <-> in round-trips', () => {
    expect(round(cmToIn(100))).toBe(39.37);
    expect(round(inToCm(cmToIn(62)), 4)).toBe(62);
  });
  it('normalizes to storage units', () => {
    expect(round(toKg(22.0462, 'lb'), 2)).toBe(10);
    expect(toKg(9.2, 'kg')).toBe(9.2);
    expect(round(toCm(39.3701, 'in'), 2)).toBe(100);
    expect(toCm(85, 'cm')).toBe(85);
  });
  it('rejects non-positive or non-finite values', () => {
    expect(() => kgToLb(0)).toThrowError(UnitError);
    expect(() => lbToKg(-3)).toThrowError(UnitError);
    expect(() => cmToIn(Number.NaN)).toThrowError(UnitError);
    expect(() => inToCm(Infinity)).toThrowError(UnitError);
  });
});
