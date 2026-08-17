import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibraryContent } from '../app/useOfflineLibrary';
import { useOnlineStatus } from '../app/useOnlineStatus';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { developmentalAgeMonths } from '../domain/age/age';
import { ageGroup, resolveAgeGroup } from '../content/taxonomy';
import { isAppleAppStoreBuild } from '../app/platform';

type LearnView = 'recommended' | 'lesson' | 'guide' | 'story';

const VIEW_LABELS: Record<LearnView, { mm: string; en: string; symbol: string }> = {
  recommended: { mm: 'သင့်ကလေးအတွက်', en: 'For your child', symbol: '✦' },
  lesson: { mm: 'သင်ခန်းစာများ', en: 'Lessons', symbol: '▤' },
  guide: { mm: 'မိဘလမ်းညွှန်', en: 'Parent guides', symbol: '⌁' },
  story: { mm: 'ပုံပြင်များ', en: 'Stories', symbol: '◐' },
};

const CATEGORY_LABELS: Record<string, { mm: string; en: string }> = {
  understanding_development: { mm: 'ကလေးဖွံ့ဖြိုးမှု', en: 'Development' },
  learning_through_play: { mm: 'ကစားရင်း သင်ယူခြင်း', en: 'Learning through play' },
  speech_development: { mm: 'စကားသံ ဖွံ့ဖြိုးမှု', en: 'Speech' },
  language_development: { mm: 'ဘာသာစကား ဖွံ့ဖြိုးမှု', en: 'Language' },
  positive_parenting: { mm: 'အပြုသဘော မိဘပြုစုမှု', en: 'Positive parenting' },
  nutrition: { mm: 'အာဟာရ', en: 'Nutrition' },
  sleep: { mm: 'အိပ်စက်ခြင်း', en: 'Sleep' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  screen_time: { mm: 'ဖုန်းနှင့် မျက်နှာပြင်သုံးချိန်', en: 'Screen time' },
  emotional_development: { mm: 'စိတ်ခံစားမှု', en: 'Emotional development' },
  social_skills: { mm: 'လူမှုဆက်ဆံရေး', en: 'Social skills' },
  reading: { mm: 'စာဖတ်ခြင်း', en: 'Reading' },
  early_mathematics: { mm: 'အစောပိုင်း သင်္ချာ', en: 'Early mathematics' },
  creativity: { mm: 'ဖန်တီးတတ်မှု', en: 'Creativity' },
  problem_solving: { mm: 'ပြဿနာ ဖြေရှင်းခြင်း', en: 'Problem solving' },
  special_needs_awareness: { mm: 'အထူးလိုအပ်ချက် နားလည်မှု', en: 'Special-needs awareness' },
  preparing_for_preschool: { mm: 'မူကြိုအတွက် ပြင်ဆင်ခြင်း', en: 'Preparing for preschool' },
  preparing_for_school: { mm: 'ကျောင်းအတွက် ပြင်ဆင်ခြင်း', en: 'Preparing for school' },
  doctor_visits: { mm: 'ဆရာဝန်နှင့် တွေ့ဆုံခြင်း', en: 'Doctor visits' },
  parent_mental_health: { mm: 'မိဘ စိတ်ကျန်းမာရေး', en: 'Parent wellbeing' },
};

export function Learn() {
  const { locale } = useLocale();
  const { activeChild } = useAppState();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<LearnView>('recommended');
  const [category, setCategory] = useState('');
  const online = useOnlineStatus();
  const appStoreBuild = isAppleAppStoreBuild();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  const ageMonths = activeChild
    ? developmentalAgeMonths(new Date(activeChild.birthDate), new Date(), {
        useCorrectedAge: activeChild.useCorrectedAge,
        gestationalWeeks: activeChild.gestationalWeeks,
      })
    : null;
  const currentAgeGroup = ageMonths === null ? undefined : resolveAgeGroup(ageMonths);

  const lessons = useLibraryContent({ type: 'lesson' });
  const guides = useLibraryContent({
    type: 'guide',
    ageGroupKey: currentAgeGroup?.key,
  });
  const stories = useLibraryContent({
    type: 'story',
    ageGroupKey: currentAgeGroup?.key,
  });

  const loading = lessons === undefined || guides === undefined || stories === undefined;
  const recommended = useMemo(
    () => [...(guides?.items ?? []).slice(0, 4), ...(lessons?.items ?? []).slice(0, 3), ...(stories?.items ?? []).slice(0, 1)],
    [guides, lessons, stories],
  );
  const selectedItems = useMemo(() => {
    if (view === 'recommended') return recommended;
    if (view === 'lesson') return lessons?.items ?? [];
    if (view === 'guide') return guides?.items ?? [];
    return stories?.items ?? [];
  }, [guides, lessons, recommended, stories, view]);

  const categories = useMemo(
    () => [...new Set(selectedItems.map((item) => item.category).filter((value): value is string => Boolean(value)))],
    [selectedItems],
  );
  const needle = query.trim().toLocaleLowerCase(locale === 'mm' ? 'my' : 'en');
  const filtered = selectedItems.filter((item) => {
    if (category && item.category !== category) return false;
    if (!needle) return true;
    return [item.titleMm, item.titleEn, item.summaryMm, item.summaryEn, item.category]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase(locale === 'mm' ? 'my' : 'en').includes(needle));
  });

  const switchView = (next: LearnView) => {
    setView(next);
    setCategory('');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="relative overflow-hidden rounded-[30px] bg-ink px-5 py-7 text-white shadow-card sm:px-8">
        <div aria-hidden className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-mint/20" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint">
            {L('နေ့စဉ် အနည်းငယ်စီ အတူသင်ယူမယ်', 'Learn a little together every day')}
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-relaxed sm:text-3xl">
            {activeChild
              ? L(`${activeChild.nickname} အတွက် သင်ယူရန်`, `Learning for ${activeChild.nickname}`)
              : L('မိဘနှင့် ကလေးအတွက် သင်ယူရန်', 'Learning for parents and children')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">
            {currentAgeGroup
              ? L(`${currentAgeGroup.labelMm} အရွယ်နှင့် ကိုက်ညီသော မိဘလမ်းညွှန်၊ သင်ခန်းစာနှင့် ပုံပြင်များကို ရွေးပေးထားပါသည်။`, `Guides, lessons, and stories selected for ${currentAgeGroup.labelEn}.`)
              : L('ရှင်းလင်းတိုတောင်းသော မိဘလမ်းညွှန်၊ သင်ခန်းစာနှင့် ပုံပြင်များကို ဖတ်ရှုနိုင်ပါသည်။', 'Explore short, practical parent guides, lessons, and stories.')}
          </p>
        </div>
      </header>

      {!online && (
        <section className="flex items-center justify-between gap-3 rounded-2xl bg-pastel-yellow/65 px-4 py-3 text-sm text-ink" role="status">
          <span>{appStoreBuild
            ? L('အင်တာနက်ပြတ်နေပါသည်။ ချိတ်ဆက်ပြီးနောက် ထပ်မံကြိုးစားပါ။', 'You are offline. Reconnect and try again.')
            : L('အင်တာနက်ပြတ်နေပါသည်။ ယခင်သိမ်းထားသောအကြောင်းအရာများကို ဖတ်နိုင်ပါသည်။', 'You are offline. Previously saved content remains available.')}</span>
          {!appStoreBuild && <Link to="/offline" className="shrink-0 font-bold text-sky-deep underline">{L('သိမ်းထားသည်များ', 'Downloads')}</Link>}
        </section>
      )}

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={L('အကြောင်းအရာအမျိုးအစား', 'Learning sections')}>
        {(Object.keys(VIEW_LABELS) as LearnView[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => switchView(key)}
            aria-pressed={view === key}
            className={`min-h-touch whitespace-nowrap rounded-pill px-4 py-2 text-sm font-semibold ${
              view === key ? 'bg-sky-deep text-white' : 'border border-line bg-white text-ink'
            }`}
          >
            <span aria-hidden>{VIEW_LABELS[key].symbol}</span> {L(VIEW_LABELS[key].mm, VIEW_LABELS[key].en)}
          </button>
        ))}
      </nav>

      <section className="space-y-3" aria-labelledby="learning-results-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">
              {view === 'recommended' ? L('အသက်အလိုက် ရွေးချယ်ထားသည်', 'Selected by age') : L(VIEW_LABELS[view].mm, VIEW_LABELS[view].en)}
            </p>
            <h2 id="learning-results-title" className="mt-1 text-xl font-bold text-ink">
              {view === 'recommended'
                ? L('ယနေ့ ဖတ်ရှုရန် အကြံပြုချက်များ', 'Recommended for today')
                : L('ဖတ်ရှုနိုင်သော အကြောင်းအရာများ', 'Available learning resources')}
            </h2>
          </div>
          <label className="relative block sm:w-80">
            <span className="sr-only">{L('သင်ခန်းစာ ရှာဖွေရန်', 'Search learning resources')}</span>
            <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={L('ခေါင်းစဉ် သို့မဟုတ် အကြောင်းအရာရှာရန်', 'Search by topic or title')}
              className="min-h-touch w-full rounded-pill border border-line bg-white py-2 pl-10 pr-4 text-sm"
            />
          </label>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setCategory('')} className={`whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-semibold ${!category ? 'bg-mint-soft text-sky-deep' : 'bg-white text-ink-soft'}`}>
              {L('အားလုံး', 'All')}
            </button>
            {categories.map((key) => (
              <button key={key} type="button" onClick={() => setCategory(key)} className={`whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-semibold ${category === key ? 'bg-mint-soft text-sky-deep' : 'bg-white text-ink-soft'}`}>
                {locale === 'mm' ? CATEGORY_LABELS[key]?.mm ?? key : CATEGORY_LABELS[key]?.en ?? key}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="overflow-hidden rounded-[28px] border border-line bg-white" role="status" aria-label={L('အကြောင်းအရာများ တင်နေသည်', 'Loading learning resources')}>
            {[0, 1, 2].map((row) => (
              <div key={row} className={`animate-pulse px-5 py-5 ${row ? 'border-t border-line' : ''}`}>
                <div className="h-3 w-24 rounded bg-mint-soft" />
                <div className="mt-3 h-5 w-3/4 rounded bg-canvas" />
                <div className="mt-2 h-3 w-full rounded bg-canvas" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-line bg-white px-5 py-8 text-center shadow-card">
            <div className="text-4xl" aria-hidden>🌱</div>
            <h3 className="mt-3 font-bold text-ink">{L('ကိုက်ညီသောအကြောင်းအရာ မတွေ့ပါ', 'No matching resources found')}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              {view === 'guide' && currentAgeGroup
                ? L(`${currentAgeGroup.labelMm} အတွက် ကိုက်ညီသော လမ်းညွှန် မတွေ့ပါ။ အခြားအမျိုးအစားကို ကြည့်နိုင်ပါသည်။`, `No guides match ${currentAgeGroup.labelEn}. Try another section.`)
                : L('ရှာဖွေသည့်စကားလုံးကို ပြောင်းပါ သို့မဟုတ် အမျိုးအစားအားလုံးကို ပြန်ကြည့်ပါ။', 'Change the search term or reset the filters.')}
            </p>
            <button type="button" onClick={() => { setQuery(''); setCategory(''); setView('recommended'); }} className="mt-4 min-h-touch rounded-pill bg-sky-deep px-5 py-2 text-sm font-semibold text-white">
              {L('အကြံပြုချက်များ ပြန်ကြည့်မည်', 'Show recommendations')}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-white shadow-card">
            {filtered.map((item, index) => {
              const itemAge = item.ageGroupKey ? ageGroup(item.ageGroupKey) : undefined;
              const kind = item.type === 'guide'
                ? L('မိဘလမ်းညွှန်', 'Parent guide')
                : item.type === 'story'
                  ? L('ပုံပြင်', 'Story')
                  : L('သင်ခန်းစာ', 'Lesson');
              return (
                <li key={item._id}>
                  <Link to={`/content/${item.slug}`} className="group flex items-start gap-4 px-4 py-5 sm:px-5">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${index === 0 && view === 'recommended' ? 'bg-mint text-ink' : 'bg-canvas text-sky-deep'}`} aria-hidden>
                      {item.type === 'guide' ? '⌁' : item.type === 'story' ? '◐' : '▤'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-deep">
                        <span>{kind}</span>
                        {itemAge && <span className="font-normal text-ink-soft">· {locale === 'mm' ? itemAge.labelMm : itemAge.labelEn}</span>}
                        {index === 0 && view === 'recommended' && <span className="rounded-pill bg-mint-soft px-2 py-0.5 text-[11px]">{L('ယနေ့အတွက်', 'Start here')}</span>}
                      </span>
                      <h3 className="mt-1 font-bold leading-7 text-ink">{locale === 'mm' ? item.titleMm : item.titleEn}</h3>
                      {(item.summaryMm || item.summaryEn) && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{locale === 'mm' ? item.summaryMm : item.summaryEn}</p>
                      )}
                      {typeof item.durationMinutes === 'number' && <span className="mt-2 inline-block text-xs text-ink-soft">⏱ {item.durationMinutes} {L('မိနစ်', 'min')}</span>}
                    </span>
                    <span className="mt-3 text-sky-deep transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={`grid gap-3 ${appStoreBuild ? '' : 'sm:grid-cols-2'}`}>
        <Link to="/activities" className="rounded-[26px] bg-mint-soft p-5 text-ink">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-deep">{L('ဖတ်ပြီး လက်တွေ့လုပ်မယ်', 'Learn by doing')}</p>
          <h2 className="mt-2 font-bold">{L('အသက်အလိုက် လှုပ်ရှားမှုများ', 'Age-based activities')}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{L('အိမ်တွင် လွယ်ကူစွာ အတူကစားနိုင်သော နည်းလမ်းများ။', 'Simple ways to play and learn together at home.')}</p>
        </Link>
        {!appStoreBuild && <Link to="/offline" className="rounded-[26px] bg-lavender/35 p-5 text-ink">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-deep">{L('အင်တာနက်မရှိလည်း ဖတ်နိုင်ရန်', 'Ready when offline')}</p>
          <h2 className="mt-2 font-bold">{L('အကြောင်းအရာများ သိမ်းထားရန်', 'Save learning resources')}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{L('လိုအပ်သည့်အကြောင်းအရာကို ဖုန်းထဲသိမ်းပြီး နောက်မှဖတ်နိုင်ပါသည်။', 'Keep useful resources on the device for later.')}</p>
        </Link>}
      </section>
    </div>
  );
}
