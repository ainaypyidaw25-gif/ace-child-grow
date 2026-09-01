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
  CLINICAL_SAFETY_SUCCESSOR_BATCH_EXPIRES_AT,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_FROZEN_AT,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_PREIMAGES,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_REVIEWER,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_ROUTING_HASH,
  CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_BATCH_ID,
  CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
  CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
  CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_ID,
  CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
} from '../../../convex/lib/clinicalSafetySuccessorBatchData';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('Safety all-14 immutable successor data', () => {
  const registration = {
    sequence: 15,
    laneGraphVersion: 1,
    dimension: 'safety',
    authority: 'release',
    activation: {
      kind: 'after_handoff',
      previousBatchId: CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_BATCH_ID,
      expectedPreviousFreezeDigest:
        CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
    },
    routingCanonicalSha256: CLINICAL_SAFETY_SUCCESSOR_BATCH_ROUTING_HASH,
    freezeDigest: CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
    frozenAt: CLINICAL_SAFETY_SUCCESSOR_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_SAFETY_SUCCESSOR_BATCH_EXPIRES_AT,
    manifest: CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST,
  } as const satisfies ClinicalReviewBatchRegistration;

  it('freezes the exact sequence-15 after-handoff identity', () => {
    expect(CLINICAL_SAFETY_SUCCESSOR_BATCH_ID)
      .toBe('clinical-safety-successor-14-2026-09-01-v1');
    expect(registration).toMatchObject({
      sequence: 15,
      dimension: 'safety',
      activation: {
        kind: 'after_handoff',
        previousBatchId: 'clinical-evidence-successor-14-2026-09-01-v1',
        expectedPreviousFreezeDigest:
          'f847abc3de1b0c88f42b4713efe718c7f487516040ecc92948e855fea048467f',
      },
    });
    expect(CLINICAL_SAFETY_SUCCESSOR_BATCH_PREIMAGES.frozenFrom)
      .toMatchObject({
        deployment: 'graceful-possum-566',
        gitBase: 'bd63e2b026142ec8374255feb52eda771bf72f80',
      });
    expect(CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST)
      .toBe('cd98c905a18850b4c9fafb318e37781006e21dfbd51870d8d555f5671f2344a5');
    expect(CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_ID)
      .toBe('qx76j01zmcm92gg7ndpjm26g6h8dkmcz');
    expect(CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_DECISION_DIGEST)
      .toBe('28917526d547b99fe71deeb098b3c492986cf4f95c32e8b400c7a3b32a91a5cf');
    expect(CLINICAL_SAFETY_SUCCESSOR_BATCH_PREIMAGES).toMatchObject({
      expectedPreviousReceiptId: CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_ID,
      expectedPreviousDecisionDigest: CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
      expectedPreviousReceiptDigest: CLINICAL_SAFETY_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
    });
    expect(CLINICAL_REVIEW_BATCH_REGISTRY.at(-1)).toEqual(registration);
  });

  it('binds qualified Phyo Ko Ko to all fourteen exact current Production revisions', () => {
    expect(CLINICAL_SAFETY_SUCCESSOR_BATCH_REVIEWER).toMatchObject({
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
      identityCanonicalSha256:
        'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
    });
    expect(roleMayReviewFrozenBatch(
      CLINICAL_SAFETY_SUCCESSOR_BATCH_REVIEWER.role,
      'safety',
    )).toBe(true);
    expect(approvalNeedsQualification('safety')).toBe(true);
    expect(CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.reviewRevision,
    )).toEqual([6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9]);
    expect(CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.ordinal,
    )).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));

    for (const item of CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS) {
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
      ]);
      expect(item.reviewerAdvisory?.mm.trim()).toBeTruthy();
      expect(item.reviewerAdvisory?.en.trim()).toBeTruthy();
    }
  });

  it('freezes the completed sequence-14 evidence approvals upstream', () => {
    for (const item of CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS) {
      const evidence = item.upstreamReviewDigests?.find(
        (entry) => entry.dimension === 'evidence',
      );
      expect(evidence?.digest).toMatch(/^[a-f0-9]{64}$/);
      expect(evidence?.digest)
        .not.toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
    }
  });

  it('regenerates the exact manifest and sequence-15 routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_SAFETY_SUCCESSOR_BATCH_MANIFEST))
      .toBe(CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration)))
      .toBe(CLINICAL_SAFETY_SUCCESSOR_BATCH_ROUTING_HASH);
  });

  it('keeps the Production audit bounded and committed-base stable', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalSafetySuccessorBatch.mts'),
      'utf8',
    );

    expect(auditSource).toContain('gitBase: committedFixture?.frozenFrom.gitBase');
    expect(auditSource).not.toContain('.collect()');
    expect(auditSource).not.toContain('CONTENT_SEED');
    expect(auditSource).toContain("row.dimension === 'safety'");
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
