import { describe, expect, it } from 'vitest';
import { CONTENT_SEED } from '../seed';
import { OLDER_AUTHORED_CONTENT } from '../seed/older';
import { AUTHORABLE_EDITORIAL_STATUSES } from '../seed/infant/editorial';
import { sourcesForContent } from '../../evidence/links';
import { isRetiredMilestoneSlug } from '../../../convex/lib/contentRetirements';

const BANDS = ['13_18m', '19_24m', '2y', '2_5y', '3y', '3_5y', '4y', '4_5y', '5y'];

describe('knowledge base — 13 months through 5 years', () => {
  it('gives every band a useful parent-facing baseline', () => {
    for (const band of BANDS) {
      const items = CONTENT_SEED.filter((item) => item.ageGroupKey === band);
      const minimumMilestones = band === '3_5y' ? 7 : band === '5y' ? 6 : 8;
      expect(items.filter((item) => item.type === 'milestone').length, `${band} milestones`)
        .toBeGreaterThanOrEqual(minimumMilestones);
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
      if (item.type === 'milestone' && isRetiredMilestoneSlug(item.slug)) {
        expect(CONTENT_SEED.some((candidate) => candidate.slug === item.slug), item.slug).toBe(false);
        continue;
      }
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

  it('keeps preschool social milestones age-specific instead of cloning one milestone', () => {
    const social = OLDER_AUTHORED_CONTENT.filter((item) =>
      /^ms_(2_5y|3y|3_5y|4y|4_5y|5y)_social_2$/.test(item.slug),
    );
    const signatures = social.map((item) => JSON.stringify({
      titleMm: item.titleMm,
      titleEn: item.titleEn,
      observeMm: (item.data as Record<string, unknown>).observeMm,
      observeEn: (item.data as Record<string, unknown>).observeEn,
    }));
    expect(social).toHaveLength(6);
    expect(new Set(signatures).size).toBe(social.length);
  });

  it('keeps repeated preschool activity families meaningfully adapted by age', () => {
    for (const prefix of ['move_path_', 'picture_story_', 'helper_sort_']) {
      const family = OLDER_AUTHORED_CONTENT.filter((item) => item.type === 'activity' && item.slug.startsWith(`act_${prefix}`));
      const signatures = family.map((item) => JSON.stringify({
        titleMm: item.titleMm,
        titleEn: item.titleEn,
        summaryMm: item.summaryMm,
        summaryEn: item.summaryEn,
        instructions: (item.data as Record<string, unknown>).instructions,
      }));
      expect(family, prefix).toHaveLength(6);
      expect(new Set(signatures).size, `${prefix} contains cloned activities`).toBe(family.length);
    }
  });

  it('does not restore the generic guide template in every domain', () => {
    const forbidden = [
      'သုံးရက်ခန့် လက်ရှိအလေ့အထကို မှတ်သားကြည့်ပါ',
      'တစ်ပတ်ကုန်တွင် အဆင်ပြေခဲ့သော အချက်တစ်ခုကို ဆက်ထားပါ',
      'အခြားကလေးနှင့် မတူလျှင် စိုးရိမ်ရမလား',
    ];
    for (const item of OLDER_AUTHORED_CONTENT.filter((candidate) => candidate.type === 'guide')) {
      const text = JSON.stringify(item.data);
      for (const phrase of forbidden) expect(text, item.slug).not.toContain(phrase);
    }
  });
});
