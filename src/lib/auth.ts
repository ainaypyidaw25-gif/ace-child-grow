// Authentication service (Phase 5). Thin, typed wrappers over Supabase Auth.
// Every method fails clearly when the backend is not configured — no silent
// fake-success. Real authorization is enforced by RLS in the database.
import { getSupabase } from './supabase';

export class AuthUnavailableError extends Error {
  constructor() {
    super('Authentication backend is not configured (no Supabase credentials).');
    this.name = 'AuthUnavailableError';
  }
}

function requireClient() {
  const c = getSupabase();
  if (!c) throw new AuthUnavailableError();
  return c;
}

export async function signUp(email: string, password: string) {
  return requireClient().auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return requireClient().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return requireClient().auth.signOut();
}

export async function sendPasswordReset(email: string) {
  return requireClient().auth.resetPasswordForEmail(email);
}

export async function getSession() {
  const c = getSupabase();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session;
}

/** Sign out of all sessions (revokes refresh tokens for the user). */
export async function signOutAllSessions() {
  return requireClient().auth.signOut({ scope: 'global' });
}
