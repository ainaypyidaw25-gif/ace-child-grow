// Bilingual age-label helpers. Pure; build on the age engine.
import type { Locale } from '../types';
import { chronologicalAge, correctedAge } from './age';

export interface AgeLabels {
  chronological: string;
  corrected?: string;
  totalMonths: number;
}

function ymLabel(years: number, months: number, locale: Locale): string {
  if (locale === 'mm') {
    const y = years > 0 ? `${years} နှစ်` : '';
    const m = months > 0 ? `${months} လ` : '';
    return [y, m].filter(Boolean).join(' ') || '၀ လ';
  }
  const y = years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : '';
  const m = months > 0 ? `${months} ${months === 1 ? 'month' : 'months'}` : '';
  return [y, m].filter(Boolean).join(' ') || '0 months';
}

/**
 * Build chronological (always) and, when premature + within cutoff, corrected
 * age labels for a child. Chronological age is never replaced.
 */
export function ageLabels(
  birthDate: Date,
  reference: Date,
  locale: Locale,
  opts?: { gestationalWeeks?: number; useCorrected?: boolean },
): AgeLabels {
  const chrono = chronologicalAge(birthDate, reference);
  const labels: AgeLabels = {
    chronological: ymLabel(chrono.years, chrono.months, locale),
    totalMonths: chrono.totalMonths,
  };
  if (opts?.useCorrected && typeof opts.gestationalWeeks === 'number') {
    const c = correctedAge(birthDate, reference, opts.gestationalWeeks);
    if (c.applied) labels.corrected = ymLabel(c.years, c.months, locale);
  }
  return labels;
}
