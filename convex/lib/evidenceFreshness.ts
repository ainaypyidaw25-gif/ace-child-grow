/**
 * Canonical server-side evidence freshness policy.
 *
 * Keep these rules independent of Convex database APIs so publication gates,
 * citation reads and integrity reports all answer freshness questions in the
 * same way. The browser-side copy in src/evidence/types.ts is guarded by a
 * parity test because Convex bundles must not import the browser source tree.
 */

export const REVIEW_CADENCE_MONTHS: Readonly<Record<string, number>> = {
  guideline: 24,
  parent_education: 24,
  expert_consensus: 36,
  systematic_review: 48,
  rct: 60,
  cohort: 60,
  narrative_review: 36,
  textbook: 60,
};

export const OUTDATED_AFTER_YEARS: Readonly<Record<string, number>> = {
  guideline: 8,
  parent_education: 5,
  expert_consensus: 10,
  systematic_review: 10,
  rct: 20,
  cohort: 20,
  narrative_review: 10,
  textbook: 12,
};

export type EvidenceFreshnessFields = {
  evidenceLevel: string;
  year: number | null;
  reviewDate?: string | null;
  nextReviewDate: string | null;
  verifiedOn: string | null;
};

/** Accept one real calendar date in the exact YYYY-MM-DD wire format. */
export function isStrictIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function todayIsoUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addMonthsIso(isoDate: string, months: number): string | null {
  if (!isStrictIsoDate(isoDate) || !Number.isInteger(months) || months < 0) return null;
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

/**
 * Validate source/review date metadata at write boundaries.
 * A future re-review deadline is valid; a future verification/sign-off is not.
 */
export function evidenceDateValidationProblem(
  fields: Pick<EvidenceFreshnessFields, 'verifiedOn' | 'reviewDate' | 'nextReviewDate'>,
  todayIso: string,
): string | null {
  if (!isStrictIsoDate(todayIso)) return 'today_invalid';
  for (const [name, value] of [
    ['verified_on', fields.verifiedOn],
    ['review_date', fields.reviewDate],
    ['next_review_date', fields.nextReviewDate],
  ] as const) {
    if (value !== null && value !== undefined && !isStrictIsoDate(value)) {
      return `${name}_invalid`;
    }
  }
  if (fields.verifiedOn && fields.verifiedOn > todayIso) return 'verified_on_future';
  if (fields.reviewDate && fields.reviewDate > todayIso) return 'review_date_future';
  // A publisher can leave an overdue "next review" date on a page that we
  // verify later. Only a human sign-off may not schedule its own next review
  // before the sign-off date.
  if (fields.reviewDate && fields.nextReviewDate && fields.nextReviewDate < fields.reviewDate) {
    return 'next_review_date_before_anchor';
  }
  return null;
}

export function effectiveNextReview(
  source: EvidenceFreshnessFields,
): string | null {
  if (source.nextReviewDate) {
    return isStrictIsoDate(source.nextReviewDate) ? source.nextReviewDate : null;
  }
  const anchor = source.reviewDate ?? source.verifiedOn;
  const cadence = REVIEW_CADENCE_MONTHS[source.evidenceLevel];
  if (!anchor || cadence === undefined) return null;
  return addMonthsIso(anchor, cadence);
}

export function evidenceIsExpired(
  source: EvidenceFreshnessFields,
  todayIso: string,
): boolean {
  if (evidenceDateValidationProblem(source, todayIso)) return true;
  const due = effectiveNextReview(source);
  return !due || due < todayIso;
}

export function evidenceIsOutdated(
  source: Pick<EvidenceFreshnessFields, 'evidenceLevel' | 'year'>,
  todayIso: string,
): boolean {
  if (!isStrictIsoDate(todayIso)) return true;
  const thisYear = Number(todayIso.slice(0, 4));
  const maxAge = OUTDATED_AFTER_YEARS[source.evidenceLevel];
  return source.year === null
    || !Number.isInteger(source.year)
    || source.year > thisYear
    || maxAge === undefined
    || thisYear - source.year > maxAge;
}

/**
 * A parent-citable approval must be signed, verified and unexpired.
 *
 * Document age is deliberately not part of this hard eligibility decision.
 * `evidenceIsOutdated` is a review-scheduling advisory: an old source may be
 * superseded, but age alone is not proof that an official standard or a
 * reviewer-approved claim is wrong.
 */
export function evidenceIsEligibleForCitation(
  source: EvidenceFreshnessFields,
  todayIso: string,
): boolean {
  if (!source.verifiedOn || !source.reviewDate) return false;
  return !evidenceIsExpired(source, todayIso);
}
