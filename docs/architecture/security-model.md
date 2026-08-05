# Security Model

> **Historical note:** this document originally described a Postgres/Supabase
> Row Level Security model. That backend was retired in ADR 0002. The
> ownership guarantee below is the same; the enforcement mechanism is not —
> Convex has no database-level policy layer, so every guarantee here is
> enforced **in application code**, one function at a time.

## Principle

Authorization is enforced **server-side, inside every Convex query/mutation**.
The client never decides who can read what; hidden buttons are never treated
as security. Every function derives the caller from
`getAuthUserId(ctx)` (via the shared `requireUser`/`ownChild`/`hasStaffRole`
helpers in `convex/lib/auth.ts`) and scopes reads/writes to that identity —
never from a client-supplied ID. A static regression test
(`src/domain/__tests__/convexAuthGuard.test.ts`) scans every exported
query/mutation in `convex/*.ts` and fails if one doesn't call an authenticated
helper, so a new function that forgets this is caught before it ships.

## Identity & roles

Non-staff users are simply authenticated parents. Staff roles
(`parentProfiles.staffRole`): `owner`, `content_editor`, `language_reviewer`,
`evidence_reviewer`, `clinical_reviewer`, `review_manager`, `support`. Helper
functions `getStaffAccess()` and `hasStaffRole()` in `convex/lib/auth.ts`
resolve a caller's role and back every staff-gated function.

## Ownership rule (P0)

Every private table (`children`, `milestoneSessions`, `milestoneResponses`,
`activityCompletions`, `growthRecords`, `sleepRecords`, `observations`,
`appointments`, `healthRecords`, `notifications`, `parentProfiles`, and more)
carries a `userId` field and is queried only through a `by_user`/`by_child`
index filtered to the authenticated caller (`ownChild()` additionally checks
family-sharing membership before allowing a caregiver to read a shared
child). Result: **no account can read or write another account's child
data** — the top P0 requirement — even if the client is compromised, since
the check happens inside the function body regardless of what the client
requests.

## Content visibility

Educational content (`libraryContent` and legacy `contentItems`) is readable
by parents only when `clinicalStatus`/`reviewStatus` is `published`; staff see
drafts for the review workflow. Unreviewed clinical content can therefore
never appear to parents as approved guidance — enforced in `content.ts`/
`library.ts`'s query handlers, not by a database policy.

## Clinical reviewers

`clinical_reviewer` can act on `contentReviews`/`libraryContent` review
fields and see unpublished content, but has no function granting access to
parent/child records — reviewers cannot read unrelated parent data.

## Audit log

`auditLogs` (`convex/audit.ts`) is insert-only: mutations write via
`logAudit()`, and account erasure only ever scrubs PII out of retained rows
(`scrubText()`), never deletes the row itself. There is currently no
retention/pruning cron for this table — see the 2026-08-05 production audit
for the follow-up.

## Secrets

Only `VITE_CONVEX_URL` (the deployment endpoint, not a secret) ships to the
client. Everything else — `SITE_URL`, `JWT_PRIVATE_KEY`/`JWKS` (session
signing), `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_RESEND_KEY`, and the
`MMPAY_*` payment credentials — is set as a Convex deployment environment
variable and never bundled, logged, or committed. `.gitignore` blocks all
`.env*` except `.env.example`. See `deployment/environment-variables.md`.

## Transport & storage

HTTPS in transit; Convex-managed encryption at rest. Inputs are validated
(domain engines throw structured errors on bad input, e.g. `AgeInputError`);
user-supplied HTML is sanitized before render.

## Offline cache separation

The service worker caches **public educational content only**
(`/content/*`, precache). Authenticated screens and Convex's WebSocket API
are never precached, so private child records never enter a public cache.

## Security tests (current)

- Static auth-guard coverage: every Convex function derives the caller from
  an authenticated helper (`convexAuthGuard.test.ts`).
- Backend guard regressions for specific P0/P1 issues (e.g. gestational-age
  bounds, soft-deleted-child reads) in `backendGuards.test.ts`.
- Account/child deletion completeness — every linked table is swept, storage
  blobs are deleted alongside their row — in `deletion.test.ts`.
- **Still needed:** an authenticated, two-account end-to-end run against a
  real Convex deployment (cross-account access attempts, role escalation,
  direct-URL access) — this repo's sandboxed test environment cannot open a
  WebSocket to `*.convex.cloud`, so this has to run against a real browser +
  deployment.
