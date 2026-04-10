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
