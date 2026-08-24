import { describe, expect, it } from 'vitest';
import seedData from '../../../convex/seedData.json';
import {
  AAP_DROWNING_2021_DESIRED_REVERSE_KEYS,
  AAP_DROWNING_2021_INITIAL_REVERSE_KEYS,
  AAP_DROWNING_2021_SOURCE_ID,
  AAP_DROWNING_2026_SOURCE_ID,
  CPSC_CHILDPROOFING_SOURCE_ID,
  GD_19_24M_SAFETY_V2_DESIRED_COPY,
  OLDER_SAFETY_2026_STAGED_SOURCES,
  OLDER_SAFETY_2026_TARGETS,
  OLDER_SAFETY_2026_V1_RELEASE_ID,
  OLDER_SAFETY_2026_V2_RELEASE_ID,
  OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES,
  OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS,
  isOlderSafety2026ContentTargetSlug,
  isOlderSafety2026LinkTarget,
  isOlderSafety2026SourceTarget,
} from '../../../convex/lib/olderSafety2026CasV2Data';
import { CONTENT_SEED } from '../../content/seed';
import { EVIDENCE_LINKS } from '../links';

const unsupportedEn = 'Move climbable furniture away';
const unsupportedMm = 'တက်နိုင်သော ပရိဘောဂများကို ဝေးရာရွှေ့';

describe('older-safety corrected v2 exact CAS data', () => {
  it('uses a new literal v2 identity and keeps all frozen v1 preimages intact', () => {
    expect(OLDER_SAFETY_2026_V2_RELEASE_ID)
      .toBe('2026-08-24-older-safety-current-evidence-v2');
    expect(OLDER_SAFETY_2026_V1_RELEASE_ID)
      .toBe('2026-08-23-older-safety-current-evidence-v1');
    expect(OLDER_SAFETY_2026_V2_RELEASE_ID).not.toBe(OLDER_SAFETY_2026_V1_RELEASE_ID);
    expect(OLDER_SAFETY_2026_TARGETS).toHaveLength(9);
    expect(OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES).toHaveLength(3);
    expect(AAP_DROWNING_2021_INITIAL_REVERSE_KEYS).toHaveLength(33);
    expect(AAP_DROWNING_2021_DESIRED_REVERSE_KEYS).toHaveLength(24);
    for (const target of OLDER_SAFETY_2026_TARGETS) {
      expect(target.contentInitialCanonicalSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(target.linkInitialCanonicalSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(target.contentInitialReviewRevision).toBeGreaterThan(0);
    }
  });

  it('changes only the unsupported 19–24-month sentence in authored and generated seed', () => {
    const authored = CONTENT_SEED.find((row) => row.slug === 'gd_19_24m_safety')!;
    const generated = (seedData as Array<typeof authored>).find(
      (row) => row.slug === 'gd_19_24m_safety',
    )!;

    for (const row of [authored, generated]) {
      const data = row.data as Record<string, unknown>;
      expect(row.summaryMm).toBe(GD_19_24M_SAFETY_V2_DESIRED_COPY.mm);
      expect(row.summaryEn).toBe(GD_19_24M_SAFETY_V2_DESIRED_COPY.en);
      expect(data.why).toEqual({
        mm: GD_19_24M_SAFETY_V2_DESIRED_COPY.mm,
        en: GD_19_24M_SAFETY_V2_DESIRED_COPY.en,
      });
      expect(data.evidenceSummary).toBe(GD_19_24M_SAFETY_V2_DESIRED_COPY.evidenceSummary);

      const exactFields = [
        row.summaryMm,
        row.summaryEn,
        (data.why as { mm: string; en: string }).mm,
        (data.why as { mm: string; en: string }).en,
        row.searchText,
      ].join('\n');
      expect(exactFields).not.toContain(unsupportedEn);
      expect(exactFields).not.toContain(unsupportedEn.toLowerCase());
      expect(exactFields).not.toContain(unsupportedMm);
      expect(exactFields).toContain('no more than four inches');
      expect(exactFields).toContain('fire escape');
      expect(exactFields.toLowerCase()).toContain('anchor heavy furniture securely to the wall');
      expect(exactFields.toLowerCase()).toContain('lock medicines and cleaning products out of reach');
    }

    expect(generated).toEqual(authored);
  });

  it('preserves ordered evidence links, reverse graph and review/AI invariants', () => {
    for (const target of OLDER_SAFETY_2026_TARGETS) {
      const link = EVIDENCE_LINKS.find(
        (candidate) => candidate.kind === target.kind && candidate.slug === target.slug,
      );
      const item = CONTENT_SEED.find((candidate) => candidate.slug === target.slug);
      expect(link?.sourceIds, target.slug).toEqual(target.desiredSourceIds);
      expect(target.desiredSourceIds[0], target.slug).toBe(AAP_DROWNING_2026_SOURCE_ID);
      expect(target.desiredSourceIds, target.slug).not.toContain(AAP_DROWNING_2021_SOURCE_ID);
      expect(item, target.slug).toMatchObject({
        clinicalStatus: 'clinical_review',
        media: [],
      });
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

  it('keeps all protected source/link/content predicates durable', () => {
    for (const target of OLDER_SAFETY_2026_TARGETS) {
      expect(isOlderSafety2026ContentTargetSlug(target.slug)).toBe(true);
      expect(isOlderSafety2026LinkTarget(target.kind, target.slug)).toBe(true);
    }
    for (const source of OLDER_SAFETY_2026_STAGED_SOURCES) {
      expect(isOlderSafety2026SourceTarget(source.sourceId)).toBe(true);
    }
    expect(isOlderSafety2026ContentTargetSlug('gd_5y_sleep')).toBe(false);
    expect(isOlderSafety2026LinkTarget('milestone', 'gd_5y_safety')).toBe(false);
    expect(isOlderSafety2026SourceTarget(AAP_DROWNING_2021_SOURCE_ID)).toBe(false);
  });
});
