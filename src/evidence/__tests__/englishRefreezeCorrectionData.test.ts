import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  ENGLISH_REFREEZE_CONFIRMED_COPY,
  ENGLISH_REFREEZE_CORRECTION_FIXTURE_SHA256,
  ENGLISH_REFREEZE_CORRECTION_PREIMAGES,
  ENGLISH_REFREEZE_CORRECTION_TARGETS,
  ENGLISH_REFREEZE_REQUIRED_REVIEWS,
} from '../../../convex/lib/englishRefreezeCorrectionData';

type JsonObject = Record<string, unknown>;

function authored(row: JsonObject) {
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

function diffPaths(left: unknown, right: unknown, prefix = ''): string[] {
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return [prefix];
    const length = Math.max(left.length, right.length);
    return Array.from({ length }, (_, index) => diffPaths(
      left[index], right[index], prefix ? `${prefix}.${index}` : String(index),
    )).flat();
  }
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return [prefix];
  const leftObject = left as JsonObject;
  const rightObject = right as JsonObject;
  return [...new Set([...Object.keys(leftObject), ...Object.keys(rightObject)])]
    .flatMap((key) => diffPaths(
      leftObject[key], rightObject[key], prefix ? `${prefix}.${key}` : key,
    ));
}

describe('English 14-item refreeze correction data', () => {
  it('freezes the exact Production fixture and consecutive 14-row revision reset', async () => {
    expect(await sha256Canonical(ENGLISH_REFREEZE_CORRECTION_PREIMAGES))
      .toBe(ENGLISH_REFREEZE_CORRECTION_FIXTURE_SHA256);
    expect(ENGLISH_REFREEZE_CORRECTION_TARGETS).toHaveLength(14);
    expect(new Set(ENGLISH_REFREEZE_CORRECTION_TARGETS.map((target) => target.slug)).size)
      .toBe(14);
    for (const target of ENGLISH_REFREEZE_CORRECTION_TARGETS) {
      expect(target.desiredReviewRevision).toBe(target.content.reviewRevision + 1);
    }
    expect(ENGLISH_REFREEZE_REQUIRED_REVIEWS).toEqual([
      'native_myanmar',
      'english',
      'child_development',
      'evidence',
      'safety',
      'clinical',
    ]);
  });

  it('changes only the four confirmed nutrition Myanmar paths', () => {
    for (const target of ENGLISH_REFREEZE_CORRECTION_TARGETS) {
      const paths = diffPaths(
        authored(target.content),
        authored(target.desiredContent as unknown as JsonObject),
      ).sort();
      expect(paths, target.slug).toEqual(target.slug === 'gd_5_6m_nutrition'
        ? [
          'data.title.mm',
          'data.why.mm',
          'summaryMm',
          'titleMm',
        ]
        : []);
    }

    const nutrition = ENGLISH_REFREEZE_CORRECTION_TARGETS.find(
      (target) => target.slug === 'gd_5_6m_nutrition',
    );
    const data = nutrition?.desiredContent.data as {
      title?: { mm?: string };
      why?: { mm?: string };
    };
    expect(nutrition?.desiredContent.titleMm).toBe(ENGLISH_REFREEZE_CONFIRMED_COPY.titleMm);
    expect(nutrition?.desiredContent.summaryMm).toBe(ENGLISH_REFREEZE_CONFIRMED_COPY.whyMm);
    expect(data.title?.mm).toBe(ENGLISH_REFREEZE_CONFIRMED_COPY.titleMm);
    expect(data.why?.mm).toBe(ENGLISH_REFREEZE_CONFIRMED_COPY.whyMm);
  });
});
