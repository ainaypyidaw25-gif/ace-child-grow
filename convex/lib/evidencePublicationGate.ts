/**
 * Evidence rules for a new parent-visible publication transition.
 *
 * A content link may include non-citable sources that are still being reviewed,
 * but publication needs at least one approved, verified and unexpired source.
 * Document age is an advisory rather than proof that guidance is wrong. Every
 * linked id must resolve, and retired evidence may not remain attached.
 */

import {
  evidenceIsEligibleForCitation,
  evidenceIsOutdated,
} from './evidenceFreshness';

export type PublicationEvidenceSource = {
  sourceId: string;
  reviewStatus: string;
  evidenceLevel: string;
  year: number | null;
  reviewDate?: string | null;
  nextReviewDate: string | null;
  verifiedOn: string | null;
};

export function publicationEvidenceIsEligible(
  source: PublicationEvidenceSource,
  todayIso: string,
): boolean {
  return evidenceIsEligibleForCitation(source, todayIso);
}

export function evaluatePublicationEvidence(
  linkedSourceIds: readonly string[],
  sources: readonly PublicationEvidenceSource[],
  todayIso: string,
): {
  allowed: boolean;
  unknownSourceIds: string[];
  retiredSourceIds: string[];
  evidenceRequiredSourceIds: string[];
  eligibleApprovedSourceIds: string[];
  ineligibleApprovedSourceIds: string[];
  /** Age advisory only; these sources remain eligible when their review is current. */
  outdatedApprovedSourceIds: string[];
} {
  const byId = new Map(sources.map((source) => [source.sourceId, source]));
  const unknownSourceIds = linkedSourceIds.filter((sourceId) => !byId.has(sourceId));
  const retiredSourceIds: string[] = [];
  const evidenceRequiredSourceIds: string[] = [];
  const eligibleApprovedSourceIds: string[] = [];
  const ineligibleApprovedSourceIds: string[] = [];
  const outdatedApprovedSourceIds: string[] = [];

  for (const sourceId of linkedSourceIds) {
    const source = byId.get(sourceId);
    if (!source) continue;
    if (source.reviewStatus === 'retired') retiredSourceIds.push(sourceId);
    if (source.reviewStatus === 'evidence_required') evidenceRequiredSourceIds.push(sourceId);
    if (source.reviewStatus !== 'approved') continue;
    if (publicationEvidenceIsEligible(source, todayIso)) {
      eligibleApprovedSourceIds.push(sourceId);
      if (evidenceIsOutdated(source, todayIso)) outdatedApprovedSourceIds.push(sourceId);
    } else {
      ineligibleApprovedSourceIds.push(sourceId);
    }
  }

  return {
    allowed:
      linkedSourceIds.length > 0 &&
      unknownSourceIds.length === 0 &&
      retiredSourceIds.length === 0 &&
      evidenceRequiredSourceIds.length === 0 &&
      eligibleApprovedSourceIds.length > 0 &&
      ineligibleApprovedSourceIds.length === 0,
    unknownSourceIds,
    retiredSourceIds,
    evidenceRequiredSourceIds,
    eligibleApprovedSourceIds,
    ineligibleApprovedSourceIds,
    outdatedApprovedSourceIds,
  };
}
