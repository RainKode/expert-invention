// GET  /api/wrapup — fetch today's wrap-up (pre-filled from tasks + plan)
// POST /api/wrapup { planned_tasks_json, actual_tasks_json, notes } — submit

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const wrapupTaskRowSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string(),
  planned_hours: z.number(),
  actual_hours: z.number(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']),
  category: z.string().optional(),
})

const submitWrapupSchema = z.object({
  planned_tasks_json: z.array(wrapupTaskRowSchema),
  actual_tasks_json: z.array(wrapupTaskRowSchema),
  notes: z.string().nullable().optional(),
})

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function computeDiscrepancies(
  planned: z.infer<typeof wrapupTaskRowSchema>[],
  actual: z.infer<typeof wrapupTaskRowSchema>[]
) {
  return planned
    .map((p) => {
      const a = actual.find((x) => x.task_id === p.task_id)
      const actualHours = a?.actual_hours ?? 0
      const delta = actualHours - p.planned_hours
      return { task_id: p.task_id, title: p.title, planned_hours: p.planned_hours, actual_hours: actualHours, delta }
    })
    .filter((d) => Math.abs(d.delta) >= 0.5)
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayISO()
  const admin = createAdminClient()

  // Check if already submitted
  const { data: existing } = await admin
    .from('eod_wrapups')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing) {
    return NextResponse.json({ wrapup: existing, already_submitted: true })
  }

  // Pre-fill from today's plan entries + actual task data
  const dayOfWeek = new Date().getDay()
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

  let planned: unknown[] = []
  let actual: unknown[] = []

  if (plan) {
    const { data: entries } = await admin
      .from('plan_entries')
      .select('*, task:tasks(id, title, priority, status, actual_hours, estimated_hours, project:projects(name))')
      .eq('plan_id', plan.id)
      .eq('day_of_week', dayOfWeek)

    planned = (entries ?? []).map((entry) => {
      const task = Array.isArray(entry.task) ? entry.task[0] : entry.task
      const project = task?.project
        ? (Array.isArray(task.project) ? task.project[0] : task.project)
        : null
      return {
        task_id: entry.task_id,
        title: task?.title ?? 'Unknown Task',
        planned_hours: entry.planned_hours,
        actual_hours: task?.actual_hours ?? 0,
        status: task?.status ?? 'todo',
        category: project?.name ?? undefined,
      }
    })

    actual = planned.map((p) => ({ ...(p as Record<string, unknown>) }))
  }

  return NextResponse.json({
    wrapup: {
      user_id: user.id,
      date: today,
      planned_tasks_json: planned,
      actual_tasks_json: actual,
      notes: null,
      discrepancies_json: null,
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
  const parsed = submitWrapupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const today = todayISO()
  const discrepancies = computeDiscrepancies(
    parsed.data.planned_tasks_json,
    parsed.data.actual_tasks_json
  )

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('eod_wrapups')
    .upsert(
      {
        user_id: user.id,
        date: today,
        planned_tasks_json: parsed.data.planned_tasks_json,
        actual_tasks_json: parsed.data.actual_tasks_json,
        notes: parsed.data.notes ?? null,
        discrepancies_json: discrepancies.length > 0 ? discrepancies : null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ wrapup: data })
}
