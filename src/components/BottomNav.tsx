import { NavLink } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import type { TranslationKey } from '../i18n';

const ITEMS: { to: string; key: TranslationKey; icon: string }[] = [
  { to: '/home', key: 'nav.home', icon: '🏠' },
  { to: '/journey', key: 'nav.journey', icon: '🌱' },
  { to: '/activities', key: 'nav.activities', icon: '🧩' },
  { to: '/learn', key: 'nav.learn', icon: '📖' },
  { to: '/profile', key: 'nav.profile', icon: '👤' },
];

export function BottomNav() {
  const { t } = useLocale();
  return (
    <nav
      aria-label={t('nav.home')}
      className="fixed bottom-0 inset-x-0 z-20 border-t border-line bg-white/95 backdrop-blur
                 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs
                 ${isActive ? 'text-sky-deep font-semibold' : 'text-ink-soft'}`
              }
            >
              <span aria-hidden className="text-lg leading-none">{item.icon}</span>
              <span>{t(item.key)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
