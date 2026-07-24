import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { useLocale } from '../app/LocaleContext';

export function Layout({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line
                         bg-cream/90 px-4 py-3 backdrop-blur">
        <span className="font-semibold text-sky-deep">ACE Child Grow</span>
        <button
          type="button"
          onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')}
          className="rounded-pill border border-line bg-white px-3 py-1 text-sm text-ink-soft"
          aria-label="Switch language"
        >
          {locale === 'mm' ? 'EN' : 'မြန်မာ'}
        </button>
      </header>
      <main className={`mx-auto max-w-lg px-4 py-5 ${showNav ? 'pb-28' : 'pb-8'}`}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
