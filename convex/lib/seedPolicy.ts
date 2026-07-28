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

/**
 * Immutable, code-reviewed correction releases for rows already published.
 *
 * This is deliberately not a general published-content overwrite mechanism:
 * callers cannot provide content or arbitrary slugs, and an unknown release
 * ID resolves to null. Each release is therefore narrow, auditable, and safe
 * to run repeatedly after its matching seed snapshot is deployed.
 */
export const PUBLISHED_ERRATA_RELEASES = {
  '2026-07-28-content-remediation': [
    'ms_birth_2m_gross_motor_1',
    'ms_birth_2m_communication_1',
    'ms_3_4m_gross_motor_1',
    'gd_5_6m_nutrition',
    'gd_birth_2m_sleep',
    'gd_birth_2m_nutrition',
    'gd_3_4m_nutrition',
    'gd_5_6m_fine_motor',
    'gd_5_6m_safety',
    'gd_7_9m_safety',
    'gd_10_12m_play',
  ],
} as const;

export function publishedErrataSlugs(releaseId: string): readonly string[] | null {
  if (!(releaseId in PUBLISHED_ERRATA_RELEASES)) return null;
  return PUBLISHED_ERRATA_RELEASES[
    releaseId as keyof typeof PUBLISHED_ERRATA_RELEASES
  ];
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
