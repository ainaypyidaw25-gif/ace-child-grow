# Published evidence and safety release

Release: `2026-08-11-published-evidence-safety`

This runbook binds the production write to a read-only snapshot of the complete
published catalogue. Run it only after the reviewed code has been merged and
deployed. The mutation validates every published slug and review revision, all
seven specialist targets, the source-metadata state, and the local reviewed seed
before its first write. A mismatch aborts the transaction.

## Release actions

The following 13 parent-visible rows contain substantive evidence, age-band,
bilingual, safety or resource-description corrections. They receive the
reviewed seed content, increment `reviewRevision`, clear stale review fields and
return to `clinical_review`:

- `ms_5_6m_cognitive_2`
- `ms_5_6m_gross_motor_2`
- `ms_2y_gross_motor_1`
- `ms_3y_cognitive_1`
- `ms_4y_gross_motor_1`
- `ms_4y_school_readiness_1`
- `ms_5y_school_readiness_1`
- `ms_2_5y_fine_motor_1`
- `ms_2y_speech_1`
- `act_story_sequence`
- `st_when_i_feel_angry`
- `st_little_seed`
- `lsn_screen_time`

Focused specialist review applies only to emergency-decision wording in these
seven rows:

- `ms_birth_2m_emotional_1`
- `ms_birth_2m_nutrition_1`
- `ms_birth_2m_sleep_1`
- `ms_3_4m_sleep_1`
- `ms_5_6m_sleep_1`
- `gd_7_9m_safety`
- `gd_7_9m_emotional`

Any of these still published is moved to `clinical_review` at a new revision.
Rows already in `clinical_review` remain there. This does not call their
ordinary educational content clinically approved.

Every other current published row receives only the corrected editorial source
metadata and stays published. Edit history and existing review decisions remain
intact for metadata-only rows.

## 1. Read-only preflight

```sh
CONVEX_DEPLOYMENT=prod:graceful-possum-566 \
  npx convex run seed:preflightPublishedEvidenceSafetyRelease \
  '{"releaseId":"2026-08-11-published-evidence-safety"}' --prod
```

Stop unless `releaseApplied` is `false`, every published row has `sourceState`
`legacy` or `reviewed`, all 13 correction slugs are reported as
`correction_to_review`, and all seven specialist rows are found in either
`published` or `clinical_review`. Copy the complete `published` array and all
seven specialist status/revision values from this run; do not use an older
snapshot.

## 2. Authorized atomic release

Call `seed:applyPublishedEvidenceSafetyRelease` with:

- `publishedTargets`: every preflight `published` row mapped to
  `{slug, expectedReviewRevision: reviewRevision}`;
- `specialistTargets`: every preflight `specialist` row mapped to
  `{slug, expectedClinicalStatus: clinicalStatus, expectedReviewRevision: reviewRevision}`.

```sh
CONVEX_DEPLOYMENT=prod:graceful-possum-566 \
  npx convex run seed:applyPublishedEvidenceSafetyRelease \
  '{"releaseId":"2026-08-11-published-evidence-safety","publishedTargets":[...],"specialistTargets":[...]}' \
  --prod
```

Against the verified 2026-08-11 snapshot, the expected first-run result is:
`metadataUpdated: 73`, `correctionsStaged: 13`, `specialistStaged: 5`,
`specialistAlreadyInReview: 2`, `unchanged: 0`, `total: 91`. A repeat after the
completion audit is idempotent.

## 3. Postflight and parent isolation

Run preflight again. Require `releaseApplied: true`, 73 published rows, reviewed
source metadata on every published row, and all seven specialist rows in
`clinical_review`. Confirm all 13 corrected rows match the reviewed seed at the
new revision.

With a non-staff identity, require:

1. `library.publicationManifest` is complete and contains only the 73 published
   slugs.
2. All 18 newly staged rows are absent from parent lists and search.
3. Direct detail is restricted and media/evidence responses are empty for all
   18 rows.
4. A previously synced device reconnects once and removes those rows and their
   referenced media from IndexedDB/Cache Storage; they do not return offline.

If the manifest is incomplete, stop device verification. The offline client
deliberately retains its existing snapshot rather than deleting from a partial
manifest.

## Scope boundary

This release does not approve specialist wording, create printable PDFs, seed
newly corrected content as published, merge unrelated work, or deploy any
unreviewed source. Newly imported evidence sources remain awaiting human
evidence review.
