import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED_SHA256,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_FIXTURE_SHA256,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS,
  CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS,
} from '../../../convex/lib/childDevelopmentRefreezeCorrectionData';
import {
  CDC_TODDLERS_1_2_SOURCE_ID,
  CDC_TODDLERS_2_3_SOURCE_ID,
  CHILD_DEVELOPMENT_REFREEZE_SEMANTIC_SLUGS,
  CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS,
} from '../../../convex/lib/childDevelopmentRefreezeCorrectionCopy';

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

const expectedAuthoredDiffs: Record<string, string[]> = {
  gd_10_12m_nutrition: [
    'data.dailyActivities.0.en',
    'data.dailyActivities.0.mm',
    'data.parentTips.0.mm',
  ],
  gd_13_18m_safety: [
    'data.why.en',
    'data.why.mm',
    'summaryEn',
    'summaryMm',
  ],
  gd_2y_safety: [
    'data.why.en',
    'data.why.mm',
    'summaryEn',
    'summaryMm',
  ],
  gd_2_5y_safety: [
    'data.dailyActivities.0.en',
    'data.dailyActivities.0.mm',
    'data.indoor.0.en',
    'data.indoor.0.mm',
    'data.outdoor.0.en',
    'data.outdoor.0.mm',
  ],
};

describe('Child-development refreeze correction immutable data', () => {
  it('freezes exact Production, desired fixtures, and consecutive 14-row revisions', async () => {
    expect(await sha256Canonical(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES))
      .toBe(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_FIXTURE_SHA256);
    expect(await sha256Canonical(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED))
      .toBe(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_DESIRED_SHA256);
    expect(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS).toHaveLength(14);
    expect(new Set(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.map(
      (target) => target.slug,
    )).size).toBe(14);
    expect(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.map(
      (target) => target.desiredReviewRevision,
    )).toEqual([6, 7, 11, 6, 11, 10, 10, 10, 10, 9, 9, 9, 9, 9]);
    for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
      expect(target.desiredReviewRevision).toBe(target.content.reviewRevision + 1);
    }
    expect(CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS).toEqual([
      'child_development',
      'english',
      'native_myanmar',
      'evidence',
      'safety',
      'clinical',
    ]);
  });

  it('changes authored content on exactly the four frozen semantic rows', () => {
    const changed: string[] = [];
    for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
      const paths = diffPaths(
        authored(target.content),
        authored(target.desiredContent as unknown as JsonObject),
      ).sort();
      expect(paths, target.slug).toEqual(expectedAuthoredDiffs[target.slug] ?? []);
      if (paths.length > 0) changed.push(target.slug);
    }
    expect(changed).toEqual([...CHILD_DEVELOPMENT_REFREEZE_SEMANTIC_SLUGS]);
  });

  it('transitions exactly the 2y and 2.5y links to the qualified CDC 2-3 source', () => {
    const changed: string[] = [];
    for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
      if (target.link.sourceIds.join('\u0000') === target.desiredLink.sourceIds.join('\u0000')) {
        continue;
      }
      changed.push(target.slug);
      expect(target.link.sourceIds).toContain(CDC_TODDLERS_1_2_SOURCE_ID);
      expect(target.link.sourceIds).not.toContain(CDC_TODDLERS_2_3_SOURCE_ID);
      expect(target.desiredLink.sourceIds).not.toContain(CDC_TODDLERS_1_2_SOURCE_ID);
      expect(target.desiredLink.sourceIds).toContain(CDC_TODDLERS_2_3_SOURCE_ID);
      expect(target.desiredLink.sourceIds).toEqual(target.link.sourceIds.map((sourceId) => (
        sourceId === CDC_TODDLERS_1_2_SOURCE_ID
          ? CDC_TODDLERS_2_3_SOURCE_ID
          : sourceId
      )));
    }
    expect(changed).toEqual([...CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS]);
  });

  it('freezes one exact successful qualified source approval with no invented note', () => {
    const { source, audit, reviewerProfile } =
      CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.sourceApproval;
    expect(source).toMatchObject({
      sourceId: CDC_TODDLERS_2_3_SOURCE_ID,
      reviewStatus: 'approved',
      reviewer: 'Phyo Ko Ko',
      reviewerQualification: 'MBBS',
      reviewDate: '2026-08-31',
      reviewScope: 'education',
    });
    expect(source.reviewNote).toBeUndefined();
    expect(audit).toMatchObject({
      action: 'evidence.setReview',
      entityTable: 'evidenceSources',
      entityId: CDC_TODDLERS_2_3_SOURCE_ID,
      result: 'ok',
      before: 'awaiting_review / no reviewer / no date',
      after: 'approved / Phyo Ko Ko (MBBS) / 2026-08-31',
    });
    expect(reviewerProfile).toMatchObject({
      userId: source.reviewerId,
      isStaff: true,
      staffRole: 'clinical_reviewer',
      displayName: 'Phyo Ko Ko',
      staffQualification: 'MBBS',
    });
  });
});
