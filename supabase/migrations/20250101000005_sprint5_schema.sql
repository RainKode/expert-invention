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
