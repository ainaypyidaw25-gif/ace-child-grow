// Pure onboarding/bootstrap routing decision. Kept side-effect-free so the exact
// login → child-loading → route behavior is unit-testable without React/Convex.
//
// The critical rule this encodes: NEVER route to Add Child while state is still
// loading, and route an existing user (who already has a child) straight to Home
// — the app must not re-onboard a returning parent.

export type BootstrapInput = {
  /** Both the parent-profile and children queries have resolved from the server. */
  ready: boolean;
  /** Parent consent has been recorded (server-persisted). */
  consentAccepted: boolean;
  /** The server definitively returned at least one active child for this user. */
  hasChild: boolean;
};

export type BootstrapRoute = 'loading' | 'home' | 'add-child' | 'welcome';

/**
 * Decide where an authenticated user should land.
 *
 * - loading   → queries not resolved yet; show a spinner, never redirect.
 * - home      → an active child exists (returning user) — do NOT re-onboard.
 * - add-child → consent given but no child yet (resume onboarding).
 * - welcome   → brand-new user (no consent, no child) — show the intro.
 */
export function decideRoute(input: BootstrapInput): BootstrapRoute {
  if (!input.ready) return 'loading';
  if (input.hasChild) return 'home';
  if (input.consentAccepted) return 'add-child';
  return 'welcome';
}

export type ChildLike = { nickname: string; birthDate: string };

/**
 * Accidental-duplicate signature: same (case-insensitive, trimmed) nickname AND
 * same birth date as an existing child. Legitimate siblings differ in at least
 * one of those, so this never blocks them — it only warns on a likely repeat.
 */
export function isDuplicateChild(
  existing: ReadonlyArray<ChildLike>,
  nickname: string,
  birthDate: string,
): boolean {
  const key = nickname.trim().toLowerCase();
  if (!key || !birthDate) return false;
  return existing.some(
    (c) => c.nickname.trim().toLowerCase() === key && c.birthDate === birthDate,
  );
}
