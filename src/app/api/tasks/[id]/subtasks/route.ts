import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
})

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/:id/subtasks
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(id, name)')
    .eq('parent_task_id', id)
    .neq('status', 'archived')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subtasks: data ?? [] })
}

// POST /api/tasks/:id/subtasks — create a subtask
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  // Verify parent task exists and user can access it
  const { data: parent } = await supabase.from('tasks').select('id, team_id, project_id').eq('id', id).single()
  if (!parent) return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })

  const admin = createAdminClient()
  const { data: subtask, error } = await admin
    .from('tasks')
    .insert({
      ...parsed.data,
      parent_task_id: id,
      creator_id: user.id,
      assignee_id: user.id,
      team_id: parent.team_id,
      project_id: parent.project_id,
      status: 'todo',
      task_type: 'planned',
      task_nature: 'supporting',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTimelineEvent({
    taskId: id,
    eventType: 'subtask_added',
    actorId: user.id,
    metadata: { subtask_id: subtask.id, title: subtask.title },
  })

  return NextResponse.json({ subtask }, { status: 201 })
}
