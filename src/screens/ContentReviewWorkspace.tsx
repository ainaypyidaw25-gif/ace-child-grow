import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

const DIMENSIONS = ['english', 'native_myanmar', 'development', 'evidence', 'safety', 'clinical'] as const;
const DECISIONS = ['in_review', 'approved', 'changes_requested', 'not_applicable', 'evidence_required', 'blocked', 'rejected'] as const;
type Dimension = (typeof DIMENSIONS)[number];
type Decision = (typeof DECISIONS)[number];
type StaffRole = 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'support' |
  'system_admin' | 'review_manager' | 'myanmar_language_reviewer' | 'child_development_reviewer' | 'publisher' | 'auditor';

const DIMENSION_LABELS: Record<Dimension, { mm: string; en: string }> = {
  english: { mm: 'အင်္ဂလိပ်စာနှင့် အကြောင်းအရာ', en: 'English copy and content' },
  native_myanmar: { mm: 'သဘာဝကျသော မြန်မာအသုံးအနှုန်း', en: 'Native Myanmar language' },
  development: { mm: 'ကလေးဖွံ့ဖြိုးမှုနှင့် အသက်အရွယ်ကိုက်ညီမှု', en: 'Child development and age appropriateness' },
  evidence: { mm: 'ကိုးကားအထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  clinical: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်မှု', en: 'Clinical review' },
};

const DECISION_LABELS: Record<Decision, { mm: string; en: string }> = {
  in_review: { mm: 'စစ်ဆေးဆဲ', en: 'In review' },
  approved: { mm: 'ဤမူကွဲကို အတည်ပြုသည်', en: 'Approve this revision' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် လိုအပ်သည်', en: 'Changes requested' },
  not_applicable: { mm: 'မသက်ဆိုင်ပါ', en: 'Not applicable' },
  evidence_required: { mm: 'အထောက်အထား ထပ်မံလိုအပ်သည်', en: 'Evidence required' },
  blocked: { mm: 'ဆက်လက်လုပ်ဆောင်၍ မရသေးပါ', en: 'Blocked' },
  rejected: { mm: 'ပယ်ချသည်', en: 'Reject' },
};

function mayReview(roles: StaffRole[] | null | undefined, dimension: Dimension): boolean {
  if (!roles?.length) return false;
  if (dimension === 'clinical' || dimension === 'safety') return roles.includes('clinical_reviewer');
  if (dimension === 'development') return roles.includes('child_development_reviewer');
  if (dimension === 'evidence') return roles.some((role) => ['evidence_reviewer', 'clinical_reviewer'].includes(role));
  return roles.some((role) => ['language_reviewer', 'myanmar_language_reviewer'].includes(role));
}

function ContentEditor({ item }: { item: {
  slug: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  data: unknown;
  reviewRevision?: number;
} }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const updateDraft = useMutation(api.library.updateDraft);
  const [titleMm, setTitleMm] = useState(item.titleMm);
  const [titleEn, setTitleEn] = useState(item.titleEn);
  const [summaryMm, setSummaryMm] = useState(item.summaryMm ?? '');
  const [summaryEn, setSummaryEn] = useState(item.summaryEn ?? '');
  const [dataText, setDataText] = useState(() => JSON.stringify(item.data, null, 2));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    let data: unknown;
    try {
      data = JSON.parse(dataText);
    } catch {
      setMessage(L('အဆင့်မြင့်အကြောင်းအရာ JSON ပုံစံ မမှန်ပါ။', 'Advanced content JSON is invalid.'));
      return;
    }
    setBusy(true);
    try {
      const result = await updateDraft({
        slug: item.slug,
        titleMm,
        titleEn,
        summaryMm: summaryMm || undefined,
        summaryEn: summaryEn || undefined,
        data,
      });
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
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာခေါင်းစဉ်</span>
          <input value={titleMm} onChange={(event) => setTitleMm(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English title</span>
          <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာအနှစ်ချုပ်</span>
          <textarea value={summaryMm} onChange={(event) => setSummaryMm(event.target.value)} rows={4} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English summary</span>
          <textarea value={summaryEn} onChange={(event) => setSummaryEn(event.target.value)} rows={4} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
      </div>
      <details className="rounded-xl border border-line bg-canvas p-3">
        <summary className="cursor-pointer text-sm font-semibold text-sky-deep">
          {L('အဆင့်မြင့် အကြောင်းအရာဖွဲ့စည်းပုံ', 'Advanced structured content')}
        </summary>
        <p className="mt-2 text-xs text-ink-soft">
          {L('အစီအစဉ်၊ အဆင့်များနှင့် လုံခြုံရေးစာသားများကို JSON ပုံစံဖြင့် ပြင်နိုင်ပါသည်။', 'Edit steps, sections, and safety copy as structured JSON.')}
        </p>
        <textarea value={dataText} onChange={(event) => setDataText(event.target.value)} rows={18} spellCheck={false} className="mt-2 w-full rounded-xl border border-line bg-white p-3 font-mono text-xs leading-5 text-ink" />
      </details>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? L('သိမ်းနေသည်…', 'Saving…') : L('ပြင်ဆင်ချက် သိမ်းမည်', 'Save revision')}
        </button>
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      </div>
    </form>
  );
}

export function ContentReviewWorkspace() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const access = useQuery(api.admin.myAccess);
  const [selectedSlug, setSelectedSlug] = useState('');
  const assignments = useQuery(api.reviewAssignments.listMine, {});
  const detail = useQuery(api.library.getBySlug, selectedSlug ? { slug: selectedSlug } : 'skip');
  const reviews = useQuery(api.contentReviews.listForContent, selectedSlug ? { contentSlug: selectedSlug } : 'skip');
  const saveDecision = useMutation(api.contentReviews.saveDecision);
  const [dimension, setDimension] = useState<Dimension>('native_myanmar');
  const [decision, setDecision] = useState<Decision>('in_review');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (assignments?.length && !assignments.some((row) => row.assignment.contentSlug === selectedSlug)) {
      setSelectedSlug(assignments[0].assignment.contentSlug);
    }
  }, [assignments, selectedSlug]);

  useEffect(() => {
    if (!mayReview(access?.roles as StaffRole[] | undefined, dimension)) {
      const firstAllowed = DIMENSIONS.find((value) => mayReview(access?.roles as StaffRole[] | undefined, value));
      if (firstAllowed) setDimension(firstAllowed);
    }
  }, [access?.roles, dimension]);

  const currentByDimension = useMemo(() => new Map(
    reviews?.current.map((review) => [review.dimension, review]) ?? [],
  ), [reviews]);

  const submitDecision = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSlug) return;
    setBusy(true); setMessage('');
    try {
      await saveDecision({ contentSlug: selectedSlug, dimension, decision, note: note || undefined });
      setNote('');
      setMessage(L('သုံးသပ်ဆုံးဖြတ်ချက်ကို မှတ်တမ်းတင်ပြီးပါပြီ။', 'Review decision recorded.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('မှတ်တမ်းတင်၍ မရပါ။', 'Unable to record decision.'));
    } finally {
      setBusy(false);
    }
  };

  if (access === undefined) return <p className="text-ink-soft">…</p>;
  if (!access?.isStaff || !access.roles.some((role) => ['language_reviewer', 'myanmar_language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer', 'review_manager', 'owner', 'system_admin', 'auditor'].includes(role))) {
    return <p className="rounded-card border border-line bg-white p-5 text-ink">{L('ဤသုံးသပ်ရေးနေရာသို့ ဝင်ခွင့် မရှိပါ။', 'You do not have access to this review workspace.')}</p>;
  }

  const item = detail && 'item' in detail ? detail.item : null;
  return (
    <div className="space-y-5">
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

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{L('မိမိအား တာဝန်ပေးထားသော အကြောင်းအရာ', 'Assigned to me')}</span>
          <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="">{L('တာဝန်တစ်ခု ရွေးပါ', 'Select an assignment')}</option>
            {assignments?.map((row) => (
              <option key={row.assignment._id} value={row.assignment.contentSlug}>{locale === 'mm' ? row.titleMm : row.titleEn} · {row.assignment.status}</option>
            ))}
          </select>
        </label>
        {assignments?.length === 0 && <p className="mt-3 text-sm text-ink-soft">{L('မိမိအား တာဝန်ပေးထားသော အကြောင်းအရာ မရှိသေးပါ။', 'No review assignments have been assigned to you.')}</p>}
      </section>

      {item && access.roles.some((role) => ['owner', 'content_editor'].includes(role)) && <ContentEditor key={`${item.slug}-${item.updatedAt}`} item={item} />}

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
                  <option key={value} value={value} disabled={!mayReview(access.roles as StaffRole[], value)}>{DIMENSION_LABELS[value][locale]}</option>
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
              <button type="submit" disabled={busy || !mayReview(access.roles as StaffRole[], dimension)} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? L('မှတ်တမ်းတင်နေသည်…', 'Recording…') : L('ဆုံးဖြတ်ချက် မှတ်တမ်းတင်မည်', 'Record decision')}
              </button>
              {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
            </div>
          </form>

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
    </div>
  );
}
