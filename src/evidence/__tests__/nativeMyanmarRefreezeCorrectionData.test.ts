import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_FIXTURE_SHA256,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS,
  NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS,
} from '../../../convex/lib/nativeMyanmarRefreezeCorrectionData';

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

describe('Native-Myanmar 14-item refreeze correction data', () => {
  it('freezes the exact Production fixture and consecutive 14-row revision reset', async () => {
    expect(await sha256Canonical(NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES))
      .toBe(NATIVE_MYANMAR_REFREEZE_CORRECTION_FIXTURE_SHA256);
    expect(NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS).toHaveLength(14);
    expect(new Set(NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.map((target) => target.slug)).size)
      .toBe(14);
    for (const target of NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS) {
      expect(target.desiredReviewRevision).toBe(target.content.reviewRevision + 1);
    }
    expect(NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS).toEqual([
      'native_myanmar',
      'english',
      'child_development',
      'evidence',
      'safety',
      'clinical',
    ]);
  });

  it('changes only the three confirmed sleep Myanmar paths', () => {
    for (const target of NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS) {
      const paths = diffPaths(
        authored(target.content),
        authored(target.desiredContent as unknown as JsonObject),
      ).sort();
      expect(paths, target.slug).toEqual(target.slug === 'gd_birth_2m_sleep'
        ? [
          'data.encouragement.mm',
          'data.observationQuestions.1.mm',
          'data.safety.mm',
        ]
        : []);
    }

    const sleep = NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS.find(
      (target) => target.slug === 'gd_birth_2m_sleep',
    );
    const data = sleep?.desiredContent.data as {
      safety?: { mm?: string };
      observationQuestions?: Array<{ mm?: string }>;
      encouragement?: { mm?: string };
    };
    expect(data.safety?.mm).toMatch(
      new RegExp(`^${NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.safetyMm}`),
    );
    expect(data.observationQuestions?.[1]?.mm)
      .toBe(NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.observationQuestionMm);
    expect(data.encouragement?.mm)
      .toBe(NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.encouragementMm);
  });
});
