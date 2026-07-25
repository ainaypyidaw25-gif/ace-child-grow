# ACE Child Grow — Project Status

_ရက်စွဲ — ၂၀၂၆ ဇူလိုင် ၂၅ · Bilingual (Myanmar–English) child development & parent education platform (0–5 နှစ်)_

> **အရေးကြီး safety မူ —** ဤ app သည် ကလေးကို **ရောဂါ ဘယ်တော့မှ မဖော်ထုတ်ပါ**။ ပညာပေး/စောင့်ကြည့်ကူညီပေးရေး tool သာဖြစ်သည်။ ဆေးပညာဆိုင်ရာ content အားလုံးကို ကျွမ်းကျင်သူ review မဖြတ်ရသေးမချင်း မိဘများဆီ “အတည်ပြုပြီး” အဖြစ် မဖော်ပြပါ။

---

## ၁။ Links (လက်ရှိ အခြေအနေ)

| အရာ | URL / တည်နေရာ | အခြေအနေ |
|---|---|---|
| Production app | https://ace-child-grow.vercel.app | READY (`main` — မထိထားပါ) |
| Clinical-pilot + content **Preview** | https://ace-child-grow-git-feature-clinical-pilot-readiness-ace-group.vercel.app | READY (`feature/clinical-pilot-readiness`) |
| Backend (Convex) | `uncommon-orca-603` (https://uncommon-orca-603.convex.cloud) | Deployed + seeded |
| Repo (GitHub) | github.com/ainaypyidaw25-gif/ace-child-grow | Public |

---

## ၂။ Tech Stack

- **Frontend —** React 18 + TypeScript (strict) + Vite + Tailwind CSS, installable **PWA**
- **Backend —** Convex (Convex Auth email/password + schema + query/mutation functions)
- **Hosting —** Vercel (GitHub auto-deploy)
- **Testing —** Vitest (unit + integrity), Playwright (E2E, gated)
- **အခြေအနေ —** typecheck ✅ · eslint ✅ · unit tests **137/137 ✅** · build ✅

---

## ၃။ လက်ရှိ အလုပ်လုပ်နေသော Features (Production)

- Authentication gate → consent → ကလေး ထည့်/ပြင် → Home (အသက်အစစ်)
- Milestone review → ရလဒ် (GREEN / YELLOW / ORANGE / RED; skill-loss → RED safety)
- Activities (အသက်အလိုက် အစီအစဉ် + favorites ❤️)
- Growth tracker (unit conversion)
- Sleep tracker (breathing safety flag)
- Learn · Hope Center · Report (၃ မျိုး + PDF; Myanmar PDF `npm run report:pdf`)
- Profile (child switcher, export, sign out, delete) · Offline downloads · Notifications
- Admin review queue (staff-gated workflow)

**P0 isolation —** Convex function တိုင်းသည် `getAuthUserId(ctx)` မှ owner ကို ယူ၍ per-user data ကို ခွဲထားသည် (ကလေးdata တစ်ယောက်ဆီ တစ်ယောက် လုံးဝ မမြင်ရ)။

---

## ၄။ Clinical-Pilot branch တွင် ထပ်တိုးထားသည် (preview only)

| Feature | Route | အကျဉ်း |
|---|---|---|
| Healthcare Directory | `/directory` | Staff verify လုပ်ထားသော facility သာ ပြသည်။ လုပ်ကြံ data မထည့်ပါ |
| Child Profile | `/child-profile` | ကလေးတစ်ဦးချင်း profile (chronological + corrected age, record counts) |
| Audit Log | `/audit` | Staff-only; parent များ server-side ကတည်းက `allowed:false` |
| Content translation workflow | (CMS) | `setTranslation` mutation (staff) + bodyMm/bodyEn + audit |
| Convex auth-guard test | (tests) | Function တိုင်း auth စစ်ကြောင်း CI မှာ အလိုအလျောက် စစ် |
| Myanmar terminology glossary | `docs/content/` | တစ်သမတ်တည်း ဝေါဟာရ (tummy time = မှောက်လျက် ကစားချိန်) |

---

## ၅။ Content Platform (အသစ် — database-driven)

> Component များထဲ hardcode မလုပ်ပါ။ content အားလုံး database ထဲမှ လာသည်။ Safety engine (မူရင်း) ကို မထိပါ။

### Taxonomy
- **အသက်အုပ်စု ၁၄ ခု —** မွေးကင်း–၂လ · ၃–၄လ · ၅–၆လ · ၇–၉လ · ၁၀–၁၂လ · ၁၃–၁၈လ · ၁၉–၂၄လ · ၂နှစ် · ၂နှစ်ခွဲ · ၃နှစ် · ၃နှစ်ခွဲ · ၄နှစ် · ၄နှစ်ခွဲ · ၅နှစ်
- **နယ်ပယ် ၁၆ ခု —** Gross Motor, Fine Motor, Speech, Language, Communication, Cognitive, Problem Solving, Social, Emotional, Self Help, Play, Nutrition, Sleep, Safety, Daily Routine, School Readiness

### Convex data model
- `libraryContent` table — item တိုင်းတွင် type, slug, age/domain/category, MM/EN title & summary, tags, difficulty, duration, **source, version, clinicalStatus, reviewer, reviewedAt, nextReviewAt**, searchText, media
- `libraryMedia` table — illustration/audio/video/pdf placeholder (media architecture)
- Functions — `listByType`, `getBySlug`, `search`, `stats` (published-vs-staff gated), `importSeed` (staff, idempotent), `setReview` (audited), internal `seed:run`

### Seed content (134 items — အားလုံး `clinical_review`)

| အမျိုးအစား | အရေအတွက် / coverage |
|---|---|
| Milestones | အသက်အုပ်စု ၁၄ ခုလုံး × နယ်ပယ်များ |
| Domain Guides | နယ်ပယ် ၁၆ ခုလုံး (why, observation, activities, red flags, referral, tips, FAQ, encouragement) |
| Activities | full metadata (materials, setup, steps, safety, outcomes, indoor/outdoor…) |
| Lessons | Category **၂၀ ခုလုံး** (objectives, quiz, takeaway, action today) |
| Special Needs | **၁၃ ခုလုံး** (autism, speech delay, ADHD, Down syndrome, cerebral palsy, hearing/visual, GDD, learning disability, sensory, dyslexia, DCD, selective mutism) — strengths-based, **non-diagnostic**, လုပ်ကြံ citation မပါ |
| Stories | story type အားလုံး (picture/speech/emotion/social/bedtime/waiting/hospital/school/sharing) |
| Printables | toolkit ၁၁ ခုလုံး (flash/emotion/communication cards, charts, checklists, diaries) |

### UI
- `/library` — type/age/domain filter + search (parents = published သာ)
- `/content/:slug` — type-aware detail renderer
- `/admin/library` — staff CMS (coverage dashboard, seed import, review/publish)

### Integrity tests (15 checks — အားလုံး ✅)
အသက်တိုင်း/နယ်ပယ်တိုင်း content ရှိ · orphan record မရှိ · duplicate ID မရှိ · အားလုံး searchable · source metadata ပါ · **ဘာမှ pre-published မဟုတ်** · special-needs/category/story-type/printable အားလုံး ပါဝင်

---

## ၆။ ယခု session တွင် Deploy + Seed လုပ်ပြီးသည်

1. Convex deploy — `libraryContent` + `libraryMedia` table + index ၈ ခု + function များ တင်ပြီး ✅
2. Seed import — **134 items** database ထဲ ရောက်ပြီး (created: 134) ✅
3. Staff bootstrap — `lapyaewun2690@gmail.com` ကို `isStaff = true` ✅
4. Commit + push (`feature/clinical-pilot-readiness`) ✅

---

## ၇။ သင် ဆက်လုပ်ရန် (Publish workflow)

1. App ဝင် → **`/admin/library`** ဖွင့်ပါ (သင် staff ဖြစ်ပြီ — content အားလုံး မြင်ရမည်)
2. Item တစ်ခုချင်း ဖတ်ပါ → (native Myanmar + ကလေးကျန်းမာရေး ကျွမ်းကျင်သူနှင့် တိုင်ပင်) → **Publish** နှိပ်ပါ
3. Publish လုပ်ထားသည်သာ `/library` တွင် မိဘများ မြင်ရမည်

**ပြန် seed တင်ရန် —** `npm run seed:dump` → `CONVEX_DEPLOY_KEY=<key> npx convex deploy` → `npx convex run seed:run` (idempotent; review ဆုံးဖြတ်ချက်ကို မဖျက်ပါ)

---

## ၈။ ရိုးသားချက် (Scope & Limitations)

- Content 134 က **coverage-complete starter** — activity ၁၀၀၀+ / lesson ၂၀၀+ ပန်းတိုင်အပြည့် မဟုတ်သေး။ platform က အဲဒီအထိ **CMS/data-entry အလုပ်** ဖြစ်အောင် လုပ်ထားပြီ (code မဟုတ်တော့)
- Myanmar + clinical စာသားအားလုံး **AI-drafted** — native Myanmar speaker + qualified clinical reviewer (ဆရာဝန်/therapist) မ finalize ရသေးမချင်း pilot အစစ်မှာ publish မလုပ်သင့်
- Sandbox browser က convex.cloud WSS ကို block လုပ်လို့ live E2E ကို sandbox မှာ run မရ (auth-guard static test က P0 isolation ကို ဖုံးအုပ်ပေး)
- Bundle note — seed (~130KB) က LibraryAdmin မှတစ်ဆင့် main bundle ထဲ ရှိ; နောင် lazy-load/split လုပ်နိုင်

---

## ၉။ Cleanup / Next

- Convex **deploy key** + GitHub **PAT** ကို အသုံးပြုပြီးရင် revoke လုပ်ပါ (နှစ်ခုစလုံး deploy ခွင့်ပေးသည်)
- Content clinical review မပြီးမချင်း **`main` သို့ merge မလုပ်ပါနှင့်**
- ကျန် clinical-pilot sections — password reset (in-app), onboarding wizard, article detail, translation review UI, doctor-visit prep, observation journal, weekly plan, pilot mode, analytics, card-heavy UI reduction

---

## Verdict

**Content Platform — DEPLOYED + SEEDED (staff အတွက် end-to-end အလုပ်လုပ်ပြီ)**
ကျန်တာက clinical review + publish — လူသား ကျွမ်းကျင်သူ ဆုံးဖြတ်ရမည့် အဆင့်။
