import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import WrapupClient from './WrapupClient'
import type { WrapupTaskRow } from '@/types'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function WrapupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayISO()
  const admin = createAdminClient()

  // Check for existing submission
  const { data: existing } = await admin
    .from('eod_wrapups')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing) {
    return (
      <WrapupClient
        wrapup={existing}
        alreadySubmitted={true}
      />
    )
  }

  // Pre-fill from plan entries + actual task data
  const dayOfWeek = new Date().getDay()
  const weekStart = getMondayOfWeek(new Date())
  const weekStartISO = weekStart.toISOString().split('T')[0]

  const { data: plan } = await admin
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStartISO)
    .single()

  let planned: WrapupTaskRow[] = []
  let actual: WrapupTaskRow[] = []

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
        planned_hours: Number(entry.planned_hours),
        actual_hours: Number(task?.actual_hours ?? 0),
        status: task?.status ?? 'todo',
        category: project?.name ?? undefined,
      } satisfies WrapupTaskRow
    })

    actual = planned.map((p) => ({ ...p }))
  }

  const draft = {
    user_id: user.id,
    date: today,
    planned_tasks_json: planned,
    actual_tasks_json: actual,
    notes: null,
    discrepancies_json: null,
    submitted_at: null,
  }

  return <WrapupClient wrapup={draft} alreadySubmitted={false} />
}
