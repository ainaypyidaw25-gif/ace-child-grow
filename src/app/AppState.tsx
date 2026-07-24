import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { reducer, initialState, activeChild, type AppState, type Action, type Child } from './childStore';

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeChild: Child | null;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // In-memory only for the foundation build (no backend/auth yet). Real
  // persistence arrives with Supabase auth + authenticated private storage.
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppStateContext.Provider value={{ state, dispatch, activeChild: activeChild(state) }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
