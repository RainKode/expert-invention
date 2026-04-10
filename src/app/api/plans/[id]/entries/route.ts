// POST /api/plans/:id/entries  — upsert a plan entry (task on a day with hours)
// DELETE /api/plans/:id/entries  ?task_id=&day_of_week=  — remove entry

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const upsertEntrySchema = z.object({
  task_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  planned_hours: z.number().min(0).max(24),
  is_carryover: z.boolean().default(false),
  original_date: z.string().nullable().optional(),
})

async function resolveUser(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function checkPlanOwnership(planId: string, userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('weekly_plans')
    .select('id, user_id, locked, submission_status')
    .eq('id', planId)
    .single()
  return data
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = await checkPlanOwnership(params.id, user.id)
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (plan.locked) return NextResponse.json({ error: 'Plan is locked — unlock first' }, { status: 409 })

  const body = await request.json()
  const parsed = upsertEntrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plan_entries')
    .upsert(
      {
        plan_id: params.id,
        task_id: parsed.data.task_id,
        day_of_week: parsed.data.day_of_week,
        planned_hours: parsed.data.planned_hours,
        is_carryover: parsed.data.is_carryover,
        original_date: parsed.data.original_date ?? null,
      },
      { onConflict: 'plan_id,task_id,day_of_week' }
    )
    .select(`*, task:tasks(id, title, priority, status, estimated_hours)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = await checkPlanOwnership(params.id, user.id)
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (plan.locked) return NextResponse.json({ error: 'Plan is locked' }, { status: 409 })

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')
  const dayOfWeek = searchParams.get('day_of_week')
  if (!taskId || !dayOfWeek) {
    return NextResponse.json({ error: 'task_id and day_of_week required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('plan_entries')
    .delete()
    .eq('plan_id', params.id)
    .eq('task_id', taskId)
    .eq('day_of_week', parseInt(dayOfWeek, 10))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
