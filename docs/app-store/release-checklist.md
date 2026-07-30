# App Store release checklist

Status date: 2026-07-30

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
- [x] App privacy manifest declares no tracking and the currently collected data
      categories.
- [x] Verify the compiled iOS web bundle contains no MMQR, Myan Myan Pay, manual
      transfer, purchase, Premium, or admin implementation code/copy.
- [x] Verify full account deletion removes all associated personal and child
      records; run the dedicated deletion tests.
- [x] Verify only published, reviewer-approved educational content appears.
- [x] Hide incomplete printables and any placeholder or "coming soon" feature.
- [x] Confirm skill-loss guidance recommends professional assessment and only
      acute emergency signs trigger emergency instructions.
- [x] Add a public methodology/source explanation with non-diagnostic language.
- [ ] Obtain qualified content review before making clinical-accuracy claims.
- [ ] Complete the Regulated Medical Device declaration accurately. Do not claim
      that ACE Child Grow is a regulated medical device without documentation.
- [ ] Complete App Privacy answers to match the final archive and backend.
- [ ] Complete the age-rating questionnaire as a parent/caregiver app; do not
      select Made for Kids.
- [ ] Confirm content-rights answers for all illustrations, lessons, and sources.

## Public services

- [x] Deploy the current production web build.
- [x] Verify `https://child.acegroup.com.mm/privacy` loads without sign-in.
- [x] Verify `https://child.acegroup.com.mm/account-deletion` loads without
      sign-in and matches the implemented deletion behaviour.
- [x] Verify `https://child.acegroup.com.mm/support` loads without sign-in.
- [ ] Confirm the support email shown on the public page is actively monitored.
- [ ] Keep the production backend, authentication email delivery, and published
      content available throughout App Review.

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
- [ ] Supply at least one accepted 6.9-inch iPhone portrait size. Current target:
      `1320 x 2868`.
- [ ] If iPad support remains enabled, supply 13-inch iPad portrait screenshots
      at `2064 x 2752` or `2048 x 2732`.
- [ ] Export screenshots as PNG or JPEG with no alpha channel.
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
