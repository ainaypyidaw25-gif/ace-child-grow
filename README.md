# 🌱 ACE Child Grow

**Every Child Can Grow** — a bilingual (Myanmar 🇲🇲 / English) early-childhood
development support platform for children from birth to 5 years.

> ⚠️ **Safety disclaimer.** ACE Child Grow is an **educational and
> screening-support** tool only. It **never diagnoses a child**, never shows
> disease scores or probabilities, and never replaces professional medical care.
> Urgent-safety guidance is 100% rule-based and never depends on generative AI.

---

## Purpose

Help parents and caregivers understand age-appropriate development, track
milestones, learn safe home activities, recognise possible concerns early,
understand special needs without stigma, track growth and sleep, and prepare
clear reports for professional visits — usable offline in low-connectivity areas.

## Current delivery status — 2026-08-04

ACE Child Grow is live at [child.acegroup.com.mm](https://child.acegroup.com.mm).
The work below is intentionally isolated in draft pull requests and has **not**
been merged, deployed to production, or submitted to Apple:

- [Draft PR #95](https://github.com/ainaypyidaw25-gif/ace-child-grow/pull/95)
  consolidates the unique reviewer-workspace changes from superseded draft PRs
  #20–#25 onto the current `main`. Typecheck, lint, unit tests, production build,
  Playwright, and Vercel preview checks pass.
- [Draft PR #97](https://github.com/ainaypyidaw25-gif/ace-child-grow/pull/97)
  prepares the current iOS App Store handoff: a bundled Capacitor/Xcode project,
  App Store-only feature gates, privacy manifest, legal/support routes, metadata,
  release checklist, and focused availability tests. All GitHub and Vercel checks
  pass; the unsigned Xcode Release simulator build also succeeds.

Before PR #97 can become a submission candidate, the owner must approve a
full-bleed final app icon, capture 4–6 real feature screenshots, obtain clinical
sign-off, record the React Router security-advisory disposition, complete Apple
signing and physical-device/TestFlight QA, verify the deployed privacy/support/
account-deletion routes while signed out, and approve App Store submission.

See [`docs/app-store/release-checklist.md`](docs/app-store/release-checklist.md)
for the evidence and remaining gates.

## Stack

| Layer | Choice |
|------|--------|
| Frontend | React 18 + TypeScript (strict) + Vite |
| Styling | Tailwind CSS (custom design tokens) |
| PWA | `vite-plugin-pwa` (installable, offline public content) |
| Backend | **Convex** — database, auth, functions and file storage |
| Tests | Vitest + Testing Library (unit + component); Playwright (E2E) |
| Hosting | Vercel (preview + production) |
| Native iOS | Capacitor + Xcode project (draft App Store handoff) |

See `docs/architecture/architecture-decision-record.md` for the full rationale.

## Local setup

```bash
npm install
cp .env.example .env.local   # set VITE_CONVEX_URL for your Convex deployment
npm run dev                  # start the dev server
```

## Scripts

```bash
npm run typecheck   # strict TypeScript, no emit
npm run test        # unit + component tests (Vitest)
npm run build       # production build (tsc + vite) + PWA service worker
npm run preview     # preview the production build
npm run lint        # ESLint
```

## Database setup (Convex)

The schema — tables, fields and indexes — is defined in `convex/schema.ts` and
applied by `npx convex deploy` (or `npx convex dev` while developing). There are
no hand-run SQL migrations.

Authorization is enforced inside each Convex function (see `convex/lib/auth.ts`),
never by hiding things in the client.

## Seed

Reference and content seeding lives in `convex/seed.ts` (internal, CLI-only).
Sample development content in `src/data/seed/content.ts` is **all marked
`clinical_review`** — nothing is shown to parents as approved guidance until a
qualified reviewer approves it, and the importers cannot create `published`
rows. Healthcare facilities are **never** seeded with invented data.

## Test

```bash
npm run test        # unit + component suite
npm run test:e2e    # Playwright browser suite
```

Latest PR #97 verification: **1,055/1,055 tests passing** across 105 test files,
with typecheck, lint, production build, Playwright, and Vercel preview checks
also passing. See `docs/testing/test-results.md` and the pull-request checks for
the dated evidence.

## Build

`npm run build` — currently **passing**; emits an installable PWA with a
service worker that caches **public educational content only** (never private
child records).

## Deployment

See `docs/deployment/deployment-guide.md`. The frontend deploys to Vercel; the
backend is deployed separately with `npx convex deploy` — a frontend deploy alone
does not ship backend changes. **Production deployment and `main` merges require
explicit human approval.**

## Safety & clinical status

All health/development content is **Clinical Review Required** until a qualified
reviewer approves it. See `docs/content/clinical-review-policy.md`.

Current release verdict: **LIVE PRODUCTION + REVIEWED DRAFT RELEASE WORK**.
The website is live, but PR #95 and PR #97 remain draft-only until their human
review and release gates are complete. See the delivery status above and
`docs/testing/test-results.md`.
