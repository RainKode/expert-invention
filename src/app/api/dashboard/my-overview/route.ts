// GET /api/dashboard/my-overview
// Returns personal dashboard data: today's tasks, completion rate, deadlines, carry-overs

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function getMondayISO(date?: string): string {
  const d = date ? new Date(date) : new Date()
  const day = d.getDay() // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getSundayISO(mondayISO: string): string {
  const d = new Date(mondayISO)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const today = todayISO()
  const weekStart = getMondayISO()
  const weekEnd = getSundayISO(weekStart)

  // Load profile for name
  const { data: profile } = await admin
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  // Today's tasks (assigned to me, due today, not done)
  const { data: todayTasksRaw } = await admin
    .from('tasks')
    .select('id, title, status, priority, due_date, estimated_hours, project:projects(name)')
    .eq('assignee_id', user.id)
    .eq('due_date', today)
    .neq('status', 'done')
    .order('priority', { ascending: true })

  // Overdue tasks (due before today, not done)
  const { data: overdueRaw } = await admin
    .from('tasks')
    .select('id, title, status, priority, due_date, estimated_hours, project:projects(name)')
    .eq('assignee_id', user.id)
    .lt('due_date', today)
    .neq('status', 'done')
    .order('due_date', { ascending: true })

  // All done tasks this week
  const { data: doneThisWeek } = await admin
    .from('tasks')
    .select('id')
    .eq('assignee_id', user.id)
    .eq('status', 'done')
    .gte('completed_at', weekStart + 'T00:00:00Z')
    .lte('completed_at', weekEnd + 'T23:59:59Z')

  // All committed tasks this week (from plan entries)
  const { data: weekPlan } = await admin
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStart)
    .single()

  let totalCommitted = 0
  let carryOverEntries: { id: string; title: string; original_date: string; day_of_week: number }[] = []
  if (weekPlan) {
    const { data: entries } = await admin
      .from('plan_entries')
      .select('id, day_of_week, is_carryover, original_date, task:tasks(id, title)')
      .eq('plan_id', weekPlan.id)

    totalCommitted = entries?.length ?? 0

    carryOverEntries = (entries ?? [])
      .filter(e => e.is_carryover && e.original_date)
      .map(e => {
        const task = Array.isArray(e.task) ? e.task[0] : e.task
        return {
          id: (task as { id: string } | null)?.id ?? e.id,
          title: (task as { title: string } | null)?.title ?? 'Unknown',
          original_date: e.original_date!,
          day_of_week: e.day_of_week,
        }
      })
  }

  // Upcoming deadlines (next 3 days, not done)
  const in3Days = new Date()
  in3Days.setDate(in3Days.getDate() + 3)
  const in3DaysISO = in3Days.toISOString().split('T')[0]

  const { data: deadlineRaw } = await admin
    .from('tasks')
    .select('id, title, due_date, project:projects(name)')
    .eq('assignee_id', user.id)
    .gt('due_date', today)
    .lte('due_date', in3DaysISO)
    .neq('status', 'done')
    .order('due_date', { ascending: true })
    .limit(5)

  const todayMs = new Date(today).getTime()

  const payload = {
    greeting_name: profile?.name?.split(' ')[0] ?? 'there',
    today_tasks: (todayTasksRaw ?? []).map(t => {
      const proj = Array.isArray(t.project) ? t.project[0] : t.project
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        estimated_hours: t.estimated_hours,
        project_name: (proj as { name: string } | null)?.name ?? null,
      }
    }),
    overdue_tasks: (overdueRaw ?? []).map(t => {
      const proj = Array.isArray(t.project) ? t.project[0] : t.project
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        estimated_hours: t.estimated_hours,
        project_name: (proj as { name: string } | null)?.name ?? null,
      }
    }),
    completed_this_week: doneThisWeek?.length ?? 0,
    total_committed_this_week: totalCommitted,
    completion_rate: totalCommitted > 0
      ? Math.round(((doneThisWeek?.length ?? 0) / totalCommitted) * 100)
      : 0,
    upcoming_deadlines: (deadlineRaw ?? []).map(t => {
      const proj = Array.isArray(t.project) ? t.project[0] : t.project
      const dueMs = new Date(t.due_date!).getTime()
      return {
        id: t.id,
        title: t.title,
        due_date: t.due_date!,
        project_name: (proj as { name: string } | null)?.name ?? null,
        days_until: Math.ceil((dueMs - todayMs) / 86400000),
      }
    }),
    carry_overs: carryOverEntries,
  }

  return NextResponse.json(payload)
}
