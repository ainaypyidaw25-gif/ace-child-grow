// Evidence Base — governance reports.
//
// Five reports the mission requires, all pure functions over ./sources and
// ./links so they can be unit-tested and rendered identically on the client and
// inside Convex:
//
//   1. contentWithoutReferences  — orphan content (must always be empty)
//   2. contentAwaitingReview     — content or references not yet signed off
//   3. expiredReferences         — our review of the reference has lapsed
//   4. duplicateReferences       — two records pointing at the same document
//   5. outdatedReferences        — the document itself is old enough to replace
//
// None of these reports guess. Where a fact is unknown (no printed year, never
// verified) the record is reported as a problem rather than assumed to be fine.

import { CONTENT_SEED } from '../content/seed';
import { EVIDENCE_SOURCES, SOURCE_BY_ID } from './sources';
import {
  EVIDENCE_LINKS,
  relatedContent,
  unusedSourceIds,
  type EvidenceLink,
  type EvidenceLinkKind,
} from './links';
import {
  OUTDATED_AFTER_YEARS,
  duplicateKey,
  effectiveNextReview,
  isExpired,
  isOutdated,
  resolveReviewStatus,
  titleKey,
  verificationProblems,
  type EvidenceReviewStatus,
  type EvidenceSource,
} from './types';

// ---------------------------------------------------------------------------
// 1. Content without references
// ---------------------------------------------------------------------------

export interface OrphanContentRow {
  kind: EvidenceLinkKind | 'unknown';
  slug: string;
  title: string;
  reason: string;
}

const TITLE_BY_SLUG: ReadonlyMap<string, string> = new Map(
  CONTENT_SEED.map((item) => [item.slug, item.titleEn]),
);

/**
 * Content, safety rules or Hope Center topics that resolve to zero usable
 * references. A reference that is itself 'evidence_required' does not count as
 * backing, so an item citing only unverified sources is reported here too.
 */
export function contentWithoutReferences(links: EvidenceLink[] = EVIDENCE_LINKS): OrphanContentRow[] {
  const rows: OrphanContentRow[] = [];
  for (const link of links) {
    const title = TITLE_BY_SLUG.get(link.slug) ?? link.slug;
    if (link.sourceIds.length === 0) {
      rows.push({ kind: link.kind, slug: link.slug, title, reason: 'no reference linked' });
      continue;
    }
    const missing = link.sourceIds.filter((id) => !SOURCE_BY_ID.has(id));
    if (missing.length > 0) {
      rows.push({
        kind: link.kind,
        slug: link.slug,
        title,
        reason: `reference id not in the registry: ${missing.join(', ')}`,
      });
      continue;
    }
    const usable = link.sourceIds.filter((id) => {
      const src = SOURCE_BY_ID.get(id);
      return src ? resolveReviewStatus(src) !== 'evidence_required' : false;
    });
    if (usable.length === 0) {
      rows.push({
        kind: link.kind,
        slug: link.slug,
        title,
        reason: 'every linked reference is marked evidence_required',
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 2. Content awaiting review
// ---------------------------------------------------------------------------

export interface AwaitingReviewRow {
  scope: 'content' | 'reference';
  kind: string;
  slug: string;
  title: string;
  status: string;
  /** Named reviewer, or null while nobody has taken it. */
  reviewer: string | null;
}

/**
 * Everything a clinical reviewer still has to sign off: content items that are
 * not yet published, and references that are not yet approved.
 */
export function contentAwaitingReview(
  sources: EvidenceSource[] = EVIDENCE_SOURCES,
): AwaitingReviewRow[] {
  const rows: AwaitingReviewRow[] = [];

  for (const item of CONTENT_SEED) {
    if (item.clinicalStatus === 'published') continue;
    rows.push({
      scope: 'content',
      kind: item.type,
      slug: item.slug,
      title: item.titleEn,
      status: item.clinicalStatus,
      reviewer: null,
    });
  }

  for (const src of sources) {
    const status = resolveReviewStatus(src);
    if (status === 'approved' || status === 'retired') continue;
    rows.push({
      scope: 'reference',
      kind: src.orgKey,
      slug: src.id,
      title: src.title,
      status,
      reviewer: src.reviewer,
    });
  }

  return rows;
}

/** Count of items in each review status, for the admin summary strip. */
export function reviewStatusCounts(
  sources: EvidenceSource[] = EVIDENCE_SOURCES,
): Record<EvidenceReviewStatus, number> {
  const counts: Record<EvidenceReviewStatus, number> = {
    evidence_required: 0,
    awaiting_review: 0,
    in_review: 0,
    approved: 0,
    retired: 0,
  };
  sources.forEach((src) => {
    counts[resolveReviewStatus(src)] += 1;
  });
  return counts;
}

// ---------------------------------------------------------------------------
// 3. Expired references
// ---------------------------------------------------------------------------

export interface ExpiredReferenceRow {
  id: string;
  org: string;
  title: string;
  url: string;
  /** Date the re-check was due, or null when the record was never verified. */
  dueOn: string | null;
  /** Whole days overdue; null when there is no due date to count from. */
  daysOverdue: number | null;
  /** Content that would lose its citation if this reference were retired. */
  dependentContent: number;
}

function daysBetweenIso(fromIso: string, toIso: string): number | null {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

function dependentCount(sourceId: string): number {
  const related = relatedContent(sourceId);
  return Object.values(related).reduce((n, slugs) => n + slugs.length, 0);
}

/** References whose review date has passed, most overdue first. */
export function expiredReferences(
  todayIso: string,
  sources: EvidenceSource[] = EVIDENCE_SOURCES,
): ExpiredReferenceRow[] {
  return sources
    .filter((src) => isExpired(src, todayIso))
    .map((src) => {
      const dueOn = effectiveNextReview(src);
      return {
        id: src.id,
        org: src.org,
        title: src.title,
        url: src.url,
        dueOn,
        daysOverdue: dueOn ? daysBetweenIso(dueOn, todayIso) : null,
        dependentContent: dependentCount(src.id),
      };
    })
    .sort((a, b) => (b.daysOverdue ?? Number.MAX_SAFE_INTEGER) - (a.daysOverdue ?? Number.MAX_SAFE_INTEGER));
}

// ---------------------------------------------------------------------------
// 4. Duplicate references
// ---------------------------------------------------------------------------

export interface DuplicateReferenceRow {
  /** 'identifier' = same DOI/ISBN/PMID/URL. 'title' = same org + title + year. */
  match: 'identifier' | 'title';
  key: string;
  ids: string[];
  titles: string[];
}

/**
 * Two registry records describing the same document. Identifier matches are
 * hard duplicates; title matches are candidates a human must judge, because a
 * guideline and its summary page legitimately share a title.
 */
export function duplicateReferences(
  sources: EvidenceSource[] = EVIDENCE_SOURCES,
): DuplicateReferenceRow[] {
  const rows: DuplicateReferenceRow[] = [];

  const collect = (
    match: 'identifier' | 'title',
    keyOf: (src: EvidenceSource) => string,
  ): void => {
    const groups = new Map<string, EvidenceSource[]>();
    for (const src of sources) {
      const key = keyOf(src);
      const list = groups.get(key);
      if (list) list.push(src);
      else groups.set(key, [src]);
    }
    for (const [key, group] of groups) {
      if (group.length < 2) continue;
      rows.push({
        match,
        key,
        ids: group.map((s) => s.id),
        titles: group.map((s) => s.title),
      });
    }
  };

  collect('identifier', duplicateKey);
  const identifierPairs = new Set(rows.flatMap((r) => r.ids));
  collect('title', titleKey);

  // Drop title matches that the identifier pass already reported.
  return rows.filter(
    (r) => r.match === 'identifier' || !r.ids.every((id) => identifierPairs.has(id)),
  );
}

// ---------------------------------------------------------------------------
// 5. Outdated references
// ---------------------------------------------------------------------------

export interface OutdatedReferenceRow {
  id: string;
  org: string;
  title: string;
  url: string;
  year: number | null;
  ageYears: number | null;
  /** Years this evidence level may stand before a newer edition is sought. */
  limitYears: number;
  dependentContent: number;
  reason: string;
}

/** References old enough that a newer edition should be looked for. */
export function outdatedReferences(
  todayIso: string,
  sources: EvidenceSource[] = EVIDENCE_SOURCES,
): OutdatedReferenceRow[] {
  const thisYear = Number(todayIso.slice(0, 4));
  return sources
    .filter((src) => isOutdated(src, todayIso))
    .map((src) => ({
      id: src.id,
      org: src.org,
      title: src.title,
      url: src.url,
      year: src.year,
      ageYears: src.year === null ? null : thisYear - src.year,
      limitYears: OUTDATED_AFTER_YEARS[src.evidenceLevel],
      dependentContent: dependentCount(src.id),
      reason:
        src.year === null
          ? 'no publication year printed on the source page'
          : `published ${thisYear - src.year} years ago; ${src.evidenceLevel} references are reviewed for replacement after ${OUTDATED_AFTER_YEARS[src.evidenceLevel]}`,
    }))
    .sort((a, b) => (b.ageYears ?? Number.MAX_SAFE_INTEGER) - (a.ageYears ?? Number.MAX_SAFE_INTEGER));
}

// ---------------------------------------------------------------------------
// Roll-up
// ---------------------------------------------------------------------------

export interface EvidenceReportSet {
  generatedOn: string;
  totals: {
    sources: number;
    links: number;
    contentItems: number;
    unusedSources: number;
  };
  reviewStatusCounts: Record<EvidenceReviewStatus, number>;
  contentWithoutReferences: OrphanContentRow[];
  contentAwaitingReview: AwaitingReviewRow[];
  expiredReferences: ExpiredReferenceRow[];
  duplicateReferences: DuplicateReferenceRow[];
  outdatedReferences: OutdatedReferenceRow[];
  /** References carrying a structural problem, with the reasons. */
  verificationFailures: { id: string; title: string; problems: string[] }[];
}

export function buildReports(
  todayIso: string,
  sources: EvidenceSource[] = EVIDENCE_SOURCES,
  links: EvidenceLink[] = EVIDENCE_LINKS,
): EvidenceReportSet {
  return {
    generatedOn: todayIso,
    totals: {
      sources: sources.length,
      links: links.length,
      contentItems: CONTENT_SEED.length,
      unusedSources: unusedSourceIds().length,
    },
    reviewStatusCounts: reviewStatusCounts(sources),
    contentWithoutReferences: contentWithoutReferences(links),
    contentAwaitingReview: contentAwaitingReview(sources),
    expiredReferences: expiredReferences(todayIso, sources),
    duplicateReferences: duplicateReferences(sources),
    outdatedReferences: outdatedReferences(todayIso, sources),
    verificationFailures: sources
      .map((src) => ({ id: src.id, title: src.title, problems: verificationProblems(src) }))
      .filter((row) => row.problems.length > 0),
  };
}
