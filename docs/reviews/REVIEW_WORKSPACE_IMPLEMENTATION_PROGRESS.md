# Reviewer workspace implementation progress

Date: 2026-07-29  
Base: `origin/main` at `1d94ac4`  
Production changes: none

## Executive verdict

**CONDITIONAL PASS** for pull-request review and development testing.

The server-side role boundary, secure pre-sign-up invitations, scoped assignments, reviewer queue, role-dependent checklists, version-bound decisions, wording proposals, comments, audit timeline, publisher handoff and manager completion report are implemented on stacked local branches. Parent publication is fail-closed and remains separate from review approval.

This is not a production launch approval. Production still needs the reviewed migration/classification plan, supervised role and mobile QA, real reviewer identities, an owner-approved rollout window and separate merge/deployment approval.

## Stacked pull-request sequence

| PR | Branch | Commit | Scope |
|---|---|---|---|
| 1 | `agent/reviewer-workspace-pr1` | `77b3cf2` | Current-state audit, permission matrix, workflow, migration and QA documentation |
| 2 | `agent/reviewer-workspace-pr2` | `0f3784a` | Server permissions, secure invitations, assignments, audit events and fail-closed publication |
| 3 | `agent/reviewer-workspace-pr3` | `5007a66` | Reviewer queue, checklists, decisions, history and separate publisher handoff |
| 4 | `agent/reviewer-workspace-pr4` | `54850b0` | Reviewer comments, wording proposals, completion/payment reports and timeline UI |
| 5 | `agent/reviewer-workspace-pr5` | current branch tip | Permission edge cases, owner workflow, non-technical content editor, Preview Google sign-in configuration, responsive QA and launch-gate record |

Each branch is based on the previous branch so the changes can be reviewed in small units. Do not merge a later branch without its predecessors.

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
- Seed refresh tests protecting review revision state and tests covering direct Convex authorization.
- Owner operational control for reviewer management, assignments, content editing, non-clinical review, reports and publishing content that has already completed every required gate.
- A plain field-by-field content editor for Myanmar and English wording. Reviewers and editors are never asked to edit raw JSON.
- The plain editor now uses parent-friendly Myanmar labels for every bilingual field in the current 383-item seed library. Raw `mm`/`en` keys and internal taxonomy, relationship and evidence metadata are not shown as editable wording fields. The update mutation also preserves these server-owned fields, so a direct client call cannot overwrite or inject them.
- Owner self-assignment for language, development and evidence review with the same checklist, revision and audit requirements as any reviewer. Clinical sign-off remains a separately qualified role.
- Handler-level permission tests now cover the restricted-role combinations: language and child-development reviewers cannot grant clinical approval or publish; publishers can read but cannot alter sign-offs; auditors remain read-only; and scoped reviewers cannot browse unrelated review history.
- Development Preview Google sign-in now receives its dedicated OAuth client ID and secret explicitly from Convex environment configuration. Production OAuth configuration was not changed.
- A dedicated Development owner account completed the reviewer workspace checks at 360×800 and 820×1180. Myanmar text wrapped correctly, the field editor stayed non-technical, and no control was hidden behind the bottom navigation.
- The temporary QA owner's staff access was revoked after testing; the existing session immediately lost `/admin/reviews` access and returned to the parent home screen.

### Partly complete

- Manager progress: overall and reviewer-level progress exists; age-group, content-type and blocker charts remain.
- Assignment management: single assignment and status transitions exist; manager bulk assignment, due-date extension and reassignment UI remain.
- Reports: on-screen completion report exists; CSV/print export remains.
- Payment reporting: backend batches exist; manager payment-batch UI remains.
- Notifications: immediate in-app notifications exist; scheduled reminders and manager digest remain.
- Invitation delivery: secure copy-link workflow exists; real email delivery is deliberately disabled until a separate approved email rollout.
- Review requirements: strict fixed publication dimensions are enforced; per-item configurable required-review dimensions need an owner-approved classification policy.

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

## Validation results

Commands executed from the clean reviewer worktree:

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test -- --run` — PASS, 48 files / 586 tests
- `npm run build` — PASS; only the existing Vite large-chunk advisory remains
- `npx convex dev --once` — PASS against the Development deployment; functions compiled and became ready without touching Production
- `npx playwright test tests/e2e/staff-invite.spec.ts` — PASS, 1/1
- Full Playwright run — app boot passed, three credential-dependent flows skipped, and the invitation test initially exposed stale expected Myanmar copy; the expectation was updated and the focused flow then passed
- `git diff --check` — PASS before final commit

Development Convex code generation was used to validate schema/functions. No production Convex data mutation, real email, reviewer invitation, Git merge or production deployment was performed.

## Remaining P0 launch blockers

- Approve the 383-row classification dry run and expected parent-catalogue impact.
- Complete supervised browser acceptance with dedicated restricted-role accounts; the server-side role combinations and revoked-access enforcement are already covered by automated tests.
- Confirm the final Development Google OAuth callback after Google-side client propagation. The consent screen already loads without `invalid_client`.
- Identify and authorise actual clinical reviewers before any item requiring clinical review can become publishable.
- Review and approve the rollback export and production verification queries.

## Exact next human approval

The next safe approval is: **approve opening the five stacked pull requests for code review**. This approval must not be interpreted as permission to merge, migrate production data, invite real reviewers or deploy. Those actions require later, separate approvals after PR review and supervised QA.
