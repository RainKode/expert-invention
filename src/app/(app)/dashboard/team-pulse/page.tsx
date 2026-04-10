// src/app/(app)/dashboard/team-pulse/page.tsx
// Team Pulse — manager's primary dashboard
// Server component: loads team capacity + overdue data

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import TeamPulseClient from './TeamPulseClient'
import type { Role, TeamPulseData } from '@/types'

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

export default async function TeamPulsePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, team_id, name')
    .eq('id', user.id)
    .single()

  if (!profile || !can(profile.role as Role, 'view_team_tasks')) {
    redirect('/dashboard')
  }

  const role = profile.role as Role
  const weekStart = params.week ?? getMondayISO()
  const weekEnd = getSundayISO(weekStart)
  const today = new Date().toISOString().split('T')[0]

  // ── Scope members ──────────────────────────────────────────────────────────
  let membersQuery = admin
    .from('profiles')
    .select('id, name, available_hours, work_week')
    .neq('status', 'deactivated')

  if (role === 'assistant_manager' || role === 'manager') {
    const teamId = profile.team_id
    if (!teamId) redirect('/dashboard')
    membersQuery = membersQuery.eq('team_id', teamId)
  } else if (role === 'senior_manager') {
    const { data: teams } = await admin.from('teams').select('id').eq('manager_id', user.id)
    const teamIds = (teams ?? []).map((t: { id: string }) => t.id)
    if (profile.team_id) teamIds.push(profile.team_id)
    if (teamIds.length > 0) membersQuery = membersQuery.in('team_id', teamIds)
  }

  const { data: members } = await membersQuery
  const memberIds = (members ?? []).map((m: { id: string }) => m.id)

  // ── Plans + entries ─────────────────────────────────────────────────────────
  const { data: plans } = memberIds.length > 0
    ? await admin.from('weekly_plans').select('id, user_id, submission_status')
        .in('user_id', memberIds).eq('week_start_date', weekStart)
    : { data: [] }

  const planByUser = Object.fromEntries(
    (plans ?? []).map((p: { id: string; user_id: string; submission_status: string }) => [p.user_id, p])
  )
  const planIds = (plans ?? []).map((p: { id: string }) => p.id)

  const { data: entries } = planIds.length > 0
    ? await admin.from('plan_entries').select('plan_id, day_of_week, planned_hours').in('plan_id', planIds)
    : { data: [] }

  const entriesByPlan: Record<string, { day_of_week: number; planned_hours: number }[]> = {}
  for (const e of entries ?? []) {
    if (!entriesByPlan[e.plan_id]) entriesByPlan[e.plan_id] = []
    entriesByPlan[e.plan_id].push(e)
  }

  // ── Done tasks this week ────────────────────────────────────────────────────
  const { data: doneTasks } = memberIds.length > 0
    ? await admin.from('tasks').select('assignee_id')
        .in('assignee_id', memberIds).eq('status', 'done')
        .gte('completed_at', weekStart + 'T00:00:00Z').lte('completed_at', weekEnd + 'T23:59:59Z')
    : { data: [] }

  const doneByUser: Record<string, number> = {}
  for (const t of doneTasks ?? []) {
    doneByUser[t.assignee_id] = (doneByUser[t.assignee_id] ?? 0) + 1
  }

  // ── Overdue tasks ───────────────────────────────────────────────────────────
  const { data: overdueRaw } = memberIds.length > 0
    ? await admin.from('tasks')
        .select('id, title, due_date, assignee_id, assignee:profiles!tasks_assignee_id_fkey(name)')
        .in('assignee_id', memberIds).lt('due_date', today).neq('status', 'done')
        .order('due_date', { ascending: true }).limit(20)
    : { data: [] }

  const todayMs = Date.now()
  const overdueFormatted = (overdueRaw ?? []).map((t: {
    id: string; title: string; due_date: string; assignee_id: string;
    assignee: { name: string } | { name: string }[] | null
  }) => {
    const a = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee
    return {
      id: t.id, title: t.title, due_date: t.due_date, assignee_id: t.assignee_id,
      assignee_name: (a as { name: string } | null)?.name ?? '',
      days_overdue: Math.ceil((todayMs - new Date(t.due_date).getTime()) / 86400000),
    }
  })

  // ── Build member rows ───────────────────────────────────────────────────────
  const currentDow = new Date().getDay()
  const memberRows = (members as {
    id: string; name: string; available_hours: number; work_week: number[]
  }[] ?? []).map(m => {
    const plan = planByUser[m.id]
    const planEntries = plan ? (entriesByPlan[plan.id] ?? []) : []

    const dayHours: Record<number, number> = {}
    for (const e of planEntries) {
      dayHours[e.day_of_week] = (dayHours[e.day_of_week] ?? 0) + e.planned_hours
    }

    const workWeek: number[] = m.work_week ?? []
    const unplannedDays = workWeek.filter(dow => dow >= currentDow && (dayHours[dow] ?? 0) === 0)
    const doneCt = doneByUser[m.id] ?? 0
    const committed = planEntries.length

    return {
      user: { id: m.id, name: m.name, available_hours: m.available_hours, work_week: workWeek },
      submission_status: (plan?.submission_status ?? null) as TeamPulseData['members'][0]['submission_status'],
      day_hours: dayHours,
      completion_rate: committed > 0 ? Math.round((doneCt / committed) * 100) : 0,
      completed_tasks: doneCt,
      total_tasks: committed,
      unplanned_days: unplannedDays,
    }
  })

  const unplannedMembers = memberRows
    .filter(r => r.unplanned_days.length > 0)
    .map(r => ({ id: r.user.id, name: r.user.name }))

  const data: TeamPulseData = {
    week_start: weekStart,
    members: memberRows,
    overdue_tasks: overdueFormatted,
    unplanned_members: unplannedMembers,
  }

  // working days union
  const workingDaysSet = new Set<number>()
  memberRows.forEach(r => r.user.work_week.forEach(d => workingDaysSet.add(d)))
  const workingDays = Array.from(workingDaysSet).sort()

  return (
    <TeamPulseClient
      data={data}
      weekStart={weekStart}
      workingDays={workingDays}
    />
  )
}
