# ACE Child Grow — 2.5 Year Milestone Illustration Review

Status: **OWNER APPROVED — NOT DEPLOYED**

Source of truth: Production Convex `libraryContent`, filtered to `type = milestone`, exact `ageGroupKey = 2_5y`, and `clinicalStatus = published`. Read on 2026-08-02. Production contains exactly three published records for this age group. `summaryMm`, `summaryEn`, `category`, and `safety` are unavailable for all three records.

Each milestone was generated independently with Built-in ImageGen, clinically reviewed, and saved as a unique wordless 1200×900 WebP under 500 KB. Every exact slug maps directly to one exact asset with no domain/category fallback.

## 1. `ms_2_5y_emotional_1`

- Myanmar title: စိတ်ခံစားမှုကို စကားဖြင့် ဖော်ပြခြင်း
- English title: Names some feelings
- observeMm: “ဝမ်းသာ” “စိတ်ဆိုး” ကဲ့သို့ ခံစားမှုကို ပြောပါသလား။
- observeEn: Says feelings like happy or angry?
- Meaning: ခံစားမှုကို အမည်တပ်ခြင်းက ကိုယ်ကို ထိန်းချုပ်ရန် ကူညီသည်။ / Naming feelings helps self-control.
- Domain: `emotional`
- Asset: `/milestones/2_5y/ms_2_5y_emotional_1.eb517bb6af.webp`

![Two-and-a-half-year-old calmly naming their own feeling](../../public/milestones/2_5y/ms_2_5y_emotional_1.eb517bb6af.webp)

QA: **READY FOR OWNER REVIEW** — child uses a clear speaking mouth shape and hand on chest to calmly identify their own unpleasant feeling while mother listens silently. Age, anatomy, hands, feet, gaze, regulated expression, cultural fit, uniqueness, and wordless output pass; no tantrum, crying, conflict, injury, prompt, or unrelated object.

## 2. `ms_2_5y_language_1`

- Myanmar title: စကားလုံး သုံးလုံး ဝါကျ ပြောခြင်း
- English title: Three-word sentences
- observeMm: “မေမေ အိမ် သွား” ကဲ့သို့ ပြောပါသလား။
- observeEn: Uses short three-word sentences?
- Meaning: ဝါကျ ရှည်လာခြင်းသည် ဘာသာစကား ကြွယ်ဝလာခြင်းဖြစ်သည်။ / Longer sentences show richer language.
- Domain: `language`
- Asset: `/milestones/2_5y/ms_2_5y_language_1.496ca2a451.webp`

![Child spontaneously making a short sentence request while father listens](../../public/milestones/2_5y/ms_2_5y_language_1.496ca2a451.webp)

QA: **READY FOR OWNER REVIEW** — child speaks a purposeful short sentence while looking at the silent father; one plain wordless book remains closed on the floor and reading has not begun. Age, anatomy, mouth shape, gaze, cultural fit, uniqueness, and wordless output pass; no modeling, repetition cue, babbling, gesture, handover, or unrelated action.

## 3. `ms_2_5y_fine_motor_1`

- Myanmar title: ခဲတံကိုင်၍ ခြစ်ရေးခြင်း
- English title: Scribbles with a crayon
- observeMm: ခဲတံ/ခရေယွန်ကို ကိုင်၍ ခြစ်ရေးပါသလား။
- observeEn: Holds a crayon and scribbles?
- Meaning: ဤသည်မှာ နောင်ရေးသားခြင်းအတွက် လက်ကို ပြင်ဆင်ပေးသည်။ / This prepares the hand for later writing.
- Domain: `fine_motor`
- Asset: `/milestones/2_5y/ms_2_5y_fine_motor_1.3f9ad040ae.webp`

![Child using a chunky crayon to make free scribble lines](../../public/milestones/2_5y/ms_2_5y_fine_motor_1.3f9ad040ae.webp)

QA: **READY FOR OWNER REVIEW** — child uses one developmentally appropriate crayon grasp to draw loose abstract lines while the other hand steadies one sheet of paper and mother supervises without guiding. Age, anatomy, hands, feet, gaze, furniture safety, cultural fit, uniqueness, and wordless output pass; no mature pencil grip, letter, number, recognizable picture, second tool, or unrelated action.

## Engineering and application verification

- Exact slug mapping: **PASS**
- Unique asset paths: **PASS** — three slugs resolve to three unique files
- Existing asset files: **PASS** — all three files are 1200×900 WebP and 104–147 KB
- Next/Previous image navigation: **PASS** — automated component test traverses all three exact-slug images and returns to the preceding image
- Full unit suite: **PASS** — 926 tests
- Type check and lint: **PASS**
- Production build: **PASS** — no asset-related warning, missing import, missing image, or broken route; the existing unrelated bundle-size advisory remains
- PWA precache: **PASS** — all three exact 2.5-year assets appear in `dist/sw.js`
- Mobile/desktop browser screenshots: **BLOCKED** — the in-app browser refused the local preview because its admin-enforced security policy could not be verified. The security control was not bypassed. Visual owner review remains available through the three previews above.
- Deployment: **NOT ALLOWED / NOT PERFORMED**
