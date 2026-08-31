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
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_EXPIRES_AT,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_FROZEN_AT,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_HASH,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ID,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_MANIFEST,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_PREIMAGES,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_REVIEWER,
  CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ROUTING_HASH,
  CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_BATCH_ID,
  CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
  CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
  CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_ID,
  CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
} from '../../../convex/lib/clinicalEvidenceSuccessorBatchData';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('Evidence all-14 immutable successor data', () => {
  const registration = {
    sequence: 14,
    laneGraphVersion: 1,
    dimension: 'evidence',
    authority: 'release',
    activation: {
      kind: 'after_handoff',
      previousBatchId: CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_BATCH_ID,
      expectedPreviousFreezeDigest:
        CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_FREEZE_DIGEST,
    },
    routingCanonicalSha256: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ROUTING_HASH,
    freezeDigest: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_HASH,
    frozenAt: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_EXPIRES_AT,
    manifest: CLINICAL_EVIDENCE_SUCCESSOR_BATCH_MANIFEST,
  } as const satisfies ClinicalReviewBatchRegistration;

  it('freezes the exact sequence-14 after-handoff identity', () => {
    expect(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ID)
      .toBe('clinical-evidence-successor-14-2026-09-01-v1');
    expect(registration).toMatchObject({
      sequence: 14,
      dimension: 'evidence',
      activation: {
        kind: 'after_handoff',
        previousBatchId: 'clinical-english-successor-14-2026-08-31-v1',
        expectedPreviousFreezeDigest:
          '116d691a56fec864c8fb1335dfc6e55bd9fef13178fefbf8f74e855ac5af6761',
      },
    });
    expect(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_PREIMAGES.frozenFrom)
      .toMatchObject({
        deployment: 'graceful-possum-566',
        gitBase: '28921b11938a6e718168bc35d49f8726bf8cb7d8',
      });
    expect(CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST)
      .toBe('85c943dfc463c9a6c6b22e60c4de4da3c4404934df124fde78a47ee9ab682040');
    expect(CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_ID)
      .toBe('qx74kcvag57vxcd877sqsc6bxh8dh4ez');
    expect(CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_DECISION_DIGEST)
      .toBe('dd59c4e1e8bab414372a016735d2070f5addc7243054c889f8d7e6ed30fbc70a');
    expect(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_PREIMAGES).toMatchObject({
      expectedPreviousReceiptId: CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_ID,
      expectedPreviousDecisionDigest: CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_DECISION_DIGEST,
      expectedPreviousReceiptDigest: CLINICAL_EVIDENCE_SUCCESSOR_PREVIOUS_RECEIPT_DIGEST,
    });
    expect(CLINICAL_REVIEW_BATCH_REGISTRY.at(-1)).toEqual(registration);
  });

  it('binds qualified Phyo Ko Ko to all fourteen exact current Production revisions', () => {
    expect(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_REVIEWER).toMatchObject({
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
      identityCanonicalSha256:
        'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
    });
    expect(roleMayReviewFrozenBatch(
      CLINICAL_EVIDENCE_SUCCESSOR_BATCH_REVIEWER.role,
      'evidence',
    )).toBe(true);
    expect(approvalNeedsQualification('evidence')).toBe(true);
    expect(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.reviewRevision,
    )).toEqual([6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9]);
    expect(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS.map(
      (item) => item.ordinal,
    )).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));

    for (const item of CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS) {
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

  it('freezes the completed sequence-13 English approvals upstream', () => {
    for (const item of CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ITEMS) {
      const english = item.upstreamReviewDigests?.find(
        (entry) => entry.dimension === 'english',
      );
      expect(english?.digest).toMatch(/^[a-f0-9]{64}$/);
      expect(english?.digest)
        .not.toBe('4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945');
    }
  });

  it('regenerates the exact manifest and sequence-14 routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_MANIFEST))
      .toBe(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration)))
      .toBe(CLINICAL_EVIDENCE_SUCCESSOR_BATCH_ROUTING_HASH);
  });

  it('keeps the Production audit bounded and committed-base stable', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalEvidenceSuccessorBatch.mts'),
      'utf8',
    );

    expect(auditSource).toContain('gitBase: committedFixture?.frozenFrom.gitBase');
    expect(auditSource).not.toContain('.collect()');
    expect(auditSource).not.toContain('CONTENT_SEED');
    expect(auditSource).toContain("row.dimension === 'evidence'");
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
