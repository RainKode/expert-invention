import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/permissions'
import { type Role } from '@/types'
import { z } from 'zod'
import crypto from 'crypto'

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const role = searchParams.get('role') ?? ''
  const team = searchParams.get('team') ?? ''
  const status = searchParams.get('status') ?? ''

  let query = supabase
    .from('profiles')
    .select(`
      id, name, email:id, role, team_id, manager_id, work_week, timezone,
      available_hours, billable_permission, status, invite_accepted,
      created_at, deactivated_at,
      teams(id, name),
      manager:manager_id(id, name)
    `)
    .order('name')

  if (q) query = query.or(`name.ilike.%${q}%`)
  if (role) query = query.eq('role', role)
  if (team) query = query.eq('team_id', team)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch emails from auth.users using admin client
  const adminClient = createAdminClient()
  const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email]) ?? [])

  const users = (data ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? '',
  }))

  return NextResponse.json({ users })
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['employee', 'senior_employee', 'assistant_manager', 'manager', 'senior_manager', 'admin']),
  team_id: z.string().uuid().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  work_week: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
  timezone: z.string().default('UTC'),
  available_hours: z.number().min(1).max(24).default(8),
  billable_permission: z.enum(['billable', 'non_billable', 'both']).default('both'),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, role, team_id, manager_id, work_week, timezone, available_hours, billable_permission } = parsed.data
  const adminClient = createAdminClient()

  // Create auth user (no password — they'll set it via invite)
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  // Update profile (trigger creates it, we update the rest)
  await adminClient.from('profiles').update({
    name,
    role,
    team_id: team_id ?? null,
    manager_id: manager_id ?? null,
    work_week,
    timezone,
    available_hours,
    billable_permission,
    status: 'active',
    invite_accepted: false,
  }).eq('id', newUser.user.id)

  // Generate invite token
  const token = crypto.randomBytes(32).toString('hex')
  await adminClient.from('invite_tokens').insert({
    user_id: newUser.user.id,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  // Log audit event
  await adminClient.from('audit_log').insert({
    actor_id: user.id,
    action: 'user.create',
    resource_type: 'user',
    resource_id: newUser.user.id,
    metadata: { email, role, name },
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${token}`

  return NextResponse.json({
    user: { id: newUser.user.id, email, name, role },
    inviteUrl,
  }, { status: 201 })
}
