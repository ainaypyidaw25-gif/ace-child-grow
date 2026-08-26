import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_NEWBORN_REFREEZE_BATCH_HASH,
  CLINICAL_NEWBORN_REFREEZE_BATCH_MANIFEST,
  CLINICAL_NEWBORN_REFREEZE_BATCH_ROUTING_HASH,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ROUTING_HASH,
  CLINICAL_NUTRITION_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('clinical newborn refreeze registry data', () => {
  it('binds the exact post-correction revisions and review history', async () => {
    expect(CLINICAL_NEWBORN_REFREEZE_BATCH_MANIFEST.items.map((item) => ({
      slug: item.slug,
      reviewRevision: item.reviewRevision,
      currentClinicalReviewCount: item.currentClinicalReviewCount,
    }))).toEqual([
      { slug: 'act_skin_to_skin_calm', reviewRevision: 3, currentClinicalReviewCount: 0 },
      { slug: 'gd_birth_2m_sleep', reviewRevision: 4, currentClinicalReviewCount: 0 },
    ]);
    expect(await sha256Canonical(CLINICAL_NEWBORN_REFREEZE_BATCH_MANIFEST))
      .toBe(CLINICAL_NEWBORN_REFREEZE_BATCH_HASH);
  });

  it('keeps a strict refreeze then nutrition then safety release chain', async () => {
    const releases = CLINICAL_REVIEW_BATCH_REGISTRY.filter((row) => row.authority === 'release');
    expect(releases.map((row) => ({
      sequence: row.sequence,
      batchId: row.manifest.batchId,
      activation: row.activation.kind,
      predecessor: row.activation.kind === 'initial' ? null : row.activation.previousBatchId,
    }))).toEqual([
      {
        sequence: 2,
        batchId: 'clinical-newborn-skin-sleep-2026-08-23-v1',
        activation: 'initial',
        predecessor: null,
      },
      {
        sequence: 3,
        batchId: 'clinical-newborn-skin-sleep-refreeze-2026-08-24-v1',
        activation: 'after_changes_requested_refreeze',
        predecessor: 'clinical-newborn-skin-sleep-2026-08-23-v1',
      },
      {
        sequence: 4,
        batchId: 'clinical-infant-nutrition-2026-08-24-v1',
        activation: 'after_handoff',
        predecessor: 'clinical-newborn-skin-sleep-refreeze-2026-08-24-v1',
      },
      {
        sequence: 5,
        batchId: 'clinical-older-safety-2026-08-24-v1',
        activation: 'after_handoff',
        predecessor: 'clinical-infant-nutrition-2026-08-24-v1',
      },
      {
        sequence: 6,
        batchId: 'clinical-native-myanmar-governed-14-2026-08-26-v1',
        activation: 'after_handoff',
        predecessor: 'clinical-older-safety-2026-08-24-v1',
      },
      {
        sequence: 7,
        batchId: 'clinical-native-myanmar-refreeze-14-2026-08-26-v1',
        activation: 'after_changes_requested_refreeze',
        predecessor: 'clinical-native-myanmar-governed-14-2026-08-26-v1',
      },
    ]);

    const expected = new Map([
      ['clinical-newborn-skin-sleep-refreeze-2026-08-24-v1', CLINICAL_NEWBORN_REFREEZE_BATCH_ROUTING_HASH],
      ['clinical-infant-nutrition-2026-08-24-v1', CLINICAL_NUTRITION_RELEASE_BATCH_ROUTING_HASH],
      ['clinical-older-safety-2026-08-24-v1', CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ROUTING_HASH],
      ['clinical-native-myanmar-governed-14-2026-08-26-v1', CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ROUTING_HASH],
      ['clinical-native-myanmar-refreeze-14-2026-08-26-v1', CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ROUTING_HASH],
    ]);
    for (const registration of releases.slice(1)) {
      expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration)))
        .toBe(expected.get(registration.manifest.batchId));
    }
  });
});
