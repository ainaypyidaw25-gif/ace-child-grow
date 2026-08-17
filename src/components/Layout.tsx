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
import { isAppleAppStoreBuild } from '../app/platform';

export function Layout({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  const { locale, setLocale } = useLocale();
  const online = useOnlineStatus();
  const unread = useQuery(api.notifications.unreadCount) ?? 0;
  const staffAccess = useQuery(api.admin.myAccess);
  const location = useLocation();
  const inStaffWorkspace = location.pathname.startsWith('/admin') || location.pathname === '/audit';
  // Staff screens have their own task navigation inside the workspace. Keeping
  // the parent app's side/bottom navigation visible here crowds small screens
  // and makes the five parent destinations look like reviewer actions.
  const showPrimaryNav = showNav && !inStaffWorkspace;
  return (
    <div className="app-ambient min-h-screen bg-canvas">
      {/* index.html sets viewport-fit=cover, so the header must clear the status
          bar itself: without these insets it renders under the iOS notch /
          Dynamic Island and Android display cutouts in installed (standalone)
          mode, losing tap area on the language and notification controls. The
          side insets do the same for landscape. */}
      <header data-testid="app-header" className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur-xl pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-1 px-2 min-[360px]:px-3 sm:h-16 sm:gap-2 sm:px-6 lg:px-8">
          <Link to="/home" className="flex min-h-touch min-w-0 items-center gap-2 sm:gap-3" aria-label="ACE Child Grow">
            <span aria-hidden className="brand-sprout"><span /><i /></span>
            <span className={inStaffWorkspace ? 'hidden sm:block' : 'hidden min-[350px]:block'}>
              <span className="block whitespace-nowrap text-[13px] font-bold tracking-tight text-ink sm:text-sm">ACE Child Grow</span>
              <span className="hidden text-[11px] leading-none text-ink-soft sm:block">
                {locale === 'mm' ? 'ကလေးတိုင်း ကြီးထွားနိုင်တယ်' : 'Every child can grow'}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-0.5 min-[360px]:gap-1 sm:gap-2">
            {!online && (
              <span className="hidden rounded-pill bg-pastel-orange px-3 py-1 text-xs text-ink sm:inline">
                {locale === 'mm' ? 'အင်တာနက်မရှိ' : 'Offline'}
              </span>
            )}
            {!isAppleAppStoreBuild() && staffAccess?.isStaff && (
              <Link
                to={inStaffWorkspace ? '/home' : '/admin'}
                onClick={() => setPortalMode(inStaffWorkspace ? 'parent' : 'staff')}
                className="whitespace-nowrap rounded-pill border border-sky/30 bg-white px-2 py-1 text-[11px] font-semibold text-sky-deep min-[360px]:px-2.5 min-[360px]:text-xs sm:px-3"
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
              className="rounded-pill border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-soft sm:px-3"
              aria-label="Switch language"
            >
              {locale === 'mm' ? 'EN' : 'မြန်မာ'}
            </button>
          </div>
        </div>
      </header>
      <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${showNav ? 'max-w-7xl' : 'max-w-3xl'} ${showPrimaryNav ? 'lg:flex lg:gap-8' : ''}`}>
        {showPrimaryNav && <DesktopNav />}
        <main
          data-testid="app-main"
          className={`min-w-0 flex-1 py-5 sm:py-7 ${showPrimaryNav ? 'pb-28 lg:pb-12' : 'pb-8'}`}
          style={!showPrimaryNav ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' } : undefined}
        >
          {children}
        </main>
      </div>
      {showNav && <InAppTour inStaffWorkspace={inStaffWorkspace} />}
      {showPrimaryNav && <BottomNav />}
    </div>
  );
}
