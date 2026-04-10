import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['approve', 'send_back']),
  comment: z.string().max(2000).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { action, comment } = parsed.data

  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (task.status !== 'in_review') {
    return NextResponse.json({ error: 'Task is not in review status' }, { status: 422 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isReviewer = task.reviewer_id === user.id
  const isManager = ['manager', 'senior_manager', 'admin'].includes(profile?.role ?? '')

  if (!isReviewer && !isManager) {
    return NextResponse.json({ error: 'Only the reviewer or a manager can take review action' }, { status: 403 })
  }

  const admin = createAdminClient()

  if (action === 'approve') {
    const { data: updated, error } = await admin
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logTimelineEvent({
      taskId: id,
      eventType: 'marked_done',
      actorId: user.id,
      metadata: { comment },
    })

    return NextResponse.json({ task: updated })
  }

  // send_back
  if (!comment || comment.trim().length === 0) {
    return NextResponse.json({ error: 'Reason is required when sending task back' }, { status: 400 })
  }

  const { data: updated, error } = await admin
    .from('tasks')
    .update({ status: 'in_progress' })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTimelineEvent({
    taskId: id,
    eventType: 'sent_back',
    actorId: user.id,
    metadata: { reason: comment },
  })

  return NextResponse.json({ task: updated })
}
