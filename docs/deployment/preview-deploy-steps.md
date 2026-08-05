# Getting a Live Preview URL (Vercel)

> **Historical note:** this doc originally walked through bootstrapping the
> very first Vercel import from a delivered repo bundle, before the project
> had a GitHub remote or a connected Vercel project. Both now exist —
> [github.com/ainaypyidaw25-gif/ace-child-grow](https://github.com/ainaypyidaw25-gif/ace-child-grow)
> is already imported into Vercel, so none of the bootstrap steps below apply
> anymore. Kept for history; see **Current workflow** for what actually
> happens today.

## Current workflow

1. Push a branch and open a PR. Vercel automatically builds and deploys a
   **preview** for that branch/PR (visible as a `Vercel` check + comment on
   the PR, with a `*-git-<branch>-ace-group.vercel.app` URL).
2. Preview builds use `.env.production` (there is currently no separate
   preview-only env config), so they share the **production** Convex
   deployment (`graceful-possum-566`) — a preview branch that adds new
   Convex functions/schema won't see them work until that schema is deployed
   to production (see `convex-setup.md`).
3. Merging to `main` triggers a **production** Vercel deployment
   automatically. There is no separate manual-approval gate in Vercel itself
   today — approval happens via normal PR review before merge.
4. The frontend deploy is independent of the backend: merging to `main`
   does **not** deploy Convex functions/schema. After merging a change that
   touches `convex/`, run the deploy command in `convex-setup.md` against the
   production deploy key.

## Env vars

See `environment-variables.md` for the full, current list
(`VITE_CONVEX_URL` client-side; `SITE_URL`, auth, and payment secrets set on
the Convex deployment, not in Vercel).
