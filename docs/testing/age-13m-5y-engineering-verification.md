# 13 months–5 years engineering verification

Date: 2026-07-27  
Branch: `arena/age-13m-5y-content`  
Baseline commit: `7828d90`

## Reviewer finding disposition

| Finding | Disposition | Resolution |
|---|---|---|
| A-REV-001 — re-seed could alter approved content | Accepted | Both seed paths now skip approved/published rows in full, including media. Regression tests require byte-stability. |
| A-REV-002 — mobile visual QA incomplete | Accepted / externally blocked | No visual PASS claimed. Missing browser tooling and the failed sandbox Chromium installation are recorded below. |
| A-REV-003 — authorization tests were mostly helper/static level | Accepted | Registered Convex handlers are now invoked with controlled contexts for child reads/writes, catalogue filtering, seed import, evidence review, and clinical-content transition denial. |

## Seed path

The canonical registry is `src/content/seed/index.ts`. `scripts/dumpSeed.mjs` bundles that TypeScript registry and deterministically writes `convex/seedData.json`. The CLI-only internal mutation `convex/seed.ts:run` and the staff-gated application mutation `convex/library.ts:importSeed` both upsert `libraryContent` by slug.

Local runtime-equivalent tests verify:

- the committed JSON is accepted by the importer field contract and exactly matches `seedPayload()`;
- slugs are unique and referenced taxonomy IDs exist;
- all nine 13m–5y age bands contain importable records;
- evidence links resolve to existing registry sources and content records;
- first import creates rows, re-import creates no duplicates, and media does not accumulate;
- existing approved/published rows, including body, source, data, review fields,
  and media, are skipped entirely and remain byte-stable on re-import;
- unapproved rows remain safely updatable and idempotent;
- independently uploaded, approved, or non-placeholder media stays byte-stable
  even when its unapproved content row is refreshed;
- unresolved placeholders refresh deterministically without accumulating;
- both seed mutations validate and return the exact
  `created/updated/skippedApproved/total` result shape;
- a seeded `published` value is clamped to `clinical_review` on insert;
- unrelated private child data is untouched.

No Convex deployment was used. This workspace does not contain a proven disposable, isolated deployment authorization, so live seed execution was intentionally skipped. Production was not contacted.

## Runtime authorization

`src/domain/__tests__/convexAuthorization.runtime.test.ts` executes the production authorization helpers with controlled authentication and database doubles. It verifies unauthenticated rejection, child ownership, cross-user denial without an active caregiver grant, normal-user denial for content/evidence edits, support-role denial for approval, qualification enforcement, and education-only scope for a qualified owner.

The existing static guard remains as broad coverage of every exported Convex handler. The new runtime suite supplements it at the shared enforcement boundary without weakening authorization.

## Age boundaries

The centralized resolver and both `Activities` and `MilestoneDemo` consumers are exercised at 12, 13, 18, 24, 25, 30, 31, 36, 37, 42, 43, 48, 49, 54, 55, 60 and 61 months. Each screen requests exactly one intended age-group key.

## Mobile preview QA

Attempted viewports:

| Viewport | Intended size | Result |
|---|---:|---|
| iPhone | 390 × 844 | Browser runner unavailable |
| Small Android | 393 × 851 | Browser runner unavailable |
| Tablet | 768 × 1024 | Browser runner unavailable |

The local Vite server started successfully at `http://127.0.0.1:5173`. The required `agent-browser` executable is not installed. The repository Playwright CLI is installed, but no Chromium/WebKit browser binary is available, so screenshot and live layout inspection could not run.

A sandbox-only browser installation was attempted with:

`PLAYWRIGHT_BROWSERS_PATH=/tmp/ace-pw-browsers npx playwright install chromium`

The download failed with CDN HTTP 502, certificate, and truncated-ZIP errors. No project dependency or repository file was changed by the failed attempt.

Component-level viewport-independent checks completed:

- both parent screens render and request the correct age band at every boundary;
- loading and empty-state branches remain covered by component tests;
- clinical-review wording remains non-diagnostic and does not claim approval.

Still requiring an authenticated preview with a browser binary:

- long Myanmar text wrapping and horizontal overflow;
- touch-target measurement;
- Activities and Milestone navigation;
- evidence summaries and clinical-review labels with real preview data;
- loading transitions over the network.

This is an explicit operational blocker, not a PASS for visual QA.
