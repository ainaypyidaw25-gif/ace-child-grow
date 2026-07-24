import { useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { SAMPLE_MILESTONES, SAMPLE_ACTIVITIES, SAMPLE_AWARENESS, SAMPLE_LESSONS } from '../data/seed/content';
import {
  REVIEW_STATES,
  nextStep,
  transition,
  isParentVisible,
  type ReviewState,
} from '../domain/content/workflow';

interface Row {
  id: string;
  kind: string;
  title: string;
  status: ReviewState;
}

function seedRows(locale: 'mm' | 'en'): Row[] {
  const pick = (t: { titleMm: string; titleEn: string }) => (locale === 'mm' ? t.titleMm : t.titleEn);
  return [
    ...SAMPLE_MILESTONES.map((m, i) => ({ id: `m${i}`, kind: 'Milestone', title: pick(m), status: m.reviewStatus as ReviewState })),
    ...SAMPLE_ACTIVITIES.map((a, i) => ({ id: `a${i}`, kind: 'Activity', title: pick(a), status: a.reviewStatus as ReviewState })),
    ...SAMPLE_AWARENESS.map((t, i) => ({ id: `w${i}`, kind: 'Awareness', title: pick(t), status: t.reviewStatus as ReviewState })),
    ...SAMPLE_LESSONS.map((l, i) => ({ id: `l${i}`, kind: 'Lesson', title: pick(l), status: l.reviewStatus as ReviewState })),
  ];
}

// Interactive clinical-review queue: advances/rejects content through the
// validated workflow (src/domain/content/workflow.ts). Full role-gated,
// audit-logged persistence arrives with Supabase auth.
export function AdminReviewQueue() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<Row[]>(() => seedRows(locale));

  function advance(id: string) {
    setRows((rs) =>
      rs.map((r) => {
        const to = nextStep(r.status);
        return r.id === id && to ? { ...r, status: transition(r.status, to) } : r;
      }),
    );
  }

  const pending = rows.filter((r) => !isParentVisible(r.status)).length;
  const published = rows.length - pending;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ဆေးပညာ ပြန်လည်သုံးသပ်မှု စာရင်း' : 'Clinical Review Queue'}
      </h1>
      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {locale === 'mm'
          ? `စောင့်ဆိုင်းဆဲ ${pending} ခု · ထုတ်ဝေပြီး ${published} ခု။ Approve မလုပ်မချင်း မိဘတွေဆီ မရောက်ပါဘူး။`
          : `${pending} awaiting · ${published} published. Nothing reaches parents until published.`}
      </p>

      <div className="flex flex-wrap gap-1 text-xs">
        {REVIEW_STATES.map((w, i) => (
          <span key={w} className="rounded-pill bg-canvas px-2 py-1 text-ink-soft">
            {i + 1}. {w}
          </span>
        ))}
      </div>

      <ul className="space-y-2">
        {rows.map((r) => {
          const to = nextStep(r.status);
          return (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2">
              <div className="min-w-0">
                <span className="text-xs text-ink-soft">{r.kind}</span>
                <p className="truncate text-sm font-medium">{r.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-pill px-3 py-1 text-xs ${
                  isParentVisible(r.status) ? 'bg-mint-soft text-mint' : 'bg-pastel-yellow text-ink'
                }`}>
                  {r.status}
                </span>
                {to && (
                  <button
                    type="button"
                    onClick={() => advance(r.id)}
                    className="min-h-touch rounded-pill bg-sky px-3 py-1 text-xs font-semibold text-white"
                  >
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
