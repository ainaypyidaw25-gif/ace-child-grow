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
| Backend (planned) | **Supabase** — Postgres + Auth + Storage + Row Level Security |
| Tests | Vitest + Testing Library (unit + component); Playwright (E2E, planned) |
| Hosting (planned) | Vercel (preview + production) |

See `docs/architecture/architecture-decision-record.md` for the full rationale.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys when available
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

## Database setup (Supabase)

Migrations live in `supabase/migrations/`:

1. `0001_core_schema.sql` — all tables, keys, indexes, constraints.
2. `0002_rls_policies.sql` — Row Level Security (server-side authorization).
3. `0003_seed_reference.sql` — age groups, domains, fixed safety rules, referral guidance.

Apply with the Supabase CLI (`supabase db push`) or the SQL editor. **Requires a
Supabase project + credentials — see "External credentials" below.**

## Seed

Reference data is seeded by `0003`. Sample development content lives in
`src/data/seed/content.ts` and is **all marked `clinical_review`** — nothing is
shown to parents as approved guidance until a qualified reviewer approves it.
Healthcare facilities are **never** seeded with invented data.

## Test

```bash
npm run test   # 51 tests: age engine, corrected age, rule engine, safety triggers,
               # sleep, unit conversion, translation completeness, content safety,
               # milestone component
```

Current results: **51/51 passing.** See `docs/testing/test-results.md`.

## Build

`npm run build` — currently **passing**; emits an installable PWA with a
service worker that caches **public educational content only** (never private
child records).

## Deployment

See `docs/deployment/deployment-guide.md`. Preview/production deployment
requires Supabase + Vercel credentials (blocked until provided). **Production
deployment and `main` merges require explicit human approval.**

## Safety & clinical status

All health/development content is **Clinical Review Required** until a qualified
reviewer approves it. See `docs/content/clinical-review-policy.md`.

Current release verdict: **PREVIEW-READY FOUNDATION** (not production-ready).
See the delivery summary and `docs/testing/test-results.md`.
