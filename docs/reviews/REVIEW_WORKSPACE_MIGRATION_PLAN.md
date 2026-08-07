# Reviewer workspace migration plan

No production migration is authorised by this document.

## Additive schema

Add new tables for reviewer access/scopes, assignments, append-only review events, checklist responses, comments and payment completion reports. Add new publication/review projection fields to library content as optional fields so deployment is schema-compatible.

## Existing mapping

- Existing `staffRole` values map through the compatibility table in `REVIEWER_ROLE_PERMISSION_MATRIX.md`.
- Existing `contentReviews` remain historical records. They are not silently converted into new approvals.
- Existing `clinicalStatus` becomes legacy metadata only after the new publication projection is backfilled.
- Existing `reviewRevision` is the initial review round/revision anchor.

## Defaults

- No reviewer assignment is inferred.
- No existing content is automatically clinically approved.
- New review dimensions default to pending or not-required only after a manager/risk classification decision.
- New publication status defaults to `internal_review` for previously published education-scoped content.

## Production dry-run report

Read-only count on 2026-07-29:

| Metric | Count |
|---|---:|
| Library total | 383 |
| Legacy published | 261 |
| Education-scoped library rows | 261 |
| Clinical-scoped approvals across library/evidence | 0 |
| Evidence total/approved | 90 / 90 |

All 261 education-scoped published rows require review-policy classification before a strict production cutover.

## Backfill rules

1. Classify required review dimensions from type/category/risk.
2. Preserve all old content review rows as imported legacy evidence, not new approval.
3. Set `publicationStatus=internal_review` unless current, scoped approvals satisfy every required dimension.
4. Create no assignment automatically unless a manager explicitly approves a batch plan.
5. Produce counts and sample slugs before writing.

## Rollback

- Before write: export ids, slugs, revisions, legacy status/scope and proposed new fields.
- Additive fields/tables allow application rollback without deleting data.
- Never roll back by deleting review/audit records.
- If parent content availability changes unexpectedly, disable the new publication feature flag and investigate; do not restore the unsafe bulk-publication mutation.

## Required production approval

Human approval is required after reviewing the dry-run row classification, parent availability impact, rollback export and verification queries. Production writes, deployment and real invitations must be separate approvals.
