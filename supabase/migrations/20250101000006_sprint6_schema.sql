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
