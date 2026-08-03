# ACE Child Grow — Published Language-Development Lesson Illustration Review

Status: **OWNER APPROVED — RELEASE AUTHORIZED**

Source of truth: Production Convex `libraryContent`, filtered to `type = lesson`, `category = language_development`, and `clinicalStatus = published`. Read on 2026-08-03. Production contains exactly one matching published record. `ageGroupKey` and separate safety guidance are unavailable in the production record.

## Pre-generation review

| Slug | Lesson meaning | Primary visual message | Scene | Must not show | Status |
|---|---|---|---|---|---|
| `lsn_language_rich_home` | Daily talking, singing, and storytelling enrich language; raising a child with two languages is an asset, not confusing. | A caregiver sings one song face-to-face with the child today. | One Myanmar caregiver and one child seated safely at floor level in a warm home, sharing eye contact while the caregiver sings and the child engages. | Text, speech bubbles, language labels, screens, books, toys, instruments, unrelated actions, or age-specific advanced speech. | READY |

## `lsn_language_rich_home`

- Myanmar title: ဘာသာစကား ကြွယ်ဝသော အိမ်
- English title: A language-rich home
- Myanmar summary: သီချင်း၊ ပုံပြင်နှင့် စကားပြောဖြင့် ဘာသာစကား တည်ဆောက်ခြင်း။
- English summary: Build language with songs, stories, and talk.
- Objective: ဘာသာစကား ကြွယ်ဝစေမည့် အလေ့အထ သိရှိရန်။ / Learn language-building habits.
- Myanmar body: သီချင်းဆိုခြင်း၊ ပုံပြင်ပြောခြင်း၊ နေ့စဉ်လုပ်ဆောင်ချက်များကို စကားဖြင့် ရှင်းပြခြင်းက ဘာသာစကားကို ကြွယ်ဝစေသည်။ ဘာသာစကား ၂ မျိုး သင်ခြင်းသည် ကလေးကို မရှုပ်ထွေးစေပါ — အားသာချက် တစ်ခုပင်ဖြစ်သည်။
- English body: Singing, storytelling, and narrating daily actions enrich language. Two languages do not confuse a child — it is an asset.
- Takeaway: စကားပြော၊ သီချင်းဆို၊ ပုံပြင်ပြော — နေ့စဉ်လုပ်ပါ။ / Talk, sing, tell stories — daily.
- Action today: ယနေ့ ကလေးနှင့်အတူ သီချင်းတစ်ပုဒ် ဆိုပါ။ / Sing one song with your child today.
- Category: `language_development`
- Age group: unavailable / unassigned in Production Convex
- Safety guidance: unavailable as a separate production field; the selected scene stays at floor level and contains no unsafe object or action.
- Publication status: `published`
- Asset: `/lessons/language_development/lsn_language_rich_home.5490311de9.webp`

![Myanmar caregiver singing face-to-face with a child](../../public/lessons/language_development/lsn_language_rich_home.5490311de9.webp)

## Image QA

- Main lesson meaning is visible: **PASS**
- Primary action matches `actionToday`: **PASS** — one caregiver sings face-to-face with one child
- Child age handling: **PASS** — general early-childhood proportions; no unassigned age was invented and no advanced milestone is implied
- Caregiver role and gaze: **PASS**
- Anatomy, hands, fingers, legs, and feet: **PASS**
- Facial expressions: **PASS** — calm, warm, mutually engaged
- No unrelated action or unsafe object: **PASS**
- No medical overclaim or stereotype: **PASS**
- No text, label, logo, or watermark: **PASS**
- Myanmar/Southeast Asian cultural fit: **PASS**
- Landscape 4:3 WebP, 1200×900, 139,410 bytes: **PASS**
- Exact slug mapping with no category fallback: **PASS**

Final result: **OWNER APPROVED**

## Engineering verification

- Focused exact-slug mapping tests: **PASS** — 4 tests
- Full unit suite: **PASS** — 96 test files / 967 tests
- Type check and lint: **PASS**
- Production build: **PASS**
- Asset-related build warnings or missing imports: **NONE**
- PWA precache: **PASS** — the exact versioned lesson asset is present in `dist/sw.js`
- Mobile/desktop browser capture: **BLOCKED** — the in-app browser's admin-enforced security policy could not be verified, so it refused application-page inspection. The control was not bypassed. The final 1200×900 asset preview above remains available for owner review.

Deployment approval: **GRANTED BY OWNER ON 2026-08-03** — production release tracked through the repository PR and deployment history.
