import { describe, it, expect } from 'vitest';
import {
  SAMPLE_MILESTONES,
  SAMPLE_ACTIVITIES,
  SAMPLE_AWARENESS,
  isApprovedForParents,
} from './content';

describe('seed content clinical-review safety', () => {
  it('marks NO sample health/development content as published', () => {
    const all = [
      ...SAMPLE_MILESTONES.map((m) => m.reviewStatus),
      ...SAMPLE_ACTIVITIES.map((a) => a.reviewStatus),
      ...SAMPLE_AWARENESS.map((t) => t.reviewStatus),
    ];
    expect(all.every((s) => s !== 'published')).toBe(true);
    expect(all.every((s) => isApprovedForParents(s) === false)).toBe(true);
  });

  it('keeps every milestone within a valid age range', () => {
    for (const m of SAMPLE_MILESTONES) {
      expect(m.ageMinMonths).toBeLessThanOrEqual(m.ageMaxMonths);
      expect(m.ageMinMonths).toBeGreaterThanOrEqual(0);
      expect(m.ageMaxMonths).toBeLessThanOrEqual(60);
    }
  });

  it('gives every activity a safety note', () => {
    for (const a of SAMPLE_ACTIVITIES) {
      expect(a.safetyNoteEn.trim().length).toBeGreaterThan(0);
    }
  });
});
