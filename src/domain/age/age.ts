// Age calculation engine (Phase 6).
// Pure functions, no side effects, no I/O. Fully unit-tested.
//
// Rules enforced:
//  - Chronological age is ALWAYS available and is the primary value.
//  - Corrected age is only for premature children (< 40 weeks gestation),
//    is clearly labelled, never negative, and is capped: correction is only
//    clinically applied up to 24 months of chronological age (configurable).
//  - Invalid inputs throw structured errors rather than returning wrong numbers.

export const FULL_TERM_WEEKS = 40;
/** Correction is conventionally applied up to this chronological age (months). */
export const CORRECTION_CUTOFF_MONTHS = 24;
/** Plausible human gestational age bounds for validation. */
export const MIN_GESTATIONAL_WEEKS = 22;
export const MAX_GESTATIONAL_WEEKS = 44;

export class AgeInputError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_DATE'
      | 'FUTURE_BIRTH_DATE'
      | 'INVALID_GESTATIONAL_WEEKS',
  ) {
    super(message);
    this.name = 'AgeInputError';
  }
}

export interface ChronologicalAge {
  totalDays: number;
  totalMonths: number; // whole months completed
  years: number;
  months: number; // remainder months after years
}

export interface CorrectedAge {
  applied: boolean; // false when full-term or past the cutoff
  reason?: 'full_term' | 'past_cutoff';
  totalMonths: number;
  years: number;
  months: number;
  correctionWeeks: number; // weeks born before full term (0 for full-term)
}

function atUtcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function assertValidDate(d: Date, label: string): void {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    throw new AgeInputError(`${label} is not a valid date`, 'INVALID_DATE');
  }
}

/** Whole days between birth and reference (reference must be >= birth). */
export function ageInDays(birthDate: Date, reference: Date): number {
  assertValidDate(birthDate, 'birthDate');
  assertValidDate(reference, 'reference');
  const b = atUtcMidnight(birthDate);
  const r = atUtcMidnight(reference);
  if (r < b) {
    throw new AgeInputError('birthDate is in the future', 'FUTURE_BIRTH_DATE');
  }
  return Math.floor((r - b) / 86_400_000);
}

/**
 * Whole calendar months completed between birth and reference.
 * Handles month-length differences and leap years correctly by comparing
 * calendar fields rather than dividing days by an average.
 */
export function ageInMonths(birthDate: Date, reference: Date): number {
  assertValidDate(birthDate, 'birthDate');
  assertValidDate(reference, 'reference');
  const b = atUtcMidnight(birthDate);
  const r = atUtcMidnight(reference);
  if (r < b) {
    throw new AgeInputError('birthDate is in the future', 'FUTURE_BIRTH_DATE');
  }
  const by = birthDate.getUTCFullYear();
  const bm = birthDate.getUTCMonth();
  const bd = birthDate.getUTCDate();
  const ry = reference.getUTCFullYear();
  const rm = reference.getUTCMonth();
  const rd = reference.getUTCDate();

  let months = (ry - by) * 12 + (rm - bm);
  // If the day-of-month hasn't been reached yet, the current month is incomplete.
  if (rd < bd) months -= 1;
  return Math.max(0, months);
}

export function chronologicalAge(birthDate: Date, reference: Date): ChronologicalAge {
  const totalDays = ageInDays(birthDate, reference);
  const totalMonths = ageInMonths(birthDate, reference);
  return {
    totalDays,
    totalMonths,
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

/**
 * Corrected developmental age for premature children.
 * correction (weeks) = max(0, 40 - gestationalWeeks)
 * corrected months = chronological months - correction (in months)
 * Never negative; not applied past the cutoff or for full-term babies.
 */
export function correctedAge(
  birthDate: Date,
  reference: Date,
  gestationalWeeks: number,
  cutoffMonths: number = CORRECTION_CUTOFF_MONTHS,
): CorrectedAge {
  if (
    typeof gestationalWeeks !== 'number' ||
    Number.isNaN(gestationalWeeks) ||
    gestationalWeeks < MIN_GESTATIONAL_WEEKS ||
    gestationalWeeks > MAX_GESTATIONAL_WEEKS
  ) {
    throw new AgeInputError(
      `gestationalWeeks must be between ${MIN_GESTATIONAL_WEEKS} and ${MAX_GESTATIONAL_WEEKS}`,
      'INVALID_GESTATIONAL_WEEKS',
    );
  }
  const chrono = chronologicalAge(birthDate, reference);
  const correctionWeeks = Math.max(0, FULL_TERM_WEEKS - gestationalWeeks);

  if (correctionWeeks === 0) {
    return {
      applied: false,
      reason: 'full_term',
      totalMonths: chrono.totalMonths,
      years: chrono.years,
      months: chrono.months,
      correctionWeeks: 0,
    };
  }
  if (chrono.totalMonths > cutoffMonths) {
    return {
      applied: false,
      reason: 'past_cutoff',
      totalMonths: chrono.totalMonths,
      years: chrono.years,
      months: chrono.months,
      correctionWeeks,
    };
  }

  // Convert correction weeks to whole months (approx 4.345 weeks per month),
  // then subtract, clamped at zero.
  const correctionMonths = Math.round((correctionWeeks * 7) / 30.4375);
  const totalMonths = Math.max(0, chrono.totalMonths - correctionMonths);
  return {
    applied: true,
    totalMonths,
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    correctionWeeks,
  };
}
