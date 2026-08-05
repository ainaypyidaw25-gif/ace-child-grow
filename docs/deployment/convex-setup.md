# Convex Backend — Setup, Deploy & Verify

Backend: **Convex** (project `ace-child-grow`).

- **Development deployment:** `uncommon-orca-603` — `https://uncommon-orca-603.convex.cloud`
- **Production deployment:** `graceful-possum-566` — `https://graceful-possum-566.convex.cloud` (this is what `.env.production`'s `VITE_CONVEX_URL` actually points at, and what the live app at [child.acegroup.com.mm](https://child.acegroup.com.mm) uses)

## Structure
- `convex/schema.ts` — all tables (authTables + children, growthRecords, sleepRecords,
  milestoneSessions, parentProfiles, observations, appointments, healthRecords,
  subscriptions, paymentRequests, mmpayTransactions/mmpayWebhookEvents, libraryContent,
  and more) with `by_user` / `by_child` indexes throughout.
- `convex/auth.ts` / `auth.config.ts` / `http.ts` — Convex Auth (email/password + Google OAuth + Resend-backed recovery email).
- `convex/*.ts` — one module per domain (children, growth, sleep, milestones,
  billing, mmpay, library, etc). **Every query/mutation derives the owner from
  `getAuthUserId(ctx)` (via the shared `requireUser`/`ownChild` helpers in
  `convex/lib/auth.ts`); clients cannot spoof ownership.**
- `convex/_generated/` — committed so the frontend builds without running codegen.

## Environment

Frontend (`.env.local` for dev, gitignored; `.env.production` for the shipped build, committed with non-secret values only):
```
VITE_CONVEX_URL=https://uncommon-orca-603.convex.cloud   # dev
VITE_CONVEX_URL=https://graceful-possum-566.convex.cloud # production
```

Deployment secrets are set **per-deployment** via `npx convex env set` (or the
Convex dashboard → Settings → Environment Variables), never in Git. See
`environment-variables.md` for the full list — at minimum: `JWT_PRIVATE_KEY`,
`JWKS`, `SITE_URL`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_RESEND_KEY`/`AUTH_EMAIL_FROM`,
`APP_ACCESS_MODE`, and the `MMPAY_*` payment credentials.

**`SITE_URL` must match the real domain parents use to sign in.** On the
production deployment this is `https://child.acegroup.com.mm` — not the
`ace-child-grow.vercel.app` Vercel alias. Google sign-in fails with a server
error from any origin `SITE_URL` doesn't recognize; email/password sign-in is
unaffected since it doesn't depend on OAuth origin matching.

## Deploy functions/schema

```bash
export CONVEX_DEPLOY_KEY='prod:graceful-possum-566|...'   # keep secret; never commit; rotate after heavy reuse
npx convex deploy --yes
```

The deploy key is a secret scoped to one deployment — it can be **revoked and
regenerated** in the Convex dashboard (Settings → Deploy Keys) at any time,
and should be rotated if it's been reused many times in one session/chat
history.

## Verify

- Reachability + functions: a Node `ConvexHttpClient` query to an
  unauthenticated function (e.g. `subscriptions.mine`) returns the expected
  signed-out shape.
- Frontend: `npm run build` succeeds with the Convex client bundled.
- After every deploy: check the CLI output for `No indexes are deleted by
  this push` — an unexpected index deletion is a sign the schema push did
  something wider than intended.
- Full browser auth/data flow needs a real browser with WebSocket egress to
  `*.convex.cloud` — this repo's sandboxed test environment cannot exercise
  it; confirm manually against the actual deployed URL after a release.

## Going to production

Done — `graceful-possum-566` is the live production deployment, wired to
`VITE_CONVEX_URL` in `.env.production` and to the `child.acegroup.com.mm` /
`ace-child-grow.vercel.app` Vercel deployments (both aliases point at the
same build; only `child.acegroup.com.mm` matches `SITE_URL` for Google
sign-in). To deploy a change: merge to `main`, then run the `Deploy
functions/schema` command above against the production deploy key — Vercel
auto-deploys the frontend on merge, but Convex functions/schema require this
explicit step.

## Granting Admin (staff) access

Content-workflow transitions are staff-only. To make a signed-in user staff
(e.g. to try the Admin CMS), set `isStaff: true` (or a specific `staffRole`)
on their `parentProfiles` row in the Convex dashboard (Data → parentProfiles),
or via the CLI. In production a super admin performs this. Non-staff users
see the Admin queue read-only where applicable, or are denied entirely
depending on the route's `StaffOnlyRoute` guard.
