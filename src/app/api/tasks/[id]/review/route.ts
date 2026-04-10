import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { createNotification } from '@/lib/notifications'
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

    // Notify assignee and creator that task is done
    const doneRecipients = new Set<string>()
    if (task.assignee_id && task.assignee_id !== user.id) doneRecipients.add(task.assignee_id)
    if (task.creator_id && task.creator_id !== user.id) doneRecipients.add(task.creator_id)
    for (const recipientId of doneRecipients) {
      await createNotification({
        recipientId,
        type: 'task_marked_done',
        title: 'Task Completed',
        message: `"${task.title}" has been approved and marked as done`,
        link: `/tasks/${id}`,
        metadata: { task_id: id, actor_id: user.id },
      })
    }

    // Check for dependency unblocks
    const { data: dependents } = await admin
      .from('task_dependencies')
      .select('task_id, task:tasks!task_dependencies_task_id_fkey(id, title, assignee_id)')
      .eq('depends_on_task_id', id)
    for (const dep of dependents ?? []) {
      const depTask = Array.isArray(dep.task) ? dep.task[0] : dep.task
      if (!depTask?.assignee_id) continue
      const { data: allDeps } = await admin
        .from('task_dependencies')
        .select('depends_on:tasks!task_dependencies_depends_on_task_id_fkey(status)')
        .eq('task_id', dep.task_id)
      const allDone = (allDeps ?? []).every((d: { depends_on: unknown }) => {
        const s = Array.isArray(d.depends_on) ? d.depends_on[0] : d.depends_on
        return (s as { status: string } | null)?.status === 'done'
      })
      if (allDone) {
        await createNotification({
          recipientId: depTask.assignee_id,
          type: 'dependency_unblocked',
          title: 'Dependency Resolved',
          message: `All dependencies for "${depTask.title}" are complete — you can start working on it`,
          link: `/tasks/${dep.task_id}`,
          metadata: { task_id: dep.task_id, unblocked_by: id },
        })
      }
    }

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

  // Notify assignee that the task was sent back
  if (task.assignee_id && task.assignee_id !== user.id) {
    await createNotification({
      recipientId: task.assignee_id,
      type: 'task_sent_back',
      title: 'Task Sent Back',
      message: `"${task.title}" was sent back for revision: ${comment}`,
      link: `/tasks/${id}`,
      metadata: { task_id: id, actor_id: user.id, reason: comment },
    })
  }

  return NextResponse.json({ task: updated })
}
