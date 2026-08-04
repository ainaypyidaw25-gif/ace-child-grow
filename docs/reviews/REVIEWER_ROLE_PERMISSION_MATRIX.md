# Reviewer role and permission matrix

Server-side capabilities are authoritative. Hidden buttons are not security controls.

| Capability | System Admin | Review Manager | Myanmar Reviewer | Development Reviewer | Clinical Reviewer | Publisher | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|
| Manage system roles | Yes | No | No | No | No | No | No |
| Invite/revoke reviewers | Yes | Yes | No | No | No | No | No |
| Assign/reassign content | Yes | Yes | No | No | No | No | No |
| View all review progress | Yes | Yes | Scoped | Scoped | Scoped | Ready-only | Yes |
| View assigned content | Yes | Yes | Yes | Yes | Yes | Ready-only | Yes |
| Propose Myanmar text | Yes | Yes | Yes | No | No | No | No |
| Approve Myanmar language | No | No | Yes | No | No | No | No |
| Approve development review | No | No | No | Yes | No | No | No |
| Approve clinical review | No | No | No | No | Yes | No | No |
| Publish after all gates | No | No | No | No | No | Yes | No |
| Alter another reviewer sign-off | No | No | No | No | No | No | No |
| View reviewer completion summary | Yes | Yes | Own counts only | Own counts only | Own counts only | No | Yes |
| View reviewer rates/payment amounts | Yes | Yes | No | No | No | No | No |
| Prepare or dispute a payment batch | Yes | Yes | No | No | No | No | No |
| Approve payment / record externally paid | Yes | No | No | No | No | No | No |
| Export management reports | Yes | Yes | No | No | No | No | Yes |
| View parent/child private data | No | No | No | No | No | No | No |

## Legacy role mapping

| Existing role | New effective role | Notes |
|---|---|---|
| `owner` | System Admin | Does not automatically gain clinical approval. |
| `content_editor` | Review Manager | Content-edit capability may remain separately granted. |
| `language_reviewer` | Myanmar Language Reviewer | Rename via compatibility mapping. |
| `evidence_reviewer` | Auditor/evidence specialist | Evidence decision capability only. |
| `clinical_reviewer` | Clinical Reviewer | Requires name and qualification. |
| `support` | No reviewer access | Support functions only. |

## Capability rules

- A role may have one or more explicit capabilities, but clinical approval and publication must always be separate capabilities.
- Assignments restrict content access in addition to role capability.
- Managers may view assignments but cannot approve a review dimension unless they also hold that reviewer capability.
- Reviewer rates, adjustments and proposed payment amounts are manager-only financial information. Reviewers may see only their own non-financial completion counts.
- Monetary access requires an active profile with an explicitly persisted `owner`, `system_admin` or `review_manager` role; the legacy boolean-only staff fallback is never sufficient.
- A Review Manager may prepare a payment batch or mark it disputed. Only an `owner` or `system_admin` may approve it or record that an external payment was completed.
- A recorded `paid` status is an audit record of a manual/external payment. ACE Child Grow does not automatically send reviewer payments.
- Revocation immediately invalidates reviewer queries and mutations.
- Auditors receive read-only access to review data and never parent or child records.
