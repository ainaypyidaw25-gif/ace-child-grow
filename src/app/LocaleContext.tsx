import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '../domain/types';
import { makeTranslator, type TranslationKey } from '../i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('mm'); // Myanmar default
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: makeTranslator(locale) }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
