import { NavLink, Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { PRIMARY_NAV_ITEMS } from './navigationItems';

export function DesktopNav() {
  const { t, locale } = useLocale();

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <nav aria-label={locale === 'mm' ? 'အဓိကစာမျက်နှာများ' : 'Primary navigation'}>
          <ul className="space-y-1.5">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex min-h-touch items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-sky-deep shadow-card'
                        : 'text-ink-soft hover:bg-white/70 hover:text-ink'
                    }`
                  }
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-soft text-base text-sky-deep">
                    {item.symbol}
                  </span>
                  <span>{t(item.key)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="overflow-hidden rounded-3xl bg-ink p-4 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">
            ACE Premium
          </p>
          <p className="mt-2 text-sm leading-7 text-white/80">
            {locale === 'mm'
              ? 'ကလေးအသက်အလိုက် အစီအစဉ်နှင့် လစဉ်အစီရင်ခံစာများ'
              : 'Age-based plans and monthly progress reports'}
          </p>
          <Link
            to="/subscription"
            className="mt-3 inline-flex min-h-touch items-center text-sm font-semibold text-mint"
          >
            {locale === 'mm' ? 'အစီအစဉ်များကြည့်ရန်' : 'View plans'} →
          </Link>
        </div>
      </div>
    </aside>
  );
}
