import { describe, it, expect } from 'vitest';
import { CONTENT_SEED } from '../seed';
import {
  AGE_GROUP_KEYS, DOMAIN_KEYS, CONTENT_TYPES, LESSON_CATEGORIES,
  SPECIAL_NEEDS_KEYS, STORY_TYPES, PRINTABLE_TYPES, CLINICAL_STATUSES,
} from '../taxonomy';
import { FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG } from '../../../convex/lib/contentRetirements';

// Acceptance criteria for the content platform (mirrors the milestone brief):
// every age/domain has content, no orphan records, no duplicate IDs, everything
// searchable, every item carries source metadata, and every clinical item is
// marked (nothing seeded as 'published' — review happens in the CMS).

const byType = (t: string) => CONTENT_SEED.filter((i) => i.type === t);

describe('content library integrity', () => {
  it('has a substantial corpus', () => {
    expect(CONTENT_SEED.length).toBeGreaterThan(100);
  });

  it('no duplicate slugs (IDs)', () => {
    const slugs = CONTENT_SEED.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every item has valid type and required metadata', () => {
    for (const i of CONTENT_SEED) {
      expect(CONTENT_TYPES).toContain(i.type as never);
      expect(i.titleMm.length, i.slug).toBeGreaterThan(0);
      expect(i.titleEn.length, i.slug).toBeGreaterThan(0);
      expect(i.source.length, i.slug).toBeGreaterThan(0);
      expect(i.version, i.slug).toBeGreaterThanOrEqual(1);
      expect(CLINICAL_STATUSES, i.slug).toContain(i.clinicalStatus as never);
    }
  });

  it('every item is searchable (searchText includes its own title, lowercased)', () => {
    for (const i of CONTENT_SEED) {
      expect(i.searchText, i.slug).toContain(i.titleEn.toLowerCase());
      expect(i.searchText.length, i.slug).toBeGreaterThan(0);
    }
  });

  it('no clinical content is pre-published (must be reviewed in the CMS first)', () => {
    for (const i of CONTENT_SEED) {
      expect(i.clinicalStatus, i.slug).not.toBe('published');
    }
  });

  it('no orphan records: age/domain keys are valid when present', () => {
    for (const i of CONTENT_SEED) {
      if (i.ageGroupKey) expect(AGE_GROUP_KEYS, `${i.slug} age`).toContain(i.ageGroupKey);
      if (i.domainKey) expect(DOMAIN_KEYS, `${i.slug} domain`).toContain(i.domainKey);
    }
  });

  it('every age group has content', () => {
    const ages = new Set(CONTENT_SEED.map((i) => i.ageGroupKey).filter(Boolean));
    for (const a of AGE_GROUP_KEYS) expect(ages, `age ${a}`).toContain(a);
  });

  it('every domain has content', () => {
    const domains = new Set(CONTENT_SEED.map((i) => i.domainKey).filter(Boolean));
    for (const d of DOMAIN_KEYS) expect(domains, `domain ${d}`).toContain(d);
  });

  it('milestones exist across many ages', () => {
    const ms = byType('milestone');
    expect(ms.length).toBeGreaterThan(30);
    const ages = new Set(ms.map((m) => m.ageGroupKey));
    expect(ages.size).toBeGreaterThanOrEqual(12);
  });

  it('provides a draft milestone-and-activity baseline for every 13-month-through-5-year band', () => {
    const olderAgeKeys = AGE_GROUP_KEYS.slice(5);
    for (const ageKey of olderAgeKeys) {
      const ageItems = CONTENT_SEED.filter((item) => item.ageGroupKey === ageKey);
      expect(ageItems.some((item) => item.type === 'milestone'), `${ageKey} milestone`).toBe(true);
      expect(ageItems.some((item) => item.type === 'activity'), `${ageKey} activity`).toBe(true);
      for (const item of ageItems) {
        expect(item.clinicalStatus, `${item.slug} status`).toBe('clinical_review');
      }
    }
  });

  it('keeps the newly added older-child activity evidence notes revision-bound', () => {
    for (const slug of ['act_copy_everyday_actions', 'act_follow_the_pattern', 'act_draw_and_tell']) {
      const item = CONTENT_SEED.find((candidate) => candidate.slug === slug);
      expect(item, slug).toBeDefined();
      const summary = (item?.data as Record<string, unknown>).evidenceSummary;
      expect(typeof summary, `${slug} evidence summary`).toBe('string');
      expect(summary, `${slug} evidence summary`).toContain('evidence and safety review remains revision-bound');
      expect(summary, `${slug} evidence summary`).not.toMatch(/personal endorsement/i);
      expect(item?.clinicalStatus, `${slug} status`).toBe('clinical_review');
    }
  });

  it('never offers small caps or small parts in the 3-year color-sorting activity', () => {
    const item = CONTENT_SEED.find((candidate) => candidate.slug === 'act_color_sort');
    const data = item?.data as Record<string, { en?: string }> | undefined;
    expect(data?.materials?.en).toContain('Large, age-rated, non-swallowable');
    expect(data?.safety?.en).toContain('Do not use small objects or detachable small parts');
  });

  it('every lesson category is represented, and lessons carry quiz + objectives', () => {
    const lessons = byType('lesson');
    const cats = new Set(lessons.map((l) => l.category));
    for (const c of LESSON_CATEGORIES) expect(cats, `lesson category ${c}`).toContain(c);
    for (const l of lessons) {
      const d = l.data as Record<string, unknown>;
      expect(Array.isArray(d.objectives), l.slug).toBe(true);
      expect(Array.isArray(d.quiz) && (d.quiz as unknown[]).length > 0, l.slug).toBe(true);
    }
  });

  it('all 13 special-needs topics are present with full fields', () => {
    const sn = byType('special_need');
    const keys = new Set(sn.map((s) => s.category));
    for (const k of SPECIAL_NEEDS_KEYS) expect(keys, `special need ${k}`).toContain(k);
    for (const s of sn) {
      const d = s.data as Record<string, unknown>;
      for (const field of ['overview', 'strengths', 'possibleSigns', 'myths', 'homeSupport', 'schoolSupport', 'professionalSupport', 'faq', 'references']) {
        expect(d[field], `${s.slug} missing ${field}`).toBeDefined();
      }
    }
  });

  it('stories cover every story type', () => {
    const types = new Set(byType('story').map((s) => s.category));
    for (const t of STORY_TYPES) expect(types, `story type ${t}`).toContain(t);
  });

  it('every printable type is present', () => {
    const types = new Set(byType('printable').map((p) => p.category));
    for (const t of PRINTABLE_TYPES.filter((type) => type !== 'flash_cards')) {
      expect(types, `printable ${t}`).toContain(t);
    }
    expect(types).not.toContain('flash_cards');
    expect(CONTENT_SEED.some((item) => item.slug === FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG))
      .toBe(false);
  });

  it('activities carry the required structured fields', () => {
    for (const a of byType('activity')) {
      const d = a.data as Record<string, unknown>;
      for (const field of ['materials', 'setup', 'instructions', 'safety', 'outcomes', 'domains']) {
        expect(d[field], `${a.slug} missing ${field}`).toBeDefined();
      }
      expect(typeof a.durationMinutes, a.slug).toBe('number');
    }
  });

  it('media architecture is attached (activities/lessons/stories have media refs)', () => {
    for (const i of CONTENT_SEED) {
      if (['activity', 'lesson', 'story', 'special_need', 'printable'].includes(i.type)) {
        expect(Array.isArray(i.media) && i.media.length > 0, i.slug).toBe(true);
      }
    }
  });
});
