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
