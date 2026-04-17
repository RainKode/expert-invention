import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  reviewer_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  estimated_hours: z.number().min(0).nullable().optional(),
  actual_hours: z.number().min(0).nullable().optional(),
  review_hours: z.number().min(0).nullable().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  task_nature: z.enum(['core', 'supporting']).optional(),
  billable: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/:id — full task with all relations
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: task, error } = await admin
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_creator_id_fkey(id, name),
      assignee:profiles!tasks_assignee_id_fkey(id, name),
      reviewer:profiles!tasks_reviewer_id_fkey(id, name),
      project:projects(id, name),
      subtasks:tasks!tasks_parent_task_id_fkey(
        id, title, status, priority, assignee_id,
        assignee:profiles!tasks_assignee_id_fkey(id, name)
      ),
      task_dependencies!task_dependencies_task_id_fkey(
        task_id, depends_on_task_id,
        depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  return NextResponse.json({ task })
}

// PATCH /api/tasks/:id — update task fields
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const admin = createAdminClient()

  // Fetch current task to check permissions & log diffs
  const { data: current } = await admin.from('tasks').select('*').eq('id', id).single()
  if (!current) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Permission: creator, assignee, reviewer, or manager+
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const isInvolved = current.creator_id === user.id || current.assignee_id === user.id || current.reviewer_id === user.id
  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(profile?.role ?? '')
  if (!isInvolved && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { data: updated, error } = await admin.from('tasks').update(parsed.data).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log changed fields to timeline
  for (const [key, newVal] of Object.entries(parsed.data)) {
    const oldVal = (current as Record<string, unknown>)[key]
    if (newVal !== undefined && String(newVal) !== String(oldVal)) {
      await logTimelineEvent({
        taskId: id,
        eventType: 'field_updated',
        actorId: user.id,
        oldValue: String(oldVal ?? ''),
        newValue: String(newVal ?? ''),
        metadata: { field: key },
      })
    }
  }

  return NextResponse.json({ task: updated })
}
