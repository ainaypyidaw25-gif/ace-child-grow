import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '../domain/types';
import { makeTranslator, type TranslationKey } from '../i18n';
import { initialLocale, storeLocale } from './localePreference';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** BCP 47 tag for the document language. Myanmar (Burmese) is 'my'. */
export function documentLang(locale: Locale): string {
  return locale === 'mm' ? 'my' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Start from the saved choice: a reload, an app relaunch or an offline start
  // must never drop a parent back to the default language.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  // Keep the document language in step with the UI so assistive technology
  // announces Myanmar and English content in the right voice.
  useEffect(() => {
    document.documentElement.lang = documentLang(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: makeTranslator(locale) }),
    [locale, setLocale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
