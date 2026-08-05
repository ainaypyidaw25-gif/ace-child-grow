# Environment Variables

See `.env.example`. Never commit real values; `.gitignore` blocks all `.env*`
except the example. The backend is **Convex** (schema, auth, functions, file
storage) — there is no Supabase in this project.

## Client (Vite, bundled into the shipped app — never put secrets here)

| Variable | Purpose |
|----------|---------|
| `VITE_APP_ENV` | `development` / `preview` / `production` |
| `VITE_DEFAULT_LOCALE` | Default locale (`mm`) |
| `VITE_CONVEX_URL` | The Convex deployment the frontend connects to, e.g. `https://YOUR-DEPLOYMENT.convex.cloud` |

## Server-side, set on the Convex deployment only (`npx convex env set NAME VALUE`)

These are **never** `VITE_`-prefixed and never appear in the client bundle,
`.env.local`, or Git — only in the Convex dashboard (Settings → Environment
Variables) or via the CLI against the selected deployment.

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | The canonical frontend origin Convex Auth trusts for OAuth callbacks/CSRF checks. **Must exactly match the domain parents actually use to sign in** — Google sign-in fails with a server error from any other origin (see the `child.acegroup.com.mm` vs. `*.vercel.app` note below). |
| `JWT_PRIVATE_KEY` / `JWKS` | Convex Auth session signing keys. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client credentials for "Sign in with Google". |
| `AUTH_RESEND_KEY` | Resend API key for password/PIN recovery email. |
| `AUTH_EMAIL_FROM` | Sender address for recovery email, e.g. `ACE Child Grow <no-reply@acegroup.com.mm>`. |
| `APP_ACCESS_MODE` | `testing` unlocks all parent features without payment prompts (closed testing); set to `production` before enabling paid subscriptions for real users. |
| `MMPAY_ENV` | `sandbox` or `production` — selects which Myan Myan Pay credential set below is active. |
| `MMPAY_WEBHOOK_URL` | `https://YOUR-DEPLOYMENT.convex.site/mmpay/webhook` — registered with the payment provider. |
| `MMPAY_SANDBOX_APP_ID` / `MMPAY_SANDBOX_PUBLISHABLE_KEY` / `MMPAY_SANDBOX_SECRET_KEY` / `MMPAY_SANDBOX_API_BASE_URL` | Sandbox Myan Myan Pay credentials. |
| `MMPAY_PRODUCTION_APP_ID` / `MMPAY_PRODUCTION_PUBLISHABLE_KEY` / `MMPAY_PRODUCTION_SECRET_KEY` / `MMPAY_PRODUCTION_API_BASE_URL` | Production Myan Myan Pay credentials — only set once real merchant KYC/approval is complete. |

## Per-environment

- **development:** local `.env.local` (from `.env.example`) + a Convex dev deployment (`npx convex dev`).
- **preview:** Vercel preview builds currently share the production `.env.production` (see note below) and therefore the production Convex deployment — there is no separate preview backend today.
- **production:** Vercel production env (`.env.production`, committed with non-secret values only) pointing `VITE_CONVEX_URL` at the production Convex deployment, whose server-side secrets above are set independently in the Convex dashboard.

## Secret handling

Only `VITE_`-prefixed vars are exposed to the client bundle. Everything else in
this doc must be set as a **Convex deployment environment variable**
(`npx convex env set`), never as a Vercel env var and never committed —
Convex, not Vercel/Edge Functions, is where server-side code (queries,
mutations, actions, the payment webhook) actually runs.

## Known gotcha: which URL is "production"?

`.env.production`'s `VITE_CONVEX_URL` is the single source of truth for which
Convex deployment is live — cross-check it against `SITE_URL` on that same
deployment before trusting any other doc's claim about "the production
deployment name". A `SITE_URL` mismatch (e.g. parents reaching the app via a
Vercel `*.vercel.app` alias instead of the real custom domain) breaks Google
sign-in with a generic server error, since Convex Auth validates the request
origin against `SITE_URL`.
