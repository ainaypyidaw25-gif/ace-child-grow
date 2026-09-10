# Head Start ELOF source retirement — 2026-09-10

## Exact read-only Production state

Deployment `graceful-possum-566` was queried read-only on 2026-09-10.

- Source ID: `us-hhs-head-start-elof-2015`
- Title: `Head Start Early Learning Outcomes Framework: Ages Birth to Five`
- URL: `https://headstart.gov/sites/default/files/pdf/elof-ohs-framework.pdf`
- Year: `2015`
- Evidence level: `expert_consensus`
- Review status: `awaiting_review`
- Reviewer, review date and next-review date: absent
- Current `evidenceLinks` containing this ID: `0`
- Frozen clinical-review assignments containing this ID: `0`
- Historical dependencies: AI evidence audit
  `2026-08-19-ai-educational-preview-3:audit:lesson:lsn_early_math` and revoked
  AI release `2026-08-19-ai-educational-preview-3:lesson:lsn_early_math`, revision 9

The source must not be deleted or rewritten under the same stable ID because the
historical audit and revoked release remain immutable provenance. The repository
marks it `retired` as desired state and removes stale static links, but a registry
import does **not** promote that desired status onto an existing Production row.
Production remains `awaiting_review` until the authenticated action below succeeds.

## Current claim replacements

No current Production content claim depends on ELOF. The earlier early-math use is
already linked to `naeyc-nurturing-early-math-play-2022`; that 2022 publisher page
supports counting in routines, shape exploration, comparison/spatial language and
low-pressure play, and remains `awaiting_review`.

Two static guide mappings that previously depended too heavily on ELOF are now
bound to current official pages:

- `guide:gd_3y_social`: `cdc-milestones-3-years-2026` supports the exact three-year
  social milestone, peer play, sharing, friendship and act-early referral. The
  existing current choking source remains separate.
- `guide:gd_2_5y_emotional`:
  `cdc-emotion-coaching-toddlers-preschoolers-2026` supports common outbursts,
  safety first, calm caregiver modelling, naming and accepting emotions, and limits
  on harmful behaviour. `hc-mental-emotional-development-2026` supports emotion
  language, calm modelling, play, walking/talking together and professional
  follow-up. Unsupported diagnostic thresholds were not introduced.

These repository changes are not a source approval, content approval, Production
write or publication decision. The new/changed exact source rows must enter
Production as unapproved and any changed content or link must receive a new review
revision through the governed importer before release.

## Separate authenticated retirement operation

Use the staff Evidence Library UI, which calls the existing authenticated
`evidence:setReview` mutation. It requires an evidence editor and records reviewer
identity, qualification, date and an audit log. No new automated retirement command
was added, because automation must not invent those human fields.

1. Fresh-preflight the exact metadata above; require one source row, zero live
   links, zero frozen clinical assignments, and the same historical audit/revoked
   release references. Stop on drift.
2. A named evidence editor selects `retired` and records their genuine
   qualification, actual ISO review date (`2026-09-10` only if performed that day),
   and a note limited to the retirement scope: the 2015 row is unlinked, superseded
   for its former live uses, and retained for audit history.
3. Read back exactly one source row with `reviewStatus=retired`, zero live links,
   and unchanged historical audit/revoked-release rows.

Do not use a generic registry import as the retirement action. Do not delete the
row, reuse its ID for a different publication, approve any replacement source,
change content status, activate a release or publish content in this operation.
