import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';

// Email + password authentication. Convex Auth manages the `users` and session
// tables (see authTables in schema.ts). Every data function derives the owner
// from the authenticated identity — never from client input.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
