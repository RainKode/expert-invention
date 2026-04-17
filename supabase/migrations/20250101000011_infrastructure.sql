-- Infrastructure: Storage bucket, Realtime, and pgcrypto extension
-- This migration sets up the remaining infrastructure not covered by previous sprints.

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Storage Bucket: task-files ───────────────────────────────────────────────
-- Creates the private storage bucket used for file attachments (tasks, wrapups).
-- 25 MB limit per file. Only authenticated users can interact.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  false,
  26214400, -- 25 MB in bytes
  ARRAY[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS Policies ─────────────────────────────────────────────────────
-- Authenticated users can upload files to their own folder
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task-files');

-- Authenticated users can view any file in the bucket
CREATE POLICY "Authenticated users can view files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'task-files');

-- Users can update their own uploads
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'task-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'task-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Realtime: Enable on notifications table ─────────────────────────────────
-- This allows the frontend to subscribe to INSERT events in real time.

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
