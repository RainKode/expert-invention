// GET /api/admin/users/[id]/open-tasks — fetch open tasks for deactivation modal
// POST /api/admin/users/[id]/open-tasks — reassign or close a specific task

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import type { Role } from '@/types'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const admin = createAdminClient()

  // Fetch open tasks assigned to this user (not done, not archived)
  const { data: tasks } = await admin
    .from('tasks')
    .select('id, title, status, due_date, priority')
    .eq('assignee_id', id)
    .not('status', 'in', '("done","archived")')
    .order('due_date', { ascending: true })

  // Fetch team members for reassignment options (excluding the target user)
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('team_id, name')
    .eq('id', id)
    .single()

  let teamMembers: { id: string; name: string }[] = []
  if (targetProfile?.team_id) {
    const { data: members } = await admin
      .from('profiles')
      .select('id, name')
      .eq('team_id', targetProfile.team_id)
      .eq('status', 'active')
      .neq('id', id)
      .order('name')
    teamMembers = members ?? []
  }

  return NextResponse.json({
    tasks: tasks ?? [],
    team_members: teamMembers,
    target_name: targetProfile?.name ?? 'Unknown',
  })
}

const actionSchema = z.object({
  task_id: z.string().uuid(),
  action: z.enum(['reassign', 'close']),
  reassign_to: z.string().uuid().optional(),
})

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await request.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const admin = createAdminClient()
  const { task_id, action, reassign_to } = parsed.data

  if (action === 'reassign') {
    if (!reassign_to) return NextResponse.json({ error: 'reassign_to is required' }, { status: 400 })
    await admin.from('tasks').update({ assignee_id: reassign_to }).eq('id', task_id)
    // Audit
    await admin.from('audit_log').insert({
      actor_id: user.id,
      action: 'task.reassign',
      resource_type: 'task',
      resource_id: task_id,
      old_value: { assignee_id: id },
      new_value: { assignee_id: reassign_to },
    })
  } else {
    // Close task
    await admin.from('tasks').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', task_id)
    await admin.from('audit_log').insert({
      actor_id: user.id,
      action: 'task.close',
      resource_type: 'task',
      resource_id: task_id,
    })
  }

  return NextResponse.json({ success: true })
}
