import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { applyFailClosedAuditExit } from '../../../scripts/lib/failClosedAudit';
import {
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_EXPIRES_AT,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_FROZEN_AT,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_HASH,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_ID,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_MANIFEST,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_PREIMAGES,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_REVIEWER,
  CLINICAL_ENGLISH_SUCCESSOR_BATCH_ROUTING_HASH,
  CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_BATCH_ID,
  CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
  CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
  CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_ID,
  CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
} from '../../../convex/lib/clinicalEnglishSuccessorBatchData';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('English all-14 immutable successor data', () => {
  const registration = {
    sequence: 13,
    laneGraphVersion: 1,
    dimension: 'english',
    authority: 'release',
    activation: {
      kind: 'after_handoff',
      previousBatchId: CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_BATCH_ID,
      expectedPreviousFreezeDigest:
        CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
    },
    routingCanonicalSha256: CLINICAL_ENGLISH_SUCCESSOR_BATCH_ROUTING_HASH,
    freezeDigest: CLINICAL_ENGLISH_SUCCESSOR_BATCH_HASH,
    frozenAt: CLINICAL_ENGLISH_SUCCESSOR_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_ENGLISH_SUCCESSOR_BATCH_EXPIRES_AT,
    manifest: CLINICAL_ENGLISH_SUCCESSOR_BATCH_MANIFEST,
  } as const satisfies ClinicalReviewBatchRegistration;

  it('freezes the exact sequence-13 after-handoff identity', () => {
    expect(CLINICAL_ENGLISH_SUCCESSOR_BATCH_ID)
      .toBe('clinical-english-successor-14-2026-08-31-v1');
    expect(registration).toMatchObject({
      sequence: 13,
      dimension: 'english',
      activation: {
        kind: 'after_handoff',
        previousBatchId: 'clinical-native-myanmar-successor-14-2026-08-31-v1',
        expectedPreviousFreezeDigest:
          'd536c63aeb5a2f4e5a88f4e028fe73f61173011cc36ea03e1ef576e458fc068a',
      },
    });
    expect(CLINICAL_ENGLISH_SUCCESSOR_BATCH_PREIMAGES.frozenFrom)
      .toMatchObject({
        deployment: 'graceful-possum-566',
        gitBase: '8bb4752267bfa91c08dfd443b3470db59be8d2fa',
      });
    expect(CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST)
      .toBe('9e5ca9d4eac4fa7068b07d8a9eedd4edefa51c1db74e131c3b34370b7e8c48e4');
    expect(CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_ID)
      .toBe('qx74nqm0fp8ncre22q0r6ffdzn8dhs06');
    expect(CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_DECISION_DIGEST)
      .toBe('bec8d61c4de024796d63a84c7287fb2d63d705be8c586f096264df90b7f0b5ec');
    expect(CLINICAL_ENGLISH_SUCCESSOR_BATCH_PREIMAGES).toMatchObject({
      expectedPreviousReceiptId: CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_ID,
      expectedPreviousDecisionDigest: CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
      expectedPreviousReceiptDigest: CLINICAL_ENGLISH_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
    });
    expect(CLINICAL_REVIEW_BATCH_REGISTRY.at(-1)).toEqual(registration);
  });

  it('binds Daw La Pyae to all fourteen exact current Production revisions', () => {
    expect(CLINICAL_ENGLISH_SUCCESSOR_BATCH_REVIEWER).toMatchObject({
      displayName: 'Daw La Pyae',
      qualification: null,
      role: 'language_reviewer',
      identityCanonicalSha256:
        'da7e4078096a6a41e477b13b31eb054a75924e6df22c386754f74525dc430bbf',
    });
    expect(CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.reviewRevision,
    )).toEqual([6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9]);
    expect(CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.ordinal,
    )).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));

    for (const item of CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS) {
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

  it('freezes the completed sequence-12 native-Myanmar approvals upstream', () => {
    for (const item of CLINICAL_ENGLISH_SUCCESSOR_BATCH_ITEMS) {
      const nativeMyanmar = item.upstreamReviewDigests?.find(
        (entry) => entry.dimension === 'native_myanmar',
      );
      expect(nativeMyanmar?.digest).toMatch(/^[a-f0-9]{64}$/);
      expect(nativeMyanmar?.digest)
        .not.toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
    }
  });

  it('regenerates the exact manifest and sequence-13 routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_ENGLISH_SUCCESSOR_BATCH_MANIFEST))
      .toBe(CLINICAL_ENGLISH_SUCCESSOR_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration)))
      .toBe(CLINICAL_ENGLISH_SUCCESSOR_BATCH_ROUTING_HASH);
  });

  it('keeps the Production audit bounded and committed-base stable', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalEnglishSuccessorBatch.mts'),
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
