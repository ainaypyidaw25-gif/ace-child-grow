import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { SAMPLE_ACTIVITIES } from '../data/seed/content';

export function Favorites() {
  const { t, locale } = useLocale();
  const favKeys = useQuery(api.favorites.list); // undefined === loading
  const saved = SAMPLE_ACTIVITIES.map((a, i) => ({ a, key: `act-${i}` })).filter((x) =>
    (favKeys ?? []).includes(x.key),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('favorites.title')}</h1>
      {favKeys === undefined ? (
        <p className="text-ink-soft" role="status">…</p>
      ) : saved.length === 0 ? (
        <p className="rounded-card bg-pastel-yellow/50 p-4 text-sm text-ink">{t('favorites.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {saved.map(({ a, key }) => (
            <li key={key} className="rounded-card border border-line bg-white p-4 shadow-card">
              <p className="font-semibold text-ink">{locale === 'mm' ? a.titleMm : a.titleEn}</p>
              <p className="mt-1 text-sm text-ink-soft">{locale === 'mm' ? a.objectiveMm : a.objectiveEn}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
