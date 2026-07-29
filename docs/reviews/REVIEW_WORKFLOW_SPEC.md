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

