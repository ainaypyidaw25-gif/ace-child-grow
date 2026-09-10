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

Initial source capture was taken on 2026-09-09. After the separately
Owner-authorized fail-closed disable and permanent v1 revocation, the complete
gate was recaptured read-only through `2026-09-10T00:05:42.631Z`:

- exact evidence source row: `kd782yq6xc19gdv65gvz2z54s98crhkp`
- full row SHA-256: `5e332aa08eed09e7072c1bd7a9c8ebf3e7f0003e62ad6b4fd06d509181decf8f`
- stable publisher-metadata SHA-256: `759bd0856605837f6448ba873e5a2fee3eb3012550841945fad9413cf7e1f564`
- unrelated source-review audit row: `j575xbs7wthx79wnc4fkk0529s8d3xb3`
- unrelated source-review audit SHA-256: `80b144ae57fd67e05bc5174f31e395a27a11ea82f9979d1a31991221084dbcdc`
- exact `lsn_early_math` content row and AI snapshot SHA-256:
  `296b20c9010190afab5443fba8e0d9bdf8ad7f04a3d01e0951237965b244b1ce` /
  `e5e5bd3383ade88d5960a1278658a19aef460ddc84717ca8eed07d11fa4145ba`
- all three former target content rows have exact full-row hashes and no
  `aiPublicationReleaseId` or `aiPublishedAt`; their exact 3/2/2 historical
  content-review rows are also frozen by row ID, creation time and hash
- bounded reverse-dependency scan: the only Production dependency is
  `lesson:lsn_early_math`
- current-version AI evidence audit rows: 0
- exact original early-math AI run/content-audit/evidence-audit hashes:
  `e0afc6d7360d3715df484b11e79a0dd81255af9c2ccc5eac3e2f596d2be204e5`,
  `53180d2bb581288be5f1ac810b0147097945ad96937539bcf5da7f753e3ef670`,
  and `3936e752a4eaefddecb196cddbfefdd03492c20786759cd39d328e36aa9db83d`
- exact global publication-control row: disabled, generation 2, hash
  `173406663df5b862a5d12a759971eaf83a78e0daff768e108cddb7ee95bbcf09`
- exact successful disable audit hash:
  `443ca8463546e85149835f47efa308c5f6bc9d45e30fd0507f5b941b3cb4b6fd`
- active AI publication release rows: 0
- the three immutable v1 rows are retained as `revoked`, with exact hashes
  `e03c02f00e644bb3e6353c8019b0a798646f22fbbf3decf3f6bf270787a1a9a9`,
  `28b043d110ede937e5240cf99221c537a1da8dee806ed0b773a0bc9f656d32b0`,
  and `427502506c2bd500ef2e61f50b9c92fef44b5cfb793cfe6739d36f981a3c9a3d`
- exact successful revoke audit hash:
  `9538b58bcfffce20df46abed364db4e694211c4e32c281cc10dec77746d4d04a`

The preflight rechecks exact IDs, creation times, hashes, snapshots, content
review sets, cleared content pointers, the only reverse dependency, the exact
original AI audit chain, disabled generation-2 control and audit, zero active
releases, the exact global three-row revoked set and revoke audit, and absence
of persisted clinical-release governance. `lsn_early_math` must retain its
exact revoked predecessor; zero release rows is no longer accepted. Any drift
blocks the transaction before a write.

The disable and revoke receipts prove only those operational safety actions.
They do not record or imply human source review, content approval, successor
activation, or publication.

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
