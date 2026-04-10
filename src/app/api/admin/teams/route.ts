import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/permissions'
import { type Role } from '@/types'
import { z } from 'zod'

const deptSchema = z.object({
  name: z.string().min(1),
  senior_manager_id: z.string().uuid().optional().nullable(),
})

const teamSchema = z.object({
  name: z.string().min(1),
  department_id: z.string().uuid(),
  manager_id: z.string().uuid().optional().nullable(),
  planning_mode: z.enum(['locked', 'fluid']).default('fluid'),
  submission_deadline_day: z.number().min(0).max(6).optional().nullable(),
  submission_deadline_time: z.string().optional().nullable(),
  check_in_mandatory: z.boolean().default(false),
  eod_mandatory: z.boolean().default(false),
})

async function getActor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, actor: null }
  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { user, actor }
}

// ─── Departments ──────────────────────────────────────────────────────────────

export async function GET() {
  const { user, actor } = await getActor()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const supabase = await createClient()
  const { data: departments } = await supabase
    .from('departments')
    .select(`
      id, name, senior_manager_id,
      senior_manager:senior_manager_id(id, name),
      teams(id, name, manager_id, planning_mode, submission_deadline_day, submission_deadline_time, check_in_mandatory, eod_mandatory,
        manager:manager_id(id, name),
        member_count:profiles(count)
      )
    `)
    .order('name')

  return NextResponse.json({ departments })
}

export async function POST(request: Request) {
  const { user, actor } = await getActor()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await request.json()
  const { type, ...rest } = body

  const adminClient = createAdminClient()

  if (type === 'department') {
    const parsed = deptSchema.safeParse(rest)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    const { data, error } = await adminClient.from('departments').insert(parsed.data).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ department: data }, { status: 201 })
  }

  if (type === 'team') {
    const parsed = teamSchema.safeParse(rest)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    const { data, error } = await adminClient.from('teams').insert(parsed.data).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ team: data }, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid type. Expected "department" or "team".' }, { status: 400 })
}
