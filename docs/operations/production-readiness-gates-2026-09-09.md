# Production readiness gates — 2026-09-09

This is a read-only release record. It is not authorization to mutate
Production Convex, rotate credentials, deploy, merge, sign an Android bundle or
publish a store release. Run the accompanying check with:

```sh
node scripts/production-release-readiness.mjs
```

The command is pinned to the v2 owner preflight and the 2026-09-09 AI
diagnostic preflight in this branch. Those functions must first be reviewed and
deployed dark; an unavailable function is a tool/configuration failure, not a
reason to fall back to the drifted v1 release.

The script invokes only Convex queries, inspects local files and performs one
public HTTP GET. Exit `2` means an action gate remains blocked; it is not a tool
failure. `--json` produces machine-readable evidence and
`--skip-play-listing` deliberately leaves the public Android listing unverified.
Android can only pass when `--android-validation-inputs` supplies the exact
candidate, bundletool, previous accepted bundle, fresh Play maximum and approved
artifact/certificate hashes. The overall command reruns the dedicated validator;
it never upgrades a shallow `jarsigner` result into release evidence.

## Current verdict

The existing human-reviewed web catalogue and iOS application may continue to
serve customers. Do not describe the product as fully production-ready yet:

- the duplicate owner login is safely quarantined but not consolidated;
- the enabled three-item AI preview release has fail-closed snapshot drift;
- 297 library rows remain intentionally unpublished and no clinical batch is
  active;
- an exact source-bound Android candidate plus its mandatory validation evidence
  has not been assembled, and the public Play listing returns HTTP 404;
- the paid-access Terms are still explicitly a non-binding draft; payment
  consent text must not be treated as a completed legal publication.

These are separate gates. Passing one never implies another passed.

## Gate 0 — paid-access Terms

`src/domain/legalRelease.ts` records the current Terms as
`draft-2026-08-05`, with no effective date or publication time. The public page
correctly warns that it is not binding, while checkout currently asks customers
to agree to it. Code agents must not silently remove that warning.

Owner/legal review must approve the exact Myanmar and English text, the refund
and payment wording, governing terms, effective date, and version. Publish that
approved version as a separate release, then verify the signed-out Terms route
in both locales and preserve the approved document/version evidence.

## Gate 1 — duplicate owner consolidation

The exact Production preflight at the time of this record returned `blocked`:

- `canonical target user preimage drifted`;
- `quarantine postimage or final preimage drifted`;
- both Google and password accounts point to the canonical target;
- the quarantined source has zero auth accounts, sessions, refresh tokens and
  verifiers;
- the source private data is still preserved: one profile, one subscription,
  one child, 16 activity completions and one notification;
- the canonical target is actively changing and reports eight references that
  the frozen v1 migration did not support.

Do **not** run `ownerAccountMerge:apply` for v1 and do not edit v1 constants to
make the changed state pass. This branch prepares immutable successor
`owner-account-merge-lapyaewun2690-2026-09-09-v2`. It freezes the exact core
preimage/postimage, the eight populated target-owner reference sets, and checks
all 30 other source-user reference categories. Any new source credential,
verification code, row digest, target reference, or unexpected source reference
makes the transaction fail closed.

1. Review and merge the v2 code and its exact frozen digests without editing
   the historical v1 release.
2. Deploy the v2 query/mutation dark. Run only its read-only Production
   preflight and stop unless it returns exactly `finalize_ready` with no blocker.
3. Obtain an action-time Owner confirmation for that exact release ID. Apply
   once, immediately run postflight, then test Google and password sign-in
   separately against the one canonical account.

Customer activity on the canonical account can change this snapshot again. A
fresh exact preflight is mandatory immediately before any v2 apply.

## Gate 1A — paid checkout capability

The public Terms and signed-in checkout now consume Boolean-only capability
flags. Myan Myan Pay is advertised only when `MMPAY_ENV=production`, every
production credential/config value is present, both URLs use HTTPS, and the
keys do not look like test keys. Manual transfer is advertised only when an
active payment method row exists. No credential or transfer destination is
exposed by the public capability query.

After the backend is deployed dark, rerun the overall readiness command and
read back `billing:paymentCapabilities`. Before web promotion, also perform a
fresh non-charging production-provider smoke and verify that the production
webhook reaches the expected endpoint. A syntactically valid configuration is
not proof of provider reachability, and a sandbox configuration must never be
shown to customers.

## Gate 2 — AI preview release

Production has one enabled AI publication control and three rows marked
`active`, but `aiPublication:preflight` returns `phase: "drift"`; all three
targets return `appliedExact: false`:

- `lsn_early_math`;
- `st_waiting_at_clinic`;
- `st_first_day_school`.

The content and link timestamps still match the 2026-08-19 release. Each
evidence source was edited later than the source snapshot frozen at
`2026-08-19T06:16:50.772Z`:

| Target | Source | Live source update |
| --- | --- | --- |
| `lsn_early_math` | `us-hhs-head-start-elof-2015` | `2026-08-24T04:09:52.518Z` |
| `st_waiting_at_clinic` | `nhs-alder-hey-outpatient-2023` | `2026-08-21T13:24:43.279Z` |
| `st_first_day_school` | `us-hhs-head-start-first-day-jitters-2024` | `2026-08-21T13:25:05.972Z` |

The shared visibility gate therefore refuses the AI lane even though the
database control says enabled. This is the intended fail-closed behavior; do
not claim the three previews are parent-readable based only on `status: active`.

The 2026-09-09 diagnostic successor deliberately assigns `blocked` to
`lsn_early_math`: its frozen human-review note names an unrelated UNICEF report.
Both enabled and disabled control states therefore remain `phase: "blocked"`;
the diagnostic has no mutation companion and cannot activate.

Choose one explicit remediation before 2026-11-17:

- **Withdraw:** emergency-disable, read back that the three slugs disappeared
  from connected list/detail/manifest paths, then revoke the old release while
  preserving audits.
- **Corrected successor release:** a qualified reviewer first corrects the
  unrelated early-math review note, then a new release ID re-audits and freezes
  the exact current content, evidence links and source rows. Deploy that new
  generation dark, exact-preflight, activate with a fresh control generation,
  then verify list, detail, citations, media and offline withdrawal.
- **Human review:** move each item through the normal qualified human review
  and evidence gates. An AI audit must never be converted into a human approval.

Updating the old release hashes or timestamps in place is forbidden because it
would sever the recorded audit from the material it actually assessed.

## Gate 3 — clinical and evidence backlog

The bounded Production snapshot contains 445 library rows:

- 90 `published`;
- 297 `clinical_review`;
- 57 `archived`;
- 1 `draft`.

All four historical `stopped_changes_requested` batches have completed
corrective successors. There is no active batch. The raw 600-decision history
contains 588 approvals, four change requests and eight `in_review` rows, but
those raw historical decisions are not eight current assignments. Do not use
the decision total as a live queue count.

The evidence registry has 108 approved sources and one awaiting source,
`tb-swaiman-7e-2025`. That source is unlinked, so it does not block the current
published catalogue. It remains a separate qualified-review task.

The 297 `clinical_review` rows are safe because they are not public. Publishing
more of them requires a new code-frozen, bounded registry release with explicit
assignees, exact revision/source snapshots and qualified human decisions. Do
not bulk-approve them from the aggregate counts.

## Gate 4 — Android release and Google Play

The checked-in Android project currently has:

- application ID `mm.com.acegroup.acechildgrow`;
- `versionCode 13`, `versionName 1.12`;
- compile/target SDK 36;
- release minification and resource shrinking enabled;
- no copied web bundle, local release AAB or upload-signing variables in this
  clean operator checkout;
- no public Play listing at the package URL (HTTP 404 at this check).

Keystore files are now explicitly ignored by `android/.gitignore`. Never paste,
commit, log or attach the keystore or its passwords.

Complete Android one gate at a time:

1. In Play Console, read the highest version code already uploaded and confirm
   the package/application identity. Bump the repository version code only if
   13 is unavailable.
2. On the authorized signing machine, provide all four variables:
   `ACE_ANDROID_UPLOAD_STORE_FILE`, `ACE_ANDROID_UPLOAD_STORE_PASSWORD`,
   `ACE_ANDROID_UPLOAD_KEY_ALIAS`, `ACE_ANDROID_UPLOAD_KEY_PASSWORD`.
3. Run unit/type/lint/build verification, then `npm run android:bundle`.
4. Run `scripts/validate-android-release.mjs` with bundletool, the previous
   accepted AAB, fresh Play maximum and the approved AAB/certificate hashes;
   then pass the same exact inputs to the overall production-readiness command.
   Test that exact signed artifact through an internal Play track on a real
   supported device.
5. Complete and read back Play App content, privacy policy, Data safety, target
   audience, content rating, store listing, screenshots and testing/production
   track requirements. Any declared push-notification feature also requires
   the matching `google-services.json` and an exact packaged-device test.
6. Obtain explicit publication approval for the exact AAB hash and Play release
   state. Uploading, promoting and publishing are distinct external actions.
7. After Play reports the release available, verify the public package URL from
   a signed-out session and install that processed Play artifact. A local AAB or
   an uploaded draft does not prove public distribution.

## Evidence preservation

For every mutating successor release, store the exact commit, deployment IDs,
preflight output, approved release/hash, mutation result, postflight output and
signed-in smoke-test evidence. Never store credential values in the record.
