import { useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { buildDailyPlan } from '../domain/activities/recommend';
import { DEMO_ACTIVITY_CATALOGUE } from '../data/demo';
import { SAMPLE_ACTIVITIES, isApprovedForParents } from '../data/seed/content';
import { chronologicalAge } from '../domain/age/age';
import { ReviewBadge } from '../components/ReviewBadge';
import { StaffPreviewBanner, UnreviewedContentNotice, useStaffPreviewAccess } from '../components/StaffPreviewGate';
import { NoChild } from './Growth';

export function Activities() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const favKeys = useQuery(api.favorites.list) ?? [];
  const toggleFav = useMutation(api.favorites.toggle);
  const staffPreview = useStaffPreviewAccess();

  const ageMonths = activeChild
    ? chronologicalAge(new Date(activeChild.birthDate), new Date()).totalMonths
    : 0;
  const plan = useMemo(
    () => buildDailyPlan({ ageMonths, catalogue: DEMO_ACTIVITY_CATALOGUE }),
    [ageMonths],
  );

  // No active child → don't invent a demo child; prompt to add one.
  if (!activeChild) return <NoChild />;
  if (staffPreview === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (!staffPreview) return <UnreviewedContentNotice />;

  const slots = [
    { key: t('home.morning'), a: plan.morning },
    { key: t('home.afternoon'), a: plan.afternoon },
    { key: t('home.evening'), a: plan.evening },
  ];

  // P1 safety: only show age-appropriate activities (never infant-only to older
  // children). Keep the original index so favourite keys stay stable.
  const ageAppropriate = SAMPLE_ACTIVITIES.map((a, i) => ({ a, i })).filter(
    ({ a }) => ageMonths >= a.ageMinMonths && ageMonths <= a.ageMaxMonths,
  );

  return (
    <div className="space-y-4">
      <StaffPreviewBanner />
      <h1 className="text-xl font-bold text-sky-deep">{t('activities.title')}</h1>
      <p className="text-sm text-ink-soft">{t('activities.dailyPlan')} · {activeChild.nickname}</p>

      <ul className="space-y-3">
        {slots.map((s, i) => (
          <li key={i} className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-medium text-ink-soft">{s.key}</p>
            {s.a ? (
              <p className="mt-1 font-semibold text-ink">{locale === 'mm' ? s.a.titleMm : s.a.titleEn}</p>
            ) : (
              <p className="mt-1 text-ink-soft">{t('common.empty')}</p>
            )}
          </li>
        ))}
      </ul>

      <h2 className="pt-2 font-semibold text-ink">{t('activities.title')}</h2>
      {ageAppropriate.length === 0 ? (
        <p className="rounded-card bg-pastel-yellow/40 p-4 text-sm text-ink-soft">
          {locale === 'mm'
            ? 'ဤအရွယ်အတွက် နမူနာ လှုပ်ရှားမှု မရှိသေးပါ။ (အကြောင်းအရာ အပြည့်အစုံကို ဆေးပညာ သုံးသပ်ပြီးမှ ထည့်သွင်းပါမည်။)'
            : 'No sample activities for this age yet. (Full catalogue is added under clinical review.)'}
        </p>
      ) : (
        <ul className="space-y-3">
          {ageAppropriate.map(({ a, i }) => (
            <li key={i} className="rounded-card border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{locale === 'mm' ? a.titleMm : a.titleEn}</span>
                <div className="flex items-center gap-2">
                  <ReviewBadge published={isApprovedForParents(a.reviewStatus)} />
                  <button
                    type="button"
                    aria-label="Save activity"
                    aria-pressed={favKeys.includes(`act-${i}`)}
                    onClick={() => void toggleFav({ activityKey: `act-${i}` })}
                    className="min-h-touch min-w-touch text-lg"
                  >
                    {favKeys.includes(`act-${i}`) ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{locale === 'mm' ? a.objectiveMm : a.objectiveEn}</p>
              <p className="mt-2 rounded-lg bg-pink/40 px-3 py-2 text-xs text-ink">
                ⚠️ {t('activities.safety')}: {locale === 'mm' ? a.safetyNoteMm : a.safetyNoteEn}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {t('activities.duration')}: {a.durationMinutes} {t('common.minutes')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
