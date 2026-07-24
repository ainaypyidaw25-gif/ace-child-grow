# Convex Backend — Setup, Deploy & Verify

Backend: **Convex** (project `ace-child-grow`, dev deployment `uncommon-orca-603`).
Live URL: `https://uncommon-orca-603.convex.cloud`.

## Structure
- `convex/schema.ts` — tables (authTables + children, growthRecords, sleepRecords,
  milestoneSessions, parentProfiles) with `by_user` / `by_child` indexes.
- `convex/auth.ts` / `auth.config.ts` / `http.ts` — Convex Auth (password).
- `convex/children.ts`, `convex/parent.ts` — queries/mutations. **Every function
  derives the owner from `getAuthUserId(ctx)`; clients cannot spoof ownership.**
- `convex/_generated/` — committed so the frontend builds without codegen.

## Environment
Frontend (`.env.local`, gitignored):
```
VITE_CONVEX_URL=https://uncommon-orca-603.convex.cloud
```
Deployment secrets already set on Convex (via `convex env set`, not in Git):
`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`.

## Deploy functions/schema
```bash
export CONVEX_DEPLOY_KEY='dev:uncommon-orca-603|...'   # keep secret; never commit
npx convex deploy -y
```
The deploy key is a secret — it was used once to deploy and can be **revoked** in
the Convex dashboard (Settings → Deploy Keys) at any time.

## Verify
- Reachability + functions: a Node `ConvexHttpClient` query to `parent:me`
  returns `null` when unauthenticated (confirmed).
- Frontend: `npm run build` succeeds with the Convex client bundled.
- Full browser auth/data flow: `E2E_LIVE=1 npm run test:e2e` in an environment
  with WebSocket egress to `*.convex.cloud` (the CI/local browser — see note in
  test-results.md about the build sandbox blocking WSS).

## Going to production
Create a Convex **production** deployment for this project, generate a prod deploy
key, set the same auth env vars + the production `SITE_URL`, point
`VITE_CONVEX_URL` at the prod deployment, and deploy the frontend to Vercel.
Production requires explicit approval.
