# Foundation Build — Assumptions & Decisions Log

**Date:** 2026-07-24

## Engineering assumptions (documented, reasonable defaults)
1. **Backend = Supabase** (single managed backend) — relational schema + RLS is
   the strongest fit for the per-row child-ownership P0 guarantee. See ADR 0001.
2. **Frontend = Vite** (not Next.js) — offline-first PWA with a managed backend
   does not need SSR for the MVP.
3. **Corrected-age cutoff = 24 months** (configurable) — a common clinical
   convention; exposed as a parameter, not hardcoded policy.
4. **Rule thresholds** (yellow 0.2 / orange 0.4 concern ratio; 2 repeated
   concerns → orange) — seeded in `app_settings.result_thresholds`; tunable and
   subject to clinical review before production.
5. **No child image upload in MVP** — per spec, deferred until secure storage,
   consent, deletion and authz are fully implemented.

## Scope delivered this build (verified)
Foundation + safety-critical core: engines with 51 passing tests, full DB schema
+ RLS, design system, Myanmar-first localization, PWA build, working milestone
demo wired to real engines, and the full documentation set.

## Deferred (needs credentials, later phases, or clinical input)
Live Supabase auth/integration + full route surface, PDF generation, WHO growth
integration, full seed catalogue (clinical review), E2E/visual/integration test
suites, and preview/production deployment.

## Blockers recorded
- Supabase project + keys (auth, DB, storage).
- GitHub remote (for push + PR).
- Vercel project (preview/production deploy).
- Qualified clinical reviewer sign-off before any content is published.
