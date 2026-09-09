# Web security headers release gate

The Vercel configuration installs the exact lockfile with `npm ci`, runs the
complete `npm run build` typecheck/build gate, and applies one enforced browser
policy to every route. This keeps a deployment configuration from silently
bypassing the repository's production checks.

The browser policy blocks framing and plugins, limits scripts to the deployed
application, and allows network/media access only for the app itself, the exact
Production Convex cloud/site hosts, and the two image hosts used by the payment
and profile flows. Inline styles
remain allowed because three React views currently use dynamic `style`
attributes; inline scripts and `eval` remain blocked.

## Preview gate

Run the configuration test and production build before opening a preview:

```sh
npx vitest run src/domain/__tests__/vercelSecurityHeaders.test.ts
npm run build
```

On the immutable preview URL, sign in with a non-production test identity and
verify: Google sign-in, the parent home and library, one stored milestone photo,
one MMQR rendering, and offline/PWA registration. In browser developer tools,
require zero CSP violations during those flows.

Read back the headers without changing deployment state:

```sh
curl -sSI https://PREVIEW-URL/home
curl -sSI https://PREVIEW-URL/.well-known/apple-app-site-association
```

Require `Content-Security-Policy`, `Permissions-Policy`, `Referrer-Policy`,
`X-Content-Type-Options`, and `X-Frame-Options` on `/home`, plus
`Content-Type: application/json` on the Apple association file. Stop if any
runtime request is blocked; update the narrow directive for the evidenced host
instead of adding a wildcard.

## Production gate and rollback

Production promotion remains a human-approved action. Record the tested preview
URL and commit, then promote that exact deployment. Repeat the two header reads
against `https://child.acegroup.com.mm` and smoke the same authenticated flows.

If auth, Convex sync, payments, stored media, or PWA registration regresses,
promote the previous known-good immutable Vercel deployment. No Convex or data
rollback is required for this header-only change.
