import { useLocale } from '../app/LocaleContext';
import { SAMPLE_MILESTONES, SAMPLE_ACTIVITIES, SAMPLE_AWARENESS, SAMPLE_LESSONS } from '../data/seed/content';

// Read-only Admin CMS skeleton: shows content and its review-workflow state.
// Demonstrates the gate — nothing reaches parents until 'published'. Full editing
// + role-gated mutations arrive with Supabase auth (see docs/operations/admin-guide.md).
const WORKFLOW = [
  'draft', 'content_review', 'translation_review', 'clinical_review',
  'approved', 'published', 'archived',
] as const;

export function AdminReviewQueue() {
  const { locale } = useLocale();
  const rows = [
    ...SAMPLE_MILESTONES.map((m) => ({ kind: 'Milestone', title: locale === 'mm' ? m.titleMm : m.titleEn, status: m.reviewStatus })),
    ...SAMPLE_ACTIVITIES.map((a) => ({ kind: 'Activity', title: locale === 'mm' ? a.titleMm : a.titleEn, status: a.reviewStatus })),
    ...SAMPLE_AWARENESS.map((t) => ({ kind: 'Awareness', title: locale === 'mm' ? t.titleMm : t.titleEn, status: t.reviewStatus })),
    ...SAMPLE_LESSONS.map((l) => ({ kind: 'Lesson', title: locale === 'mm' ? l.titleMm : l.titleEn, status: l.reviewStatus })),
  ];
  const pending = rows.filter((r) => r.status !== 'published').length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ဆေးပညာ ပြန်လည်သုံးသပ်မှု စာရင်း' : 'Clinical Review Queue'}
      </h1>
      <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-sm text-ink">
        {locale === 'mm'
          ? `${pending} ခု ပြန်လည်သုံးသပ်ရန် ကျန်ရှိသည်။ approve မလုပ်မချင်း မိဘများထံ မပြပါ။`
          : `${pending} items awaiting review. None are shown to parents until approved.`}
      </p>

      <div className="flex flex-wrap gap-1 text-xs">
        {WORKFLOW.map((w, i) => (
          <span key={w} className="rounded-pill bg-canvas px-2 py-1 text-ink-soft">
            {i + 1}. {w}
          </span>
        ))}
      </div>

      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2">
            <div>
              <span className="text-xs text-ink-soft">{r.kind}</span>
              <p className="text-sm font-medium">{r.title}</p>
            </div>
            <span className={`rounded-pill px-3 py-1 text-xs ${
              r.status === 'published' ? 'bg-mint-soft text-mint' : 'bg-pastel-yellow text-ink'
            }`}>
              {r.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
