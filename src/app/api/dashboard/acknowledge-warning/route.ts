// POST /api/dashboard/acknowledge-warning
// Manager acknowledges an employee's unplanned days → creates audit log + activity event

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import { z } from 'zod'
import type { Role } from '@/types'

const schema = z.object({
  employee_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  unplanned_days: z.array(z.number().int().min(0).max(6)).min(1),
  note: z.string().max(500).nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, name, team_id')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const role = profile.role as Role
  if (!can(role, 'comment_on_plans')) {
    return NextResponse.json({ error: 'Forbidden — manager+ only' }, { status: 403 })
  }

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { employee_id, week_start, unplanned_days, note } = result.data

  // Fetch employee name for description
  const { data: employee } = await admin
    .from('profiles')
    .select('name')
    .eq('id', employee_id)
    .single()

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayLabels = unplanned_days.map(d => dayNames[d]).join(', ')

  // Insert acknowledgement record
  const { data: ack, error: ackError } = await admin
    .from('warning_acknowledgements')
    .insert({
      manager_id: user.id,
      employee_id,
      week_start,
      unplanned_days,
      note: note ?? null,
    })
    .select()
    .single()

  if (ackError) return NextResponse.json({ error: ackError.message }, { status: 500 })

  // Write activity event
  await admin.from('activity_events').insert({
    user_id: user.id,
    team_id: profile.team_id ?? null,
    event_type: 'warning_acknowledged',
    description: `${profile.name} acknowledged unplanned days (${dayLabels}) for ${employee?.name ?? employee_id} — week of ${week_start}`,
    target_id: employee_id,
    target_type: 'user',
    metadata: { week_start, unplanned_days, note: note ?? null },
  })

  return NextResponse.json(ack, { status: 201 })
}
