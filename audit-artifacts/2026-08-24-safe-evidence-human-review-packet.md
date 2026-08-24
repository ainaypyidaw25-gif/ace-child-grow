# ACE Child Grow — staged evidence human-review packet

Prepared: 2026-08-24  
Scope: the five staged sources that the current exact release flows are designed to accept after independent human review.  
Decision status: **no review decision has been made by this packet**.

## Reviewer boundary

- Fresh Production reads found exactly one row for each source below. All five are `awaiting_review`; reviewer, reviewer qualification, reviewer date, reviewer scope, and successful `evidence.setReview` audit are absent.
- The reviewer must open the linked official material, compare it with the stated limited claim scope, and make their own approve/reject decision. The suggested notes below are templates only; edit them to reflect the review actually performed.
- The current approval endpoint requires an authenticated **Owner** account with a non-empty recorded professional qualification. The server supplies the account's reviewer identity and qualification and records scope as **`education`**. Do not type or substitute another person's identity.
- A review date must be the reviewer's actual non-future `YYYY-MM-DD` date. Only `jr-niaid-peanut-prevention-2017` currently crosses the application's age advisory threshold and therefore requires a substantive replacement/currency note if the reviewer independently chooses approval.
- Source approval is not content approval, clinical sign-off, publication approval, or permission to broaden a claim beyond the scope below.

## Release context

| Release | Current Production phase | Sources in this packet | Required next gate |
|---|---|---|---|
| `2026-08-23-older-safety-current-evidence-v1` | `source_review_required`; no blockers | AAP 2026 drowning; CDC preschool; CPSC childproofing | Review sources, rerun exact preflight, and apply only if it becomes `ready`. |
| `2026-08-24-infant-nutrition-guides-evidence-v1` | `awaiting_human_review`; no blockers | CDC solid foods; NIAID peanut prevention | Review both sources, require exactly one successful post-stage audit per source, rerun exact preflight, and apply only if it becomes `ready`. |

## 1. `aap-drowning-2026`

**Production metadata**

- Organization/title: American Academy of Pediatrics — *Prevention of Drowning: Policy Statement*
- Year/edition: 2026 — *Pediatrics* 158(1):e2026077410; DOI 10.1542/peds.2026-077410; PMID 42144630
- Evidence level: `guideline`; verifiedOn: `2026-08-23`
- Production age scope: `0..null` months, intentionally uncapped because the policy addresses children and adolescents.
- Exact release use: all nine older-safety guide bands from 13 through 66 months: `gd_13_18m_safety`, `gd_19_24m_safety`, `gd_2y_safety`, `gd_2_5y_safety`, `gd_3y_safety`, `gd_3_5y_safety`, `gd_4y_safety`, `gd_4_5y_safety`, `gd_5y_safety`.
- Production primary URL: [AAP publisher page](https://publications.aap.org/pediatrics/article/doi/10.1542/peds.2026-077410/207630/Prevention-of-Drowning-Policy-Statement)

**Exact claim scope to review**

- Multiple prevention layers; no single method is sufficient.
- Close, constant, attentive, competent adult supervision around water.
- Appropriate barriers, life jackets for relevant water activities, water competency, rescue/CPR preparedness, and age-based anticipatory guidance.
- Do not convert this into a guarantee that swimming lessons or a single device prevents drowning. The statement recommends aquatic experiences for infants with a parent and swimming lessons after the first birthday, not a universal infant swim mandate.

**Currency/supersession check**

- The official publisher page is dated June/July 2026 and its PDF states that AAP policy statements expire after five years unless reaffirmed, revised, or retired.
- The prior 2021 AAP record is [PMID 34253571](https://pubmed.ncbi.nlm.nih.gov/34253571/). The 2026 statement is the newer edition intended by this release.
- No later AAP drowning policy was identified in the official AAP policy collection checked on 2026-08-24. This is a search finding, not a substitute for the reviewer's own check.

**Reviewer requirement**

- Hard application gate: Owner account + recorded non-empty professional qualification; stored scope `education`.
- Subject-matter fit recommended: pediatric/public-health, injury-prevention, water-safety, or qualified child-health education experience.

**Optional acknowledgement template**

> Reviewed the official 2026 AAP policy statement and the prior 2021 record on {actual review date}. I found the 2026 statement to be the current AAP edition for the limited educational claims on layered drowning prevention, constant competent supervision, barriers, life jackets, water competency, and rescue preparedness. I did not treat swimming lessons or any single device as a guarantee against drowning.

## 2. `cdc-positive-parenting-preschoolers-2026`

**Production metadata**

- Organization/title: Centers for Disease Control and Prevention — *Positive Parenting Tips: Preschoolers (3–5 years old)*
- Year/evidence level: 2026; `parent_education`; verifiedOn: `2026-08-23`
- Production age scope: `36..71` months.
- Exact release use: the five preschool safety bands `gd_3y_safety` through `gd_5y_safety`, covering 36–66 months.
- Production primary URL: [CDC official page](https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html)

**Exact claim scope to review**

- Keep preschool children out of traffic and do not let them play in the street or run after stray balls.
- Watch them at all times when playing outside and when in or around any body of water, including small pools.
- Tricycle use should remain on the sidewalk/away from streets with a helmet; playground equipment should be checked for hazards.
- Do not use this source to support claims for children outside the printed 3–5-year range or to replace product-specific car-seat guidance.

**Currency/supersession check**

- The official CDC page displays `Feb. 20, 2026` and the exact 3–5-year title.
- No newer CDC preschool positive-parenting page was identified in the official CDC search checked on 2026-08-24. The reviewer should confirm the live page date and content before deciding.

**Reviewer requirement**

- Hard application gate: Owner account + recorded non-empty professional qualification; stored scope `education`.
- Subject-matter fit recommended: early-childhood education, pediatric/public-health, or child-injury prevention.

**Optional acknowledgement template**

> Reviewed the official CDC preschool page dated Feb. 20, 2026 on {actual review date}. I limited this source to its printed 3–5-year scope and to the traffic, outdoor supervision, water supervision, helmet, and playground-safety statements present on that page.

## 3. `cpsc-childproofing-home-2023`

**Production metadata**

- Organization/title: U.S. Consumer Product Safety Commission — *Childproofing Your Home: Several Safety Devices to Help Protect Your Children from Home Hazards*
- Year/edition/evidence level: 2023; Publication #252 · 032023; `parent_education`; verifiedOn: `2026-08-23`
- Production age scope: `null..null`; the source says “young children” and supplies no numeric band.
- Exact release use: only `gd_19_24m_safety` (19–24 months) in this release.
- Production primary URL: [official CPSC PDF](https://www.cpsc.gov/s3fs-public/252ChildproofingYourHome32123.pdf)
- Current official landing page: [CPSC Childproofing Your Home](https://www.cpsc.gov/safety-education/safety-guides/kids-and-babies/Childproofing-Your-Home)

**Exact claim scope to review**

- Window guards/safety netting should limit openings to four inches or less; at least one window in each room must remain easy to use for fire escape.
- Anchor furniture, televisions, and ranges; use cabinet/drawer locks to keep medicines, detergents, cleaners, matches, lighters, knives, and other hazards inaccessible.
- Safety devices must be correctly installed and re-engaged; no device is completely childproof.
- Do not infer a universal numeric age range from this source or present a device as a substitute for supervision.

**Currency/supersession check**

- The current CPSC landing page still serves Publication #252 · 032023 and reproduces the cited recommendations.
- No newer edition of Publication #252 was identified in CPSC's current Safety Education materials checked on 2026-08-24. The reviewer should re-check the live CPSC page, recalls, and product-specific standards before deciding.

**Reviewer requirement**

- Hard application gate: Owner account + recorded non-empty professional qualification; stored scope `education`.
- Subject-matter fit recommended: child-injury prevention, product/home safety, pediatric/public-health, or qualified early-childhood safety education.

**Optional acknowledgement template**

> Reviewed the current CPSC landing page and Publication #252 · 032023 on {actual review date}. I retained only the explicit childproofing instructions on four-inch window limits with a fire-escape window, anchors, locks, correct installation, and the warning that no device is completely childproof. I did not infer a numeric source age range.

## 4. `cdc-introduce-solid-foods-2026`

**Production metadata**

- Organization/title: Centers for Disease Control and Prevention — *When, What, and How to Introduce Solid Foods*
- Year/evidence level: 2026; `parent_education`; verifiedOn: `2026-08-23`
- Production age scope: `4..12` months.
- Exact release use: `gd_5_6m_nutrition`, `gd_7_9m_nutrition`, and `gd_10_12m_nutrition`.
- Production primary URL: [CDC official page](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html)

**Exact claim scope to review**

- Begin solids at about six months when developmentally ready; introduction before four months is not recommended.
- Start with one single-ingredient food at a time and wait 3–5 days between new foods.
- Potentially allergenic foods can be introduced with other foods in developmentally and choking-safe forms.
- Cow's milk or fortified dairy alternatives are not recommended as a drink until after 12 months; yogurt and cheese may be introduced earlier.
- If the child has severe eczema or egg allergy, discuss when and how to introduce peanut with a doctor or nurse.
- The page does **not** itself substantiate the separate “known food allergy or prior reaction” instruction, nor diagnosis, allergy testing, emergency treatment, or home re-challenge. The reviewer must verify those statements against other linked evidence or request a content change.

**Currency/supersession check**

- The live CDC page displays `Apr. 14, 2026` and currently contains the one-at-a-time/3–5-day, cow's-milk, and severe-eczema/egg-allergy statements.
- No newer CDC page replacing this title was identified in the official CDC infant-and-toddler nutrition collection checked on 2026-08-24.

**Reviewer requirement**

- Hard application gate: Owner account + recorded non-empty professional qualification; stored scope `education`.
- Subject-matter fit strongly recommended: pediatric nutrition, pediatrics, dietetics, allergy, or qualified infant-feeding public-health practice.

**Optional acknowledgement template**

> Reviewed the official CDC page dated Apr. 14, 2026 on {actual review date}. I limited this source to around-six-month developmental readiness, one single-ingredient food at a time with a 3–5-day interval, no cow's milk as a drink before 12 months, choking-safe preparation, and clinician discussion before peanut for severe eczema or egg allergy. I did not use it as evidence for diagnosis, testing, treatment, or re-introduction after a prior reaction.

## 5. `jr-niaid-peanut-prevention-2017`

**Production metadata**

- Organization/title: National Institute of Allergy and Infectious Diseases-sponsored expert panel — *Addendum guidelines for the prevention of peanut allergy in the United States: Report of the National Institute of Allergy and Infectious Diseases-sponsored expert panel*
- Year/edition/evidence level: 2017; *J Allergy Clin Immunol.* 139(1):29–44; `guideline`; DOI 10.1016/j.jaci.2016.10.010; PMID 28065278; verifiedOn: `2026-08-23`
- Production age scope: `4..12` months. The most precise high-risk recommendation is clinician-directed introduction around 4–6 months after considering evaluation for infants with severe eczema and/or egg allergy.
- Exact release use: `gd_5_6m_nutrition`, `gd_7_9m_nutrition`, and `gd_10_12m_nutrition`.
- Production primary URL: [PubMed PMID 28065278](https://pubmed.ncbi.nlm.nih.gov/28065278/)
- Official full guideline: [NIAID-hosted PDF](https://www.niaid.nih.gov/sites/default/files/addendum-peanut-allergy-prevention-guidelines.pdf)
- Official clinician summary: [NIAID clinician-summary PDF](https://www.niaid.nih.gov/sites/default/files/peanut-allergy-prevention-guidelines-clinician-summary.pdf)

**Exact claim scope to review**

- Severe eczema and/or egg allergy are the addendum's high-risk criteria for clinician-directed peanut introduction.
- For that group, the addendum discusses evaluation and introduction of age-appropriate peanut-containing food around 4–6 months when appropriate.
- This source is peanut-specific. It does not support the 3–5-day interval, cow's-milk timing, broad allergen advice, diagnosis/treatment, emergency management, or unsupervised home challenge after a known/prior reaction.
- The intended ACE wording is deliberately narrower than the old testing algorithm: “talk with a doctor before introducing peanut” for severe eczema or egg allergy.

**Currency/supersession check and material caveat**

- The official NIAID site still hosts the 2017 addendum, and current CDC/AAAAI public pages continue to identify severe eczema and/or egg allergy as high risk.
- However, this is a nine-year-old guideline and exceeds the application's eight-year `guideline` replacement-review threshold.
- Newer specialty-society guidance exists. A 2024 [AAAAI expert response](https://www.aaaai.org/allergist-resources/ask-the-expert/answers/2024/peanut) describes a 2021 AAAAI/ACAAI/CSACI consensus in which routine pre-introduction screening is not required, while the current [AAAAI public page](https://www.aaaai.org/tools-for-the-public/conditions-library/allergies/peanut-allergy) still treats severe eczema and/or egg allergy as high risk and advises considering screening around 4–6 months. Therefore the 2017 testing algorithm must not be presented as uncontested current standard of care.
- No formal newer NIAID-sponsored U.S. prevention addendum was identified in the official NIAID materials searched on 2026-08-24. That negative search is not proof of absence; a qualified reviewer must assess the newer consensus and local clinical practice before retaining this source.

**Reviewer requirement**

- Hard application gate: Owner account + recorded non-empty professional qualification; stored scope `education`.
- Subject-matter fit strongly recommended: pediatric allergy/immunology, pediatrics with current infant-allergy practice, or another appropriately qualified clinician able to assess supersession.
- If the reviewer independently chooses approval, a non-empty outdated-source acknowledgement is mandatory. The nutrition CAS also requires exactly one successful, post-stage, exact review audit with the resulting approved source row.

**Required acknowledgement template if—and only if—the reviewer independently confirms retention**

> Reviewed on {actual review date}: I checked PubMed PMID 28065278, the NIAID-hosted 2017 addendum, the newer 2021 AAAAI/ACAAI/CSACI consensus described by AAAAI, and current CDC/AAAAI infant peanut guidance. I found no formal superseding NIAID-sponsored U.S. prevention addendum, but I acknowledge that newer consensus guidance changes the screening discussion. I am retaining the 2017 source only for the limited high-risk criteria—severe eczema and/or egg allergy—and the cautious instruction to involve a clinician before peanut introduction. It is not being used to require routine screening, diagnose or treat allergy, support broad allergen or cow's-milk claims, or advise unsupervised re-challenge after a prior reaction.

## Reviewer completion checklist

- [ ] I opened each official URL myself and confirmed title, date/edition, and relevant passage.
- [ ] I compared only the limited claim scope above; I did not infer unsupported claims.
- [ ] I checked the live publisher/agency site for replacement, revision, withdrawal, correction, or material conflict.
- [ ] I confirmed the age scope is appropriate for every listed dependent guide.
- [ ] I recorded my actual account-backed qualification and actual review date; I did not borrow an identity.
- [ ] For NIAID 2017, I wrote a substantive supersession acknowledgement reflecting my own review.
- [ ] I understand that source approval does not approve content, complete six-dimensional review, or publish anything.
- [ ] After review, an operator will rerun the exact release preflight; no apply occurs unless it is `ready` with no blockers.

## Read-only provenance

- Production metadata and release phases were read on 2026-08-24 using read-only Convex queries.
- Official pages were checked on 2026-08-24.
- No reviewer identity, credential, token, session value, or other secret is included.
- No review, approval, source mutation, content mutation, apply, publish, deploy, or external message was performed while preparing this packet.
