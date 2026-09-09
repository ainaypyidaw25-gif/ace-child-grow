# `lsn_early_math` AI provenance correction gate

Status: code and tests only. Nothing in this document records a human review,
approves content, activates an AI release, publishes content, deploys code, or
changes Production.

## Why this successor exists

The Production evidence row for `us-hhs-head-start-elof-2015` has the verified
publisher metadata for the **Head Start Early Learning Outcomes Framework:
Ages Birth to Five**, but its current source-review note is about an unrelated
UNICEF report. That note cannot serve as human-review provenance for the Head
Start source.

The older immutable AI publication successor remains historical. Its constants
are not edited or reinterpreted. This successor has one purpose: remove the
unrelated review decision from the exact current Head Start source row and
return it to `awaiting_review`.

## Read-only Production capture

Captured at `2026-09-09T09:46:38.219Z`:

- exact evidence source row: `kd782yq6xc19gdv65gvz2z54s98crhkp`
- full row SHA-256: `5e332aa08eed09e7072c1bd7a9c8ebf3e7f0003e62ad6b4fd06d509181decf8f`
- stable publisher-metadata SHA-256: `759bd0856605837f6448ba873e5a2fee3eb3012550841945fad9413cf7e1f564`
- unrelated source-review audit row: `j575xbs7wthx79wnc4fkk0529s8d3xb3`
- unrelated source-review audit SHA-256: `80b144ae57fd67e05bc5174f31e395a27a11ea82f9979d1a31991221084dbcdc`
- bounded reverse-dependency scan: 461 rows; the only Production dependency is
  `lesson:lsn_early_math`
- current-version AI evidence audit rows: 0
- `lesson:lsn_early_math` AI publication release rows: 0
- AI publication control rows: 0

The preflight rechecks exact IDs, creation times, hashes, the only reverse
dependency, absence of current-version AI audit/release rows, disabled or
absent publication control, and absence of persisted clinical-release
governance. Any drift blocks the transaction before a write.

## What `prepare` may change

After a fresh `correction_ready` preflight, the internal CAS mutation may:

1. patch that one evidence source to `awaiting_review`;
2. set `reviewer` and `reviewDate` to `null`;
3. clear reviewer qualification, reviewer ID, review scope, and the unrelated
   review note;
4. preserve all publisher metadata and the historical audit row; and
5. insert one correction audit whose receipt explicitly says
   `humanReviewDecision: not_made` and `publicationDecision: not_made`.

It does not alter `libraryContent`, `evidenceLinks`, AI audit rows, AI release
rows, content-review decisions, or publication state.

## Required later human gate

After `prepare`, an authenticated Owner or `clinical_reviewer` with a
server-stored professional qualification must open the actual Head Start ELOF
PDF and record a new source review through the ordinary evidence-review
workflow. The review note must identify Head Start and ELOF (or the full Early
Learning Outcomes Framework title), describe the claim scope checked, and must
not reuse the unrelated UNICEF note.

Even a valid new source review does **not** publish `lsn_early_math`. A separate
fresh AI evidence/content audit, immutable release artifact, activation gate,
and any required content/language human reviews remain necessary.

## Operator sequence (not run)

Run only after the code is reviewed and deployed through the normal release
process. Production mutation still requires explicit action-time Owner
authorization.

```sh
npx convex run aiEarlyMathProvenanceCorrection:preflight \
  '{"releaseId":"2026-09-09-lsn-early-math-provenance-correction-1"}' \
  --prod
```

The preflight derives the current UTC date on the server. It does not accept a
caller-supplied freshness date.

Proceed only when the exact result is `phase: "correction_ready"` with an empty
`blockers` array. Then, and only with action-time authorization:

```sh
npx convex run aiEarlyMathProvenanceCorrection:prepare \
  '{"releaseId":"2026-09-09-lsn-early-math-provenance-correction-1"}' \
  --prod
```

Read back the preflight. The expected immediate state is
`phase: "awaiting_human_review"`. Stop there for the genuine reviewer. Do not
activate or publish as part of this correction.
