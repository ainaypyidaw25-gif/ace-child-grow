# Deployment Guide

## Environments
`development` (local) → `preview` (per-branch) → `production` (approval-gated).

## Frontend (Vercel)
1. Import the repo; framework preset **Vite**.
2. Build command `npm run build`, output `dist/`.
3. Set env vars per environment (see environment-variables.md).
4. Each branch push creates an immutable **preview** deployment.
5. **Production deploy and `main` merge require explicit human approval.**

## Backend (Convex)
1. Select the target Convex deployment (dev `uncommon-orca-603` or production
   `graceful-possum-566` — see `convex-setup.md`).
2. Deploy schema/functions: `CONVEX_DEPLOY_KEY='...' npx convex deploy --yes`.
   Every table already carries `by_user`/`by_child` indexes and every
   query/mutation derives ownership from `getAuthUserId(ctx)` — there is no
   separate row-level-security step to configure.
3. Set Convex Auth env vars on that deployment (`SITE_URL`, `JWT_PRIVATE_KEY`,
   `JWKS`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_RESEND_KEY`/
   `AUTH_EMAIL_FROM`) and the `MMPAY_*` payment credentials — see
   `environment-variables.md`.
4. Confirm `SITE_URL` matches the real domain the frontend is served from
   (production: `child.acegroup.com.mm`) — a mismatch silently breaks Google
   sign-in.

## Pre-deploy validation checklist
Env vars present · Convex schema/functions deployed · `SITE_URL` matches the
real serving domain · auth callbacks configured (Google OAuth redirect URI,
Resend sender domain) · CORS/CSP set · PWA manifest + service worker served ·
error monitoring wired · rollback plan confirmed (rollback-plan.md).

## Before requesting production approval, provide
Preview URL · commit hash · Convex deploy confirmation (index deletion count) ·
test report · known limitations · clinical-review status · rollback plan.

## Current status
**Live in production.** Frontend: Vercel, auto-deployed from `main`, served at
[child.acegroup.com.mm](https://child.acegroup.com.mm) (also reachable at the
`ace-child-grow.vercel.app` alias, though Google sign-in only works from the
custom domain — see the `SITE_URL` note above). Backend: Convex production
deployment `graceful-possum-566`, deployed manually after each merge via the
command in `convex-setup.md` (not yet wired into CI). See
`docs/architecture/architecture-decision-record.md` (ADR 0002) for the
Supabase → Convex migration history.
