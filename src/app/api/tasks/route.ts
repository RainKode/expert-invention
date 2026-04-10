import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import { logTimelineEvent } from '@/lib/task-timeline'
import { z } from 'zod'
import type { Role, TaskStatus } from '@/types'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  assignee_id: z.string().uuid('Invalid assignee'),
  reviewer_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.number().min(0.25).max(999).optional().nullable(),
  task_type: z.enum(['planned', 'adhoc']).default('planned'),
  task_nature: z.enum(['core', 'supporting']).default('core'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  billable: z.boolean().default(false),
  // Ad hoc backdating
  already_completed: z.boolean().default(false),
  actual_hours: z.number().min(0).max(999).optional().nullable(),
  completion_report_text: z.string().optional().nullable(),
})

// GET /api/tasks — filtered task list
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role as Role | undefined

  const { searchParams } = new URL(request.url)
  const assigneeId = searchParams.get('assignee_id')
  const status = searchParams.get('status') as TaskStatus | null
  const priority = searchParams.get('priority')
  const taskType = searchParams.get('task_type')
  const taskNature = searchParams.get('task_nature')
  const projectId = searchParams.get('project_id')
  const billable = searchParams.get('billable')
  const parentTaskId = searchParams.get('parent_task_id')
  const dueBefore = searchParams.get('due_before')
  const dueAfter = searchParams.get('due_after')
  const teamScope = searchParams.get('team') === 'true'
  const search = searchParams.get('search')

  // Base select with relations
  let query = supabase
    .from('tasks')
    .select(`
      id, title, status, priority, task_type, task_nature, billable,
      due_date, estimated_hours, actual_hours, creator_id, assignee_id,
      reviewer_id, project_id, parent_task_id, completed_at, created_at, updated_at,
      assignee:profiles!tasks_assignee_id_fkey(id, name, email),
      project:projects(id, name)
    `)
    .is('parent_task_id', parentTaskId ?? null)
    .order('due_date', { ascending: true })

  // Scope by role — managers can request team scope
  if (teamScope && role && can(role, 'view_team_tasks')) {
    // Team scope: tasks within manager's visible scope (handled by RLS)
  } else {
    // Personal scope: only tasks where user is involved
    query = query.or(
      `assignee_id.eq.${user.id},creator_id.eq.${user.id},reviewer_id.eq.${user.id}`
    )
  }

  if (assigneeId) query = query.eq('assignee_id', assigneeId)
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (taskType) query = query.eq('task_type', taskType)
  if (taskNature) query = query.eq('task_nature', taskNature)
  if (projectId) query = query.eq('project_id', projectId)
  if (billable !== null) query = query.eq('billable', billable === 'true')
  if (dueBefore) query = query.lte('due_date', dueBefore)
  if (dueAfter) query = query.gte('due_date', dueAfter)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data })
}

// POST /api/tasks — create task
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, billable_permission, team_id').eq('id', user.id).single()
  const role = profile?.role as Role | undefined

  const body = await request.json()
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const data = parsed.data

  // Permission: can you create a task for this assignee?
  if (data.assignee_id !== user.id) {
    if (!role || !can(role, 'create_task_for_others')) {
      return NextResponse.json({ error: 'You can only create tasks for yourself' }, { status: 403 })
    }
  }

  // Billable permission check
  if (data.billable && profile?.billable_permission === 'non_billable') {
    return NextResponse.json({ error: 'Your account does not have billable permissions' }, { status: 403 })
  }

  // Ad hoc backdating requires completion report
  if (data.already_completed && !data.completion_report_text) {
    return NextResponse.json({ error: 'Completion report is required for already-completed tasks' }, { status: 400 })
  }
  if (data.already_completed && !data.actual_hours) {
    return NextResponse.json({ error: 'Actual hours are required for already-completed tasks' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: task, error } = await admin.from('tasks').insert({
    title: data.title,
    description: data.description ?? null,
    creator_id: user.id,
    assignee_id: data.assignee_id,
    reviewer_id: data.reviewer_id ?? null,
    project_id: data.project_id ?? null,
    due_date: data.due_date ?? null,
    estimated_hours: data.estimated_hours ?? null,
    task_type: data.already_completed ? 'adhoc' : data.task_type,
    task_nature: data.task_nature,
    priority: data.priority,
    billable: data.billable,
    status: data.already_completed ? 'done' : 'todo',
    actual_hours: data.already_completed ? data.actual_hours : null,
    completion_report_text: data.already_completed ? data.completion_report_text : null,
    completed_at: data.already_completed ? new Date().toISOString() : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log timeline event
  await logTimelineEvent({
    taskId: task.id,
    eventType: data.already_completed ? 'created' : 'created',
    actorId: user.id,
    newValue: task.title,
    metadata: data.already_completed
      ? { note: 'Task created as already completed (ad hoc)' }
      : undefined,
  })

  // Assigned event if assignee differs from creator
  if (data.assignee_id !== user.id) {
    await logTimelineEvent({
      taskId: task.id,
      eventType: 'assigned',
      actorId: user.id,
      newValue: data.assignee_id,
    })
  }

  return NextResponse.json({ task }, { status: 201 })
}
