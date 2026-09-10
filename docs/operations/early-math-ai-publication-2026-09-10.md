# Early math: disclosed AI educational publication

## Scope and authorization

On 2026-09-10 the Owner requested agent review and lesson publication instead of manual human review. This release applies **only** to `lesson:lsn_early_math`. It does not approve the clinical batch, other lessons, or either story. `contentReviews` and source reviewer identities remain unchanged. The legacy `clinicalStatus` stays `clinical_review`; parent access uses the existing separate AI publication lane and its explicit disclosure.

## Evidence and actual review

The sole citation is Rebecca Parlakian, *Rocking and Rolling. Nurturing Early Math Play and Discovery*, NAEYC, *Young Children*, Fall 2022, Vol. 77, No. 3:

[Publisher article](https://www.naeyc.org/resources/pubs/yc/fall2022/nurturing-early-math-play)

The source/claim agent and separate bilingual-copy/safety agent rechecked the final edited text on 2026-09-10, completing at 03:23:09Z and 03:23:05Z respectively. Both passed the narrowly scoped AI educational review. Runtime model version was not exposed; neither review is represented as a clinician or native-language editor approval. Underlying studies and child comprehension were not independently tested.

Two copy improvements precede publication: optional child-paced picture counting replaces a fixed five-object instruction; the caregiver quiz emphasizes play rather than pressure for correct answers. No benchmark, dosage or guaranteed outcome is claimed.

The parent UI renders a per-item AI-only badge on library/learning cards and a full disclosure on detail pages, including offline records. The notice is separate from normal body-copy cleanup, so removing a duplicate body prefix cannot hide provenance. Conventional human-reviewed content does not receive this badge.

## Frozen release

- Release: `2026-09-10-early-math-naeyc-ai-preview-v1:lesson:lsn_early_math`
- Content revision: 10 -> 11; data/searchText and AI pointers only.
- Desired content SHA-256: `78c25d77f6f81f88910c4818d0f8cea0a364f65ba6e1d2cecb066739eb8b06c5`
- Artifact SHA-256: `e9a74fe65724a54ebd008b8e84c002e24c5c8698699bd0f90bf3dbdb1e1d617a`
- Source: `naeyc-nurturing-early-math-play-2022`; still `awaiting_review` in the **human** review workflow.
- Review/publication lifetime: at most 30 days from the AI audit. Runtime also requires current source/content/link hashes and audit-date checks. Re-review is necessary before expiry; no automatic renewal.
- Stage also schedules one exact expiry mutation at the earlier audit-date/release cutoff. It revokes only this release and clears only its matching AI pointers so connected subscriptions are invalidated when time expires; a wall-clock check in a cached query alone is insufficient.
  The cutoff for this artifact is **2026-10-10 00:00 UTC** (06:30 Myanmar time).
- Global control: stage while disabled at generation 2, then enable generation 3 only when the sole active release is this lesson and the environment master switch is enabled.

Old releases and their frozen artifacts are not rewritten or reactivated. Any unexpected preimage, clinical-review assignment, source/link/human-history drift or additional active release blocks mutation. A runtime content/source change, revocation, disabled switch, unknown artifact, or expiry hides the AI lane again.

## Execution, one gate at a time

Run from the reviewed, clean, committed and deployed repository. The script defaults to read-only and writes private receipts under untracked `artifacts/` for explicit mutation steps.

```sh
node scripts/early-math-ai-publication-20260910.mjs
node scripts/early-math-ai-publication-20260910.mjs --stage
node scripts/early-math-ai-publication-20260910.mjs
node scripts/early-math-ai-publication-20260910.mjs --enable
node scripts/early-math-ai-publication-20260910.mjs
```

If a command outcome is uncertain, read back before any retry. Do not substitute dashboard edits or human approvals for the exact gate.

After enabling, independently verify the parent list/detail and evidence citation in the live UI. Expected: revision 11, explicit AI-only notice, new NAEYC source, revised optional action; old stories remain unavailable through the AI lane. Frontend deployment alone does not constitute publication.

## Withdrawal

The existing `aiPublication:emergencyDisable` internal mutation disables the AI lane immediately without modifying human approvals. Use an explicit operator/reason and verify the control is off and the lesson is no longer parent-readable. Previously downloaded offline content can persist until the device reconnects.

## Execution status

Independent backend/expiry review passed at 2026-09-10T03:33:45Z; 15 focused tests, application and Convex typechecks passed. Production activation is a separate step. Do not infer publication from this document alone; the live postflight and operator receipts are authoritative.
