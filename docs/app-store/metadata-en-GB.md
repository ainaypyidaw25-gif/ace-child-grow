# App Store metadata handoff (en-GB)

Status date: 2026-10-08

This is a source-backed handoff for the current iOS candidate. It is not proof
of signing, upload, App Store Connect configuration, Apple review, or release.
Values marked **VERIFY IN APP STORE CONNECT** must remain unclaimed until they
are read back from the account and the final archive.

## App information

- Name: `ACE Child Grow`
- Subtitle: `Child development for parents`
- Bundle ID: `mm.com.acegroup.acechildgrow`
- Version: `1.5`
- Build: `10`
- Primary category: `Education` (VERIFY IN APP STORE CONNECT)
- Secondary category: `Health & Fitness` (VERIFY IN APP STORE CONNECT)
- Made for Kids: `No` — the product is designed for parents and caregivers
  (VERIFY IN APP STORE CONNECT).
- Age rating: complete the current questionnaire; do not reuse the August
  suggestion without checking the shipped content and Apple's current form.
- Copyright / seller / legal entity: **VERIFY IN APP STORE CONNECT**.
- SKU: **VERIFY IN APP STORE CONNECT**.

Version and build are read from the current Xcode project. They must also match
the archive selected in App Store Connect before submission.

## URLs

- Marketing URL: `https://child.acegroup.com.mm`
- Privacy Policy URL: `https://child.acegroup.com.mm/privacy`
- Privacy Choices / deletion URL: `https://child.acegroup.com.mm/account-deletion`
- Support URL: `https://child.acegroup.com.mm/support`

These are intended public URLs, not current availability evidence. Verify all
four from a signed-out browser immediately before upload or submission.

## Promotional text

Support your child's early development with bilingual milestone guidance,
age-based activities, saved activities, growth and sleep records, and practical
parent learning.

## Keywords

`parenting,milestone,baby,toddler,growth,sleep,development,Myanmar,Burmese,activities`

## Description

ACE Child Grow helps parents and caregivers support a child's early development
in Myanmar and English.

With ACE Child Grow, you can:

- create a private child profile using a nickname and birth date;
- use published age-based milestone guidance and save observations;
- explore age-based play activities, save them, reopen them and remove them
  from Saved Activities;
- record growth and sleep;
- keep health information and child records available in the parent app;
- read published parent guides, lessons and stories; and
- export or delete your account data.

The App Store distribution is a free parent experience. Staff/admin workspaces,
subscriptions, external payment, appointments, downloadable reports, weekly
plans and offline-download management are excluded from the native-store
bundle and routes.

Parent-facing catalogue queries use the publication gate. Withdrawn or
unavailable saved activities are not reconstructed from local sample data; the
saved list shows them as unavailable and allows the parent to remove the key.

ACE Child Grow is an educational and development-support tool. It does not
diagnose a condition, calculate disease probabilities, prescribe treatment, or
replace a qualified health professional. Seek professional or emergency care
whenever you are concerned about a child.

ACE Child Grow သည် မိဘနှင့် ပြုစုစောင့်ရှောက်သူများအတွက် ကလေး၏ အစောပိုင်း
ဖွံ့ဖြိုးမှု၊ ကစားလှုပ်ရှားမှု၊ ကြီးထွားမှု၊ အိပ်စက်မှုနှင့် မှတ်တမ်းများကို မြန်မာနှင့်
English နှစ်ဘာသာဖြင့် ကူညီပေးပါသည်။ ဤ app သည် ရောဂါရှာဖွေဖော်ထုတ်ခြင်း သို့မဟုတ်
ကုသမှုညွှန်ကြားခြင်း မပြုပါ။

## App Privacy handoff

The committed privacy manifest declares the following data as linked to the
user, used for app functionality (and where declared, product
personalisation), not used for tracking:

- Name and Email Address
- User ID
- Health
- Sensitive Info
- Other User Content
- Product Interaction
- Other Data Types

The manifest declares no tracking domains. This is repository evidence only.
The final archive privacy report, backend behaviour, SDK inventory and App Store
Connect privacy answers still require a human privacy review. Do not infer that
payment data is collected by the App Store build merely because the web service
has payment records; verify the final archive and native-accessible backend
paths.

## Review notes draft

ACE Child Grow is designed for parents and caregivers, not for direct use by
children. Version 1.5 build 10 is a free native-store distribution with no
in-app purchase, subscription purchase, external payment link, staff portal or
admin workflow.

The sign-in screen offers Sign in with Apple, Google, and an email credential
fallback. New parent email accounts use a six-digit PIN. Existing parent
accounts created under the earlier policy can still sign in with their existing
password and can reset to a six-digit PIN. Staff/reviewer account selection is
hidden in the native-store build.

Provide a dedicated parent review account in App Store Connect using fictional
child data only. Put its email and PIN only in App Store Connect Review
Information; never commit credentials here. Apple identity configuration,
review-account operation and the production OAuth callback must be verified on
the signed archive and a physical device.

Account deletion: **Profile → Privacy → Delete account**. The implementation
requires confirmation before deleting the parent account and associated child
records. A signed-out deletion-information route is also present at the URL
above. Final backend deletion behaviour and retention disclosures require the
privacy owner's approval.

Milestone and learning content is educational and non-diagnostic. Only content
that passes the parent publication gate is queried for parent screens. This
engineering gate does not replace qualified clinical, evidence, language or
product approval of the exact shipped content.

