# Social-emotional milestone coordinated withdrawal

Release: `2026-08-18-social-emotional-milestones`

This runbook is not authorization to mutate production during code review. The
branch, tests and deployment do not archive, approve or publish production
content. An authorized operator may run the internal release only after the
reviewed Convex functions have been merged and deployed.

## Why a separate release is required

The NICE PH40 evidence audit found four canonical milestone rows whose claims
were unsupported or incorrectly framed as attained developmental checkpoints.
They were removed from the authored seed, but normal seed import only upserts
present rows; it never archives a production row missing from the payload.

Archive, never delete, these exact rows:

- `ms_3_4m_social_2` — refreshed production preimage (2026-08-19): `clinical_review`, revision 1
- `ms_2_5y_social_3` — expected production preimage: `clinical_review`, revision 2
- `ms_13_18m_emotional_1` — expected production preimage: `clinical_review`, revision 2
- `ms_5y_emotional_1` — expected production preimage: `clinical_review`, revision 1

The source seed's central retirement guard excludes all four. Archiving retains
their media, evidence links, review decisions and audit history while removing
them from parent list, search, detail, media and offline publication paths.

## 1. Deploy functions only

Deploy the reviewed code through the normal release process. Do not run
`npm run evidence:activate`: the full PH40 import would reset the source review,
invalidate dozens of rows and withdraw published content before its replacement
sources and content revisions have completed human review.

## 2. Read-only exact-state preflight

```sh
npx convex run seed:preflightSocialEmotionalMilestoneRetirement \
  '{"releaseId":"2026-08-18-social-emotional-milestones"}' --prod
```

Stop unless the response has exactly four rows, every row has `found: true` and
`exactState: true`, and the statuses/revisions match the fixed preimages above.
Do not edit the code constants to accommodate a newer revision. A changed row
requires a new content decision and a separately reviewed release.

## 3. Authorized atomic archive

```sh
npx convex run seed:retireSocialEmotionalMilestones \
  '{"releaseId":"2026-08-18-social-emotional-milestones"}' --prod
```

Expected first-run result:

```json
{
  "retired": 4,
  "alreadyRetired": 0,
  "publishedWithdrawn": 1,
  "unpublishedArchived": 3,
  "total": 4
}
```

The mutation validates all four rows before its first write and then records one
`library.social_emotional_milestone.retired` audit event per row. A repeat is
idempotent only when each archived row carries this release's retirement note;
an unrelated or manual archive fails closed.

## 4. Verify withdrawal and offline cleanup

Run the preflight again and require four `archived` rows with `exactState: true`.
With a non-staff parent account, verify that none of the four appears in list,
search, detail or media routes. Require `library.publicationManifest` to return
`complete: true` without the four slugs before reconnecting a device that saved
the old catalogue. An incomplete manifest deliberately removes nothing.

## 5. Stage the PH40 evidence migration separately

The archive does not approve sources or republish other content. Continue only
with a separately reviewed, small-batch migration:

1. Import the new Head Start ELOF and HealthyChildren records alone. They must
   remain `awaiting_review`; imports cannot manufacture approval.
2. Named qualified people review the exact sources and their claim mappings.
3. Migrate rows already in `clinical_review` before touching published rows.
4. For each retained published row, change its links, accept the fail-closed
   revision bump, obtain all fresh required reviews, republish it individually,
   and verify parent visibility before proceeding to the next row.
5. Only after no active content cites PH40 should its corrected metadata reset
   be imported. Archived links remain as audit history and do not count as
   active mappings.
6. Finish with production evidence-integrity, parent-route and offline-manifest
   checks. Never bulk-approve content or evidence as part of this runbook.
