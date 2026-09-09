import {
  publicationEvidenceIsEligible,
  type PublicationEvidenceSource,
} from './evidencePublicationGate';

export type EvidenceImportSafetyLink = {
  kind: string;
  slug: string;
  sourceIds: readonly string[];
};

/**
 * Find inherently public citation links that would have no eligible source.
 *
 * Library rows have their own fail-closed visibility/review gate. Slugs with
 * no library row (for example safety_rule and hope_topic) remain visible by
 * design, so resetting their last approved source would silently leave live
 * safety copy with an empty citation list. Source imports must stop before
 * writing when that would happen.
 */
export function unprotectedCitationGapKeys(
  links: readonly EvidenceImportSafetyLink[],
  sources: readonly PublicationEvidenceSource[],
  librarySlugs: ReadonlySet<string>,
  todayIso: string,
): string[] {
  const byId = new Map(sources.map((source) => [source.sourceId, source]));
  const gaps: string[] = [];

  for (const link of links) {
    if (librarySlugs.has(link.slug)) continue;
    const hasEligibleCitation = link.sourceIds.some((sourceId) => {
      const source = byId.get(sourceId);
      return source?.reviewStatus === 'approved'
        && publicationEvidenceIsEligible(source, todayIso);
    });
    if (!hasEligibleCitation) gaps.push(`${link.kind}:${link.slug}`);
  }

  return gaps.sort();
}
