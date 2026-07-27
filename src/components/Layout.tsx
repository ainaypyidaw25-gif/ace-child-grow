import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { BottomNav } from './BottomNav';
import { useLocale } from '../app/LocaleContext';
import { useOnlineStatus } from '../app/useOnlineStatus';
import { setPortalMode } from '../app/portalMode';
import { DesktopNav } from './DesktopNav';
import { InAppTour } from './InAppTour';

export function Layout({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  const { locale, setLocale } = useLocale();
  const online = useOnlineStatus();
  const unread = useQuery(api.notifications.unreadCount) ?? 0;
  const staffAccess = useQuery(api.admin.myAccess);
  const location = useLocation();
  const inStaffWorkspace = location.pathname.startsWith('/admin') || location.pathname === '/audit';
  return (
    <div className="app-ambient min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/home" className="flex min-h-touch items-center gap-3" aria-label="ACE Child Grow">
            <span aria-hidden className="brand-sprout"><span /><i /></span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-ink">ACE Child Grow</span>
              <span className="hidden text-[11px] leading-none text-ink-soft sm:block">
                {locale === 'mm' ? 'ကလေးတိုင်း ကြီးထွားနိုင်တယ်' : 'Every child can grow'}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {!online && (
              <span className="hidden rounded-pill bg-pastel-orange px-3 py-1 text-xs text-ink sm:inline">
                {locale === 'mm' ? 'အင်တာနက်မရှိ' : 'Offline'}
              </span>
            )}
            {staffAccess?.isStaff && (
              <Link
                to={inStaffWorkspace ? '/home' : '/admin'}
                onClick={() => setPortalMode(inStaffWorkspace ? 'parent' : 'staff')}
                className="rounded-pill border border-sky/30 bg-white px-3 py-1 text-xs font-semibold text-sky-deep"
              >
                {inStaffWorkspace
                  ? locale === 'mm' ? 'မိဘမြင်ကွင်း' : 'Parent view'
                  : locale === 'mm' ? 'စီမံရန်' : 'Admin'}
              </Link>
            )}
            <Link
              to="/notifications"
              aria-label={locale === 'mm' ? 'အသိပေးချက်များ' : 'Notifications'}
              className="relative flex min-h-touch min-w-touch items-center justify-center rounded-full text-lg leading-none hover:bg-white"
            >
              ♢
              {unread > 0 && (
                <span className="absolute right-0 top-0 rounded-full bg-state-red px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')}
              className="rounded-pill border border-line bg-white px-3 py-1 text-xs font-medium text-ink-soft"
              aria-label="Switch language"
            >
              {locale === 'mm' ? 'EN' : 'မြန်မာ'}
            </button>
          </div>
        </div>
      </header>
      <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${showNav ? 'max-w-7xl lg:flex lg:gap-8' : 'max-w-3xl'}`}>
        {showNav && <DesktopNav />}
        <main className={`min-w-0 flex-1 py-5 sm:py-7 ${showNav ? 'pb-28 lg:pb-12' : 'pb-8'}`}>{children}</main>
      </div>
      {showNav && <InAppTour inStaffWorkspace={inStaffWorkspace} />}
      {showNav && <BottomNav />}
    </div>
  );
}
