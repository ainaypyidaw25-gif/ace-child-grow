import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import {
  SAMPLE_MILESTONES,
  SAMPLE_ACTIVITIES,
  SAMPLE_AWARENESS,
  SAMPLE_LESSONS,
} from '../data/seed/content';
import { REVIEW_STATES, nextStep, isParentVisible, type ReviewState } from '../domain/content/workflow';
import { matchesSearchQuery } from '../domain/search';

// Admin clinical-review queue backed by Convex. Content transitions persist and
// are STAFF-ONLY (enforced in convex/content.ts). Non-staff see a read-only view.
export function AdminReviewQueue() {
  const { t, locale } = useLocale();
  const data = useQuery(api.content.list);
  const access = useQuery(api.admin.myAccess);
  const seed = useMutation(api.content.seedIfEmpty);
  const transition = useMutation(api.content.transition);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => (data?.items ?? []).filter((item) => matchesSearchQuery(query, [
    item.titleMm, item.titleEn, item.kind, item.reviewStatus,
  ])), [data?.items, query]);

  const seedItems = useMemo(
    () => [
      ...SAMPLE_MILESTONES.map((m) => ({ kind: 'milestone', titleMm: m.titleMm, titleEn: m.titleEn })),
      ...SAMPLE_ACTIVITIES.map((a) => ({ kind: 'activity', titleMm: a.titleMm, titleEn: a.titleEn })),
      ...SAMPLE_AWARENESS.map((a) => ({ kind: 'awareness', titleMm: a.titleMm, titleEn: a.titleEn })),
      ...SAMPLE_LESSONS.map((l) => ({ kind: 'lesson', titleMm: l.titleMm, titleEn: l.titleEn })),
    ],
    [],
  );

  if (data === undefined) return <p className="text-ink-soft">…</p>;
  const { staff, items } = data;
  const canEdit = access?.role === 'owner' || access?.role === 'content_editor';
  const canReview = access?.role === 'clinical_reviewer' || (access?.role === 'owner' && !!access.qualification);
  const educationReviewer = access?.role === 'owner' && !!access.qualification;
  const pending = items.filter((i) => !isParentVisible(i.reviewStatus as ReviewState)).length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ပညာရှင် ပြန်လည်သုံးသပ်မှု စာရင်း' : 'Professional Review Queue'}
      </h1>
      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {locale === 'mm'
          ? `စောင့်ဆိုင်းဆဲ ${pending} ခု။ Approve/Publish မလုပ်မချင်း မိဘတွေဆီ မရောက်ပါဘူး။`
          : `${pending} awaiting review. Nothing reaches parents until published.`}
        {!staff && ` · ${t('admin.staffOnly')}`}
      </p>

      <label className="block space-y-1.5 text-sm font-medium text-ink">
        <span>{locale === 'mm' ? 'သုံးသပ်ရန် အကြောင်းအရာ ရှာဖွေရန်' : 'Search the review queue'}</span>
        <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 shadow-card focus-within:border-sky">
          <span aria-hidden="true">🔎</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === 'mm' ? 'ခေါင်းစဉ်၊ အမျိုးအစား သို့မဟုတ် အခြေအနေ' : 'Title, type or review status'}
            className="min-h-touch min-w-0 flex-1 bg-transparent py-2 text-base font-normal outline-none placeholder:text-ink-soft"
          />
          {query && <button type="button" onClick={() => setQuery('')} className="min-h-touch px-2 text-xs text-sky-deep">{locale === 'mm' ? 'ဖျက်မည်' : 'Clear'}</button>}
        </span>
      </label>

      {staff && (
        <section className="rounded-card border border-line bg-white p-4 shadow-card">
          <p className="text-sm text-ink">
            {locale === 'mm'
              ? canReview
                ? educationReviewer
                  ? 'ပညာရေးနှင့် အထူးပညာရေးဆိုင်ရာ အတည်ပြုချက်ဖြင့် ထုတ်ဝေနိုင်ပါသည်။ ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက် မဟုတ်ပါ။ လုပ်ဆောင်ချက်တိုင်းကို မှတ်တမ်းတင်ထားသည်။'
                  : 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်သူအဖြစ် အတည်ပြုပြီး ထုတ်ဝေနိုင်ပါသည်။ လုပ်ဆောင်ချက်တိုင်းကို မှတ်တမ်းတင်ထားသည်။'
                : 'မူကြမ်းများကို ကြည့်ရှုတည်းဖြတ်နိုင်ပါသည်။ အတည်ပြုပြီး ထုတ်ဝေရန် အရည်အချင်းရှိ ပညာရှင် လိုအပ်ပါသည်။'
              : canReview
                ? educationReviewer
                  ? 'You may publish with education and special-education review scope. This is not clinical approval.'
                  : 'You may approve and publish as the assigned clinical reviewer. Every action is audited.'
                : 'You may inspect and edit drafts. A qualified assigned reviewer is required to publish.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link to="/admin?tour=staff" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
              {locale === 'mm' ? 'စီမံခန့်ခွဲမှု အသုံးပြုနည်း' : 'Replay staff tour'}
            </Link>
            <Link to="/library" className="rounded-pill bg-sky px-4 py-2 font-semibold text-white">
              {locale === 'mm' ? 'အကြောင်းအရာစာကြည့်တိုက် ကြည့်ရန်' : 'View content library'}
            </Link>
            <Link to="/admin/library" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
              {locale === 'mm' ? 'အကြောင်းအရာ စီမံခန့်ခွဲမှု' : 'Content CMS'}
            </Link>
            <Link to="/admin/reviews" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
              {locale === 'mm' ? 'သုံးသပ်ရေးနေရာ' : 'Review workspace'}
            </Link>
            <Link to="/admin/evidence" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
              {locale === 'mm' ? 'ကိုးကားချက်များ ကြည့်ရန်' : 'View evidence'}
            </Link>
            {(access?.role === 'owner' || access?.role === 'content_editor') && (
              <Link to="/admin/review-activity" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
                {locale === 'mm' ? 'သုံးသပ်သူများ၏ မှတ်တမ်း' : 'Reviewer activity'}
              </Link>
            )}
            {access?.role === 'owner' && (
              <>
                <Link to="/admin/team" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
                  {locale === 'mm' ? 'စီမံခန့်ခွဲရေးအဖွဲ့' : 'Manage admin team'}
                </Link>
                <Link to="/admin/directory" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
                  {locale === 'mm' ? 'ကျောင်း/ဝန်ဆောင်မှုစာရင်း' : 'School directory'}
                </Link>
                <Link to="/admin/billing" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
                  {locale === 'mm' ? 'Subscription နှင့် ငွေပေးချေမှု' : 'Subscriptions and billing'}
                </Link>
              </>
            )}
          </div>
        </section>
      )}

      {items.length === 0 && canEdit && (
        <button type="button" disabled={seeding}
          onClick={async () => {
            if (seeding) return;
            setSeeding(true);
            try { await seed({ items: seedItems }); } finally { setSeeding(false); }
          }}
          className="min-h-touch rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50">
          {seeding ? '…' : t('admin.seed')}
        </button>
      )}

      <div className="flex flex-wrap gap-1 text-xs">
        {REVIEW_STATES.map((w, i) => (
          <span key={w} className="rounded-pill bg-canvas px-2 py-1 text-ink-soft">{i + 1}. {w}</span>
        ))}
      </div>

      <p className="text-xs text-ink-soft">{locale === 'mm' ? `ပြသနေသည် ${filteredItems.length} / ${items.length}` : `Showing ${filteredItems.length} of ${items.length}`}</p>
      <ul className="space-y-2">
        {filteredItems.map((it) => {
          const to = nextStep(it.reviewStatus as ReviewState);
          return (
            <li key={it._id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2">
              <div className="min-w-0">
                <span className="text-xs text-ink-soft">{it.kind}</span>
                <p className="truncate text-sm font-medium">{locale === 'mm' ? it.titleMm : it.titleEn}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-pill px-3 py-1 text-xs ${
                  isParentVisible(it.reviewStatus as ReviewState) ? 'bg-mint-soft text-mint-deep' : 'bg-pastel-yellow text-ink'
                }`}>
                  {it.reviewStatus}
                </span>
                {staff && to && (
                  (['approved', 'published'].includes(to) && canReview) ||
                  (!['approved', 'published'].includes(to) && canEdit)
                ) && (
                  <button type="button" disabled={busyId === it._id}
                    onClick={async () => {
                      if (busyId) return;
                      setBusyId(it._id);
                      try { await transition({ id: it._id, to }); } finally { setBusyId(null); }
                    }}
                    className="min-h-touch rounded-pill bg-sky px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
                    → {to}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {filteredItems.length === 0 && items.length > 0 && (
        <p className="rounded-xl border border-line bg-white p-5 text-center text-sm text-ink-soft">
          {locale === 'mm' ? 'ရှာဖွေမှုနှင့် ကိုက်ညီသော အကြောင်းအရာ မရှိပါ။' : 'No review items match this search.'}
        </p>
      )}
    </div>
  );
}
