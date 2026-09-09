import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_EXPIRES_AT,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_FROZEN_AT,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_HASH,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_MANIFEST,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_PREIMAGES,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_REVIEWER,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_FREEZE_DIGEST,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_RECEIPT_DIGEST,
  CLINICAL_ENGLISH_REFREEZE_BATCH_HASH,
  CLINICAL_ENGLISH_REFREEZE_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

const EMPTY_ARRAY_SHA256 =
  '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';

describe('Child-development all-14 release batch', () => {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (entry) => entry.manifest.batchId === CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID,
  );

  it('is the exact sequence-10 handoff successor of the completed English refreeze', () => {
    expect(registration).toMatchObject({
      sequence: 10,
      laneGraphVersion: 1,
      dimension: 'child_development',
      authority: 'release',
      activation: {
        kind: 'after_handoff',
        previousBatchId: CLINICAL_ENGLISH_REFREEZE_BATCH_ID,
        expectedPreviousFreezeDigest: CLINICAL_ENGLISH_REFREEZE_BATCH_HASH,
      },
      frozenAt: CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_FROZEN_AT,
      expiresAt: CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_EXPIRES_AT,
    });
    expect(CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_FREEZE_DIGEST)
      .toBe(CLINICAL_ENGLISH_REFREEZE_BATCH_HASH);
    expect(CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_RECEIPT_DIGEST)
      .toBe('4d1e52a80bf690ac7ddff576e6fa952c1dbe77318c44929fe71d3e5a18f2674b');
    expect(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_PREIMAGES.expectedPreviousReceiptDigest)
      .toBe(CLINICAL_CHILD_DEVELOPMENT_RELEASE_PREVIOUS_RECEIPT_DIGEST);
  });

  it('binds the fourteen exact current revisions to Phyo Ko Ko', () => {
    expect(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_REVIEWER).toMatchObject({
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
      identityCanonicalSha256:
        'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
    });
    expect(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS.map((item) => item.reviewRevision))
      .toEqual([5, 6, 10, 5, 10, 9, 9, 9, 9, 8, 8, 8, 8, 8]);
    expect(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS.map((item) => item.ordinal))
      .toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
    for (const item of CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS) {
      expect(item.currentClinicalReviewCount).toBe(0);
      expect(item.currentClinicalReviewsCanonicalSha256).toBe(EMPTY_ARRAY_SHA256);
      expect(item.upstreamReviewDigests?.map((entry) => entry.dimension)).toEqual([
        'all_review_history',
        'all_nonclinical_history',
        'native_myanmar',
        'english',
        'child_development',
      ]);
      expect(item.upstreamReviewDigests?.at(-1)?.digest).toBe(EMPTY_ARRAY_SHA256);
      expect(item.reviewerAdvisory?.mm.trim()).toBeTruthy();
      expect(item.reviewerAdvisory?.en.trim()).toBeTruthy();
    }
  });

  it('regenerates the exact manifest and routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_MANIFEST))
      .toBe(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_HASH);
    expect(registration).toBeDefined();
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration!)))
      .toBe(CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ROUTING_HASH);
  });

  it('preserves the committed frozen git base when the audit fixture is rewritten', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalChildDevelopmentBatch.mts'),
      'utf8',
    );
    expect(auditSource).toContain('gitBase: committedFixture?.frozenFrom.gitBase');
    expect(auditSource).not.toContain(
      "gitBase: execFileSync('git', ['rev-parse', 'origin/main']",
    );
  });
});
