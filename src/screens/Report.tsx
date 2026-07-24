import { useMemo, useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { buildReport, type ReportType } from '../domain/reports/report';
import { ageLabels } from '../domain/age/ageLabel';
import { DEMO_CHILD } from '../data/demo';

// Print/PDF: uses the browser print dialog (Save as PDF). A server-side
// Myanmar-font-embedded PDF generator is a planned module (see docs).
const DEMO_SOURCE = {
  childNickname: DEMO_CHILD.nickname,
  periodStart: '2026-06-24',
  periodEnd: '2026-07-24',
  chronologicalAgeLabel: '2 years 6 months',
  correctedAgeLabel: undefined,
  strengths: ['Names familiar pictures', 'Enjoys shared reading'],
  emergingSkills: ['Two-word phrases'],
  latestResultState: 'yellow' as const,
  completedActivities: ['Shared picture-book reading'],
  parentNotes: ['A little shy with new people'],
  savedConcerns: [],
  growthSummary: 'Weight and height tracked this month.',
  sleepSummary: 'Average total sleep ~11h.',
  questionsForProfessional: ['How can I support two-word phrases?'],
  nextReviewDate: '2026-08-21',
};

export function Report() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const [type, setType] = useState<ReportType>('parent_monthly');
  const source = useMemo(() => {
    if (!activeChild) return DEMO_SOURCE;
    const labels = ageLabels(new Date(activeChild.birthDate), new Date(), locale, {
      gestationalWeeks: activeChild.gestationalWeeks,
      useCorrected: activeChild.useCorrectedAge,
    });
    return {
      ...DEMO_SOURCE,
      childNickname: activeChild.nickname,
      chronologicalAgeLabel: labels.chronological,
      correctedAgeLabel: labels.corrected,
    };
  }, [activeChild, locale]);
  const report = useMemo(() => buildReport(type, source), [type, source]);

  const types: { key: ReportType; label: string }[] = [
    { key: 'parent_monthly', label: t('report.parentMonthly') },
    { key: 'doctor_visit', label: t('report.doctorVisit') },
    { key: 'share_safe', label: t('report.shareSafe') },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('report.title')}</h1>

      <div className="flex flex-wrap gap-2">
        {types.map((ty) => (
          <button
            key={ty.key}
            type="button"
            onClick={() => setType(ty.key)}
            className={`min-h-touch rounded-pill px-4 py-2 text-sm ${
              type === ty.key ? 'bg-sky text-white' : 'border border-line bg-white text-ink'
            }`}
          >
            {ty.label}
          </button>
        ))}
      </div>

      <article className="space-y-3 rounded-card border border-line bg-white p-5 shadow-card print:shadow-none">
        <header>
          <h2 className="text-lg font-bold">{report.childNickname}</h2>
          <p className="text-sm text-ink-soft">
            {report.period.start} → {report.period.end} · {report.chronologicalAgeLabel}
          </p>
        </header>

        <Section title={t('result.strengths')} items={report.strengths} />
        <Section title={t('result.emerging')} items={report.emergingSkills} />
        <Section title={t('nav.activities')} items={report.completedActivities} />
        {report.parentNotes.length > 0 && (
          <Section title={t('home.parentTip')} items={report.parentNotes} />
        )}
        <Section title={t('report.questions')} items={report.questionsForProfessional} />

        {report.growthSummary && <p className="text-sm">📏 {report.growthSummary}</p>}
        {report.sleepSummary && <p className="text-sm">😴 {report.sleepSummary}</p>}
        {report.nextReviewDate && (
          <p className="text-sm text-ink-soft">
            {t('report.nextReview')}: {report.nextReviewDate}
          </p>
        )}

        <p className="rounded-lg bg-canvas p-3 text-xs text-ink-soft">
          {t('result.disclaimer.nonDiagnostic')}
        </p>
        {type === 'share_safe' && (
          <p className="text-xs text-mint">🔒 {t('report.shareSafe')}</p>
        )}
      </article>

      <button
        type="button"
        onClick={() => window.print()}
        className="min-h-touch rounded-pill bg-sky-deep px-6 py-2 font-semibold text-white print:hidden"
      >
        {t('report.print')}
      </button>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="font-semibold text-ink">{title}</h3>
      <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </section>
  );
}
