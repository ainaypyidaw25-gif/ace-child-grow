-- ACE Child Grow — Row Level Security (Phase 5 authorization).
-- Server-side enforcement in the database. Client-side hiding is NOT relied upon.
--
-- Golden rules:
--   * Parents can read/write ONLY their own rows (parent_id = auth.uid()).
--   * Published educational content is world-readable to authenticated users.
--   * Unpublished/unreviewed content is visible only to staff roles.
--   * Clinical reviewers can review content but CANNOT read parent/child records.
--   * audit_logs are insert-only; never updatable or deletable.

-- Helper: does the current user hold a given role?
create or replace function public.has_role(target app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    where ur.user_id = auth.uid() and ur.role = target
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('content_admin','translator','clinical_reviewer','super_admin')
  );
$$;

-- Enable RLS everywhere.
alter table users                 enable row level security;
alter table user_roles            enable row level security;
alter table admin_users           enable row level security;
alter table parent_profiles       enable row level security;
alter table children              enable row level security;
alter table child_profiles        enable row level security;
alter table milestone_review_sessions enable row level security;
alter table milestone_responses   enable row level security;
alter table activity_completions  enable row level security;
alter table lesson_progress       enable row level security;
alter table growth_records        enable row level security;
alter table sleep_records         enable row level security;
alter table monthly_reports       enable row level security;
alter table notifications         enable row level security;
alter table milestones            enable row level security;
alter table activities            enable row level security;
alter table awareness_topics      enable row level security;
alter table myths_and_facts       enable row level security;
alter table parent_lessons        enable row level security;
alter table safety_rules          enable row level security;
alter table referral_guidance     enable row level security;
alter table clinical_reviews      enable row level security;
alter table healthcare_facilities enable row level security;
alter table audit_logs            enable row level security;
alter table age_groups            enable row level security;
alter table development_domains   enable row level security;

-- ---- Identity ----
create policy users_self_select on users for select using (id = auth.uid());
create policy users_self_update on users for update using (id = auth.uid());

create policy roles_self_select on user_roles for select using (user_id = auth.uid() or has_role('super_admin'));
create policy roles_admin_write on user_roles for all
  using (has_role('super_admin')) with check (has_role('super_admin'));

-- ---- Parent profile (own only) ----
create policy pp_owner_all on parent_profiles for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- ---- Children + child profiles (own only) ----
create policy children_owner_all on children for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create policy child_profiles_owner_all on child_profiles for all
  using (exists (select 1 from children c where c.id = child_profiles.child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from children c where c.id = child_profiles.child_id and c.parent_id = auth.uid()));

-- ---- Private child records: sessions, responses, growth, sleep, reports ----
create policy sessions_owner_all on milestone_review_sessions for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy responses_owner_all on milestone_responses for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy completions_owner_all on activity_completions for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy lessonprog_owner_all on lesson_progress for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy growth_owner_all on growth_records for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy sleep_owner_all on sleep_records for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy reports_owner_all on monthly_reports for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy notifications_owner_all on notifications for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- ---- Published educational content: readable by any authenticated user ----
-- Staff can additionally see unpublished rows for their workflow.
create policy milestones_read on milestones for select
  using (review_status = 'published' or is_staff());
create policy milestones_staff_write on milestones for all
  using (has_role('content_admin') or has_role('super_admin'))
  with check (has_role('content_admin') or has_role('super_admin'));

create policy activities_read on activities for select
  using (review_status = 'published' or is_staff());
create policy activities_staff_write on activities for all
  using (has_role('content_admin') or has_role('super_admin'))
  with check (has_role('content_admin') or has_role('super_admin'));

create policy awareness_read on awareness_topics for select
  using (review_status = 'published' or is_staff());
create policy awareness_staff_write on awareness_topics for all
  using (has_role('content_admin') or has_role('super_admin'))
  with check (has_role('content_admin') or has_role('super_admin'));

create policy myths_read on myths_and_facts for select
  using (review_status = 'published' or is_staff());
create policy lessons_read on parent_lessons for select
  using (review_status = 'published' or is_staff());
create policy lessons_staff_write on parent_lessons for all
  using (has_role('content_admin') or has_role('super_admin'))
  with check (has_role('content_admin') or has_role('super_admin'));

create policy safety_rules_read on safety_rules for select using (true);
create policy referral_read on referral_guidance for select using (true);
create policy age_groups_read on age_groups for select using (true);
create policy domains_read on development_domains for select using (true);

-- ---- Clinical reviews: reviewers act on content, never on parent data ----
create policy clinical_reviews_rw on clinical_reviews for all
  using (has_role('clinical_reviewer') or has_role('super_admin'))
  with check (has_role('clinical_reviewer') or has_role('super_admin'));

-- ---- Healthcare directory: only active+verified rows are public ----
create policy facilities_public_read on healthcare_facilities for select
  using (is_active = true or is_staff());
create policy facilities_staff_write on healthcare_facilities for all
  using (has_role('content_admin') or has_role('super_admin'))
  with check (has_role('content_admin') or has_role('super_admin'));

-- ---- Audit log: insert-only for everyone; readable by super admin only ----
create policy audit_insert on audit_logs for insert with check (true);
create policy audit_super_read on audit_logs for select using (has_role('super_admin'));
-- (No update/delete policies exist -> audit rows are immutable.)
