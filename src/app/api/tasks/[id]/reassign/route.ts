import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const schema = z.object({
  new_assignee_id: z.string().uuid(),
  reason: z.string().max(2000).optional(),
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

  const { new_assignee_id, reason } = parsed.data

  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isCreator = task.creator_id === user.id
  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(profile?.role ?? '')

  if (!isCreator && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: updated, error } = await admin
    .from('tasks')
    .update({ assignee_id: new_assignee_id })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTimelineEvent({
    taskId: id,
    eventType: 'reassigned',
    actorId: user.id,
    oldValue: task.assignee_id ?? '',
    newValue: new_assignee_id,
    metadata: { reason },
  })

  // Notify the previous assignee (reassigned away)
  const { data: actorProfile } = await admin.from('profiles').select('name').eq('id', user.id).single()
  if (task.assignee_id && task.assignee_id !== new_assignee_id) {
    await createNotification({
      recipientId: task.assignee_id,
      type: 'task_reassigned_away',
      title: 'Task Reassigned',
      message: `"${task.title}" has been reassigned to another team member`,
      link: `/tasks/${id}`,
      metadata: { task_id: id, actor_id: user.id },
    })
  }

  // Notify the new assignee
  if (new_assignee_id !== user.id) {
    await createNotification({
      recipientId: new_assignee_id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${actorProfile?.name ?? 'Someone'} assigned you "${task.title}"`,
      link: `/tasks/${id}`,
      metadata: { task_id: id, actor_id: user.id },
    })
  }

  return NextResponse.json({ task: updated })
}
