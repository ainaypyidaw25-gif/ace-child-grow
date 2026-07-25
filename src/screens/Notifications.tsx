import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

export function Notifications() {
  const { t, locale } = useLocale();
  const items = useQuery(api.notifications.list) ?? [];
  const markAllRead = useMutation(api.notifications.markAllRead);
  const unread = items.filter((n) => !n.readAt).length;

  // Mark everything read when the screen is opened (depends on a stable count).
  useEffect(() => {
    if (unread > 0) void markAllRead({});
  }, [unread, markAllRead]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('notifications.title')}</h1>
      {items.length === 0 ? (
        <p className="text-ink-soft">{t('notifications.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n._id}
              className={`rounded-card border p-4 ${n.readAt ? 'border-line bg-white' : 'border-sky bg-mint-soft'}`}
            >
              <p className="font-semibold text-ink">{locale === 'mm' ? n.titleMm : n.titleEn}</p>
              {(locale === 'mm' ? n.bodyMm : n.bodyEn) && (
                <p className="mt-1 text-sm text-ink-soft">{locale === 'mm' ? n.bodyMm : n.bodyEn}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
