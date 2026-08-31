import { describe, expect, it } from 'vitest';

import { frozenUpstreamReviewHistoryBlockers } from '../../../convex/clinicalReviewBatch';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_NEWBORN_REFREEZE_BATCH_HASH,
  CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
  CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
  CLINICAL_NUTRITION_RELEASE_BATCH_ITEMS,
  CLINICAL_NUTRITION_RELEASE_BATCH_MANIFEST,
  CLINICAL_NUTRITION_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchItem,
} from '../../../convex/lib/clinicalReviewBatchData';

describe('frozen infant-nutrition clinical release batch', () => {
  it('contains only the three exact post-CAS guide revisions and regenerated digests', async () => {
    const registration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
      (entry) => entry.manifest.batchId === CLINICAL_NUTRITION_RELEASE_BATCH_MANIFEST.batchId,
    );
    if (!registration) throw new Error('Missing infant-nutrition release registration');
    expect(registration).toMatchObject({
      sequence: 4,
      laneGraphVersion: 1,
      dimension: 'clinical',
      authority: 'release',
      activation: {
        kind: 'after_handoff',
        previousBatchId: CLINICAL_NEWBORN_REFREEZE_BATCH_ID,
        expectedPreviousFreezeDigest: CLINICAL_NEWBORN_REFREEZE_BATCH_HASH,
      },
    });
    expect(CLINICAL_NUTRITION_RELEASE_BATCH_ITEMS.map((item) => (
      `${item.kind}:${item.slug}@${item.reviewRevision}`
    ))).toEqual([
      'guide:gd_5_6m_nutrition@8',
      'guide:gd_7_9m_nutrition@3',
      'guide:gd_10_12m_nutrition@8',
    ]);
    expect(await sha256Canonical(CLINICAL_NUTRITION_RELEASE_BATCH_MANIFEST)).toBe(
      CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
    );
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(registration))).toBe(
      CLINICAL_NUTRITION_RELEASE_BATCH_ROUTING_HASH,
    );
  });

  it('binds the exact reviewer and exposes a claim-specific advisory for every guide', () => {
    expect(CLINICAL_NUTRITION_RELEASE_BATCH_MANIFEST.reviewer).toMatchObject({
      profileId: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
      userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
      displayName: 'Phyo Ko Ko',
      qualification: 'MBBS',
      role: 'clinical_reviewer',
      identityCanonicalSha256: 'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
    });
    for (const item of CLINICAL_NUTRITION_RELEASE_BATCH_ITEMS) {
      expect(item.reviewerAdvisory.mm.trim().length).toBeGreaterThan(40);
      expect(item.reviewerAdvisory.en.trim().length).toBeGreaterThan(40);
      expect(item.currentClinicalReviewCount).toBe(0);
      expect(item.upstreamReviewDigests.map((entry) => entry.dimension)).toEqual([
        'all_review_history',
        'all_nonclinical_history',
        'english',
        'native_myanmar',
        'child_development',
        'evidence',
        'safety',
      ]);
    }
  });

  it('fails closed when any digest-bound review history changes', async () => {
    const rows = [
      { _id: 'review-b', dimension: 'native_myanmar', contentSlug: 'guide', note: 'mm' },
      { _id: 'review-a', dimension: 'english', contentSlug: 'guide', note: 'en' },
    ];
    const sorted = [...rows].sort((left, right) => left._id.localeCompare(right._id));
    const item = {
      ...CLINICAL_NUTRITION_RELEASE_BATCH_ITEMS[0],
      upstreamReviewDigests: [
        { dimension: 'all_review_history', digest: await sha256Canonical(sorted) },
        { dimension: 'all_nonclinical_history', digest: await sha256Canonical(sorted) },
        {
          dimension: 'english',
          digest: await sha256Canonical(sorted.filter((row) => row.dimension === 'english')),
        },
        {
          dimension: 'native_myanmar',
          digest: await sha256Canonical(sorted.filter((row) => row.dimension === 'native_myanmar')),
        },
      ],
    } as unknown as ClinicalReviewBatchItem;
    await expect(frozenUpstreamReviewHistoryBlockers(item, rows as never)).resolves.toEqual([]);

    const drifted = rows.map((row) => row._id === 'review-a' ? { ...row, note: 'changed' } : row);
    await expect(frozenUpstreamReviewHistoryBlockers(item, drifted as never)).resolves.toEqual([
      'upstream_review_history_drift:all_review_history',
      'upstream_review_history_drift:all_nonclinical_history',
      'upstream_review_history_drift:english',
    ]);
  });
});
