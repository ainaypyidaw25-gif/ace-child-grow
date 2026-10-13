import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_P1_REMAINING_BATCH_EXPIRES_AT,
  CLINICAL_P1_REMAINING_BATCH_FROZEN_AT,
  CLINICAL_P1_REMAINING_BATCH_HASH,
  CLINICAL_P1_REMAINING_BATCH_ITEMS,
  CLINICAL_P1_REMAINING_BATCH_MANIFEST,
  CLINICAL_P1_REMAINING_BATCH_PREIMAGES,
  CLINICAL_P1_REMAINING_BATCH_ROUTING_HASH,
  CLINICAL_P1_REMAINING_PREVIOUS_RECEIPT_DIGEST,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('sequence-18 remaining P1 clinical batch data', () => {
  const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find((row) => row.sequence === 18);

  it('freezes the exact 25 remaining unassigned P1 clinical targets for Phyo Ko Ko', () => {
    expect(registration).toMatchObject({
      sequence: 18,
      dimension: 'clinical',
      authority: 'release',
      activation: {
        kind: 'after_handoff',
        previousBatchId: 'clinical-social-guide-gd-7-9m-2026-10-13-v1',
        expectedPreviousFreezeDigest: '34f5597d338778bee0168c6924acf24032ecabffde3cd53bafa6646287fcbf9a',
      },
      manifest: CLINICAL_P1_REMAINING_BATCH_MANIFEST,
    });
    expect(CLINICAL_P1_REMAINING_BATCH_ITEMS).toHaveLength(25);
    expect(CLINICAL_P1_REMAINING_BATCH_ITEMS.map((item) => item.ordinal))
      .toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    expect(CLINICAL_P1_REMAINING_BATCH_ITEMS[0]).toMatchObject({
      slug: 'gd_7_9m_communication', currentClinicalReviewCount: 0,
    });
    expect(CLINICAL_P1_REMAINING_BATCH_ITEMS[24]).toMatchObject({
      slug: 'act_texture_touch', currentClinicalReviewCount: 0,
    });
    expect(CLINICAL_P1_REMAINING_BATCH_MANIFEST.reviewer).toMatchObject({
      displayName: 'Phyo Ko Ko', qualification: 'MBBS', role: 'clinical_reviewer',
    });
  });

  it('binds the completed sequence-17 receipt and exact production snapshot', () => {
    expect(CLINICAL_P1_REMAINING_BATCH_PREIMAGES.frozenFrom).toEqual({
      deployment: 'graceful-possum-566',
      checkedAt: '2026-10-13T20:35:05.878Z',
      gitBase: '5cbcb8c5c30c426a8f2c02fd62468fcefd728922',
    });
    expect(CLINICAL_P1_REMAINING_PREVIOUS_RECEIPT_DIGEST)
      .toBe('ff3f3f3efb7f1b4e20c8dd476344a65d73442e78fe3cb86e177a1e8e640cd548');
    expect(CLINICAL_P1_REMAINING_BATCH_EXPIRES_AT - CLINICAL_P1_REMAINING_BATCH_FROZEN_AT)
      .toBe(14 * 24 * 60 * 60 * 1000);
  });

  it('regenerates the manifest and routing digests', async () => {
    expect(await sha256Canonical(CLINICAL_P1_REMAINING_BATCH_MANIFEST))
      .toBe(CLINICAL_P1_REMAINING_BATCH_HASH);
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration!)))
      .toBe(CLINICAL_P1_REMAINING_BATCH_ROUTING_HASH);
  });

  it('keeps the production audit bounded and fail-closed', () => {
    const source = readFileSync(resolve(process.cwd(), 'scripts/auditClinicalP1RemainingBatch.mts'), 'utf8');
    expect(source).not.toContain('.collect()');
    expect(source).toContain('currentClinical.length === 0');
    expect(source).toContain("priority.priority === 'P1'");
    expect(source).toContain('predecessorExact');
    expect(source).toContain('applyFailClosedAuditExit(allExact, process)');
  });
});
