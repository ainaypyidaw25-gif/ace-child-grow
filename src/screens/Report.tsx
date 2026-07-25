import { useMemo, useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { buildReport, type ReportType } from '../domain/reports/report';
import { ageLabels } from '../domain/age/ageLabel';
import { NoChild } from './Growth';
import type { Locale } from '../domain/types';

// Sample report content, localized. Real aggregation from stored milestone/
// growth/sleep data is a follow-up; until then this is clearly labelled sample.
function sampleSource(locale: Locale) {
  const mm = locale === 'mm';
  return {
    periodStart: '2026-06-24',
    periodEnd: '2026-07-24',
    strengths: mm ? ['ရုပ်ပုံများကို အမည်ပြောနိုင်သည်', 'စာအုပ်အတူဖတ်ရသည်ကို နှစ်သက်သည်'] : ['Names familiar pictures', 'Enjoys shared reading'],
    emergingSkills: mm ? ['စကားနှစ်လုံးတွဲ ပြောခြင်း'] : ['Two-word phrases'],
    latestResultState: 'yellow' as const,
    completedActivities: mm ? ['ပုံစာအုပ် အတူဖတ်ခြင်း'] : ['Shared picture-book reading'],
    parentNotes: mm ? ['လူသစ်နှင့် နည်းနည်း ရှက်တတ်သည်'] : ['A little shy with new people'],
    savedConcerns: [] as string[],
    growthSummary: mm ? 'ဤလတွင် ကိုယ်အလေးချိန်နှင့် အရပ် မှတ်တမ်းတင်ထားသည်။' : 'Weight and height tracked this month.',
    sleepSummary: mm ? 'ပျမ်းမျှ အိပ်ချိန် ~၁၁ နာရီ။' : 'Average total sleep ~11h.',
    questionsForProfessional: mm ? ['စကားနှစ်လုံးတွဲ ပြောနိုင်ရန် မည်သို့ ကူညီနိုင်မလဲ။'] : ['How can I support two-word phrases?'],
    nextReviewDate: '2026-08-21',
  };
}

export function Report() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const [type, setType] = useState<ReportType>('parent_monthly');

  const source = useMemo(() => {
    const base = sampleSource(locale);
    const labels = activeChild
      ? ageLabels(new Date(activeChild!.birthDate), new Date(), locale, {
          gestationalWeeks: activeChild!.gestationalWeeks,
          useCorrected: activeChild!.useCorrectedAge,
        })
      : null;
    return {
      ...base,
      childNickname: activeChild?.nickname ?? '',
      chronologicalAgeLabel: labels?.chronological ?? '',
      correctedAgeLabel: labels?.corrected,
    };
  }, [activeChild, locale]);

  const report = useMemo(() => buildReport(type, source), [type, source]);

  if (!activeChild) return <NoChild />;

  const types: { key: ReportType; label: string }[] = [
    { key: 'parent_monthly', label: t('report.parentMonthly') },
    { key: 'doctor_visit', label: t('report.doctorVisit') },
    { key: 'share_safe', label: t('report.shareSafe') },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('report.title')}</h1>
      <p className="rounded-lg bg-pastel-yellow/50 px-3 py-2 text-xs text-ink-soft">
        {locale === 'mm'
          ? 'ဤသည်မှာ နမူနာ အစီရင်ခံစာ ဖြစ်သည် — milestone/growth/sleep မှတ်တမ်းများမှ အလိုအလျောက် စုစည်းမှုကို ဆက်လက် တပ်ဆင်နေဆဲ ဖြစ်သည်။'
          : 'This is a sample report — automatic aggregation from your milestone/growth/sleep records is being wired next.'}
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
