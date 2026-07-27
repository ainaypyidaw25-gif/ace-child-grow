# 13 months–5 years engineering verification

Date: 2026-07-27
Branch: `arena/age-13m-5y-content`
Baseline commit: `f32b21b` (`origin/agent/paid-parent-mvp`)

## Reviewer finding disposition

| Finding | Disposition | Resolution |
|---|---|---|
| A-REV-001 — re-seed could alter approved content | Accepted | Both seed paths now skip approved/published rows in full, including media. Regression tests require byte-stability. |
| A-REV-002 — mobile visual QA incomplete | Partially resolved / authenticated flow blocked | Public MM/EN sign-in passed three measured viewports; authenticated content screens remain blocked without a proven disposable backend. |
| A-REV-003 — authorization tests were mostly helper/static level | Accepted | Registered Convex handlers are now invoked with controlled contexts for child reads/writes, catalogue filtering, seed import, evidence review, and clinical-content transition denial. |
| A-REV-C01 — committed seed JSON was malformed | Accepted | Regenerated the canonical UTF-8 artifact (269 items), then required deterministic equality to `seedPayload()` in tests. |
| A-REV-H01 — tracker regeneration erased decisions | Accepted | Generator now merges by content ID, defaults only new rows, and retains removed rows unchanged as audit history. |
| A-REV-H02 — education owner could publish clinical-sensitive content | Accepted | Parent-facing library publication and CMS approval/publication now require a named, qualified `clinical_reviewer`; education scope remains insufficient. |
| A-REV-M02 — parent citation query exposed governance metadata | Accepted | Parent citation query now returns a validated bibliographic projection only. |

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

Chrome extension browser tooling was used against the arena Vercel preview. No
new account was created because the preview's backend was not proven isolated
from production data.

| Viewport | Size | Public sign-in result |
|---|---:|---|
| iPhone | 390 × 844 | MM/EN switch works; parent/staff tabs render; no horizontal overflow or off-screen controls |
| Small Android | 360 × 740 | MM/EN and staff explanatory text wrap without overflow; no console warnings/errors |
| Tablet | 768 × 1024 | Centered layout; no horizontal overflow or off-screen controls |

The first preview run measured both sign-in inputs at 38 px high. After the
fix, the current local build measured every public sign-in control at least
44 × 44 px at all three sizes, with `scrollWidth === innerWidth` and no
off-screen controls. The final Milestone skill-loss buttons and Activity
completion button also declare the same minimum explicitly.

Component-level viewport-independent checks completed:

- both parent screens render and request the correct age band at every boundary;
- loading and empty-state branches remain covered by component tests;
- clinical-review wording remains non-diagnostic and does not claim approval.

Still requiring an authenticated preview backed by a proven disposable test deployment:

- long Myanmar text wrapping and horizontal overflow;
- Activities and Milestone navigation;
- evidence summaries and clinical-review labels with real preview data;
- loading transitions over the network.

This is an explicit authenticated-flow blocker, not a PASS for those screens.
The public responsive checks above are a measured PASS; authenticated screens
remain covered by component and authorization tests only.
