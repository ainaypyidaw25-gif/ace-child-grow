# ACE Child Grow — 13–18 Month Milestone Illustration Review

Status: **OWNER APPROVED — NOT DEPLOYED**

Source of truth: Production Convex `libraryContent`, filtered to `type = milestone`, `ageGroupKey = 13_18m`, and `clinicalStatus = published`. Read on 2026-08-02. Production contains exactly two published records for this age group. `summaryMm`, `summaryEn`, and `category` are unavailable for both records.

Each milestone was generated independently with Built-in ImageGen, clinically reviewed, and saved as a unique wordless 1200×900 WebP under 500 KB. The first language variant was rejected for being too photorealistic and was not saved as final. Every exact slug maps directly to one exact asset with no domain/category fallback.

## 1. `ms_13_18m_language_1`

- Myanmar title: ရိုးရှင်းသော ညွှန်ကြားချက်ကို လိုက်နာခြင်း
- English title: Follows simple directions
- observeMm: “ဒါလေးပေးပါ” ဆိုလျှင် ပေးပါသလား။
- observeEn: Follows “give me the ball”?
- Meaning: ဤသည်မှာ စကားနားလည်မှု တိုးတက်ခြင်းဖြစ်သည်။ / This shows understanding is growing.
- Domain: `language`
- Asset: `/milestones/13_18m/ms_13_18m_language_1.239e3d686f.webp`

![Toddler following a simple direction by giving the ball to their mother](../../public/milestones/13_18m/ms_13_18m_language_1.239e3d686f.webp)

QA: **READY FOR OWNER REVIEW** — toddler clearly places the single ball into the mother's open hands after her gentle request. Age, anatomy, hands, feet, gaze, facial expression, cultural fit, safety, uniqueness, and wordless output pass; no throwing, walking, multi-step action, extra toy, or unrelated behavior.

## 2. `ms_13_18m_speech_1`

- Myanmar title: အဓိပ္ပာယ်ရှိသော စကားလုံး အနည်းငယ် ပြောခြင်း
- English title: Says a few words
- observeMm: “မေမေ” “ဖေဖေ” အပြင် စကားလုံး ၂–၃ လုံး ပြောပါသလား။
- observeEn: Uses a few words beyond mama/dada?
- Meaning: ပထမစကားလုံးများသည် ဘာသာစကား တိုးတက်မှုကို ဖော်ပြသည်။ / First words mark growing language.
- Domain: `speech`
- Asset: `/milestones/13_18m/ms_13_18m_speech_1.6bd92761f5.webp`

![Toddler intentionally naming a familiar cup while their father listens](../../public/milestones/13_18m/ms_13_18m_speech_1.6bd92761f5.webp)

QA: **READY FOR OWNER REVIEW** — toddler touches one familiar cup, looks purposefully at the silent listening father, and forms an intentional word. Age, anatomy, hands, feet, gaze, facial expression, cultural fit, safety, uniqueness, and wordless output pass; no imitation cue, random babbling, drinking, feeding, speech bubble, or unrelated action.

## Engineering and application verification

- Exact slug mapping: **PASS**
- Unique asset paths: **PASS** — two slugs resolve to two unique files
- Existing asset files: **PASS** — both files are 1200×900 WebP and 95–102 KB
- Next/Previous image navigation: **PASS** — automated component navigation test traverses both exact-slug images and returns to the first
- Full unit suite: **PASS** — 914 tests
- Type check and lint: **PASS**
- Production build: **PASS** — no asset-related warning, missing import, missing image, or broken route; the existing unrelated bundle-size advisory remains
- PWA precache: **PASS** — both exact 13–18 month assets appear in `dist/sw.js`
- Mobile/desktop browser screenshots: **BLOCKED** — the in-app browser refused the local preview because its admin-enforced security policy could not be verified. The security control was not bypassed. Visual owner review remains available through the two previews above.
- Deployment: **NOT ALLOWED / NOT PERFORMED**
