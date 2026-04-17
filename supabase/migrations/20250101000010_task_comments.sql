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
