# Android release validation

This is the fail-closed gate for an ACE Child Grow Google Play App Bundle. It
does not build, sign, upload or publish anything.

## Before building

1. Read the highest version code already present in Google Play Console and set
   it as `ACE_ANDROID_PLAY_MAX_VERSION_CODE`.
2. Start from the exact reviewed release commit, with a clean worktree.
3. Set a `versionCode` greater than the Play Console maximum and set the intended
   `versionName` in `android/app/build.gradle`.
4. Keep the upload keystore outside the repository. Supply its path, alias and
   passwords only through the four `ACE_ANDROID_UPLOAD_*` environment variables.
   Never paste those values into logs, tickets, commits or release notes.
5. Run the repository tests, typecheck, lint and web build before
   `npm run android:bundle`.
6. Set `ACE_ANDROID_SOURCE_COMMIT` to the exact 40-character reviewed commit.
   Every Gradle release bundle/assemble/package task runs a fail-closed source
   preflight before task execution. Packaging fails when the value is absent or
   differs from Git `HEAD`, the worktree has tracked or untracked changes, the
   fresh Play maximum is absent, or the checked-in version code does not exceed
   that maximum. The reviewed commit is embedded as non-secret manifest metadata
   so the post-build validator can bind the AAB back to that exact source.

The Android release web build has one controlled Vite input file:
`.env.production`. It must be a tracked regular file containing exactly the
literal `VITE_CONVEX_URL` and `VITE_DEFAULT_LOCALE` keys. Variable expansion is
blocked. `.env`, `.env.local` and `.env.production.local` must not exist, even
when Git ignores them. Process-level `VITE_*` overrides are also blocked except
for `VITE_DISTRIBUTION=play-store`, which the `android:bundle` command fixes for
both the pre-build and Gradle checks. The preflight prints the non-secret SHA-256
of the tracked production environment file so it can be retained with release
evidence without logging any environment values.

For example, after recording the fresh Play maximum and committing every
reviewed release change:

```sh
export ACE_ANDROID_PLAY_MAX_VERSION_CODE=PLAY_CONSOLE_MAX_CODE
export ACE_ANDROID_SOURCE_COMMIT=EXACT_40_CHARACTER_REVIEWED_COMMIT
npm run android:bundle
```

Do not reuse a previous local bundle just because its version code is higher.
The preflight and the post-build validator must both bind the successor artifact
to the current reviewed commit.

## Validate the exact AAB

Download the current `bundletool-all-*.jar` from the official
`google/bundletool` release page and verify the published SHA-256 digest. Then
run:

```sh
node scripts/validate-android-release.mjs \
  --bundle /absolute/path/app-release.aab \
  --bundletool /absolute/path/bundletool-all.jar \
  --previous-bundle /absolute/path/previous-accepted.aab \
  --play-max-version-code PLAY_CONSOLE_MAX_CODE \
  --expected-sha256 OWNER_APPROVED_AAB_SHA256 \
  --expected-cert-sha256 APPROVED_UPLOAD_CERT_SHA256
```

The validator blocks upload unless every listed input is supplied and all
release checks pass. Omitting the previous bundle, fresh Play maximum, approved
AAB hash, or approved certificate hash produces a blocked result, never
`READY`:

- Bundletool accepts the AAB structure;
- the JAR signature verifies without unsigned entries, and the upload
  certificate is currently within its UTC validity window;
- package, version code and version name match the checked-in Gradle source;
- the embedded source commit matches the clean checked-out commit;
- the candidate signer matches the previous accepted AAB;
- the exact AAB hash and signer fingerprint match the approval record;
- the version code exceeds the Play Console maximum.

The certificate comparison uses only the public SHA-256 fingerprint. It never
opens the keystore or reads a password.

## Include Android in the overall readiness report

The overall readiness command never accepts a shallow `jarsigner` result as
proof. Give it a JSON file containing the exact non-secret validator inputs so
it can rerun this dedicated validator itself:

```json
{
  "bundle": "/absolute/path/app-release.aab",
  "bundletool": "/absolute/path/bundletool-all.jar",
  "previousBundle": "/absolute/path/previous-accepted.aab",
  "playMaxVersionCode": 13,
  "expectedSha256": "OWNER_APPROVED_AAB_SHA256",
  "expectedCertSha256": "APPROVED_UPLOAD_CERT_SHA256"
}
```

Then run:

```sh
node scripts/production-release-readiness.mjs \
  --android-validation-inputs /absolute/path/android-validation-inputs.json
```

Keep that input file outside the repository. It contains no keystore password,
but it is still release evidence. If the argument or any mandatory field is
missing, Android remains `BLOCKED`. A validator tool/configuration failure exits
`1`; a valid report with any failed gate exits `2`.

## Publication gates

A passing local AAB is not a published Android app. Keep these as separate
evidence-backed actions:

1. Upload the exact approved hash to an internal Play track.
2. Let Google Play finish processing and inspect all automated warnings.
3. Install the Play-processed build on a supported physical device and verify
   sign-in, onboarding, offline recovery, Premium gating, payment return paths,
   privacy links and account deletion.
4. Read back Data safety, target audience, content rating, store listing,
   screenshots and policy declarations against the tested binary.
5. Obtain explicit approval for promotion from the internal track.
6. After rollout, verify the public package URL while signed out and install the
   production-track artifact. Record the Play release ID, commit, AAB SHA-256,
   signer fingerprint and test evidence.

If any value changes after approval, stop and rerun the full gate. Never infer
publication from a local build, an uploaded draft or a successful web deploy.
