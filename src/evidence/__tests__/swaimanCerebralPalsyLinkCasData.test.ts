import { describe, expect, it } from 'vitest';
import {
  SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
  SWAIMAN_CEREBRAL_PALSY_MEDIA_PREIMAGES,
  SWAIMAN_CEREBRAL_PALSY_REVIEW_PREIMAGES,
  SWAIMAN_CEREBRAL_PALSY_SOURCE_ID,
  SWAIMAN_CEREBRAL_PALSY_SOURCE_PREIMAGES,
  SWAIMAN_CEREBRAL_PALSY_TARGET,
  isSwaimanCerebralPalsyLinkCasTarget,
} from '../../../convex/lib/swaimanCerebralPalsyLinkCasData';
import { EVIDENCE_LINKS } from '../links';

describe('Swaiman cerebral-palsy exact CAS data', () => {
  it('freezes the unique content, link, media and review preimages', () => {
    expect(SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID)
      .toBe('2026-08-21-swaiman-cerebral-palsy-link-v1');
    expect(SWAIMAN_CEREBRAL_PALSY_TARGET).toMatchObject({
      kind: 'special_need',
      slug: 'sn_cerebral_palsy',
      contentId: 'kx75znvhv5y88az3cv0j1mjbdh8b8ktj',
      contentInitialReviewRevision: 3,
      contentDesiredReviewRevision: 4,
      linkId: 'k973e3b7chr9t189f5v291hhmh8b9179',
    });
    expect(SWAIMAN_CEREBRAL_PALSY_MEDIA_PREIMAGES).toHaveLength(1);
    expect(SWAIMAN_CEREBRAL_PALSY_REVIEW_PREIMAGES).toHaveLength(3);
    expect(SWAIMAN_CEREBRAL_PALSY_SOURCE_PREIMAGES).toHaveLength(3);
    expect(new Set(SWAIMAN_CEREBRAL_PALSY_REVIEW_PREIMAGES.map(
      (row) => row.rowId,
    )).size).toBe(3);
  });

  it('keeps only the claim-direct NICE guideline in the protected postimage', () => {
    expect(SWAIMAN_CEREBRAL_PALSY_TARGET.initialSourceIds)
      .toContain(SWAIMAN_CEREBRAL_PALSY_SOURCE_ID);
    expect(SWAIMAN_CEREBRAL_PALSY_TARGET.desiredSourceIds)
      .toEqual(['nice-ng62-cerebral-palsy-2017']);
    expect(SWAIMAN_CEREBRAL_PALSY_TARGET.desiredSourceIds)
      .not.toContain(SWAIMAN_CEREBRAL_PALSY_SOURCE_ID);

    const link = EVIDENCE_LINKS.find((candidate) => candidate.kind === 'special_need'
      && candidate.slug === SWAIMAN_CEREBRAL_PALSY_TARGET.slug);
    expect(link?.sourceIds).toEqual(SWAIMAN_CEREBRAL_PALSY_TARGET.desiredSourceIds);
  });

  it('guards only the exact kind and slug at the generic import boundary', () => {
    expect(isSwaimanCerebralPalsyLinkCasTarget('special_need', 'sn_cerebral_palsy'))
      .toBe(true);
    expect(isSwaimanCerebralPalsyLinkCasTarget('guide', 'sn_cerebral_palsy'))
      .toBe(false);
    expect(isSwaimanCerebralPalsyLinkCasTarget('special_need', 'not-a-target'))
      .toBe(false);
  });
});
