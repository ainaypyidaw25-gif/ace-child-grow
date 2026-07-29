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
| View reviewer payment report | Yes | Yes | Own summary only | Own summary only | Own summary only | No | Yes if granted |
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
- Revocation immediately invalidates reviewer queries and mutations.
- Auditors receive read-only access to review data and never parent or child records.

