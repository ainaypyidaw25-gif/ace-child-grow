import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useLibraryContent } from '../app/useOfflineLibrary';

export function Favorites() {
  const { t, locale } = useLocale();
  const favKeys = useQuery(api.favorites.list); // undefined === loading
  const data = useLibraryContent({ type: 'activity' });
  const toggleFav = useMutation(api.favorites.toggle);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  // Use the same stable slugs and parent-publication gate as Activities.
  // Never resurrect withdrawn content or infer a slug from a legacy act-N key.
  const bySlug = new Map(data?.items.map((activity) => [activity.slug, activity]));

  async function remove(activityKey: string) {
    setRemoving(activityKey);
    setError(false);
    try {
      await toggleFav({ activityKey });
    } catch {
      setError(true);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('favorites.title')}</h1>
      {error && <p role="alert" className="text-sm text-state-red-deep">{L('ဖယ်ရှားခြင်း မအောင်မြင်ပါ။ ပြန်ကြိုးစားပါ။', 'Could not remove the saved activity. Please try again.')}</p>}
      {favKeys === undefined || (favKeys.length > 0 && data === undefined) ? (
        <p className="text-ink-soft" role="status">…</p>
      ) : favKeys.length === 0 ? (
        <p className="rounded-card bg-pastel-yellow/50 p-4 text-sm text-ink">{t('favorites.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {favKeys.map((key) => {
            const activity = bySlug.get(key);
            return (
              <li key={key} className="rounded-card border border-line bg-white p-4 shadow-card">
                {activity ? <Link to={`/content/${activity.slug}`}>
                  <p className="font-semibold text-ink">{locale === 'mm' ? activity.titleMm : activity.titleEn}</p>
                  <p className="mt-1 text-sm text-ink-soft">{locale === 'mm' ? activity.summaryMm : activity.summaryEn}</p>
                </Link> : <p className="text-sm text-ink-soft">{L('ဤလှုပ်ရှားမှုကို လက်ရှိ ကြည့်ရှု၍ မရနိုင်ပါ။', 'This activity is currently unavailable.')}</p>}
                <button type="button" disabled={removing !== null} onClick={() => void remove(key)}
                  className="mt-3 min-h-touch rounded-pill border border-line px-4 py-2 text-sm font-semibold text-sky-deep">
                  {L('သိမ်းထားမှုမှ ဖယ်ရှားရန်', 'Remove from saved activities')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
