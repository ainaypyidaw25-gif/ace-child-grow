import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLibraryContent } from '../app/useOfflineLibrary';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { developmentalAgeMonths } from '../domain/age/age';
import { resolveAgeGroup } from '../content/taxonomy';
import { DomainArt } from '../components/DomainArt';
import { NoChild } from './Growth';
import { isFeatureAvailableOnCurrentPlatform, isNativeStoreBuild } from '../app/platform';
import { matchesSearchQuery } from '../domain/search';

export function Activities() {
  const { locale } = useLocale();
  const { activeChild } = useAppState();
  const ageMonths = activeChild
    ? developmentalAgeMonths(new Date(activeChild.birthDate), new Date(), {
        useCorrectedAge: activeChild.useCorrectedAge,
        gestationalWeeks: activeChild.gestationalWeeks,
      })
    : 0;
  const ageGroupKey = resolveAgeGroup(ageMonths)?.key;
  const data = useLibraryContent({ type: 'activity', ageGroupKey });
  const subscription = useQuery(api.subscriptions.mine);
  const favKeys = useQuery(api.favorites.list) ?? [];
  const toggleFav = useMutation(api.favorites.toggle);
  const complete = useMutation(api.activities.complete);
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const [query, setQuery] = useState('');
  const activities = useMemo(() => data?.items ?? [], [data?.items]);
  const filteredActivities = useMemo(() => activities.filter((activity) => matchesSearchQuery(query, [
    activity.titleMm, activity.titleEn, activity.summaryMm, activity.summaryEn,
    activity.slug, activity.domainKey, activity.category, activity.tags,
  ])), [activities, query]);

  if (!activeChild) return <NoChild />;
  if (data === undefined || subscription === undefined) return <p className="text-ink-soft" role="status">…</p>;

  const premium = isFeatureAvailableOnCurrentPlatform(subscription.features, 'personalized_plan');
  const daily = activities.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">
          {premium ? `ACE Premium · ${L('နေ့စဉ်အစီအစဉ်', 'Daily plan')}` : L('ယနေ့ အတူကစားမယ်', 'Play together today')}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{L(`${activeChild.nickname} အတွက် လှုပ်ရှားမှုများ`, `Activities for ${activeChild.nickname}`)}</h1>
        <p className="mt-2 text-sm leading-7 text-ink-soft">
          {premium
            ? L('ကလေး၏ အသက်အရွယ်နှင့် မှတ်တမ်းများအလိုက် ယနေ့လုပ်နိုင်သည့် လှုပ်ရှားမှုများကို ရွေးပေးထားပါသည်။', 'A calm daily plan selected for your child’s age and records.')
            : isNativeStoreBuild()
              ? L('အသက်အရွယ်နှင့် ကိုက်ညီသော လှုပ်ရှားမှုများကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။', 'Age-appropriate activities are available free.')
              : L('အခြေခံလှုပ်ရှားမှုများကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။ အလိုအလျောက်နေ့စဉ်အစီအစဉ်နှင့် ပြီးစီးမှုမှတ်တမ်းအတွက် Premium စမ်းသုံးနိုင်ပါသည်။', 'Core activities are free. Try Premium for a personalized plan and completion history.')}
        </p>
      </header>

      {premium && daily.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-ink">{L('ယနေ့အစီအစဉ်', 'Today’s plan')}</h2>
            <span className="rounded-pill bg-mint-soft px-3 py-1 text-xs font-semibold text-sky-deep">{daily.length} {L('ခု', 'activities')}</span>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {daily.map((activity, index) => (
              <li key={activity._id} className="rounded-[26px] border border-line bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-sky-deep">{index === 0 ? L('မနက်', 'Morning') : index === 1 ? L('နေ့လယ်', 'Afternoon') : L('ညနေ', 'Evening')}</p>
                  <DomainArt domainKey={activity.domainKey} className="h-12 w-12 shrink-0" />
                </div>
                <h3 className="mt-2 font-bold leading-7 text-ink">{locale === 'mm' ? activity.titleMm : activity.titleEn}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{locale === 'mm' ? activity.summaryMm : activity.summaryEn}</p>
                <button
                  type="button"
                  onClick={() => void complete({
                    childId: activeChild.id as never,
                    contentSlug: activity.slug,
                    durationMinutes: activity.durationMinutes,
                  })}
                  className="mt-4 min-h-touch rounded-pill bg-sky-deep px-4 py-2 text-sm font-semibold text-white"
                >
                  {L('ပြီးပြီဟု မှတ်မည်', 'Mark complete')}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {activities.length === 0 ? (
        <section className="rounded-[28px] border border-line bg-white p-6 text-center">
          <div className="text-4xl" aria-hidden>🌱</div>
          <h2 className="mt-3 font-bold text-ink">{L('ဤအသက်အရွယ်နှင့် ကိုက်ညီသော လှုပ်ရှားမှု မတွေ့ပါ', 'No matching activities found')}</h2>
          <p className="mt-2 text-sm text-ink-soft">{L('ကလေး၏ မွေးသက္ကရာဇ်နှင့် အသက်အုပ်စုကို ပြန်စစ်ကြည့်ပါ။', 'Check the child’s birth date and age group.')}</p>
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="font-bold text-ink">{L('လှုပ်ရှားမှုအားလုံး', 'All activities')}</h2>
          <label className="block space-y-1.5 text-sm font-medium text-ink">
            <span className="sr-only">{L('လှုပ်ရှားမှု ရှာဖွေရန်', 'Search activities')}</span>
            <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 shadow-card focus-within:border-sky">
              <span aria-hidden="true">🔎</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={L('လှုပ်ရှားမှု ခေါင်းစဉ် သို့မဟုတ် အကြောင်းအရာရှာရန်', 'Search activities by title or topic')}
                className="min-h-touch min-w-0 flex-1 bg-transparent py-2 text-base font-normal outline-none placeholder:text-ink-soft"
              />
              {query && <button type="button" onClick={() => setQuery('')} className="min-h-touch px-2 text-xs text-sky-deep">{L('ဖျက်မည်', 'Clear')}</button>}
            </span>
          </label>
          <p className="text-xs text-ink-soft">{L(`ပြသနေသည် ${filteredActivities.length} / ${activities.length}`, `Showing ${filteredActivities.length} of ${activities.length}`)}</p>
          {filteredActivities.length > 0 ? <ul className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-white">
            {filteredActivities.map((activity) => (
              <li key={activity._id} className="flex items-center gap-3 p-4">
                <DomainArt domainKey={activity.domainKey} className="h-14 w-14 shrink-0 self-start" />
                <Link to={`/content/${activity.slug}`} className="min-w-0 flex-1">
                  <h3 className="font-semibold text-ink">{locale === 'mm' ? activity.titleMm : activity.titleEn}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{locale === 'mm' ? activity.summaryMm : activity.summaryEn}</p>
                  {activity.durationMinutes && <span className="mt-2 inline-block text-xs text-ink-soft">⏱ {activity.durationMinutes} {L('မိနစ်', 'min')}</span>}
                </Link>
                <button type="button" aria-label={L('သိမ်းထားရန်', 'Save')} aria-pressed={favKeys.includes(activity.slug)} onClick={() => void toggleFav({ activityKey: activity.slug })} className="min-h-touch min-w-touch text-lg">
                  {favKeys.includes(activity.slug) ? '♥' : '♡'}
                </button>
              </li>
            ))}
          </ul> : (
            <div className="rounded-[28px] border border-line bg-white p-6 text-center">
              <p className="font-semibold text-ink">{L('ရှာဖွေမှုနှင့် ကိုက်ညီသော လှုပ်ရှားမှု မရှိပါ။', 'No activities match this search.')}</p>
              <button type="button" onClick={() => setQuery('')} className="mt-3 min-h-touch rounded-pill border border-line px-4 py-2 text-sm font-semibold text-sky-deep">{L('ရှာဖွေမှု ဖျက်မည်', 'Clear search')}</button>
            </div>
          )}
        </section>
      )}

      {!premium && !isNativeStoreBuild() && (
        <Link to="/subscription" className="block rounded-[28px] bg-ink p-6 text-white shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint">ACE Premium</p>
          <h2 className="mt-2 text-xl font-bold">{L('နေ့စဉ်အစီအစဉ်နှင့် တိုးတက်မှုမှတ်တမ်း', 'Daily plan & progress history')}</h2>
          <p className="mt-2 text-sm leading-7 text-white/75">{L('Premium ကို ၃ ရက် အခမဲ့ စမ်းသုံးပြီးနောက် လစဉ် သို့မဟုတ် နှစ်စဉ်အစီအစဉ်ကို ရွေးချယ်ဝယ်ယူနိုင်ပါသည်။ အလိုအလျောက်ငွေမကောက်ပါ။', 'Try Premium free for 3 days, then choose monthly or yearly paid access to continue. No automatic charge.')}</p>
        </Link>
      )}
    </div>
  );
}
