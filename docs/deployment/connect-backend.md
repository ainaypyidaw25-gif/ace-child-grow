# Connecting the Backend (Supabase) & Deploying

The app ships a complete Supabase integration layer (`src/lib/`) that activates
automatically once credentials are present. Until then it runs in **demo mode**
(in-memory, clearly labelled in Profile). No fake backend is ever fabricated.

## What is needed (the actual credentials)
1. A Supabase project → `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (server-only: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`).
2. A GitHub remote (for push + PR) — a token or the GitHub connector.
3. A Vercel project (for preview/production) — the Vercel connector is already
   available in this workspace.

## Step 1 — Supabase
1. Create a project at supabase.com (or connect the Supabase connector in claude.ai).
2. Apply migrations in order (SQL editor or `supabase db push`):
   `0001_core_schema.sql` → `0002_rls_policies.sql` → `0003_seed_reference.sql`.
3. Confirm RLS is enabled on every table (set by `0002`).
4. Put the URL + anon key in `.env.local` (see `.env.example`).

## Step 2 — verify the wiring
`isSupabaseConfigured()` flips to true; `src/lib/auth.ts` (sign up/in/out, reset,
sign-out-all) and `src/lib/repository.ts` (children, growth — RLS-scoped) become
live. Add integration tests that assert a second account **cannot** read another
parent's child rows (the top P0).

## Step 3 — deploy
- **Preview:** deploy the built app to Vercel (connector available). Set the env
  vars in the Vercel project. Preview deploys are automatic per branch.
- **Production:** requires explicit human approval (and clinical-review sign-off
  before any content is published). See deployment-guide.md and rollback-plan.md.

## Security reminders
Only `VITE_`-prefixed vars reach the client. The service-role key and DB URL are
server-only (Edge Functions / migrations) and must never be bundled, logged, or
committed.
