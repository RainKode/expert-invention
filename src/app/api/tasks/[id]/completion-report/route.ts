import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { z } from 'zod'

const schema = z.object({
  text: z.string().max(5000).optional(),
  file_path: z.string().max(500).optional(),
}).refine(d => d.text || d.file_path, { message: 'Either text or file_path is required' })

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { text, file_path } = parsed.data

  const { data: task } = await supabase.from('tasks').select('assignee_id, creator_id').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const isInvolved = task.assignee_id === user.id || task.creator_id === user.id
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(profile?.role ?? '')

  if (!isInvolved && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const updatePayload: Record<string, unknown> = {}
  if (text !== undefined) updatePayload.completion_report_text = text
  if (file_path !== undefined) updatePayload.completion_report_file_path = file_path

  const { data: updated, error } = await admin
    .from('tasks')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTimelineEvent({
    taskId: id,
    eventType: 'completion_report_submitted',
    actorId: user.id,
    metadata: { has_text: !!text, has_file: !!file_path },
  })

  return NextResponse.json({ task: updated })
}
