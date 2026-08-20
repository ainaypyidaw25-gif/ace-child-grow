/**
 * An in-memory stand-in for the Convex client, used by the parent-guide
 * recording harness ONLY.
 *
 * `vite.harness.config.ts` aliases `convex/react` and `@convex-dev/auth/react`
 * to this module, so the harness can mount the REAL `<App />` — real routes,
 * real screens, real Myanmar copy, real result engine — with no deployment
 * behind it. Nothing here is reachable from the application bundle;
 * `src/domain/__tests__/noDevRoutes.test.ts` asserts the app never imports
 * anything under tests/harness.
 *
 * Why not record against the live site instead: signing up would create a real
 * parent account and a real child row in Production. A how-to video is not a
 * reason to write to Production, and a video of an empty account teaches
 * nothing, so the backend is faked and the content is real.
 *
 * WHAT IS REAL HERE
 *   - The library is `convex/seedData.json`, the same source records the app
 *     ships, filtered by `fixtures/publishedSlugs.json`. That fixture preserves
 *     the exact 226-slug production read made before the coordinated duplicate
 *     withdrawal; six retired source slugs are absent from seedData and
 *     therefore cannot render in this harness.
 *   - The publish filter mirrors `isPubliclyReadableStatus` (status ===
 *     'published'), so the harness cannot show a parent something the real
 *     backend would withhold.
 *
 * WHAT IS FAKE
 *   - The signed-in parent, the child, and every write. They live in the
 *     module-level `db` below and vanish on reload.
 */
import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { getFunctionName } from 'convex/server';
import seedRows from '../../convex/seedData.json';
import publishedSlugs from './fixtures/publishedSlugs.json';

type Row = Record<string, unknown>;

const PUBLISHED = new Set<string>(publishedSlugs as string[]);

// Mirrors convex/library.ts:isPubliclyReadableStatus. Kept as its own function
// so the intent is visible: a parent sees published rows and nothing else.
function publiclyReadable(row: Row): boolean {
  return PUBLISHED.has(row.slug as string);
}

// Give every seed row the server-side fields the UI expects to find on a
// document, and the published status the production row carries.
const LIBRARY: Row[] = (seedRows as Row[]).map((row) => ({
  ...row,
  _id: `demo_${row.slug as string}`,
  _creationTime: 0,
  clinicalStatus: PUBLISHED.has(row.slug as string) ? 'published' : (row.clinicalStatus ?? 'clinical_review'),
  reviewRevision: 5,
}));

/* ------------------------------------------------------------------ store */

interface Db {
  signedIn: boolean;
  consentAcceptedAt: number | null;
  children: Array<{
    _id: string;
    userId: string;
    nickname: string;
    birthDate: string;
    sex?: string;
    gestationalWeeks?: number;
    useCorrectedAge: boolean;
  }>;
  growth: Array<{
    _id: string;
    childId: string;
    measuredOn: string;
    weightKg?: number;
    heightCm?: number;
    headCircumferenceCm?: number;
  }>;
  favorites: string[];
}

const db: Db = {
  signedIn: false,
  consentAcceptedAt: null,
  children: [],
  growth: [],
  favorites: [],
};

let version = 0;
const listeners = new Set<() => void>();

function commit(): void {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The snapshot is a plain number, so React's identity check is always stable. */
function useVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

/** Test hook: reset between recordings without reloading the module. */
export function resetDemoDb(): void {
  db.signedIn = false;
  db.consentAcceptedAt = null;
  db.children = [];
  db.growth = [];
  db.favorites = [];
  commit();
}

/* ---------------------------------------------------------------- queries */

interface ListArgs {
  type?: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  q?: string;
}

function listByType(args: ListArgs): { staff: boolean; items: Row[] } {
  let rows = LIBRARY.filter((r) => r.type === args.type);
  if (args.ageGroupKey) rows = rows.filter((r) => r.ageGroupKey === args.ageGroupKey);
  if (args.domainKey) rows = rows.filter((r) => r.domainKey === args.domainKey);
  if (args.category) rows = rows.filter((r) => r.category === args.category);
  rows = rows.filter(publiclyReadable);
  if (args.q) {
    const needle = args.q.toLowerCase();
    rows = rows.filter((r) => String(r.searchText ?? '').includes(needle));
  }
  rows = [...rows].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  return { staff: false, items: rows };
}

const FREE_SUBSCRIPTION = {
  planKey: 'free',
  status: 'active',
  features: [] as string[],
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  isTrial: false,
  trialEligible: true,
  daysRemaining: null,
  inheritedFamilyAccess: false,
  testingAccess: false,
};

// Queries the parent surface actually calls. Anything not listed resolves to
// null rather than staying `undefined`, so no screen can hang on a skeleton
// forever — a spinner held for the length of a video would look like a bug in
// the app rather than a gap in the harness.
function runQuery(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case 'parent:me':
      return db.signedIn
        ? {
            userId: 'demo_parent',
            email: 'demo@example.com',
            consentAcceptedAt: db.consentAcceptedAt,
            isStaff: false,
            staffRole: null,
            parentTourCompletedVersion: 99,
            staffTourCompletedVersion: 0,
          }
        : null;
    case 'children:list':
      return db.signedIn ? db.children : [];
    case 'admin:myAccess':
      return { isStaff: false, role: null, qualification: null, displayName: null };
    case 'subscriptions:mine':
      return FREE_SUBSCRIPTION;
    case 'referrals:mine':
      return { code: null, referredCount: 0, referredBy: null };
    case 'library:listByType':
      return listByType(args as ListArgs);
    case 'library:publicationManifest':
      return {
        complete: true,
        slugs: LIBRARY.filter(publiclyReadable).map((row) => String(row.slug)).sort(),
      };
    case 'library:getBySlug': {
      const item = LIBRARY.find((r) => r.slug === args.slug);
      if (!item) return null;
      if (!publiclyReadable(item)) return { restricted: true };
      return { item, media: [], staff: false };
    }
    case 'growth:list':
      return db.growth.filter((g) => g.childId === args.childId);
    case 'favorites:list':
      return db.favorites;
    case 'milestones:latestResult':
      return null;
    default:
      return null;
  }
}

/* -------------------------------------------------------------- mutations */

let nextId = 1;

function runMutation(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case 'parent:acceptConsent':
      db.consentAcceptedAt = Date.parse('2026-07-31T00:00:00Z');
      commit();
      return null;
    case 'children:add': {
      const id = `demo_child_${nextId++}`;
      db.children = [
        ...db.children,
        {
          _id: id,
          userId: 'demo_parent',
          nickname: String(args.nickname ?? ''),
          birthDate: String(args.birthDate ?? ''),
          sex: args.sex as string | undefined,
          gestationalWeeks: args.gestationalWeeks as number | undefined,
          useCorrectedAge: Boolean(args.useCorrectedAge),
        },
      ];
      commit();
      return id;
    }
    case 'children:update':
      db.children = db.children.map((c) =>
        c._id === args.id ? { ...c, ...(args as object), _id: c._id } : c,
      );
      commit();
      return null;
    case 'children:remove':
      db.children = db.children.filter((c) => c._id !== args.id);
      commit();
      return null;
    case 'growth:add':
      db.growth = [
        ...db.growth,
        {
          _id: `demo_growth_${nextId++}`,
          childId: String(args.childId ?? ''),
          measuredOn: String(args.measuredOn ?? ''),
          weightKg: args.weightKg as number | undefined,
          heightCm: args.heightCm as number | undefined,
          headCircumferenceCm: args.headCircumferenceCm as number | undefined,
        },
      ].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
      commit();
      return null;
    case 'favorites:toggle': {
      const key = String(args.activityKey ?? '');
      db.favorites = db.favorites.includes(key)
        ? db.favorites.filter((k) => k !== key)
        : [...db.favorites, key];
      commit();
      return null;
    }
    default:
      // Everything else (referral claims, family invites, telemetry) is a
      // no-op: it has no visible consequence in the walkthrough.
      return null;
  }
}

/* --------------------------------------------------- convex/react surface */

type FnRef = Parameters<typeof getFunctionName>[0];

export function useQuery(ref: FnRef, args?: Record<string, unknown>): unknown {
  const name = getFunctionName(ref);
  const key = JSON.stringify(args ?? {});
  const v = useVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => runQuery(name, args ?? {}), [name, key, v]);
}

export function useMutation(ref: FnRef): (args?: Record<string, unknown>) => Promise<unknown> {
  const name = getFunctionName(ref);
  return useMemo(
    () => (args?: Record<string, unknown>) => Promise.resolve(runMutation(name, args ?? {})),
    [name],
  );
}

export const useAction = useMutation;

export function Authenticated({ children }: { children: ReactNode }) {
  useVersion(); // re-render when sign-in flips
  return db.signedIn ? <>{children}</> : null;
}

export function Unauthenticated({ children }: { children: ReactNode }) {
  useVersion();
  return db.signedIn ? null : <>{children}</>;
}

// The harness has no token to exchange, so authentication is never "in flight".
export function AuthLoading({ children }: { children: ReactNode }) {
  void children;
  return null;
}

export function useConvexAuth(): { isLoading: boolean; isAuthenticated: boolean } {
  useVersion();
  return { isLoading: false, isAuthenticated: db.signedIn };
}

/** Stands in for the real client object; the harness never dials anything. */
export class ConvexReactClient {
  constructor(public readonly address: string) {}
  setAuth(): void {}
  clearAuth(): void {}
  close(): Promise<void> {
    return Promise.resolve();
  }
}

/* ------------------------------------------ @convex-dev/auth/react surface */

export function ConvexAuthProvider({ children }: { children: ReactNode; client?: unknown }) {
  return <>{children}</>;
}

export function useAuthActions() {
  return useMemo(
    () => ({
      // Credentials are ignored on purpose: there is no account to check them
      // against, and the walkthrough needs the form to behave as it does for a
      // parent whose details are correct.
      signIn: (provider: string, args?: unknown) => {
        void provider;
        void args;
        db.signedIn = true;
        commit();
        return Promise.resolve({ signingIn: true });
      },
      signOut: () => {
        resetDemoDb();
        return Promise.resolve();
      },
    }),
    [],
  );
}
