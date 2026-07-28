import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { AGE_GROUPS, DOMAINS, CONTENT_TYPES, ageGroup, domain } from '../content/taxonomy';
import { ReviewBadge } from '../components/ReviewBadge';

const TYPE_LABEL: Record<string, { mm: string; en: string; emoji: string }> = {
  milestone: { mm: 'မှတ်တိုင်', en: 'Milestones', emoji: '🎯' },
  guide: { mm: 'လမ်းညွှန်', en: 'Guides', emoji: '📚' },
  activity: { mm: 'လှုပ်ရှားမှု', en: 'Activities', emoji: '🧩' },
  lesson: { mm: 'သင်ခန်းစာ', en: 'Lessons', emoji: '🎓' },
  special_need: { mm: 'အထူးလိုအပ်ချက်', en: 'Hope Center', emoji: '💛' },
  story: { mm: 'ပုံပြင်', en: 'Stories', emoji: '📖' },
  printable: { mm: 'ပုံနှိပ်အသုံးပြုရန်', en: 'Toolkit', emoji: '🖨️' },
};

export function ContentLibrary() {
  const { locale } = useLocale();
  const [type, setType] = useState<string>('lesson');
  const [ageKey, setAgeKey] = useState<string>('');
  const [domainKey, setDomainKey] = useState<string>('');
  const [q, setQ] = useState('');

  const usesAge = type === 'milestone' || type === 'guide' || type === 'activity';
  const usesDomain = type === 'milestone' || type === 'guide';

  const data = useQuery(api.library.listByType, {
    type,
    ageGroupKey: usesAge && ageKey ? ageKey : undefined,
    domainKey: usesDomain && domainKey ? domainKey : undefined,
    q: q.trim() || undefined,
  });

  const tt = (o: { mm: string; en: string }) => (locale === 'mm' ? o.mm : o.en);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-sky-deep">
          {locale === 'mm' ? 'အကြောင်းအရာ စာကြည့်တိုက်' : 'Content Library'}
        </h1>
        <p className="text-sm text-ink-soft">
          {locale === 'mm'
            ? 'မွေးကင်းမှ ၅ နှစ်အထိ — ဖွံ့ဖြိုးမှု၊ ကစားနည်း၊ သင်ခန်းစာနှင့် ပုံပြင်များ။'
            : 'Birth to 5 — development, activities, lessons, and stories.'}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CONTENT_TYPES.map((tk) => (
          <button
            key={tk} type="button" onClick={() => setType(tk)}
            className={`whitespace-nowrap rounded-pill px-3 py-1.5 text-sm ${
              type === tk ? 'bg-sky text-white' : 'border border-line bg-white text-ink'
            }`}
          >
            <span aria-hidden>{TYPE_LABEL[tk].emoji}</span> {tt(TYPE_LABEL[tk])}
          </button>
        ))}
      </div>

      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={locale === 'mm' ? '🔎 ရှာဖွေရန်' : '🔎 Search'}
        aria-label={locale === 'mm' ? 'အကြောင်းအရာ ရှာဖွေရန်' : 'Search content'}
        className="w-full rounded-pill border border-line bg-white px-4 py-2 text-sm"
      />

      {(usesAge || usesDomain) && (
        <div className="flex flex-wrap gap-2">
          {usesAge && (
            <select value={ageKey} onChange={(e) => setAgeKey(e.target.value)}
              aria-label={locale === 'mm' ? 'အသက်အုပ်စု စစ်ထုတ်ရန်' : 'Filter by age group'}
              className="rounded-pill border border-line bg-white px-3 py-1.5 text-sm">
              <option value="">{locale === 'mm' ? 'အသက်အုပ်စု အားလုံး' : 'All ages'}</option>
              {AGE_GROUPS.map((a) => (
                <option key={a.key} value={a.key}>{locale === 'mm' ? a.labelMm : a.labelEn}</option>
              ))}
            </select>
          )}
          {usesDomain && (
            <select value={domainKey} onChange={(e) => setDomainKey(e.target.value)}
              aria-label={locale === 'mm' ? 'နယ်ပယ် စစ်ထုတ်ရန်' : 'Filter by domain'}
              className="rounded-pill border border-line bg-white px-3 py-1.5 text-sm">
              <option value="">{locale === 'mm' ? 'နယ်ပယ် အားလုံး' : 'All domains'}</option>
              {DOMAINS.map((d) => (
                <option key={d.key} value={d.key}>{locale === 'mm' ? d.labelMm : d.labelEn}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {data === undefined ? (
        <p className="text-ink-soft">…</p>
      ) : data.items.length === 0 ? (
        <div className="rounded-card border border-line bg-mint-soft/40 p-5 text-center">
          <div aria-hidden className="text-3xl">🌱</div>
          <p className="mt-2 font-medium text-ink">
            {locale === 'mm' ? 'ရှာဖွေမှုနှင့် ကိုက်ညီသော အကြောင်းအရာ မတွေ့ပါ။' : 'No matching content found.'}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {locale === 'mm'
              ? 'ရှာဖွေသည့် စကားလုံး သို့မဟုတ် စစ်ထုတ်ထားသော အမျိုးအစားကို ပြောင်းကြည့်ပါ။'
              : 'Try changing the search term or filters.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {data.items.map((it) => (
            <li key={it._id}>
              <Link to={`/content/${it.slug}`}
                className="block rounded-card border border-line bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-soft">
                    {[it.ageGroupKey && (locale === 'mm' ? ageGroup(it.ageGroupKey)?.labelMm : ageGroup(it.ageGroupKey)?.labelEn),
                      it.domainKey && (locale === 'mm' ? domain(it.domainKey)?.labelMm : domain(it.domainKey)?.labelEn)]
                      .filter(Boolean).join(' · ')}
                  </span>
                  <ReviewBadge published={it.clinicalStatus === 'published'} />
                </div>
                <h2 className="mt-1 font-semibold text-ink">{locale === 'mm' ? it.titleMm : it.titleEn}</h2>
                {(it.summaryMm || it.summaryEn) && (
                  <p className="mt-1 text-sm text-ink-soft">{locale === 'mm' ? it.summaryMm : it.summaryEn}</p>
                )}
                {typeof it.durationMinutes === 'number' && (
                  <p className="mt-2 text-xs text-ink-soft">⏱ {it.durationMinutes} {locale === 'mm' ? 'မိနစ်' : 'min'}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
