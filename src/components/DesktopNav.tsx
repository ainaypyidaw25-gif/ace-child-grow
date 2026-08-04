import { NavLink, Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { PRIMARY_NAV_ITEMS } from './navigationItems';
import { isGooglePlayBuild } from '../app/platform';

export function DesktopNav() {
  const { t, locale } = useLocale();

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <nav aria-label={t('nav.primary')}>
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

        <nav aria-label={locale === 'mm' ? 'မိသားစုကိရိယာများ' : 'Family tools'}>
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft">
            {locale === 'mm' ? 'မှတ်တမ်းကိရိယာများ' : 'Tools'}
          </p>
          <div className="mt-2 space-y-1">
            <Link to="/health" className="flex min-h-touch items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-soft">✚</span>
              {locale === 'mm' ? 'ကျန်းမာရေးမှတ်တမ်း' : 'Health records'}
            </Link>
            <Link to="/appointments" className="flex min-h-touch items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pastel-yellow/50">⌁</span>
              {locale === 'mm' ? 'ချိန်းဆိုမှုများ' : 'Appointments'}
            </Link>
            <Link to="/report" className="flex min-h-touch items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-soft">▤</span>
              {locale === 'mm' ? 'တိုးတက်မှုအစီရင်ခံစာ' : 'Progress report'}
            </Link>
            <Link to="/weekly-plan" className="flex min-h-touch items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender/30">▦</span>
              {locale === 'mm' ? 'တစ်ပတ်စာအစီအစဉ်' : 'Weekly plan'}
            </Link>
            <Link to="/observations" className="flex min-h-touch items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender/30">✎</span>
              {locale === 'mm' ? 'စောင့်ကြည့်မှတ်တမ်း' : 'Observation journal'}
            </Link>
          </div>
        </nav>

        {!isGooglePlayBuild() && <div className="overflow-hidden rounded-3xl bg-ink p-4 text-white shadow-card">
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
        </div>}
      </div>
    </aside>
  );
}
