# Clinical Review Policy

## Purpose
ACE Child Grow is educational and screening-support only. It must **never
diagnose**. Parent-facing education requires evidence, child-safety, English and
native-Myanmar review. A qualified clinical specialist is required only for
diagnosis, treatment, medication, individualized advice or emergency-decision
wording.

## Golden rules
1. No content is shown to parents as guidance unless `review_status = 'published'`.
   Enforced in the DB (RLS) and in the UI (`isApprovedForParents`).
2. A legacy field named `clinicalStatus` stores the publication lifecycle. The
   field name does not make ordinary educational content clinical, and a
   `clinical_review` value is never evidence that a clinician approved it.
3. Never display: autism %, disorder probability, intelligence estimate,
   "normal vs abnormal child", diagnosis from a checklist, unsupported treatment
   outcomes, fabricated emergency numbers/facilities, or fabricated WHO
   percentiles/z-scores.
4. Urgent-safety logic is fixed and rule-based; it is **not** clinical content
   subject to editorial change without a safety review.

## Workflow (Admin CMS)
Library review is revision-bound. English copy, native-Myanmar language,
evidence and safety decisions are recorded separately in `contentReviews` for
every item. Those four current-revision approvals are sufficient for ordinary
milestones, activities, stories, lessons, printable catalogue metadata and
general parenting guidance. A current clinical decision and a named, qualified
clinical publisher are additionally required when risk detection finds
diagnosis, treatment, medication, individualized advice or emergency-decision
wording. Every decision and transition is written to `auditLogs`.

## Reviewer record
Each review captures `reviewerId`, `reviewerDisplayName`, `reviewerRole`,
`reviewerQualification`, `decision`, `note`, `reviewedAt`, and the exact
`contentVersion`. Editing content increments its review revision, so older
approvals remain visible history but are no longer current.

## When no clinical reviewer is assigned
The owner may still route ordinary education through English, native-Myanmar,
evidence and safety review. Staff preview access is not clinical approval.
Specialist-risk items stay unpublished until the additional reviewer identity,
qualification and current-revision clinical decision exist. Parent accounts
continue to receive only published items.

## Focused specialist boundaries
The seven slugs listed in `convex/lib/contentReviewRequirements.ts` require
specialist review for their emergency-decision wording only. Bed-sharing wording
also stays inside a specialist boundary because current authoritative public
guidance differs materially. Neither focused decision is approval of unrelated
developmental or education claims, and the words “clinically approved” must not
be used unless a licensed clinician formally approved that specific content.

## WHO growth standards
Percentiles/z-scores are shown **only** after: official WHO datasets are
integrated, dataset version documented, sex + exact age handled, logic tested
against reference cases, and a clinical review recorded. Until then the UI shows
"Validated WHO growth-standard integration is pending."

## Language
Respectful, strengths-based, non-stigmatizing. Show what a child *can* do and
what is *emerging*; never blame parents; never hide genuine concerns behind vague
positivity.
