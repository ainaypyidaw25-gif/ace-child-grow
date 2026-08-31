import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { applyFailClosedAuditExit } from '../../../scripts/lib/failClosedAudit';
import {
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_EXPIRES_AT,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_FROZEN_AT,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_HASH,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ID,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_MANIFEST,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_PREIMAGES,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_REVIEWER,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ROUTING_HASH,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_BATCH_ID,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
  CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
} from '../../../convex/lib/clinicalNativeMyanmarSuccessorBatchData';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('native-Myanmar all-14 immutable successor data', () => {
  const registration = {
    sequence: 12,
    laneGraphVersion: 1,
    dimension: 'native_myanmar',
    authority: 'release',
    activation: {
      kind: 'after_handoff',
      previousBatchId: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_BATCH_ID,
      expectedPreviousFreezeDigest:
        CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
    },
    routingCanonicalSha256: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ROUTING_HASH,
    freezeDigest: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_HASH,
    frozenAt: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_EXPIRES_AT,
    manifest: CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_MANIFEST,
  } as const satisfies ClinicalReviewBatchRegistration;

  it('freezes the exact sequence-12 after-handoff identity', () => {
    expect(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ID)
      .toBe('clinical-native-myanmar-successor-14-2026-08-31-v1');
    expect(registration).toMatchObject({
      sequence: 12,
      dimension: 'native_myanmar',
      activation: {
        kind: 'after_handoff',
        previousBatchId: 'clinical-child-development-refreeze-14-2026-08-31-v1',
        expectedPreviousFreezeDigest:
          'd5a41d6d49274003f13263fc57cd4728c692c66bacafe55fd43316b89d162e4a',
      },
    });
    expect(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_PREIMAGES.frozenFrom)
      .toMatchObject({
        deployment: 'graceful-possum-566',
        gitBase: '911c07642242a898748396b725a9d1e3fb7ec37c',
      });
    expect(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST)
      .toBe('3d7457b5b5ce35e5bf644bd694382c06de17b31701ee1f8dc19f67e41a6d2204');
    expect(CLINICAL_REVIEW_BATCH_REGISTRY.at(-1)).toEqual(registration);
  });

  it('binds Daw La Pyae to all fourteen exact current Production revisions', () => {
    expect(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_REVIEWER).toMatchObject({
      displayName: 'Daw La Pyae',
      qualification: null,
      role: 'language_reviewer',
      identityCanonicalSha256:
        'da7e4078096a6a41e477b13b31eb054a75924e6df22c386754f74525dc430bbf',
    });
    expect(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.reviewRevision,
    )).toEqual([6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9]);
    expect(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.ordinal,
    )).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));

    for (const item of CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS) {
      expect(item.currentClinicalReviewCount).toBe(0);
      expect(item.currentClinicalReviewsCanonicalSha256)
        .toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
      expect(item.upstreamReviewDigests?.map((entry) => entry.dimension)).toEqual([
        'all_review_history',
        'all_nonclinical_history',
        'native_myanmar',
        'english',
        'child_development',
      ]);
      expect(item.reviewerAdvisory?.mm.trim()).toBeTruthy();
      expect(item.reviewerAdvisory?.en.trim()).toBeTruthy();
    }
  });

  it('freezes the completed sequence-11 child-development approvals upstream', () => {
    for (const item of CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ITEMS) {
      const childDevelopment = item.upstreamReviewDigests?.find(
        (entry) => entry.dimension === 'child_development',
      );
      expect(childDevelopment?.digest).toMatch(/^[a-f0-9]{64}$/);
      expect(childDevelopment?.digest)
        .not.toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
    }
  });

  it('regenerates the exact manifest and sequence-12 routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_MANIFEST))
      .toBe(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration)))
      .toBe(CLINICAL_NATIVE_MYANMAR_SUCCESSOR_BATCH_ROUTING_HASH);
  });

  it('keeps the Production audit bounded and committed-base stable', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalNativeMyanmarSuccessorBatch.mts'),
      'utf8',
    );

    expect(auditSource).toContain('gitBase: committedFixture?.frozenFrom.gitBase');
    expect(auditSource).not.toContain('.collect()');
    expect(auditSource).not.toContain('CONTENT_SEED');
    expect(auditSource).toContain('take(51)');
    expect(auditSource).toContain('take(301)');
  });

  it('marks every non-exact audit as a failed process', () => {
    const drifted: { exitCode?: number } = {};
    applyFailClosedAuditExit(false, drifted);
    expect(drifted.exitCode).toBe(1);

    const exact: { exitCode?: number } = {};
    applyFailClosedAuditExit(true, exact);
    expect(exact.exitCode).toBeUndefined();
  });
});
