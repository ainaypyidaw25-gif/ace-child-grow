# App Store release checklist

Status date: 2026-08-04

This document tracks a draft handoff. A checked item must be supported by the
current branch or by a recorded verification run; it does not mean that the app
has been deployed, uploaded, or submitted.

## Apple account and legal entity

- [ ] Sign in to Xcode with the Apple Developer team owner's Apple ID after
      action-time confirmation from the account owner.
- [ ] Complete password and two-factor authentication personally; do not store
      either in this repository.
- [ ] Confirm that the Apple Developer team is an **Organization** membership
      whose legal entity is `AI NAYPYITAW COMPANY LIMITED`.
- [ ] If the team is an Individual membership or the seller name does not match
      the operating legal entity, stop before submission and resolve membership.
- [ ] Accept any new Apple agreement only after the account owner reviews and
      confirms it at action time.

## Signing and App Store Connect

- [ ] Select the correct Development Team in Xcode.
- [ ] Confirm automatic signing creates a valid App Store distribution profile.
- [ ] Confirm bundle ID `mm.com.acegroup.acechildgrow` is available to this team.
- [ ] Create or verify the App Store Connect app record.
- [ ] Use version `1.5`, build `7`, and SKU `ACECHILDGROW-IOS-001` unless an
      existing record requires different values.
- [ ] Archive a Release build on a physical-device destination.
- [ ] Validate the archive in Xcode Organizer.
- [ ] Review Xcode's generated privacy report and resolve every warning.
- [ ] Upload to App Store Connect and complete TestFlight processing.

## Product and compliance

- [x] Google sign-in is hidden in the App Store build; first-party email/PIN
      login remains.
- [x] Staff and admin entry points are removed from the App Store build.
- [x] Premium, appointment, report, offline-download, and external-payment routes
      are removed from the store distribution bundle.
- [ ] Confirm the App privacy manifest against the final Xcode privacy report and
      the App Store Connect privacy questionnaire.
- [x] Verify the compiled iOS web bundle contains no MMQR, Myan Myan Pay, manual
      transfer, payment-screen, subscription-screen, or admin-workspace module.
- [x] Verify full account deletion removes all associated personal and child
      records; run the dedicated deletion tests.
- [x] Verify only published, reviewer-approved educational content appears.
- [x] Verify incomplete printables and placeholder features are hidden.
- [ ] Obtain clinical-owner sign-off on the shipped skill-loss and emergency
      rules. This App Store handoff does not alter those clinical rules.
- [x] Add a public methodology/source explanation with non-diagnostic language
      to this branch.
- [ ] Obtain qualified content review before making clinical-accuracy claims.
- [ ] Review npm advisory `GHSA-qwww-vcr4-c8h2` before the final archive. The
      reported React Router issue concerns RSC actions, which this client-side
      Vite app does not use, but the high-severity audit finding must still be
      recorded and dispositioned rather than auto-fixed with a forced downgrade.
- [ ] Complete the Regulated Medical Device declaration accurately. Do not claim
      that ACE Child Grow is a regulated medical device without documentation.
- [ ] Complete App Privacy answers to match the final archive and backend.
- [ ] Complete the age-rating questionnaire as a parent/caregiver app; do not
      select Made for Kids.
- [ ] Confirm content-rights answers for all illustrations, lessons, and sources.

## Public services

- [ ] Deploy only after the App Store handoff is approved and merged.
- [ ] Verify `https://child.acegroup.com.mm/privacy` loads without sign-in.
- [ ] Verify `https://child.acegroup.com.mm/account-deletion` loads without
      sign-in and matches the implemented deletion behaviour.
- [ ] Verify `https://child.acegroup.com.mm/support` loads without sign-in.
- [ ] Confirm the support email shown on the public page is actively monitored.
- [ ] Keep the production backend, authentication email delivery, and published
      content available throughout App Review.

Verification note (2026-08-04): the live Privacy and Account Deletion routes
load, but they still show the pre-handoff copy. The Support route is not yet
rendering the new support page. Keep all three URL gates unchecked until an
approved merge and deployment are complete.

## Review account and QA

- [ ] Create a dedicated, non-expiring App Review parent account using a
      company-controlled email address.
- [ ] Use a fictional child name and fictional records only.
- [ ] Put the review email and PIN only in App Store Connect's Review Information;
      never commit the PIN.
- [ ] Test onboarding, sign-in, reset code, child profile, milestone review,
      activities, growth, sleep, health records, library, support, export, and
      account deletion on a physical iPhone.
- [ ] Test all layouts on an iPad if iPad remains in Targeted Device Family.
- [ ] Confirm relaunch, poor network, offline recovery, and deep-link behaviour.
- [ ] Run accessibility checks for Dynamic Type, VoiceOver labels, contrast, and
      minimum touch targets.

## Screenshots and metadata

- [ ] Capture 4-6 real feature screenshots using fictional data; a login-only
      screenshot is not sufficient.
- [x] The placeholder 6.9-inch iPhone login screenshot is `1320 x 2868`.
- [x] The placeholder 13-inch iPad login screenshot is `2064 x 2752`.
- [x] Current placeholder screenshots are JPEG files with no alpha channel.
- [ ] Replace or approve the current app icon as a full-bleed square asset
      without a baked-in rounded border before the final archive.
- [ ] Review `metadata-en-GB.md` and localise the final metadata if desired.
- [ ] Enter review contact name, phone, and monitored email in App Store Connect.
- [ ] Confirm Support URL, Privacy URL, copyright, categories, keywords, and
      description are final.

## Submission gates

- [ ] A human tester has completed TestFlight QA on a physical iPhone.
- [ ] There are no Xcode validation, privacy, or signing errors.
- [ ] All App Store Connect required fields show complete.
- [ ] The account owner gives explicit action-time confirmation before the final
      **Submit for Review** action.

## Automated handoff verification (2026-08-04)

- [x] TypeScript typecheck and lint pass.
- [x] Full unit suite passes: 105 test files, 1,055 tests.
- [x] App Store web build succeeds and the PWA precache accepts 199 entries.
- [x] Capacitor iOS sync includes both App and Network plugins.
- [x] Unsigned Release simulator build succeeds in Xcode 26.6.
- [x] Info.plist, PrivacyInfo.xcprivacy and workspace plist pass plist lint.
- [ ] Signed physical-device archive, Organizer validation and TestFlight QA
      remain owner/team actions.
