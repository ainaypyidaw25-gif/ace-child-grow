import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useUnsavedChangesGuard } from '../app/useUnsavedChangesGuard';
import { OwnDisplayName } from '../components/OwnDisplayName';
import { CONTENT_TYPES } from '../content/taxonomy';
// One source for who may review what, shared with the mutation. Two copies of
// this rule drifted apart once already; the UI must not offer an action the
// server will refuse.
import {
  REVIEW_REFUSAL_LABELS,
  roleMayReview as mayReview,
  type ReviewRefusalCode,
} from '../../convex/lib/reviewPolicy';
import { AGE_GROUPS } from '../content/taxonomy';
import { OwnerPriorityView, type QueueRowView } from './ownerPriority/OwnerPriorityView';
import { ClassificationImportPreview } from './ownerPriority/ClassificationImportPreview';
import { OwnerActionsPanel, SecuritySummaryPanel } from './ownerPriority/OwnerActionsPanel';

const DIMENSIONS = ['english', 'native_myanmar', 'evidence', 'safety', 'clinical'] as const;
const DECISIONS = ['in_review', 'approved', 'changes_requested', 'not_applicable'] as const;
type Dimension = (typeof DIMENSIONS)[number];
type Decision = (typeof DECISIONS)[number];
type StaffRole = 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'support';

const DIMENSION_LABELS: Record<Dimension, { mm: string; en: string }> = {
  english: { mm: 'အင်္ဂလိပ်စာနှင့် အကြောင်းအရာ', en: 'English copy and content' },
  native_myanmar: { mm: 'သဘာဝကျသော မြန်မာအသုံးအနှုန်း', en: 'Native Myanmar language' },
  evidence: { mm: 'ကိုးကားအထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  clinical: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်မှု', en: 'Clinical review' },
};

const DECISION_LABELS: Record<Decision, { mm: string; en: string }> = {
  in_review: { mm: 'စစ်ဆေးဆဲ', en: 'In review' },
  approved: { mm: 'ဤမူကွဲကို အတည်ပြုသည်', en: 'Approve this revision' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် လိုအပ်သည်', en: 'Changes requested' },
  not_applicable: { mm: 'မသက်ဆိုင်ပါ', en: 'Not applicable' },
};

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
  'readingLevel',
  'domains',
  'references',
  'relatedMilestones',
  'relatedLessons',
  'relatedActivities',
]);

export function collectEditableFields(value: unknown, path: string[] = []): EditableField[] {
  if (typeof value === 'string') {
    const key = path.at(-1) ?? 'text';
    return [{ key, path, value, multiline: value.length > 70 || value.includes('\n'), list: false, language: fieldLanguage(key, value) }];
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((entry) => typeof entry === 'string')) {
      const key = path.at(-1) ?? 'items';
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

function updateStructuredField(root: unknown, field: EditableField, nextText: string): unknown {
  const clone = cloneStructuredValue(root);
  if (field.path.length === 0) return nextText;
  let cursor: unknown = clone;
  for (let index = 0; index < field.path.length - 1; index += 1) {
    const segment = field.path[index];
    if (Array.isArray(cursor)) cursor = cursor[Number(segment)];
    else if (isRecord(cursor)) cursor = cursor[segment];
  }
  const final = field.path.at(-1)!;
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

function ContentEditor({ item, role, onDirtyChange }: { item: {
  slug: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  data: unknown;
  reviewRevision?: number;
}; role: Exclude<StaffRole, 'support'>; onDirtyChange: (dirty: boolean) => void }) {
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
      setMessage(error instanceof Error ? error.message : L('သိမ်း၍ မရပါ။', 'Unable to save.'));
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
            'ဤအကောင့်ဖြင့် အကြောင်းအရာစာသားအားလုံးကို တည်းဖြတ်နိုင်သည်။ အဖွဲ့ဝင်၊ ငွေပေးချေမှုနှင့် ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက်တို့ကို သီးခြားခွင့်ပြုချက်ဖြင့်သာ စီမံနိုင်သည်။',
            'This account may edit all content wording. Team, billing and clinical approval remain separately permissioned.',
          )
          : L(
            'သုံးသပ်နေစဉ် တွေ့ရှိသည့် စာသားအမှားကို ဤနေရာတွင် တိုက်ရိုက်ပြင်နိုင်သည်။ သိမ်းပြီးနောက် အတည်ပြုချက်များကို မူကွဲအသစ်အတွက် ပြန်လည်စစ်ဆေးရမည်။',
            'You may correct wording directly while reviewing. Saving creates a new revision that requires fresh approvals.',
          )}
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာခေါင်းစဉ်</span>
          <input value={titleMm} onChange={(event) => setTitleMm(event.target.value)} disabled={busy} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English title</span>
          <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} disabled={busy} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာအနှစ်ချုပ်</span>
          <textarea value={summaryMm} onChange={(event) => setSummaryMm(event.target.value)} disabled={busy} rows={4} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English summary</span>
          <textarea value={summaryEn} onChange={(event) => setSummaryEn(event.target.value)} disabled={busy} rows={4} className="w-full rounded-xl border border-line px-3 py-2 disabled:opacity-60" />
        </label>
      </div>
      <section className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-sm font-bold text-sky-deep">{L('အကြောင်းအရာ အသေးစိတ်', 'Content details')}</h3>
        <p className="mt-1 text-xs text-ink-soft">
          {L('ပြင်လိုသည့်စာသားကို သက်ဆိုင်ရာအကွက်တွင် တိုက်ရိုက်ပြင်ပါ။ နည်းပညာပုံစံဖြင့် ရေးရန် မလိုပါ။', 'Edit each field directly. No technical format is required.')}
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {editableFields.map((field) => (
            <label key={field.path.join('.')} className="space-y-1 text-sm font-medium text-ink">
              <span>{humanizeField(field, locale)}</span>
              {field.multiline ? (
                <textarea
                  value={field.value}
                  onChange={(event) => setData((current: unknown) => updateStructuredField(current, field, event.target.value))}
                  disabled={busy}
                  rows={Math.min(8, Math.max(3, field.value.split('\n').length + 1))}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 leading-7 disabled:opacity-60"
                />
              ) : (
                <input
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
          ))}
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

type WorkspaceTab = 'priority' | 'item' | 'import' | 'security';

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
  const queueRow = queueState?.rows.find((row) => row.slug === selectedSlug);

  const confirmSelectionChange = () => !editorDirty || window.confirm(L(
    'မသိမ်းရသေးသော ပြင်ဆင်ချက်များ ရှိပါသည်။ မသိမ်းဘဲ အခြားအကြောင်းအရာသို့ ပြောင်းမည်လား။',
    'You have unsaved changes. Change items without saving?',
  ));

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
      setMessage(error instanceof Error ? error.message : L('မှတ်တမ်းတင်၍ မရပါ။', 'Unable to record decision.'));
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
    if (!confirmSelectionChange()) return;
    setEditorDirty(false);
    setType(row.type);
    setSelectedSlug(row.slug);
    setTab('item');
  };
  const tabs: Array<{ key: WorkspaceTab; label: string; visible: boolean }> = [
    { key: 'priority', label: L('ဦးစားပေးစစ်ဆေးရန်', 'Owner Priority'), visible: true },
    { key: 'item', label: L('အကြောင်းအရာ စစ်ဆေးရန်', 'Review item'), visible: true },
    { key: 'import', label: L('Classification Import Preview', 'Classification Import Preview'), visible: isOwner },
    { key: 'security', label: L('လုံခြုံရေး', 'Security'), visible: isOwner },
  ];
  return (
    <div className="space-y-5 pb-24">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">ACE Review Workspace</p>
        <h1 className="text-2xl font-bold text-sky-deep">{L('အကြောင်းအရာ သုံးသပ်ရေးနေရာ', 'Content review workspace')}</h1>
        <p className="max-w-3xl text-sm text-ink-soft">
          {L(
            'အကြောင်းအရာကို ပြင်ဆင်ပြီး ဘာသာစကား၊ ကိုးကားချက်၊ ဘေးကင်းရေးနှင့် ဆေးဘက်ဆိုင်ရာ သုံးသပ်ချက်များကို သီးခြားမှတ်တမ်းတင်နိုင်ပါသည်။ မည်သည့်ဆုံးဖြတ်ချက်ကိုမျှ အလိုအလျောက် မဖြည့်ပါ။',
            'Edit content and record language, evidence, safety, and clinical decisions separately. No decision is filled automatically.',
          )}
        </p>
      </header>

      <nav aria-label={L('အပိုင်းများ', 'Workspace sections')} className="flex flex-wrap gap-2">
        {tabs.filter((entry) => entry.visible).map((entry) => (
          <button
            key={entry.key}
            type="button"
            data-testid={`tab-${entry.key}`}
            onClick={() => {
              if (entry.key !== tab && !confirmSelectionChange()) return;
              if (entry.key !== 'item') setEditorDirty(false);
              setTab(entry.key);
            }}
            aria-current={tab === entry.key ? 'page' : undefined}
            className={`rounded-pill px-4 py-2 text-sm font-semibold transition ${
              tab === entry.key ? 'bg-sky text-white' : 'border border-line bg-white text-ink hover:border-sky'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      {tab === 'priority' && <OwnerPriorityContainer onOpenItem={openItemFromQueue} />}
      {tab === 'import' && isOwner && <ClassificationImportPreview />}
      {tab === 'security' && isOwner && <SecuritySummaryPanel />}

      {tab === 'item' && (<>
      <section className="grid gap-3 rounded-card border border-line bg-white p-4 shadow-card sm:grid-cols-[180px_1fr]">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('အမျိုးအစား', 'Content type')}</span>
          <select value={type} onChange={(event) => {
            if (!confirmSelectionChange()) return;
            setEditorDirty(false);
            setType(event.target.value);
            setSelectedSlug('');
          }} className="w-full rounded-xl border border-line bg-white px-3 py-2">
            {CONTENT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('သုံးသပ်မည့် အကြောင်းအရာ', 'Item to review')}</span>
          <select value={selectedSlug} onChange={(event) => {
            if (!confirmSelectionChange()) return;
            setEditorDirty(false);
            setSelectedSlug(event.target.value);
          }} className="w-full rounded-xl border border-line bg-white px-3 py-2">
            {list?.items.map((candidate) => (
              <option key={candidate.slug} value={candidate.slug}>{locale === 'mm' ? candidate.titleMm : candidate.titleEn}</option>
            ))}
          </select>
        </label>
      </section>

      {item && mayEditContent(access.role) && (
        <ContentEditor
          key={`${item.slug}-${item.updatedAt}`}
          item={item}
          role={access.role as Exclude<StaffRole, 'support'>}
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
                  <p className="mt-1 text-xs text-ink-soft">{review ? DECISION_LABELS[review.decision][locale] : L('မစစ်ဆေးရသေး', 'Not reviewed')}</p>
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
                    <b className="text-ink">{DIMENSION_LABELS[review.dimension][locale]}</b> · {DECISION_LABELS[review.decision][locale]} · {review.reviewerDisplayName} · {new Date(review.reviewedAt).toLocaleDateString()}
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
