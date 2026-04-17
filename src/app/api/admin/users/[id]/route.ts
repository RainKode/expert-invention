import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/permissions'
import { type Role } from '@/types'
import { z } from 'zod'
import crypto from 'crypto'
import { sendEmail, inviteEmailHtml } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH /api/admin/users/[id] — Update user ────────────────────────────────

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['employee', 'senior_employee', 'assistant_manager', 'manager', 'senior_manager', 'admin']).optional(),
  team_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  work_week: z.array(z.number().min(0).max(6)).optional(),
  timezone: z.string().optional(),
  available_hours: z.number().min(1).max(24).optional(),
  billable_permission: z.enum(['billable', 'non_billable', 'both']).optional(),
})

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('profiles').update(parsed.data).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await adminClient.from('audit_log').insert({
    actor_id: user.id,
    action: 'user.update',
    resource_type: 'user',
    resource_id: id,
    metadata: parsed.data,
  })

  return NextResponse.json({ success: true })
}

// ─── DELETE /api/admin/users/[id] — Deactivate user ──────────────────────────

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  // Cannot deactivate yourself
  if (id === user.id) {
    return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { searchParams } = new URL(request.url)
  const reactivate = searchParams.get('reactivate') === 'true'

  if (reactivate) {
    await adminClient.from('profiles').update({
      status: 'active',
      deactivated_at: null,
    }).eq('id', id)

    await adminClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'user.reactivate',
      resource_type: 'user',
      resource_id: id,
    })
  } else {
    await adminClient.from('profiles').update({
      status: 'deactivated',
      deactivated_at: new Date().toISOString(),
    }).eq('id', id)

    await adminClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'user.deactivate',
      resource_type: 'user',
      resource_id: id,
    })
  }

  return NextResponse.json({ success: true })
}

// ─── POST /api/admin/users/[id]/resend-invite ─────────────────────────────────

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(actor?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const adminClient = createAdminClient()

  // Invalidate old tokens
  await adminClient.from('invite_tokens').update({ accepted: true }).eq('user_id', id).eq('accepted', false)

  // Create new token
  const token = crypto.randomBytes(32).toString('hex')
  await adminClient.from('invite_tokens').insert({
    user_id: id,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${token}`

  // Send invite email
  const { data: profile } = await adminClient
    .from('profiles')
    .select('name, email, team_id')
    .eq('id', id)
    .single()

  if (profile?.email) {
    const teamName = profile.team_id
      ? (await adminClient.from('teams').select('name').eq('id', profile.team_id).single()).data?.name
      : null
    await sendEmail({
      to: profile.email,
      subject: 'You\'ve been invited to Sunday',
      html: inviteEmailHtml({
        recipientName: profile.name ?? 'there',
        teamName,
        setPasswordUrl: inviteUrl,
      }),
    })
  }

  return NextResponse.json({ inviteUrl })
}
