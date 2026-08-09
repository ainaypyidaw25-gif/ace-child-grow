# ACE Child Grow — Published Guide Illustration Review

Status: **OWNER APPROVED FOR PRODUCTION — 2026-08-09**

Source of truth: Production Convex `libraryContent`, read directly with `npx convex data libraryContent --prod` on 2026-08-09 and filtered to exact `type = guide` and `clinicalStatus = published`. Production contains exactly seven matching records. Production remained read only; no local seed, JSON dump, TypeScript constant, screenshot, old asset or previous image was used as content authority.

Every top-level field and every nested `data` field was read for all seven records. The common nested fields are `commonMistakes`, `dailyActivities`, `editorialStatus`, `encouragement`, `evidenceSummary`, `faq`, `indoor`, `lowCost`, `materials`, `observationQuestions`, `outdoor`, `parentTips`, `redFlags`, `referral`, `safety`, `title`, `weeklyActivities` and `why`. Publication, source, review, reviewer, version, age, domain, tag, timestamp and search-index fields were also inspected.

## Pre-generation review table

| Slug | Myanmar title | English title | Exact behaviour / meaning | Image scene | Must not show | Safety constraints | Status |
|---|---|---|---|---|---|---|---|
| `gd_5_6m_social` | ၅ – ၆ လ — လူမှုဆက်ဆံရေး လမ်းညွှန် | 5–6 months — Social guide | A 5–6-month baby recognises a familiar caregiver, may brighten toward them, and may cautiously turn away from a newly introduced person; this is healthy attachment, not misbehaviour. | A Myanmar/Southeast Asian 5–6-month baby is securely supported upright on the mother's lap, makes warm eye contact with the mother and turns slightly away from a gently smiling grandmother who remains at a respectful distance. | Forced handoff, stranger holding the baby, shame, restraint, teasing, shaking, independent sitting, crawling, toys, mirror play, feeding, text or labels. | Baby remains fully supported; the new adult does not touch or crowd the baby; parent stays present and calm. | READY |
| `gd_7_9m_cognitive` | ၇ – ၉ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန် | 7–9 months — Cognitive guide | A 7–9-month baby understands that a hidden object still exists and deliberately uncovers it; repetition supports object permanence and cause-and-effect learning. | On a floor mat, a Myanmar/Southeast Asian 7–9-month baby sits safely with a caregiver directly behind and lifts one corner of a small cloth to reveal one large safe ball, with gaze fixed on the discovered ball. | Several toys, small objects, coin/button/battery/nut, cloth over the face, dropping/throwing, cup-and-spoon activity, screen, crawling, standing, text or labels. | One large non-choking toy only; cloth stays below the baby's shoulders and never covers the face; caregiver remains within arm's reach. | READY |
| `gd_7_9m_communication` | ၇ – ၉ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန် | 7–9 months — Communication guide | A 7–9-month baby communicates intentionally without words by lifting both arms to ask to be picked up while looking at the caregiver; the caregiver notices and responds. | A Myanmar/Southeast Asian 7–9-month baby sits safely on a floor mat and raises both open arms toward a kneeling caregiver, maintaining clear face-to-face gaze as the caregiver leans forward warmly to respond. | Pointing, waving, clapping, speech bubbles, toy reaching, peek-a-boo cloth, feeding, forced movement, standing, walking, text or labels. | Floor-level scene; caregiver is within reach; no pulling, jerking, restraint or cloth near the baby's face. | READY |
| `gd_7_9m_emotional` | ၇ – ၉ လ — စိတ်ခံစားမှု လမ်းညွှန် | 7–9 months — Emotional guide | A 7–9-month baby cannot fully self-calm and borrows calm from a responsive adult; prompt, steady comforting supports emotional regulation. | A seated Myanmar/Southeast Asian caregiver calmly cuddles a mildly upset 7–9-month baby upright against the chest, one hand supporting the baby's back and the other supporting the lower body; the baby's expression is visibly settling. | Shaking, restraint, punishment, ignored crying, intense crisis, unsafe sleep, bottle/feeding, toys, screen, diagnosis, text or labels. | Secure two-hand hold; baby's airway and face remain clear; caregiver is calm and seated at floor level; no unsafe sleep objects. | READY |
| `gd_7_9m_safety` | ၇ – ၉ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန် | 7–9 months — Safety guide | As rolling, sitting and crawling begin, a caregiver prepares the reachable environment and supervises at floor level so the baby can explore safely. | A Myanmar/Southeast Asian 7–9-month baby sits on a completely clear floor mat while a caregiver kneels within arm's reach and secures a closed low cabinet child latch; a closed stair gate is visible in the simple background. | Exposed hazards, coins/buttons/batteries/nuts, water bucket, hot drink, fire, chemicals, medicine, cords, plastic bag, balloon, baby walker, elevated surface, unattended baby, text or labels. | Positive prevention only: clear floor, closed cabinet, closed stair gate, direct supervision; do not visually introduce the prohibited hazards. | READY |
| `gd_7_9m_self_help` | ၇ – ၉ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန် | 7–9 months — Self-help guide | A 7–9-month baby begins doing things independently, including holding a cup with both hands, while a caregiver supervises and helps only as needed. | A Myanmar/Southeast Asian 7–9-month baby sits upright and strapped safely in a high chair, trying to hold one small non-glass open cup with both hands while a caregiver lightly stabilises the bottom of the cup and watches closely. | Independent unsupervised drinking, bottle propping, glass cup, spoon self-feeding, whole nuts/grapes, hard chunks, hot liquid, standing/moving while drinking, extra food, text or labels. | Upright supported posture, secure high-chair restraint, empty/simple tray, cool water only, non-glass cup and caregiver within arm's reach. | READY |
| `gd_7_9m_social` | ၇ – ၉ လ — လူမှုဆက်ဆံရေး လမ်းညွှန် | 7–9 months — Social guide | A 7–9-month baby clearly recognises a returning parent; calm, predictable goodbyes and warm reunions support healthy attachment and separation anxiety. | A Myanmar/Southeast Asian 7–9-month baby sits safely beside a trusted grandmother and smiles brightly toward the returning mother at the doorway; the mother kneels and greets the baby warmly while the grandmother remains close. | Sneaking away, distressed abandonment, forced handoff, stranger holding baby, restraint, teasing, shaking, independent standing/walking, toy play, waving, text or labels. | Baby stays floor-level with a trusted caregiver; reunion is calm and predictable; no unattended or frightening scene. | READY |

## Pre-generation confirmation

- Each exact slug has a distinct scene and will receive one unique asset: **PASS**
- Every scene illustrates only the published guide's central observable behaviour or preventive action: **PASS**
- Age, posture, body proportions and independence match `5_6m` or `7_9m`: **PASS**
- Feeding, choking, fall, water, cloth, restraint and emotional-safety requirements are explicit: **PASS**
- No red flag, diagnosis, medical emergency or unsafe act will be dramatised: **PASS**
- Every concept is wordless and understandable without reading: **PASS**
- No image was generated before this table was completed: **PASS**

## Production review metadata

All seven records are version `1`, status `published`, nested editorial status `reference_verified`, and review scope `education`. The recorded reviewer qualification is `MEd (Early Childhood and Special Education)`. Production states that education and special-needs professional review is complete, but medical guidance remains general evidence-based information and is not medical or clinical approval. This illustration run will not change any wording, translation, evidence, review status or Production record.

## Owner review cards

### `gd_5_6m_social`

- Myanmar title: **၅ – ၆ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်**
- English title: **5–6 months — Social guide**
- Production meaning: The baby distinguishes a familiar caregiver from a new person and may turn away; gradual introduction and a calm nearby caregiver support healthy attachment.
- Asset: `/guides/gd_5_6m_social.f45ff11649.webp` — 1200×900, 137,830 bytes

![၅ – ၆ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်](../../public/guides/gd_5_6m_social.f45ff11649.webp)

QA: exact familiar-caregiver gaze ✓ · cautious orientation away from new adult ✓ · 5–6-month proportions ✓ · secure two-hand adult support ✓ · baby hands/fingers ✓ · legs/feet ✓ · natural faces ✓ · grandmother does not touch or hold baby ✓ · no extra action/object ✓ · culturally appropriate ✓ · wordless ✓

Rejected candidate: the first generated candidate showed the baby looking directly toward the newly introduced grandmother rather than seeking the familiar mother's face. It failed gaze/behaviour accuracy and is not mapped. The corrected final above changes the gaze and head orientation while preserving safe support and anatomy.

**OWNER APPROVED FOR PRODUCTION — 2026-08-09**

### `gd_7_9m_cognitive`

- Myanmar title: **၇ – ၉ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်**
- English title: **7–9 months — Cognitive guide**
- Production meaning: The baby deliberately uncovers a hidden object, demonstrating emerging object permanence and cause-and-effect learning.
- Asset: `/guides/gd_7_9m_cognitive.573c2f0d30.webp` — 1200×900, 140,282 bytes

![၇ – ၉ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်](../../public/guides/gd_7_9m_cognitive.573c2f0d30.webp)

QA: exact uncover-and-find behaviour ✓ · 7–9-month proportions/posture ✓ · caregiver within arm's reach ✓ · one large safe ball only ✓ · cloth remains below shoulders ✓ · gaze fixed on revealed ball ✓ · hands/fingers ✓ · legs/feet ✓ · no small object/screen/extra toy ✓ · culturally appropriate ✓ · wordless ✓

**OWNER APPROVED FOR PRODUCTION — 2026-08-09**

### `gd_7_9m_communication`

- Myanmar title: **၇ – ၉ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်**
- English title: **7–9 months — Communication guide**
- Production meaning: The baby intentionally raises both arms and looks at the caregiver to communicate a wish to be picked up; the caregiver notices and responds.
- Asset: `/guides/gd_7_9m_communication.bdb749e2a3.webp` — 1200×900, 132,470 bytes

![၇ – ၉ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်](../../public/guides/gd_7_9m_communication.bdb749e2a3.webp)

QA: exact two-arm intentional signal ✓ · clear mutual gaze ✓ · 7–9-month proportions/posture ✓ · floor-level safety ✓ · caregiver responsive without pulling ✓ · both hands/fingers ✓ · legs/feet ✓ · no pointing/waving/clapping/toy/cloth ✓ · culturally appropriate ✓ · wordless ✓

**OWNER APPROVED FOR PRODUCTION — 2026-08-09**

### `gd_7_9m_emotional`

- Myanmar title: **၇ – ၉ လ — စိတ်ခံစားမှု လမ်းညွှန်**
- English title: **7–9 months — Emotional guide**
- Production meaning: A responsive adult's steady cuddle helps a mildly upset baby borrow calm because the baby cannot fully self-regulate yet.
- Asset: `/guides/gd_7_9m_emotional.73eabf88fb.webp` — 1200×900, 137,696 bytes

![၇ – ၉ လ — စိတ်ခံစားမှု လမ်းညွှန်](../../public/guides/gd_7_9m_emotional.73eabf88fb.webp)

QA: exact co-regulation/comforting behaviour ✓ · 7–9-month proportions ✓ · mild settling expression ✓ · upright clear airway ✓ · secure back and lower-body support ✓ · anatomy/hands ✓ · legs/feet ✓ · no shaking/restraint/punishment/unsafe sleep/object ✓ · culturally appropriate ✓ · wordless ✓

**OWNER APPROVED FOR PRODUCTION — 2026-08-09**

### `gd_7_9m_safety`

- Myanmar title: **၇ – ၉ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်**
- English title: **7–9 months — Safety guide**
- Production meaning: The caregiver prepares the baby's expanding reachable environment and directly supervises at floor level as sitting and crawling emerge.
- Asset: `/guides/gd_7_9m_safety.d33c9acaf9.webp` — 1200×900, 157,396 bytes

![၇ – ၉ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်](../../public/guides/gd_7_9m_safety.d33c9acaf9.webp)

QA: exact positive home-safety preparation ✓ · direct floor-level supervision ✓ · 7–9-month proportions/posture ✓ · closed cabinet/latch ✓ · closed stair gate ✓ · clear floor ✓ · hands/fingers ✓ · legs/feet ✓ · no visually introduced hazard/walker/elevated surface ✓ · culturally appropriate ✓ · wordless ✓

**OWNER APPROVED FOR PRODUCTION — 2026-08-09**

### `gd_7_9m_self_help`

- Myanmar title: **၇ – ၉ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်**
- English title: **7–9 months — Self-help guide**
- Production meaning: The baby begins holding a cup with both hands while a caregiver supervises and provides only the assistance needed.
- Asset: `/guides/gd_7_9m_self_help.cdfac6e4bf.webp` — 1200×900, 140,386 bytes

![၇ – ၉ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်](../../public/guides/gd_7_9m_self_help.cdfac6e4bf.webp)

QA: exact two-hand cup hold ✓ · 7–9-month proportions ✓ · upright restrained high-chair posture ✓ · non-glass open cup ✓ · caregiver stabilises cup bottom ✓ · empty tray/no food ✓ · hands/fingers ✓ · legs/feet ✓ · no bottle/spoon/hot liquid/choking food ✓ · culturally appropriate ✓ · wordless ✓

**OWNER APPROVED FOR PRODUCTION — 2026-08-09**

### `gd_7_9m_social`

- Myanmar title: **၇ – ၉ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်**
- English title: **7–9 months — Social guide**
- Production meaning: The baby clearly recognises a returning parent; calm predictable separation and warm reunion support healthy attachment.
- Asset: `/guides/gd_7_9m_social.2a908691eb.webp` — 1200×900, 149,214 bytes

![၇ – ၉ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်](../../public/guides/gd_7_9m_social.2a908691eb.webp)

QA: exact warm reunion/recognition behaviour ✓ · direct baby-to-parent gaze ✓ · bright natural smile ✓ · trusted grandmother support ✓ · 7–9-month proportions/posture ✓ · hands/fingers ✓ · legs/feet ✓ · no distress/forced handoff/waving/arms-up pickup signal ✓ · culturally appropriate ✓ · wordless ✓

**OWNER APPROVED FOR PRODUCTION — 2026-08-09**

## Mapping and engineering verification

- Seven currently published Production guide slugs map directly to seven unique content-hashed WebP files: **PASS**
- Domain, age-group, type and unknown slugs do not resolve to a fallback: **PASS**
- Existing remote/shared illustration is suppressed only when an approved exact-slug guide image exists: **PASS**
- Every final file is 1200×900, 4:3, under 500 KB and named from its SHA-256 content hash: **PASS**
- Focused exact-mapping and bilingual rendering tests: **PASS — 12/12**
- Full unit suite: **PASS — 1,163/1,163 across 121 test files**
- Typecheck: **PASS**
- Lint: **PASS**
- Production build: **PASS — 310 modules transformed; no asset warning, missing import or missing file**
- PWA precache: **PASS — 250 entries; all seven exact guide assets included**
- Authenticated application navigation: **BLOCKED BY LOCAL AUTHENTICATION** — the production build correctly redirected the unauthenticated localhost guide route to sign-in. No authentication control was bypassed and no preview or Production deployment was created. Exact guide title/image rendering in Myanmar and English is covered by the focused component tests, and every final visual appears above for owner review.

## Deployment authorization

Owner approval: **GRANTED ON 2026-08-09**

Final review result: **APPROVED FOR PRODUCTION**
