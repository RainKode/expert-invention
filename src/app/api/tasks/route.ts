import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import { logTimelineEvent } from '@/lib/task-timeline'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'
import type { Role, TaskStatus, CustomFieldType } from '@/types'
import { sanitizeFilterInput } from '@/lib/sanitize'

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

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, team_id').eq('id', user.id).single()
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

  // Use admin client to bypass RLS — scoping is handled by application logic below
  let query = admin
    .from('tasks')
    .select(`
      id, title, status, priority, task_type, task_nature, billable,
      due_date, estimated_hours, actual_hours, creator_id, assignee_id,
      reviewer_id, project_id, parent_task_id, completed_at, created_at, updated_at,
      assignee:profiles!tasks_assignee_id_fkey(id, name),
      project:projects(id, name)
    `)
    .is('parent_task_id', parentTaskId ?? null)
    .neq('status', 'archived')
    .order('due_date', { ascending: true })

  // Scope by role
  if (teamScope && role && can(role, 'view_team_tasks')) {
    // Managers see tasks for their team members
    if (role !== 'admin' && profile?.team_id) {
      const { data: teamMembers } = await admin
        .from('profiles')
        .select('id')
        .eq('team_id', profile.team_id)
      if (teamMembers && teamMembers.length > 0) {
        const memberIds = teamMembers.map((m: { id: string }) => m.id)
        query = query.in('assignee_id', memberIds)
      }
    }
    // Admin sees all tasks (no filter)
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
  if (billable === 'true' || billable === 'false') query = query.eq('billable', billable === 'true')
  if (dueBefore) query = query.lte('due_date', dueBefore)
  if (dueAfter) query = query.gte('due_date', dueAfter)
  if (search) query = query.ilike('title', `%${sanitizeFilterInput(search)}%`)

  // --- Custom field filtering ---
  // Custom field params use prefix "cf_" e.g. ?cf_<fieldId>=value
  // For number fields: cf_<id>_min / cf_<id>_max
  // For date fields: cf_<id>_from / cf_<id>_to
  // For checkbox: cf_<id>=true/false
  const cfFilters: { fieldId: string; value?: string; min?: string; max?: string; from?: string; to?: string }[] = []
  searchParams.forEach((val, key) => {
    const cfMatch = key.match(/^cf_([a-f0-9-]+?)(?:_(min|max|from|to))?$/)
    if (cfMatch && val) {
      const fieldId = cfMatch[1]
      const suffix = cfMatch[2] as 'min' | 'max' | 'from' | 'to' | undefined
      let entry = cfFilters.find(f => f.fieldId === fieldId)
      if (!entry) { entry = { fieldId }; cfFilters.push(entry) }
      if (suffix) { entry[suffix] = val } else { entry.value = val }
    }
  })

  let customFieldTaskIds: string[] | null = null
  if (cfFilters.length > 0) {
    // For each custom field filter, find matching task IDs
    const taskIdSets = await Promise.all(cfFilters.map(async (cf) => {
      let cfQuery = admin.from('custom_field_values')
        .select('task_id')
        .eq('field_definition_id', cf.fieldId)

      if (cf.value !== undefined) {
        // Exact or ilike match depending on type
        cfQuery = cfQuery.ilike('value', `%${cf.value}%`)
      }
      if (cf.min !== undefined) {
        cfQuery = cfQuery.gte('value', cf.min)
      }
      if (cf.max !== undefined) {
        cfQuery = cfQuery.lte('value', cf.max)
      }
      if (cf.from !== undefined) {
        cfQuery = cfQuery.gte('value', cf.from)
      }
      if (cf.to !== undefined) {
        cfQuery = cfQuery.lte('value', cf.to)
      }

      const { data: vals } = await cfQuery
      return new Set((vals ?? []).map((v: { task_id: string }) => v.task_id))
    }))

    // Intersect all sets
    let intersection = taskIdSets[0]
    for (let i = 1; i < taskIdSets.length; i++) {
      intersection = new Set([...intersection].filter(id => taskIdSets[i].has(id)))
    }
    customFieldTaskIds = [...intersection]

    if (customFieldTaskIds.length === 0) {
      return NextResponse.json({ tasks: [] })
    }
    query = query.in('id', customFieldTaskIds)
  }

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

    // Notify the assignee
    const { data: creatorProfile } = await admin.from('profiles').select('name').eq('id', user.id).single()
    await createNotification({
      recipientId: data.assignee_id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${creatorProfile?.name ?? 'Someone'} assigned you "${task.title}"`,
      link: `/tasks/${task.id}`,
      metadata: { task_id: task.id, actor_id: user.id },
    })
  }

  return NextResponse.json({ task }, { status: 201 })
}
