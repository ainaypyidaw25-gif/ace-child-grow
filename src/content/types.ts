// Content library item model + builders.
//
// The seed files author terse, genuine records via these builders; `normalize()`
// fills defaults and derives searchText. NOTHING here is fabricated medical
// data — narrative text is general, parent-friendly developmental guidance and
// carries clinicalStatus 'clinical_review' until its risk-scoped reviews pass.

import type { ContentType, ClinicalStatus } from './taxonomy';

export interface Bilingual {
  mm: string;
  en: string;
}

export interface MediaRef {
  kind: 'illustration' | 'animation' | 'audio' | 'video' | 'pdf' | 'download' | 'offline_bundle';
  placeholder?: boolean;
  offline?: boolean;
  note?: string;
}

export interface SeedItem {
  type: ContentType;
  slug: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  durationMinutes?: number;
  offline?: boolean;
  source: string;
  version: number;
  clinicalStatus: ClinicalStatus;
  data: Record<string, unknown>;
  media: MediaRef[];
}

const EDITORIAL_SOURCE =
  'ACE Child Grow editorial content — evidence-mapped general child-development and parent-education guidance';

function base(
  type: ContentType,
  slug: string,
  titleMm: string,
  titleEn: string,
  rest: Partial<SeedItem>,
): SeedItem {
  return {
    ...rest,
    type,
    slug,
    titleMm,
    titleEn,
    tags: rest.tags ?? [],
    source: rest.source ?? EDITORIAL_SOURCE,
    version: rest.version ?? 1,
    clinicalStatus: rest.clinicalStatus ?? 'clinical_review',
    data: rest.data ?? {},
    media: rest.media ?? [],
  };
}

// ---- Builders -------------------------------------------------------------

export function milestone(
  ageGroupKey: string,
  domainKey: string,
  n: number,
  args: { title: Bilingual; observe: Bilingual; why: Bilingual; red?: Bilingual; encouragement?: Bilingual },
): SeedItem {
  return base('milestone', `ms_${ageGroupKey}_${domainKey}_${n}`, args.title.mm, args.title.en, {
    ageGroupKey,
    domainKey,
    tags: [domainKey, ageGroupKey],
    data: {
      observeMm: args.observe.mm, observeEn: args.observe.en,
      whyMm: args.why.mm, whyEn: args.why.en,
      redMm: args.red?.mm, redEn: args.red?.en,
      encouragementMm: args.encouragement?.mm, encouragementEn: args.encouragement?.en,
    },
  });
}

export interface GuideArgs {
  title: Bilingual;
  why: Bilingual;
  observationQuestions: Bilingual[];
  dailyActivities: Bilingual[];
  weeklyActivities?: Bilingual[];
  indoor?: Bilingual[];
  outdoor?: Bilingual[];
  lowCost?: Bilingual[];
  materials?: Bilingual;
  safety?: Bilingual;
  commonMistakes?: Bilingual[];
  parentTips?: Bilingual[];
  faq?: { q: Bilingual; a: Bilingual }[];
  redFlags?: Bilingual[];
  referral?: Bilingual;
  encouragement: Bilingual;
}

export function guide(ageGroupKey: string, domainKey: string, args: GuideArgs): SeedItem {
  return base('guide', `gd_${ageGroupKey}_${domainKey}`, args.title.mm, args.title.en, {
    ageGroupKey,
    domainKey,
    tags: [domainKey, ageGroupKey, 'guide'],
    summaryMm: args.why.mm,
    summaryEn: args.why.en,
    data: { ...args },
  });
}

export interface ActivityArgs {
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  ageGroupKey: string;
  domains: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  materials: Bilingual;
  setup: Bilingual;
  instructions: Bilingual[];
  safety: Bilingual;
  indoor: boolean;
  outdoor: boolean;
  oneChild: boolean;
  group: boolean;
  parentChild: boolean;
  outcomes: Bilingual[];
  variations?: Bilingual[];
  lowCost?: boolean;
  offline?: boolean;
  tags?: string[];
  /** Editorial evidence note only; never an approval or clinical conclusion. */
  evidenceSummary?: string;
}

export function activity(a: ActivityArgs): SeedItem {
  return base('activity', `act_${a.slug}`, a.title.mm, a.title.en, {
    ageGroupKey: a.ageGroupKey,
    domainKey: a.domains[0],
    summaryMm: a.summary.mm,
    summaryEn: a.summary.en,
    difficulty: a.difficulty,
    durationMinutes: a.durationMinutes,
    offline: a.offline ?? true,
    tags: [...(a.tags ?? []), ...a.domains, a.ageGroupKey],
    data: {
      domains: a.domains,
      materials: a.materials,
      setup: a.setup,
      instructions: a.instructions,
      safety: a.safety,
      indoor: a.indoor, outdoor: a.outdoor,
      oneChild: a.oneChild, group: a.group, parentChild: a.parentChild,
      outcomes: a.outcomes,
      variations: a.variations ?? [],
      lowCost: a.lowCost ?? true,
      evidenceSummary: a.evidenceSummary,
    },
    media: [
      { kind: 'illustration', placeholder: true, offline: true },
      { kind: 'video', placeholder: true },
    ],
  });
}

export interface LessonArgs {
  slug: string;
  category: string;
  title: Bilingual;
  summary: Bilingual;
  objectives: Bilingual[];
  readingMinutes: number;
  body: Bilingual;
  quiz: { q: Bilingual; options: Bilingual[]; answerIndex: number }[];
  takeaway: Bilingual;
  actionToday: Bilingual;
  ageGroupKey?: string;
  tags?: string[];
}

export function lesson(a: LessonArgs): SeedItem {
  return base('lesson', `lsn_${a.slug}`, a.title.mm, a.title.en, {
    category: a.category,
    ageGroupKey: a.ageGroupKey,
    summaryMm: a.summary.mm,
    summaryEn: a.summary.en,
    durationMinutes: a.readingMinutes,
    tags: [...(a.tags ?? []), a.category, 'lesson'],
    data: {
      objectives: a.objectives,
      readingMinutes: a.readingMinutes,
      body: a.body,
      quiz: a.quiz,
      takeaway: a.takeaway,
      actionToday: a.actionToday,
    },
    media: [{ kind: 'illustration', placeholder: true, offline: true }],
  });
}

export interface SpecialNeedArgs {
  key: string;
  title: Bilingual;
  overview: Bilingual;
  strengths: Bilingual[];
  possibleSigns: Bilingual[];
  myths: { myth: Bilingual; fact: Bilingual }[];
  homeSupport: Bilingual[];
  schoolSupport: Bilingual[];
  professionalSupport: Bilingual[];
  activities: Bilingual[];
  faq: { q: Bilingual; a: Bilingual }[];
  relatedLessons?: string[];
  relatedActivities?: string[];
  relatedMilestones?: string[];
  references: string[];
}

export function specialNeed(a: SpecialNeedArgs): SeedItem {
  return base('special_need', `sn_${a.key}`, a.title.mm, a.title.en, {
    category: a.key,
    summaryMm: a.overview.mm,
    summaryEn: a.overview.en,
    tags: [a.key, 'hope_center', 'special_needs'],
    data: {
      overview: a.overview,
      strengths: a.strengths,
      possibleSigns: a.possibleSigns,
      myths: a.myths,
      homeSupport: a.homeSupport,
      schoolSupport: a.schoolSupport,
      professionalSupport: a.professionalSupport,
      activities: a.activities,
      faq: a.faq,
      relatedLessons: a.relatedLessons ?? [],
      relatedActivities: a.relatedActivities ?? [],
      relatedMilestones: a.relatedMilestones ?? [],
      references: a.references,
    },
    media: [{ kind: 'pdf', placeholder: true, note: 'printable handout' }],
  });
}

export interface StoryArgs {
  slug: string;
  storyType: string;
  title: Bilingual;
  summary: Bilingual;
  readingLevel: string;
  readingMinutes: number;
  vocabulary: Bilingual[];
  body: Bilingual;
  questions: Bilingual[];
  activities: Bilingual[];
  ageGroupKey?: string;
}

export function story(a: StoryArgs): SeedItem {
  return base('story', `st_${a.slug}`, a.title.mm, a.title.en, {
    category: a.storyType,
    ageGroupKey: a.ageGroupKey,
    summaryMm: a.summary.mm,
    summaryEn: a.summary.en,
    durationMinutes: a.readingMinutes,
    tags: [a.storyType, 'story'],
    data: {
      readingLevel: a.readingLevel,
      readingMinutes: a.readingMinutes,
      vocabulary: a.vocabulary,
      body: a.body,
      questions: a.questions,
      activities: a.activities,
    },
    media: [
      { kind: 'illustration', placeholder: true, offline: true },
      { kind: 'audio', placeholder: true },
      { kind: 'pdf', placeholder: true, note: 'printable version' },
    ],
  });
}

export interface PrintableArgs {
  key: string;
  title: Bilingual;
  description: Bilingual;
  format: string;
}

export function printable(a: PrintableArgs): SeedItem {
  return base('printable', `prt_${a.key}`, a.title.mm, a.title.en, {
    category: a.key,
    summaryMm: a.description.mm,
    summaryEn: a.description.en,
    tags: [a.key, 'printable', 'toolkit'],
    data: {
      format: 'Preview only — bilingual PDF not yet available',
      availability: 'preview_only',
    },
    media: [{ kind: 'pdf', placeholder: true, offline: true, note: 'planned printable resource; no reviewed payload' }],
  });
}

// ---- Normalisation --------------------------------------------------------

export interface NormalizedItem extends SeedItem {
  searchText: string;
}

function collectStrings(value: unknown, out: string[]): void {
  if (value == null) return;
  if (typeof value === 'string') { out.push(value); return; }
  if (Array.isArray(value)) { value.forEach((v) => collectStrings(v, out)); return; }
  if (typeof value === 'object') { Object.values(value).forEach((v) => collectStrings(v, out)); }
}

export function normalize(item: SeedItem): NormalizedItem {
  const parts: string[] = [item.titleMm, item.titleEn, item.summaryMm ?? '', item.summaryEn ?? '', ...item.tags];
  collectStrings(item.data, parts);
  const searchText = parts.join(' ').toLowerCase();
  return { ...item, searchText };
}
