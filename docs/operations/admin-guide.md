# Admin & Content Operations Guide

## Roles
- **Content Admin** — creates/edits milestones, activities, awareness topics,
  myths/facts, lessons, safety rules, referral guidance, sources, healthcare
  facilities; moves content through the workflow.
- **Translator** — completes/reviews Myanmar/English pairs.
- **Clinical Reviewer** — approves/rejects health & development content; cannot
  access parent/child records.
- **Super Admin** — manages roles, app settings, and audit review.

## Content workflow
`Draft → Content Review → Translation Review → Clinical Review → Approved →
Published → Archived`. Only `Published` content is visible to parents. Every
transition writes to `clinical_reviews` + `audit_logs`.

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
