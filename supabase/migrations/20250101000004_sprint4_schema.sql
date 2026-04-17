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
