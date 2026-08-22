import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useUnsavedChangesGuard } from '../app/useUnsavedChangesGuard';
import { OwnDisplayName } from '../components/OwnDisplayName';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AGE_GROUPS, CONTENT_TYPES, type ContentType } from '../content/taxonomy';
// One source for who may review what, shared with the mutation. Two copies of
// this rule drifted apart once already; the UI must not offer an action the
// server will refuse.
import {
  REVIEW_REFUSAL_LABELS,
  roleMayReview as mayReview,
  type ReviewRefusalCode,
} from '../../convex/lib/reviewPolicy';
import { OwnerPriorityView, type QueueRowView } from './ownerPriority/OwnerPriorityView';
import { ClassificationImportPreview } from './ownerPriority/ClassificationImportPreview';
import { OwnerActionsPanel, SecuritySummaryPanel } from './ownerPriority/OwnerActionsPanel';
import { BulkReplacePanel } from './contentReview/BulkReplacePanel';
import { ManualReviewPanel } from './contentReview/ManualReviewPanel';
import { matchesSearchQuery, normalizeSearchText } from '../domain/search';

const DIMENSIONS = ['english', 'native_myanmar', 'child_development', 'evidence', 'safety', 'clinical'] as const;
const DECISIONS = ['in_review', 'approved', 'changes_requested', 'not_applicable'] as const;
type Dimension = (typeof DIMENSIONS)[number];
type Decision = (typeof DECISIONS)[number];
type StaffRole = 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'review_manager' | 'support';

const DIMENSION_LABELS: Record<Dimension, { mm: string; en: string }> = {
  english: { mm: 'အင်္ဂလိပ်စာနှင့် အကြောင်းအရာ', en: 'English copy and content' },
  native_myanmar: { mm: 'သဘာဝကျသော မြန်မာအသုံးအနှုန်း', en: 'Native Myanmar language' },
  child_development: { mm: 'ကလေးဖွံ့ဖြိုးမှုဆိုင်ရာ အကြောင်းအရာ', en: 'Child-development content' },
  evidence: { mm: 'ကိုးကားအထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  clinical: { mm: 'အထူးကျွမ်းကျင်သူ ဘေးကင်းရေးသုံးသပ်မှု', en: 'Specialist safety review' },
};

const DECISION_LABELS: Record<Decision, { mm: string; en: string }> = {
  in_review: { mm: 'စစ်ဆေးဆဲ', en: 'In review' },
  approved: { mm: 'ဤမူကွဲကို အတည်ပြုသည်', en: 'Approve this revision' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် လိုအပ်သည်', en: 'Changes requested' },
  not_applicable: { mm: 'မသက်ဆိုင်ပါ', en: 'Not applicable' },
};

const CONTENT_TYPE_LABELS: Record<ContentType, { mm: string; en: string }> = {
  milestone: { mm: 'ဖွံ့ဖြိုးမှုမှတ်တိုင်', en: 'Milestone' },
  guide: { mm: 'မိဘလမ်းညွှန်', en: 'Guide' },
  activity: { mm: 'လှုပ်ရှားမှု', en: 'Activity' },
  lesson: { mm: 'သင်ခန်းစာ', en: 'Lesson' },
  special_need: { mm: 'အထူးလိုအပ်ချက်', en: 'Special needs' },
  story: { mm: 'ပုံပြင်', en: 'Story' },
  printable: { mm: 'ပုံနှိပ်အသုံးပြုရန်', en: 'Printable' },
};

export function contentTypeLabel(type: string, locale: 'mm' | 'en'): string {
  return CONTENT_TYPE_LABELS[type as ContentType]?.[locale] ?? type;
}

export interface ReviewSearchCandidate {
  slug: string;
  titleMm: string;
  titleEn: string;
  type: string;
  category: string | null;
  ageGroupKey: string | null;
  domainKey: string | null;
  clinicalStatus: string;
  reviewScope: string | null;
  reviewRevision: number;
  priority: string;
  riskClass: string;
  riskReasons: string[];
  activeReviewers: string[];
  priorityStatus: string;
}

function reviewSearchRank(candidate: ReviewSearchCandidate, query: string): number {
  const normalized = normalizeSearchText(query);
  const slug = normalizeSearchText(candidate.slug);
  const titles = [normalizeSearchText(candidate.titleMm), normalizeSearchText(candidate.titleEn)];
  if (slug === normalized || titles.includes(normalized)) return 0;
  if (slug.startsWith(normalized)) return 1;
  if (titles.some((title) => title.startsWith(normalized))) return 2;
  return 3;
}

/** Search the reviewer's entire permitted queue, not only the selected type. */
export function findReviewSearchResults<T extends ReviewSearchCandidate>(rows: T[], query: string): T[] {
  if (!normalizeSearchText(query)) return [];
  return rows
    .filter((candidate) => matchesSearchQuery(query, [
      candidate.titleMm, candidate.titleEn, candidate.slug, candidate.type,
      candidate.category, candidate.ageGroupKey, candidate.domainKey,
      candidate.clinicalStatus, candidate.reviewScope, candidate.reviewRevision,
      candidate.priority, candidate.riskClass, candidate.riskReasons,
      candidate.activeReviewers, candidate.priorityStatus,
    ]))
    .map((candidate, originalIndex) => ({ candidate, originalIndex, rank: reviewSearchRank(candidate, query) }))
    .sort((left, right) => left.rank - right.rank || left.originalIndex - right.originalIndex)
    .map(({ candidate }) => candidate);
}

// Reviews and their history come from the database, where a legacy or
// otherwise-unrecognised dimension/decision string can exist (renamed enum, an
// older deployment, a hand-inserted row). A bare `LABELS[value][locale]` throws
// on the undefined lookup and, because this screen renders inside the screen
// error boundary, that turns the whole "Review item" tab into the recovery
// screen — the reviewer taps it and cannot continue. These fall back to the raw
// value so an unexpected string is shown, never crashed on.
export function decisionLabel(decision: string, locale: 'mm' | 'en'): string {
  return DECISION_LABELS[decision as Decision]?.[locale] ?? decision;
}
export function dimensionLabel(dimension: string, locale: 'mm' | 'en'): string {
  return DIMENSION_LABELS[dimension as Dimension]?.[locale] ?? dimension;
}

function mayEditContent(role: StaffRole | null | undefined): boolean {
  return !!role && role !== 'support';
}

export type EditableField = {
  key: string;
  path: string[];
  value: string;
  multiline: boolean;
  list: boolean;
  language: 'mm' | 'en' | 'neutral';
};

const LANGUAGE_ORDER: Record<EditableField['language'], number> = { mm: 0, neutral: 1, en: 2 };

const FIELD_LABELS: Record<string, { mm: string; en: string }> = {
  encouragementMm: { mm: 'အားပေးစကား', en: 'Encouragement (Myanmar)' },
  encouragementEn: { mm: 'အားပေးစကား (English)', en: 'Encouragement' },
  redMm: { mm: 'သတိပြုရမည့်အချက်', en: 'Warning sign (Myanmar)' },
  redEn: { mm: 'သတိပြုရမည့်အချက် (English)', en: 'Warning sign' },
  observeMm: { mm: 'မိဘက စောင့်ကြည့်နိုင်သည့်အချက်', en: 'What a parent may observe' },
  observeEn: { mm: 'စောင့်ကြည့်နိုင်သည့်အချက် (English)', en: 'What a parent may observe' },
  whyMm: { mm: 'ဘာကြောင့် အရေးကြီးသနည်း', en: 'Why it matters (Myanmar)' },
  whyEn: { mm: 'ဘာကြောင့် အရေးကြီးသနည်း (English)', en: 'Why it matters' },
  objectiveMm: { mm: 'ရည်ရွယ်ချက်', en: 'Objective (Myanmar)' },
  objectiveEn: { mm: 'ရည်ရွယ်ချက် (English)', en: 'Objective' },
  materialsMm: { mm: 'လိုအပ်သည့်ပစ္စည်းများ', en: 'Materials (Myanmar)' },
  materialsEn: { mm: 'လိုအပ်သည့်ပစ္စည်းများ (English)', en: 'Materials' },
  stepsMm: { mm: 'လုပ်ဆောင်ရမည့်အဆင့်များ', en: 'Steps (Myanmar)' },
  stepsEn: { mm: 'လုပ်ဆောင်ရမည့်အဆင့်များ (English)', en: 'Steps' },
  safetyMm: { mm: 'ဘေးကင်းရေး သတိပြုရန်', en: 'Safety (Myanmar)' },
  safetyEn: { mm: 'ဘေးကင်းရေး သတိပြုရန် (English)', en: 'Safety' },
  tipsMm: { mm: 'အကြံပြုချက်များ', en: 'Tips (Myanmar)' },
  tipsEn: { mm: 'အကြံပြုချက်များ (English)', en: 'Tips' },
  bodyMm: { mm: 'မြန်မာအကြောင်းအရာ', en: 'Myanmar content' },
  bodyEn: { mm: 'အင်္ဂလိပ်အကြောင်းအရာ', en: 'English content' },
};

const BILINGUAL_FIELD_LABELS: Record<string, { mm: string; en: string }> = {
  q: { mm: 'မေးခွန်း', en: 'Question' },
  a: { mm: 'အဖြေ', en: 'Answer' },
  title: { mm: 'ခေါင်းစဉ်', en: 'Title' },
  overview: { mm: 'အကျဉ်းချုပ်', en: 'Overview' },
  body: { mm: 'အကြောင်းအရာ', en: 'Content' },
  observe: { mm: 'မိဘက စောင့်ကြည့်နိုင်သည့်အချက်', en: 'What a parent may observe' },
  why: { mm: 'ဘာကြောင့် အရေးကြီးသနည်း', en: 'Why it matters' },
  objective: { mm: 'ရည်ရွယ်ချက်', en: 'Objective' },
  materials: { mm: 'လိုအပ်သည့်ပစ္စည်းများ', en: 'Materials' },
  setup: { mm: 'ကြိုတင်ပြင်ဆင်ရန်', en: 'Preparation' },
  steps: { mm: 'လုပ်ဆောင်ရမည့်အဆင့်များ', en: 'Steps' },
  safety: { mm: 'ဘေးကင်းရေး သတိပြုရန်', en: 'Safety' },
  tips: { mm: 'အကြံပြုချက်များ', en: 'Tips' },
  referral: { mm: 'ကျွမ်းကျင်သူနှင့် တိုင်ပင်ရန်', en: 'When to seek professional support' },
  encouragement: { mm: 'အားပေးစကား', en: 'Encouragement' },
  takeaway: { mm: 'အဓိက မှတ်သားရန်', en: 'Key takeaway' },
  actionToday: { mm: 'ယနေ့ စတင်လုပ်ဆောင်ရန်', en: 'Action today' },
  myth: { mm: 'အယူအဆမှား', en: 'Myth' },
  fact: { mm: 'မှန်ကန်သောအချက်', en: 'Fact' },
  red: { mm: 'သတိပြုရမည့်အချက်', en: 'Warning sign' },
  observationQuestions: { mm: 'စောင့်ကြည့်ရန် မေးခွန်း', en: 'Observation question' },
  dailyActivities: { mm: 'နေ့စဉ် လုပ်ဆောင်ချက်', en: 'Daily activity' },
  redFlags: { mm: 'သတိပြုရမည့် လက္ခဏာ', en: 'Warning sign' },
  instructions: { mm: 'လုပ်ဆောင်နည်း', en: 'Instruction' },
  parentTips: { mm: 'မိဘအတွက် အကြံပြုချက်', en: 'Parent tip' },
  indoor: { mm: 'အိမ်တွင်း လုပ်ဆောင်ချက်', en: 'Indoor activity' },
  weeklyActivities: { mm: 'အပတ်စဉ် လုပ်ဆောင်ချက်', en: 'Weekly activity' },
  commonMistakes: { mm: 'ရှောင်သင့်သည့် အမှား', en: 'Common mistake to avoid' },
  lowCost: { mm: 'ကုန်ကျစရိတ်နည်း လုပ်ဆောင်ချက်', en: 'Low-cost activity' },
  outcomes: { mm: 'စောင့်ကြည့်နိုင်သည့် ရလဒ်', en: 'What a caregiver may observe' },
  outdoor: { mm: 'အိမ်ပြင် လုပ်ဆောင်ချက်', en: 'Outdoor activity' },
  variations: { mm: 'ပြောင်းလဲလုပ်ဆောင်နိုင်သည့် နည်းလမ်း', en: 'Variation' },
  options: { mm: 'ရွေးချယ်နိုင်သည့် နည်းလမ်း', en: 'Option' },
  possibleSigns: { mm: 'ဖြစ်နိုင်သည့် လက္ခဏာ', en: 'Possible sign' },
  vocabulary: { mm: 'သင်ယူမည့် စကားလုံး', en: 'Vocabulary' },
  activities: { mm: 'လှုပ်ရှားမှု', en: 'Activity' },
  objectives: { mm: 'ရည်ရွယ်ချက်', en: 'Objective' },
  strengths: { mm: 'အားသာချက်', en: 'Strength' },
  homeSupport: { mm: 'အိမ်တွင် ပံ့ပိုးနိုင်သည့်နည်း', en: 'Support at home' },
  schoolSupport: { mm: 'ကျောင်းတွင် ပံ့ပိုးနိုင်သည့်နည်း', en: 'Support at school' },
  professionalSupport: { mm: 'ပညာရှင်ထံမှ ပံ့ပိုးမှု', en: 'Professional support' },
  questions: { mm: 'မေးခွန်း', en: 'Question' },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fieldLanguage(key: string, value: string): EditableField['language'] {
  if (/mm$/i.test(key) || /[\u1000-\u109f]/u.test(value)) return 'mm';
  if (/en$/i.test(key)) return 'en';
  return 'neutral';
}

export const HIDDEN_SYSTEM_FIELDS = new Set([
  'editorialStatus',
  'evidenceSummary',
  'format',
  'requestedFormat',
  'availability',
  'readingLevel',
  'domains',
  'references',
  'relatedMilestones',
  'relatedLessons',
  'relatedActivities',
]);

export function collectEditableFields(value: unknown, path: string[] = []): EditableField[] {
  if (typeof value === 'string') {
    const key = path[path.length - 1] ?? 'text';
    return [{ key, path, value, multiline: value.length > 70 || value.includes('\n'), list: false, language: fieldLanguage(key, value) }];
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((entry) => typeof entry === 'string')) {
      const key = path[path.length - 1] ?? 'items';
      const text = value.join('\n');
      return [{ key, path, value: text, multiline: true, list: true, language: fieldLanguage(key, text) }];
    }
    return value.flatMap((entry, index) => collectEditableFields(entry, [...path, String(index)]));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, entry]) => (
      HIDDEN_SYSTEM_FIELDS.has(key) ? [] : collectEditableFields(entry, [...path, key])
    ));
  }
  return [];
}

function cloneStructuredValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneStructuredValue);
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneStructuredValue(entry)]));
  return value;
}

export function updateStructuredField(root: unknown, field: EditableField, nextText: string): unknown {
  const clone = cloneStructuredValue(root);
  if (field.path.length === 0) return nextText;
  let cursor: unknown = clone;
  for (let index = 0; index < field.path.length - 1; index += 1) {
    const segment = field.path[index];
    if (Array.isArray(cursor)) cursor = cursor[Number(segment)];
    else if (isRecord(cursor)) cursor = cursor[segment];
  }
  const final = field.path[field.path.length - 1]!;
  const previous = Array.isArray(cursor) ? cursor[Number(final)] : isRecord(cursor) ? cursor[final] : undefined;
  const nextValue = Array.isArray(previous)
    ? nextText.split('\n').map((line) => line.trim()).filter(Boolean)
    : nextText;
  if (Array.isArray(cursor)) cursor[Number(final)] = nextValue;
  else if (isRecord(cursor)) cursor[final] = nextValue;
  return clone;
}

export function humanizeField(field: EditableField, locale: 'mm' | 'en'): string {
  const known = FIELD_LABELS[field.key];
  if (known) return known[locale];
  const section = field.path.some((segment) => /^\d+$/.test(segment))
    ? ` ${Number(field.path.find((segment) => /^\d+$/.test(segment))) + 1}`
    : '';
  const direct = BILINGUAL_FIELD_LABELS[field.key];
  if (direct) return `${direct[locale]}${section}`;
  const isBilingualLeaf = field.key === 'mm' || field.key === 'en';
  const conceptKey = isBilingualLeaf
    ? [...field.path.slice(0, -1)].reverse().find((segment) => !/^\d+$/.test(segment))
    : undefined;
  const bilingual = conceptKey ? BILINGUAL_FIELD_LABELS[conceptKey] : undefined;
  if (bilingual) {
    const language = field.key === 'mm'
      ? (locale === 'mm' ? 'မြန်မာ' : 'Myanmar')
      : 'English';
    return `${bilingual[locale]}${section} (${language})`;
  }
  const base = field.key
    .replace(/(Mm|En)$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return `${base || (locale === 'mm' ? 'အကြောင်းအရာ' : 'Content')}${section}`;
}

export function formatEditorFieldReference(path: string[]): string {
  let reference = '';
  for (const segment of path) {
    if (/^\d+$/.test(segment)) reference += `[${Number(segment) + 1}]`;
    else reference += reference ? `.${segment}` : segment;
  }
  return reference;
}

export function reviewFieldElementId(path: string): string {
  return `review-field-${path.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
}

type ContentEditorItem = {
  slug: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  data: unknown;
  reviewRevision?: number;
};

function contentEditorSnapshot(item: ContentEditorItem): string {
  return JSON.stringify({
    titleMm: item.titleMm,
    titleEn: item.titleEn,
    summaryMm: item.summaryMm ?? '',
    summaryEn: item.summaryEn ?? '',
    data: item.data,
  });
}

function ContentEditor({ item, role, targetFieldPath, onDirtyChange }: { item: {
  slug: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  data: unknown;
  reviewRevision?: number;
}; role: Exclude<StaffRole, 'support'>; targetFieldPath: string | null; onDirtyChange: (dirty: boolean) => void }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const updateDraft = useMutation(api.library.updateDraft);
  const [titleMm, setTitleMm] = useState(item.titleMm);
  const [titleEn, setTitleEn] = useState(item.titleEn);
  const [summaryMm, setSummaryMm] = useState(item.summaryMm ?? '');
  const [summaryEn, setSummaryEn] = useState(item.summaryEn ?? '');
  const [data, setData] = useState<unknown>(item.data);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState(() => contentEditorSnapshot(item));
  const currentSnapshot = useMemo(() => contentEditorSnapshot({
    ...item,
    titleMm,
    titleEn,
    summaryMm,
    summaryEn,
    data,
  }), [data, item, summaryEn, summaryMm, titleEn, titleMm]);
  const dirty = currentSnapshot !== savedSnapshot;
  const editableFields = useMemo(
    () => collectEditableFields(data).sort((left, right) => LANGUAGE_ORDER[left.language] - LANGUAGE_ORDER[right.language]),
    [data],
  );

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!targetFieldPath) return;
    const element = document.getElementById(reviewFieldElementId(targetFieldPath));
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus({ preventScroll: true });
  }, [item.slug, targetFieldPath]);

  useUnsavedChangesGuard(dirty, L(
    'မသိမ်းရသေးသော ပြင်ဆင်ချက်များ ပျောက်သွားမည်။ ဤစာမျက်နှာမှ ထွက်မလား။',
    'Unsaved edits will be lost. Leave this page?',
  ));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const result = await updateDraft({
        slug: item.slug,
        titleMm,
        titleEn,
        summaryMm: summaryMm || undefined,
        summaryEn: summaryEn || undefined,
        data,
        expectedReviewRevision: item.reviewRevision ?? 1,
      });
      setSavedSnapshot(currentSnapshot);
      setMessage(L(
        `ပြင်ဆင်ချက် သိမ်းပြီးပါပြီ။ သုံးသပ်မူကွဲ ${result.reviewRevision} ကို ပြန်လည်စစ်ဆေးရပါမည်။`,
        `Saved. Review revision ${result.reviewRevision} now requires fresh decisions.`,
      ));
    } catch (error) {
      console.error(error); setMessage(L('သိမ်း၍ မရပါ။', 'Unable to save.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{L('အကြောင်းအရာ တည်းဖြတ်ရန်', 'Edit content')}</p>
          <p className="text-sm text-ink-soft">{item.slug} · {L('မူကွဲ', 'revision')} {item.reviewRevision ?? 1}</p>
        </div>
        <span className="rounded-pill bg-pastel-yellow px-3 py-1 text-xs text-ink">
          {L('ပြင်လျှင် ပြန်လည်သုံးသပ်ရမည်', 'Edits reset active review')}
        </span>
      </div>
      <p className="rounded-xl bg-mint-soft px-3 py-2 text-sm text-ink">
        {role === 'content_editor' || role === 'owner'
          ? L(
            'ဤအကောင့်ဖြင့် အကြောင်းအရာစာသားအားလုံးကို တည်းဖြတ်နိုင်သည်။ အဖွဲ့ဝင်၊ ငွေပေးချေမှုနှင့် အထူးကျွမ်းကျင်သူ ဘေးကင်းရေးဆုံးဖြတ်ချက်တို့ကို သီးခြားခွင့်ပြုချက်ဖြင့်သာ စီမံနိုင်သည်။',
            'This account may edit all content wording. Team, billing and specialist safety decisions remain separately permissioned.',
          )
          : L(
            'သုံးသပ်နေစဉ် တွေ့ရှိသည့် စာသားအမှားကို ဤနေရာတွင် တိုက်ရိုက်ပြင်နိုင်သည်။ သိမ်းပြီးနောက် အတည်ပြုချက်များကို မူကွဲအသစ်အတွက် ပြန်လည်စစ်ဆေးရမည်။',
            'You may correct wording directly while reviewing. Saving creates a new revision that requires fresh approvals.',
          )}
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className={`space-y-1 rounded-xl text-sm font-medium text-ink ${targetFieldPath === 'meta.titleMm' ? 'ring-2 ring-sky ring-offset-2' : ''}`}>
          <span>{L('မြန်မာခေါင်းစဉ်', 'Myanmar title')}</span>
          <input id={reviewFieldElementId('meta.titleMm')} value={titleMm} onChange={(event) => setTitleMm(event.target.value)} disabled={busy} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" required />
        </label>
        <label className={`space-y-1 rounded-xl text-sm font-medium text-ink ${targetFieldPath === 'meta.titleEn' ? 'ring-2 ring-sky ring-offset-2' : ''}`}>
          <span>{L('အင်္ဂလိပ်ခေါင်းစဉ်', 'English title')}</span>
          <input id={reviewFieldElementId('meta.titleEn')} value={titleEn} onChange={(event) => setTitleEn(event.target.value)} disabled={busy} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" required />
        </label>
        <label className={`space-y-1 rounded-xl text-sm font-medium text-ink ${targetFieldPath === 'meta.summaryMm' ? 'ring-2 ring-sky ring-offset-2' : ''}`}>
          <span>{L('မြန်မာအနှစ်ချုပ်', 'Myanmar summary')}</span>
          <textarea id={reviewFieldElementId('meta.summaryMm')} value={summaryMm} onChange={(event) => setSummaryMm(event.target.value)} disabled={busy} rows={4} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" />
        </label>
        <label className={`space-y-1 rounded-xl text-sm font-medium text-ink ${targetFieldPath === 'meta.summaryEn' ? 'ring-2 ring-sky ring-offset-2' : ''}`}>
          <span>{L('အင်္ဂလိပ်အနှစ်ချုပ်', 'English summary')}</span>
          <textarea id={reviewFieldElementId('meta.summaryEn')} value={summaryEn} onChange={(event) => setSummaryEn(event.target.value)} disabled={busy} rows={4} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" />
        </label>
      </div>
      <section className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-sm font-bold text-sky-deep">{L('အကြောင်းအရာ အသေးစိတ်', 'Content details')}</h3>
        <p className="mt-1 text-xs text-ink-soft">
          {L('ပြင်လိုသည့်စာသားကို သက်ဆိုင်ရာအကွက်တွင် တိုက်ရိုက်ပြင်ပါ။ နည်းပညာပုံစံဖြင့် ရေးရန် မလိုပါ။', 'Edit each field directly. No technical format is required.')}
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {editableFields.map((field) => {
            const editorPath = `data.${field.path.join('.')}`;
            return (
              <label key={field.path.join('.')} className={`space-y-1 rounded-xl text-sm font-medium text-ink ${targetFieldPath === editorPath ? 'ring-2 ring-sky ring-offset-2' : ''}`}>
                <span>{humanizeField(field, locale)}</span>
                <span className="block font-mono text-[11px] font-normal text-sky-deep">PDF: {formatEditorFieldReference(field.path)}</span>
                {field.multiline ? (
                  <textarea
                    id={reviewFieldElementId(editorPath)}
                    value={field.value}
                    onChange={(event) => setData((current: unknown) => updateStructuredField(current, field, event.target.value))}
                    disabled={busy}
                    rows={Math.min(8, Math.max(3, field.value.split('\n').length + 1))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 leading-7 disabled:opacity-60"
                  />
                ) : (
                  <input
                    id={reviewFieldElementId(editorPath)}
                    value={field.value}
                    onChange={(event) => setData((current: unknown) => updateStructuredField(current, field, event.target.value))}
                    disabled={busy}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 disabled:opacity-60"
                  />
                )}
                {field.list && (
                  <span className="block text-xs font-normal text-ink-soft">{L('တစ်ကြောင်းလျှင် အချက်တစ်ခု ရေးပါ။', 'Write one item per line.')}</span>
                )}
              </label>
            );
          })}
        </div>
        {editableFields.length === 0 && (
          <p className="mt-3 rounded-lg bg-white p-3 text-sm text-ink-soft">{L('ဤအပိုင်းတွင် ပြင်ဆင်နိုင်သည့် စာသားမရှိပါ။', 'This section has no editable text fields.')}</p>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !dirty} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? L('သိမ်းနေသည်…', 'Saving…') : L('ပြင်ဆင်ချက် သိမ်းမည်', 'Save revision')}
        </button>
        {dirty && <span className="text-xs font-medium text-amber-700">{L('မသိမ်းရသေးသော ပြင်ဆင်ချက်များ ရှိပါသည်။', 'You have unsaved changes.')}</span>}
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      </div>
    </form>
  );
}

type WorkspaceTab = 'priority' | 'manual' | 'item' | 'bulkReplace' | 'import' | 'security';

/** Live Owner Priority tab: server queues + the shared presentational view. */
function OwnerPriorityContainer({ onOpenItem }: { onOpenItem: (row: QueueRowView) => void }) {
  const { locale } = useLocale();
  const queues = useQuery(api.ownerPriority.queues);
  if (queues === undefined) return <p className="text-ink-soft">…</p>;
  if (!queues.allowed) return null;
  return (
    <OwnerPriorityView
      locale={locale}
      rows={queues.rows as QueueRowView[]}
      counts={queues.counts}
      ageGroups={AGE_GROUPS}
      contentTypes={[...CONTENT_TYPES]}
      onOpenItem={onOpenItem}
      accessLevel={queues.accessLevel as 'full' | 'correction_scoped' | 'assignment_scoped'}
      dataComplete={queues.dataComplete}
      countsAuthoritative={queues.countsAuthoritative}
    />
  );
}

export function ContentReviewWorkspace() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const access = useQuery(api.admin.myAccess);
  const [tab, setTab] = useState<WorkspaceTab>('priority');
  const [type, setType] = useState('milestone');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [itemQuery, setItemQuery] = useState('');
  const [targetFieldPath, setTargetFieldPath] = useState<string | null>(null);
  const list = useQuery(api.library.listByType, { type });
  const detail = useQuery(api.library.getBySlug, selectedSlug ? { slug: selectedSlug } : 'skip');
  const reviews = useQuery(api.contentReviews.listForContent, selectedSlug ? { contentSlug: selectedSlug } : 'skip');
  const saveDecision = useMutation(api.contentReviews.saveDecision);
  const [dimension, setDimension] = useState<Dimension>('native_myanmar');
  const [decision, setDecision] = useState<Decision>('in_review');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [editorDirty, setEditorDirty] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  // The queue is the single source of what remains outstanding for this row,
  // so the item screen and the queue can never disagree about completion.
  const queueState = useQuery(api.ownerPriority.queues);
  const reviewLookupResults = useQuery(api.library.reviewSearch, itemQuery.trim() ? { q: itemQuery } : 'skip');
  const queueRow = queueState?.rows.find((row) => row.slug === selectedSlug);

  const [pendingSelectionChange, setPendingSelectionChange] = useState<(() => void) | null>(null);
  // Runs `change` immediately when the editor has no unsaved edits; otherwise
  // defers it behind the ConfirmDialog rendered near the top of this screen.
  const requestSelectionChange = (change: () => void) => {
    if (!editorDirty) { change(); return; }
    setPendingSelectionChange(() => change);
  };

  useEffect(() => {
    if (list?.items.length && !list.items.some((item) => item.slug === selectedSlug)) {
      setSelectedSlug(list.items[0].slug);
    }
  }, [list, selectedSlug]);

  useEffect(() => {
    if (!mayReview(access?.role, dimension)) {
      const firstAllowed = DIMENSIONS.find((value) => mayReview(access?.role, value));
      if (firstAllowed) setDimension(firstAllowed);
    }
  }, [access?.role, dimension]);

  const currentByDimension = useMemo(() => new Map(
    reviews?.current.map((review) => [review.dimension, review]) ?? [],
  ), [reviews]);

  const metadataSearchResults = useMemo(
    () => findReviewSearchResults((queueState?.rows ?? []) as QueueRowView[], itemQuery),
    [itemQuery, queueState?.rows],
  );
  const reviewSearchResults = reviewLookupResults ?? metadataSearchResults.map((result) => ({
    slug: result.slug,
    type: result.type,
    titleMm: result.titleMm,
    titleEn: result.titleEn,
    category: result.category,
    ageGroupKey: result.ageGroupKey,
    domainKey: result.domainKey,
    clinicalStatus: result.clinicalStatus,
    reviewRevision: result.reviewRevision,
    matches: [],
  }));

  const submitDecision = async (event: FormEvent) => {
    event.preventDefault();
    // Guard against double submission: the button is disabled while busy, but a
    // queued second click (or Enter) must also be ignored — the server has its
    // own idempotency guard, and the client should not rely on it.
    // A decision must bind to a known revision, so do not submit before the
    // review state has loaded.
    if (!selectedSlug || busy || !reviews) return;
    setBusy(true); setMessage('');
    try {
      const result = await saveDecision({
        contentSlug: selectedSlug,
        dimension,
        decision,
        note: note || undefined,
        // Bind the decision to the revision on screen; the server refuses if
        // the content changed since this screen loaded. Required by the
        // mutation, so the button stays disabled until it is known.
        expectedReviewRevision: reviews.contentVersion ?? 1,
      });
      if (!result.ok) {
        // The server refuses in-band with a code, so the reviewer gets the actual
        // reason instead of an opaque "Server Error" from a thrown exception.
        const label = REVIEW_REFUSAL_LABELS[result.code as ReviewRefusalCode];
        setMessage(label ? label[locale] : result.message);
        // A missing name is the one refusal the reviewer can fix on the spot, so
        // offer the field here rather than sending them to an owner-only screen.
        setNeedsName(result.code === 'display_name_required');
        return;
      }
      setNeedsName(false);
      setNote('');
      setMessage(L('သုံးသပ်ဆုံးဖြတ်ချက်ကို မှတ်တမ်းတင်ပြီးပါပြီ။', 'Review decision recorded.'));
    } catch (error) {
      console.error(error); setMessage(L('မှတ်တမ်းတင်၍ မရပါ။', 'Unable to record decision.'));
    } finally {
      setBusy(false);
    }
  };

  if (access === undefined) return <p className="text-ink-soft">…</p>;
  if (!access?.isStaff || access.role === 'support') {
    return <p className="rounded-card border border-line bg-white p-5 text-ink">{L('ဤသုံးသပ်ရေးနေရာသို့ ဝင်ခွင့် မရှိပါ။', 'You do not have access to this review workspace.')}</p>;
  }

  const item = detail && 'item' in detail ? detail.item : null;
  const isOwner = access.role === 'owner';
  const openItemFromQueue = (row: QueueRowView) => {
    requestSelectionChange(() => {
      setEditorDirty(false);
      setType(row.type);
      setSelectedSlug(row.slug);
      setTargetFieldPath(null);
      setItemQuery('');
      setTab('item');
    });
  };
  const openReviewSearchResult = (result: (typeof reviewSearchResults)[number], fieldPath?: string) => {
    const changesItem = result.slug !== selectedSlug;
    const apply = () => {
      if (changesItem) setEditorDirty(false);
      setType(result.type);
      setSelectedSlug(result.slug);
      setTargetFieldPath(fieldPath ?? result.matches[0]?.path ?? null);
      setItemQuery('');
    };
    if (changesItem) requestSelectionChange(apply); else apply();
  };
  const searchContentFromManualReview = (query: string) => {
    setItemQuery(query);
    setTargetFieldPath(null);
    setTab('item');
  };
  const tabs: Array<{ key: WorkspaceTab; label: string; visible: boolean }> = [
    { key: 'priority', label: L('ဦးစားပေးစစ်ဆေးရန်', 'Owner Priority'), visible: true },
    { key: 'manual', label: L('လူကိုယ်တိုင် စစ်ဆေးရန်', 'Manual review'), visible: true },
    { key: 'item', label: L('အကြောင်းအရာ စစ်ဆေးရန်', 'Review item'), visible: true },
    { key: 'bulkReplace', label: L('ရှာပြီး အစားထိုးရန်', 'Find and replace'), visible: mayEditContent(access.role) },
    { key: 'import', label: L('ခွဲခြားမှု အကြိုစစ်ဆေးရန်', 'Import preview'), visible: isOwner },
    { key: 'security', label: L('လုံခြုံရေး', 'Security'), visible: isOwner },
  ];
  return (
    <div className="space-y-4 pb-4 sm:space-y-5 sm:pb-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint-deep">{L('ACE သုံးသပ်ရေးနေရာ', 'ACE Review Workspace')}</p>
        <h1 className="text-xl font-bold leading-[1.65] text-sky-deep sm:text-2xl sm:leading-[1.5]">{L('အကြောင်းအရာ သုံးသပ်ရေးနေရာ', 'Content review workspace')}</h1>
        <p className="max-w-3xl text-sm leading-7 text-ink-soft">
          {L(
            'အကြောင်းအရာကို ပြင်ဆင်ပြီး ဘာသာစကား၊ ကိုးကားချက်၊ ဘေးကင်းရေးနှင့် ဆေးဘက်ဆိုင်ရာ သုံးသပ်ချက်များကို သီးခြားမှတ်တမ်းတင်နိုင်ပါသည်။ မည်သည့်ဆုံးဖြတ်ချက်ကိုမျှ အလိုအလျောက် မဖြည့်ပါ။',
            'Edit content and record language, child-development, evidence, safety, and clinical decisions separately. No decision is filled automatically.',
          )}
        </p>
      </header>

      {pendingSelectionChange && (
        <ConfirmDialog
          message={L(
            'မသိမ်းရသေးသော ပြင်ဆင်ချက်များ ရှိပါသည်။ မသိမ်းဘဲ အခြားအကြောင်းအရာသို့ ပြောင်းမည်လား။',
            'You have unsaved changes. Change items without saving?',
          )}
          cancelLabel={L('မလုပ်တော့ပါ', 'Cancel')}
          confirmLabel={L('ပြောင်းမည်', 'Change anyway')}
          onCancel={() => setPendingSelectionChange(null)}
          onConfirm={() => { pendingSelectionChange(); setPendingSelectionChange(null); }}
        />
      )}

      <nav
        aria-label={L('အပိုင်းများ', 'Workspace sections')}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {tabs.filter((entry) => entry.visible).map((entry) => (
          <button
            key={entry.key}
            type="button"
            data-testid={`tab-${entry.key}`}
            onClick={() => {
              const apply = () => {
                if (entry.key !== 'item') setEditorDirty(false);
                setTab(entry.key);
              };
              if (entry.key !== tab) requestSelectionChange(apply); else apply();
            }}
            aria-current={tab === entry.key ? 'page' : undefined}
            className={`shrink-0 rounded-pill px-3 py-2.5 text-xs font-semibold leading-6 transition sm:px-4 sm:py-2 sm:text-sm ${
              tab === entry.key ? 'bg-sky text-white' : 'border border-line bg-white text-ink hover:border-sky'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      {tab === 'priority' && <OwnerPriorityContainer onOpenItem={openItemFromQueue} />}
      {tab === 'manual' && <ManualReviewPanel onSearchContent={searchContentFromManualReview} />}
      {tab === 'bulkReplace' && <BulkReplacePanel canEdit={mayEditContent(access.role)} />}
      {tab === 'import' && isOwner && <ClassificationImportPreview />}
      {tab === 'security' && isOwner && <SecuritySummaryPanel />}

      {tab === 'item' && (<>
      <section className="grid gap-3 rounded-card border border-line bg-white p-3 shadow-card sm:grid-cols-[180px_1fr] sm:p-4">
        <label className="space-y-1.5 text-sm font-medium leading-6 text-ink">
          <span>{L('အမျိုးအစား', 'Content type')}</span>
          <select value={type} onChange={(event) => {
            const value = event.target.value;
            requestSelectionChange(() => {
              setEditorDirty(false);
              setType(value);
              setSelectedSlug('');
              setTargetFieldPath(null);
              setItemQuery('');
            });
          }} className="min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 text-base">
            {CONTENT_TYPES.map((value) => <option key={value} value={value}>{contentTypeLabel(value, locale)}</option>)}
          </select>
        </label>
        <div className="space-y-2">
          <label className="block space-y-1.5 text-sm font-medium leading-6 text-ink">
            <span>{L('အကြောင်းအရာ ရှာဖွေရန်', 'Search review items')}</span>
            <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-sky">
              <span aria-hidden="true">🔎</span>
              <input
                type="search"
                value={itemQuery}
                onChange={(event) => setItemQuery(event.target.value)}
                placeholder={L('PDF ထဲက slug၊ စာသား သို့မဟုတ် quiz 1 options 1 ကို ရိုက်ပါ', 'Search a PDF slug, wording, or quiz 1 options 1')}
                className="min-h-touch min-w-0 flex-1 bg-transparent py-2 text-base font-normal outline-none placeholder:text-ink-soft"
              />
              {itemQuery && <button type="button" onClick={() => setItemQuery('')} className="min-h-touch px-2 text-xs text-sky-deep">{L('ဖျက်မည်', 'Clear')}</button>}
            </span>
          </label>
          {itemQuery ? (
            <div role="region" aria-label={L('ရှာဖွေမှု ရလဒ်များ', 'Review search results')} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
                <span>{L(`ကိုက်ညီသည် ${reviewSearchResults.length} / ${queueState?.rows.length ?? 0}`, `${reviewSearchResults.length} of ${queueState?.rows.length ?? 0} match`)}</span>
                <span>{L('အမျိုးအစားအားလုံးထဲမှ ရှာထားသည်', 'Searched across all content types')}</span>
              </div>
              <p className="rounded-lg bg-pastel-yellow px-3 py-2 text-xs leading-5 text-ink">
                {L('အောက်က editor ကို ဖွင့်ရန် လိုချင်သော ရလဒ်ကို နှိပ်ပါ။ ရှာရုံဖြင့် လက်ရှိအကြောင်းအရာ မပြောင်းသေးပါ။', 'Choose a result to open it in the editor below. Searching alone does not change the current item.')}
              </p>
              {reviewLookupResults === undefined ? (
                <p className="py-3 text-sm text-ink-soft" role="status">…</p>
              ) : reviewSearchResults.length > 0 ? (
                <ul className="max-h-80 space-y-2 overflow-y-auto pr-1" data-testid="review-search-results">
                  {reviewSearchResults.slice(0, 30).map((result) => (
                    <li key={result.slug} className={`rounded-xl border p-3 ${result.slug === selectedSlug ? 'border-sky bg-mint-soft' : 'border-line bg-white'}`}>
                      <button
                        type="button"
                        data-testid={`review-search-result-${result.slug}`}
                        onClick={() => openReviewSearchResult(result)}
                        className="w-full text-left transition"
                      >
                        <span className="block font-semibold leading-7 text-ink">{result.titleMm}</span>
                        <span className="block text-sm leading-6 text-ink-soft">{result.titleEn}</span>
                        <span className="mt-1 block break-all text-xs text-sky-deep">{result.slug}</span>
                        <span className="mt-1 block text-xs text-ink-soft">
                          {contentTypeLabel(result.type, locale)}{result.category ? ` · ${result.category}` : ''}{result.ageGroupKey ? ` · ${result.ageGroupKey}` : ''} · {L('မူကွဲ', 'revision')} {result.reviewRevision}
                        </span>
                        {result.slug === selectedSlug && <span className="mt-2 inline-block rounded-pill bg-white px-2 py-1 text-xs font-semibold text-sky-deep">{L('လက်ရှိဖွင့်ထားသည်', 'Currently open')}</span>}
                      </button>
                      {result.matches.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-line pt-3">
                          {result.matches.map((match) => (
                            <button
                              key={`${result.slug}-${match.path}`}
                              type="button"
                              onClick={() => openReviewSearchResult(result, match.path)}
                              className="block w-full rounded-lg bg-canvas px-3 py-2 text-left hover:bg-pastel-yellow"
                            >
                              <span className="block font-mono text-[11px] font-semibold text-sky-deep">{match.reference}</span>
                              <span className="mt-1 line-clamp-2 block text-sm leading-6 text-ink">{match.value}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-line bg-canvas p-4 text-sm text-ink-soft">
                  {L('PDF ထဲက slug သို့မဟုတ် ခေါင်းစဉ်ကို ပြန်စစ်ပါ။ ကိုက်ညီသော အကြောင်းအရာ မတွေ့ပါ။', 'Check the PDF slug or title. No matching review item was found.')}
                </p>
              )}
              {reviewSearchResults.length > 30 && (
                <p className="text-xs text-ink-soft">{L('ပထမ ၃၀ ခုသာ ပြထားသည်—ပိုတိကျသော စာလုံး ထပ်ရိုက်ပါ။', 'Showing the first 30 results—add more words to narrow the search.')}</p>
              )}
            </div>
          ) : (
          <label className="block space-y-1.5 text-sm font-medium leading-6 text-ink">
            <span>{L('သုံးသပ်မည့် အကြောင်းအရာ', 'Item to review')}</span>
            <select value={selectedSlug} onChange={(event) => {
              const value = event.target.value;
              requestSelectionChange(() => {
                setEditorDirty(false);
                setSelectedSlug(value);
                setTargetFieldPath(null);
              });
            }} disabled={!list?.items.length} className="min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 text-base disabled:opacity-60">
              {list && list.items.length === 0 && (
                <option value="">{L('ဤအမျိုးအစားတွင် အကြောင်းအရာ မရှိသေးပါ', 'No content of this type yet')}</option>
              )}
              {list?.items.map((candidate) => (
                <option key={candidate.slug} value={candidate.slug}>{locale === 'mm' ? candidate.titleMm : candidate.titleEn} · {candidate.slug}</option>
              ))}
            </select>
          </label>
          )}
        </div>
      </section>

      {list === undefined && <p className="rounded-card border border-line bg-white p-5 text-ink-soft">…</p>}
      {list && list.items.length === 0 && (
        <div className="rounded-card border border-line bg-white p-5 text-sm text-ink">
          <p className="font-semibold text-ink">{L('ဤနေရာတွင် စစ်ဆေးစရာ အကြောင်းအရာ မရှိသေးပါ။', 'There is no content to review here yet.')}</p>
          <p className="mt-2 text-ink-soft">
            {L(
              'အထက်က “အမျိုးအစား” ကို ပြောင်း၍ အခြားအကြောင်းအရာများ ရှိမရှိ ကြည့်ပါ။ အားလုံး ဗလာဖြစ်နေပါက အကြောင်းအရာစာကြည့်တိုက်ကို ဤ deployment သို့ တင်ရန် ကျန်နေသေးသည် (seed import) — ဆရာဝန်စစ်ဆေးရန်အတွက်တော့ offline HTML စာရွက်ကို သုံးနိုင်ပါသည်။',
              'Change the “Content type” above to see whether other types have items. If every type is empty, the content library has not been imported into this deployment yet (seed import) — for the clinician’s review you can use the offline HTML sheet instead.',
            )}
          </p>
        </div>
      )}

      {item && mayEditContent(access.role) && (
        <ContentEditor
          key={`${item.slug}-${item.updatedAt}`}
          item={item}
          role={access.role as Exclude<StaffRole, 'support'>}
          targetFieldPath={targetFieldPath}
          onDirtyChange={setEditorDirty}
        />
      )}

      {item && reviews?.allowed && (
        <section className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card">
          <div>
            <h2 className="font-bold text-ink">{L('လက်ရှိမူကွဲ၏ သုံးသပ်မှုအခြေအနေ', 'Current revision review status')}</h2>
            <p className="text-sm text-ink-soft">{L('သုံးသပ်မူကွဲ', 'Review revision')} {reviews.contentVersion ?? 1}</p>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {DIMENSIONS.map((value) => {
              const review = currentByDimension.get(value);
              return (
                <div key={value} className="rounded-xl border border-line bg-canvas p-3">
                  <p className="text-sm font-semibold text-ink">{DIMENSION_LABELS[value][locale]}</p>
                  <p className="mt-1 text-xs text-ink-soft">{review ? decisionLabel(review.decision, locale) : L('မစစ်ဆေးရသေး', 'Not reviewed')}</p>
                  {review && <p className="mt-2 text-[11px] text-ink-soft">{review.reviewerDisplayName}</p>}
                </div>
              );
            })}
          </div>

          <form onSubmit={submitDecision} className="grid gap-3 rounded-xl bg-mint-soft p-4 lg:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('သုံးသပ်မှုအမျိုးအစား', 'Review area')}</span>
              <select value={dimension} onChange={(event) => setDimension(event.target.value as Dimension)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {DIMENSIONS.map((value) => (
                  <option key={value} value={value} disabled={!mayReview(access.role, value)}>{DIMENSION_LABELS[value][locale]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('ဆုံးဖြတ်ချက်', 'Decision')}</span>
              <select value={decision} onChange={(event) => setDecision(event.target.value as Decision)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {DECISIONS.map((value) => <option key={value} value={value}>{DECISION_LABELS[value][locale]}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink lg:col-span-2">
              <span>{L('သုံးသပ်မှတ်ချက်', 'Review note')}</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder={decision === 'changes_requested' ? L('ပြင်ဆင်ရမည့်အချက်ကို ရှင်းလင်းစွာ ရေးပါ။', 'Describe the required change clearly.') : undefined} className="w-full rounded-xl border border-line bg-white px-3 py-2" />
            </label>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <button type="submit" disabled={busy || !reviews || !mayReview(access.role, dimension)} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? L('မှတ်တမ်းတင်နေသည်…', 'Recording…') : L('ဆုံးဖြတ်ချက် မှတ်တမ်းတင်မည်', 'Record decision')}
              </button>
              {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
            </div>
          </form>

          {needsName && (
            <OwnDisplayName
              currentName={null}
              variant="inline"
              onSaved={() => {
                setNeedsName(false);
                setMessage(L(
                  'အမည် သိမ်းပြီးပါပြီ — ဆုံးဖြတ်ချက်ကို ပြန်တင်ပါ။',
                  'Name saved — record the decision again.',
                ));
              }}
            />
          )}

          {reviews.history.length > 0 && (
            <details className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-semibold text-sky-deep">{L('ယခင်သုံးသပ်မှတ်တမ်းများ', 'Review history')}</summary>
              <ul className="mt-3 space-y-2">
                {reviews.history.map((review) => (
                  <li key={review._id} className="rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
                    <b className="text-ink">{dimensionLabel(review.dimension, locale)}</b> · {decisionLabel(review.decision, locale)} · {review.reviewerDisplayName} · {new Date(review.reviewedAt).toLocaleDateString()}
                    <span className="ml-2">({L('မူကွဲ', 'revision')} {review.contentVersion})</span>
                    {review.note && <p className="mt-1">{review.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {item && access.role !== null && ['owner', 'content_editor'].includes(access.role) && (
        <OwnerActionsPanel
          slug={item.slug}
          reviewRevision={item.reviewRevision ?? 1}
          role={access.role}
          dataComplete={queueState?.dataComplete ?? true}
          outstandingDimensions={queueRow?.outstandingDimensions ?? []}
        />
      )}
      </>)}
    </div>
  );
}
