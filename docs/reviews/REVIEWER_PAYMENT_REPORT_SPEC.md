# Reviewer completion and payment-report specification

This feature records work completion for manual fee calculation. It does not send money or connect to the parent subscription payment flow.

Payment rates, adjustments, notes and proposed amounts are manager-only financial information. Ordinary reviewers must not receive these fields. A reviewer may be shown only their own non-financial completion counts where that view is implemented.

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
- A Review Manager may prepare a report, create a draft batch and mark a batch disputed.
- Only an `owner` or `system_admin` may set `approved_for_payment` or record `paid`.
- Status changes must follow the allowed transition sequence; a client must not jump directly from an uncalculated batch to `paid`.
- Adjustments require a reason and audit event.
- “Paid” is a recorded external/manual outcome, not evidence of an in-app transfer.
- No automatic payment, bank transfer, wallet charge, parent-subscription reuse or payment-provider call is part of this feature.
- CSV and print-friendly export are permitted. PDF is added only through the established report renderer and after layout verification.

## Access summary

| Action | Review Manager | Owner / System Admin | Reviewer | Publisher / Auditor |
|---|---:|---:|---:|---:|
| View rates and payment amounts | Yes | Yes | No | No |
| Prepare batch | Yes | Yes | No | No |
| Mark disputed | Yes | Yes | No | No |
| Approve for payment | No | Yes | No | No |
| Record externally paid | No | Yes | No | No |

All checks must be enforced by Convex server functions, not only by hidden buttons.
Every monetary query, mutation and export additionally requires an active profile with an explicitly persisted privileged staff role. The legacy boolean-only `isStaff` compatibility fallback must never grant access to payment data or payment transitions.

If a bounded completion or payment query reports that more rows exist, the interface must label the result as partial and disable any export that could be mistaken for a complete accounting record.
