import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_EXPIRES_AT,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_FROZEN_AT,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_HASH,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ID,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_MANIFEST,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_REVIEWER,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ROUTING_HASH,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('Native-Myanmar all-14 refreeze release batch', () => {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (entry) => entry.manifest.batchId === CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ID,
  );

  it('is the exact sequence-7 refreeze of the stopped Native-Myanmar lane', () => {
    expect(registration).toMatchObject({
      sequence: 7,
      dimension: 'native_myanmar',
      authority: 'release',
      activation: {
        kind: 'after_changes_requested_refreeze',
        previousBatchId: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ID,
        expectedDecisionSetDigest: CLINICAL_NATIVE_MYANMAR_REFREEZE_DECISION_SET_DIGEST,
      },
      frozenAt: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_FROZEN_AT,
      expiresAt: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_EXPIRES_AT,
    });
    expect(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS.map((item) => item.reviewRevision))
      .toEqual([4, 5, 9, 4, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7]);
    expect(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS.map((item) => item.ordinal))
      .toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
  });

  it('binds Daw La Pyae and fresh zero-current-clinical postimages', () => {
    expect(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_REVIEWER).toMatchObject({
      displayName: 'Daw La Pyae',
      qualification: null,
      role: 'language_reviewer',
      identityCanonicalSha256: 'da7e4078096a6a41e477b13b31eb054a75924e6df22c386754f74525dc430bbf',
    });
    for (const item of CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ITEMS) {
      expect(item.currentClinicalReviewCount).toBe(0);
      expect(item.currentClinicalReviewsCanonicalSha256)
        .toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
      expect(item.upstreamReviewDigests?.map((entry) => entry.dimension)).toEqual([
        'all_review_history',
        'all_nonclinical_history',
        'native_myanmar',
      ]);
      expect(item.reviewerAdvisory?.mm.trim()).toBeTruthy();
      expect(item.reviewerAdvisory?.en.trim()).toBeTruthy();
    }
  });

  it('regenerates the exact manifest and routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_MANIFEST))
      .toBe(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_HASH);
    expect(registration).toBeDefined();
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration!)))
      .toBe(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ROUTING_HASH);
  });
});
