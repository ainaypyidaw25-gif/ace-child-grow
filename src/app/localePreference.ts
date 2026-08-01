import type { Locale } from '../domain/types';

// The parent's language choice, kept on the device so it survives a reload, an
// app relaunch and being offline. Reading it must never throw: Safari private
// mode and some embedded Android webviews reject localStorage outright, and a
// language preference is never worth breaking the app over.

const LOCALE_KEY = 'ace-locale';

function isLocale(value: unknown): value is Locale {
  return value === 'mm' || value === 'en';
}

/** The language to show a parent who has never chosen one. */
export function defaultLocale(): Locale {
  const configured = import.meta.env.VITE_DEFAULT_LOCALE;
  return isLocale(configured) ? configured : 'mm'; // Myanmar default
}

/** The saved choice, or null when this device has never been given one. */
export function getStoredLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    return isLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Storage unavailable — the choice still applies for this session.
  }
}

/** The language to start in: the saved choice, else the configured default. */
export function initialLocale(): Locale {
  return getStoredLocale() ?? defaultLocale();
}
