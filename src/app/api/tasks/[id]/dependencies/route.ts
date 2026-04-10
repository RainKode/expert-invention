import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { z } from 'zod'

const addSchema = z.object({
  depends_on_task_id: z.string().uuid(),
})

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/:id/dependencies
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('task_dependencies')
    .select('*, depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status, assignee_id)')
    .eq('task_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ dependencies: data ?? [] })
}

// POST /api/tasks/:id/dependencies — add dependency (with circular check)
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { depends_on_task_id } = parsed.data

  if (id === depends_on_task_id) {
    return NextResponse.json({ error: 'A task cannot depend on itself' }, { status: 422 })
  }

  // Circular dependency check: does depends_on_task_id already (directly or transitively) depend on id?
  const visited = new Set<string>()
  const queue = [depends_on_task_id]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    const { data: deps } = await supabase
      .from('task_dependencies')
      .select('depends_on_task_id')
      .eq('task_id', current)

    for (const dep of deps ?? []) {
      if (dep.depends_on_task_id === id) {
        return NextResponse.json({ error: 'Adding this dependency would create a circular dependency' }, { status: 422 })
      }
      queue.push(dep.depends_on_task_id)
    }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('task_dependencies').insert({ task_id: id, depends_on_task_id })
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Dependency already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logTimelineEvent({
    taskId: id,
    eventType: 'dependency_added',
    actorId: user.id,
    metadata: { depends_on_task_id },
  })

  return NextResponse.json({ message: 'Dependency added' }, { status: 201 })
}

// DELETE /api/tasks/:id/dependencies?depends_on_task_id=xxx
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const depends_on_task_id = searchParams.get('depends_on_task_id')
  if (!depends_on_task_id) return NextResponse.json({ error: 'depends_on_task_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('task_dependencies')
    .delete()
    .eq('task_id', id)
    .eq('depends_on_task_id', depends_on_task_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTimelineEvent({
    taskId: id,
    eventType: 'dependency_resolved',
    actorId: user.id,
    metadata: { depends_on_task_id },
  })

  return NextResponse.json({ message: 'Dependency removed' })
}
