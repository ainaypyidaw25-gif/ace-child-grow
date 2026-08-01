import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
import type { AppState, Action, Child } from './childStore';
import { captureReferralFromSearch, clearPendingReferralCode, pendingReferralCode } from '../domain/referrals/referralCapture';
import { decideLocaleSync } from '../domain/locale/localeSync';
import { getStoredLocale } from './localePreference';
import { useLocale } from './LocaleContext';
import type { Locale } from '../domain/types';

interface AppStateContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  activeChild: Child | null;
  /** True once BOTH the parent-profile and children queries have resolved. */
  ready: boolean;
  /** True only when loaded AND the server returned at least one active child. */
  hasChild: boolean;
  /** Awaitable child creation (resolves after the mutation commits). */
  addChildAsync: (child: Omit<Child, 'id'>) => Promise<void>;
  /** Awaitable child update. */
  updateChildAsync: (child: Child) => Promise<void>;
  /** Awaitable consent acceptance (resolves after the mutation commits). */
  acceptConsentAsync: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

// Convex-backed application state. Children and consent are persisted server-side
// and scoped to the authenticated parent (ownership enforced in Convex functions).
// The active-child selection is local UI state.
export function AppStateProvider({ children }: { children: ReactNode }) {
  const rows = useQuery(api.children.list);
  const me = useQuery(api.parent.me);
  const addChild = useMutation(api.children.add);
  const updateChild = useMutation(api.children.update);
  const removeChild = useMutation(api.children.remove);
  const acceptConsent = useMutation(api.parent.acceptConsent);
  const ensureFreeSubscription = useMutation(api.subscriptions.ensureFree);
  const acceptFamilyInvites = useMutation(api.family.acceptPendingInvites);
  const claimReferral = useMutation(api.referrals.claim);
  const setPreferredLocale = useMutation(api.parent.setPreferredLocale);
  const { signOut } = useAuthActions();
  const { locale, setLocale } = useLocale();

  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const referralCaptureAttempted = useRef(false);
  /** The one-time language reconciliation pass has run for this session. */
  const localeReconciled = useRef(false);
  /** The last language this device recorded on the account. */
  const lastSyncedLocale = useRef<Locale | null>(null);

  useEffect(() => {
    if (me) {
      void ensureFreeSubscription({});
      if (me.email) void acceptFamilyInvites({});
      try {
        if (!referralCaptureAttempted.current) {
          captureReferralFromSearch(window.location.search, window.localStorage);
          referralCaptureAttempted.current = true;
        }
        const code = pendingReferralCode(window.localStorage);
        if (code) {
          void claimReferral({ code }).then(() => {
            clearPendingReferralCode(window.localStorage);
          }).catch(() => {
            // Keep the code so a temporary network error can be retried later.
          });
        }
      } catch {
        // Referral attribution remains available from the Profile screen.
      }
    }
  }, [acceptFamilyInvites, claimReferral, ensureFreeSubscription, me]);

  // Loading discipline: `rows`/`me` are `undefined` while their queries are in
  // flight. We must NOT collapse "loading" into "empty" — the route guard keys
  // off `ready` so it never redirects to Add Child mid-load.
  const childrenLoaded = rows !== undefined;
  const profileLoaded = me !== undefined;
  const ready = childrenLoaded && profileLoaded;

  // Reconcile the language between this device and the account. The device
  // choice already survives reloads on its own (localePreference); this is what
  // carries it to a second signed-in device. Decision logic is pure and tested
  // in src/domain/locale/localeSync.ts.
  useEffect(() => {
    const decision = decideLocaleSync({
      profileLoaded: me != null,
      serverLocale: me?.preferredLocale ?? null,
      storedLocale: getStoredLocale(),
      activeLocale: locale,
      reconciled: localeReconciled.current,
      lastSyncedLocale: lastSyncedLocale.current,
    });
    if (me != null) localeReconciled.current = true;
    if (decision.type === 'idle') {
      if (me != null) lastSyncedLocale.current = lastSyncedLocale.current ?? locale;
      return;
    }
    lastSyncedLocale.current = decision.locale;
    if (decision.type === 'adopt') {
      setLocale(decision.locale);
      return;
    }
    void setPreferredLocale({ locale: decision.locale }).catch(() => {
      // Offline or a transient failure: the choice still stands on this device
      // and is retried the next time the parent changes it.
    });
  }, [me, locale, setLocale, setPreferredLocale]);

  const list: Child[] = useMemo(
    () =>
      (rows ?? []).map((c) => ({
        id: c._id,
        nickname: c.nickname,
        birthDate: c.birthDate,
        sex: c.sex ?? undefined,
        gestationalWeeks: c.gestationalWeeks ?? undefined,
        useCorrectedAge: c.useCorrectedAge,
        isShared: Boolean(me?.userId && c.userId !== me.userId),
      })),
    [me?.userId, rows],
  );

  // Keep an active child selected as the list loads/changes.
  useEffect(() => {
    if (list.length === 0) {
      if (activeChildId !== null) setActiveChildId(null);
    } else if (!activeChildId || !list.some((c) => c.id === activeChildId)) {
      setActiveChildId(list[0].id);
    }
  }, [list, activeChildId]);

  const consentAcceptedAt = me?.consentAcceptedAt
    ? new Date(me.consentAcceptedAt).toISOString()
    : null;
  const state: AppState = useMemo(
    () => ({ consentAcceptedAt, children: list, activeChildId }),
    [consentAcceptedAt, list, activeChildId],
  );

  function dispatch(action: Action) {
    switch (action.type) {
      case 'accept_consent':
        void acceptConsent({});
        break;
      case 'add_child':
        void addChild({
          nickname: action.child.nickname,
          birthDate: action.child.birthDate,
          sex: action.child.sex,
          gestationalWeeks: action.child.gestationalWeeks,
          useCorrectedAge: action.child.useCorrectedAge,
        });
        break;
      case 'edit_child':
        void updateChild({
          id: action.child.id as never,
          nickname: action.child.nickname,
          birthDate: action.child.birthDate,
          gestationalWeeks: action.child.gestationalWeeks,
          useCorrectedAge: action.child.useCorrectedAge,
        });
        break;
      case 'delete_child':
        void removeChild({ id: action.id as never });
        break;
      case 'switch_child':
        setActiveChildId(action.id);
        break;
      case 'delete_account':
        void signOut();
        break;
    }
  }

  // Awaitable add-child: resolves after the mutation commits, so callers can
  // disable their submit button and navigate only on success (no double-create,
  // no navigate-before-persist race).
  async function addChildAsync(child: Omit<Child, 'id'>): Promise<void> {
    await addChild({
      nickname: child.nickname,
      birthDate: child.birthDate,
      sex: child.sex,
      gestationalWeeks: child.gestationalWeeks,
      useCorrectedAge: child.useCorrectedAge,
    });
  }

  async function updateChildAsync(child: Child): Promise<void> {
    await updateChild({
      id: child.id as never,
      nickname: child.nickname,
      birthDate: child.birthDate,
      gestationalWeeks: child.gestationalWeeks,
      useCorrectedAge: child.useCorrectedAge,
    });
  }

  async function acceptConsentAsync(): Promise<void> {
    await acceptConsent({});
  }

  const activeChild = list.find((c) => c.id === activeChildId) ?? null;
  const hasChild = childrenLoaded && list.length > 0;

  const value = useMemo(
    () => ({ state, dispatch, activeChild, ready, hasChild, addChildAsync, updateChildAsync, acceptConsentAsync }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, activeChild, ready, hasChild],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
