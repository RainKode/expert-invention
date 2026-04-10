// GET  /api/checkin — fetch today's check-in (pre-populated from plan if not yet submitted)
// POST /api/checkin { tasks_json, notes } — submit today's check-in

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const checkinTaskSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  planned_hours: z.number(),
  category: z.string().optional(),
  confirmed: z.boolean(),
})

const submitCheckinSchema = z.object({
  tasks_json: z.array(checkinTaskSchema),
  notes: z.string().nullable().optional(),
})

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayISO()
  const admin = createAdminClient()

  // Check if already submitted today
  const { data: existing } = await admin
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing) {
    return NextResponse.json({ checkin: existing, already_submitted: true })
  }

  // Pre-populate from plan for today's day_of_week
  const dayOfWeek = new Date().getDay()

  // Find the Monday of the current week
  const now = new Date()
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const weekStart = monday.toISOString().split('T')[0]

  const { data: plan } = await admin
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStart)
    .single()

  let tasks_json: unknown[] = []

  if (plan) {
    const { data: entries } = await admin
      .from('plan_entries')
      .select('*, task:tasks(id, title, priority, estimated_hours, project:projects(name))')
      .eq('plan_id', plan.id)
      .eq('day_of_week', dayOfWeek)

    tasks_json = (entries ?? []).map((entry) => {
      const task = Array.isArray(entry.task) ? entry.task[0] : entry.task
      const project = task?.project
        ? (Array.isArray(task.project) ? task.project[0] : task.project)
        : null
      return {
        task_id: entry.task_id,
        title: task?.title ?? 'Unknown Task',
        priority: task?.priority ?? 'medium',
        planned_hours: entry.planned_hours,
        category: project?.name ?? undefined,
        confirmed: true,
      }
    })
  }

  return NextResponse.json({
    checkin: {
      user_id: user.id,
      date: today,
      tasks_json,
      notes: null,
      submitted_at: null,
    },
    already_submitted: false,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = submitCheckinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const today = todayISO()
  const admin = createAdminClient()

  // Upsert — allow re-submit on same day
  const { data, error } = await admin
    .from('daily_checkins')
    .upsert(
      {
        user_id: user.id,
        date: today,
        tasks_json: parsed.data.tasks_json,
        notes: parsed.data.notes ?? null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checkin: data })
}
