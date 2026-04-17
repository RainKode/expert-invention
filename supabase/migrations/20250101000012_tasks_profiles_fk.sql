-- Add foreign key constraints from tasks to profiles
-- Required for PostgREST/Supabase JS to resolve joins like:
--   assignee:profiles!tasks_assignee_id_fkey(id, name, email)
-- The existing FKs point to auth.users(id), but PostgREST needs
-- FKs to the target table (profiles) for relationship resolution.
-- profiles.id already references auth.users(id), so referential integrity is preserved.

-- Drop existing auto-named FKs that point to auth.users
alter table tasks drop constraint if exists tasks_assignee_id_fkey;
alter table tasks drop constraint if exists tasks_creator_id_fkey;
alter table tasks drop constraint if exists tasks_reviewer_id_fkey;

-- Also drop inline-defined FK names (Postgres may name them differently)
alter table tasks drop constraint if exists tasks_assignee_id_fkey1;
alter table tasks drop constraint if exists tasks_creator_id_fkey1;
alter table tasks drop constraint if exists tasks_reviewer_id_fkey1;

-- Re-create pointing to profiles
alter table tasks
  add constraint tasks_assignee_id_fkey
  foreign key (assignee_id) references profiles(id) on delete restrict;

alter table tasks
  add constraint tasks_creator_id_fkey
  foreign key (creator_id) references profiles(id) on delete restrict;

alter table tasks
  add constraint tasks_reviewer_id_fkey
  foreign key (reviewer_id) references profiles(id) on delete set null;
