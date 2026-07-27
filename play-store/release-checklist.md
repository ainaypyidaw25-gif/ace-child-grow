# ACE Child Grow — Google Play release record

- Package: `mm.com.acegroup.acechildgrow`
- App category: Parenting
- Target audience: adults (parents/caregivers), 18+
- Ads: none
- Target SDK: 36
- Privacy policy: `https://child.acegroup.com.mm/privacy`
- Account deletion: `https://child.acegroup.com.mm/account-deletion`
- Health declaration: Medical Reference & Education; Sleep Management; Nutrition & Weight Management; Healthcare Services (directory only)
- Medical-device claim: no
- Data sale / advertising: no
- Login required: yes; provide a reusable review account in Play Console App access
- Payment: Android release does not expose Myan Myan Pay or other external digital purchase checkout. Google Play Billing must be completed before selling Premium in the Play build.

## Data safety working answers

Collected and account-associated: email address; child nickname and date of birth; user-provided growth, sleep, development, appointments, notes, favourites, subscription/payment history. Purposes: app functionality, account management, and user-requested records. Data is encrypted in transit. Users can request deletion through the app and public deletion page. No advertising SDK, location, contacts, microphone, camera, or advertising ID is requested by the Android manifest.

## Console-only gates

1. Confirm developer account identity and account type.
2. Create app with the exact package ID above and enable Play App Signing.
3. Add the Play App Signing SHA-256 certificate to `public/.well-known/assetlinks.json` after the first AAB upload.
4. Add a reusable review login and English access instructions.
5. If this is a new personal developer account, complete the required closed test before production access.
