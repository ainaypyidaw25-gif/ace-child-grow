# Reviewer workspace QA checklist

## Security and permissions

- [ ] Myanmar reviewer cannot open system/team/billing settings.
- [ ] Reviewer sees assigned items only.
- [ ] Direct Convex query/mutation cannot bypass assignment or role checks.
- [ ] Language/development reviewer cannot approve clinical content.
- [ ] Reviewer cannot publish, archive or delete content.
- [ ] Publisher cannot alter sign-off records.
- [ ] Revoked access fails immediately.
- [ ] Expired/used/revoked invitation cannot be claimed.
- [ ] Reviewer cannot read parent/child private records or unrelated reviewer emails.

## Workflow

- [ ] Start, request changes, revise, re-review, approve, block and cancel transitions are valid.
- [ ] Required reasons and checklist items are enforced by the server.
- [ ] Review events are append-only and include actor/time/before/after/reason.
- [ ] New content revision invalidates stale approvals.
- [ ] Expired/revoked clinical approval removes readiness.
- [ ] Publication is a separate authorised action.
- [ ] Counts match underlying assignments/events.
- [ ] Seeds preserve assignments, comments, decisions and audit history.

## Desktop/iPad/mobile

- [ ] Queue table paginates and filters without horizontal page overflow.
- [ ] Compact view is usable at 360px width.
- [ ] Myanmar text wraps without clipping or broken stacked glyphs.
- [ ] English/Myanmar comparison stacks on mobile and is side-by-side on wide screens.
- [ ] Bottom navigation does not cover actions.
- [ ] Loading, empty, error and offline states are visible and actionable.
- [ ] Buttons have accessible names, keyboard focus and confirmation where required.
- [ ] Long evidence titles/URLs and review notes wrap safely.

## Release gate

- [ ] Typecheck, lint, unit/integration/permission tests and production build pass.
- [ ] Migration dry-run counts reviewed by owner.
- [ ] No production mutation, invitation email, merge or deployment occurred without its separate approval.
- [ ] Parent catalogue shows only content satisfying the final publication policy.

## Notifications, payment report and export

- [x] Automated tests confirm a reviewer can read only notifications addressed to their own account.
- [x] Automated tests confirm due-soon and overdue reminders are not duplicated when the scheduled job runs again.
- [x] Cursor-paginated reminder tests cover assignments and manager recipients beyond the first page and verify complete digest totals.
- [x] Notification action paths are allowlisted; assignment access remains enforced by the destination query.
- [x] Reviewers, publishers and auditors cannot read rates, adjustments, notes or proposed payment amounts.
- [x] Legacy `isStaff` rows without an explicit persisted role cannot call any monetary report or payment mutation.
- [x] Review Manager can prepare or dispute a batch but cannot approve it or mark it paid.
- [x] Only Owner/System Admin can set `approved_for_payment` or record an external payment as `paid`.
- [x] Invalid payment status jumps, empty batches and negative proposed totals are rejected by the server.
- [x] CSV and print exports contain only authorised report fields and export actions are audited.
- [x] Truncated summary/completion reads surface partial-result metadata and disable CSV/print exports.
- [x] No automatic reviewer payment, production email, real invitation, production migration or deployment occurred.
- [x] Unchanged seed/import runs do not open a new review revision; changed unapproved wording cannot reuse the prior active approvals.
- [x] The plain content editor warns before unsaved wording is discarded.

## Current automated run — consolidated branch, 2026-08-04

The checked results below verify the reconciled #20–#25 development branch and make it ready for a draft PR. They do not approve production deployment.

- [x] Typecheck passed.
- [x] Lint passed.
- [x] Unit/integration/permission/UI suite passed: 110 files, 1,131 tests.
- [x] Production build passed; PWA precache generated with 217 entries.
- [x] Development Convex validation passed; schema and functions compiled without touching Production.
- [x] Focused browser checks passed: 5 passed and 1 expected sign-in-dependent skip.

## Remaining manual acceptance

- [ ] Sign in with dedicated Myanmar, development, clinical, publisher, auditor and Review Manager accounts and confirm each role sees only its permitted controls and records.
- [ ] Verify notification action links with an assigned reviewer and confirm an unrelated reviewer cannot open the target assignment.
- [ ] Verify the payment workspace is hidden from reviewer, publisher and auditor accounts while remaining available to authorised managers.
- [ ] Verify Review Manager cannot approve/mark paid and Owner/System Admin can do so only through valid transitions.
- [ ] Check the reviewer queue, notification history, payment workspace, CSV text and print layout on desktop, iPad and 360px mobile.
- [ ] Confirm Myanmar text wraps correctly and bottom navigation does not cover actions on a physical Android test device.
