// Editorial review status for knowledge-base content.
//
// This is the ONLY vocabulary allowed on a content item:
//
//   draft              — written, references not yet checked against the registry
//   reference_verified — every reference this item cites is a verified registry
//                        record (metadata read off the publisher page)
//   editorial_reviewed — a human editor has read the wording of this item
//   published          — released to parents
//
// 'clinical_approved' / 'medical_approved' / 'doctor_approved' deliberately do
// not exist here. Clinical sign-off is a separate, human act recorded against
// the reference registry by a named reviewer with a stated qualification; it is
// never something a content author can assert about their own writing.
//
// Nothing authored by the knowledge-base build may claim 'editorial_reviewed'
// or 'published' — those two require a person, so they are rejected at build
// time by assertKbStatus().

import type { SeedItem } from '../../types';

export const EDITORIAL_STATUSES = [
  'draft',
  'reference_verified',
  'editorial_reviewed',
  'published',
] as const;
export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

/** The two statuses an authored item is permitted to carry. */
export const AUTHORABLE_EDITORIAL_STATUSES: EditorialStatus[] = ['draft', 'reference_verified'];

/**
 * Attaches the editorial metadata the knowledge-base brief requires on every
 * item: an editorial review status and a plain statement of what the linked
 * evidence actually supports.
 *
 * Source organisation, document title, publication year, evidence level and
 * reference URL are NOT copied onto the item. They live once, in the verified
 * registry (src/evidence/sources.ts), and are resolved for an item through
 * sourcesForContent(slug) — copying them here would let a content file and the
 * registry drift apart, and a drifted citation is a fabricated one.
 */
export function kb(
  item: SeedItem,
  evidenceSummary: string,
  status: EditorialStatus = 'reference_verified',
): SeedItem {
  if (!AUTHORABLE_EDITORIAL_STATUSES.includes(status)) {
    throw new Error(
      `${item.slug}: '${status}' cannot be asserted by an author — it requires a named human.`,
    );
  }
  if (!evidenceSummary.trim()) throw new Error(`${item.slug}: evidence summary is required.`);
  return { ...item, data: { ...item.data, editorialStatus: status, evidenceSummary } };
}
