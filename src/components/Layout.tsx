import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { BottomNav } from './BottomNav';
import { useLocale } from '../app/LocaleContext';
import { useOnlineStatus } from '../app/useOnlineStatus';

export function Layout({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  const { locale, setLocale } = useLocale();
  const online = useOnlineStatus();
  const unread = useQuery(api.notifications.unreadCount) ?? 0;
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line
                         bg-cream/90 px-4 py-3 backdrop-blur">
        <span className="flex items-center gap-2 font-semibold text-sky-deep">
          ACE Child Grow
          {!online && (
            <span className="rounded-pill bg-pastel-orange px-2 py-0.5 text-xs font-normal text-ink">
              {locale === 'mm' ? 'အွန်လိုင်းမဟုတ်' : 'Offline'}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Link to="/notifications" aria-label="Notifications" className="relative min-h-touch min-w-touch text-xl leading-none flex items-center justify-center">
            🔔
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-state-red px-1.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')}
            className="rounded-pill border border-line bg-white px-3 py-1 text-sm text-ink-soft"
            aria-label="Switch language"
          >
            {locale === 'mm' ? 'EN' : 'မြန်မာ'}
          </button>
        </div>
      </header>
      <main className={`mx-auto max-w-lg px-4 py-5 ${showNav ? 'pb-28' : 'pb-8'}`}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
