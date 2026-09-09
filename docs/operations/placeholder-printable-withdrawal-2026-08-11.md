# Placeholder printable coordinated withdrawal

Release: `2026-08-11-placeholder-printables`

Production inspection on 2026-08-11 found 25 printable catalogue rows. Thirteen
were already in `clinical_review` with accurate preview-only metadata. The exact
12 rows below were still parent-visible as `published`, claimed `A4 PDF`, and
each had only one placeholder PDF media row: no URL, no storage payload and no
media approval.

## Exact targets

- `prt_behavior_chart`
- `prt_checklist_10_12m`
- `prt_checklist_5_6m`
- `prt_checklist_7_9m`
- `prt_communication_cards`
- `prt_doctor_visit_checklist`
- `prt_flash_cards`
- `prt_growth_log`
- `prt_reward_chart`
- `prt_routine_chart`
- `prt_sleep_diary`
- `prt_visual_schedule`

For every target, the reviewed seed replaces `A4 PDF` with
`Preview only — bilingual PDF not yet available`, sets
`availability: preview_only`, increments `reviewRevision`, clears stale review
fields and returns the item to `clinical_review`. The placeholder media row and
all review/audit history remain stored for staff. A future education-scoped
review may republish the accurate preview metadata; the parent download control
still requires a non-placeholder, approved PDF/download payload.

## 1. Read-only preflight

Run only after the release functions have been merged and deployed:

```sh
CONVEX_DEPLOYMENT=prod:graceful-possum-566 \
  npx convex run seed:preflightPrintablePayloadRelease \
  '{"releaseId":"2026-08-11-placeholder-printables"}' --prod
```

Stop unless:

- `releaseApplied` is `false`;
- `publishedPrintableSlugs` contains exactly the 12 slugs above;
- every target is found, `published`, and at the reported revision;
- every target has `approvedPayloads: 0`;
- every target has `previewSeedReady: true`.

Copy the reported revisions; do not use an earlier snapshot.

## 2. Authorized atomic withdrawal

Pass the exact target set as
`{slug, expectedReviewRevision: reviewRevision}`:

```sh
CONVEX_DEPLOYMENT=prod:graceful-possum-566 \
  npx convex run seed:applyPrintablePayloadRelease \
  '{"releaseId":"2026-08-11-placeholder-printables","targets":[...]}' \
  --prod
```

Expected first-run result: `alreadyApplied: false`, `staged: 12`, `total: 12`.
The mutation validates the complete published printable set, every revision,
the reviewed seed and the continued absence of an approved payload before the
first write. A mismatch aborts the transaction. A verified repeat is
idempotent.

## 3. Postflight

Require all 12 rows to be `clinical_review` at revision 2 with exact preview-only
seed metadata. Require zero published printable rows until accurate preview
metadata has completed education review or actual bilingual PDFs have been
attached and reviewed.

With a non-staff identity, verify all 12 slugs are absent from lists/search,
direct detail is restricted, media/evidence are empty, and the complete
publication manifest contains none of them. A previously synced device must
reconnect once to withdraw the old rows and cached media before offline testing.

This release does not fabricate PDF content from cover illustrations and does
not label printable metadata clinically approved.
