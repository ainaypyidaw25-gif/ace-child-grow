# ACE Child Grow — 4 Year Milestone Illustration Review

Status: **READY FOR OWNER REVIEW — NOT DEPLOYED**

Source of truth: Production Convex `libraryContent`, filtered to `type = milestone`, exact `ageGroupKey = 4y`, and `clinicalStatus = published`. Read on 2026-08-03. Production contains exactly four published records for this age group. `summaryMm`, `summaryEn`, `category`, and `safety` are unavailable for all four records.

All four milestones were generated independently with Built-in ImageGen, clinically reviewed, and saved as unique 1200×900 WebP files under 500 KB. Every exact slug maps directly to one exact asset with no domain/category fallback. The owner explicitly approved a narrowly scoped exception for `ms_4y_school_readiness_1`: exactly the two necessary instances of one name letter may appear so the published behaviour can be illustrated accurately; all other text remains prohibited.

## 1. `ms_4y_school_readiness_1`

- Myanmar title: မိမိနာမည်ကို မှတ်မိ/ရေးရန် ကြိုးစားခြင်း
- English title: Recognizes / tries to write name
- observeMm: မိမိနာမည် စာလုံးများကို မှတ်မိ/ရေးရန် ကြိုးစားပါသလား။
- observeEn: Knows some letters of their name?
- Meaning: ဤသည်မှာ စာဖတ်/ရေးခြင်း အခြေခံဖြစ်သည်။ / This is early literacy.
- Domain: `school_readiness`
- Asset: `/milestones/4y/ms_4y_school_readiness_1.34ee42a1bf.webp`

![Four-year-old recognizing and copying one letter from their own name](../../public/milestones/4y/ms_4y_school_readiness_1.34ee42a1bf.webp)

QA: **READY FOR OWNER REVIEW — OWNER-APPROVED LETTER EXCEPTION** — an over-the-shoulder view shares the child's reading orientation: the child recognizes the model uppercase `M` beside their own portrait and carefully copies one second upright `M` on a single sheet. Both letters unambiguously read `M`, not `W`, to the child and viewer. Exactly two `M` letters appear and no other text, letter, number, label, or symbol is present. Age, anatomy, hands, fingers, gaze, preschool crayon grasp, early-literacy behaviour, cultural fit, uniqueness, and output pass; no full name, alphabet row, worksheet, extra tool, adult guidance, or unrelated action. The previous `28ffa58047` version was rejected because the card and paper faced away from the child, making their letters read as `W` from the child's viewpoint; it is not used by the application.

## 2. `ms_4y_problem_solving_1`

- Myanmar title: ရိုးရှင်းသော ပြဿနာများ ဖြေရှင်းခြင်း
- English title: Solves simple problems
- observeMm: မလှမ်းမီပစ္စည်းယူရန် ခုံတင်ကဲ့သို့ နည်းလမ်းရှာပါသလား။
- observeEn: Finds a way to reach something out of grasp?
- Meaning: ဤသည်မှာ တွေးခေါ်၍ စီစဉ်နိုင်ခြင်းကို ပြသည်။ / This shows planning and reasoning.
- Domain: `problem_solving`
- Asset: `/milestones/4y/ms_4y_problem_solving_1.a99eba4cf2.webp`

![Four-year-old safely moving a low step into position to reach an object](../../public/milestones/4y/ms_4y_problem_solving_1.a99eba4cf2.webp)

QA: **READY FOR OWNER REVIEW** — child independently slides a broad low stable step beneath the shelf while keeping both feet on the floor and looking toward the single out-of-reach cup; the nearby parent supervises silently without helping. Age, planning behaviour, anatomy, hands, feet, gaze, safety, cultural fit, uniqueness, and wordless output pass; no climbing, tiptoeing, fall hazard, parent solution, extra shelf object, or unrelated action. The first generated version was rejected because the child was standing on a higher platform and was not saved as final.

## 3. `ms_4y_language_1`

- Myanmar title: ဇာတ်လမ်း/ဖြစ်ရပ်ကို ပြန်ပြောခြင်း
- English title: Tells a short story
- observeMm: ဖြစ်ခဲ့သည့် ဖြစ်ရပ်ကို အစီအစဉ်တကျ ပြန်ပြောပါသလား။
- observeEn: Retells a simple event in order?
- Meaning: ဤသည်မှာ အတွေးများကို စီစဉ်နိုင်ခြင်းဖြစ်သည်။ / This shows organizing thoughts in sequence.
- Domain: `language`
- Asset: `/milestones/4y/ms_4y_language_1.abb490091e.webp`

![Four-year-old verbally retelling a three-step wordless event sequence](../../public/milestones/4y/ms_4y_language_1.abb490091e.webp)

QA: **READY FOR OWNER REVIEW** — child speaks while pointing within exactly three wordless beginning-middle-end picture cards; the parent listens silently without prompting. Age, anatomy, pointing hand, feet, mouth shape, gaze, event order, cultural fit, uniqueness, and wordless output pass; no written caption, number, arrow, speech bubble, book, parent narration, or unrelated action.

## 4. `ms_4y_gross_motor_1`

- Myanmar title: ခုန်ခြင်း၊ ခြေထောက်တစ်ဖက်ဖြင့် ခုန်ခြင်း
- English title: Hops and skips
- observeMm: ခြေထောက်တစ်ဖက်ဖြင့် ခုန်နိုင်ပါသလား။
- observeEn: Hops on one foot?
- Meaning: ဤသည်မှာ ခွန်အားနှင့် ဟန်ချက် တိုးတက်ခြင်းဖြစ်သည်။ / This shows growing strength and balance.
- Domain: `gross_motor`
- Asset: `/milestones/4y/ms_4y_gross_motor_1.5deffabec6.webp`

![Four-year-old making a controlled hop on one foot](../../public/milestones/4y/ms_4y_gross_motor_1.5deffabec6.webp)

QA: **READY FOR OWNER REVIEW** — hopping foot is briefly airborne beneath the upright body while the other knee and foot remain clearly bent and lifted. Age, anatomy, hands, fingers, legs, feet, focused expression, safe flat floor, cultural fit, uniqueness, and wordless output pass; no standing-balance pose, two-foot jump, running, skipping, equipment, elevation, or fall hazard.

## Engineering and application verification

- Exact slug mapping: **PASS** — all four published slugs map directly to exact assets
- Unique asset paths: **PASS** — four slugs resolve to four unique files with no fallback
- Existing asset files: **PASS** — all four generated files are 1200×900 WebP and 60–103 KB
- Next/Previous image navigation: **PASS** — automated component test traverses all four unique exact-slug images and returns to the preceding image
- Full unit suite: **PASS** — 938 tests; existing unrelated React test-timing notices remain
- Type check and lint: **PASS**
- Production build: **PASS** — no asset-related warning, missing import, missing image, or broken route; the existing unrelated bundle-size advisory remains
- PWA precache: **PASS** — all four exact 4-year assets appear in `dist/sw.js`
- Mobile/desktop browser screenshots: **BLOCKED** — the in-app browser refused the local preview because its admin-enforced security policy could not be verified. The security control was not bypassed. Visual owner review remains available through the four previews above.
- Deployment: **NOT ALLOWED / NOT PERFORMED**
