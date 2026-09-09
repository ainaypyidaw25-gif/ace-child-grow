# AI educational preview successor — 2026-09-09

This record prepares release
`2026-09-09-ai-educational-preview-source-refresh-3`. It does not deploy,
disable, replace, activate or revoke anything in Production.

## Frozen read-only evidence

The Production snapshot was captured at `2026-09-09T06:57:30.595Z` with
bounded indexed queries. The three content and evidence-link hashes still
match the immutable 2026-08-19 release. Each linked source has the same
evidence snapshot hash but a later `updatedAt` because human review metadata
was added:

| Target | Source `updatedAt` | Evidence snapshot SHA-256 |
| --- | --- | --- |
| `lesson:lsn_early_math` | `2026-08-24T04:09:52.518Z` | `061e21a65c5e7df0aa339d56ccf9f0823e17fdf9b7c4fba44ce49228923f2a5c` |
| `story:st_waiting_at_clinic` | `2026-08-21T13:24:43.279Z` | `b1ef83b5454077bdbac05ab4813eae6522fb78a3b7ff2beffed79bb9d5080cd3` |
| `story:st_first_day_school` | `2026-08-21T13:25:05.972Z` | `93da0145018783682eba7e299cac56420f5561900f2145c07f36b689c8f7b9a3` |

The successor also freezes each document ID, creation time, current timestamp,
full source-row hash (including human review metadata), predecessor release ID
and predecessor release hash. Any later edit makes the preflight return
`blocked`.

Fresh official-page checks on 2026-09-09 confirmed the claim-direct material:

- the Head Start ELOF PDF still contains the 2015 framework and preschool
  Mathematics Development material, and now also contains a September 2026
  cover letter;
- the Alder Hey page still describes waiting areas and possible toys or
  activities for younger children and displays its 04/07/2023 review date;
- the Head Start First Day Jitters page still exposes the title, reader and
  transcript supporting first-day nervousness and school transition. Its
  current rendered page did not display the stored edition date or the former
  `Preschoolers` label, so neither is used for the successor claim decision.

The early-math source row currently carries a human review note describing an
unrelated UNICEF report. The exact full-row hash deliberately preserves this
anomaly, and the early-math artifact target has an explicit `blocked` verdict.
This whole release is therefore a diagnostic record only: no control state can
make its preflight return `disable_required` or `ready`. Correct the source
through a separately reviewed source update, then capture and audit that new
state under a new release ID.

## Safe action-time gates

1. Do not stage, activate or use this release to disable the predecessor. It is
   permanently blocked by its frozen early-math provenance verdict.
2. If separately approved, deploy only the read-only diagnostic query dark.
   Deployment is a separate Production change and needs action-time approval.
3. Run only the read-only query:

   ```sh
   npx convex run aiPublicationSuccessor20260909:preflight \
     '{"releaseId":"2026-09-09-ai-educational-preview-source-refresh-3"}' \
     --prod
   ```

4. It must return `phase: "blocked"` and include the unrelated-UNICEF provenance
   blocker for `lsn_early_math`. Any other result is a code/evidence defect; do
   not mutate Production.
5. Correct the source review note through the qualified human evidence-review
   workflow and independently read it back. That edit intentionally makes this
   frozen snapshot fail exactness.
6. Capture fresh bounded Production snapshots and complete a new audit under a
   new release ID. Re-run all exact preflight, disable, replacement, activation
   and postflight gates only for that new generation with fresh Owner approval.

The 2026-08-19 data and audit modules and runtime visibility path remain
unchanged. This 2026-09-09 diagnostic artifact is not registered as an
activatable runtime release and has no mutation companion.
