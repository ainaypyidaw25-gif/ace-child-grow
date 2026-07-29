# Reviewer workflow specification

## State model

Independent dimensions:

- Language: `not_required`, `pending`, `in_review`, `changes_requested`, `approved`
- Development: `not_required`, `pending`, `in_review`, `changes_requested`, `approved`
- Clinical: `not_required`, `pending`, `in_review`, `evidence_required`, `changes_requested`, `approved`, `expired`
- Evidence: `not_required`, `pending`, `in_review`, `evidence_required`, `approved`, `expired`
- Publication: `draft`, `internal_review`, `pilot_review`, `ready_to_publish`, `published`, `archived`

Assignment states: `assigned`, `in_review`, `changes_requested`, `revised`, `re_review_required`, `approved`, `blocked`, `cancelled`.

## Gate calculation

`ready_to_publish` is derived server-side only when every required review dimension is current for the exact content revision and no approval is expired or revoked. Publishing is a separate mutation requiring Publisher capability. Parent reads require `publicationStatus === "published"` and the stored gate revision to equal the current review revision.

Clinical approval is required only when a risk classifier or Review Manager marks clinical review required. Myanmar approval never implies clinical approval.

## Invitation

1. Manager records reviewer identity, type, scope, ages, content types, expiry and note.
2. Server creates a cryptographically random token, stores its digest and returns the raw value once.
3. Reviewer signs in with the invited email, accepts versioned terms and claims the invitation.
4. Server atomically consumes the invitation and creates scoped reviewer access.
5. Creation, acceptance, expiry, revocation and role changes are audit events.

## Assignment and review

1. Manager assigns an exact content revision and review type.
2. Reviewer sees only active assignments permitted by role/scope.
3. Starting review creates an append-only event.
4. Proposed text is stored separately from canonical content.
5. Required checklist items must be complete before approval.
6. Changes requested/blocked/evidence required/rejected decisions require a reason.
7. Revision increments the review round and returns to the correct reviewer.
8. Publisher can publish only after the gate projection reports ready.

## Audit integrity

Every sensitive transition stores actor, timestamp, action, previous value, new value and reason. Normal reviewers cannot update or delete audit rows. Seeds must not overwrite reviewer profiles, assignments, decisions, comments, approvals or audit events.

## Notifications

- Reviewer notifications are private to the signed-in recipient.
- New assignment, changes requested, revision ready, due-soon and overdue events may create in-app notifications.
- Scheduled reminders must use a stable duplicate key so the same reminder is not sent repeatedly.
- Scheduled reminder workers paginate every matching assignment and manager recipient; a fixed first page must not starve later records, and manager digests are sent only after complete totals are known.
- A notification may link to the assigned review item but must not contain a raw invitation token or unrelated parent/child information.
- Invitation email and other real email delivery remain disabled until a separate approved rollout. PR6 uses in-app notifications only.

## Reviewer completion and payment record

- Completion counts are calculated by the server from assignments and review events.
- Reviewer rates, adjustments, notes and proposed payment amounts are manager-only.
- A Review Manager may prepare a batch or mark it disputed.
- Only an Owner or System Admin may approve a batch or record that an external payment has been completed.
- The recorded `paid` status does not transfer money. Reviewer payment remains a manual process outside this app.
- CSV and print-friendly manager exports are allowed. They must use the same server-authorised data and must not expose payment data to reviewers or publishers.
- If a bounded report indicates additional rows exist, it is labelled partial and its complete-report export actions are disabled.
