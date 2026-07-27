/**
 * Human-reviewed catalogue rows are immutable to automated seed refreshes.
 *
 * A changed seed is a new editorial proposal, not permission to replace the
 * exact body, evidence summary, source, or media that a reviewer approved.
 * Moving a protected row back into review is an explicit CMS action.
 */
export function seedMayUpdateExisting(clinicalStatus: string): boolean {
  return clinicalStatus !== 'approved' && clinicalStatus !== 'published';
}

type ExistingMedia = {
  placeholder?: boolean;
  storageId?: unknown;
  url?: string;
  reviewStatus?: string;
};

/** Seed refresh may replace only an unresolved placeholder, never real/reviewed media. */
export function seedMediaIsProtected(row: ExistingMedia): boolean {
  return row.reviewStatus === 'approved'
    || row.placeholder === false
    || row.storageId !== undefined
    || Boolean(row.url);
}

export function seedAuditSummary(created: number, updated: number, skippedApproved: number): string {
  return `created ${created}, updated ${updated}, protected ${skippedApproved}`;
}
