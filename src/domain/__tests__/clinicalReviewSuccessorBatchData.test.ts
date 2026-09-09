import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  approvalNeedsQualification,
  roleMayReviewFrozenBatch,
} from '../../../convex/lib/reviewPolicy';
import { applyFailClosedAuditExit } from '../../../scripts/lib/failClosedAudit';
import {
  CLINICAL_REVIEW_SUCCESSOR_BATCH_EXPIRES_AT,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_FROZEN_AT,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_ID,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_MANIFEST,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_PREIMAGES,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_REVIEWER,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_ROUTING_HASH,
  CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_BATCH_ID,
  CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
  CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
  CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_ID,
  CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
} from '../../../convex/lib/clinicalReviewSuccessorBatchData';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('Clinical all-14 immutable successor data', () => {
  const registration = {
    sequence: 16,
    laneGraphVersion: 1,
    dimension: 'clinical',
    authority: 'release',
    activation: {
      kind: 'after_handoff',
      previousBatchId: CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_BATCH_ID,
      expectedPreviousFreezeDigest:
        CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
    },
    routingCanonicalSha256: CLINICAL_REVIEW_SUCCESSOR_BATCH_ROUTING_HASH,
    freezeDigest: CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH,
    frozenAt: CLINICAL_REVIEW_SUCCESSOR_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_REVIEW_SUCCESSOR_BATCH_EXPIRES_AT,
    manifest: CLINICAL_REVIEW_SUCCESSOR_BATCH_MANIFEST,
  } as const satisfies ClinicalReviewBatchRegistration;

  it('freezes the exact sequence-16 after-handoff identity', () => {
    expect(CLINICAL_REVIEW_SUCCESSOR_BATCH_ID)
      .toBe('clinical-review-successor-14-2026-09-01-v1');
    expect(registration).toMatchObject({
      sequence: 16,
      dimension: 'clinical',
      activation: {
        kind: 'after_handoff',
        previousBatchId: 'clinical-safety-successor-14-2026-09-01-v1',
        expectedPreviousFreezeDigest:
          '670bf7992e5e5e840709d7adf9c5754659983c051abd2f35ccc48cd4e32a1ec0',
      },
    });
    expect(CLINICAL_REVIEW_SUCCESSOR_BATCH_PREIMAGES.frozenFrom)
      .toMatchObject({
        deployment: 'graceful-possum-566',
        gitBase: 'fa4e3382cb829a0fc4352da70bbd1f939c554dfc',
      });
    expect(CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST)
      .toBe('00f1e8eb917b2e0849e4c0e6bafd4ca7efa4d953ae423d8390138e64a028b422');
    expect(CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_ID)
      .toBe('qx7dcjwg84x11xfxh5s3w2n46s8dk094');
    expect(CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_DECISION_DIGEST)
      .toBe('f660247521c1205ede5bc7293b014579035f0dc7c4a4c57d320027eca418d8f0');
    expect(CLINICAL_REVIEW_SUCCESSOR_BATCH_PREIMAGES).toMatchObject({
      expectedPreviousReceiptId: CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_ID,
      expectedPreviousDecisionDigest: CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
      expectedPreviousReceiptDigest: CLINICAL_REVIEW_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
    });
    expect(CLINICAL_REVIEW_BATCH_REGISTRY.at(-1)).toEqual(registration);
  });

  it('binds qualified Phyo Ko Ko to all fourteen exact current Production revisions', () => {
    expect(CLINICAL_REVIEW_SUCCESSOR_BATCH_REVIEWER).toMatchObject({
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
      identityCanonicalSha256:
        'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
    });
    expect(roleMayReviewFrozenBatch(
      CLINICAL_REVIEW_SUCCESSOR_BATCH_REVIEWER.role,
      'clinical',
    )).toBe(true);
    expect(approvalNeedsQualification('clinical')).toBe(true);
    expect(CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.reviewRevision,
    )).toEqual([6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9]);
    expect(CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.ordinal,
    )).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));

    for (const item of CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS) {
      expect(item.currentClinicalReviewCount).toBe(0);
      expect(item.currentClinicalReviewsCanonicalSha256)
        .toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
      expect(item.upstreamReviewDigests?.map((entry) => entry.dimension)).toEqual([
        'all_review_history',
        'all_nonclinical_history',
        'native_myanmar',
        'english',
        'child_development',
        'evidence',
        'safety',
      ]);
      expect(item.reviewerAdvisory?.mm.trim()).toBeTruthy();
      expect(item.reviewerAdvisory?.en.trim()).toBeTruthy();
    }
  });

  it('freezes the completed sequence-15 safety approvals upstream', () => {
    for (const item of CLINICAL_REVIEW_SUCCESSOR_BATCH_ITEMS) {
      const safety = item.upstreamReviewDigests?.find(
        (entry) => entry.dimension === 'safety',
      );
      expect(safety?.digest).toMatch(/^[a-f0-9]{64}$/);
      expect(safety?.digest)
        .not.toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
    }
  });

  it('regenerates the exact manifest and sequence-16 routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_REVIEW_SUCCESSOR_BATCH_MANIFEST))
      .toBe(CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration)))
      .toBe(CLINICAL_REVIEW_SUCCESSOR_BATCH_ROUTING_HASH);
  });

  it('keeps the Production audit bounded and committed-base stable', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalReviewSuccessorBatch.mts'),
      'utf8',
    );

    expect(auditSource).toContain('gitBase: committedFixture?.frozenFrom.gitBase');
    expect(auditSource).not.toContain('.collect()');
    expect(auditSource).not.toContain('CONTENT_SEED');
    expect(auditSource).toContain("row.dimension === 'clinical'");
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
