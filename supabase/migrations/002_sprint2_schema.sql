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
