# App Store release checklist

Status date: 2026-10-08

This checklist separates repository verification from Apple-account, signing,
device, privacy, clinical and submission gates. A checked item proves only the
scope stated beside it. It never implies upload, submission, approval or public
release.

## Candidate identity and repository scope

- [x] Remote repository verified as `ainaypyidaw25-gif/ace-child-grow`.
- [x] Candidate starts from remote `main` commit
      `187b06665e4894fda2f7008139be40216381da21`.
- [x] Xcode source declares bundle ID `mm.com.acegroup.acechildgrow`, version
      `1.5`, build `10` and iOS deployment target `15.0`.
- [x] The current Xcode project, privacy manifest, AppDelegate and native
      build settings come from current `main`; the August PR #97 project is not
      restored wholesale.
- [x] Sign in with Apple and Universal Links entitlements remain attached to
      both Xcode configurations.
- [x] The production AASA source binds
      `QK8ZAZ4RHW.mm.com.acegroup.acechildgrow` to `/`.
- [x] The App Store candidate preserves current public support, privacy,
      account-deletion, content-policy and native-specific Terms routes.

## Native product contract

- [x] Sign in with Apple, Google and parent email/PIN remain available; the
      staff/reviewer portal selector stays out of native-store builds.
- [x] Staff/admin, subscription, external-payment, appointment, report,
      weekly-plan and offline-download routes remain excluded from the native
      store distribution.
- [x] Native-store Terms state that shown parent features are free and contain
      no in-app purchase or external payment flow.
- [x] Saved Activities supports save → open → unsave using stable content
      slugs, entry links from Activities and Profile, and direct `/favorites`
      access.
- [x] Saved Activities uses the parent publication catalogue, does not restore
      sample content, and lets the parent remove unavailable or legacy keys.
- [x] Parent library/detail access remains constrained by the parent-audience
      publication gate.
- [x] The current route guards and newer legal behaviour are retained; August
      route guards are not restored.

## Dependency and source security

- [x] Capacitor npm bridge, Android, iOS and CLI packages are aligned at
      `8.5.1`; the SwiftPM Capacitor pin is aligned to `8.5.1`.
- [x] The native proxy advisory fixed in Capacitor 8.5.1 is no longer present
      in the installed package set.
- [ ] `npm audit --audit-level=high` is clean. Tailwind 3's unresolved
      build-tooling `braces` chain still triggers the repository's existing
      high-severity gate; see
      `docs/operations/dependency-audit-2026-10-07.md`. Do not suppress the
      advisory or silently raise the iOS/browser support floor.
- [ ] Security/product owners approve a compatible remediation (a supported
      Tailwind 3 fix or an explicit Tailwind 4/support-floor migration) before
      a release is declared GO.

## Local engineering verification

The evidence section is updated only with commands run against this replacement
candidate. Historical PR #97 or August QA is not accepted as current evidence.

- [x] Clean dependency installation: `npm ci`.
- [x] Typecheck: `npm run typecheck`.
- [x] Lint: `npm run lint`.
- [x] Full test suite: `npm test`.
- [x] App Store readiness, Saved Activities and Capacitor-alignment focused
      tests pass.
- [x] Web-only legal/payment-copy tests pass separately without the App Store
      distribution flag.
- [x] App Store production build:
      `VITE_DISTRIBUTION=app-store npm run build`.
- [x] Capacitor iOS sync: `npx cap sync ios` after the App Store build.
- [x] Bounded compiled-bundle scan finds no excluded payment/admin component or
      payment-provider markers. Guarded route literals such as `/admin`,
      `/subscription` and `/payment/` remain expected because native builds
      redirect those routes to Home.
- [x] `plutil` validates Info.plist, PrivacyInfo.xcprivacy, entitlements and
      workspace settings.
- [x] Dependency-alignment contract test passes.
- [x] Unsigned Release simulator compile succeeds with current macOS/Xcode.

### Verification record

Code-bound candidate: `b5a7069` (`426e739` Saved Activities plus the compatible
Capacitor/dependency repair). The final PR head adds only these handoff
documents; exact-head CI is still required after push.

Environment: macOS 26.6.2 (25G83), Node 24.16.0, npm 11.13.0, Xcode 27.0
(27A266a), iOS Simulator SDK 27.0.

Commands and results run on 2026-10-08:

- `npm ci` — PASS; 733 packages installed. npm reported 10 advisories (5
  moderate, 5 high).
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm audit --audit-level=high` — **FAIL**; the documented Tailwind 3
  build-tooling `braces` chain remains. The threshold and assertions were not
  weakened; no critical advisory remained after the compatible repair.
- `npm test` — PASS; 290 test files and 3,038 tests.
- `VITE_DISTRIBUTION=app-store npx vitest run
  src/app/__tests__/appStoreReadiness.contract.test.ts
  src/screens/__tests__/SavedActivities.flow.test.tsx
  src/domain/__tests__/capacitorDependencyAlignment.test.ts` — PASS; 3 files
  and 15 tests.
- `npx vitest run src/screens/__tests__/LegalPage.locale.test.tsx` — PASS; 1
  file and 10 tests.
- `VITE_DISTRIBUTION=app-store npm run build` — PASS; Vite 7.3.6 transformed
  328 modules and generated 329 PWA precache entries (30,412.97 KiB). Vite
  emitted the existing static/dynamic `convexClient` import warning without a
  build failure.
- `npx cap sync ios` — PASS in 0.163 seconds; detected `@capacitor/app@8.0.1`
  and `@capacitor/network@8.0.1` against Capacitor core/iOS 8.5.1.
- Bounded `dist/assets/*.js` marker scan — PASS for excluded component/provider
  markers `AdminReviewQueue`, `ContentReviewWorkspace`, `SubscriptionPlans`,
  `PaymentStatus`, `OfflineDownloads`, `LibraryAdmin`, `EvidenceAdmin`,
  `AdminTeam`, `AdminDirectory`, `AdminBilling`, `AuditLog`, `mmpay`, `MMQR`,
  `Myan Myan Pay` and `manual transfer`. Expected redirect route literals were
  present.
- `plutil -lint` on Info.plist, PrivacyInfo.xcprivacy, App.entitlements and
  IDEWorkspaceChecks.plist — PASS.
- `npm ls @capacitor/core @capacitor/cli @capacitor/ios @capacitor/app
  @capacitor/network` — PASS; core/CLI/iOS 8.5.1, plugins 8.0.1, all plugins
  deduplicated to core 8.5.1.
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator'
  -derivedDataPath /private/tmp/ace-ios-handoff-refresh.9BfrHU/DerivedData
  CODE_SIGNING_ALLOWED=NO build` — PASS (`** BUILD SUCCEEDED **`). SwiftPM
  resolved Capacitor 8.5.1. Non-blocking warnings concerned empty run-destination
  metadata, XCFramework identity metadata and skipped AppIntents extraction.

Exploratory failure retained: a first command incorrectly ran
`LegalPage.locale.test.tsx` with `VITE_DISTRIBUTION=app-store`. Four of its ten
web-only payment-copy assertions failed because the native distribution
intentionally renders the free native Terms branch (overall 21 passed, 4
failed). The test was not changed or weakened; it passed when rerun in its web
distribution, while the native-specific contracts passed under the App Store
flag as recorded above.

Initial pushed PR head `1f07dd0569a0f6574fd2255c89a6f92d8848d86b` produced
the following hosted evidence:

- Playwright — PASS.
- CodeQL JavaScript/TypeScript analysis and CodeQL summary — PASS.
- Vercel preview build and preview-comment integration — PASS. This preview is
  build evidence only; it is not an authorised production deployment or iOS
  release.
- `Typecheck, lint, unit tests, build` — **FAIL at its first substantive step,
  `npm audit --audit-level=high`**. The log reports the same 10 findings (5
  moderate, 5 high) documented above. Later job steps were skipped, not failed;
  local runs supply their results but do not replace a green hosted gate.

The final document-only head must retain these findings and receive its own
hosted check run. No failing gate may be reclassified as passing.

## Apple account, signing and privacy gates — NOT VERIFIED

- [ ] Confirm the Team ID in the signed archive and the live Apple Developer
      account; repository AASA source alone is not Apple-account proof.
- [ ] Confirm seller/legal entity, agreements, tax/banking and account-holder
      authority in App Store Connect.
- [ ] Confirm bundle ID and capabilities exist on the intended Apple team.
- [ ] Resolve signing and create a valid App Store distribution profile.
- [ ] Archive a signed Release build for a physical-device destination.
- [ ] Validate the archive in Xcode Organizer and review its generated privacy
      report and SDK signatures.
- [ ] Reconcile the final archive, backend and App Store Connect privacy
      questionnaire with the privacy owner.
- [ ] Verify the public marketing, privacy, deletion and support URLs from a
      signed-out browser and confirm the support mailbox is monitored.
- [ ] Confirm current copyright, categories, age rating, content rights and
      export-compliance answers in App Store Connect.

## Content and product gates — NOT VERIFIED

- [ ] Qualified clinical-safety owner approves the exact shipped clinical and
      emergency guidance.
- [ ] Evidence/content owner approves the exact parent catalogue selected for
      the release.
- [ ] Native Myanmar-language editor approves the exact shipped Myanmar copy.
- [ ] Product/privacy owners approve the final feature, legal and disclosure
      presentation.
- [ ] Replace or approve store screenshots using the final signed build and
      fictional data; no August screenshot is treated as current evidence.
- [ ] Verify the final app icon and all required screenshot sizes in App Store
      Connect.

## Review account and physical-device QA — NOT VERIFIED

- [ ] Create and test a dedicated, non-expiring parent review account with
      fictional child data; store the credential only in App Store Connect.
- [ ] Test Apple, Google and email/PIN sign-in and recovery on a physical
      iPhone, including OAuth callback, relaunch and Universal Links.
- [ ] Test onboarding, child profile, milestones, Activities, Saved Activities,
      growth, sleep, health records, library, support, export and deletion on a
      physical iPhone.
- [ ] Test iPad layouts if iPad remains in Targeted Device Family.
- [ ] Test poor network, offline/recovery, cold start, deep links and withdrawn
      saved-content handling.
- [ ] Complete Dynamic Type, VoiceOver, contrast and minimum-touch-target QA.
- [ ] Complete TestFlight QA against the exact uploaded build.

## Prohibited in this handoff

- [ ] Merge the replacement PR.
- [ ] Deploy web/Convex changes or mutate production data.
- [ ] Sign or upload an archive.
- [ ] Change Apple agreements or App Store Connect answers.
- [ ] Submit for App Review or release publicly.

Every prohibited action requires separate explicit approval at action time.
