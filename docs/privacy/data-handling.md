# Data Handling & Privacy

## Principles
Child profiles are **private by default**. No public child profiles, no sale of
child data, no advertising profiles from child information, no public sharing
without an explicit parent action. Data minimization throughout (e.g. children
are identified by **nickname**, not full legal name).

## Parent controls
Parent consent (recorded with privacy-notice version) · privacy notice · data
export · delete child profile · delete account · logout from all sessions ·
confirmation for every destructive action.

## Storage & access
Private records are owned by `userId` and reachable only by that parent —
enforced per-function in `convex/` (every query/mutation derives the caller
from `getAuthUserId(ctx)` and scopes to it; see `security-model.md`), not by
database-level row policies. Encryption in transit (HTTPS) and Convex-managed
encryption at rest.

## Offline data
Only **public educational content** is cached by the service worker. Private
child records are never placed in a public cache; any offline private data lives
in authenticated, session-scoped storage and is cleared on logout.

## Deletion
Deleting a child profile cascades to that child's sessions, responses, growth,
sleep, and reports. Deleting an account cascades all owned data. Deletions are
audit-logged (the audit row records the action, not the deleted content).

## Sensitive actions audited
Content publish/unpublish, role changes, safety-rule changes, directory
verification, data export, account deletion.

## What we never store or infer
Diagnoses, disease probabilities, IQ estimates, "normal/abnormal" labels, or any
fabricated clinical/contact data.
