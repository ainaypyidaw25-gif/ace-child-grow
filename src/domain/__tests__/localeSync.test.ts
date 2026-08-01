import { describe, expect, it } from 'vitest';
import { decideLocaleSync, type LocaleSyncInput } from '../locale/localeSync';

// ACG-I18N-001: the parent's language choice must survive a reload and reach a
// second signed-in device, without two devices overwriting each other.

const base: LocaleSyncInput = {
  profileLoaded: true,
  serverLocale: null,
  storedLocale: null,
  activeLocale: 'mm',
  reconciled: false,
  lastSyncedLocale: null,
};

describe('decideLocaleSync', () => {
  it('does nothing while signed out or still loading', () => {
    expect(decideLocaleSync({ ...base, profileLoaded: false, serverLocale: 'en' }))
      .toEqual({ type: 'idle' });
  });

  it('adopts the account language on a device that has never chosen one', () => {
    expect(decideLocaleSync({ ...base, serverLocale: 'en', storedLocale: null, activeLocale: 'mm' }))
      .toEqual({ type: 'adopt', locale: 'en' });
  });

  it('keeps this device\'s saved choice and records it on the account', () => {
    expect(decideLocaleSync({ ...base, serverLocale: 'mm', storedLocale: 'en', activeLocale: 'en' }))
      .toEqual({ type: 'push', locale: 'en' });
  });

  it('back-fills an account that has no language recorded yet', () => {
    expect(decideLocaleSync({ ...base, serverLocale: null, activeLocale: 'mm' }))
      .toEqual({ type: 'push', locale: 'mm' });
  });

  it('does nothing when device and account already agree', () => {
    expect(decideLocaleSync({ ...base, serverLocale: 'mm', storedLocale: 'mm', activeLocale: 'mm' }))
      .toEqual({ type: 'idle' });
  });

  it('records a change the parent makes after reconciling', () => {
    expect(decideLocaleSync({
      ...base, reconciled: true, lastSyncedLocale: 'mm', activeLocale: 'en', serverLocale: 'mm',
    })).toEqual({ type: 'push', locale: 'en' });
  });

  it('does NOT fight another device that changed the account language', () => {
    // Account flipped to 'en' elsewhere; this device made no change of its own.
    expect(decideLocaleSync({
      ...base, reconciled: true, lastSyncedLocale: 'mm', activeLocale: 'mm', serverLocale: 'en',
    })).toEqual({ type: 'idle' });
  });

  it('reconciles only once — a settled session stays idle', () => {
    expect(decideLocaleSync({
      ...base, reconciled: true, lastSyncedLocale: 'en', activeLocale: 'en', serverLocale: 'en',
    })).toEqual({ type: 'idle' });
  });
});
