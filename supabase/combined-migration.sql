-- Sunday — Combined Database Migration
-- Auto-generated. Run this in Supabase Dashboard → SQL Editor
-- Contains 10 migrations


-- ═══════════════════════════════════════════════
-- Migration: 001_sprint1_schema.sql
-- ═══════════════════════════════════════════════

-- Sunday — Sprint 1 Database Schema
-- Run this in your Supabase SQL Editor or apply via migration tooling
-- Dependencies: None (foundational)

-- ─── Extensions ───────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type user_role as enum (
  'employee',
  'senior_employee',
  'assistant_manager',
  'manager',
  'senior_manager',
  'admin'
);

create type user_status as enum (
  'active',
  'deactivated'
);

create type billable_permission as enum (
  'billable',
  'non_billable',
  'both'
);

create type planning_mode as enum (
  'locked',
  'fluid'
);

-- ─── Departments ──────────────────────────────────────────────────────────────

create table departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  senior_manager_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Teams ────────────────────────────────────────────────────────────────────

create table teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  department_id uuid not null references departments(id) on delete cascade,
  manager_id uuid references auth.users(id) on delete set null,
  planning_mode planning_mode not null default 'fluid',
  submission_deadline_day smallint check (submission_deadline_day between 0 and 6),
  submission_deadline_time time,
  check_in_mandatory boolean not null default false,
  eod_mandatory boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────
-- Supabase manages authentication in auth.users. We keep product data here.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null default 'employee',
  team_id uuid references teams(id) on delete set null,
  manager_id uuid references profiles(id) on delete set null,
  work_week smallint[] not null default '{1,2,3,4,5}',  -- Mon–Fri default
  timezone text not null default 'UTC',
  available_hours numeric(4,1) not null default 8,
  billable_permission billable_permission not null default 'both',
  status user_status not null default 'active',
  invite_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz
);

-- ─── Invite Tokens ────────────────────────────────────────────────────────────

create table invite_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Audit Log ────────────────────────────────────────────────────────────────
-- Sprint 1 scope: log user management events

create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index profiles_team_id_idx on profiles(team_id);
create index profiles_manager_id_idx on profiles(manager_id);
create index profiles_role_idx on profiles(role);
create index profiles_status_idx on profiles(status);
create index teams_department_id_idx on teams(department_id);
create index audit_log_actor_id_idx on audit_log(actor_id);
create index audit_log_created_at_idx on audit_log(created_at desc);
create index invite_tokens_token_idx on invite_tokens(token);
create index invite_tokens_user_id_idx on invite_tokens(user_id);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

-- Auto-update updated_at timestamps

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger departments_updated_at
  before update on departments
  for each row execute function update_updated_at_column();

create trigger teams_updated_at
  before update on teams
  for each row execute function update_updated_at_column();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

-- Auto-create profile row when auth user is created

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table teams enable row level security;
alter table departments enable row level security;
alter table invite_tokens enable row level security;
alter table audit_log enable row level security;

-- Profiles: users can read their own; admins can read/write all
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can manage all profiles"
  on profiles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Managers and above can read profiles in their team/department
create policy "Managers can read team profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles actor
      where actor.id = auth.uid()
        and actor.role in ('manager', 'senior_manager', 'assistant_manager', 'admin')
        and (
          actor.team_id = profiles.team_id
          or actor.role in ('senior_manager', 'admin')
        )
    )
  );

-- Teams: all authenticated users can read teams (needed for dropdowns)
create policy "Authenticated users can read teams"
  on teams for select
  using (auth.uid() is not null);

create policy "Admins can manage teams"
  on teams for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Departments: all authenticated users can read
create policy "Authenticated users can read departments"
  on departments for select
  using (auth.uid() is not null);

create policy "Admins can manage departments"
  on departments for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Invite tokens: admins only
create policy "Admins can manage invite tokens"
  on invite_tokens for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Audit log: admins can read all; system writes via service role
create policy "Admins can read audit log"
  on audit_log for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );



-- ═══════════════════════════════════════════════
-- Migration: 002_sprint2_schema.sql
-- ═══════════════════════════════════════════════

-- Sunday — Sprint 2 Database Schema
-- Task Engine: Tasks, Projects, Timeline Events, Dependencies, Subtasks
-- Run after 001_sprint1_schema.sql

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type task_status as enum (
  'todo',
  'in_progress',
  'in_review',
  'done'
);

create type task_priority as enum (
  'high',
  'medium',
  'low'
);

create type task_type as enum (
  'planned',
  'adhoc'
);

create type task_nature as enum (
  'core',
  'supporting'
);

create type timeline_event_type as enum (
  'created',
  'assigned',
  'status_changed',
  'reassigned',
  'comment_added',
  'file_added',
  'dependency_added',
  'dependency_resolved',
  'completion_report_submitted',
  'marked_done',
  'sent_back',
  'subtask_added',
  'subtask_status_changed',
  'field_updated'
);

-- ─── Projects / Categories ────────────────────────────────────────────────────

create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  team_id uuid references teams(id) on delete set null,  -- null = global
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_team_id_idx on projects(team_id);

-- ─── Tasks ────────────────────────────────────────────────────────────────────

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  creator_id uuid not null references auth.users(id) on delete restrict,
  assignee_id uuid not null references auth.users(id) on delete restrict,
  reviewer_id uuid references auth.users(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  parent_task_id uuid references tasks(id) on delete cascade,  -- null = top-level task

  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  task_type task_type not null default 'planned',
  task_nature task_nature not null default 'core',
  billable boolean not null default false,

  due_date date,
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  review_hours numeric(5,2),

  completion_report_text text,
  completion_report_file_path text,

  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common query patterns
create index tasks_assignee_id_idx on tasks(assignee_id);
create index tasks_creator_id_idx on tasks(creator_id);
create index tasks_status_idx on tasks(status);
create index tasks_due_date_idx on tasks(due_date);
create index tasks_project_id_idx on tasks(project_id);
create index tasks_parent_task_id_idx on tasks(parent_task_id);

-- ─── Task Dependencies ────────────────────────────────────────────────────────
-- task_id depends on depends_on_task_id (task_id cannot start until depends_on is Done)

create table task_dependencies (
  task_id uuid not null references tasks(id) on delete cascade,
  depends_on_task_id uuid not null references tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  constraint no_self_dependency check (task_id != depends_on_task_id)
);

-- ─── Task Timeline Events ─────────────────────────────────────────────────────

create table task_timeline (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  event_type timeline_event_type not null,
  actor_id uuid references auth.users(id) on delete set null,
  old_value text,
  new_value text,
  metadata jsonb,        -- e.g. { "reason": "reassignment reason" }
  created_at timestamptz not null default now()
);

create index task_timeline_task_id_idx on task_timeline(task_id);
create index task_timeline_created_at_idx on task_timeline(created_at);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tasks
create trigger tasks_updated_at
  before update on tasks
  for each row execute procedure update_updated_at_column();

-- Apply to projects
create trigger projects_updated_at
  before update on projects
  for each row execute procedure update_updated_at_column();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;
alter table task_timeline enable row level security;

-- Projects: visible to all authenticated users in the same org
create policy "projects_select" on projects
  for select to authenticated using (true);

create policy "projects_insert" on projects
  for insert to authenticated with check (auth.uid() = created_by);

create policy "projects_update" on projects
  for update to authenticated using (
    created_by = auth.uid()
    or exists (
      select 1 from profiles where id = auth.uid() and role in ('manager', 'senior_manager', 'admin')
    )
  );

-- Tasks: select — user is assignee, creator, reviewer, or manager/above in assignee's team
create policy "tasks_select" on tasks
  for select to authenticated using (
    assignee_id = auth.uid()
    or creator_id = auth.uid()
    or reviewer_id = auth.uid()
    or exists (
      select 1 from profiles p_current
      join profiles p_assignee on p_assignee.id = tasks.assignee_id
      where p_current.id = auth.uid()
        and (
          -- same team manager or above
          (p_current.team_id = p_assignee.team_id and p_current.role in ('assistant_manager', 'manager', 'senior_manager', 'admin'))
          -- is the manager of the assignee
          or p_assignee.manager_id = p_current.id
          -- admin can see all
          or p_current.role = 'admin'
        )
    )
  );

create policy "tasks_insert" on tasks
  for insert to authenticated with check (creator_id = auth.uid());

create policy "tasks_update" on tasks
  for update to authenticated using (
    creator_id = auth.uid()
    or assignee_id = auth.uid()
    or reviewer_id = auth.uid()
    or exists (
      select 1 from profiles where id = auth.uid() and role in ('manager', 'senior_manager', 'admin')
    )
  );

-- Task dependencies: visible if you can see either task
create policy "task_dependencies_select" on task_dependencies
  for select to authenticated using (true);

create policy "task_dependencies_insert" on task_dependencies
  for insert to authenticated with check (true);

create policy "task_dependencies_delete" on task_dependencies
  for delete to authenticated using (true);

-- Timeline: visible to anyone who can see the task
create policy "task_timeline_select" on task_timeline
  for select to authenticated using (true);

create policy "task_timeline_insert" on task_timeline
  for insert to authenticated with check (actor_id = auth.uid());



-- ═══════════════════════════════════════════════
-- Migration: 003_sprint3_schema.sql
-- ═══════════════════════════════════════════════

-- Sprint 3: Custom Fields + Saved Views Schema
-- Depends on: 002_sprint2_schema.sql

-- ──────────────────────────────────────────────
-- Custom Field Types
-- ──────────────────────────────────────────────
CREATE TYPE public.custom_field_type AS ENUM ('text', 'number', 'date', 'dropdown', 'checkbox');
CREATE TYPE public.custom_field_scope_type AS ENUM ('team', 'project', 'global');
CREATE TYPE public.custom_field_status AS ENUM ('active', 'archived');
CREATE TYPE public.saved_view_scope AS ENUM ('personal', 'shared');

-- ──────────────────────────────────────────────
-- Custom Field Definitions
-- ──────────────────────────────────────────────
CREATE TABLE public.custom_field_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    field_type      public.custom_field_type NOT NULL,
    options         JSONB,          -- array of strings for dropdown type
    scope_type      public.custom_field_scope_type NOT NULL DEFAULT 'team',
    scope_id        UUID,           -- team_id or project_id; NULL for global
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status          public.custom_field_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Custom Field Values (per task)
-- ──────────────────────────────────────────────
CREATE TABLE public.custom_field_values (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id                 UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    field_definition_id     UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE RESTRICT,
    value                   TEXT,           -- all types stored as text, cast on read
    set_by                  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, field_definition_id)
);

-- ──────────────────────────────────────────────
-- Saved Views
-- ──────────────────────────────────────────────
CREATE TABLE public.saved_views (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    filters         JSONB NOT NULL DEFAULT '{}',  -- stored filter state
    scope           public.saved_view_scope NOT NULL DEFAULT 'personal',
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id         UUID REFERENCES public.teams(id) ON DELETE CASCADE,  -- for shared views
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────
CREATE INDEX idx_custom_field_defs_scope     ON public.custom_field_definitions (scope_type, scope_id);
CREATE INDEX idx_custom_field_defs_status    ON public.custom_field_definitions (status);
CREATE INDEX idx_custom_field_defs_created   ON public.custom_field_definitions (created_by);
CREATE INDEX idx_custom_field_values_task    ON public.custom_field_values (task_id);
CREATE INDEX idx_custom_field_values_defn    ON public.custom_field_values (field_definition_id);
CREATE INDEX idx_saved_views_creator         ON public.saved_views (created_by);
CREATE INDEX idx_saved_views_team            ON public.saved_views (team_id);

-- ──────────────────────────────────────────────
-- Updated-at triggers
-- ──────────────────────────────────────────────
CREATE TRIGGER custom_field_defs_updated_at
    BEFORE UPDATE ON public.custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER custom_field_values_updated_at
    BEFORE UPDATE ON public.custom_field_values
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER saved_views_updated_at
    BEFORE UPDATE ON public.saved_views
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- Custom field definitions: authenticated users can read; manager+ can write
CREATE POLICY "custom_field_defs_select" ON public.custom_field_definitions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_field_defs_insert" ON public.custom_field_definitions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'senior_manager', 'admin', 'assistant_manager')
        )
    );

CREATE POLICY "custom_field_defs_update" ON public.custom_field_definitions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'senior_manager', 'admin', 'assistant_manager')
        )
    );

-- Custom field values: task participants can read/write
CREATE POLICY "custom_field_values_select" ON public.custom_field_values
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_field_values_insert" ON public.custom_field_values
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "custom_field_values_update" ON public.custom_field_values
    FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Saved views: personal = creator only; shared = same team
CREATE POLICY "saved_views_select" ON public.saved_views
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid()
        OR (
            scope = 'shared'
            AND team_id IN (
                SELECT team_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "saved_views_insert" ON public.saved_views
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "saved_views_update" ON public.saved_views
    FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "saved_views_delete" ON public.saved_views
    FOR DELETE TO authenticated USING (created_by = auth.uid());



-- ═══════════════════════════════════════════════
-- Migration: 004_sprint4_schema.sql
-- ═══════════════════════════════════════════════

-- Sprint 4: Planning Module
-- Tables: weekly_plans, plan_entries, daily_checkins, eod_wrapups, plan_comments

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE plan_submission_status AS ENUM ('draft', 'submitted', 'fluid');

-- ─── weekly_plans ─────────────────────────────────────────────────────────────
-- One record per user per Monday (week_start_date is always Monday).

CREATE TABLE weekly_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date  DATE NOT NULL,             -- Always the Monday of that ISO week
  submission_status plan_submission_status NOT NULL DEFAULT 'draft',
  submitted_at     TIMESTAMPTZ,
  locked           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_weekly_plans_user_week ON weekly_plans (user_id, week_start_date DESC);

-- ─── plan_entries ─────────────────────────────────────────────────────────────
-- One row per task per day within a plan.

CREATE TABLE plan_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  day_of_week    SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun ... 6=Sat
  planned_hours  NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_carryover   BOOLEAN NOT NULL DEFAULT FALSE,
  original_date  DATE,                        -- set when this entry was rolled from a prior day
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, task_id, day_of_week)
);

CREATE INDEX idx_plan_entries_plan ON plan_entries (plan_id);
CREATE INDEX idx_plan_entries_task ON plan_entries (task_id);

-- ─── daily_checkins ───────────────────────────────────────────────────────────

CREATE TABLE daily_checkins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  tasks_json   JSONB NOT NULL DEFAULT '[]',  -- snapshot of planned tasks for the day
  notes        TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_checkins_user_date ON daily_checkins (user_id, date DESC);

-- ─── eod_wrapups ──────────────────────────────────────────────────────────────

CREATE TABLE eod_wrapups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  planned_tasks_json  JSONB NOT NULL DEFAULT '[]',  -- from the plan for that day
  actual_tasks_json   JSONB NOT NULL DEFAULT '[]',  -- what actually happened (task statuses + hours)
  notes               TEXT,
  discrepancies_json  JSONB,                         -- auto-computed differences
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_eod_wrapups_user_date ON eod_wrapups (user_id, date DESC);

-- ─── plan_comments ────────────────────────────────────────────────────────────

CREATE TABLE plan_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_comments_plan ON plan_comments (plan_id, created_at DESC);

-- ─── updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_weekly_plans_updated_at
  BEFORE UPDATE ON weekly_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_plan_entries_updated_at
  BEFORE UPDATE ON plan_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE eod_wrapups ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_comments ENABLE ROW LEVEL SECURITY;

-- All API access goes through the service-role admin client — no user-level JWT
-- policies needed. Service role bypasses RLS automatically.
-- We define policies as locked-down so direct client access is rejected.

CREATE POLICY "no_direct_access" ON weekly_plans FOR ALL TO authenticated USING (false);
CREATE POLICY "no_direct_access" ON plan_entries FOR ALL TO authenticated USING (false);
CREATE POLICY "no_direct_access" ON daily_checkins FOR ALL TO authenticated USING (false);
CREATE POLICY "no_direct_access" ON eod_wrapups FOR ALL TO authenticated USING (false);
CREATE POLICY "no_direct_access" ON plan_comments FOR ALL TO authenticated USING (false);



-- ═══════════════════════════════════════════════
-- Migration: 005_sprint5_schema.sql
-- ═══════════════════════════════════════════════

-- Migration 005: Sprint 5 — Manager Dashboard & Activity Feed
-- Depends on: migrations 001–004

-- ─── Activity Event Types ────────────────────────────────────────────────────

CREATE TYPE activity_event_type AS ENUM (
  'task_created',
  'task_status_changed',
  'task_assigned',
  'task_reassigned',
  'task_completed',
  'task_commented',
  'plan_submitted',
  'plan_unlocked',
  'checkin_submitted',
  'wrapup_submitted',
  'field_updated',
  'user_joined',
  'warning_acknowledged'
);

-- ─── Activity Events ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  event_type    activity_event_type NOT NULL,
  description   TEXT NOT NULL,
  target_id     UUID,
  target_type   TEXT,        -- 'task' | 'plan' | 'checkin' | 'wrapup' | 'user'
  metadata      JSONB,       -- optional extra data (old/new status, etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_team_id ON activity_events(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_event_type ON activity_events(event_type);

-- ─── Warning Acknowledgements ─────────────────────────────────────────────────
-- Stores manager acknowledgements of unplanned days (creates audit trail)

CREATE TABLE IF NOT EXISTS warning_acknowledgements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start     DATE NOT NULL,
  unplanned_days INTEGER[] NOT NULL,   -- array of day_of_week values (0=Sun, 1=Mon …)
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warning_acks_manager_id ON warning_acknowledgements(manager_id);
CREATE INDEX IF NOT EXISTS idx_warning_acks_employee_id ON warning_acknowledgements(employee_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- All reads go through the admin client in API routes, blocking direct client access.

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY no_direct_access ON activity_events
  FOR ALL USING (false);

ALTER TABLE warning_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY no_direct_access ON warning_acknowledgements
  FOR ALL USING (false);



-- ═══════════════════════════════════════════════
-- Migration: 006_sprint6_schema.sql
-- ═══════════════════════════════════════════════

-- Sprint 6: Notification System Schema
-- Creates notifications and notification_preferences tables

-- ─── Notification Type Enum ───────────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_reassigned_away',
  'task_due_today',
  'task_overdue',
  'task_in_review',
  'task_sent_back',
  'task_marked_done',
  'dependency_unblocked',
  'plan_not_submitted',
  'checkin_not_submitted',
  'zero_tasks_planned',
  'comment_on_plan',
  'comment_on_task'
);

-- ─── Notification Channel Enum ────────────────────────────────────────────────

CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'both'
);

-- ─── Notifications Table ──────────────────────────────────────────────────────

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         notification_type NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  link         TEXT,                    -- relative URL to the relevant resource
  read         BOOLEAN NOT NULL DEFAULT false,
  channel      notification_channel NOT NULL DEFAULT 'in_app',
  metadata     JSONB,                   -- extra context (task_id, plan_id, actor_name, etc.)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ─── Notification Preferences Table ───────────────────────────────────────────

CREATE TABLE notification_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT true,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- Auto-update updated_at on preferences
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Service-role only (all access goes through API routes with admin client)
CREATE POLICY no_direct_access_notifications ON notifications FOR ALL TO authenticated USING (false);
CREATE POLICY no_direct_access_notification_preferences ON notification_preferences FOR ALL TO authenticated USING (false);



-- ═══════════════════════════════════════════════
-- Migration: 007_sprint7_search.sql
-- ═══════════════════════════════════════════════

-- Sprint 7: Full-Text Search Index
-- Adds tsvector column + GIN index to tasks for fast full-text search
-- Also indexes profiles.name and projects.name for global search

-- 1. Add tsvector column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Populate search_vector from existing data
UPDATE tasks SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(completion_report_text, '')), 'C');

-- 3. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_tasks_search_vector ON tasks USING GIN (search_vector);

-- 4. Auto-update search_vector on INSERT or UPDATE
CREATE OR REPLACE FUNCTION tasks_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.completion_report_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_search_vector ON tasks;
CREATE TRIGGER trg_tasks_search_vector
  BEFORE INSERT OR UPDATE OF title, description, completion_report_text
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION tasks_search_vector_update();

-- 5. Index on profiles.name for people search (trigram for partial matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING GIN (name gin_trgm_ops);

-- 6. Index on projects.name for project search
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING GIN (name gin_trgm_ops);



-- ═══════════════════════════════════════════════
-- Migration: 008_sprint8_files.sql
-- ═══════════════════════════════════════════════

-- Sprint 8: File Management
-- Task file attachments and storage

-- ─── task_files table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,               -- MIME type
  file_size BIGINT NOT NULL DEFAULT 0,   -- bytes
  storage_path TEXT NOT NULL,            -- path in Supabase Storage bucket
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  wrap_up_id UUID REFERENCES eod_wrapups(id) ON DELETE CASCADE,
  permanent BOOLEAN NOT NULL DEFAULT true,
  context TEXT NOT NULL DEFAULT 'attachment', -- 'attachment' | 'completion_report' | 'wrapup'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- At least one parent must be set
  CONSTRAINT file_must_have_parent CHECK (task_id IS NOT NULL OR wrap_up_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_task_files_task_id ON task_files(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_task_files_wrap_up_id ON task_files(wrap_up_id) WHERE wrap_up_id IS NOT NULL;
CREATE INDEX idx_task_files_uploaded_by ON task_files(uploaded_by);

-- ─── Storage Bucket ─────────────────────────────────────────────────────────
-- Note: Supabase Storage buckets are typically created via the dashboard or
-- the Supabase CLI. The bucket name is 'task-files'.
-- This migration only creates the DB table; bucket creation is handled
-- by the storage setup in the application bootstrap.

-- ─── RLS Policies ───────────────────────────────────────────────────────────
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read files for tasks they can see
CREATE POLICY "Users can view task files" ON task_files
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert files
CREATE POLICY "Users can upload files" ON task_files
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- No delete policy — task files are permanent
-- Admin can delete via service role client if needed



-- ═══════════════════════════════════════════════
-- Migration: 009_sprint10_settings_archiving.sql
-- ═══════════════════════════════════════════════

-- Sprint 10: Settings, Archiving, Onboarding & Audit Trail Schema
-- Covers all schema changes needed for Sprints 9 and 10

-- ─── 1. Add 'archived' to task_status enum ──────────────────────────────────
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'archived';

-- ─── 2. system_settings table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed defaults
INSERT INTO system_settings (key, value) VALUES
  ('company_name', 'Sunday'),
  ('default_available_hours', '8'),
  ('archive_window_months', '6')
ON CONFLICT (key) DO NOTHING;

-- RLS: service-role only
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY no_direct_access_system_settings ON system_settings
  FOR ALL TO authenticated USING (false);

-- ─── 3. Add onboarding_complete column to profiles ──────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- ─── 4. Add default_task_view column to profiles ────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_task_view TEXT NOT NULL DEFAULT 'list';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_default_task_view_check
  CHECK (default_task_view IN ('list', 'kanban'));

-- ─── 5. Add old_value / new_value columns to audit_log ──────────────────────
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS old_value JSONB,
  ADD COLUMN IF NOT EXISTS new_value JSONB;

-- ─── 6. Re-point audit_log.actor_id FK from auth.users to profiles ──────────
-- profiles.id references auth.users(id) so the UUID is identical,
-- but PostgREST needs this FK to resolve joins to profiles.
ALTER TABLE audit_log DROP CONSTRAINT audit_log_actor_id_fkey;
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;



-- ═══════════════════════════════════════════════
-- Migration: 010_task_comments.sql
-- ═══════════════════════════════════════════════

-- Sunday — Task Comments Table
-- Adds task-level comments for collaboration

CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id),
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON task_comments (task_id, created_at DESC);
CREATE INDEX idx_task_comments_author ON task_comments (author_id);

-- RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; API routes use service role via adminClient
CREATE POLICY "no_direct_access" ON task_comments FOR ALL TO authenticated USING (false);

