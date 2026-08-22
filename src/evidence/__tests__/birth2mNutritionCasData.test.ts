import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { requiredPublicationReviews } from '../../../convex/lib/contentReviewRequirements';
import {
  BIRTH2M_NUTRITION_CAS_RELEASE_ID,
  BIRTH2M_NUTRITION_CONTENT_PREIMAGE,
  BIRTH2M_NUTRITION_DESIRED_DATA,
  BIRTH2M_NUTRITION_DESIRED_SEARCH_TEXT,
  BIRTH2M_NUTRITION_LINK_PREIMAGE,
  BIRTH2M_NUTRITION_MEDIA_PREIMAGES,
  BIRTH2M_NUTRITION_REQUIRED_REVISION_3_REVIEWS,
  BIRTH2M_NUTRITION_REVIEW_PREIMAGES,
  BIRTH2M_NUTRITION_SOURCE_PREIMAGES,
  BIRTH2M_NUTRITION_TARGET,
  isBirth2mNutritionCasTarget,
  isBirth2mNutritionCasTargetSlug,
} from '../../../convex/lib/birth2mNutritionCasData';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';

describe('birth-to-2-month nutrition exact CAS data', () => {
  it('pins raw Production documents to the repo runtime canonicalizer', async () => {
    expect(BIRTH2M_NUTRITION_CAS_RELEASE_ID)
      .toBe('2026-08-22-birth-2m-nutrition-content-evidence-v1');
    expect(await sha256Canonical(BIRTH2M_NUTRITION_CONTENT_PREIMAGE.document))
      .toBe('568bdaf6faea146c0e2ab06f02073637a61664877e36523457c76101961fdcf3');
    expect(await sha256Canonical(BIRTH2M_NUTRITION_LINK_PREIMAGE.document))
      .toBe('b670f98806d7ba946beaefdf9bc47ac484088473dc1170e89eac209bc7a2038d');

    for (const expected of [
      ...BIRTH2M_NUTRITION_REVIEW_PREIMAGES,
      ...BIRTH2M_NUTRITION_SOURCE_PREIMAGES,
    ]) {
      expect(await sha256Canonical(expected.document), expected.rowId)
        .toBe(expected.exactCanonicalSha256);
    }
    expect(BIRTH2M_NUTRITION_REVIEW_PREIMAGES).toHaveLength(5);
    expect(BIRTH2M_NUTRITION_MEDIA_PREIMAGES).toEqual([]);
    expect(BIRTH2M_NUTRITION_SOURCE_PREIMAGES.map((row) => row.sourceId))
      .toEqual(BIRTH2M_NUTRITION_TARGET.desiredSourceIds);
  });

  it('keeps the authored and generated payload on the exact safe postimage', () => {
    const item = CONTENT_SEED.find((candidate) => (
      candidate.slug === BIRTH2M_NUTRITION_TARGET.slug
    ));
    expect(item).toBeDefined();
    expect(item?.type).toBe('milestone');
    expect(item?.data).toEqual(BIRTH2M_NUTRITION_DESIRED_DATA);
    expect(item?.searchText).toBe(BIRTH2M_NUTRITION_DESIRED_SEARCH_TEXT);
    expect(item?.clinicalStatus).toBe('clinical_review');

    const link = EVIDENCE_LINKS.find((candidate) => (
      candidate.kind === BIRTH2M_NUTRITION_TARGET.kind
      && candidate.slug === BIRTH2M_NUTRITION_TARGET.slug
    ));
    expect(link?.sourceIds).toEqual(BIRTH2M_NUTRITION_TARGET.desiredSourceIds);
  });

  it('starts revision 3 with all six human review dimensions outstanding', () => {
    const item = CONTENT_SEED.find((candidate) => (
      candidate.slug === BIRTH2M_NUTRITION_TARGET.slug
    ));
    expect(item).toBeDefined();
    expect(BIRTH2M_NUTRITION_REQUIRED_REVISION_3_REVIEWS).toEqual([
      'native_myanmar',
      'english',
      'child_development',
      'evidence',
      'safety',
      'clinical',
    ]);
    expect(new Set(requiredPublicationReviews(item!))).toEqual(
      new Set(BIRTH2M_NUTRITION_REQUIRED_REVISION_3_REVIEWS),
    );
    expect(BIRTH2M_NUTRITION_REVIEW_PREIMAGES.every((row) => (
      row.document.reviewRevision === 2
      && row.document.decision === 'approved'
    ))).toBe(true);
  });

  it('guards only the exact content slug and evidence key', () => {
    expect(isBirth2mNutritionCasTargetSlug('ms_birth_2m_nutrition_1')).toBe(true);
    expect(isBirth2mNutritionCasTargetSlug('ms_birth_2m_nutrition_2')).toBe(false);
    expect(isBirth2mNutritionCasTarget('milestone', 'ms_birth_2m_nutrition_1'))
      .toBe(true);
    expect(isBirth2mNutritionCasTarget('guide', 'ms_birth_2m_nutrition_1'))
      .toBe(false);
  });
});
