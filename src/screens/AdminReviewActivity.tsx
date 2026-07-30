import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

// Reviewer activity, for the owner.
//
// The review workspace shows history one library item at a time, which cannot
// answer "what have my reviewers done" across hundreds of items. The server
// returns { allowed:false } to anyone who is not owner/content_editor, so this
// is not client-side hiding.

type Dimension = 'english' | 'native_myanmar' | 'evidence' | 'safety' | 'clinical';
type Decision = 'in_review' | 'approved' | 'changes_requested' | 'not_applicable';

const DIMENSION_LABELS: Record<Dimension, { mm: string; en: string }> = {
  english: { mm: 'အင်္ဂလိပ်စာ', en: 'English' },
  native_myanmar: { mm: 'မြန်မာစာ', en: 'Native Myanmar' },
  evidence: { mm: 'ကိုးကားချက်', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းလုံခြုံရေး', en: 'Safety' },
  clinical: { mm: 'ဆေးဘက်ဆိုင်ရာ', en: 'Clinical' },
};

const DECISION_LABELS: Record<Decision, { mm: string; en: string }> = {
  in_review: { mm: 'သုံးသပ်နေသည်', en: 'In review' },
  approved: { mm: 'အတည်ပြုပြီး', en: 'Approved' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် တောင်းဆိုထား', en: 'Changes requested' },
  not_applicable: { mm: 'သက်ဆိုင်မှု မရှိ', en: 'Not applicable' },
};

const ROLE_LABELS: Record<string, { mm: string; en: string }> = {
  owner: { mm: 'ပိုင်ရှင်', en: 'Owner' },
  content_editor: { mm: 'အကြောင်းအရာ တည်းဖြတ်သူ', en: 'Content editor' },
  language_reviewer: { mm: 'ဘာသာစကား သုံးသပ်သူ', en: 'Language reviewer' },
  evidence_reviewer: { mm: 'ကိုးကားချက် သုံးသပ်သူ', en: 'Evidence reviewer' },
  clinical_reviewer: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်သူ', en: 'Clinical reviewer' },
  support: { mm: 'ပံ့ပိုးကူညီရေး', en: 'Support' },
};

const DECISION_TONE: Record<Decision, string> = {
  approved: 'bg-mint-soft text-ink',
  changes_requested: 'bg-pastel-yellow text-ink',
  in_review: 'bg-canvas text-ink-soft',
  not_applicable: 'bg-canvas text-ink-soft',
};

function formatDateTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
}

export function AdminReviewActivity() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const [reviewerId, setReviewerId] = useState('');
  const [dimension, setDimension] = useState('');
  const [decision, setDecision] = useState('');

  const data = useQuery(api.contentReviews.activity, {
    ...(reviewerId ? { reviewerId: reviewerId as never } : {}),
    ...(dimension ? { dimension: dimension as Dimension } : {}),
    ...(decision ? { decision: decision as Decision } : {}),
    limit: 200,
  });

  // Built from every row scanned, so the picker does not shrink as you filter.
  const reviewerOptions = useMemo(
    () => data?.reviewers.map((r) => ({ id: r.reviewerId as string, name: r.displayName })) ?? [],
    [data],
  );

  if (data === undefined) return <p className="text-ink-soft">…</p>;

  if (!data.allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <div aria-hidden className="text-4xl">🔒</div>
        <p className="font-semibold text-ink">
          {L('ဤစာမျက်နှာသို့ ဝင်ခွင့် မရှိပါ။', 'You do not have access to this page.')}
        </p>
        <p className="text-sm text-ink-soft">
          {L(
            'သုံးသပ်မှု မှတ်တမ်းအလုံးစုံကို ပိုင်ရှင်နှင့် အကြောင်းအရာ တည်းဖြတ်သူများသာ ကြည့်နိုင်သည်။',
            'Full reviewer activity is visible to the owner and content editors only.',
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-sky-deep">
          {L('သုံးသပ်သူများ၏ လုပ်ဆောင်မှု မှတ်တမ်း', 'Reviewer activity')}
        </h1>
        <p className="text-sm text-ink-soft">
          {L(
            'သုံးသပ်သူတိုင်း၊ အကြောင်းအရာတိုင်းအတွက် ဆုံးဖြတ်ချက် အားလုံးကို တစ်နေရာတွင် ကြည့်ရန်။ ဤမှတ်တမ်းသည် ဖျက်လို့မရသော မှတ်တမ်းဖြစ်သည်။',
            'Every review decision across every item, in one place. These records are append-only.',
          )}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">
          {L('သုံးသပ်သူ အလိုက် အကျဉ်းချုပ်', 'Summary by reviewer')}
        </h2>
        {data.reviewers.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {L('သုံးသပ်မှု မှတ်တမ်း မရှိသေးပါ။', 'No review decisions recorded yet.')}
          </p>
        ) : (
          <ul className="space-y-2">
            {data.reviewers.map((r) => (
              <li key={r.reviewerId as string} className="rounded-xl border border-line bg-white p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-semibold text-ink">{r.displayName}</span>
                    <span className="ml-2 text-xs text-ink-soft">
                      {ROLE_LABELS[r.role]?.[locale] ?? r.role}
                      {r.qualification ? ` · ${r.qualification}` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-soft">
                    {r.lastReviewedAt === null
                      ? '—'
                      : `${L('နောက်ဆုံး', 'last')} ${formatDateTime(r.lastReviewedAt)}`}
                  </span>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                  <div>
                    <dt className="inline">{L('စုစုပေါင်း', 'Total')}: </dt>
                    <dd className="inline font-semibold text-ink">{r.total}</dd>
                  </div>
                  <div>
                    <dt className="inline">{DECISION_LABELS.approved[locale]}: </dt>
                    <dd className="inline font-semibold text-ink">{r.approved}</dd>
                  </div>
                  <div>
                    <dt className="inline">{DECISION_LABELS.changes_requested[locale]}: </dt>
                    <dd className="inline font-semibold text-ink">{r.changesRequested}</dd>
                  </div>
                  <div>
                    <dt className="inline">{DECISION_LABELS.in_review[locale]}: </dt>
                    <dd className="inline font-semibold text-ink">{r.inReview}</dd>
                  </div>
                  <div>
                    <dt className="inline">{L('အကြောင်းအရာ အမျိုးအစား', 'Items touched')}: </dt>
                    <dd className="inline font-semibold text-ink">{r.distinctItems}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">{L('ဆုံးဖြတ်ချက် မှတ်တမ်း', 'Decision log')}</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={reviewerId}
            onChange={(event) => setReviewerId(event.target.value)}
            aria-label={L('သုံးသပ်သူဖြင့် စစ်ထုတ်ရန်', 'Filter by reviewer')}
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{L('သုံးသပ်သူ အားလုံး', 'All reviewers')}</option>
            {reviewerOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <select
            value={dimension}
            onChange={(event) => setDimension(event.target.value)}
            aria-label={L('သုံးသပ်မှု အပိုင်းဖြင့် စစ်ထုတ်ရန်', 'Filter by review area')}
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{L('အပိုင်း အားလုံး', 'All areas')}</option>
            {(Object.keys(DIMENSION_LABELS) as Dimension[]).map((value) => (
              <option key={value} value={value}>{DIMENSION_LABELS[value][locale]}</option>
            ))}
          </select>
          <select
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
            aria-label={L('ဆုံးဖြတ်ချက်ဖြင့် စစ်ထုတ်ရန်', 'Filter by decision')}
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm"
          >
            <option value="">{L('ဆုံးဖြတ်ချက် အားလုံး', 'All decisions')}</option>
            {(Object.keys(DECISION_LABELS) as Decision[]).map((value) => (
              <option key={value} value={value}>{DECISION_LABELS[value][locale]}</option>
            ))}
          </select>
        </div>

        {data.truncated && (
          <p role="status" className="rounded-lg bg-pastel-yellow px-3 py-2 text-xs text-ink">
            {L(
              `မှတ်တမ်း ${data.totalScanned} ခုသာ ဖတ်ထားသည် — အဟောင်းများ ဤစာရင်းတွင် မပါဝင်ပါ။ သုံးသပ်သူဖြင့် စစ်ထုတ်ပါ။`,
              `Showing the most recent ${data.totalScanned} records only — older ones are not included. Filter by reviewer to narrow.`,
            )}
          </p>
        )}

        {data.decisions.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {L('ဤစစ်ထုတ်မှုအတွက် မှတ်တမ်း မရှိပါ။', 'No decisions match this filter.')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {data.decisions.map((row) => (
              <li key={row._id as string} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${DECISION_TONE[row.decision]}`}>
                      {DECISION_LABELS[row.decision][locale]}
                    </span>
                    <span className="font-medium text-ink">{DIMENSION_LABELS[row.dimension][locale]}</span>
                    <Link
                      to={`/content/${row.contentSlug}`}
                      className="text-xs text-sky-deep underline underline-offset-2"
                    >
                      {row.contentSlug}
                    </Link>
                  </span>
                  <span className="text-[11px] text-ink-soft">{formatDateTime(row.reviewedAt)}</span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {row.reviewerDisplayName}
                  {row.reviewerQualification ? ` · ${row.reviewerQualification}` : ''}
                  {' · '}
                  {ROLE_LABELS[row.reviewerRole]?.[locale] ?? row.reviewerRole}
                  {' · '}
                  {L('မူကွဲ', 'revision')} {row.contentVersion}
                </p>
                {row.note && <p className="mt-1 text-xs text-ink">{row.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
