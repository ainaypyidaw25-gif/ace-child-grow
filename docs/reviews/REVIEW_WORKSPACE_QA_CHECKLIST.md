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

## Automated run — 2026-07-29

- [x] Typecheck passed.
- [x] Lint passed.
- [x] Unit/integration/permission suite passed: 47 files, 571 tests.
- [x] Production build passed; existing large-chunk advisory only.
- [x] Signed-out staff invitation create-account/sign-in E2E passed.
- [x] Direct-handler tests cover unrelated-assignment denial, manager-only notes, proposal isolation, manager-report denial and actual-round audit events.
- [ ] Credential-dependent parent and login-persistence E2E flows were skipped by their existing environment guards.
- [ ] Desktop/iPad/360px supervised reviewer QA remains required.
