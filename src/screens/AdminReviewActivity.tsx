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
  review_manager: { mm: 'စစ်ဆေးရေး မန်နေဂျာ', en: 'Review manager' },
  support: { mm: 'ပံ့ပိုးကူညီရေး', en: 'Support' },
};

const DECISION_TONE: Record<Decision, string> = {
  approved: 'bg-mint-soft text-ink',
  changes_requested: 'bg-pastel-yellow text-ink',
  in_review: 'bg-canvas text-ink-soft',
  not_applicable: 'bg-canvas text-ink-soft',
};

function formatDateTime(ms: number, locale: 'mm' | 'en'): string {
  const formatted = new Intl.DateTimeFormat(locale === 'mm' ? 'my-MM-u-nu-latn' : 'en-GB', {
    timeZone: 'Asia/Yangon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
  return `${formatted} Yangon`;
}

export function AdminReviewActivity() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const [reviewerId, setReviewerId] = useState('');
  const [editorId, setEditorId] = useState('');
  const [dimension, setDimension] = useState('');
  const [decision, setDecision] = useState('');

  const data = useQuery(api.contentReviews.activity, {
    ...(reviewerId ? { reviewerId: reviewerId as never } : {}),
    ...(dimension ? { dimension: dimension as Dimension } : {}),
    ...(decision ? { decision: decision as Decision } : {}),
    limit: 200,
  });
  const editData = useQuery(api.contentEdits.activity, {
    ...(editorId ? { editorId: editorId as never } : {}),
    limit: 100,
  });

  // Built from every row scanned, so the picker does not shrink as you filter.
  const reviewerOptions = useMemo(
    () => data?.reviewers.map((r) => ({ id: r.reviewerId as string, name: r.displayName })) ?? [],
    [data],
  );
  const editorOptions = useMemo(
    () => editData?.editors.map((editor) => ({
      id: editor.editorId as string,
      name: editor.displayName,
    })) ?? [],
    [editData],
  );

  if (data === undefined || editData === undefined) return <p className="text-ink-soft">…</p>;

  if (!data.allowed || !editData.allowed) {
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
            'သုံးသပ်သူတိုင်း၊ အကြောင်းအရာတိုင်းအတွက် ဆုံးဖြတ်ချက်နှင့် ဘာပြင်ခဲ့သည်ကို တစ်နေရာတွင် ကြည့်ရန်။ ပုံမှန်တည်းဖြတ်မှုများက ယခင်မှတ်တမ်းကို မပြောင်းလဲပါ။',
            'Every review decision and recorded content edit across every item, in one place. Normal edits never rewrite earlier records.',
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
                      : `${L('နောက်ဆုံး', 'last')} ${formatDateTime(r.lastReviewedAt, locale)}`}
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
        <h2 className="text-sm font-semibold text-ink">
          {L('အကြောင်းအရာ ပြင်ဆင်မှု မှတ်တမ်း', 'Content edit history')}
        </h2>
        <p className="text-xs text-ink-soft">
          {L(
            'ဤစနစ်ကို တင်ပြီးနောက် ပြင်ဆင်မှုများကို field အလိုက် before/after ဖြင့် မှတ်တမ်းတင်သည်။ ယခင်ပြင်ဆင်မှုများကို အတိအကျ ပြန်မတည်ဆောက်နိုင်ပါ။',
            'Field-level before/after history is recorded from this release onward. Earlier edits cannot be reconstructed exactly.',
          )}
        </p>

        {editData.editors.length > 0 && (
          <ul className="grid gap-2 md:grid-cols-2">
            {editData.editors.map((editor) => (
              <li key={editor.editorId as string} className="rounded-xl border border-line bg-white p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink">{editor.displayName}</span>
                  <span className="text-[11px] text-ink-soft">
                    {formatDateTime(editor.lastEditedAt, locale)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {ROLE_LABELS[editor.role]?.[locale] ?? editor.role}
                  {' · '}
                  {L('ပြင်ဆင်မှု', 'edits')} {editor.total}
                  {' · '}
                  {L('အကြောင်းအရာ', 'items')} {editor.distinctItems}
                </p>
              </li>
            ))}
          </ul>
        )}

        <select
          value={editorId}
          onChange={(event) => setEditorId(event.target.value)}
          aria-label={L('ပြင်ဆင်သူဖြင့် စစ်ထုတ်ရန်', 'Filter by editor')}
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm"
        >
          <option value="">{L('ပြင်ဆင်သူ အားလုံး', 'All editors')}</option>
          {editorOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>

        {editData.truncated && (
          <p role="status" className="rounded-lg bg-pastel-yellow px-3 py-2 text-xs text-ink">
            {L(
              'နောက်ဆုံးပြင်ဆင်မှု မှတ်တမ်းများကိုသာ အကျဉ်းချုပ်တွက်ထားသည်။ ပြင်ဆင်သူဖြင့် စစ်ထုတ်ပါ။',
              'The summary covers recent edit records only. Filter by editor to narrow.',
            )}
          </p>
        )}

        {editData.edits.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {L('ပြင်ဆင်မှု မှတ်တမ်း မရှိသေးပါ။', 'No content edits recorded yet.')}
          </p>
        ) : (
          <ul className="space-y-2">
            {editData.edits.map((edit) => (
              <li key={edit._id as string} className="rounded-xl border border-line bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {edit.editorDisplayName}
                      <span className="ml-2 text-xs font-normal text-ink-soft">
                        {ROLE_LABELS[edit.editorRole]?.[locale] ?? edit.editorRole}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      <Link
                        to={'/content/' + edit.contentSlug}
                        className="text-sky-deep underline underline-offset-2"
                      >
                        {edit.contentSlug}
                      </Link>
                      {' · '}
                      {L('မူကွဲ', 'revision')} {edit.fromVersion} → {edit.toVersion}
                      {' · '}
                      {L('ပြောင်းလဲမှု', 'changes')} {edit.totalChanges}
                    </p>
                  </div>
                  <span className="text-[11px] text-ink-soft">{formatDateTime(edit.editedAt, locale)}</span>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-sky-deep">
                    {L('ဘာပြင်ခဲ့သည်ကို ကြည့်ရန်', 'View changed fields')}
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {edit.changes.map((change) => (
                      <li key={change.path} className="rounded-lg bg-canvas p-2 text-xs">
                        <p className="font-semibold text-ink">{change.path}</p>
                        <div className="mt-1 grid gap-2 md:grid-cols-2">
                          <div>
                            <span className="text-[11px] font-semibold text-ink-soft">
                              {L('မပြင်မီ', 'Before')}
                            </span>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-ink">{change.before}</p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-soft">
                              {L('ပြင်ပြီး', 'After')}
                            </span>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-ink">{change.after}</p>
                          </div>
                        </div>
                        {change.truncated && (
                          <p className="mt-1 text-[11px] text-ink-soft">
                            {L('တန်ဖိုးရှည်လွန်း၍ အစိတ်အပိုင်းသာ ပြထားသည်။', 'Long value; preview truncated.')}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {edit.logTruncated && (
                    <p className="mt-2 text-[11px] text-ink-soft">
                      {L('ပြောင်းလဲမှုများလွန်း၍ အချို့ field များ မပြထားပါ။', 'Some fields are omitted because this edit was very large.')}
                    </p>
                  )}
                </details>
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
                    <span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${DECISION_TONE[row.decision] ?? 'bg-canvas text-ink-soft'}`}>
                      {DECISION_LABELS[row.decision]?.[locale] ?? row.decision}
                    </span>
                    <span className="font-medium text-ink">{DIMENSION_LABELS[row.dimension]?.[locale] ?? row.dimension}</span>
                    <Link
                      to={`/content/${row.contentSlug}`}
                      className="text-xs text-sky-deep underline underline-offset-2"
                    >
                      {row.contentSlug}
                    </Link>
                  </span>
                  <span className="text-[11px] text-ink-soft">{formatDateTime(row.reviewedAt, locale)}</span>
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
