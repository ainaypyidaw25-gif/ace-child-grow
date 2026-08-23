import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { requiredPublicationReviews } from '../../../convex/lib/contentReviewRequirements';
import {
  CLINICAL_TWO_SMALL_REQUIRED_REVIEWS,
  CLINICAL_TWO_SMALL_SOURCE_PREIMAGES,
  CLINICAL_TWO_SMALL_TARGETS,
  isClinicalTwoSmallCasSource,
  isClinicalTwoSmallCasTarget,
  isClinicalTwoSmallCasTargetSlug,
} from '../../../convex/lib/clinicalTwoSmallCasData';
import { EVIDENCE_LINKS } from '../links';

function authoredSnapshot(row: typeof CLINICAL_TWO_SMALL_TARGETS[number]['desiredContent']) {
  return {
    type: row.type,
    slug: row.slug,
    ageGroupKey: row.ageGroupKey,
    domainKey: row.domainKey,
    category: row.category,
    titleMm: row.titleMm,
    titleEn: row.titleEn,
    summaryMm: row.summaryMm,
    summaryEn: row.summaryEn,
    tags: row.tags,
    difficulty: row.difficulty,
    durationMinutes: row.durationMinutes,
    offline: row.offline,
    data: row.data,
    source: row.source,
    version: row.version,
  };
}

describe('clinical two-small exact CAS data', () => {
  it('freezes the exact local desired authored/search hashes', async () => {
    for (const target of CLINICAL_TWO_SMALL_TARGETS) {
      expect(await sha256Canonical(authoredSnapshot(target.desiredContent)))
        .toBe(target.desiredAuthoredSha256);
      expect(await sha256Canonical(target.desiredContent.searchText))
        .toBe(target.desiredSearchTextSha256);
      expect(requiredPublicationReviews({
        ...target.desiredContent,
        requiredReviewDimensions: [...CLINICAL_TWO_SMALL_REQUIRED_REVIEWS],
      })).toEqual([
        'english',
        'native_myanmar',
        'child_development',
        'evidence',
        'safety',
        'clinical',
      ]);
    }
  });

  it('removes only the AASM bedtime citation from the sleep guide', () => {
    const guide = CLINICAL_TWO_SMALL_TARGETS.find((target) => target.slug === 'gd_3_4m_sleep');
    expect(guide).toBeDefined();
    expect(guide!.initialSourceIds.filter((sourceId) => !guide!.desiredSourceIds.includes(sourceId)))
      .toEqual(['jr-aasm-bedtime-2006']);
    expect(EVIDENCE_LINKS.find((link) => (
      link.kind === guide!.kind && link.slug === guide!.slug
    ))?.sourceIds).toEqual(guide!.desiredSourceIds);

    const cerebralPalsy = CLINICAL_TWO_SMALL_TARGETS
      .find((target) => target.slug === 'sn_cerebral_palsy');
    expect(cerebralPalsy!.desiredSourceIds).toEqual(cerebralPalsy!.initialSourceIds);
  });

  it('guards both content/link rows and all six frozen sources', () => {
    for (const target of CLINICAL_TWO_SMALL_TARGETS) {
      expect(isClinicalTwoSmallCasTargetSlug(target.slug)).toBe(true);
      expect(isClinicalTwoSmallCasTarget(target.kind, target.slug)).toBe(true);
      expect(isClinicalTwoSmallCasTarget('wrong-kind', target.slug)).toBe(false);
    }
    for (const source of CLINICAL_TWO_SMALL_SOURCE_PREIMAGES) {
      expect(isClinicalTwoSmallCasSource(source.sourceId)).toBe(true);
    }
    expect(isClinicalTwoSmallCasTargetSlug('not-a-target')).toBe(false);
    expect(isClinicalTwoSmallCasSource('not-a-source')).toBe(false);
  });
});
