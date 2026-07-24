# ADR 0001 — Stack & Backend Selection

**Status:** Accepted · **Date:** 2026-07-24 · **Owner:** Engineering

## Context

ACE Child Grow is a safety-sensitive, bilingual, offline-aware parent-education
platform holding private child records. Non-negotiables: server-side
authorization, private-by-default child data, deterministic (non-AI) safety
logic, bilingual content with clinical review workflow, PWA offline support, and
low operational cost/complexity for an MVP.

## Decision

### Frontend — React 18 + TypeScript + Vite + Tailwind, as an installable PWA
- **Vite over Next.js:** the product is a client-heavy, offline-first PWA with a
  managed backend (Supabase) rather than a server-rendering app. Vite gives a
  simpler build, first-class `vite-plugin-pwa` support, and fast tests via
  Vitest. Server-side rendering is not required for the MVP and would add
  operational surface. If SEO-indexed public content pages are later needed,
  they can be added as static exports or a thin Next.js marketing site.
- **Tailwind** with custom design tokens (see `tailwind.config.ts`) for a calm,
  non-clinical, accessible, Myanmar-first UI.

### Backend — Supabase (single managed backend)
Evaluated: **Supabase**, Convex, Firebase.

| Need | Supabase | Convex | Firebase |
|------|----------|--------|----------|
| Server-side authz | ✅ Postgres **RLS** (in-DB) | ✅ function-level | ⚠️ security rules (NoSQL) |
| Relational data model | ✅ native SQL | ⚠️ document | ❌ NoSQL |
| Migrations | ✅ SQL migrations | ✅ | ⚠️ manual |
| Auth | ✅ built-in | ✅ | ✅ |
| Storage | ✅ | ✅ | ✅ |
| Preview envs | ✅ branches | ✅ | ⚠️ |
| Cost control | ✅ predictable | ✅ | ⚠️ usage spikes |

**Chosen: Supabase.** The data model is strongly relational (children →
sessions → responses; content with review workflow) and benefits from foreign
keys, constraints, and **Row Level Security**, which lets us enforce
"parents see only their own child data" *in the database* — the strongest place
to guarantee the P0 rule that no child record is ever visible to another
account. A single backend avoids the dual-backend complexity the spec warns
against.

## Security implications
- Authorization is enforced by RLS policies (`0002_rls_policies.sql`), not the
  client. The client anon key is safe to ship; the service-role key is
  server-only and never bundled.
- Public educational content and private child data are separated at the cache
  layer (service worker caches public content only).

## Migration strategy
Ordered SQL files in `supabase/migrations/`, applied via Supabase CLI. Each is
idempotent where practical (`on conflict do nothing` for seeds).

## Deployment strategy
Vercel for the PWA (preview per branch + production). Supabase hosts DB/auth/
storage with its own preview branches. Env vars injected per environment.

## Rollback strategy
Frontend: redeploy the previous Vercel build (immutable deployments). Database:
forward-only migrations; destructive changes gated behind explicit approval and
a backup. See `docs/deployment/rollback-plan.md`.

## Operational risks
- Toolchain dev-only CVEs (vite/vitest) — resolve via a scheduled toolchain
  upgrade (does not affect the production bundle).
- WHO growth standards require licensed dataset integration + clinical review
  before any percentile is shown (deferred; UI shows a "pending" message).
- Clinical content must not ship as "approved" without reviewer sign-off.

## Alternatives rejected
- **Convex:** excellent DX but document model is a weaker fit for this
  relational, constraint-heavy schema and RLS-style row ownership.
- **Firebase:** NoSQL rules are harder to audit for the strict per-row child
  ownership guarantee this product requires.
- **Dual backend:** explicitly avoided per spec (needless complexity/cost).

---

## ADR 0002 — Backend switched from Supabase to Convex (2026-07-24)

**Status:** Accepted · supersedes the backend choice in ADR 0001.

**Context.** The organization (Hotel ACE Groups) already runs its systems on
Convex (ace-scan, ace-cashbook, hotel-ace-pms, ace-family-health, …). Operational
consistency, shared tooling, and team familiarity outweigh the RLS advantage that
drove the original Supabase choice.

**Decision.** Use **Convex** as the single backend. A dedicated, isolated project
`ace-child-grow` was created (separate from the hotel/finance projects). Auth is
**Convex Auth** (email/password). Deployed to the dev deployment
`uncommon-orca-603`.

**Security model change.** Postgres RLS is replaced by **function-level
authorization**: every query/mutation derives the owner from
`getAuthUserId(ctx)` (the authenticated identity) and filters by `userId`, never
trusting client input. The P0 guarantee ("no child data across accounts") is
enforced in `convex/children.ts`, `convex/parent.ts`, etc. This must be upheld in
every new function by convention (there is no automatic row-level fallback), so
new data functions require an authorization review.

**Consequences.** SQL migrations + RLS policies (`supabase/`) are retired in
favour of `convex/schema.ts`. The client uses `convex/react` hooks. Real-time
sync is built in. The interim `src/lib` Supabase layer was removed.
