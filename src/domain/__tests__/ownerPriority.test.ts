import { describe, expect, it } from 'vitest';
import {
  classifyRecord,
  compareQueueRows,
  computePriority,
  dashboardCounts,
  findBilingualConflicts,
  isParentVisible,
  requiredDimensionsFor,
  type ClassifiableRecord,
} from '../../../convex/lib/ownerPriority';

const base = (overrides: Partial<ClassifiableRecord>): ClassifiableRecord => ({
  slug: 'act_example',
  type: 'activity',
  titleMm: 'ကစားနည်း',
  titleEn: 'Stacking cups play',
  data: { instructions: [{ mm: 'ခွက်များကို စီပါ။', en: 'Stack the cups.' }] },
  clinicalStatus: 'clinical_review',
  ...overrides,
});

describe('provisional risk classification', () => {
  it('classifies plain play content as A', () => {
    expect(classifyRecord(base({})).riskClass).toBe('A');
  });

  it('classifies special_need as C regardless of wording', () => {
    expect(classifyRecord(base({ type: 'special_need', data: {} })).riskClass).toBe('C');
  });

  it('classifies guides with redFlags/referral blocks as C', () => {
    const record = base({ type: 'guide', data: { redFlags: [{ mm: 'သတိ', en: 'sign' }], referral: { mm: 'ဆရာဝန်', en: 'doctor' } } });
    expect(classifyRecord(record).riskClass).toBe('C');
  });

  it('promotes on Myanmar-language clinical wording, not only English', () => {
    const record = base({ data: { note: { mm: 'ကာကွယ်ဆေး အချိန်မှန် ထိုးပါ။', en: 'Keep to the schedule.' } } });
    const result = classifyRecord(record);
    expect(result.riskClass).toBe('C');
    expect(result.clinicalTriggers).toContain('vaccination');
  });

  it('classifies one-sided bilingual safety fields as D', () => {
    const record = base({ data: { safety: { mm: '—', en: 'None specific.' } } });
    const result = classifyRecord(record);
    expect(result.riskClass).toBe('D');
    expect(result.bilingualConflicts[0].safetyRelated).toBe(true);
  });

  it('flags pending clinical references from the record body', () => {
    const record = base({ type: 'special_need', data: { references: ['Pending clinical reviewer: attach verified references.'] } });
    expect(classifyRecord(record).pendingClinicalReferences).toBe(true);
  });
});

describe('required review dimensions policy', () => {
  it('gives A the four base dimensions', () => {
    expect(requiredDimensionsFor('A')).toEqual(['native_myanmar', 'english', 'child_development', 'evidence']);
  });
  it('adds safety for B and clinical for C', () => {
    expect(requiredDimensionsFor('B')).toContain('safety');
    expect(requiredDimensionsFor('B')).not.toContain('clinical');
    expect(requiredDimensionsFor('C')).toContain('clinical');
  });
  it('never marks a dimension not_required for D/E — full set instead', () => {
    expect(requiredDimensionsFor('D')).toContain('clinical');
    expect(requiredDimensionsFor('E')).toContain('safety');
  });
});

describe('P0–P3 priority policy', () => {
  it('puts parent-visible special_need at P0', () => {
    const result = computePriority(base({ type: 'special_need', clinicalStatus: 'published', data: {} }));
    expect(result.priority).toBe('P0');
  });

  it('keeps unpublished special_need out of P0 (P2) unless another P0 rule fires', () => {
    const result = computePriority(base({ type: 'special_need', clinicalStatus: 'clinical_review', data: {} }));
    expect(result.priority).toBe('P2');
  });

  it('puts act_story_sequence at P0 by name', () => {
    const result = computePriority(base({ slug: 'act_story_sequence' }));
    expect(result.priority).toBe('P0');
  });

  it('puts Myanmar/English safety conflicts at P0 even when unpublished', () => {
    const result = computePriority(base({ data: { safety: { mm: '—', en: 'None specific.' } } }));
    expect(result.priority).toBe('P0');
  });

  it('puts parent-visible pending-clinical-references content at P0', () => {
    const result = computePriority(base({
      type: 'special_need',
      clinicalStatus: 'published',
      data: { references: ['Pending clinical reviewer: attach verified references.'] },
    }));
    expect(result.priority).toBe('P0');
    expect(result.priorityReasons.join(' ')).toContain('pending');
  });

  it('puts workflow blockers at P0', () => {
    const result = computePriority(base({ workflowBlocker: 'duplicate identical review decisions recorded' }));
    expect(result.priority).toBe('P0');
  });

  it('splits remaining Class C by parent visibility: P1 visible, P2 unpublished', () => {
    const visible = computePriority(base({ clinicalStatus: 'published', data: { note: { mm: 'အဖျား ရှိလျှင်', en: 'If fever appears' } } }));
    const hidden = computePriority(base({ clinicalStatus: 'clinical_review', data: { note: { mm: 'အဖျား ရှိလျှင်', en: 'If fever appears' } } }));
    expect(visible.priority).toBe('P1');
    expect(hidden.priority).toBe('P2');
  });

  it('sends Class A and B to P3', () => {
    expect(computePriority(base({})).priority).toBe('P3');
    expect(computePriority(base({ type: 'milestone', data: {} })).priority).toBe('P3');
  });

  it('lets a stored owner priority override the computed one', () => {
    const result = computePriority(base({ ownerPriority: 'P1' }));
    expect(result.priority).toBe('P1');
    expect(result.priorityReasons).toEqual(['owner-confirmed priority']);
  });

  it('uses the stored risk classification when confirmed', () => {
    const result = computePriority(base({ riskClassification: 'C', riskReasons: ['confirmed by owner'] }));
    expect(result.riskClass).toBe('C');
    expect(result.provisional).toBe(false);
    expect(result.priority).toBe('P2');
  });
});

describe('default queue sorting', () => {
  const row = (slug: string, priority: 'P0' | 'P1' | 'P2' | 'P3', type: string, clinicalStatus: string) =>
    ({ slug, priority, type, clinicalStatus });

  it('orders P0 first, then parent-visible, then the fixed type order, then slug', () => {
    const rows = [
      row('b_lesson', 'P1', 'lesson', 'published'),
      row('a_story', 'P0', 'story', 'clinical_review'),
      row('a_guide', 'P1', 'guide', 'published'),
      row('z_special', 'P1', 'special_need', 'published'),
      row('a_special_hidden', 'P1', 'special_need', 'clinical_review'),
      row('a_milestone', 'P1', 'milestone', 'published'),
    ];
    const sorted = [...rows].sort(compareQueueRows).map((entry) => entry.slug);
    expect(sorted).toEqual([
      'a_story', // P0 always first, visibility second
      'z_special', // visible, special_need
      'a_guide', // visible, guide
      'a_milestone', // visible, milestone
      'b_lesson', // visible, lesson
      'a_special_hidden', // unpublished after all visible
    ]);
  });

  it('breaks full ties by slug', () => {
    const rows = [row('b', 'P2', 'guide', 'draft'), row('a', 'P2', 'guide', 'draft')];
    expect([...rows].sort(compareQueueRows).map((entry) => entry.slug)).toEqual(['a', 'b']);
  });
});

describe('dashboard counts', () => {
  const rows = [
    { priority: 'P0' as const, riskClass: 'C' as const, clinicalStatus: 'published', priorityStatus: 'unreviewed' as const, outstandingDimensions: ['clinical', 'safety', 'native_myanmar'] },
    { priority: 'P1' as const, riskClass: 'C' as const, clinicalStatus: 'published', priorityStatus: 'completed' as const, outstandingDimensions: [] },
    { priority: 'P2' as const, riskClass: 'C' as const, clinicalStatus: 'clinical_review', priorityStatus: 'assigned' as const, outstandingDimensions: ['clinical'] },
    { priority: 'P3' as const, riskClass: 'A' as const, clinicalStatus: 'clinical_review', priorityStatus: 'ready_for_recheck' as const, outstandingDimensions: ['native_myanmar'] },
    { priority: 'P3' as const, riskClass: 'B' as const, clinicalStatus: 'published', priorityStatus: 'correction_needed' as const, outstandingDimensions: ['safety'] },
  ];

  it('counts remaining per priority excluding completed', () => {
    const counts = dashboardCounts(rows);
    expect(counts.p0Remaining).toBe(1);
    expect(counts.p1Remaining).toBe(0); // the only P1 is completed
    expect(counts.p2Remaining).toBe(1);
    expect(counts.p3Remaining).toBe(2);
  });

  it('counts parent-visible Class C and outstanding dimensions', () => {
    const counts = dashboardCounts(rows);
    expect(counts.parentVisibleClassC).toBe(2);
    expect(counts.clinicalReviewsRequired).toBe(2);
    expect(counts.safetyReviewsRequired).toBe(2);
    expect(counts.myanmarReviewsRequired).toBe(2);
    expect(counts.correctionNeeded).toBe(1);
    expect(counts.currentlyAssigned).toBe(1);
    expect(counts.readyForRecheck).toBe(1);
    expect(counts.completed).toBe(1);
  });
});

describe('bilingual conflict scanning', () => {
  it('finds nothing in complete pairs', () => {
    expect(findBilingualConflicts({ body: { mm: 'မြန်မာ', en: 'English' } })).toEqual([]);
  });
  it('flags Myanmar fields without Myanmar script', () => {
    const conflicts = findBilingualConflicts({ body: { mm: 'english text', en: 'English' } });
    expect(conflicts).toHaveLength(1);
  });
  it('marks safety paths as safety-related', () => {
    const conflicts = findBilingualConflicts({ safety: { mm: '', en: 'Watch the stairs.' } });
    expect(conflicts[0].safetyRelated).toBe(true);
  });
});

describe('parent visibility rule', () => {
  it('only published is visible', () => {
    expect(isParentVisible('published')).toBe(true);
    expect(isParentVisible('clinical_review')).toBe(false);
    expect(isParentVisible('draft')).toBe(false);
  });
});
