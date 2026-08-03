# ACE Child Grow — 3.5 Year Milestone Illustration Review

Status: **OWNER APPROVED — NOT DEPLOYED**

Source of truth: Production Convex `libraryContent`, filtered to `type = milestone`, exact `ageGroupKey = 3_5y`, and `clinicalStatus = published`. Read on 2026-08-03. Production contains exactly three published records for this age group. `summaryMm`, `summaryEn`, `category`, and `safety` are unavailable for all three records.

Each milestone was generated independently with Built-in ImageGen, clinically reviewed, and saved as a unique wordless 1200×900 WebP under 500 KB. Every exact slug maps directly to one exact asset with no domain/category fallback.

## 1. `ms_3_5y_school_readiness_1`

- Myanmar title: ရိုးရှင်းသော စည်းကမ်းများ လိုက်နာခြင်း
- English title: Follows simple group rules
- observeMm: အလှည့်စောင့်ခြင်းကဲ့သို့ ရိုးရှင်းစည်းကမ်းများ လိုက်နာပါသလား။
- observeEn: Takes turns and follows simple rules?
- Meaning: ဤသည်မှာ အုပ်စုဖြင့် သင်ယူရန် ပြင်ဆင်ပေးသည်။ / This prepares for learning in a group.
- Domain: `school_readiness`
- Asset: `/milestones/3_5y/ms_3_5y_school_readiness_1.f32c89f415.webp`

![Three-and-a-half-year-old calmly waiting for a turn in a group](../../public/milestones/3_5y/ms_3_5y_school_readiness_1.f32c89f415.webp)

QA: **READY FOR OWNER REVIEW** — exactly three age-matched children sit together with one ball while the main child watches with empty hands resting calmly on their lap, visibly waiting for a turn. Age, anatomy, hands, feet, gaze, cooperative expression, safe floor setting, cultural fit, uniqueness, and wordless output pass; no grabbing, throwing, running, adult prompt, extra toy, or unrelated action.

## 2. `ms_3_5y_communication_1`

- Myanmar title: “ဘာကြောင့်” မေးခွန်းများ မေးခြင်း
- English title: Asks “why” questions
- observeMm: “ဘာကြောင့်” “ဘယ်လို” မေးခွန်းများ မေးပါသလား။
- observeEn: Asks lots of why/how questions?
- Meaning: မေးခွန်းများသည် သိလိုစိတ်နှင့် ဘာသာစကား တိုးတက်မှုကို ပြသည်။ / Questions show curiosity and language growth.
- Domain: `communication`
- Asset: `/milestones/3_5y/ms_3_5y_communication_1.cb1cef8e04.webp`

![Curious three-and-a-half-year-old asking a parent about a flower](../../public/milestones/3_5y/ms_3_5y_communication_1.cb1cef8e04.webp)

QA: **READY FOR OWNER REVIEW** — child points toward one flower while using a clear questioning mouth shape and direct eye contact with the silent listening parent. Age, anatomy, pointing hand, feet, face, gaze, cultural fit, uniqueness, and wordless output pass; no parent answer, explanation, teaching prompt, speech bubble, question mark, or unrelated action.

## 3. `ms_3_5y_fine_motor_1`

- Myanmar title: စက်ဝိုင်း/မျဉ်း ကူးရေးခြင်း
- English title: Copies a circle / line
- observeMm: စက်ဝိုင်း သို့မဟုတ် မျဉ်းကို ကူးဆွဲပါသလား။
- observeEn: Copies a circle or straight line?
- Meaning: ဤသည်မှာ ရေးသားမှုနှင့် တိကျမှုကို လေ့ကျင့်စေသည်။ / This builds pre-writing control.
- Domain: `fine_motor`
- Asset: `/milestones/3_5y/ms_3_5y_fine_motor_1.7c683683f6.webp`

![Three-and-a-half-year-old copying a model circle](../../public/milestones/3_5y/ms_3_5y_fine_motor_1.7c683683f6.webp)

QA: **READY FOR OWNER REVIEW** — the accepted regeneration shows one completed model circle and one nearly completed copied circle on one sheet, using one chunky crayon and a developmentally appropriate grasp. Age, anatomy, hands, fingers, legs, feet, focused gaze, safe low table, cultural fit, uniqueness, and wordless output pass; no unrelated background object, scribble, letter, number, recognizable drawing, extra shape, or extra tool. The first generated version was rejected because an unrelated basket appeared in the background and was not saved as final.

## Engineering and application verification

- Exact slug mapping: **PASS**
- Unique asset paths: **PASS** — three slugs resolve to three unique files
- Existing asset files: **PASS** — all three files are 1200×900 WebP and 66–112 KB
- Next/Previous image navigation: **PASS** — automated component test traverses all three exact-slug images and returns to the preceding image
- Full unit suite: **PASS** — 934 tests; existing unrelated React test-timing notices remain
- Type check and lint: **PASS**
- Production build: **PASS** — no asset-related warning, missing import, missing image, or broken route; the existing unrelated bundle-size advisory remains
- PWA precache: **PASS** — all three exact 3.5-year assets appear in `dist/sw.js`
- Mobile/desktop browser screenshots: **BLOCKED** — the in-app browser refused the local preview because its admin-enforced security policy could not be verified. The security control was not bypassed. Visual owner review remains available through the three previews above.
- Deployment: **NOT ALLOWED / NOT PERFORMED**
