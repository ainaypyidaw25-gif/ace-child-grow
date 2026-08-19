# AI educational preview release — 2026-08-19

This runbook applies only to release `2026-08-19-ai-educational-preview-3` and these compile-time targets:

- `lesson:lsn_early_math`
- `story:st_waiting_at_clinic`
- `story:st_first_day_school`

The lane is advisory AI provenance. It never creates a human `contentReview`, never marks an evidence source `approved`, and never represents clinical review. Do not run `evidence:activate`, `seed:run`, or the generic seed/source/link import paths for this release.

## Expected production preimage

Before staging, `aiPublication:preflight` must report:

- `phase: "ready"`
- `configRows: 0`, `configEnabled: false`
- `sourceRowsFound: 0`
- each target has `releaseRows: 0`, `auditRows: 0`, `initialExact: true`

Any other result is a hard stop. Do not edit the preimage constants to make an unexpected state pass; investigate the production change first.

## Deploy dark

1. Record the exact release commit and confirm remote CI, production build and browser smoke tests passed.
2. Deploy Convex schema/functions and the web app with the Convex environment master absent or false:

   ```sh
   npx convex env set AI_PUBLICATION_ENABLED false --prod
   npx convex deploy
   ```

3. Confirm the existing parent catalogue remains readable and no AI item is visible. The database control is still absent, so the lane is off even if the environment value were accidentally true.
4. Run the exact read-only preflight:

   ```sh
   npx convex run aiPublication:preflight '{"releaseId":"2026-08-19-ai-educational-preview-3"}' --prod
   ```

Proceed only with the exact `ready` result described above.

## Stage while disabled

Set `RELEASE_COMMIT` to the exact 40-character commit deployed in both Convex and the web application, then run the one exact-state mutation:

```sh
npx convex run aiPublication:apply \
  "{\"releaseId\":\"2026-08-19-ai-educational-preview-3\",\"operator\":\"Owner-authorized Codex release operator\",\"gitCommit\":\"$RELEASE_COMMIT\"}" \
  --prod
```

Expected result: three sources, three links, three content revisions, nine audit rows and three releases are created. A second identical call must return `alreadyApplied: true` with zero writes.

Run preflight again. It must report `phase: "applied"`, one release and three audit rows per target, and three exact source rows.

Staging intentionally moves `st_first_day_school` from the conventional human-publication lane to `clinical_review`; it is temporarily parent-hidden until the two-key activation below. The other two targets were already `clinical_review`.

## Activate with two keys

1. Turn on the Convex environment master only after the staged state is exact:

   ```sh
   npx convex env set AI_PUBLICATION_ENABLED true --prod
   npx convex deploy
   ```

2. The database control is still absent, so the lane remains off. Enable it with generation CAS `0`:

   ```sh
   npx convex run aiPublication:enable \
     '{"releaseId":"2026-08-19-ai-educational-preview-3","expectedGeneration":0,"operator":"Owner-authorized Codex release operator","reason":"Enable exactly three disclosed low-risk AI-audited educational previews"}' \
     --prod
   ```

3. Expect `enabled: true`, `generation: 1`, `rowsChanged: 1`. A stale generation or any snapshot/audit/source mismatch must fail without a write.

## Required smoke checks

Using a signed-in non-staff parent account, verify all of the following before declaring success:

- list/search and direct detail show exactly the three allowlisted AI-lane items, with no fourth item;
- `publicationLane` is `ai_audited` and the prominent Myanmar/English disclosure states that there is no clinician or native-Myanmar-editor approval;
- both stories also show the fictional-story disclosure;
- citations expose exactly the pinned source for each target;
- media endpoints do not bypass the shared visibility gate;
- the publication manifest is complete and contains all three slugs;
- offline sync stores the disclosure and removes the rows after a connected kill-switch withdrawal;
- the ordinary human-reviewed catalogue is otherwise unchanged. With the recorded 94-row baseline, the parent-readable total becomes 96: two newly visible items plus one lane migration that remains visible.

Capture the preflight response, activation response, manifest count, three detail screenshots and production deployment identifiers in the release record.

## Emergency rollback

Disable first; this deliberately has no stale-generation requirement:

```sh
npx convex run aiPublication:emergencyDisable \
  '{"releaseId":"2026-08-19-ai-educational-preview-3","operator":"Production rollback operator","reason":"Emergency AI preview withdrawal"}' \
  --prod
```

Immediately verify the connected parent list, details, citations, media and manifest no longer expose the three AI-lane rows. Then preserve the audit history and revoke the release rows:

```sh
npx convex run aiPublication:revoke \
  '{"releaseId":"2026-08-19-ai-educational-preview-3","operator":"Production rollback operator","reason":"Release withdrawn after kill switch"}' \
  --prod
npx convex env set AI_PUBLICATION_ENABLED false --prod
npx convex deploy
```

Already-downloaded content can remain readable while a device is disconnected. It is withdrawn on the next successful reconnect/manifest sync; an offline device cannot be remotely purged instantly.
