# ACE Child Grow reviewer workspace — current-state audit

> **Historical baseline — do not use this file as the current implementation status.** This audit records the state of `main` at `1d94ac4` before reviewer-workspace PRs #20–#24 were opened. Findings such as “NOT STARTED” and “UNSAFE” below describe that audited baseline, not the later stacked branches. Current development status and remaining work are tracked in `REVIEW_WORKSPACE_IMPLEMENTATION_PROGRESS.md`. This file is intentionally preserved as the original audit record.

Audit date: 2026-07-29
Audited branch/commit: `main` / `1d94ac42ad290f8c7187c31516f27db924b3870f`
Working branch: `agent/reviewer-workspace-pr1`

## Executive verdict

**FAIL — P0 publication-safety gap.** The repository has useful review and invitation foundations, but it is not yet a scoped reviewer workspace. A production read-only query found 383 library records, 261 marked published and education-reviewed, and 0 clinical-scoped approvals. The parent read path currently trusts only `clinicalStatus === "published"`; therefore education-scoped bulk publication can expose material without the final review policy being represented in the read gate.

No production record was changed during this audit.

## Requirement classification

| Area | Status | Finding |
|---|---|---|
| Authenticated staff accounts | COMPLETE | Convex Auth identity is resolved server-side. |
| Raw-token storage prevention | COMPLETE | Invite code is returned once; SHA-256 digest is stored. |
| Single-use/expiring invitations | PARTLY COMPLETE | Pending/accepted/revoked/expired and email binding exist; scope, terms, configurable expiry and reviewer-specific role model are missing. |
| Server-side role checks | PARTLY COMPLETE | Sensitive mutations use helpers, but the role vocabulary is incomplete and review access is not assignment-scoped. |
| Reviewer-only route isolation | UNSAFE | `StaffOnlyRoute` gives every staff role the same frontend route surface. Backend checks reduce impact but the UI is not role-aware. |
| Assigned-content restriction | NOT STARTED | Reviewers can browse the whole library by type. There is no assignment table. |
| Myanmar/clinical separation | PARTLY COMPLETE | Review dimensions are separate and language reviewers cannot decide clinical/safety dimensions. Development review is absent. |
| Clinical approval qualification | COMPLETE | Clinical approval requires clinical reviewer role, name and qualification. |
| Publisher separation | NOT STARTED | No dedicated publisher capability/role. Existing clinical publication mutation doubles as approval/publication. |
| Append-only review history | UNSAFE | A decision for the same content/dimension/revision patches the existing record, losing intermediate decision history. |
| Reviewer comments/checklists | NOT STARTED | One optional note exists; no structured checklist or comments. |
| Review assignments/due dates/rounds | NOT STARTED | No data model or UI. |
| Manager progress dashboard | NOT STARTED | No progress by reviewer/age/type/blocker. |
| Review payment report | NOT STARTED | No review-completion/payment reporting model. |
| Reviewer notifications | NOT STARTED | Existing notifications are not wired to reviewer workflow. |
| Immutable audit trail | PARTLY COMPLETE | Server inserts audit rows and normal reviewers cannot edit them; current review patching still loses decision detail. |
| Seed preservation | PARTLY COMPLETE | Library import preserves published review metadata; new assignments/comments/approvals need explicit preservation tests. |
| Parent publication policy | UNSAFE | Parent queries use only a single `published` status; bulk education publication exists. |
| Production migration | NEEDS HUMAN DECISION | A dry run and backfill classification are required before any publication-field migration. |
| Real reviewer invitation/email | BLOCKED | Must remain disabled until owner approval, terms/versioning and email configuration are verified. |

## Current implementation

### Routes

- `/admin/reviews` — `ContentReviewWorkspace`
- `/admin/library` — library administration
- `/admin/team` — staff invitation and role management
- `/audit` — audit viewer
- `/admin/accept-invite/:inviteCode` — invitation acceptance

All admin routes use `StaffOnlyRoute`; there are no per-route capabilities.

### Current roles

`owner`, `content_editor`, `language_reviewer`, `evidence_reviewer`, `clinical_reviewer`, `support`.

Missing: `system_admin`, `review_manager`, `myanmar_language_reviewer`, `child_development_reviewer`, `publisher`, `auditor`. Existing roles require an explicit compatibility mapping.

### Current review dimensions/statuses

Dimensions: `english`, `native_myanmar`, `evidence`, `safety`, `clinical`.
Decisions: `in_review`, `approved`, `changes_requested`, `not_applicable`.
Content lifecycle: one overloaded `clinicalStatus` string (`draft`, `clinical_review`, `published`).

Missing: assignment statuses, `development` dimension, evidence-required/blocked/rejected decisions, independent language/development/clinical/evidence/publication statuses, expiry and re-review.

### Existing strengths

- Auth identity and sensitive writes are checked on the Convex server.
- Language reviewer cannot submit clinical/safety decisions.
- Clinical approval requires qualification and reviewer name.
- Edits increment `reviewRevision`, making older approvals stale.
- Invite token hash, expiry, reuse prevention and audit events exist.
- Public catalogue contains no per-parent private child record fields.

## P0/P1 risks

### P0 — final-publication gate is not represented

`convex/release.ts` contains bulk education-scoped publication mutations. `convex/library.ts` permits parent reads when `clinicalStatus` equals `published`, regardless of review scope or completed review dimensions. Production read-only counts:

- library total: 383
- published: 261
- education-scoped: 261
- clinical-scoped approvals: 0

Remediation: introduce a separate, server-derived publication status and required-review gate; make parent reads fail closed; retire bulk-publication mutations; backfill only after a reviewed dry run.

### P0 — reviewers are not assignment-scoped

Any non-support staff reviewer can list the shared catalogue and review any permitted dimension. Remediation: assignment-backed queries and server checks on every review mutation.

### P1 — review history is mutable

`contentReviews.saveDecision` patches the current record. Remediation: append immutable decision events and keep a separate current-state projection.

### P1 — broad client route surface

Every staff member can load every staff route. Remediation: capability-aware routes and navigation, while retaining server enforcement as the authority.

### P1 — unrestricted draft editor

Reviewers who can enter the workspace receive the same full bilingual/JSON editor. Remediation: role-specific proposed changes, field allowlists and tracked application by an editor/manager.

## Relevant files

- `convex/schema.ts`
- `convex/lib/auth.ts`
- `convex/admin.ts`
- `convex/contentReviews.ts`
- `convex/library.ts`
- `convex/release.ts`
- `convex/audit.ts`
- `src/app/App.tsx`
- `src/screens/ContentReviewWorkspace.tsx`
- `src/screens/AdminTeam.tsx`
- `src/content/__tests__/publicationGate.test.ts`
- `src/content/__tests__/seedImport.contract.test.ts`

## Validation commands

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `npx convex run --prod release:approvalStatus` (read-only production count only)

## Required implementation order

1. Fail-closed parent publication policy and removal of unsafe bulk publication.
2. Central role/capability helper and role-aware routes.
3. Secure reviewer profiles/invitations and assignment model.
4. Assignment-scoped reviewer queries and append-only events.
5. Review detail/checklists/decisions/history.
6. Manager progress, exports, payment completion report and notifications.
7. Migration dry run, security tests and supervised mobile QA.
