# Exact three-guide unpublished correction

This release corrects draft guidance. It does not publish medical/developmental guidance, create human review decisions, or approve evidence sources. The existing fictional AI-publication lane is unchanged.

## Scope

| Guide | Revision | Authored field changes | Desired reference links |
| --- | --- | --- | --- |
| `gd_birth_2m_nutrition` | 6 → 7 | 30 | 13 |
| `gd_13_18m_fine_motor` | 4 → 5 | 22 | 7 |
| `gd_10_12m_safety` | 3 → 4 | 22 | 8 |

Seventy-four exact string replacements and three exact link-array replacements are bound to the reviewed proposal. Fourteen new reference records are registered as `awaiting_review`, with null reviewer/review dates and no professional credentials. Fifteen existing reference rows, including five shared with frozen review batches, remain byte-for-byte equivalent under canonical hashing. Undated publisher documents retain null dates; a current URL is not evidence of a new edition.

Changes address unsafe or ambiguous feeding, object-play, home-safety and escalation wording. Copy and source checks are AI preparatory checks, not clinical or native-language certification. Restricted textbooks and unavailable full recommendations are not represented as fully read.

## Exact identity

- Release: `2026-09-10-three-guide-unpublished-correction-v1`
- Production snapshot: `abc77f995b255076555660453256b6a33ef35d211a8ee84ec2cce9edb122241b`
- Consolidated proposal: `10da3bf48a9be892d68b1dd5e6f5f251260000f51c7011ca0c786417e09ef56c`
- Source registration proposal: `34499843d41c7c1473747faea53a8d8276bdbf65f8268ab430414e18dab7505a`
- Reviewed authored after-images: `e947289256f09ca5893aa507179cbdb78bf9ba8faa80d5bee57ddd1301b1d478`

Private full snapshots and review artifacts stay in ignored `artifacts/next-guide-corrections-20260910/`. The deterministic compiler verifies their hashes before producing the committed content/hash manifest. Do not substitute a fresh snapshot without rechecking every dependency and re-reviewing any changed content.

## Release sequence

1. Run focused lifecycle, importer and independent real-packet tests, then application/backend typecheck, lint, full unit tests and build. Require exact-head CI before merging.
2. Deploy the reviewed backend commit to the explicitly selected production deployment. Deployment alone does not alter guide content.
3. Call internal `threeGuideCorrection:preflight` with the four exact identity fields and current `checkedAt`. Require phase `ready`, no blockers and all preservation checks true. A stale guide, source alias collision, changed review/governance state, or changed AI release/schedule must stop the run before any write.
4. Call internal `threeGuideCorrection:apply` with the same identity. Its transaction registers only the fourteen draft sources, patches the three guides/links and appends one correction receipt. It increments each review revision and clears current summary-review fields while preserving all append-only human review history. The transaction must pass its own exact postflight or roll back.
5. Independently recapture full production state. Compare every before/after field, all new source metadata, old sources/history/media, ten existing AI previews and three schedules. Require `applied` preflight and exact receipt. Repeating `apply` must be a no-op only for the exact receipted after-state.
6. Confirm parent-facing guide routes remain unavailable and existing AI stories remain readable. This is a correction milestone, not a publication milestone.

## Recovery and remaining gates

Do not overwrite the catalogue with an old seed, reset clinical review, or restore stale approvals. If postflight fails inside the mutation, Convex rolls the transaction back. If a later independent readback detects drift, stop further mutations and inspect the exact receipt/snapshot; any recovery requires a separately reviewed corrective patch against the then-current state.

Required qualified clinical/developmental review, native-Myanmar review, evidence-source decisions and eventual publication remain separate. No function in this release grants those approvals. The existing 105 stored published items and ten AI-release records do not establish whole-product readiness, payment correctness or app-store availability.
