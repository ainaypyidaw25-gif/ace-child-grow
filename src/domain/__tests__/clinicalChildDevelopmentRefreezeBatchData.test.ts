import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_EXPIRES_AT,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ID,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_PREIMAGES,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_REVIEWER,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ROUTING_HASH,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
  CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
} from '../../../convex/lib/clinicalChildDevelopmentRefreezeBatchData';
import {
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('child-development all-14 immutable refreeze data', () => {
  const registration = {
    sequence: 11,
    laneGraphVersion: 1,
    dimension: 'child_development',
    authority: 'release',
    activation: {
      kind: 'after_changes_requested_refreeze',
      previousBatchId: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_PREVIOUS_BATCH_ID,
      expectedDecisionSetDigest:
        CLINICAL_CHILD_DEVELOPMENT_REFREEZE_DECISION_SET_DIGEST,
    },
    routingCanonicalSha256: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ROUTING_HASH,
    freezeDigest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH,
    frozenAt: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_FROZEN_AT,
    expiresAt: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_EXPIRES_AT,
    manifest: CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST,
  } as const satisfies ClinicalReviewBatchRegistration;

  it('freezes the exact sequence-11 successor identity and stopped digest', () => {
    expect(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ID)
      .toBe('clinical-child-development-refreeze-14-2026-08-31-v1');
    expect(registration).toMatchObject({
      sequence: 11,
      dimension: 'child_development',
      activation: {
        kind: 'after_changes_requested_refreeze',
        previousBatchId: 'clinical-child-development-governed-14-2026-08-29-v1',
        expectedDecisionSetDigest:
          '2da5ddfecc5e2815c132f5520cf27df27ea76bfdc151e64c6f489c9e384f803f',
      },
    });
    expect(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_PREIMAGES.frozenFrom)
      .toMatchObject({
        deployment: 'graceful-possum-566',
        gitBase: 'e0d22f6877eb6b3cb3f3a420639d3b414e108169',
      });
  });

  it('binds Phyo Ko Ko to all fourteen corrected Production revisions', () => {
    expect(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_REVIEWER).toMatchObject({
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
      identityCanonicalSha256:
        'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
    });
    expect(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS).toHaveLength(14);
    expect(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS.map(
      (item) => item.reviewRevision,
    )).toEqual([6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9]);
    expect(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS.map(
      (item) => item.ordinal,
    )).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));

    for (const item of CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS) {
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

  it('freezes the two post-correction CDC 2-3 source transitions', () => {
    const transitioned = CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ITEMS.filter(
      (item) => item.slug === 'gd_2y_safety' || item.slug === 'gd_2_5y_safety',
    );

    expect(transitioned).toHaveLength(2);
    for (const item of transitioned) {
      expect(item.sourceIds).toContain('cdc-positive-parenting-toddlers-2-3-2026');
      expect(item.sourceIds).not.toContain('cdc-positive-parenting-toddlers-2026');
    }
  });

  it('regenerates the exact manifest and sequence-11 routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_MANIFEST))
      .toBe(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration)))
      .toBe(CLINICAL_CHILD_DEVELOPMENT_REFREEZE_BATCH_ROUTING_HASH);
  });

  it('keeps the Production audit bounded and preserves its committed git base', () => {
    const auditSource = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalChildDevelopmentRefreezeBatch.mts'),
      'utf8',
    );

    expect(auditSource).toContain('gitBase: committedFixture?.frozenFrom.gitBase');
    expect(auditSource).not.toContain('.collect()');
    expect(auditSource).not.toContain('CONTENT_SEED');
    expect(auditSource).toContain('CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED_SHA256');
    expect(auditSource).toContain('take(51)');
    expect(auditSource).toContain('take(201)');
  });
});
