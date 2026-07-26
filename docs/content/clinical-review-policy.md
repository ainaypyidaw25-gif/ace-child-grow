# Clinical Review Policy

## Purpose
ACE Child Grow is educational and screening-support only. It must **never
diagnose**. All health and development content must be reviewed by a qualified
professional before it reaches parents as approved guidance.

## Golden rules
1. No content is shown to parents as guidance unless `review_status = 'published'`.
   Enforced in the DB (RLS) and in the UI (`isApprovedForParents`).
2. Every generated milestone, activity, awareness topic, myth/fact and lesson is
   created as `clinical_review` (or earlier). The seed sample in
   `src/data/seed/content.ts` is entirely `clinical_review`.
3. Never display: autism %, disorder probability, intelligence estimate,
   "normal vs abnormal child", diagnosis from a checklist, unsupported treatment
   outcomes, fabricated emergency numbers/facilities, or fabricated WHO
   percentiles/z-scores.
4. Urgent-safety logic is fixed and rule-based; it is **not** clinical content
   subject to editorial change without a safety review.

## Workflow (Admin CMS)
`Draft → Content Review → Translation Review → Clinical Review → Approved →
Published → Archived`. Each transition is recorded in `clinical_reviews` and
`audit_logs` with reviewer identity and qualification.

## Reviewer record
Each review captures `reviewer_id`, `reviewer_qualification`, `decision`,
`notes`, `reviewed_at`, and sets `next_review_at` for periodic re-review.

## When no clinical reviewer is assigned
The owner may receive staff access to inspect unpublished drafts, translations,
evidence links and audit reports. Staff preview access is not clinical approval.
The application and backend keep approval/publishing locked until a reviewer
qualification is supplied through the clinical-review workflow. Parent accounts
continue to receive only published items.

## WHO growth standards
Percentiles/z-scores are shown **only** after: official WHO datasets are
integrated, dataset version documented, sex + exact age handled, logic tested
against reference cases, and a clinical review recorded. Until then the UI shows
"Validated WHO growth-standard integration is pending."

## Language
Respectful, strengths-based, non-stigmatizing. Show what a child *can* do and
what is *emerging*; never blame parents; never hide genuine concerns behind vague
positivity.
