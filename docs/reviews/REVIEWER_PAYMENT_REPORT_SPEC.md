# Reviewer completion and payment-report specification

This feature records work completion for manual fee calculation. It does not send money or connect to the parent subscription payment flow.

## Fields

- reviewer id/name/type
- payment batch id/name
- assigned item count
- first reviews completed
- revision reviews completed
- final approvals completed
- blocked/rejected/overdue counts
- total completed items
- agreed rate per item or package (MMK)
- manual adjustment (MMK) with reason
- proposed payable amount (MMK)
- status and payment note
- calculated/approved/paid actor and timestamp

Statuses: `not_calculated`, `ready_for_review`, `approved_for_payment`, `paid`, `disputed`.

## Integrity rules

- Counts are derived server-side from immutable assignment/review events.
- Reviewers cannot edit counts, rates, adjustments or status.
- A Review Manager may prepare a report; payment approval requires an explicit finance/system capability.
- Adjustments require a reason and audit event.
- “Paid” is a recorded external/manual outcome, not evidence of an in-app transfer.
- CSV and print-friendly export are permitted. PDF is added only through the established report renderer and after layout verification.

