import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { ageLabels } from '../domain/age/ageLabel';
import { effectivePlanKeyForCurrentPlatform, isAppleAppStoreBuild, isNativeStoreBuild } from '../app/platform';

export function Home() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const subscription = useQuery(api.subscriptions.mine);
  const labels = activeChild
    ? ageLabels(new Date(activeChild.birthDate), new Date(), locale, {
        gestationalWeeks: activeChild.gestationalWeeks,
        useCorrected: activeChild.useCorrectedAge,
      })
    : null;

  const today = [
    {
      label: t('home.morning'),
      detail: locale === 'mm' ? 'မျက်နှာချင်းဆိုင် စကားပြောချိန်' : 'Face-to-face talking time',
      duration: locale === 'mm' ? '၅ မိနစ်' : '5 min',
      symbol: '☼',
      to: '/activities',
    },
    {
      label: t('home.afternoon'),
      detail: locale === 'mm' ? 'အသက်အလိုက် ကစားလှုပ်ရှားမှု' : 'Age-based play activity',
      duration: locale === 'mm' ? '၁၀ မိနစ်' : '10 min',
      symbol: '✦',
      to: '/activities',
    },
    {
      label: t('home.evening'),
      detail: locale === 'mm' ? 'ပုံစာအုပ်အတူကြည့်ချိန်' : 'Share a picture book',
      duration: locale === 'mm' ? '၅ မိနစ်' : '5 min',
      symbol: '◐',
      to: '/learn',
    },
  ];

  const allTools = [
    { to: '/growth', label: t('growth.title'), note: locale === 'mm' ? 'အလေးချိန်နှင့် အရပ်' : 'Height and weight', symbol: '↗', tone: 'bg-mint-soft text-sky-deep' },
    { to: '/sleep', label: t('sleep.title'), note: locale === 'mm' ? 'အိပ်ချိန် မှတ်တမ်း' : 'Sleep tracking', symbol: '◒', tone: 'bg-lavender/30 text-ink' },
    { to: '/health', label: locale === 'mm' ? 'ကျန်းမာရေးမှတ်တမ်း' : 'Health records', note: locale === 'mm' ? 'ကာကွယ်ဆေးနှင့် ဆေးဝါး' : 'Vaccinations and medications', symbol: '✚', tone: 'bg-mint-soft text-sky-deep' },
    { to: '/appointments', label: locale === 'mm' ? 'ချိန်းဆိုမှုများ' : 'Appointments', note: locale === 'mm' ? 'ဆရာဝန်ချိန်းဆိုမှု' : 'Doctor visit scheduling', symbol: '⌁', tone: 'bg-pastel-yellow/40 text-ink' },
    { to: '/report', label: t('report.title'), note: locale === 'mm' ? 'တစ်လစာ အနှစ်ချုပ်' : 'Monthly summary', symbol: '▤', tone: 'bg-pastel-yellow/40 text-ink' },
    { to: '/directory', label: locale === 'mm' ? 'ဝန်ဆောင်မှုများ' : 'Support services', note: locale === 'mm' ? 'ကျောင်းနှင့် ပညာရှင်များ' : 'Schools and specialists', symbol: '⌖', tone: 'bg-pink/40 text-ink' },
    { to: '/weekly-plan', label: locale === 'mm' ? 'တစ်ပတ်စာအစီအစဉ်' : 'Weekly plan', note: locale === 'mm' ? 'ရက်အလိုက် ကစားစရာများ' : 'Day-by-day activities', symbol: '▦', tone: 'bg-lavender/30 text-ink' },
    { to: '/observations', label: t('journal.title'), note: locale === 'mm' ? 'နေ့စဉ်စောင့်ကြည့်မှတ်ချက်' : 'Daily behavior notes', symbol: '✎', tone: 'bg-mint-soft text-sky-deep' },
    { to: '/milestone-gallery', label: t('milestoneGallery.title'), note: locale === 'mm' ? 'ဓာတ်ပုံထည့်၊ လူမှုကွန်ရက်တွင် မျှဝေ' : 'Add a photo, share on social media', symbol: '🏅', tone: 'bg-pastel-yellow/40 text-ink' },
    { to: '/hope', label: t('hope.title'), note: locale === 'mm' ? 'အထူးလိုအပ်ချက် နားလည်မှု' : 'Understanding special needs', symbol: '◇', tone: 'bg-pink/40 text-ink' },
  ] as const;
  const appStoreBuild = isAppleAppStoreBuild();
  const tools = appStoreBuild
    ? allTools.filter((tool) => !['/appointments', '/report', '/weekly-plan', '/observations', '/hope'].includes(tool.to))
    : allTools;

  const planKey = effectivePlanKeyForCurrentPlatform(subscription?.planKey ?? 'free');
  const premium = planKey === 'premium' || planKey === 'family';

  return (
    <div className="space-y-7">
      <h1 className="sr-only">{t('app.name')}</h1>

      <section className="relative overflow-hidden rounded-[30px] bg-ink px-5 py-7 text-white shadow-card sm:px-8 sm:py-9">
        <div aria-hidden className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-mint/20" />
        <div aria-hidden className="absolute -bottom-20 right-28 h-40 w-40 rounded-full bg-pastel-yellow/10" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-medium text-mint">
            {locale === 'mm' ? 'ဒီနေ့ အတူကြီးထွားမယ်' : 'Grow together today'}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-relaxed sm:text-3xl">
            {activeChild
              ? locale === 'mm' ? `${activeChild.nickname} အတွက် ဒီနေ့အစီအစဉ်` : `Today’s plan for ${activeChild.nickname}`
              : t('app.tagline')}
          </h2>
          {activeChild && (
            <p className="mt-1 text-sm text-white/70">
              {labels?.chronological}
              {labels?.corrected && ` · ${labels.corrected} (${t('common.corrected')})`}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/activities"
              className="inline-flex min-h-touch items-center rounded-pill bg-mint px-5 py-2 text-sm font-bold text-ink"
            >
              {locale === 'mm' ? 'ဒီနေ့လှုပ်ရှားမှု စမယ်' : 'Start today’s activity'} →
            </Link>
            <Link
              to="/journey"
              className="inline-flex min-h-touch items-center rounded-pill border border-white/25 px-5 py-2 text-sm font-semibold text-white"
            >
              {locale === 'mm' ? 'ဖွံ့ဖြိုးမှုကြည့်ရန်' : 'View development'}
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <section aria-labelledby="today-plan-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-deep">
                {locale === 'mm' ? 'လွယ်ကူသော နေ့စဉ်အစီအစဉ်' : 'A simple daily rhythm'}
              </p>
              <h2 id="today-plan-title" className="mt-1 text-xl font-bold text-ink">{t('home.todayPlan')}</h2>
            </div>
            <Link to="/activities" className="text-sm font-semibold text-sky-deep">
              {locale === 'mm' ? 'အားလုံး' : 'View all'} →
            </Link>
          </div>
          <ol className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            {today.map((item, index) => (
              <li key={item.label} className={index > 0 ? 'border-t border-line' : ''}>
                <Link to={item.to} className="group flex items-center gap-4 px-4 py-4 sm:px-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint-soft text-lg text-sky-deep">
                    {item.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-ink-soft">{item.label}</span>
                    <span className="block font-semibold text-ink">{item.detail}</span>
                  </span>
                  <span className="hidden text-xs text-ink-soft sm:block">{item.duration}</span>
                  <span className="text-sky-deep transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-deep">
              {locale === 'mm' ? 'အခု စောင့်ကြည့်ရန်' : 'Development snapshot'}
            </p>
            <h2 className="mt-2 text-lg font-bold text-ink">{t('home.snapshot')}</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {locale === 'mm'
                ? 'ကလေးတစ်ဦးနှင့်တစ်ဦး ဖွံ့ဖြိုးမှုအချိန် ကွာခြားနိုင်သည်။ မှတ်တမ်းကို အေးအေးဆေးဆေး ဆက်လက်ဖြည့်ပါ။'
                : 'Every child develops at a different pace. Keep observing without turning milestones into deadlines.'}
            </p>
            <Link to="/journey" className="mt-4 inline-flex min-h-touch items-center text-sm font-bold text-sky-deep">
              {locale === 'mm' ? 'ဖွံ့ဖြိုးမှုမှတ်တမ်းဖွင့်ရန်' : 'Open development journey'} →
            </Link>
          </section>

          {!premium && !isNativeStoreBuild() && (
            <section className="rounded-3xl bg-pastel-yellow/55 p-5">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">ACE Premium</span>
              <h2 className="mt-2 font-bold text-ink">
                {locale === 'mm' ? 'လစဉ်အနှစ်ချုပ်ကို တစ်နေရာတည်းမှာ' : 'Your monthly story, in one place'}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {locale === 'mm' ? 'အဆင့်မြင့်အစီရင်ခံစာနှင့် offline ဖတ်ရှုမှု ပါဝင်သည်။' : 'Includes advanced reports and offline access.'}
              </p>
              <Link to="/subscription" className="mt-3 inline-flex min-h-touch items-center text-sm font-bold text-sky-deep">
                {locale === 'mm' ? 'အစီအစဉ်များ ကြည့်ရန်' : 'Explore plans'} →
              </Link>
            </section>
          )}
        </aside>
      </div>

      <section aria-labelledby="parent-tools-title">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-deep">
            {locale === 'mm' ? 'မှတ်တမ်းနှင့် အကူအညီ' : 'Track and support'}
          </p>
          <h2 id="parent-tools-title" className="mt-1 text-xl font-bold text-ink">
            {locale === 'mm' ? 'မိဘအတွက် အသုံးဝင်ရာများ' : 'Parent tools'}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group flex min-h-[104px] items-start gap-3 rounded-3xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky/30 hover:shadow-card"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${tool.tone}`}>
                {tool.symbol}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{tool.label}</span>
                <span className="mt-1 block text-xs text-ink-soft">{tool.note}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
