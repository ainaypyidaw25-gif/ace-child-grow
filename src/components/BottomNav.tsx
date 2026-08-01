import { NavLink } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { PRIMARY_NAV_ITEMS } from './navigationItems';

export function BottomNav() {
  const { t } = useLocale();
  return (
    // The landmark is labelled for what it is, not for its first item: calling
    // it "Home" made landmark navigation announce the whole nav as a single
    // destination, and disagreed with DesktopNav's "Primary navigation".
    <nav
      aria-label={t('nav.primary')}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur
                 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) => `flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs ${
                isActive ? 'font-semibold text-sky-deep' : 'text-ink-soft'
              }`}
            >
              <span
                aria-hidden
                className="flex h-6 w-8 items-center justify-center rounded-lg bg-mint-soft text-base leading-none"
              >
                {item.symbol}
              </span>
              <span>{t(item.key)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
