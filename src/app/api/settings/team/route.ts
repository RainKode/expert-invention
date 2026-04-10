// GET/PATCH /api/settings/team — team settings (manager/admin only)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import { z } from 'zod'
import type { Role } from '@/types'

const patchSchema = z.object({
  planning_mode: z.enum(['locked', 'fluid']).optional(),
  submission_deadline_day: z.number().min(0).max(6).optional().nullable(),
  submission_deadline_time: z.string().optional().nullable(),
  check_in_mandatory: z.boolean().optional(),
  eod_mandatory: z.boolean().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const role = profile.role as Role
  if (!can(role, 'create_custom_fields')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!profile.team_id) {
    return NextResponse.json({ error: 'No team assigned' }, { status: 400 })
  }

  const { data: team } = await admin
    .from('teams')
    .select('id, name, planning_mode, submission_deadline_day, submission_deadline_time, check_in_mandatory, eod_mandatory')
    .eq('id', profile.team_id)
    .single()

  return NextResponse.json({ team: team ?? null })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const role = profile.role as Role
  if (!can(role, 'create_custom_fields')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!profile.team_id) {
    return NextResponse.json({ error: 'No team assigned' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { error } = await admin
    .from('teams')
    .update(parsed.data)
    .eq('id', profile.team_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await admin.from('audit_log').insert({
    actor_id: user.id,
    action: 'team.update',
    resource_type: 'team',
    resource_id: profile.team_id,
    old_value: null,
    new_value: parsed.data,
  })

  return NextResponse.json({ success: true })
}
