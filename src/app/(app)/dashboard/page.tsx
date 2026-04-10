// src/app/(app)/dashboard/page.tsx
// My Overview — personal dashboard
// Server component: fetches overview data, passes to client

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import type { MyOverviewData } from '@/types'

function getMondayISO(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getSundayISO(monday: string): string {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const weekStart = getMondayISO()
  const weekEnd = getSundayISO(weekStart)

  const { data: profile } = await admin
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const [todayResult, overdueResult, doneResult, deadlineResult] = await Promise.all([
    admin.from('tasks')
      .select('id, title, status, priority, due_date, estimated_hours, project:projects(name)')
      .eq('assignee_id', user.id)
      .eq('due_date', today)
      .neq('status', 'done'),
    admin.from('tasks')
      .select('id, title, status, priority, due_date, estimated_hours, project:projects(name)')
      .eq('assignee_id', user.id)
      .lt('due_date', today)
      .neq('status', 'done')
      .order('due_date', { ascending: true }),
    admin.from('tasks')
      .select('id')
      .eq('assignee_id', user.id)
      .eq('status', 'done')
      .gte('completed_at', weekStart + 'T00:00:00Z')
      .lte('completed_at', weekEnd + 'T23:59:59Z'),
    admin.from('tasks')
      .select('id, title, due_date, project:projects(name)')
      .eq('assignee_id', user.id)
      .gt('due_date', today)
      .lte('due_date', (() => {
        const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]
      })())
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(5),
  ])

  const { data: weekPlan } = await admin
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStart)
    .single()

  let totalCommitted = 0
  let carryOvers: MyOverviewData['carry_overs'] = []

  if (weekPlan) {
    const { data: entries } = await admin
      .from('plan_entries')
      .select('id, day_of_week, is_carryover, original_date, task:tasks(id, title)')
      .eq('plan_id', weekPlan.id)

    totalCommitted = entries?.length ?? 0
    carryOvers = (entries ?? [])
      .filter(e => e.is_carryover && e.original_date)
      .map(e => {
        const t = Array.isArray(e.task) ? e.task[0] : e.task
        return {
          id: (t as { id: string } | null)?.id ?? e.id,
          title: (t as { title: string } | null)?.title ?? 'Unknown',
          original_date: e.original_date!,
          day_of_week: e.day_of_week,
        }
      })
  }

  const todayMs = new Date(today).getTime()

  function flattenProject(raw: unknown): string | null {
    const p = Array.isArray(raw) ? raw[0] : raw
    return (p as { name: string } | null)?.name ?? null
  }

  type TodayTaskType = MyOverviewData['today_tasks'][0]

  const doneCt = doneResult.data?.length ?? 0
  const completionRate = totalCommitted > 0 ? Math.round((doneCt / totalCommitted) * 100) : 0

  const data: MyOverviewData = {
    greeting_name: profile?.name?.split(' ')[0] ?? 'there',
    today_tasks: (todayResult.data ?? []).map(t => ({
      id: t.id, title: t.title,
      status: t.status as TodayTaskType['status'],
      priority: t.priority as TodayTaskType['priority'],
      due_date: t.due_date, estimated_hours: t.estimated_hours,
      project_name: flattenProject(t.project),
    })),
    overdue_tasks: (overdueResult.data ?? []).map(t => ({
      id: t.id, title: t.title,
      status: t.status as TodayTaskType['status'],
      priority: t.priority as TodayTaskType['priority'],
      due_date: t.due_date, estimated_hours: t.estimated_hours,
      project_name: flattenProject(t.project),
    })),
    completed_this_week: doneCt,
    total_committed_this_week: totalCommitted,
    completion_rate: completionRate,
    upcoming_deadlines: (deadlineResult.data ?? []).map(t => ({
      id: t.id, title: t.title, due_date: t.due_date!,
      project_name: flattenProject(t.project),
      days_until: Math.ceil((new Date(t.due_date!).getTime() - todayMs) / 86400000),
    })),
    carry_overs: carryOvers,
  }

  return <DashboardClient data={data} role={profile?.role ?? 'employee'} />
}
