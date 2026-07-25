import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
import type { AppState, Action, Child } from './childStore';

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
  const { signOut } = useAuthActions();

  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  // Loading discipline: `rows`/`me` are `undefined` while their queries are in
  // flight. We must NOT collapse "loading" into "empty" — the route guard keys
  // off `ready` so it never redirects to Add Child mid-load.
  const childrenLoaded = rows !== undefined;
  const profileLoaded = me !== undefined;
  const ready = childrenLoaded && profileLoaded;

  const list: Child[] = useMemo(
    () =>
      (rows ?? []).map((c) => ({
        id: c._id,
        nickname: c.nickname,
        birthDate: c.birthDate,
        sex: c.sex ?? undefined,
        gestationalWeeks: c.gestationalWeeks ?? undefined,
        useCorrectedAge: c.useCorrectedAge,
      })),
    [rows],
  );

  // Keep an active child selected as the list loads/changes.
  useEffect(() => {
    if (list.length === 0) {
      if (activeChildId !== null) setActiveChildId(null);
    } else if (!activeChildId || !list.some((c) => c.id === activeChildId)) {
      setActiveChildId(list[0].id);
    }
  }, [list, activeChildId]);

  const state: AppState = {
    consentAcceptedAt: me?.consentAcceptedAt ? new Date(me.consentAcceptedAt).toISOString() : null,
    children: list,
    activeChildId,
  };

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

  const activeChild = list.find((c) => c.id === activeChildId) ?? null;
  const hasChild = childrenLoaded && list.length > 0;

  return (
    <AppStateContext.Provider value={{ state, dispatch, activeChild, ready, hasChild, addChildAsync }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
