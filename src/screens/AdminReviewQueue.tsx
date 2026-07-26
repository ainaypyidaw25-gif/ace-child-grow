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

// Admin clinical-review queue backed by Convex. Content transitions persist and
// are STAFF-ONLY (enforced in convex/content.ts). Non-staff see a read-only view.
export function AdminReviewQueue() {
  const { t, locale } = useLocale();
  const data = useQuery(api.content.list);
  const seed = useMutation(api.content.seedIfEmpty);
  const transition = useMutation(api.content.transition);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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
  const pending = items.filter((i) => !isParentVisible(i.reviewStatus as ReviewState)).length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ဆေးပညာ ပြန်လည်သုံးသပ်မှု စာရင်း' : 'Clinical Review Queue'}
      </h1>
      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {locale === 'mm'
          ? `စောင့်ဆိုင်းဆဲ ${pending} ခု။ Approve/Publish မလုပ်မချင်း မိဘတွေဆီ မရောက်ပါဘူး။`
          : `${pending} awaiting review. Nothing reaches parents until published.`}
        {!staff && ` · ${t('admin.staffOnly')}`}
      </p>

      {staff && (
        <section className="rounded-card border border-line bg-white p-4 shadow-card">
          <p className="text-sm text-ink">
            {locale === 'mm'
              ? 'သင်သည် ပိုင်ရှင်အဖြစ် မူကြမ်းများကို ကြည့်ရှုနိုင်ပါသည်။ အရည်အချင်းပြည့်မီသော ကျန်းမာရေးပညာရှင် မရှိသေးသဖြင့် အတည်ပြုခြင်းနှင့် ထုတ်ဝေခြင်းကို ပိတ်ထားပါသည်။'
              : 'You can inspect drafts as the owner. Approval and publishing remain locked until a qualified clinical reviewer is assigned.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link to="/library" className="rounded-pill bg-sky px-4 py-2 font-semibold text-white">
              {locale === 'mm' ? 'အကြောင်းအရာစာကြည့်တိုက် ကြည့်ရန်' : 'View content library'}
            </Link>
            <Link to="/admin/library" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
              {locale === 'mm' ? 'အကြောင်းအရာ စီမံခန့်ခွဲမှု' : 'Content CMS'}
            </Link>
            <Link to="/admin/evidence" className="rounded-pill border border-line px-4 py-2 text-sky-deep">
              {locale === 'mm' ? 'ကိုးကားချက်များ ကြည့်ရန်' : 'View evidence'}
            </Link>
          </div>
        </section>
      )}

      {items.length === 0 && (
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

      <ul className="space-y-2">
        {items.map((it) => {
          const to = nextStep(it.reviewStatus as ReviewState);
          return (
            <li key={it._id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2">
              <div className="min-w-0">
                <span className="text-xs text-ink-soft">{it.kind}</span>
                <p className="truncate text-sm font-medium">{locale === 'mm' ? it.titleMm : it.titleEn}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-pill px-3 py-1 text-xs ${
                  isParentVisible(it.reviewStatus as ReviewState) ? 'bg-mint-soft text-mint' : 'bg-pastel-yellow text-ink'
                }`}>
                  {it.reviewStatus}
                </span>
                {staff && to && !['approved', 'published'].includes(to) && (
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
    </div>
  );
}
