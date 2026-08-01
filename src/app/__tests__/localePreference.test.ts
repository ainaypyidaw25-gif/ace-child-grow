import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultLocale, getStoredLocale, initialLocale, storeLocale } from '../localePreference';

// ACG-I18N-001: the language choice is kept on the device, so a reload or an
// offline app relaunch never drops the parent back to the default.

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('locale preference storage', () => {
  it('returns null before the parent has ever chosen', () => {
    expect(getStoredLocale()).toBeNull();
  });

  it('round-trips a saved choice', () => {
    storeLocale('en');
    expect(getStoredLocale()).toBe('en');
    expect(initialLocale()).toBe('en');
  });

  it('starts in the default language when nothing is saved', () => {
    expect(initialLocale()).toBe(defaultLocale());
  });

  it('ignores a corrupted stored value instead of showing a broken UI', () => {
    localStorage.setItem('ace-locale', 'klingon');
    expect(getStoredLocale()).toBeNull();
    expect(initialLocale()).toBe(defaultLocale());
  });

  it('survives storage being unavailable (private mode / restricted webview)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(() => storeLocale('en')).not.toThrow();
    expect(getStoredLocale()).toBeNull();
    expect(initialLocale()).toBe(defaultLocale());
  });
});
