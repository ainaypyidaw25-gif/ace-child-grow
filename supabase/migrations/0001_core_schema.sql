-- ACE Child Grow — core schema (Phase 4).
-- Backend: Supabase (Postgres + Auth + RLS). Authorization is enforced in the
-- DATABASE via Row Level Security, not the client. See docs/architecture/security-model.md.
--
-- Conventions:
--   * All ids are uuid default gen_random_uuid().
--   * created_at / updated_at on every table.
--   * Ownership via parent_id -> auth.users(id).
--   * Soft delete via deleted_at where appropriate.
--   * Content tables carry bilingual + review/version/publication fields.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app_role as enum (
  'parent', 'content_admin', 'translator', 'clinical_reviewer', 'super_admin',
  -- future professional roles (schema-present, not used in MVP flows)
  'pediatrician', 'speech_therapist', 'occupational_therapist', 'physiotherapist', 'teacher'
);

create type review_status as enum (
  'draft', 'content_review', 'translation_review', 'clinical_review',
  'approved', 'published', 'archived'
);

create type milestone_answer as enum ('yes', 'sometimes', 'not_yet', 'not_sure');
create type result_state as enum ('green', 'yellow', 'orange', 'red');
create type development_domain as enum (
  'gross_motor','fine_motor','speech_language','cognitive','social_emotional',
  'play','self_help','growth_nutrition','sleep','safety_health'
);
create type weight_unit as enum ('kg','lb');
create type length_unit as enum ('cm','in');

-- ---------------------------------------------------------------------------
-- Identity, roles, profiles
-- ---------------------------------------------------------------------------
-- Mirror of auth.users we can attach app data to. Row created on sign-up.
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role app_role not null default 'parent',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index idx_user_roles_user on user_roles(user_id);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  reviewer_qualification text,               -- for clinical reviewers
  created_at timestamptz not null default now()
);

create table parent_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null unique references users(id) on delete cascade,
  display_name text,
  preferred_locale text not null default 'mm' check (preferred_locale in ('mm','en')),
  consent_accepted_at timestamptz,           -- parent consent (required before child data)
  privacy_notice_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Children (private by default; owned by a parent)
-- ---------------------------------------------------------------------------
create table children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references users(id) on delete cascade,
  nickname text not null,                     -- nickname only; data minimization
  birth_date date not null,
  sex text check (sex in ('female','male','unspecified')),
  gestational_weeks integer check (gestational_weeks between 22 and 44),
  use_corrected_age boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_children_parent on children(parent_id) where deleted_at is null;

create table child_profiles (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null unique references children(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reference / taxonomy
-- ---------------------------------------------------------------------------
create table age_groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                   -- e.g. 'birth_2m'
  title_mm text not null,
  title_en text not null,
  min_months integer not null,
  max_months integer not null,
  sort_order integer not null default 0,
  check (min_months <= max_months)
);

create table development_domains (
  id uuid primary key default gen_random_uuid(),
  key development_domain not null unique,
  title_mm text not null,
  title_en text not null,
  sort_order integer not null default 0
);

create table content_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  citation text not null,
  url text,
  created_at timestamptz not null default now()
);

-- Reusable bilingual/review columns are repeated per content table for clarity.
-- ---------------------------------------------------------------------------
-- Milestones
-- ---------------------------------------------------------------------------
create table milestones (
  id uuid primary key default gen_random_uuid(),
  domain development_domain not null,
  age_min_months integer not null,
  age_max_months integer not null,
  title_mm text not null,
  title_en text not null,
  question_mm text not null,                  -- parent observation question
  question_en text not null,
  explanation_mm text,
  explanation_en text,
  why_it_matters_mm text,
  why_it_matters_en text,
  observation_mm text,
  observation_en text,
  illustration_url text,
  source_id uuid references content_sources(id),
  version integer not null default 1,
  review_status review_status not null default 'draft',
  reviewer uuid references users(id),
  reviewer_qualification text,
  reviewed_at timestamptz,
  next_review_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (age_min_months <= age_max_months)
);
create index idx_milestones_domain_age on milestones(domain, age_min_months, age_max_months);
create index idx_milestones_status on milestones(review_status);

create table milestone_review_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  age_group_key text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  result_state result_state,
  result_snapshot jsonb,                      -- immutable copy of the computed result
  lost_skill boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_review_sessions_child on milestone_review_sessions(child_id);

create table milestone_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references milestone_review_sessions(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  milestone_id uuid not null references milestones(id),
  answer milestone_answer not null,
  parent_note text,
  saved_concern boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, milestone_id)
);
create index idx_responses_child on milestone_responses(child_id);

-- ---------------------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------------------
create table activities (
  id uuid primary key default gen_random_uuid(),
  domain development_domain not null,
  age_min_months integer not null,
  age_max_months integer not null,
  title_mm text not null,
  title_en text not null,
  objective_mm text,
  objective_en text,
  materials_mm text,
  materials_en text,
  duration_minutes integer,
  difficulty text check (difficulty in ('easy','medium','hard')),
  steps_mm text,
  steps_en text,
  safety_note_mm text,
  safety_note_en text,
  easier_variation_mm text,
  easier_variation_en text,
  harder_variation_mm text,
  harder_variation_en text,
  illustration_url text,
  offline_available boolean not null default true,
  source_id uuid references content_sources(id),
  version integer not null default 1,
  review_status review_status not null default 'draft',
  reviewed_at timestamptz,
  next_review_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (age_min_months <= age_max_months)
);
create index idx_activities_domain_age on activities(domain, age_min_months, age_max_months);

create table activity_completions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  activity_id uuid not null references activities(id),
  feedback text check (feedback in
    ('completed','too_easy','suitable','too_difficult','not_interested','save_for_later')),
  completed_at timestamptz not null default now()
);
create index idx_activity_completions_child on activity_completions(child_id);

-- ---------------------------------------------------------------------------
-- Awareness / Hope Center, myths, lessons
-- ---------------------------------------------------------------------------
create table awareness_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_mm text not null,
  title_en text not null,
  content_mm text,
  content_en text,
  source_id uuid references content_sources(id),
  version integer not null default 1,
  review_status review_status not null default 'draft',
  reviewer uuid references users(id),
  reviewer_qualification text,
  reviewed_at timestamptz,
  next_review_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table myths_and_facts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references awareness_topics(id) on delete cascade,
  myth_mm text not null,
  myth_en text not null,
  fact_mm text not null,
  fact_en text not null,
  review_status review_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table parent_lessons (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title_mm text not null,
  title_en text not null,
  content_mm text,
  content_en text,
  reading_minutes integer,
  audio_url text,                             -- audio-ready field
  source_id uuid references content_sources(id),
  version integer not null default 1,
  review_status review_status not null default 'draft',
  reviewed_at timestamptz,
  next_review_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  offline_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references parent_lessons(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  bookmarked boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lesson_id, parent_id)
);

-- ---------------------------------------------------------------------------
-- Growth & sleep (private child records)
-- ---------------------------------------------------------------------------
create table growth_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(6,3),                     -- normalized to kg on write
  height_cm numeric(6,2),                     -- normalized to cm on write
  head_circumference_cm numeric(6,2),
  input_weight_unit weight_unit,
  input_length_unit length_unit,
  measured_location text,
  entered_by text,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_growth_child_date on growth_records(child_id, measured_on);

create table sleep_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  record_date date not null,
  bedtime time,
  wake_time time,
  nap_minutes integer not null default 0,
  night_waking_count integer not null default 0,
  snoring boolean,
  breathing_pauses boolean,
  breathing_difficulty boolean,
  daytime_tiredness boolean,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_sleep_child_date on sleep_records(child_id, record_date);

-- ---------------------------------------------------------------------------
-- Safety rules, referral guidance (configurable, reviewed)
-- ---------------------------------------------------------------------------
create table safety_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                   -- e.g. 'seizure'
  title_mm text not null,
  title_en text not null,
  guidance_mm text not null,
  guidance_en text not null,
  is_urgent boolean not null default true,
  version integer not null default 1,
  review_status review_status not null default 'draft',
  updated_at timestamptz not null default now()
);

create table referral_guidance (
  id uuid primary key default gen_random_uuid(),
  state result_state not null,
  guidance_mm text not null,
  guidance_en text not null,
  questions_for_professional_mm text,
  questions_for_professional_en text,
  version integer not null default 1,
  review_status review_status not null default 'draft'
);

-- ---------------------------------------------------------------------------
-- Clinical review workflow
-- ---------------------------------------------------------------------------
create table clinical_reviews (
  id uuid primary key default gen_random_uuid(),
  content_table text not null,                -- e.g. 'milestones'
  content_id uuid not null,
  reviewer_id uuid references users(id),
  reviewer_qualification text,
  decision review_status not null,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_clinical_reviews_content on clinical_reviews(content_table, content_id);

-- ---------------------------------------------------------------------------
-- Reports, notifications, settings
-- ---------------------------------------------------------------------------
create table monthly_reports (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  report_type text not null check (report_type in
    ('parent_monthly','doctor_visit','share_safe')),
  period_start date not null,
  period_end date not null,
  payload jsonb not null,                     -- generated from stored data only
  created_at timestamptz not null default now()
);
create index idx_reports_child on monthly_reports(child_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references users(id) on delete cascade,
  title_mm text,
  title_en text,
  body_mm text,
  body_en text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_parent on notifications(parent_id);

create table app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table offline_content_manifests (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  locale text not null check (locale in ('mm','en')),
  manifest jsonb not null,                    -- list of public content ids + sizes
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Healthcare directory (never seeded with invented data)
-- ---------------------------------------------------------------------------
create table healthcare_facilities (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  region text,
  township text,
  name text not null,
  facility_type text,
  phone text,
  address text,
  services text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  source text,
  last_verified_at timestamptz,
  verified_by uuid references users(id),
  is_active boolean not null default false,   -- inactive until verified
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_facilities_location on healthcare_facilities(country, region, township)
  where is_active = true;

create table healthcare_facility_verifications (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references healthcare_facilities(id) on delete cascade,
  verified_by uuid references users(id),
  verified_at timestamptz not null default now(),
  method text,
  notes text
);

-- ---------------------------------------------------------------------------
-- Immutable audit log
-- ---------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,                       -- e.g. 'content.publish', 'account.delete'
  entity_table text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_actor on audit_logs(actor_id);
create index idx_audit_entity on audit_logs(entity_table, entity_id);
-- Audit rows are insert-only: no update/delete policy is ever granted.
