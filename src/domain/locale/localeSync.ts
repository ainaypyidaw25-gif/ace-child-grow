import type { Locale } from '../types';

// Reconciling the language choice between this device and the parent's account.
//
// Two rules, in tension, decide who wins:
//   1. A device that has never been given a choice should follow the account, so
//      a parent who picked English on their phone also gets English after
//      signing in on a tablet.
//   2. A choice made ON this device is what the parent just asked for, so it
//      must survive a reload and be recorded on the account.
//
// Keeping this as a pure function means every branch below is testable without a
// browser, a Convex client, or a signed-in session.

export type LocaleSyncDecision =
  /** Show the account's language on this device (device had no saved choice). */
  | { type: 'adopt'; locale: Locale }
  /** Record this device's language on the account. */
  | { type: 'push'; locale: Locale }
  /** Nothing to do. */
  | { type: 'idle' };

export interface LocaleSyncInput {
  /** True once the signed-in parent profile has resolved. */
  profileLoaded: boolean;
  /** The language stored on the account, null when never recorded. */
  serverLocale: Locale | null;
  /** This device's saved choice, null when the parent has never chosen. */
  storedLocale: Locale | null;
  /** The language the UI is showing right now. */
  activeLocale: Locale;
  /** Whether the one-time reconciliation pass has already run this session. */
  reconciled: boolean;
  /** The last language this device recorded on the account. */
  lastSyncedLocale: Locale | null;
}

export function decideLocaleSync(input: LocaleSyncInput): LocaleSyncDecision {
  // Signed out or still loading: the device preference stands on its own.
  if (!input.profileLoaded) return { type: 'idle' };

  if (!input.reconciled) {
    // Rule 1 — a device with no saved choice follows the account.
    if (input.storedLocale === null && input.serverLocale !== null && input.serverLocale !== input.activeLocale) {
      return { type: 'adopt', locale: input.serverLocale };
    }
    // Rule 2 — otherwise this device's language is authoritative. This also
    // back-fills an account that has no language recorded yet.
    if (input.serverLocale !== input.activeLocale) {
      return { type: 'push', locale: input.activeLocale };
    }
    return { type: 'idle' };
  }

  // After reconciling, ONLY an explicit change on this device writes to the
  // account. Pushing on any difference would make two signed-in devices with
  // different choices overwrite each other indefinitely.
  if (input.lastSyncedLocale !== null && input.activeLocale !== input.lastSyncedLocale) {
    return { type: 'push', locale: input.activeLocale };
  }
  return { type: 'idle' };
}
