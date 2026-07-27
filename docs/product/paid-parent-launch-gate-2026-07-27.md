# Paid-parent launch gate — 2026-07-27

Scope: PR #1 at `8260c49`, `agent/paid-parent-mvp`. This pass did not merge,
mark the PR ready, deploy Convex, change Vercel aliases, or configure merchant
credentials.

## Verified baseline

- `npm run typecheck`
- `npm run lint`
- `npm test -- --run` — 372/372 before the hardening changes
- `npm run build`
- `git diff --check`

## Security findings and fixes

- Premium and Family access previously depended on the expiration cron.
  Request-time entitlement resolution now treats an active/trialing
  subscription with `currentPeriodEnd <= now` as expired.
- Shared-child reads now require both an active caregiver membership and an
  unexpired Family owner subscription. Revoked or expired sharing is rejected
  even before the cron runs.
- Manual owner grants with no period end remain supported.
- Focused Convex tests cover direct expiry, Family owner/caregiver expiry,
  revocation, trial reuse/expiry, payment ownership, provider mismatches,
  webhook signature failure, nonce replay, terminal-state regression, and
  order-scoped refunds.

## Provider contract evidence

The locally installed `mmpay-node-sdk` 1.1.4 README and source both specify:

- `X-Mmpay-Signature`
- `X-Mmpay-Nonce`
- HMAC-SHA256 over `<nonce>.<exact raw request body>`

The code matches that pinned SDK contract. A real signed sandbox callback and
provider LIVE approval remain external gates.

## Environment isolation

- No merchant credential is committed.
- Payment actions fail closed until all selected environment values exist.
- Repository `.env.production` currently names `uncommon-orca-603`, which the
  project documentation identifies as the sandbox/development Convex backend,
  not the production callback deployment `graceful-possum-566`.
- The repository cannot prove the effective Vercel Preview environment values
  or alias routing. Confirm in Vercel that Preview uses only the sandbox Convex
  deployment and that `child.acegroup.com.mm` is not routing draft traffic to
  production before authenticated QA.

## External blockers

- Myan Myan Pay merchant KYC is pending and no API application exists.
- Sandbox credentials, callback registration, signed end-to-end payment, and
  LIVE approval are outstanding.
- Original animation uploads, rights evidence, professional approvals, legal
  pages, and authenticated mobile/desktop launch QA are outstanding.
- PR remains draft and has no human review.
