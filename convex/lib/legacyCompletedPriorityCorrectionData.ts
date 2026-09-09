import sourceSnapshot from './legacyCompletedPriorityCorrectionSource.json';

export const LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID =
  'owner-priority-legacy-completed-correction-2026-08-22-v1' as const;

export const LEGACY_COMPLETED_PRIORITY_CORRECTION_ACTION =
  'release.owner_priority_legacy_completed_correction' as const;

export const LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET = {
  type: 'activity',
  slug: 'act_story_sequence',
  contentId: 'kx70f2hmd5esn68tf0hkw176sd8b8nvq',
  contentCreationTime: 1785024282947.196,
  reviewRevision: 2,
  initialUpdatedAt: 1786433535701,
  initialPriorityStatus: 'completed',
  desiredPriorityStatus: 'unreviewed',
  initialCanonicalSha256: '789909a3637c08fdacdcaf3c31ee601409dfb2b5c4e478768bc1593d69fa3e54',
  reviewRows: 9,
  reviewRowsCanonicalSha256: '8b2012aee0eff2300cefdbdf646fca208d3d19c672bf0d097783e6405d98e702',
} as const;

export const LEGACY_COMPLETED_PRIORITY_CORRECTION_SOURCE_SNAPSHOT = sourceSnapshot;
