import { describe, expect, it } from 'vitest';

import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_EXPIRES_AT,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_FROZEN_AT,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_HASH,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ID,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ITEMS,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_MANIFEST,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_HASH,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';
import { roleMayReviewFrozenBatch } from '../../../convex/lib/reviewPolicy';

describe('native-Myanmar governed release batch', () => {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (entry) => entry.manifest.batchId === CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ID,
  ) as ClinicalReviewBatchRegistration | undefined;

  it('freezes exactly 14 unique current targets behind the Older Safety handoff', () => {
    expect(registration).toBeDefined();
    expect(registration).toMatchObject({
      sequence: 6,
      dimension: 'native_myanmar',
      authority: 'release',
      activation: {
        kind: 'after_handoff',
        previousBatchId: CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
        expectedPreviousFreezeDigest: CLINICAL_OLDER_SAFETY_RELEASE_BATCH_HASH,
      },
      frozenAt: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_FROZEN_AT,
      expiresAt: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_EXPIRES_AT,
    });
    expect(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_MANIFEST.count).toBe(14);
    expect(new Set(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ITEMS.map(
      (item) => `${item.kind}:${item.slug}:r${item.reviewRevision}`,
    )).size).toBe(14);
    expect(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ITEMS.map((item) => item.ordinal))
      .toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
  });

  it('binds the exact language assignee without inventing a professional qualification', () => {
    expect(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER).toEqual({
      profileId: 'md7811m7fbshjb4b7marmm51p58beg2s',
      userId: 'mn71d67gneb2fdcve4gpv7j00d8bec4c',
      displayName: 'Daw La Pyae',
      qualification: null,
      role: 'language_reviewer',
      identityCanonicalSha256: 'da7e4078096a6a41e477b13b31eb054a75924e6df22c386754f74525dc430bbf',
    });
    expect(roleMayReviewFrozenBatch('language_reviewer', 'native_myanmar')).toBe(true);
    expect(roleMayReviewFrozenBatch('owner', 'native_myanmar')).toBe(false);
    expect(roleMayReviewFrozenBatch('clinical_reviewer', 'native_myanmar')).toBe(false);
  });

  it('freezes clinical provenance and all pre-existing review history for every item', () => {
    for (const item of CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ITEMS) {
      expect(item.currentClinicalReviewCount).toBeGreaterThan(0);
      expect(item.currentClinicalReviewsCanonicalSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(item.allClinicalReviewHistoryCanonicalSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(item.upstreamReviewDigests?.map((entry) => entry.dimension)).toEqual([
        'all_review_history',
        'all_nonclinical_history',
        'native_myanmar',
      ]);
      expect(item.upstreamReviewDigests?.every((entry) => /^[a-f0-9]{64}$/.test(entry.digest)))
        .toBe(true);
      expect(item.reviewerAdvisory?.mm.trim()).toBeTruthy();
      expect(item.reviewerAdvisory?.en.trim()).toBeTruthy();
    }
  });

  it('regenerates the immutable manifest and routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_MANIFEST))
      .toBe(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_HASH);
    expect(registration).toBeDefined();
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration!)))
      .toBe(CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_ROUTING_HASH);
  });
});
