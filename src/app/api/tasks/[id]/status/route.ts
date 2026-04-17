import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const VALID_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress'],
  in_progress: ['in_review'],
  in_review: ['todo', 'in_progress', 'done'], // reviewer can approve (done) or send back
  done: [],
}

const schema = z.object({
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']),
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

  const { status: newStatus } = parsed.data

  const admin = createAdminClient()
  const { data: task } = await admin.from('tasks').select('*').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(profile?.role ?? '')
  const isAssignee = task.assignee_id === user.id
  const isReviewer = task.reviewer_id === user.id

  if (!isAssignee && !isReviewer && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowed = VALID_TRANSITIONS[task.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({ error: `Cannot transition from ${task.status} to ${newStatus}` }, { status: 422 })
  }

  // Moving to in_review or done requires completion report
  if ((newStatus === 'in_review' || newStatus === 'done') && !task.completion_report_text && !task.completion_report_file_path) {
    return NextResponse.json({ error: 'Completion report required before submitting for review' }, { status: 422 })
  }

  // Only reviewer (or manager+) can move in_review → done
  if (task.status === 'in_review' && newStatus === 'done' && !isReviewer && !isManager) {
    return NextResponse.json({ error: 'Only the reviewer can approve task completion' }, { status: 403 })
  }

  // Check dependencies: cannot start (in_progress) if any blocker is not done
  if (newStatus === 'in_progress') {
    const { data: deps } = await admin
      .from('task_dependencies')
      .select('depends_on_task_id, depends_on:tasks!task_dependencies_depends_on_task_id_fkey(status)')
      .eq('task_id', id)

    const blockers = (deps ?? []).filter((d: { depends_on: unknown }) => {
      const dep = d.depends_on as { status: string } | { status: string }[] | null
      if (!dep) return true
      const status = Array.isArray(dep) ? dep[0]?.status : dep.status
      return status !== 'done'
    })
    if (blockers.length > 0) {
      return NextResponse.json({ error: 'Task has incomplete dependencies' }, { status: 422 })
    }
  }

  const updatePayload: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'done') {
    updatePayload.completed_at = new Date().toISOString()
  }

  const { data: updated, error } = await admin.from('tasks').update(updatePayload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTimelineEvent({
    taskId: id,
    eventType: 'status_changed',
    actorId: user.id,
    oldValue: task.status,
    newValue: newStatus,
  })

  // Notify reviewer when task moves to in_review
  if (newStatus === 'in_review' && task.reviewer_id) {
    await createNotification({
      recipientId: task.reviewer_id,
      type: 'task_in_review',
      title: 'Task Ready for Review',
      message: `"${task.title}" has been submitted for your review`,
      link: `/tasks/${id}`,
      metadata: { task_id: id, actor_id: user.id },
    })
  }

  // Check for dependency unblocks when a task is completed
  if (newStatus === 'done') {
    const adminClient = createAdminClient()
    const { data: dependents } = await adminClient
      .from('task_dependencies')
      .select('task_id, task:tasks!task_dependencies_task_id_fkey(id, title, assignee_id)')
      .eq('depends_on_task_id', id)
    for (const dep of dependents ?? []) {
      const depTask = Array.isArray(dep.task) ? dep.task[0] : dep.task
      if (!depTask?.assignee_id) continue
      // Check if ALL dependencies of this dependent task are now done
      const { data: allDeps } = await adminClient
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
  }

  return NextResponse.json({ task: updated })
}
