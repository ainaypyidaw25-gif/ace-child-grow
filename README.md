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

## Stack

| Layer | Choice |
|------|--------|
| Frontend | React 18 + TypeScript (strict) + Vite |
| Styling | Tailwind CSS (custom design tokens) |
| PWA | `vite-plugin-pwa` (installable, offline public content) |
| Backend | **Convex** — database, auth, functions and file storage |
| Tests | Vitest + Testing Library (unit + component); Playwright (E2E, planned) |
| Hosting (planned) | Vercel (preview + production) |

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
npm run test   # age engine, corrected age, rule engine, safety triggers, sleep,
               # unit conversion, translation completeness, content safety,
               # Convex auth-guard coverage, deletion completeness, and more
```

The exact count grows over time — run the command above (or check CI) for
the current numbers rather than trusting a hardcoded count here. See
`docs/testing/test-results.md` for a point-in-time snapshot with more detail.

## Build

`npm run build` — currently **passing**; emits an installable PWA with a
service worker that caches **public educational content only** (never private
child records).

## Deployment

See `docs/deployment/deployment-guide.md`. The frontend deploys to Vercel; the
backend is deployed separately with `npx convex deploy` — a frontend deploy alone
does not ship backend changes. **Production deployment and `main` merges require
explicit human approval.**

## Evidence and safety status

Ordinary parent education requires English, native-Myanmar, evidence and safety
review. Diagnosis, treatment, medication, individualized advice and emergency-
decision wording remain fail-closed as **SPECIALIST REVIEW REQUIRED**. See
`docs/content/evidence-and-safety-review-policy.md`.

Current release verdict: **PREVIEW-READY FOUNDATION** (not production-ready).
See the delivery summary and `docs/testing/test-results.md`.
