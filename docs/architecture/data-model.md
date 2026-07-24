# Data Model

Backend: Supabase / Postgres. Full DDL in `supabase/migrations/0001_core_schema.sql`;
authorization in `0002_rls_policies.sql`.

## Conventions
- UUID primary keys (`gen_random_uuid()`).
- `created_at` / `updated_at` on every table.
- Ownership via `parent_id → auth.users(id)`.
- Soft delete via `deleted_at` where appropriate.
- Content tables carry bilingual + review/version/publication columns.

## Entity groups

**Identity & roles:** `users`, `user_roles`, `admin_users`, `parent_profiles`.

**Children (private):** `children` (nickname only, birth date, gestational
weeks, `use_corrected_age`), `child_profiles`.

**Taxonomy:** `age_groups` (10 groups), `development_domains` (10 domains),
`content_sources`.

**Milestones:** `milestones` (age range, domain, bilingual question/explanation,
source, review fields), `milestone_review_sessions` (immutable `result_snapshot`
jsonb, `lost_skill`), `milestone_responses` (answer enum, note, saved_concern).

**Activities:** `activities` (bilingual, difficulty, steps, safety note, easier/
harder variations, offline flag), `activity_completions` (feedback enum).

**Awareness & learning:** `awareness_topics`, `myths_and_facts`,
`parent_lessons` (audio-ready field, offline flag), `lesson_progress`.

**Health tracking (private):** `growth_records` (values normalized to kg/cm on
write, input units stored), `sleep_records` (times, naps, waking, breathing
flags).

**Safety & guidance:** `safety_rules` (fixed urgent rules), `referral_guidance`
(per result state), `clinical_reviews` (workflow decisions).

**Ops:** `monthly_reports`, `notifications`, `app_settings`,
`offline_content_manifests`, `healthcare_facilities` (+`_verifications`),
`audit_logs` (immutable).

## Enumerated types
`app_role`, `review_status` (draft → content_review → translation_review →
clinical_review → approved → published → archived), `milestone_answer`,
`result_state`, `development_domain`, `weight_unit`, `length_unit`.

## Key constraints
- `children.gestational_weeks` CHECK 22–44.
- Milestone/activity `age_min_months <= age_max_months`.
- `milestone_responses` UNIQUE `(session_id, milestone_id)`.
- `healthcare_facilities.is_active` defaults **false** (inactive until verified).
- Indexes on all parent/child foreign keys and content lookup paths.
