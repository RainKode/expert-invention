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
