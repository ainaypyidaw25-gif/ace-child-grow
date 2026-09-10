# Early math source replacement — 2026-09-10

The Owner requested a newer source instead of the 2015 Head Start ELOF citation for the current `lsn_early_math` review. Scope is this lesson only, not a global substitution for social/emotional guidance.

## Selected source

Rebecca Parlakian, “Rocking and Rolling. Nurturing Early Math Play and Discovery.” National Association for the Education of Young Children, *Young Children*, Fall 2022, Vol. 77, No. 3.

Publisher: https://www.naeyc.org/resources/pubs/yc/fall2022/nurturing-early-math-play

The byline, issue, year and full text were verified on 2026-09-10. Counting during routines, shape exploration and comparison language support the narrow educational claims. This teacher-facing infant/toddler resource is classified as `parent_education`, not a clinical guideline or intervention trial. Unknown identifiers and an exact numeric age band remain null. No full article is reproduced.

The five-object activity remains an editorial example, not a prescribed dose or achievement threshold. Required human content/language review remains outstanding.

## Verified production replacement

- Deployment: `graceful-possum-566`.
- Existing audited `evidence:importSourcesFromCli`: one new source, no updates/skips/failures.
- Existing audited `evidence:importLinksFromCli`: exactly one lesson link updated; exactly `lesson:lsn_early_math` invalidated.
- New source: `naeyc-nurturing-early-math-play-2022`, `awaiting_review`, no reviewer or review date.
- Lesson revision 9 → 10, status remains `clinical_review`.
- Old ELOF source unchanged; other production links and append-only content reviews unchanged.
- AI publication remains disabled, generation 2, zero active releases. No human approval or publication.
- Private before/after snapshots: `artifacts/early-math-source-20260910/1789009676607-{before,after}.json` (not committed).
- Typecheck passed; evidence suite: 51 files, 485 tests passed.

## Operator commands

`node scripts/replace-early-math-source-20260910.mjs` defaults to read-only verification. `--apply` uses the existing audited importers only after exact target-state checks, preserves a private before snapshot, and verifies the result. Do not bulk-import the old registry. A partially failed source-only import requires inspection, not a blind retry. This script is an operator preflight/read-back wrapper, not a new atomic compare-and-swap API.

## Follow-up

The reviewer must review the new NAEYC source, not approve ELOF merely to satisfy the predecessor correction gate. Historical ELOF correction/audit/release artifacts remain immutable; their exact preflight is expected to report dependency drift after this authorized replacement. A successor release must bind revision 10 and the new source, with fresh evidence/content audits and genuine required reviews. Do not relax the historical exact-match checks or reuse predecessor approvals.

The Evidence Library uses the deployed static registry for the related-content counter. Until the updated frontend is deployed/refreshed, the new source can show zero related items although the production link is already present; the script's independent database read-back is authoritative for the replacement.
