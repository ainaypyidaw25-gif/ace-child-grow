// Pure child-state reducer + data-export helpers (no backend yet).
// All logic here is pure and unit-tested. The React context in AppState.tsx wraps it.

export interface Child {
  id: string;
  nickname: string;
  birthDate: string; // ISO yyyy-mm-dd
  sex?: 'female' | 'male' | 'unspecified';
  gestationalWeeks?: number;
  useCorrectedAge: boolean;
  isShared?: boolean;
}

export interface AppState {
  consentAcceptedAt: string | null;
  children: Child[];
  activeChildId: string | null;
}

export const initialState: AppState = {
  consentAcceptedAt: null,
  children: [],
  activeChildId: null,
};

export type Action =
  | { type: 'accept_consent'; at: string }
  | { type: 'add_child'; child: Child }
  | { type: 'edit_child'; child: Child }
  | { type: 'delete_child'; id: string }
  | { type: 'switch_child'; id: string }
  | { type: 'delete_account' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'accept_consent':
      return { ...state, consentAcceptedAt: action.at };

    case 'add_child': {
      const children = [...state.children, action.child];
      return { ...state, children, activeChildId: state.activeChildId ?? action.child.id };
    }

    case 'edit_child':
      return {
        ...state,
        children: state.children.map((c) => (c.id === action.child.id ? action.child : c)),
      };

    case 'delete_child': {
      const children = state.children.filter((c) => c.id !== action.id);
      const activeChildId =
        state.activeChildId === action.id ? (children[0]?.id ?? null) : state.activeChildId;
      return { ...state, children, activeChildId };
    }

    case 'switch_child':
      return state.children.some((c) => c.id === action.id)
        ? { ...state, activeChildId: action.id }
        : state;

    case 'delete_account':
      return { ...initialState };

    default:
      return state;
  }
}

export function activeChild(state: AppState): Child | null {
  return state.children.find((c) => c.id === state.activeChildId) ?? null;
}

/** Data-export payload (parent-controlled). Minimized, no derived clinical data. */
export function exportData(state: AppState): string {
  return JSON.stringify(
    {
      exportedAt: 'client-generated',
      consentAcceptedAt: state.consentAcceptedAt,
      children: state.children,
    },
    null,
    2,
  );
}
