# Admin & Content Operations Guide

## Roles
- **Owner** — invites staff, manages roles, billing and the service directory.
- **Content editor** — creates and edits library drafts and media.
- **Native-language reviewer** — reviews English and natural Myanmar wording.
- **Evidence reviewer** — reviews source support; a name and relevant
  professional qualification are required for approval decisions.
- **Clinical Reviewer** — reviews specialist-risk wording (diagnosis, treatment,
  medication, individualized advice and emergency decisions); cannot access
  parent/child records.
- **Support** — support access only; cannot edit or approve content.

## Content workflow
Open `/admin/reviews` to edit an item and record independent English copy,
native-Myanmar language, evidence and safety decisions. A clinical decision is
also recorded only when the item contains specialist-risk wording: diagnosis,
treatment, medication, individualized advice or an emergency decision. General
milestones, activities, stories, lessons, printable catalogue metadata and
parent education do not require a clinical reviewer merely because parents can
read them. Each decision is stored in `contentReviews` with the reviewer
identity, role, qualification, note, timestamp and exact review revision.
Editing content or refreshing it from the seed creates a new revision; prior
decisions stay in the history but cannot authorize the new text.

Only `published` library content is visible to parents. Ordinary education
publishing requires the four current-revision education decisions. A
specialist-risk item additionally requires a current clinical decision and a
named, qualified clinical reviewer for the publish action. Emergency-only and
bed-sharing review must not be described as approval of the item's ordinary
developmental content. Every edit, decision and publish attempt is audited.
Nothing is auto-approved.

## Safety rules
The nine fixed urgent rules (`safety_rules`) mirror the deterministic engine in
`src/domain/safety/safety.ts`. Editing wording is a **safety-reviewed** action;
the rule *logic* is code, not editable content.

## Healthcare directory
Never add invented facilities. Add a facility as inactive, then verify (records a
`healthcare_facility_verifications` row and `last_verified_at`); only active +
verified rows are public. Expire/deactivate stale entries.

## WHO growth standards
Do not enable percentiles until the licensed dataset is integrated, tested, and
clinically reviewed (clinical-review-policy.md). Until then the UI shows the
"pending" message.

## Audit
`audit_logs` is immutable and readable by Super Admin. Review it for publish
events, role changes, safety-rule edits, directory verifications, exports, and
deletions.
