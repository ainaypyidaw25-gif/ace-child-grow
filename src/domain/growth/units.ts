// Unit conversion for the Growth Tracker (Phase 13).
// Validated, exact-factor conversions. No WHO percentiles/z-scores are computed
// here — that requires integrating official WHO datasets plus evidence and
// specialist safety review (see docs/content/evidence-and-safety-review-policy.md).
// Until then the UI shows:
// "Validated WHO growth-standard integration is pending."

export const LB_PER_KG = 2.2046226218;
export const IN_PER_CM = 0.3937007874;

export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';

export class UnitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnitError';
  }
}

function assertPositive(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new UnitError(`${label} must be a positive finite number`);
  }
}

export function kgToLb(kg: number): number {
  assertPositive(kg, 'kg');
  return kg * LB_PER_KG;
}
export function lbToKg(lb: number): number {
  assertPositive(lb, 'lb');
  return lb / LB_PER_KG;
}
export function cmToIn(cm: number): number {
  assertPositive(cm, 'cm');
  return cm * IN_PER_CM;
}
export function inToCm(inch: number): number {
  assertPositive(inch, 'in');
  return inch / IN_PER_CM;
}

/** Normalize any weight to kilograms for storage. */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? (assertPositive(value, 'weight'), value) : lbToKg(value);
}
/** Normalize any length to centimeters for storage. */
export function toCm(value: number, unit: LengthUnit): number {
  return unit === 'cm' ? (assertPositive(value, 'length'), value) : inToCm(value);
}

/** Round to n decimal places for display without floating noise. */
export function round(value: number, places = 2): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}
