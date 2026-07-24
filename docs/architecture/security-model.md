# Security Model

## Principle
Authorization is enforced **server-side in the database** via Postgres Row Level
Security (RLS). The client never decides who can read what; hidden buttons are
never treated as security.

## Identity & roles
Roles (`user_roles.role`): `parent`, `content_admin`, `translator`,
`clinical_reviewer`, `super_admin` (+ future professional roles present in the
enum but unused in MVP). Helper functions `has_role()` and `is_staff()` back the
policies.

## Ownership rule (P0)
Every private child record (`children`, `milestone_review_sessions`,
`milestone_responses`, `activity_completions`, `growth_records`, `sleep_records`,
`monthly_reports`, `notifications`, `parent_profiles`, `child_profiles`) is
guarded by `parent_id = auth.uid()` for both `USING` and `WITH CHECK`. Result:
**no account can read or write another account's child data** — the top P0
requirement — even if the client is compromised.

## Content visibility
Educational content (`milestones`, `activities`, `awareness_topics`,
`parent_lessons`) is readable only when `review_status = 'published'`, except for
staff who need drafts for the review workflow. Unreviewed clinical content can
therefore never appear to parents as approved guidance.

## Clinical reviewers
`clinical_reviewer` can act on `clinical_reviews` and see unpublished content,
but has **no policy granting access to parent/child records** — reviewers cannot
read unrelated parent data.

## Audit log
`audit_logs` has an INSERT policy and a super-admin SELECT policy, and
**deliberately no UPDATE/DELETE policy** — rows are immutable. Sensitive actions
(publish/unpublish, role change, safety-rule change, directory verification,
data export, account deletion) are recorded.

## Secrets
Only the Supabase **anon** key ships to the client (safe by design). The
**service-role** key and DB URL are server-only and never bundled, logged, or
committed. `.gitignore` blocks all `.env*` except `.env.example`.

## Transport & storage
HTTPS in transit; Supabase-managed encryption at rest. Inputs are validated
(domain engines throw structured errors on bad input); user-supplied HTML is
sanitized before render.

## Offline cache separation
The service worker caches **public educational content only**
(`/content/*`, precache). Authenticated API routes (`/api/*`, `/admin/*`) are on
the navigation denylist and are never cached, so private child records never
enter a public cache.

## Security tests (planned + partial)
Cross-account access, role escalation, direct-URL access, secret exposure,
public-cache leakage, unsafe HTML, invalid inputs. Unit-level input validation
is covered now; full authz integration tests require a live Supabase project.
