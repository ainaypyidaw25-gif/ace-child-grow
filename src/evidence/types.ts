// Evidence Base — data model.
//
// Every knowledge item in ACE Child Grow must be traceable to a source that a
// human can open and check. This module defines that record and the pure rules
// that decide whether a record is usable, stale, or must be re-verified.
//
// ANTI-FABRICATION CONTRACT
// -------------------------
// A field is populated ONLY when it was read verbatim from the publisher page
// recorded in `url`. A DOI, ISBN, edition or year that was not read on that page
// is a fabrication and must never be written here. When a field cannot be
// verified the correct value is `null` — never a plausible guess. When a whole
// reference cannot be verified, its reviewStatus is 'evidence_required'.

export const EVIDENCE_LEVELS = [
  'guideline',
  'systematic_review',
  'rct',
  'cohort',
  'expert_consensus',
  'textbook',
  'parent_education',
] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

/** Ranking used for "which reference is strongest" — 1 is strongest. */
export const EVIDENCE_LEVEL_RANK: Record<EvidenceLevel, number> = {
  guideline: 1,
  systematic_review: 2,
  rct: 3,
  cohort: 4,
  expert_consensus: 5,
  textbook: 6,
  parent_education: 7,
};

export const EVIDENCE_REVIEW_STATUSES = [
  /** Metadata could not be verified against a publisher page. Unusable until fixed. */
  'evidence_required',
  /** Metadata verified; a qualified evidence reviewer has not yet signed off. */
  'awaiting_review',
  /** Under active evidence review. */
  'in_review',
  /** Signed off by a named qualified reviewer; scope is recorded separately. */
  'approved',
  /** Superseded or withdrawn; kept for audit, not for citation. */
  'retired',
] as const;
export type EvidenceReviewStatus = (typeof EVIDENCE_REVIEW_STATUSES)[number];

/** Only approved references may be shown as the citation behind parent-facing content. */
export function isCitable(status: EvidenceReviewStatus): boolean {
  return status === 'approved';
}

/** Organisation families used by the admin filter. */
export const EVIDENCE_ORG_KEYS = [
  'WHO',
  'UNICEF',
  'CDC',
  'AAP',
  'HealthyChildren',
  'NICE',
  'NHS',
  'GOV',
  'JOURNAL',
  'TEXTBOOK',
  'ASHA',
  'AOTA',
] as const;
export type EvidenceOrgKey = (typeof EVIDENCE_ORG_KEYS)[number];

/** Subject topics — the bridge between a reference and the content it supports. */
export const EVIDENCE_TOPICS = [
  'milestones',
  'motor',
  'speech_language',
  'cognitive',
  'social_emotional',
  'play',
  'nutrition',
  'breastfeeding',
  'sleep',
  'safety',
  'growth',
  'immunisation',
  'special_needs',
  'parenting',
  'school_readiness',
  'screen_time',
  'oral_health',
  'mental_health',
] as const;
export type EvidenceTopic = (typeof EVIDENCE_TOPICS)[number];

export interface EvidenceSource {
  /** Stable slug. Used as the foreign key from content links. */
  id: string;
  /** Source Organization — as printed by the publisher. */
  org: string;
  /** Organisation family for filtering. */
  orgKey: EvidenceOrgKey;
  /** Document Title — verbatim. */
  title: string;
  /** Author/editor line if printed; null otherwise. */
  authors: string | null;
  /** Publication Year — only if printed on the page. Never inferred. */
  year: number | null;
  /** Edition / version / guideline code / volume-issue-pages, verbatim or null. */
  edition: string | null;
  /** Country of publication, or 'International' for global bodies. */
  country: string | null;
  /** Language of the cited document. */
  language: string;
  /** The exact URL that was fetched to verify this record. */
  url: string;
  /** DOI — only if printed. */
  doi: string | null;
  /** ISBN — only if printed. */
  isbn: string | null;
  /** PubMed ID — only if printed. */
  pmid: string | null;
  evidenceLevel: EvidenceLevel;
  reviewStatus: EvidenceReviewStatus;
  /** Named human reviewer. Null until a qualified person signs off. */
  reviewer: string | null;
  /** ISO date the reviewer signed off. */
  reviewDate: string | null;
  /** ISO date the record must be re-checked. Derived when absent. */
  nextReviewDate: string | null;
  keywords: string[];
  topics: EvidenceTopic[];
  ageMonthsMin: number | null;
  ageMonthsMax: number | null;
  /** ISO date the metadata was read off the publisher page. */
  verifiedOn: string | null;
  /** What was seen on the page that confirms this record. */
  verifiedNote: string;
}

// ---------------------------------------------------------------------------
// Identifier validation. These never "repair" a value — they only report.
// ---------------------------------------------------------------------------

/** DOIs always start with a 10. prefix followed by a registrant code and suffix. */
export function isDoiShapeValid(doi: string): boolean {
  return /^10\.\d{4,9}\/\S+$/.test(doi.trim());
}

/** Strips formatting so a printed ISBN can be checksum-tested. */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

export function isIsbn10Valid(raw: string): boolean {
  const s = normalizeIsbn(raw);
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const ch = s[i];
    const v = ch === 'X' ? 10 : Number(ch);
    sum += v * (10 - i);
  }
  return sum % 11 === 0;
}

export function isIsbn13Valid(raw: string): boolean {
  const s = normalizeIsbn(raw);
  if (!/^\d{13}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i += 1) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return sum % 10 === 0;
}

export function isIsbnValid(raw: string): boolean {
  return isIsbn10Valid(raw) || isIsbn13Valid(raw);
}

export function isPmidShapeValid(pmid: string): boolean {
  return /^\d{1,8}$/.test(pmid.trim());
}

export function isHttpsUrl(url: string): boolean {
  return /^https:\/\/[^\s]+$/.test(url);
}

// ---------------------------------------------------------------------------
// Freshness rules
// ---------------------------------------------------------------------------

/**
 * How often a reference of each level must be re-checked. Normative guidance and
 * parent-facing pages change often; primary research and textbooks do not.
 */
export const REVIEW_CADENCE_MONTHS: Record<EvidenceLevel, number> = {
  guideline: 24,
  parent_education: 24,
  expert_consensus: 36,
  systematic_review: 48,
  rct: 60,
  cohort: 60,
  textbook: 60,
};

/**
 * Age (in years since publication) beyond which a reference is flagged as
 * outdated and a newer edition should be sought. Not the same as expired:
 * outdated is about the document, expired is about our review of it.
 */
export const OUTDATED_AFTER_YEARS: Record<EvidenceLevel, number> = {
  guideline: 8,
  parent_education: 5,
  expert_consensus: 10,
  systematic_review: 10,
  rct: 20,
  cohort: 20,
  textbook: 12,
};

export function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** The date this record is due for re-checking. Explicit value wins. */
export function effectiveNextReview(src: EvidenceSource): string | null {
  if (src.nextReviewDate) return src.nextReviewDate;
  const anchor = src.reviewDate ?? src.verifiedOn;
  if (!anchor) return null;
  return addMonthsIso(anchor, REVIEW_CADENCE_MONTHS[src.evidenceLevel]);
}

/** Our review of the reference has lapsed. */
export function isExpired(src: EvidenceSource, todayIso: string): boolean {
  const due = effectiveNextReview(src);
  if (!due) return true; // never checked => treat as due
  return due < todayIso;
}

/** The document itself is old enough that a newer edition should be sought. */
export function isOutdated(src: EvidenceSource, todayIso: string): boolean {
  if (src.year === null) return true; // unknown age cannot be defended
  const thisYear = Number(todayIso.slice(0, 4));
  return thisYear - src.year > OUTDATED_AFTER_YEARS[src.evidenceLevel];
}

/**
 * Structural problems that make a record unusable as a citation. Returns the
 * list of reasons; an empty list means the record is structurally sound.
 */
export function verificationProblems(src: EvidenceSource): string[] {
  const out: string[] = [];
  if (!src.title.trim()) out.push('missing title');
  if (!isHttpsUrl(src.url)) out.push('missing or non-https url');
  if (!src.verifiedOn) out.push('never verified against the publisher page');
  if (!src.verifiedNote.trim()) out.push('no verification note');
  if (src.year === null) out.push('publication year not printed on the source page');
  if (src.doi !== null && !isDoiShapeValid(src.doi)) out.push(`malformed doi: ${src.doi}`);
  if (src.isbn !== null && !isIsbnValid(src.isbn)) out.push(`invalid isbn checksum: ${src.isbn}`);
  if (src.pmid !== null && !isPmidShapeValid(src.pmid)) out.push(`malformed pmid: ${src.pmid}`);
  if (src.year !== null && (src.year < 1900 || src.year > 2100)) out.push(`implausible year: ${src.year}`);
  return out;
}

/**
 * The status a record must carry given its own contents. A record with
 * structural problems is forced to 'evidence_required' no matter what it claims.
 */
export function resolveReviewStatus(src: EvidenceSource): EvidenceReviewStatus {
  if (verificationProblems(src).length > 0) return 'evidence_required';
  return src.reviewStatus;
}

/** Key used to detect two records that point at the same document. */
export function duplicateKey(src: EvidenceSource): string {
  if (src.doi) return `doi:${src.doi.toLowerCase()}`;
  if (src.isbn) return `isbn:${normalizeIsbn(src.isbn)}`;
  if (src.pmid) return `pmid:${src.pmid}`;
  return `url:${src.url.replace(/\/$/, '').toLowerCase()}`;
}

/** Secondary key — same title + year from the same organisation. */
export function titleKey(src: EvidenceSource): string {
  return `${src.orgKey}:${src.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}:${src.year ?? '?'}`;
}
