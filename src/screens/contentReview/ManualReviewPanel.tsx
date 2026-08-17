import { useMemo, useState } from 'react';
import { useLocale } from '../../app/LocaleContext';
import {
  REVIEWER_MANUAL_QUEUE,
  type ReviewerManualQueueGroup,
  type ReviewerManualQueueItem,
} from '../../content/reviewerManualQueue';
import { matchesSearchQuery } from '../../domain/search';

const GROUP_LABELS: Record<ReviewerManualQueueGroup, { mm: string; en: string }> = {
  content_type_summary: { mm: 'အမျိုးအစားအလိုက် အကျဉ်းချုပ်', en: 'Content-type summary' },
  clinical_safety_gap: { mm: 'ဆေးဘက်/ဘေးကင်းရေး ကျန်ရှိချက်', en: 'Clinical/safety gap' },
};

const DIMENSION_LABELS: Record<string, { mm: string; en: string }> = {
  native_myanmar: { mm: 'မြန်မာစာ', en: 'Myanmar' },
  evidence: { mm: 'အထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  clinical: { mm: 'ဆေးဘက်', en: 'Clinical' },
};

export function filterReviewerManualQueue(
  items: ReviewerManualQueueItem[],
  query: string,
  group: ReviewerManualQueueGroup | 'all',
): ReviewerManualQueueItem[] {
  return items.filter((item) => (
    (group === 'all' || item.group === group)
    && matchesSearchQuery(query, [
      item.reportItem,
      item.claimId,
      item.titleMm,
      item.titleEn,
      item.problemMm,
      item.problemEn,
      item.suggestedMm,
      item.searchQuery,
    ])
  ));
}

export function ManualReviewPanel({ onSearchContent }: { onSearchContent: (query: string) => void }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<ReviewerManualQueueGroup | 'all'>('all');
  const [copied, setCopied] = useState<number | null>(null);
  const filtered = useMemo(
    () => filterReviewerManualQueue(REVIEWER_MANUAL_QUEUE, query, group),
    [group, query],
  );

  const copySuggestion = async (item: ReviewerManualQueueItem) => {
    try {
      await navigator.clipboard.writeText(item.suggestedMm);
      setCopied(item.reportItem);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="space-y-4" data-testid="manual-review-panel">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-sky-deep">{L('လူကိုယ်တိုင် စစ်ဆေးရန် စာရင်း', 'Manual review list')}</h2>
          <span className="rounded-pill bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
            {L(`မပြီးသေး ${REVIEWER_MANUAL_QUEUE.length} ခု`, `${REVIEWER_MANUAL_QUEUE.length} unresolved`)}
          </span>
        </div>
        <p className="max-w-4xl text-sm leading-7 text-ink-soft">
          {L(
            'ဤစာရင်းသည် Batch 4 report ထဲမှ exact record မသတ်မှတ်ထားသော အချက်များ ဖြစ်သည်။ အောက်ကစာသားများကို အလိုအလျောက် မထည့်ထားပါ။ သက်ဆိုင်သော record နှင့် field ကို ရှာဖွေအတည်ပြုပြီး ပုံမှန် revision-bound review workflow ဖြင့်သာ ပြင်ဆင်ဆုံးဖြတ်ပါ။',
            'These Batch 4 findings do not identify exact records. None of the suggested copy is applied automatically. Find and confirm the target record and field, then use the normal revision-bound review workflow.',
          )}
        </p>
        <p className="rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold leading-5 text-orange-900">
          {L(
            '⚠ ဤနေရာရှိ စာသားသည် အတည်ပြုချက်၊ ဆေးဘက်ဆိုင်ရာ ခွင့်ပြုချက် သို့မဟုတ် ထုတ်ဝေရန် ဆုံးဖြတ်ချက် မဟုတ်ပါ။',
            '⚠ Copy shown here is not an approval, clinical clearance, or publication decision.',
          )}
        </p>
      </header>

      <div className="grid gap-3 rounded-card border border-line bg-white p-3 shadow-card sm:grid-cols-[1fr_220px] sm:p-4">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('Manual review စာရင်းထဲ ရှာရန်', 'Search manual review list')}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={L('Claim ID၊ အကြောင်းအရာ သို့မဟုတ် စာသား ရိုက်ပါ', 'Search a claim ID, topic, or wording')}
            className="min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 text-base"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('အုပ်စု', 'Group')}</span>
          <select value={group} onChange={(event) => setGroup(event.target.value as ReviewerManualQueueGroup | 'all')} className="min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 text-base">
            <option value="all">{L('အားလုံး', 'All')}</option>
            <option value="content_type_summary">{GROUP_LABELS.content_type_summary[locale]}</option>
            <option value="clinical_safety_gap">{GROUP_LABELS.clinical_safety_gap[locale]}</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-ink-soft">{L(`ပြထားသည် ${filtered.length} / ${REVIEWER_MANUAL_QUEUE.length}`, `Showing ${filtered.length} of ${REVIEWER_MANUAL_QUEUE.length}`)}</p>

      <div className="space-y-3">
        {filtered.map((item) => (
          <article key={item.reportItem} className="rounded-card border border-line bg-white p-4 shadow-card" data-testid={`manual-review-${item.reportItem}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wide text-mint-deep">Report #{item.reportItem} · {item.claimId}</p>
                <h3 className="font-bold leading-7 text-ink">{locale === 'mm' ? item.titleMm : item.titleEn}</h3>
                <p className="text-sm leading-6 text-ink-soft">{locale === 'mm' ? item.problemMm : item.problemEn}</p>
              </div>
              <span className="shrink-0 rounded-pill bg-pastel-yellow px-2 py-1 text-xs font-semibold text-ink">
                {GROUP_LABELS[item.group][locale]}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {item.suggestedDimensions.map((dimension) => (
                <span key={dimension} className="rounded-pill border border-line bg-canvas px-2 py-1 text-xs text-ink-soft">
                  {DIMENSION_LABELS[dimension]?.[locale] ?? dimension}
                </span>
              ))}
            </div>

            <details className="mt-3 rounded-xl border border-line bg-canvas p-3">
              <summary className="cursor-pointer font-semibold text-sky-deep">{L('Report က အကြံပြုထားသော စာသားကို ကြည့်မည်', 'View report-suggested copy')}</summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink">{item.suggestedMm}</p>
              <p className="mt-3 break-words text-xs text-ink-soft">{L('အထောက်အထားဖိုင်', 'Source')}: {item.source}</p>
            </details>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onSearchContent(item.searchQuery)} className="min-h-touch rounded-pill bg-sky px-4 py-2 text-sm font-semibold text-white">
                {L('ဆက်စပ်အကြောင်းအရာ ရှာမည်', 'Search related content')}
              </button>
              <button type="button" onClick={() => void copySuggestion(item)} className="min-h-touch rounded-pill border border-line bg-white px-4 py-2 text-sm font-semibold text-sky-deep">
                {copied === item.reportItem ? L('ကူးပြီးပါပြီ', 'Copied') : L('အကြံပြုစာသား ကူးယူမည်', 'Copy suggested text')}
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-card border border-line bg-white p-5 text-sm text-ink-soft">
          {L('ကိုက်ညီသော manual review အချက် မတွေ့ပါ။', 'No manual review item matches this search.')}
        </p>
      )}
    </section>
  );
}
