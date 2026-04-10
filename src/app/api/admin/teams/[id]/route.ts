import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/permissions'
import { type Role } from '@/types'
import { z } from 'zod'

interface Params { params: { id: string } }

async function getActor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, actor: null }
  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { user, actor }
}

const updateSchema = z.object({
  type: z.enum(['department', 'team']),
  name: z.string().min(1).optional(),
  senior_manager_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  planning_mode: z.enum(['locked', 'fluid']).optional(),
  submission_deadline_day: z.number().min(0).max(6).nullable().optional(),
  submission_deadline_time: z.string().nullable().optional(),
  check_in_mandatory: z.boolean().optional(),
  eod_mandatory: z.boolean().optional(),
})

export async function PATCH(request: Request, { params }: Params) {
  const { user, actor } = await getActor()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { type, ...data } = parsed.data
  const adminClient = createAdminClient()
  const table = type === 'department' ? 'departments' : 'teams'
  const { error } = await adminClient.from(table).update(data).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const { user, actor } = await getActor()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'team'

  const adminClient = createAdminClient()
  const table = type === 'department' ? 'departments' : 'teams'
  const { error } = await adminClient.from(table).delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
