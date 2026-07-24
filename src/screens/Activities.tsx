import { useMemo } from 'react';
import { useLocale } from '../app/LocaleContext';
import { buildDailyPlan } from '../domain/activities/recommend';
import { DEMO_CHILD, DEMO_ACTIVITY_CATALOGUE } from '../data/demo';
import { SAMPLE_ACTIVITIES, isApprovedForParents } from '../data/seed/content';
import { ReviewBadge } from '../components/ReviewBadge';

export function Activities() {
  const { t, locale } = useLocale();
  const plan = useMemo(
    () => buildDailyPlan({ ageMonths: DEMO_CHILD.ageMonths, catalogue: DEMO_ACTIVITY_CATALOGUE }),
    [],
  );
  const slots = [
    { key: t('home.morning'), a: plan.morning },
    { key: t('home.afternoon'), a: plan.afternoon },
    { key: t('home.evening'), a: plan.evening },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('activities.title')}</h1>
      <p className="text-sm text-ink-soft">
        {t('activities.dailyPlan')} · {DEMO_CHILD.nickname}
      </p>

      <ul className="space-y-3">
        {slots.map((s, i) => (
          <li key={i} className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-medium text-ink-soft">{s.key}</p>
            {s.a ? (
              <p className="mt-1 font-semibold text-ink">
                {locale === 'mm' ? s.a.titleMm : s.a.titleEn}
              </p>
            ) : (
              <p className="mt-1 text-ink-soft">{t('common.empty')}</p>
            )}
          </li>
        ))}
      </ul>

      <h2 className="pt-2 font-semibold text-ink">{t('activities.title')}</h2>
      <ul className="space-y-3">
        {SAMPLE_ACTIVITIES.map((a, i) => (
          <li key={i} className="rounded-card border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{locale === 'mm' ? a.titleMm : a.titleEn}</span>
              <ReviewBadge published={isApprovedForParents(a.reviewStatus)} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">{a.objectiveEn}</p>
            <p className="mt-2 rounded-lg bg-pink/40 px-3 py-2 text-xs text-ink">
              ⚠️ {t('activities.safety')}: {a.safetyNoteEn}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {t('activities.duration')}: {a.durationMinutes} {t('common.minutes')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
