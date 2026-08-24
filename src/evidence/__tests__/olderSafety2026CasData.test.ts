import { describe, expect, it } from 'vitest';
import {
  AAP_DROWNING_2021_DESIRED_REVERSE_KEYS,
  AAP_DROWNING_2021_INITIAL_REVERSE_KEYS,
  AAP_DROWNING_2021_SOURCE_ID,
  AAP_DROWNING_2026_SOURCE_ID,
  CDC_PRESCHOOL_SOURCE_ID,
  CDC_TODDLER_SOURCE_ID,
  CPSC_CHILDPROOFING_SOURCE_ID,
  GD_19_24M_SAFETY_DESIRED_COPY,
  OLDER_SAFETY_2026_RELEASE_ID,
  OLDER_SAFETY_2026_STAGED_SOURCES,
  OLDER_SAFETY_2026_TARGETS,
  OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS,
  isOlderSafety2026ContentTargetSlug,
  isOlderSafety2026LinkTarget,
  isOlderSafety2026SourceTarget,
} from '../../../convex/lib/olderSafety2026CasData';
import { seedRunSkipsItem } from '../../../convex/seed';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';
import { SOURCE_BY_ID } from '../sources';

describe('older-safety current-evidence exact CAS data', () => {
  it('freezes nine distinct review-bound targets and the exact AAP reverse graph', () => {
    expect(OLDER_SAFETY_2026_RELEASE_ID)
      .toBe('2026-08-23-older-safety-current-evidence-v1');
    expect(OLDER_SAFETY_2026_TARGETS).toHaveLength(9);
    expect(new Set(OLDER_SAFETY_2026_TARGETS.map((target) => target.slug)).size).toBe(9);
    expect(AAP_DROWNING_2021_INITIAL_REVERSE_KEYS).toHaveLength(33);
    expect(AAP_DROWNING_2021_DESIRED_REVERSE_KEYS).toHaveLength(24);

    const removed = AAP_DROWNING_2021_INITIAL_REVERSE_KEYS.filter(
      (key) => !AAP_DROWNING_2021_DESIRED_REVERSE_KEYS.includes(key as never),
    );
    expect(removed).toEqual(OLDER_SAFETY_2026_TARGETS.map(
      (target) => `${target.kind}:${target.slug}`,
    ).sort((left, right) => left.localeCompare(right)));
  });

  it('keeps authored content and generated evidence links on the intended postimages', () => {
    for (const target of OLDER_SAFETY_2026_TARGETS) {
      const item = CONTENT_SEED.find((candidate) => candidate.slug === target.slug);
      const link = EVIDENCE_LINKS.find((candidate) => (
        candidate.kind === target.kind && candidate.slug === target.slug
      ));
      expect(item?.type, target.slug).toBe('guide');
      expect(item?.clinicalStatus, target.slug).toBe('clinical_review');
      expect(link?.sourceIds, target.slug).toEqual(target.desiredSourceIds);
      expect(target.desiredSourceIds).not.toContain(AAP_DROWNING_2021_SOURCE_ID);
      expect(target.desiredSourceIds[0]).toBe(AAP_DROWNING_2026_SOURCE_ID);
      if (target.slug === 'gd_19_24m_safety') {
        expect(target.desiredSourceIds).toContain(CPSC_CHILDPROOFING_SOURCE_ID);
      } else {
        expect(target.desiredSourceIds).not.toContain(CPSC_CHILDPROOFING_SOURCE_ID);
      }
    }

    expect(OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS).toEqual([
      'native_myanmar',
      'english',
      'child_development',
      'evidence',
      'safety',
      'clinical',
    ]);
  });

  it('uses exact age-matched CDC coverage, including the 60–66-month guide', () => {
    const toddler = SOURCE_BY_ID.get(CDC_TODDLER_SOURCE_ID)!;
    const preschool = SOURCE_BY_ID.get(CDC_PRESCHOOL_SOURCE_ID)!;
    expect(toddler).toMatchObject({ ageMonthsMin: 12, ageMonthsMax: 36 });
    expect(preschool).toMatchObject({ ageMonthsMin: 36, ageMonthsMax: 71 });

    for (const target of OLDER_SAFETY_2026_TARGETS) {
      const source = target.ageMonthsMin >= 36 ? preschool : toddler;
      expect(source.ageMonthsMin!, target.slug).toBeLessThanOrEqual(target.ageMonthsMin);
      expect(source.ageMonthsMax!, target.slug).toBeGreaterThanOrEqual(target.ageMonthsMax);
      expect(target.desiredSourceIds, target.slug).toContain(source.id);
    }

    const fiveYear = OLDER_SAFETY_2026_TARGETS.find(
      (target) => target.slug === 'gd_5y_safety',
    )!;
    expect(fiveYear).toMatchObject({ ageMonthsMin: 60, ageMonthsMax: 66 });
    expect(fiveYear.desiredSourceIds).toContain(CDC_PRESCHOOL_SOURCE_ID);
  });

  it('records only publisher-verified source metadata and no manufactured approval', () => {
    expect(OLDER_SAFETY_2026_STAGED_SOURCES).toHaveLength(3);
    const aap = SOURCE_BY_ID.get(AAP_DROWNING_2026_SOURCE_ID)!;
    expect(aap).toMatchObject({
      title: 'Prevention of Drowning: Policy Statement',
      doi: '10.1542/peds.2026-077410',
      pmid: '42144630',
      ageMonthsMin: 0,
      ageMonthsMax: null,
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewDate: null,
    });
    expect(aap.url).toContain('publications.aap.org/pediatrics/article/doi/');

    const cpsc = SOURCE_BY_ID.get(CPSC_CHILDPROOFING_SOURCE_ID)!;
    expect(cpsc.verifiedNote).toContain('four inches or less');
    expect(cpsc.verifiedNote).toContain('fire escape');
    expect(cpsc.reviewStatus).toBe('awaiting_review');

    for (const staged of OLDER_SAFETY_2026_STAGED_SOURCES) {
      const { sourceId, ...metadata } = staged;
      expect(SOURCE_BY_ID.get(staged.sourceId)).toMatchObject({
        ...metadata,
        id: sourceId,
        keywords: [...staged.keywords],
        topics: [...staged.topics],
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewDate: null,
      });
    }
  });

  it('preserves the non-authoritative v1 copy only as a frozen audit artifact', () => {
    const item = CONTENT_SEED.find((candidate) => candidate.slug === 'gd_19_24m_safety')!;
    const data = item.data as Record<string, unknown>;
    expect(item.summaryMm).not.toBe(GD_19_24M_SAFETY_DESIRED_COPY.mm);
    expect(item.summaryEn).not.toBe(GD_19_24M_SAFETY_DESIRED_COPY.en);
    expect(data.why).not.toEqual({
      mm: GD_19_24M_SAFETY_DESIRED_COPY.mm,
      en: GD_19_24M_SAFETY_DESIRED_COPY.en,
    });
    expect(data.evidenceSummary).toBe(GD_19_24M_SAFETY_DESIRED_COPY.evidenceSummary);
    expect(GD_19_24M_SAFETY_DESIRED_COPY.en).toContain('no more than four inches');
    expect(GD_19_24M_SAFETY_DESIRED_COPY.en).toContain('fire escape');
    expect(GD_19_24M_SAFETY_DESIRED_COPY.en).toContain('Move climbable furniture away');
  });

  it('reserves only the exact source, link and seed targets for bounded release code', () => {
    for (const target of OLDER_SAFETY_2026_TARGETS) {
      expect(isOlderSafety2026ContentTargetSlug(target.slug)).toBe(true);
      expect(isOlderSafety2026LinkTarget(target.kind, target.slug)).toBe(true);
      expect(seedRunSkipsItem({ type: target.kind, slug: target.slug })).toBe(true);
    }
    for (const source of OLDER_SAFETY_2026_STAGED_SOURCES) {
      expect(isOlderSafety2026SourceTarget(source.sourceId)).toBe(true);
    }
    expect(isOlderSafety2026ContentTargetSlug('gd_5y_sleep')).toBe(false);
    expect(isOlderSafety2026LinkTarget('milestone', 'gd_5y_safety')).toBe(false);
    expect(isOlderSafety2026SourceTarget(AAP_DROWNING_2021_SOURCE_ID)).toBe(false);
  });
});
