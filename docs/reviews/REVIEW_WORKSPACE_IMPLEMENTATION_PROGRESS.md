# Reviewer workspace implementation progress

Date: 2026-08-04
Base: `origin/main` at `0af4a78`
Production changes: none

## Executive verdict

**CONDITIONAL PASS — ready for a draft PR** for code review and development testing.

The server-side role boundary, secure pre-sign-up invitations, scoped assignments, reviewer queue, role-dependent checklists, version-bound decisions, wording proposals, comments, audit timeline, publisher handoff and manager completion report are implemented on stacked local branches. Parent publication is fail-closed and remains separate from review approval.

This is not a production launch approval. Production still needs the reviewed migration/classification plan, supervised role and mobile QA, real reviewer identities, an owner-approved rollout window and separate merge/deployment approval.

## Consolidated pull-request status

The unique implementation from draft PRs #20–#25 has been reconciled onto a fresh branch based on current `origin/main`: `agent/reviewer-workspace-refresh`. This replaces the stale stacked dependency chain with one reviewable draft. It has not been merged or deployed.

| Source drafts | Consolidated branch | Scope |
|---|---|---|
| #20–#25 | `agent/reviewer-workspace-refresh` | Audit and operating docs; role/scoped invitations; assignments and checklists; version-bound decisions; comments and wording proposals; publisher handoff; reports, notifications and payment-report controls; current-main authorization and queue compatibility fixes |

## Implemented status

### Complete in development

- Central server-side role and capability checks for system admin, review manager, language reviewer, child-development reviewer, clinical reviewer, publisher and auditor.
- Reviewer-only accounts see exact assigned content revisions, not unrelated content or parent/child private records.
- Email-bound, expiring, single-use invitation codes stored as hashes; pending/accepted/expired/revoked lifecycle and terms acceptance.
- Assignment lifecycle with reviewer type, revision, round, due date, priority, scope and append-only events.
- Reviewer dashboard summary, assigned/managed queues and item detail.
- English/Myanmar comparison, source/evidence display and role-dependent mandatory checklists.
- Version-bound review decisions. Language/development reviewers cannot grant clinical approval.
- Wording proposals and comments that do not overwrite canonical content.
- Separate publisher queue. Publisher cannot alter sign-off records.
- Manager reviewer-completion report and manual payment-batch data model; no payment processing.
- Server audit events for invitations, assignments, comments, proposals, decisions and publication actions.
- New-assignment and review-state in-app notification records.
- Private in-app due-soon, overdue and Review Manager digest reminders with daily duplicate prevention, safe action links and cursor-paginated processing so later assignments and managers are not starved.
- Bounded, signed-in-user notification loading, individual read state and a clear notification history screen.
- Manager-only payment workspace with server-derived completion snapshots, guarded status transitions and audit records. Monetary APIs require an active, explicitly persisted staff role, so the legacy `isStaff` fallback cannot grant payment access. Review Managers may prepare or dispute; only Owner/System Admin may approve or record an external payment as paid.
- Authorised completion/payment CSV export and print-friendly reports. The app does not process or transfer reviewer payments.
- Seed refresh tests protecting review revision state and tests covering direct Convex authorization.
- Owner operational control for reviewer management, assignments, content editing, non-clinical review, reports and publishing content that has already completed every required gate.
- A plain field-by-field content editor for Myanmar and English wording. Reviewers and editors are never asked to edit raw JSON.
- The editor warns before an Owner/Content Editor leaves with unsaved wording changes, including when the browser page itself is closed.
- The plain editor now uses parent-friendly Myanmar labels for every bilingual field in the current 383-item seed library. Raw `mm`/`en` keys and internal taxonomy, relationship and evidence metadata are not shown as editable wording fields. The update mutation also preserves these server-owned fields, so a direct client call cannot overwrite or inject them.
- Owner self-assignment for language, development and evidence review with the same checklist, revision and audit requirements as any reviewer. Clinical sign-off remains a separately qualified role.
- Handler-level permission tests now cover the restricted-role combinations: language and child-development reviewers cannot grant clinical approval or publish; publishers can read but cannot alter sign-offs; auditors remain read-only; and scoped reviewers cannot browse unrelated review history.
- Development Preview Google sign-in now receives its dedicated OAuth client ID and secret explicitly from Convex environment configuration. Production OAuth configuration was not changed.
- A dedicated Development owner account completed the reviewer workspace checks at 360×800 and 820×1180. Myanmar text wrapped correctly, the field editor stayed non-technical, and no control was hidden behind the bottom navigation.
- The temporary QA owner's staff access was revoked after testing; the existing session immediately lost `/admin/reviews` access and returned to the parent home screen.

### Partly complete

- Manager progress: overall and reviewer-level progress exists; age-group, content-type and blocker charts remain.
- Assignment management: single assignment and status transitions exist; manager bulk assignment, due-date extension and reassignment UI remain.
- Reports: completion/payment CSV and print-friendly exports are implemented; a dedicated PDF renderer remains out of scope.
- Payment reporting: manager workspace and manual batch tracking are implemented; automatic payment processing remains deliberately out of scope.
- Notifications: immediate and scheduled in-app reminders are implemented; real email delivery remains deliberately disabled.
- Invitation delivery: secure copy-link workflow exists; real email delivery is deliberately disabled until a separate approved email rollout.
- Review requirements: strict fixed publication dimensions are enforced; per-item configurable required-review dimensions need an owner-approved classification policy.

### Consolidated draft ready for review

The final source draft contributed the following development work:

- Added private in-app notifications for review due dates, overdue work, revision/re-review readiness and manager summaries, with duplicate prevention and action links.
- Kept notification reads scoped to the signed-in user and bounded loading rather than exposing another reviewer's notifications.
- Added manager-only payment-batch reporting and hardened the payment status workflow.
- Allowed a Review Manager to prepare or dispute a batch while reserving `approved_for_payment` and `paid` for Owner/System Admin.
- Added CSV and print-friendly exports for authorised managers. Bounded reports now identify partial results and disable export rather than presenting truncated counts as complete. No automatic payment and no new PDF renderer are included.
- Added tests for notification ownership/deduplication, payment permissions, valid status transitions, server-derived counts and exports.
- Made both seed/import paths no-op for identical content and reset only the active review/publication pointers when unapproved wording truly changes. Published/approved content and all historical assignments, comments, approvals and audit events remain protected.

The consolidated draft does **not** authorise or perform any production migration, production deployment, merge, real email, real reviewer invitation or role grant. It also does not process or transfer money.

### Not started or human-dependent

- Real reviewer invitations and production role grants.
- Production classification/backfill and reviewer assignments.
- Production migration, merge or deployment.
- Supervised browser QA with real restricted reviewer accounts. The equivalent server-side permission combinations are now covered by automated handler tests.
- Final Google OAuth callback confirmation after the new Development OAuth client finishes propagating through Google's consent service.
- Clinical reviewer identity, qualification, scope and re-review-date governance.

## Security findings and controls

1. The production read-only audit found 261 education-scoped legacy published items and zero clinical-scoped approvals. The new parent gate does not trust that legacy state.
2. Unsafe bulk publication functions are retired in the new code and fail instead of publishing every non-archived row.
3. Reviewer mutations require server-side role plus assignment checks; hiding a button is never the security boundary.
4. Reviewer wording proposals are stored separately. Accepting a proposal records a decision but does not silently change canonical content.
5. Proposal decisions now record the actual assignment review round, not a hard-coded first round.
6. Reviewer comments marked manager-only cannot be created by ordinary reviewers or disclosed to unrelated reviewers.
7. Publication requires exact-current-revision review approvals. An owner or publisher may perform the separate publication action, but neither can create a clinical sign-off without the qualified clinical-review role.

## Migration dry-run

Read-only production counts recorded on 2026-07-29:

| Metric | Count |
|---|---:|
| Library total | 383 |
| Legacy published | 261 |
| Education-scoped legacy published | 261 |
| Clinical-scoped approvals | 0 |
| Evidence total / approved | 90 / 90 |

Result: **no production write is safe yet**. All 261 legacy rows need required-review classification and a sampled impact report before any backfill. The schema changes are additive, but the publication-policy transition needs owner review because parent-visible availability may change.

## Current consolidated automated validation

The following results were recorded after reconciling all six source drafts with current `main`. They make the consolidated branch ready for a draft PR, not for production deployment.

Commands executed from the clean reviewer worktree:

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS, 108 files / 1,106 tests
- `npm run build` — PASS; PWA precache generated successfully with 215 entries
- `npx convex codegen` — PASS against the Development Convex deployment; schema and functions compiled without touching Production
- Focused Playwright checks — PASS, 5 passed / 1 expected sign-in-dependent skip; mobile/iPad owner queue, item opening, disabled import and production-bundle route safety verified

No production Convex data mutation, real email, real reviewer invitation, role grant, Git merge or production deployment was performed.

## Remaining P0 launch blockers

- Approve the 383-row classification dry run and expected parent-catalogue impact.
- Complete supervised browser acceptance with dedicated restricted-role accounts; the server-side role combinations and revoked-access enforcement are already covered by automated tests.
- Complete the remaining manual restricted-role checks on desktop, iPad and small mobile widths, including notification action links and payment workspace visibility.
- Confirm the final Development Google OAuth callback after Google-side client propagation. The consent screen already loads without `invalid_client`.
- Identify and authorise actual clinical reviewers before any item requiring clinical review can become publishable.
- Review and approve the rollback export and production verification queries.

## Exact next human approval

The next safe action is: **open the consolidated branch as one draft pull request and mark #20–#25 as superseded**. This does not permit merging, production migration, production deployment, production email, real reviewer invitation or role grant. Each of those actions requires a later, separate approval after manual restricted-role/mobile QA.
