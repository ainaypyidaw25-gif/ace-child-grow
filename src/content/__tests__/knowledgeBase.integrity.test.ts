import { describe, it, expect } from 'vitest';
import { INFANT_CONTENT } from '../seed/infant';
import { CONTENT_SEED } from '../seed';
import { AUTHORABLE_EDITORIAL_STATUSES } from '../seed/infant/editorial';
import { sourcesForContent } from '../../evidence/links';

// Gates for the 0–12 month knowledge base.
//
// These are content rules, not software rules: authored items may never claim a
// status that requires a named human, every item must resolve to at least one
// verified reference, and nothing may promise an outcome or diagnose.

const BANDS_SHIPPED = ['birth_2m', '3_4m'];

describe('knowledge base — 0–12 months', () => {
  it('every authored item carries an editorial status an author is allowed to assert', () => {
    for (const i of INFANT_CONTENT) {
      const status = (i.data as Record<string, unknown>).editorialStatus;
      expect(AUTHORABLE_EDITORIAL_STATUSES, i.slug).toContain(status as never);
    }
  });

  it('never claims clinical, medical or doctor approval anywhere', () => {
    const banned = ['clinical_approved', 'medical_approved', 'doctor_approved', 'clinically approved', 'doctor approved'];
    for (const i of CONTENT_SEED) {
      for (const word of banned) {
        expect(i.searchText.includes(word), `${i.slug} contains "${word}"`).toBe(false);
      }
    }
  });

  it('every authored item states what its evidence supports', () => {
    for (const i of INFANT_CONTENT) {
      const summary = (i.data as Record<string, unknown>).evidenceSummary;
      expect(typeof summary, i.slug).toBe('string');
      expect((summary as string).length, i.slug).toBeGreaterThan(40);
    }
  });

  it('every authored item resolves to at least one verified reference', () => {
    for (const i of INFANT_CONTENT) {
      const sources = sourcesForContent(i.slug);
      expect(sources.length, `${i.slug} has no resolved reference`).toBeGreaterThan(0);
    }
  });

  it('no duplicate slugs against the rest of the library', () => {
    const slugs = CONTENT_SEED.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('each shipped band covers milestones, guides, activities and a checklist', () => {
    for (const band of BANDS_SHIPPED) {
      const inBand = CONTENT_SEED.filter((i) => i.ageGroupKey === band);
      expect(inBand.filter((i) => i.type === 'milestone').length, `${band} milestones`).toBeGreaterThanOrEqual(8);
      expect(inBand.filter((i) => i.type === 'guide').length, `${band} guides`).toBeGreaterThanOrEqual(8);
      expect(inBand.filter((i) => i.type === 'activity').length, `${band} activities`).toBeGreaterThanOrEqual(5);
      const checklist = CONTENT_SEED.find((i) => i.type === 'printable' && i.category === `checklist_${band}`);
      expect(checklist, `${band} printable checklist`).toBeDefined();
    }
  });

  it('each shipped band has a safety guide and a nutrition guide', () => {
    for (const band of BANDS_SHIPPED) {
      for (const domain of ['safety', 'nutrition', 'sleep']) {
        const covered = CONTENT_SEED.some((i) => i.ageGroupKey === band && i.domainKey === domain);
        expect(covered, `${band} missing ${domain} content`).toBe(true);
      }
    }
  });

  it('guides carry the parent-facing structure the brief requires', () => {
    for (const g of INFANT_CONTENT.filter((i) => i.type === 'guide')) {
      const d = g.data as Record<string, unknown>;
      for (const field of ['why', 'observationQuestions', 'dailyActivities', 'weeklyActivities', 'indoor', 'outdoor', 'safety', 'parentTips', 'faq', 'redFlags', 'referral', 'encouragement']) {
        expect(d[field], `${g.slug} missing ${field}`).toBeDefined();
      }
    }
  });

  it('never predicts a disorder, a percentage risk or a guaranteed outcome', () => {
    const banned = [/\bautism risk\b/, /\b\d+% (chance|risk|probability)/, /\bwill definitely\b/, /\bguarantee/, /\babnormal child\b/, /\biq (score|estimate)\b/];
    const infantSlugs = new Set(INFANT_CONTENT.map((i) => i.slug));
    for (const i of CONTENT_SEED.filter((c) => infantSlugs.has(c.slug))) {
      for (const pattern of banned) {
        expect(pattern.test(i.searchText), `${i.slug} matched ${pattern}`).toBe(false);
      }
    }
  });
});
