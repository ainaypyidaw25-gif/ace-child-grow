// Central localization system. Myanmar is the default; English is secondary.
import { mm, type TranslationKey } from './mm';
import { en } from './en';
import type { Locale } from '../domain/types';

export type { TranslationKey };
export const dictionaries: Record<Locale, Record<TranslationKey, string>> = { mm, en };

/** Returns the set of keys present in every dictionary (for completeness tests). */
export function allKeys(): TranslationKey[] {
  return Object.keys(mm) as TranslationKey[];
}

/** Translate a key for a locale, falling back to Myanmar then the key itself. */
export function translate(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale]?.[key] ?? mm[key] ?? key;
}

export function makeTranslator(locale: Locale) {
  return (key: TranslationKey) => translate(locale, key);
}
