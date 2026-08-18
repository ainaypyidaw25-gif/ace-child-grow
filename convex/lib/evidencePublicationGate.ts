/**
 * Evidence rules for a new parent-visible publication transition.
 *
 * A content link may include non-citable sources that are still being reviewed,
 * but publication needs at least one currently approved, current source. Every
 * linked id must resolve, and retired evidence may not remain attached.
 */

import { evidenceIsCurrent } from './evidenceFreshness';

export type PublicationEvidenceSource = {
  sourceId: string;
  reviewStatus: string;
  evidenceLevel: string;
  year: number | null;
  reviewDate?: string | null;
  nextReviewDate: string | null;
  verifiedOn: string | null;
};

export function publicationEvidenceIsCurrent(
  source: PublicationEvidenceSource,
  todayIso: string,
): boolean {
  return evidenceIsCurrent(source, todayIso);
}

export function evaluatePublicationEvidence(
  linkedSourceIds: readonly string[],
  sources: readonly PublicationEvidenceSource[],
  todayIso: string,
): {
  allowed: boolean;
  unknownSourceIds: string[];
  retiredSourceIds: string[];
  currentApprovedSourceIds: string[];
  staleApprovedSourceIds: string[];
} {
  const byId = new Map(sources.map((source) => [source.sourceId, source]));
  const unknownSourceIds = linkedSourceIds.filter((sourceId) => !byId.has(sourceId));
  const retiredSourceIds: string[] = [];
  const currentApprovedSourceIds: string[] = [];
  const staleApprovedSourceIds: string[] = [];

  for (const sourceId of linkedSourceIds) {
    const source = byId.get(sourceId);
    if (!source) continue;
    if (source.reviewStatus === 'retired') retiredSourceIds.push(sourceId);
    if (source.reviewStatus !== 'approved') continue;
    if (publicationEvidenceIsCurrent(source, todayIso)) currentApprovedSourceIds.push(sourceId);
    else staleApprovedSourceIds.push(sourceId);
  }

  return {
    allowed:
      linkedSourceIds.length > 0 &&
      unknownSourceIds.length === 0 &&
      retiredSourceIds.length === 0 &&
      currentApprovedSourceIds.length > 0 &&
      staleApprovedSourceIds.length === 0,
    unknownSourceIds,
    retiredSourceIds,
    currentApprovedSourceIds,
    staleApprovedSourceIds,
  };
}
