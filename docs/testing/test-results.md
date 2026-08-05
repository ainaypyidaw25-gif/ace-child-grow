# Test Results

> **This is a point-in-time snapshot, not a live source of truth.** The exact
> counts below will drift as the suite grows — re-run `npm run test` (or check
> CI) for the current numbers. This file is worth keeping for the *shape* of
> what's covered and the sandbox limitations noted below, not the specific
> counts.

**Last regenerated:** 2026-08-05 · **Command:** `npx vitest run` (Vitest ^3.2.7 as pinned in `package.json`)

## Summary

| Check | Result |
|-------|--------|
| TypeScript typecheck (`tsc -b --noEmit`) | ✅ PASS (0 errors) |
| Unit + component tests | ✅ **1,072 / 1,072 passing**, 107 test files |
| Production build (`vite build`) | ✅ PASS |
| PWA service worker generated | ✅ precache public content only |
| Myanmar PDF generation | ✅ verified — sample A4 PDF renders Myanmar correctly (see below) |
| Dependency audit (`npm audit --omit=dev`) | ⚠️ 1 **high**-severity advisory in `react-router` (GHSA-qwww-vcr4-c8h2) — see the 2026-08-05 production audit; not dev-toolchain-only |

## Backend (Convex) — verified

- Production deployment: `graceful-possum-566` (see `deployment/convex-setup.md`).
- Every Convex query/mutation is statically checked to derive the caller from
  an authenticated helper (`src/domain/__tests__/convexAuthGuard.test.ts`) —
  this is the current stand-in for a live two-account integration test (see
  the sandbox note below for why the live version can't run here).

## E2E (Playwright, `npm run test:e2e`)

- `boot.spec.ts` — app boots and shows the sign-in gate (runs anywhere).
- Full authenticated flows (sign-up → consent → add child → milestone → safety
  banner, etc.) need `E2E_LIVE=1` and a real WebSocket connection to Convex.

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

`npm audit --omit=dev` currently reports one high-severity advisory in
`react-router` (not just the dev toolchain, as an earlier version of this doc
claimed) — see the 2026-08-05 production audit for the fix. Separately, `npm
outdated` shows the build toolchain (vite, vitest, typescript, eslint,
esbuild) several majors behind current; scheduled incremental upgrades are
tracked as a follow-up.
