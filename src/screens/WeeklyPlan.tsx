import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLibraryContent } from '../app/useOfflineLibrary';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { developmentalAgeMonths } from '../domain/age/age';
import { resolveAgeGroup } from '../content/taxonomy';
import { buildWeeklyPlan, startOfWeek, isSameDay } from '../domain/activities/weeklyPlan';
import { DomainArt } from '../components/DomainArt';
import { isGooglePlayBuild } from '../app/platform';
import { NoChild } from './Growth';

const DAY_LABELS: Array<{ mm: string; en: string }> = [
  { mm: 'တနင်္လာ', en: 'Monday' },
  { mm: 'အင်္ဂါ', en: 'Tuesday' },
  { mm: 'ဗုဒ္ဓဟူး', en: 'Wednesday' },
  { mm: 'ကြာသပတေး', en: 'Thursday' },
  { mm: 'သောကြာ', en: 'Friday' },
  { mm: 'စနေ', en: 'Saturday' },
  { mm: 'တနင်္ဂနွေ', en: 'Sunday' },
];

export function WeeklyPlan() {
  const { locale } = useLocale();
  const { activeChild } = useAppState();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const ageMonths = activeChild
    ? developmentalAgeMonths(new Date(activeChild.birthDate), new Date(), {
        useCorrectedAge: activeChild.useCorrectedAge,
        gestationalWeeks: activeChild.gestationalWeeks,
      })
    : 0;
  const ageGroupKey = resolveAgeGroup(ageMonths)?.key;
  const data = useLibraryContent({ type: 'activity', ageGroupKey });
  const subscription = useQuery(api.subscriptions.mine);
  const premium = subscription?.features.includes('personalized_plan') ?? false;
  const childId = activeChild?.id as string | undefined;
  const completions = useQuery(
    api.activities.list,
    childId && premium ? { childId: childId as never } : 'skip',
  );
  const complete = useMutation(api.activities.complete);

  const activities = useMemo(() => data?.items ?? [], [data?.items]);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const recentSlugs = useMemo(
    () => (completions ?? []).map((c) => c.contentSlug),
    [completions],
  );
  const plan = useMemo(() => buildWeeklyPlan(activities, recentSlugs), [activities, recentSlugs]);

  if (!activeChild) return <NoChild />;
  if (data === undefined || subscription === undefined) return <p className="text-ink-soft" role="status">…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">
          {premium ? `ACE Premium · ${L('တစ်ပတ်စာအစီအစဉ်', 'Weekly plan')}` : L('ဒီအပတ် အတူကစားမယ်', 'Play together this week')}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">
          {L(`${activeChild.nickname} အတွက် တစ်ပတ်စာအစီအစဉ်`, `This week's plan for ${activeChild.nickname}`)}
        </h1>
        <p className="mt-2 text-sm leading-7 text-ink-soft">
          {premium
            ? L('တစ်ပတ်စာ ကစားစရာလှုပ်ရှားမှုများကို အသက်အရွယ်နှင့် ပြီးစီးမှုမှတ်တမ်းအလိုက် ရွေးပေးထားပါသည်။', 'A week of activities selected for your child’s age and recent history.')
            : L('တစ်ပတ်စာ အစီအစဉ်ကြည့်ရန် Premium လိုအပ်ပါသည်။', 'A weekly plan is a Premium feature.')}
        </p>
      </header>

      {premium ? (
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {plan.map((day) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + day.dayIndex);
            const doneToday = day.activity
              ? (completions ?? []).some((c) => c.contentSlug === day.activity!.slug && isSameDay(c.completedAt, date.getTime()))
              : false;
            return (
              <li key={day.dayIndex} className="flex flex-col rounded-[22px] border border-line bg-white p-4 shadow-card">
                <p className="text-xs font-bold text-sky-deep">{L(DAY_LABELS[day.dayIndex].mm, DAY_LABELS[day.dayIndex].en)}</p>
                <p className="text-[11px] text-ink-soft">{date.toLocaleDateString(locale === 'mm' ? 'my-MM' : 'en-US', { month: 'short', day: 'numeric' })}</p>
                {day.activity ? (
                  <>
                    <DomainArt domainKey={day.activity.domainKey} className="mt-2 h-12 w-12 shrink-0" />
                    <Link to={`/content/${day.activity.slug}`} className="mt-2 flex-1">
                      <h3 className="font-semibold leading-6 text-ink">{locale === 'mm' ? day.activity.titleMm : day.activity.titleEn}</h3>
                    </Link>
                    <button
                      type="button"
                      disabled={doneToday}
                      onClick={() => void complete({
                        childId: childId as never,
                        contentSlug: day.activity!.slug,
                        durationMinutes: day.activity!.durationMinutes,
                      })}
                      className="mt-3 min-h-touch rounded-pill bg-sky-deep px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {doneToday ? `✓ ${L('ပြီးပြီ', 'Done')}` : L('ပြီးပြီဟု မှတ်မည်', 'Mark complete')}
                    </button>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-ink-soft">{L('ဤအသက်အရွယ်အတွက် လှုပ်ရှားမှု မတွေ့ပါ', 'No activity for this age yet')}</p>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        !isGooglePlayBuild() && (
          <Link to="/subscription" className="block rounded-[28px] bg-ink p-6 text-white shadow-card">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint">ACE Premium</p>
            <h2 className="mt-2 text-xl font-bold">{L('တစ်ပတ်စာအစီအစဉ်', 'Weekly plan')}</h2>
            <p className="mt-2 text-sm leading-7 text-white/75">{L('ဘဏ်ကတ်မလိုဘဲ ၇ ရက် အခမဲ့ စမ်းသုံးနိုင်ပါသည်။', 'Try it free for 7 days without a card.')}</p>
          </Link>
        )
      )}
    </div>
  );
}
