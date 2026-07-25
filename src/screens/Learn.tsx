import { useState } from 'react';
import { useLocale } from '../app/LocaleContext';
import { SAMPLE_LESSONS, isApprovedForParents } from '../data/seed/content';
import { ReviewBadge } from '../components/ReviewBadge';

export function Learn() {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState('');
  const lessons = SAMPLE_LESSONS.filter((l) =>
    (locale === 'mm' ? l.titleMm : l.titleEn).toLowerCase().includes(query.toLowerCase()) ||
    l.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('learn.title')}</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔎"
        className="w-full rounded-pill border border-line bg-white px-4 py-2"
      />
      <ul className="grid grid-cols-1 gap-3">
        {lessons.map((l, i) => (
          <li key={i} className="rounded-card border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-pill bg-lavender/50 px-3 py-0.5 text-xs">{t(l.categoryKey)}</span>
              <ReviewBadge published={isApprovedForParents(l.reviewStatus)} />
            </div>
            <h2 className="mt-2 font-semibold text-ink">{locale === 'mm' ? l.titleMm : l.titleEn}</h2>
            <p className="mt-1 text-sm text-ink-soft">{locale === 'mm' ? l.summaryMm : l.summaryEn}</p>
            <p className="mt-2 text-xs text-ink-soft">
              📖 {t('learn.readMinutes')}: {l.readingMinutes} {t('common.minutes')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
