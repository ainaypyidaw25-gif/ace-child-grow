# 13 months–5 years engineering verification

Date: 2026-07-27
Branch: `arena/age-13m-5y-content`
Baseline commit: `f32b21b` (`origin/agent/paid-parent-mvp`)

## Reviewer finding disposition

| Finding | Disposition | Resolution |
|---|---|---|
| A-REV-001 — re-seed could alter approved content | Accepted | Both seed paths now skip approved/published rows in full, including media. Regression tests require byte-stability. |
| A-REV-002 — mobile visual QA incomplete | Resolved for the parent preview flow | A temporary isolated Convex deployment was seeded, a synthetic parent completed onboarding with a 13-month child, and authenticated empty/loading states were measured at three viewports. Staff draft preview still requires a real invited staff account. |
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

The final preview verification used the temporary isolated Convex development
deployment `fortunate-iguana-575`. The Vercel branch-only Preview environment
points to that deployment; Production environment variables were not changed.
The first isolated seed run created 269 records. The second run created 0,
updated 269 unapproved records, produced 0 duplicates, and retained the same
total. No production seed or production data mutation was run.

Operational note: while discovering the correct Convex team/project, the CLI
did push this branch's function and schema definitions once to the existing
`uncommon-orca-603` development deployment that the public frontend currently
references. It did not run a seed or write application data there. All later
runtime and seed QA used only `fortunate-iguana-575`.

## Runtime authorization

`src/domain/__tests__/convexAuthorization.runtime.test.ts` executes the production authorization helpers with controlled authentication and database doubles. It verifies unauthenticated rejection, child ownership, cross-user denial without an active caregiver grant, normal-user denial for content/evidence edits, support-role denial for approval, qualification enforcement, and education-only scope for a qualified owner.

The existing static guard remains as broad coverage of every exported Convex handler. The new runtime suite supplements it at the shared enforcement boundary without weakening authorization.

## Age boundaries

The centralized resolver and both `Activities` and `MilestoneDemo` consumers are exercised at 12, 13, 18, 24, 25, 30, 31, 36, 37, 42, 43, 48, 49, 54, 55, 60 and 61 months. Each screen requests exactly one intended age-group key.

## Mobile preview QA

Chrome and a clean in-app browser session were used against the arena Vercel
preview backed by `fortunate-iguana-575`. A synthetic parent account accepted
consent and created a test child born 2025-06-20. On 2026-07-27 the application
correctly rendered the child as `1 နှစ် 1 လ` and selected the 13–18 month band.

| Viewport | Size | Authenticated result |
|---|---:|---|
| iPhone | 390 × 844 | Myanmar and English Journey empty states rendered; `scrollWidth === innerWidth === 390`; header/bottom-nav controls remained on-screen and primary touch targets measured at least 44 px. |
| Small Android | 360 × 740 | Myanmar Journey empty state rendered without clipping; `scrollWidth === innerWidth === 360`; bottom navigation remained visible. |
| Tablet | 768 × 1024 | Centered 720 px main region; `scrollWidth === innerWidth === 768`; no off-screen controls or horizontal overflow. |

The first preview run measured both sign-in inputs at 38 px high. After the
fix, the current local build measured every public sign-in control at least
44 × 44 px at all three sizes, with `scrollWidth === innerWidth` and no
off-screen controls. The final Milestone skill-loss buttons and Activity
completion button also declare the same minimum explicitly.

Authenticated preview checks completed:

- sign-up/sign-in, consent, child creation, returning-user Home routing, and
  server-persisted child profile;
- 13-month age resolution and parent-safe Journey/Activities empty states;
- Myanmar/English switching on the Journey state;
- real network loading transitions;
- a direct parent visit to `/admin` now redirects to `/home`; the invite route
  remains separate, and Convex authorization still enforces all staff writes;
- no older-child draft reached the parent account.

During sign-up, a previously cached application shell requested a removed lazy
chunk and left a blank screen until reload. `src/app/chunkRecovery.ts` now
handles Vite/WebKit lazy-chunk failures, reloads once, and uses a cooldown to
prevent loops. Regression tests cover detection, recovery, cooldown, later
deployments, and denied session storage.

Component-level viewport-independent checks completed:

- both parent screens render and request the correct age band at every boundary;
- loading and empty-state branches remain covered by component tests;
- clinical-review wording remains non-diagnostic and does not claim approval.

Remaining manual review is deliberately limited to staff-only draft content:
evidence summaries, review labels, and milestone interactions cannot be shown
to the synthetic parent because all 13m–5y records are correctly held at
`clinical_review`. Those screens require a real invited staff/reviewer account;
their publication and authorization rules remain covered by component,
integrity, and runtime authorization tests. This is not a clinical or
native-Myanmar approval.

Final gates after the QA fixes: typecheck PASS, lint PASS, production build
PASS, deterministic 269-item seed PASS, and 37 test files / 472 tests PASS.
