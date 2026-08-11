# Duplicate milestone coordinated withdrawal

Release: `2026-08-11-duplicate-milestones`

This is an operator runbook, not an instruction to change production during PR
review. The source branch and PR do not seed, mutate, merge or deploy
production. An authorized owner runs the steps only after the reviewed code has
been merged and deployed through the normal release process.

## Exact production targets

Archive, do not delete, these six rows:

- `ms_5_6m_gross_motor_1` (keep `ms_5_6m_gross_motor_2`)
- `ms_5_6m_speech_1` (keep `ms_5_6m_speech_2`)
- `ms_7_9m_gross_motor_1` (keep `ms_7_9m_gross_motor_2`)
- `ms_5_6m_fine_motor_1` (keep `ms_7_9m_fine_motor_1`)
- `ms_5_6m_language_1` (keep `ms_7_9m_language_1`)
- `ms_5_6m_social_1` (keep `ms_7_9m_social_1`)

The source seed excludes exactly these six. Their current media, evidence links
and review history remain stored for staff audit, but existing server-side
publication gates make all of them unreachable to parents after archive.

## 1. Read-only preflight

Do not use `--push`. Run against production only after the release containing
the functions is already deployed:

```sh
npx convex run seed:preflightDuplicateMilestoneRetirement \
  '{"releaseId":"2026-08-11-duplicate-milestones"}' --prod
```

Stop unless the output contains exactly six rows, each `found: true` and
`clinicalStatus: "published"` (or all six already `"archived"` after a
verified retry). Copy each reported `reviewRevision`; do not guess it.

## 2. Authorized atomic archive

Replace each `REVIEW_REVISION_*` placeholder with the matching integer returned
by preflight. The mutation validates the exact set and every revision before its
first write, so a missing, non-published or changed row aborts the whole release.

```sh
npx convex run seed:retireDuplicateMilestones \
  '{"releaseId":"2026-08-11-duplicate-milestones","targets":[{"slug":"ms_5_6m_gross_motor_1","expectedReviewRevision":REVIEW_REVISION_1},{"slug":"ms_5_6m_speech_1","expectedReviewRevision":REVIEW_REVISION_2},{"slug":"ms_7_9m_gross_motor_1","expectedReviewRevision":REVIEW_REVISION_3},{"slug":"ms_5_6m_fine_motor_1","expectedReviewRevision":REVIEW_REVISION_4},{"slug":"ms_5_6m_language_1","expectedReviewRevision":REVIEW_REVISION_5},{"slug":"ms_5_6m_social_1","expectedReviewRevision":REVIEW_REVISION_6}]}' \
  --prod
```

Expected first-run result: `retired: 6`, `alreadyRetired: 0`, `total: 6`.
The mutation writes one immutable `library.duplicate_milestone.retired` audit
event per slug. A verified repeat is idempotent.

## 3. Coordinated parent/offline verification

Run the read-only preflight again and require all six statuses to be
`"archived"`. Then verify with a non-staff account:

1. Parent library list, search, slug detail, media and evidence endpoints expose
   none of the six.
2. `library.publicationManifest` excludes all six and remains `complete: true`.
3. On a device that downloaded the old catalogue, reconnect once. The app uses
   the complete manifest to delete all six IndexedDB rows and their referenced
   Cache Storage media without waiting for the parent to tap Update.
4. Disconnect again and confirm none of the six can reappear from offline
   fallback; confirm the six named replacement slugs remain readable.

If the manifest is incomplete, the client deliberately deletes nothing. Fix
the manifest limit/query issue before retrying; never infer withdrawal from a
partial list.

## Specialist boundary retained

Bed-sharing wording and emergency-decision wording still require focused
specialist review. This release does not provide such a review and does not mark
ordinary developmental content as clinically approved.
