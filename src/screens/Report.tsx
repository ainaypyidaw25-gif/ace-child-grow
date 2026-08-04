import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { buildReport, type ReportType } from '../domain/reports/report';
import { ageLabels } from '../domain/age/ageLabel';
import { NoChild } from './Growth';
import { PremiumGate } from '../components/PremiumGate';
import { isFeatureAvailableOnCurrentPlatform } from '../app/platform';

export function Report() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const [type, setType] = useState<ReportType>('parent_monthly');
  const [asOf] = useState(() => Date.now());
  const subscription = useQuery(api.subscriptions.mine);
  const canView = isFeatureAvailableOnCurrentPlatform(subscription?.features ?? [], 'advanced_reports');
  const data = useQuery(
    api.reports.childSummary,
    activeChild && canView ? { childId: activeChild.id as never, asOf } : 'skip',
  );

  const source = useMemo(() => {
    const labels = activeChild && data
      ? ageLabels(new Date(activeChild!.birthDate), new Date(), locale, {
          gestationalWeeks: activeChild!.gestationalWeeks,
          useCorrected: activeChild!.useCorrectedAge,
        })
      : null;
    if (!data || !labels) return null;
    return {
      childNickname: data.childNickname,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      chronologicalAgeLabel: labels?.chronological ?? '',
      correctedAgeLabel: labels?.corrected,
      strengths: locale === 'mm' ? data.strengthsMm : data.strengthsEn,
      emergingSkills: locale === 'mm' ? data.emergingMm : data.emergingEn,
      latestResultState: data.latestResultState ?? undefined,
      completedActivities: locale === 'mm' ? data.completedActivitiesMm : data.completedActivitiesEn,
      parentNotes: data.parentNotes,
      savedConcerns: [],
      growthSummary: (locale === 'mm' ? data.growthSummaryMm : data.growthSummaryEn) ?? undefined,
      sleepSummary: (locale === 'mm' ? data.sleepSummaryMm : data.sleepSummaryEn) ?? undefined,
      questionsForProfessional: data.questionsForProfessional,
      nextReviewDate: data.nextAppointmentAt
        ? new Date(data.nextAppointmentAt).toISOString().slice(0, 10)
        : undefined,
    };
  }, [activeChild, data, locale]);

  const report = useMemo(() => source ? buildReport(type, source) : null, [type, source]);

  if (!activeChild) return <NoChild />;
  if (subscription === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (!canView) {
    return (
      <PremiumGate feature="advanced_reports">
        <p className="text-ink-soft">…</p>
      </PremiumGate>
    );
  }
  if (data === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (!report) return null;

  const types: { key: ReportType; label: string }[] = [
    { key: 'parent_monthly', label: t('report.parentMonthly') },
    { key: 'doctor_visit', label: t('report.doctorVisit') },
    { key: 'share_safe', label: t('report.shareSafe') },
  ];

  return (
    <PremiumGate feature="advanced_reports">
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('report.title')}</h1>
      <p className="rounded-lg bg-mint-soft/60 px-3 py-2 text-xs text-ink-soft">
        {locale === 'mm'
          ? 'ဤအစီရင်ခံစာကို ကလေး၏ ဖွံ့ဖြိုးမှု၊ လှုပ်ရှားမှု၊ ကြီးထွားမှု၊ အိပ်စက်မှုနှင့် ချိန်းဆိုမှုမှတ်တမ်းများမှ အလိုအလျောက် စုစည်းထားပါသည်။'
          : 'This report is assembled automatically from your child’s milestone, activity, growth, sleep, and appointment records.'}
      </p>

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
          <p className="text-xs text-mint-deep">🔒 {t('report.shareSafe')}</p>
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
    </PremiumGate>
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
