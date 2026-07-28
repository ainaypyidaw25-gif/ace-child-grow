import { describe, expect, it } from 'vitest';
import { CONTENT_SEED } from '../seed';
import { OLDER_AUTHORED_CONTENT } from '../seed/older';
import { AUTHORABLE_EDITORIAL_STATUSES } from '../seed/infant/editorial';
import { sourcesForContent } from '../../evidence/links';

const BANDS = ['13_18m', '19_24m', '2y', '2_5y', '3y', '3_5y', '4y', '4_5y', '5y'];

describe('knowledge base — 13 months through 5 years', () => {
  it('gives every band a useful parent-facing baseline', () => {
    for (const band of BANDS) {
      const items = CONTENT_SEED.filter((item) => item.ageGroupKey === band);
      expect(items.filter((item) => item.type === 'milestone').length, `${band} milestones`).toBeGreaterThanOrEqual(8);
      expect(items.filter((item) => item.type === 'guide').length, `${band} guides`).toBeGreaterThanOrEqual(4);
      expect(items.filter((item) => item.type === 'activity').length, `${band} activities`).toBeGreaterThanOrEqual(4);
      expect(items.some((item) => item.type === 'printable' && item.category === `checklist_${band}`), `${band} checklist`).toBe(true);
    }
  });

  it('keeps every newly authored item reference-verified but not human-published', () => {
    for (const item of OLDER_AUTHORED_CONTENT) {
      const status = (item.data as Record<string, unknown>).editorialStatus;
      expect(AUTHORABLE_EDITORIAL_STATUSES, item.slug).toContain(status as never);
      expect(item.clinicalStatus, item.slug).toBe('clinical_review');
      expect(sourcesForContent(item.slug).length, `${item.slug} evidence`).toBeGreaterThan(0);
    }
  });

  it('keeps new guides structured for observation, action, safety, and referral', () => {
    for (const item of OLDER_AUTHORED_CONTENT.filter((candidate) => candidate.type === 'guide')) {
      const data = item.data as Record<string, unknown>;
      for (const field of ['observationQuestions', 'dailyActivities', 'weeklyActivities', 'safety', 'parentTips', 'faq', 'redFlags', 'referral', 'encouragement']) {
        expect(data[field], `${item.slug} missing ${field}`).toBeDefined();
      }
    }
  });

  it('uses observation language rather than diagnosis, scoring, or guaranteed outcomes', () => {
    const banned = [/clinical_approved/i, /doctor_approved/i, /diagnoses the child/i, /\bguarantees?\b/i];
    for (const item of OLDER_AUTHORED_CONTENT) {
      const text = CONTENT_SEED.find((candidate) => candidate.slug === item.slug)?.searchText ?? '';
      for (const pattern of banned) expect(pattern.test(text), `${item.slug} matched ${pattern}`).toBe(false);
    }
  });
});
