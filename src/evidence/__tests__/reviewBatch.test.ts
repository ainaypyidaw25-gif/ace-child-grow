// Clinical review batch — ages 0–12 months.
//
// The batch is what a clinical reviewer is handed. These tests guard the three
// ways a review batch can lie to the person using it:
//
//   * scope creep — an item outside 0–12 months slips in, or an in-scope item
//     is dropped, so "the 0–12 month batch is done" is not true
//   * silent exclusion — age-agnostic content an infant's parent can see is
//     omitted without saying so, so a finished batch reads as broader than it is
//   * self-approval — the batch ships pre-ticked, pre-published, or treats an
//     advisory as a pass
import { describe, it, expect } from 'vitest';
import { CONTENT_SEED } from '../../content/seed';
import { AGE_GROUPS } from '../../content/taxonomy';
import {
  AGE_GROUP_KEYS_0_12,
  BATCH_ID,
  BLOCKING_CHECKLIST_KEYS,
  REVIEWER_CHECKLIST,
  buildReviewBatch,
} from '../reviewBatch';

const TODAY = '2026-07-25';
const batch = buildReviewBatch(TODAY);

describe('review batch scope', () => {
  it('is the 0–12 month batch and says so', () => {
    expect(batch.batchId).toBe(BATCH_ID);
    expect(batch.ageRangeMonths).toEqual({ min: 0, max: 12 });
    expect(batch.generatedOn).toBe(TODAY);
  });

  it('derives its age groups from the taxonomy, not a hardcoded list', () => {
    const expected = AGE_GROUPS.filter((g) => g.maxMonths <= 12).map((g) => g.key);
    expect(AGE_GROUP_KEYS_0_12).toEqual(expected);
    expect(AGE_GROUP_KEYS_0_12.length).toBeGreaterThan(0);
  });

  // Every item's declared age band must sit entirely inside 0–12 months. An
  // item spanning 10–18 months is NOT a 0–12 month item: signing it off in this
  // batch would approve guidance for toddlers under cover of an infant review.
  it('contains no item whose age scope reaches past 12 months', () => {
    const byKey = new Map(AGE_GROUPS.map((g) => [g.key, g]));
    for (const item of batch.items) {
      const g = byKey.get(item.ageGroupKey);
      expect(g, `${item.slug} has an unknown age group`).toBeDefined();
      expect(g!.minMonths, item.slug).toBeGreaterThanOrEqual(0);
      expect(g!.maxMonths, item.slug).toBeLessThanOrEqual(12);
    }
  });

  it('contains every in-scope seed item and nothing else', () => {
    const expected = CONTENT_SEED.filter(
      (i) => i.ageGroupKey !== undefined && AGE_GROUP_KEYS_0_12.includes(i.ageGroupKey),
    ).map((i) => i.slug);
    expect([...batch.items.map((i) => i.slug)].sort()).toEqual([...expected].sort());
    expect(batch.items.length).toBe(batch.progress.total);
  });

  // A batch that quietly drops content is worse than one that admits its edges:
  // a reviewer would read "0–12 months reviewed" as covering everything an
  // infant's parent sees. Age-agnostic content is excluded, and reported.
  it('accounts for every age-agnostic item it excludes', () => {
    const agnostic = CONTENT_SEED.filter((i) => i.ageGroupKey === undefined);
    const reported = batch.outOfScopeAgeAgnostic.reduce((a, g) => a + g.count, 0);
    expect(reported).toBe(agnostic.length);
    if (agnostic.length > 0) expect(batch.outOfScopeAgeAgnostic.length).toBeGreaterThan(0);
  });

  it('leaves no seed item unaccounted for', () => {
    const inBatch = batch.items.length;
    const agnostic = batch.outOfScopeAgeAgnostic.reduce((a, g) => a + g.count, 0);
    const olderThan12m = CONTENT_SEED.filter(
      (i) => i.ageGroupKey !== undefined && !AGE_GROUP_KEYS_0_12.includes(i.ageGroupKey),
    ).length;
    expect(inBatch + agnostic + olderThan12m).toBe(CONTENT_SEED.length);
  });
});

describe('review batch groupings', () => {
  const groupings = [
    ['byAgeGroup', batch.groups.byAgeGroup],
    ['byDomain', batch.groups.byDomain],
    ['byType', batch.groups.byType],
    ['byReviewStatus', batch.groups.byReviewStatus],
  ] as const;

  it('provides all five required groupings', () => {
    expect(Object.keys(batch.groups).sort()).toEqual(
      ['byAgeGroup', 'byDomain', 'byOrganization', 'byReviewStatus', 'byType'].sort(),
    );
  });

  // Each of these partitions the batch: an item belongs to exactly one age
  // group, one domain, one type, one status. If the counts do not add to the
  // batch size, a group heading is under- or double-counting the work.
  it.each(groupings)('%s partitions the batch exactly once', (_name, groups) => {
    expect(groups.reduce((a, g) => a + g.count, 0)).toBe(batch.items.length);
  });

  // Organisation is the deliberate exception — one item cites several bodies.
  it('counts organisations per citation, never fewer than the batch size', () => {
    const total = batch.groups.byOrganization.reduce((a, g) => a + g.count, 0);
    expect(total).toBeGreaterThanOrEqual(batch.items.length);
  });

  it('orders age groups developmentally, not by size', () => {
    const order = new Map(AGE_GROUPS.map((g, i) => [g.key, i]));
    const seen = batch.groups.byAgeGroup.map((g) => order.get(g.key) ?? -1);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  // A Myanmar-speaking reviewer reads the headings. Every grouping carries a
  // Myanmar label; where none exists it repeats the English rather than being
  // blank, because an empty heading is worse than an untranslated one.
  it('labels every group in both languages', () => {
    for (const [name, groups] of [...groupings, ['byOrganization', batch.groups.byOrganization] as const]) {
      for (const g of groups) {
        expect(g.label.trim(), `${name}:${g.key} en`).not.toBe('');
        expect(g.labelMm.trim(), `${name}:${g.key} mm`).not.toBe('');
      }
    }
  });

  it('labels every item in both languages', () => {
    for (const item of batch.items) {
      expect(item.titleEn.trim(), item.slug).not.toBe('');
      expect(item.titleMm.trim(), item.slug).not.toBe('');
      expect(item.ageGroupLabelMm.trim(), item.slug).not.toBe('');
      if (item.domainKey !== null) expect(item.domainLabelMm, item.slug).toBeTruthy();
    }
  });
});

describe('reviewer checklist', () => {
  const REQUIRED = [
    'factual_accuracy',
    'age_appropriateness',
    'safety',
    'myanmar_wording',
    'non_diagnostic_language',
    'reference_relevance',
    'outdated_evidence',
    'referral_guidance',
  ];

  it('covers exactly the eight required dimensions', () => {
    expect(REVIEWER_CHECKLIST.map((d) => d.key).sort()).toEqual([...REQUIRED].sort());
  });

  it('asks each dimension in both languages', () => {
    for (const d of REVIEWER_CHECKLIST) {
      for (const field of ['labelEn', 'labelMm', 'promptEn', 'promptMm'] as const) {
        expect(d[field].trim().length, `${d.key}.${field}`).toBeGreaterThan(0);
      }
      expect(d.promptEn, d.key).toContain('?');
    }
  });

  // Outdated evidence is a scheduling signal, not a defect: a 2015 guideline is
  // not wrong because it is old. Treating it as blocking would stall a whole
  // batch on reference age. Everything else is blocking — safety and
  // non-diagnostic language above all.
  it('treats outdated evidence as advisory and everything else as blocking', () => {
    const outdated = REVIEWER_CHECKLIST.find((d) => d.key === 'outdated_evidence');
    expect(outdated?.blocking).toBe(false);
    expect([...BLOCKING_CHECKLIST_KEYS].sort()).toEqual(
      REQUIRED.filter((k) => k !== 'outdated_evidence').sort(),
    );
  });

  it('always blocks on safety and on non-diagnostic language', () => {
    expect(BLOCKING_CHECKLIST_KEYS).toContain('safety');
    expect(BLOCKING_CHECKLIST_KEYS).toContain('non_diagnostic_language');
  });
});

describe('review batch progress', () => {
  const p = batch.progress;

  it('requires an answer for every item on every dimension', () => {
    expect(p.checklistAnswers).toBe(p.total * REVIEWER_CHECKLIST.length);
  });

  it('splits the batch into reviewable and blocked with nothing in between', () => {
    expect(p.reviewableNow + p.blocked).toBe(p.total);
    expect(batch.items.filter((i) => i.blockers.length === 0).length).toBe(p.reviewableNow);
  });

  it('splits every item into exactly one clinical status', () => {
    expect(p.published + p.inClinicalReview + p.draft).toBe(p.total);
  });

  // Requirement: nothing is published automatically. The batch is generated
  // from the seed, so if the seed ever ships a published 0–12 month item this
  // fails here rather than in front of a parent.
  it('publishes nothing on its own', () => {
    expect(p.published).toBe(0);
    expect(batch.items.every((i) => i.clinicalStatus !== 'published')).toBe(true);
  });

  // Requirement: no evidence_required item may be approved. The batch surfaces
  // them as blockers or advisories; it never resolves one.
  it('never presents an evidence_required reference as approved', () => {
    for (const item of batch.items) {
      for (const r of item.references) {
        expect(r.reviewStatus, `${item.slug} → ${r.id}`).not.toBe('approved');
      }
    }
    expect(p.referencesApproved).toBe(0);
  });

  it('blocks any item whose references are all unusable', () => {
    for (const item of batch.items) {
      const allUnusable =
        item.references.length > 0 && item.references.every((r) => r.reviewStatus === 'evidence_required');
      if (allUnusable) expect(item.blockers.length, item.slug).toBeGreaterThan(0);
    }
  });

  it('gives every blocked item a stated reason', () => {
    for (const item of batch.items.filter((i) => i.blockers.length > 0)) {
      item.blockers.forEach((b) => expect(b.trim().length, item.slug).toBeGreaterThan(0));
    }
  });

  // Expired and outdated references are surfaced for a human to act on. They
  // must never silently block an item — that is the difference between a review
  // prompt and a build failure.
  it('treats expired and outdated references as advisories, not blockers', () => {
    for (const item of batch.items) {
      const onlyAgeFlags =
        item.references.some((r) => r.expired || r.outdated) &&
        item.references.some((r) => r.reviewStatus !== 'evidence_required');
      if (onlyAgeFlags && item.blockers.length > 0) {
        expect(
          item.blockers.join('; '),
          `${item.slug} blocked by reference age`,
        ).not.toMatch(/expired|outdated/i);
      }
    }
  });

  it('counts references consistently with the items that cite them', () => {
    const distinct = new Set(batch.items.flatMap((i) => i.references.map((r) => r.id)));
    expect(p.distinctReferences).toBe(distinct.size);
  });

  it('is deterministic for a fixed date', () => {
    expect(buildReviewBatch(TODAY)).toEqual(buildReviewBatch(TODAY));
  });
});
