import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_ENGLISH_RELEASE_BATCH_EXPIRES_AT,
  CLINICAL_ENGLISH_RELEASE_BATCH_FROZEN_AT,
  CLINICAL_ENGLISH_RELEASE_BATCH_HASH,
  CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS,
  CLINICAL_ENGLISH_RELEASE_BATCH_MANIFEST,
  CLINICAL_ENGLISH_RELEASE_BATCH_PREIMAGES,
  CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER,
  CLINICAL_ENGLISH_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_ENGLISH_RELEASE_PREVIOUS_FREEZE_DIGEST,
  CLINICAL_ENGLISH_RELEASE_PREVIOUS_RECEIPT_DIGEST,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_HASH,
  CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('English all-14 release batch', () => {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (entry) => entry.manifest.batchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  );

  it('is the exact sequence-8 handoff successor of the completed Native-Myanmar refreeze', () => {
    expect(registration).toMatchObject({
      sequence: 8,
      laneGraphVersion: 1,
      dimension: 'english',
      authority: 'release',
      activation: {
        kind: 'after_handoff',
        previousBatchId: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_ID,
        expectedPreviousFreezeDigest: CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_HASH,
      },
      frozenAt: CLINICAL_ENGLISH_RELEASE_BATCH_FROZEN_AT,
      expiresAt: CLINICAL_ENGLISH_RELEASE_BATCH_EXPIRES_AT,
    });
    expect(CLINICAL_ENGLISH_RELEASE_PREVIOUS_FREEZE_DIGEST)
      .toBe(CLINICAL_NATIVE_MYANMAR_REFREEZE_BATCH_HASH);
    expect(CLINICAL_ENGLISH_RELEASE_PREVIOUS_RECEIPT_DIGEST)
      .toBe('64f364d48ebe2c2ef6c4c2d262bac09a2013636e529920e308a0c6d48e68af36');
    expect(CLINICAL_ENGLISH_RELEASE_BATCH_PREIMAGES.expectedPreviousReceiptDigest)
      .toBe(CLINICAL_ENGLISH_RELEASE_PREVIOUS_RECEIPT_DIGEST);
  });

  it('binds the same fourteen exact post-correction revisions to Daw La Pyae', () => {
    expect(CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER).toMatchObject({
      displayName: 'Daw La Pyae',
      qualification: null,
      role: 'language_reviewer',
      identityCanonicalSha256: 'da7e4078096a6a41e477b13b31eb054a75924e6df22c386754f74525dc430bbf',
    });
    expect(CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS.map((item) => item.reviewRevision))
      .toEqual([4, 5, 9, 4, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7]);
    expect(CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS.map((item) => item.ordinal))
      .toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
    for (const item of CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS) {
      expect(item.currentClinicalReviewCount).toBe(0);
      expect(item.currentClinicalReviewsCanonicalSha256)
        .toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
      expect(item.upstreamReviewDigests?.map((entry) => entry.dimension)).toEqual([
        'all_review_history',
        'all_nonclinical_history',
        'native_myanmar',
        'english',
      ]);
      expect(item.reviewerAdvisory?.mm.trim()).toBeTruthy();
      expect(item.reviewerAdvisory?.en.trim()).toBeTruthy();
    }
  });

  it('regenerates the exact manifest and routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_ENGLISH_RELEASE_BATCH_MANIFEST))
      .toBe(CLINICAL_ENGLISH_RELEASE_BATCH_HASH);
    expect(registration).toBeDefined();
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration!)))
      .toBe(CLINICAL_ENGLISH_RELEASE_BATCH_ROUTING_HASH);
  });

  it('preserves the committed frozen git base when the audit fixture is rewritten', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalEnglishBatch.mts'),
      'utf8',
    );

    expect(auditSource).toContain('gitBase: committedFixture?.frozenFrom.gitBase');
    expect(auditSource).not.toContain(
      "gitBase: execFileSync('git', ['rev-parse', 'origin/main']",
    );
  });
});
