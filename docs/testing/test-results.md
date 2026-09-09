# Test Results

> **This is a point-in-time snapshot, not a live source of truth.** The exact
> counts below will drift as the suite grows — re-run `npm run test` (or check
> CI) for the current numbers. This file is worth keeping for the *shape* of
> what's covered and the sandbox limitations noted below, not the specific
> counts.

**Last regenerated:** 2026-09-09 · **Command:** `npm test` (Vitest 4.1.11)

## Summary

| Check | Result |
|-------|--------|
| TypeScript typecheck (`tsc -b --noEmit`) | ✅ PASS (0 errors) |
| Unit + component tests | ✅ **2,207 / 2,207 passing**, 249 test files |
| Production build (`npm run build`) | ✅ PASS (324 modules) |
| Harness build (`npm run build:harness`) | ✅ PASS (298 modules) |
| Google Play build policy scan | ✅ PASS — no excluded route chunks/payment copy; free native Terms present |
| PWA service worker generated | ✅ 346 precache entries; public content only |
| Playwright local/non-live matrix | ✅ 20 passed, 4 intentionally skipped |
| Myanmar PDF generation | ✅ verified — sample A4 PDF renders Myanmar correctly (see below) |
| Dependency audit (`npm audit --audit-level=high`) | ✅ 0 vulnerabilities |

## Backend (Convex) — verified

- Production deployment: `graceful-possum-566` (see `deployment/convex-setup.md`).
- Every Convex query/mutation is statically checked to derive the caller from
  an authenticated helper (`src/domain/__tests__/convexAuthGuard.test.ts`) —
  this is the current stand-in for a live two-account integration test (see
  the sandbox note below for why the live version can't run here).

## E2E (Playwright, `env -u E2E_LIVE npx playwright test`)

- 20 local/harness checks passed, including sign-in boot, responsive parent and
  owner layouts, no dev routes, and every listed guide-image review card.
- Four authenticated/live-backend flows were intentionally skipped: login
  persistence, parent onboarding, urgent safety, and staff invitation. They need
  `E2E_LIVE=1`, disposable test accounts and a real Convex WebSocket connection.

**Sandbox note:** this build/test sandbox blocks browser WebSocket (WSS)
egress to `*.convex.cloud` (Node HTTPS works; browser WSS times out), so
live-backend E2E cannot execute here. It runs in a normal browser/CI. This is
an environment limitation, not an app defect.

## Myanmar PDF verification

`npm run report:pdf` generates a real A4 PDF via Chromium (HarfBuzz shaping)
with an embedded Noto Sans Myanmar font, as a local/dev-time script (it is
not invoked by the running app — the in-app Report screen's browser
print-to-PDF is the production path; see `content/localization-guide.md`).
The generated `sample-report-mm.pdf` was rendered to an image and visually
confirmed: correct Myanmar glyph shaping, stacking and reordering, no tofu
boxes, no clipped text, single-page A4, with the non-diagnostic disclaimer
present.

## What is verified

The safety-critical core is proven by real, passing tests: age & corrected-age
math, the rule-based Green/Yellow/Orange/Red engine, the deterministic
urgent-safety engine (including skill-loss → RED and "no fabricated phone
number"), sleep-across-midnight, validated unit conversion, translation
completeness, per-function auth-guard coverage across every Convex module,
and account/child deletion completeness (every linked table swept, storage
blobs deleted alongside their row).

## Not yet run (requires a live backend + real browser)

Authenticated two-account cross-account-denial E2E, full Playwright suite
against production, visual regression, and offline runtime tests. See
`test-plan.md`.

## Known audit note

The 2026-09-09 lockfile audit reports zero vulnerabilities. This result is tied
to the committed lockfile and must be rerun after dependency or lockfile changes;
it does not replace CodeQL, branch protection or runtime security monitoring.
