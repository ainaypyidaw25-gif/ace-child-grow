import { useMemo, useState } from 'react';
import type { DashboardCounts, OwnerPriority, PriorityStatus, RiskClass } from '../../../convex/lib/ownerPriority';

// Presentational owner-priority workspace. Everything renders from props so
// the live container (Convex-wired) and the layout/screenshot harness share
// one implementation — the screen the tests photograph IS the screen the
// owner uses.

export interface QueueRowView {
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
  parentVisibleNow: boolean;
  priority: OwnerPriority;
  priorityReasons: string[];
  riskClass: RiskClass;
  riskReasons: string[];
  provisionalClassification: boolean;
  requiredReviewDimensions: string[];
  suggestedReviewDimensions: string[];
  manualTriageRequired: boolean;
  outstandingDimensions: string[];
  approvedDimensions: string[];
  activeReviewers: string[];
  hasActiveAssignment: boolean;
  evidenceStatus: string;
  priorityStatus: PriorityStatus;
  temporarilyHideRecommended: boolean;
  ownerNote: string | null;
  latestEditAt: number | null;
  latestDecisionAt: number | null;
  warnings: string[];
}

export interface QueueFilters {
  priority: OwnerPriority | 'all';
  riskClass: RiskClass | 'all';
  visibility: 'all' | 'visible' | 'unpublished';
  type: string;
  ageGroup: string;
  clinicalRequired: boolean;
  safetyRequired: boolean;
  assignmentStatus: 'all' | 'assigned' | 'requested' | 'unassigned';
  correctionStatus: 'all' | PriorityStatus;
}

export const DEFAULT_FILTERS: QueueFilters = {
  priority: 'all',
  riskClass: 'all',
  visibility: 'all',
  type: 'all',
  ageGroup: 'all',
  clinicalRequired: false,
  safetyRequired: false,
  assignmentStatus: 'all',
  correctionStatus: 'all',
};

export function applyQueueFilters(rows: QueueRowView[], filters: QueueFilters): QueueRowView[] {
  return rows.filter((row) => {
    if (filters.priority !== 'all' && row.priority !== filters.priority) return false;
    if (filters.riskClass !== 'all' && row.riskClass !== filters.riskClass) return false;
    if (filters.visibility === 'visible' && !row.parentVisibleNow) return false;
    if (filters.visibility === 'unpublished' && row.parentVisibleNow) return false;
    if (filters.type !== 'all' && row.type !== filters.type) return false;
    if (filters.ageGroup !== 'all' && row.ageGroupKey !== filters.ageGroup) return false;
    if (filters.clinicalRequired && !row.outstandingDimensions.includes('clinical')) return false;
    if (filters.safetyRequired && !row.outstandingDimensions.includes('safety')) return false;
    // "Assigned" means a real assignment exists — a review REQUEST is not one.
    if (filters.assignmentStatus === 'assigned' && !row.hasActiveAssignment) return false;
    if (filters.assignmentStatus === 'requested' && row.priorityStatus !== 'review_requested') return false;
    if (filters.assignmentStatus === 'unassigned' && row.hasActiveAssignment) return false;
    if (filters.correctionStatus !== 'all' && row.priorityStatus !== filters.correctionStatus) return false;
    return true;
  });
}

const PRIORITY_STYLES: Record<OwnerPriority, string> = {
  P0: 'bg-red-600 text-white',
  P1: 'bg-orange-500 text-white',
  P2: 'bg-amber-400 text-ink',
  P3: 'bg-mint-soft text-ink',
};

const PRIORITY_LABELS: Record<OwnerPriority, { mm: string; en: string }> = {
  P0: { mm: 'P0 — ချက်ချင်း ဘေးကင်းရေး ပြင်ဆင်ရန်', en: 'P0 — Immediate safety correction' },
  P1: { mm: 'P1 — မိဘမြင် ဆေး/ဘေးကင်းရေး စစ်ဆေးရန်', en: 'P1 — Parent-visible clinical/safety review' },
  P2: { mm: 'P2 — မထုတ်ဝေရသေးသော ဆေး/ဘေးကင်းရေး', en: 'P2 — Unpublished clinical/safety review' },
  P3: { mm: 'P3 — ပုံမှန် စစ်ဆေးမှု', en: 'P3 — Standard review' },
};

const STATUS_LABELS: Record<PriorityStatus, { mm: string; en: string }> = {
  unreviewed: { mm: 'မစစ်ရသေး', en: 'Unreviewed' },
  confirmed: { mm: 'အဆင့် အတည်ပြုပြီး', en: 'Class confirmed' },
  manual_triage_required: { mm: 'လူကိုယ်တိုင် စိစစ်ရန် လို', en: 'Manual triage required' },
  correction_needed: { mm: 'ပြင်ဆင်ရန် လို', en: 'Correction needed' },
  review_requested: { mm: 'စစ်ဆေးမှု တောင်းဆိုထား', en: 'Review requested' },
  assigned: { mm: 'တာဝန်ပေးထား', en: 'Assigned' },
  in_review: { mm: 'စစ်ဆေးဆဲ', en: 'In review' },
  corrected: { mm: 'ပြင်ဆင်ပြီး', en: 'Corrected' },
  ready_for_recheck: { mm: 'ပြန်စစ်ရန် အသင့်', en: 'Ready for recheck' },
  triage_complete: { mm: 'ဦးစားပေး စိစစ်မှု ပြီးဆုံး', en: 'Priority triage complete' },
  completed: { mm: 'စစ်ဆေးမှု အားလုံး ပြီးဆုံး', en: 'All reviews completed' },
};

const DIMENSION_SHORT: Record<string, { mm: string; en: string }> = {
  native_myanmar: { mm: 'မြန်မာ', en: 'Myanmar' },
  english: { mm: 'English', en: 'English' },
  child_development: { mm: 'ကလေးဖွံ့ဖြိုးမှု', en: 'Child development' },
  evidence: { mm: 'အထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  clinical: { mm: 'ဆေးဘက်', en: 'Clinical' },
};

function formatTime(value: number | null, locale: 'mm' | 'en'): string {
  if (value === null) return locale === 'mm' ? 'မရှိသေး' : 'none yet';
  return new Date(value).toLocaleString(locale === 'mm' ? 'my-MM' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Yangon',
  });
}

export interface OwnerPriorityViewProps {
  locale: 'mm' | 'en';
  rows: QueueRowView[];
  counts: DashboardCounts;
  ageGroups: Array<{ key: string; labelMm: string; labelEn: string }>;
  contentTypes: string[];
  initialFilters?: Partial<QueueFilters>;
  onOpenItem?: (row: QueueRowView) => void;
  /** 'full' sees the catalogue and roster; scoped callers see less. */
  accessLevel?: 'full' | 'correction_scoped' | 'assignment_scoped';
  /** False when review/edit history could not be read in full. */
  dataComplete?: boolean;
  /** False when counts must not be presented as authoritative. */
  countsAuthoritative?: boolean;
}

export function OwnerPriorityView({
  locale, rows, counts, ageGroups, contentTypes, initialFilters, onOpenItem,
  accessLevel = 'full', dataComplete = true, countsAuthoritative = true,
}: OwnerPriorityViewProps) {
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const [filters, setFilters] = useState<QueueFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const filtered = useMemo(() => applyQueueFilters(rows, filters), [rows, filters]);
  const set = <K extends keyof QueueFilters>(key: K, value: QueueFilters[K]) => setFilters((current) => ({ ...current, [key]: value }));

  const countTiles: Array<{ key: string; label: string; value: number; apply: Partial<QueueFilters> }> = [
    { key: 'p0', label: L('P0 ကျန်', 'P0 remaining'), value: counts.p0Remaining, apply: { priority: 'P0' } },
    { key: 'p1', label: L('P1 ကျန်', 'P1 remaining'), value: counts.p1Remaining, apply: { priority: 'P1' } },
    { key: 'p2', label: L('P2 ကျန်', 'P2 remaining'), value: counts.p2Remaining, apply: { priority: 'P2' } },
    { key: 'p3', label: L('P3 ကျန်', 'P3 remaining'), value: counts.p3Remaining, apply: { priority: 'P3' } },
    { key: 'visC', label: L('မိဘမြင် Class C', 'Parent-visible Class C'), value: counts.parentVisibleClassC, apply: { riskClass: 'C', visibility: 'visible' } },
    { key: 'clin', label: L('ဆေးဘက် စစ်ရန်', 'Clinical reviews required'), value: counts.clinicalReviewsRequired, apply: { clinicalRequired: true } },
    { key: 'safe', label: L('ဘေးကင်းရေး စစ်ရန်', 'Safety reviews required'), value: counts.safetyReviewsRequired, apply: { safetyRequired: true } },
    { key: 'mm', label: L('မြန်မာ စစ်ရန်', 'Myanmar reviews required'), value: counts.myanmarReviewsRequired, apply: {} },
    { key: 'corr', label: L('ပြင်ဆင်ရန် လို', 'Correction needed'), value: counts.correctionNeeded, apply: { correctionStatus: 'correction_needed' } },
    { key: 'triage', label: L('လူကိုယ်တိုင် စိစစ်ရန်', 'Manual triage required'), value: counts.manualTriageRequired, apply: { correctionStatus: 'manual_triage_required' } },
    { key: 'req', label: L('စစ်ဆေးမှု တောင်းဆိုထား', 'Review requested'), value: counts.reviewRequested, apply: { assignmentStatus: 'requested' } },
    { key: 'asgn', label: L('တာဝန်ပေးထား (အမှန်တကယ်)', 'Currently assigned (real assignments)'), value: counts.currentlyAssigned, apply: { assignmentStatus: 'assigned' } },
    { key: 'rechk', label: L('ပြန်စစ်ရန် အသင့်', 'Ready for recheck'), value: counts.readyForRecheck, apply: { correctionStatus: 'ready_for_recheck' } },
    { key: 'done', label: L('ပြီးဆုံး', 'Completed'), value: counts.completed, apply: { correctionStatus: 'completed' } },
  ];

  return (
    <div className="space-y-5" data-testid="owner-priority-view">
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-sky-deep">{L('ဦးစားပေးစစ်ဆေးရန်', 'Owner Priority')}</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-soft">
          {L(
            'အန္တရာယ်အလိုက် ဦးစားပေး စီထားသော စစ်ဆေးရေးတန်းများ။ ဤနေရာက ထုတ်ဝေခြင်း၊ ဖျက်ခြင်း၊ အတည်ပြုခြင်း ဘာမှ အလိုအလျောက် မလုပ်ပါ — အလုပ်စီစဉ်ရန်သာ ဖြစ်သည်။',
            'Review queues ordered by risk. Nothing here publishes, archives or approves automatically — it only organises the work.',
          )}
        </p>
      </header>

      {!dataComplete && (
        <p role="alert" data-testid="incomplete-data-warning" className="rounded-card border-2 border-red-400 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-800">
          {L(
            '⚠ သုံးသပ်မှတ်တမ်း အပြည့်အစုံ မဖတ်နိုင်ပါ။ ကျန်ရှိနေသော စစ်ဆေးမှု အရေအတွက်များသည် တိကျမှု အာမမခံပါ။ “ပြီးဆုံး” ဟု မှတ်ခြင်းကို ပိတ်ထားသည်။',
            '⚠ The full review history could not be loaded. Outstanding counts below are NOT authoritative and completion actions are disabled.',
          )}
        </p>
      )}
      {dataComplete && !countsAuthoritative && (
        <p data-testid="scoped-counts-notice" className="rounded-card border border-line bg-pastel-yellow p-3 text-sm leading-6 text-ink">
          {L(
            'ဤကိန်းဂဏန်းများသည် သင့်တာဝန်နှင့် သက်ဆိုင်သော အကြောင်းအရာများအတွက်သာ ဖြစ်သည် — စာကြည့်တိုက် တစ်ခုလုံးအတွက် မဟုတ်ပါ။',
            'These counts cover only the records in your scope — they are not catalogue-wide totals.',
          )}
        </p>
      )}
      {accessLevel !== 'full' && (
        <p data-testid="scoped-access-notice" className="rounded-card border border-line bg-canvas p-3 text-xs leading-5 text-ink-soft">
          {L(
            'သင့်အခန်းကဏ္ဍအရ စစ်ဆေးသူအမည်များ၊ ဆုံးဖြတ်ချက်အချိန်များနှင့် တည်းဖြတ်မှုမှတ်တမ်းများကို ဖျောက်ထားသည်။',
            'Reviewer names, decision timings and edit activity are hidden for your role.',
          )}
        </p>
      )}

      <section aria-label={L('အနှစ်ချုပ် ကိန်းဂဏန်းများ', 'Dashboard counts')} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {countTiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            data-testid={`count-${tile.key}`}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, ...tile.apply })}
            className="rounded-card border border-line bg-white p-3 text-left shadow-card transition hover:border-sky"
          >
            <span className="block text-2xl font-bold text-sky-deep">{tile.value}</span>
            <span className="block break-words text-xs leading-5 text-ink-soft">{tile.label}</span>
          </button>
        ))}
      </section>

      <section aria-label={L('စစ်ထုတ်မှုများ', 'Filters')} className="grid grid-cols-2 gap-2 rounded-card border border-line bg-white p-3 shadow-card sm:grid-cols-3 lg:grid-cols-5">
        <label className="space-y-1 text-xs font-medium text-ink">
          <span>{L('ဦးစားပေး', 'Priority')}</span>
          <select value={filters.priority} onChange={(event) => set('priority', event.target.value as QueueFilters['priority'])} className="w-full rounded-xl border border-line bg-white px-2 py-2">
            <option value="all">{L('အားလုံး', 'All')}</option>
            {(['P0', 'P1', 'P2', 'P3'] as const).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-ink">
          <span>{L('အန္တရာယ်အဆင့်', 'Risk class')}</span>
          <select value={filters.riskClass} onChange={(event) => set('riskClass', event.target.value as QueueFilters['riskClass'])} className="w-full rounded-xl border border-line bg-white px-2 py-2">
            <option value="all">{L('အားလုံး', 'All')}</option>
            {(['A', 'B', 'C', 'D', 'E'] as const).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-ink">
          <span>{L('မြင်နိုင်မှု', 'Visibility')}</span>
          <select value={filters.visibility} onChange={(event) => set('visibility', event.target.value as QueueFilters['visibility'])} className="w-full rounded-xl border border-line bg-white px-2 py-2">
            <option value="all">{L('အားလုံး', 'All')}</option>
            <option value="visible">{L('မိဘမြင်နေရ', 'Parent-visible')}</option>
            <option value="unpublished">{L('မထုတ်ဝေရသေး', 'Unpublished')}</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-ink">
          <span>{L('အမျိုးအစား', 'Content type')}</span>
          <select value={filters.type} onChange={(event) => set('type', event.target.value)} className="w-full rounded-xl border border-line bg-white px-2 py-2">
            <option value="all">{L('အားလုံး', 'All')}</option>
            {contentTypes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-ink">
          <span>{L('အသက်အုပ်စု', 'Age group')}</span>
          <select value={filters.ageGroup} onChange={(event) => set('ageGroup', event.target.value)} className="w-full rounded-xl border border-line bg-white px-2 py-2">
            <option value="all">{L('အားလုံး', 'All')}</option>
            {ageGroups.map((group) => <option key={group.key} value={group.key}>{locale === 'mm' ? group.labelMm : group.labelEn}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-ink">
          <span>{L('တာဝန်အခြေအနေ', 'Assignment')}</span>
          <select value={filters.assignmentStatus} onChange={(event) => set('assignmentStatus', event.target.value as QueueFilters['assignmentStatus'])} className="w-full rounded-xl border border-line bg-white px-2 py-2">
            <option value="all">{L('အားလုံး', 'All')}</option>
            <option value="assigned">{L('တာဝန်ပေးထား (အမှန်တကယ်)', 'Assigned (real assignment)')}</option>
            <option value="requested">{L('စစ်ဆေးမှု တောင်းဆိုထား', 'Review requested')}</option>
            <option value="unassigned">{L('မပေးရသေး', 'Not assigned')}</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-ink">
          <span>{L('ပြင်ဆင်မှုအခြေအနေ', 'Correction status')}</span>
          <select value={filters.correctionStatus} onChange={(event) => set('correctionStatus', event.target.value as QueueFilters['correctionStatus'])} className="w-full rounded-xl border border-line bg-white px-2 py-2">
            <option value="all">{L('အားလုံး', 'All')}</option>
            {(Object.keys(STATUS_LABELS) as PriorityStatus[]).map((value) => (
              <option key={value} value={value}>{STATUS_LABELS[value][locale]}</option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-xs font-medium text-ink">
          <input type="checkbox" checked={filters.clinicalRequired} onChange={(event) => set('clinicalRequired', event.target.checked)} className="h-4 w-4 rounded border-line" />
          <span>{L('ဆေးဘက် စစ်ရန် လိုသည်များသာ', 'Clinical review required')}</span>
        </label>
        <label className="flex items-end gap-2 pb-2 text-xs font-medium text-ink">
          <input type="checkbox" checked={filters.safetyRequired} onChange={(event) => set('safetyRequired', event.target.checked)} className="h-4 w-4 rounded border-line" />
          <span>{L('ဘေးကင်းရေး စစ်ရန် လိုသည်များသာ', 'Safety review required')}</span>
        </label>
      </section>

      <p className="text-xs text-ink-soft" data-testid="queue-count">
        {L(`ပြသနေသည် ${filtered.length} / ${rows.length}`, `Showing ${filtered.length} of ${rows.length}`)}
      </p>

      <ol className="space-y-3" aria-label={L('စစ်ဆေးရေးတန်း', 'Review queue')}>
        {filtered.map((row) => (
          <li key={row.slug} data-testid={`queue-row-${row.slug}`} data-priority={row.priority}>
            <button
              type="button"
              onClick={() => onOpenItem?.(row)}
              className="w-full rounded-card border border-line bg-white p-4 text-left shadow-card transition hover:border-sky"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-pill px-3 py-1 text-xs font-bold ${PRIORITY_STYLES[row.priority] ?? 'bg-canvas text-ink'}`}>{PRIORITY_LABELS[row.priority]?.[locale] ?? row.priority}</span>
                <span className="rounded-pill bg-canvas px-2 py-1 text-xs font-semibold text-ink">{L('အန္တရာယ်အုပ်စု', 'Risk class')} {row.riskClass}{row.provisionalClassification ? L(' (ယာယီ)', ' (provisional)') : ''}</span>
                {row.parentVisibleNow && (
                  <span className="rounded-pill bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">{L('မိဘမြင်နေရ', 'Parent-visible now')}</span>
                )}
                {row.temporarilyHideRecommended && (
                  <span className="rounded-pill bg-pastel-yellow px-2 py-1 text-xs text-ink">{L('ယာယီဖျောက်ရန် အကြံပြု', 'Hide recommended')}</span>
                )}
                <span className="rounded-pill bg-canvas px-2 py-1 text-xs text-ink-soft">{STATUS_LABELS[row.priorityStatus]?.[locale] ?? row.priorityStatus}</span>
                {row.manualTriageRequired && (
                  <span data-testid={`triage-${row.slug}`} className="rounded-pill bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
                    {L('လူကိုယ်တိုင် စိစစ်ရန် လိုသည်', 'Manual triage required')}
                  </span>
                )}
              </div>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p className="break-words font-semibold leading-7 text-ink">{row.titleMm}</p>
                <p className="break-words text-sm leading-6 text-ink-soft">{row.titleEn}</p>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft sm:grid-cols-3 lg:grid-cols-4">
                <div><dt className="inline font-medium">{L('အမျိုးအစား', 'Type')}: </dt><dd className="inline">{row.type}{row.category ? ` · ${row.category}` : ''}</dd></div>
                <div><dt className="inline font-medium">{L('အသက်', 'Age')}: </dt><dd className="inline">{row.ageGroupKey ?? '—'}{row.domainKey ? ` · ${row.domainKey}` : ''}</dd></div>
                <div><dt className="inline font-medium">{L('အခြေအနေ', 'Status')}: </dt><dd className="inline">{row.clinicalStatus} · {L('မူကွဲ', 'rev')} {row.reviewRevision}</dd></div>
                <div><dt className="inline font-medium">{L('စစ်ဆေးမှုနယ်ပယ်', 'Scope')}: </dt><dd className="inline">{row.reviewScope ?? '—'}</dd></div>
                <div><dt className="inline font-medium">{L('အထောက်အထား', 'Evidence')}: </dt><dd className="inline">{row.evidenceStatus}</dd></div>
                <div><dt className="inline font-medium">{L('စစ်ရန်ကျန်', 'Outstanding')}: </dt><dd className="inline">{row.manualTriageRequired ? L('စိစစ်ပြီးမှ သတ်မှတ်မည်', 'set after triage') : (row.outstandingDimensions.map((dimension) => DIMENSION_SHORT[dimension]?.[locale] ?? dimension).join(', ') || L('မရှိ', 'none'))}</dd></div>
                <div><dt className="inline font-medium">{L('စစ်ဆေးသူ', 'Reviewers')}: </dt><dd className="inline">{row.activeReviewers.join(', ') || '—'}</dd></div>
                <div><dt className="inline font-medium">{L('နောက်ဆုံးပြင်', 'Last edit')}: </dt><dd className="inline">{formatTime(row.latestEditAt, locale)}</dd></div>
                <div><dt className="inline font-medium">{L('နောက်ဆုံးဆုံးဖြတ်', 'Last decision')}: </dt><dd className="inline">{formatTime(row.latestDecisionAt, locale)}</dd></div>
              </dl>
              {row.manualTriageRequired && row.suggestedReviewDimensions.length > 0 && (
                <p className="mt-2 break-words rounded-lg bg-orange-50 px-2 py-1 text-xs leading-5 text-ink">
                  <b>{L('အကြံပြု (အတည်မပြုရသေး)', 'Suggested (not yet confirmed)')}:</b>{' '}
                  {row.suggestedReviewDimensions.map((dimension) => DIMENSION_SHORT[dimension]?.[locale] ?? dimension).join(', ')}
                  {' — '}
                  {L('မန်နေဂျာက အတည်ပြုမှသာ လိုအပ်ချက် ဖြစ်လာမည်။', 'a manager must confirm these before they become requirements.')}
                </p>
              )}
              {row.riskReasons.length > 0 && (
                <p className="mt-2 break-words text-xs leading-5 text-ink-soft"><b>{L('အကြောင်းရင်း', 'Risk reasons')}:</b> {row.riskReasons.join('; ')}</p>
              )}
              {row.warnings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {row.warnings.map((warning) => (
                    <li key={warning} className="break-words rounded-lg bg-pastel-yellow px-2 py-1 text-xs leading-5 text-ink">⚠ {warning}</li>
                  ))}
                </ul>
              )}
            </button>
          </li>
        ))}
      </ol>
      {filtered.length === 0 && (
        <p className="rounded-card border border-line bg-white p-5 text-sm text-ink-soft">{L('ဤစစ်ထုတ်မှုနှင့် ကိုက်ညီသော အကြောင်းအရာ မရှိပါ။', 'No items match these filters.')}</p>
      )}
    </div>
  );
}
