import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_REGISTRY,
  CLINICAL_SOCIAL_GUIDE_BATCH_EXPIRES_AT,
  CLINICAL_SOCIAL_GUIDE_BATCH_FROZEN_AT,
  CLINICAL_SOCIAL_GUIDE_BATCH_HASH,
  CLINICAL_SOCIAL_GUIDE_BATCH_ITEMS,
  CLINICAL_SOCIAL_GUIDE_BATCH_MANIFEST,
  CLINICAL_SOCIAL_GUIDE_BATCH_PREIMAGES,
  CLINICAL_SOCIAL_GUIDE_BATCH_ROUTING_HASH,
  CLINICAL_SOCIAL_GUIDE_PREVIOUS_RECEIPT_DIGEST,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('sequence-17 clinical social-guide batch data', () => {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
    (row) => row.sequence === 17,
  );

  it('freezes only the requested 7-9 month social guide for Phyo Ko Ko', () => {
    expect(registration).toBeDefined();
    expect(CLINICAL_REVIEW_BATCH_REGISTRY).toHaveLength(17);
    expect(registration).toMatchObject({
      sequence: 17,
      dimension: 'clinical',
      authority: 'release',
      activation: {
        kind: 'after_handoff',
        previousBatchId: 'clinical-review-successor-14-2026-09-01-v1',
        expectedPreviousFreezeDigest:
          'eab7019857b1ea753e1f66fba8c237ab1a601867a8d5fbc080a3eac2c310f18d',
      },
      manifest: CLINICAL_SOCIAL_GUIDE_BATCH_MANIFEST,
    });
    expect(CLINICAL_SOCIAL_GUIDE_BATCH_ITEMS).toHaveLength(1);
    expect(CLINICAL_SOCIAL_GUIDE_BATCH_ITEMS[0]).toMatchObject({
      ordinal: 1,
      kind: 'guide',
      slug: 'gd_7_9m_social',
      reviewRevision: 1,
      currentClinicalReviewCount: 0,
    });
    expect(CLINICAL_SOCIAL_GUIDE_BATCH_MANIFEST.reviewer).toMatchObject({
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
    });
  });

  it('binds the completed sequence-16 handoff and exact production snapshot', () => {
    expect(CLINICAL_SOCIAL_GUIDE_BATCH_PREIMAGES.frozenFrom).toEqual({
      deployment: 'graceful-possum-566',
      checkedAt: '2026-10-13T07:32:14.237Z',
      gitBase: '187b06665e4894fda2f7008139be40216381da21',
    });
    expect(CLINICAL_SOCIAL_GUIDE_PREVIOUS_RECEIPT_DIGEST)
      .toBe('ccef5ccffba62137f697a2f80f22451b5ab761421bc85d5cb62ef02baa759178');
    expect(CLINICAL_SOCIAL_GUIDE_BATCH_EXPIRES_AT
      - CLINICAL_SOCIAL_GUIDE_BATCH_FROZEN_AT).toBe(14 * 24 * 60 * 60 * 1000);
    expect(CLINICAL_SOCIAL_GUIDE_BATCH_ITEMS[0].upstreamReviewDigests
      ?.map((entry) => entry.dimension)).toEqual([
      'all_review_history',
      'all_nonclinical_history',
      'native_myanmar',
      'english',
      'child_development',
      'evidence',
      'safety',
    ]);
  });

  it('regenerates the manifest and routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_SOCIAL_GUIDE_BATCH_MANIFEST))
      .toBe(CLINICAL_SOCIAL_GUIDE_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration!)))
      .toBe(CLINICAL_SOCIAL_GUIDE_BATCH_ROUTING_HASH);
  });

  it('keeps the production audit bounded and fail-closed', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'scripts/auditClinicalSocialGuideBatch.mts'),
      'utf8',
    );
    expect(source).not.toContain('.collect()');
    expect(source).toContain('currentClinical.length === 0');
    expect(source).toContain('predecessorExact');
    expect(source).toContain('applyFailClosedAuditExit(allExact, process)');
  });
});
