import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types'

const BUCKET = 'task-files'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const taskId = formData.get('task_id') as string | null
  const wrapUpId = formData.get('wrap_up_id') as string | null
  const context = (formData.get('context') as string) || 'attachment'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!taskId && !wrapUpId) return NextResponse.json({ error: 'task_id or wrap_up_id required' }, { status: 400 })
  if (!['attachment', 'completion_report', 'wrapup'].includes(context)) {
    return NextResponse.json({ error: 'Invalid context' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 25MB limit' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Build storage path: {task_id|wrapup_id}/{timestamp}_{filename}
  const parentFolder = taskId ? `tasks/${taskId}` : `wrapups/${wrapUpId}`
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${parentFolder}/${Date.now()}_${safeFilename}`

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Insert file record
  const { data: fileRecord, error: dbError } = await admin
    .from('task_files')
    .insert({
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      uploaded_by: user.id,
      task_id: taskId || null,
      wrap_up_id: wrapUpId || null,
      permanent: !!taskId,
      context,
    })
    .select('*, uploader:profiles!task_files_uploaded_by_fkey(id, name)')
    .single()

  if (dbError) {
    // Clean up uploaded file on DB insert failure
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Log timeline event for task files
  if (taskId) {
    await logTimelineEvent({
      taskId,
      eventType: 'file_added',
      actorId: user.id,
      newValue: file.name,
      metadata: {
        file_id: fileRecord.id,
        file_type: file.type,
        file_size: file.size,
        context,
      },
    })
  }

  return NextResponse.json({ file: fileRecord }, { status: 201 })
}

// List files for a task or wrapup
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')
  const wrapUpId = searchParams.get('wrap_up_id')

  if (!taskId && !wrapUpId) {
    return NextResponse.json({ error: 'task_id or wrap_up_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  let query = admin
    .from('task_files')
    .select('*, uploader:profiles!task_files_uploaded_by_fkey(id, name)')
    .order('created_at', { ascending: false })

  if (taskId) query = query.eq('task_id', taskId)
  if (wrapUpId) query = query.eq('wrap_up_id', wrapUpId)

  const { data: files, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ files: files ?? [] })
}
