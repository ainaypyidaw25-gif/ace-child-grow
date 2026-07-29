import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

export function safeNotificationTarget(targetPath: string | undefined): string | null {
  if (!targetPath?.startsWith('/') || targetPath.startsWith('//')) return null;
  return targetPath;
}

export function formatNotificationDate(timestamp: number, locale: 'mm' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'mm' ? 'my-MM' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

type NotificationItem = {
  _id: string;
  _creationTime: number;
  titleMm: string;
  titleEn: string;
  bodyMm?: string;
  bodyEn?: string;
  targetPath?: string;
  createdAt?: number;
  readAt?: number;
};

function NotificationRow({ item, locale }: { item: NotificationItem; locale: 'mm' | 'en' }) {
  const target = safeNotificationTarget(item.targetPath);
  const content = (
    <article className={`rounded-card border p-4 ${item.readAt ? 'border-line bg-white' : 'border-sky bg-mint-soft'} ${target ? 'transition hover:border-sky hover:shadow-card' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">{locale === 'mm' ? item.titleMm : item.titleEn}</p>
          {(locale === 'mm' ? item.bodyMm : item.bodyEn) && (
            <p className="mt-1 text-sm text-ink-soft">{locale === 'mm' ? item.bodyMm : item.bodyEn}</p>
          )}
        </div>
        {target && <span aria-hidden className="text-sky-deep">→</span>}
      </div>
      <time dateTime={new Date(item.createdAt ?? item._creationTime).toISOString()} className="mt-2 block text-xs text-ink-soft">
        {formatNotificationDate(item.createdAt ?? item._creationTime, locale)}
      </time>
    </article>
  );
  return target ? <Link to={target} className="block rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-sky">{content}</Link> : content;
}

export function Notifications() {
  const { t, locale } = useLocale();
  const items = useQuery(api.notifications.list); // undefined === loading
  const markAllRead = useMutation(api.notifications.markAllRead);
  const unread = (items ?? []).filter((n) => !n.readAt).length;

  // Mark everything read when the screen is opened (depends on a stable count).
  useEffect(() => {
    if (unread === 0) return;
    let cancelled = false;
    const clearUnread = async () => {
      let hasMore = true;
      while (!cancelled && hasMore) {
        const result = await markAllRead({});
        hasMore = result.hasMore;
      }
    };
    void clearUnread().catch(() => undefined);
    return () => { cancelled = true; };
  }, [unread, markAllRead]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">{t('notifications.title')}</h1>
      {items === undefined ? (
        <p className="text-ink-soft" role="status">…</p>
      ) : items.length === 0 ? (
        <p className="text-ink-soft">{t('notifications.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n._id}><NotificationRow item={n} locale={locale} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
