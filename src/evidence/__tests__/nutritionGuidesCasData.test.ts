import { describe, expect, it } from 'vitest';
import { requiredPublicationReviews } from '../../../convex/lib/contentReviewRequirements';
import {
  desiredNutritionGuideData,
  desiredNutritionGuideSearchText,
  isNutritionGuidesCasSource,
  isNutritionGuidesCasTarget,
  isNutritionGuidesCasTargetSlug,
  NUTRITION_GUIDES_CAS_TARGETS,
  NUTRITION_GUIDES_NEW_SOURCES,
  NUTRITION_GUIDES_REQUIRED_REVIEW_DIMENSIONS,
} from '../../../convex/lib/nutritionGuidesCasData';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';
import { EVIDENCE_SOURCES } from '../sources';

describe('nutrition guide exact two-phase CAS data', () => {
  it('keeps the three authored guides on the bounded desired bilingual payloads', () => {
    for (const target of NUTRITION_GUIDES_CAS_TARGETS) {
      const item = CONTENT_SEED.find((candidate) => candidate.slug === target.slug);
      expect(item, target.slug).toBeDefined();
      expect(item?.type).toBe('guide');
      const desiredData = desiredNutritionGuideData(target.slug, item?.data);
      expect(item?.data).toEqual(desiredData);
      expect(item?.searchText).toBe(desiredNutritionGuideSearchText(item!, desiredData));
      expect(item?.clinicalStatus).toBe('clinical_review');

      const link = EVIDENCE_LINKS.find((candidate) => (
        candidate.kind === target.kind && candidate.slug === target.slug
      ));
      expect(link?.sourceIds, target.slug).toEqual(target.desiredSourceIds);
      expect(target.contentDesiredReviewRevision).toBe(target.contentInitialReviewRevision + 1);
      expect(new Set(requiredPublicationReviews(item!))).toEqual(
        new Set(NUTRITION_GUIDES_REQUIRED_REVIEW_DIMENSIONS),
      );
    }
  });

  it('states the exact 3–5 day, cow-milk and clinician boundaries without overclaiming', () => {
    const five = CONTENT_SEED.find((item) => item.slug === 'gd_5_6m_nutrition');
    const seven = CONTENT_SEED.find((item) => item.slug === 'gd_7_9m_nutrition');
    const ten = CONTENT_SEED.find((item) => item.slug === 'gd_10_12m_nutrition');
    const text = JSON.stringify([five?.data, seven?.data, ten?.data]);
    expect(text).toContain('3 to 5 days');
    expect(text).toContain('၃ ရက်မှ ၅ ရက်');
    expect(text).toContain('not cow’s milk as a main drink before 12 months');
    expect(text).toContain('severe eczema or egg allergy');
    expect(text).toContain('has previously reacted to a food');
    expect(text).not.toContain('family history of allergy');
  });

  it('authors only the two exact sources as unapproved human-review work', () => {
    expect(NUTRITION_GUIDES_NEW_SOURCES).toHaveLength(2);
    for (const expected of NUTRITION_GUIDES_NEW_SOURCES) {
      const authored = EVIDENCE_SOURCES.find((source) => source.id === expected.sourceId);
      expect(authored).toMatchObject({
        id: expected.sourceId,
        org: expected.org,
        title: expected.title,
        url: expected.url,
        doi: expected.doi,
        pmid: expected.pmid,
        verifiedOn: expected.verifiedOn,
        verifiedNote: expected.verifiedNote,
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewDate: null,
        nextReviewDate: null,
      });
      expect(expected.verifiedOn).toBe('2026-08-24');
    }
  });

  it('guards only the exact three content/link keys and two source ids', () => {
    for (const target of NUTRITION_GUIDES_CAS_TARGETS) {
      expect(isNutritionGuidesCasTargetSlug(target.slug)).toBe(true);
      expect(isNutritionGuidesCasTarget('guide', target.slug)).toBe(true);
      expect(isNutritionGuidesCasTarget('milestone', target.slug)).toBe(false);
    }
    expect(isNutritionGuidesCasTargetSlug('gd_5_6m_play')).toBe(false);
    expect(isNutritionGuidesCasSource('cdc-introduce-solid-foods-2026')).toBe(true);
    expect(isNutritionGuidesCasSource('jr-niaid-peanut-prevention-2017')).toBe(true);
    expect(isNutritionGuidesCasSource('cdc-cows-milk-2026')).toBe(false);
  });
});
