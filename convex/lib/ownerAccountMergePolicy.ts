import type { Id } from '../_generated/dataModel';

// Shared by the exact merge mutation and the account-erasure worker. Keeping
// these values in one policy module prevents a release-specific guard from
// silently drifting away from the audit row that activates it.
export const OWNER_ACCOUNT_MERGE_RELEASE_ID =
  'owner-account-merge-lapyaewun2690-2026-09-01-v1' as const;
export const OWNER_ACCOUNT_MERGE_QUARANTINE_ACTION =
  'auth.account.merge_duplicate_owner.quarantine.2026_09_01_v1' as const;
export const OWNER_ACCOUNT_MERGE_SOURCE_USER_ID =
  'mn7en7gt4yc0w1fny6gfccqb8s8bck0m' as Id<'users'>;
