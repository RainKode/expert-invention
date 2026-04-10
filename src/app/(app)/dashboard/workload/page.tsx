// src/app/(app)/dashboard/workload/page.tsx
// Workload View — planned vs actual hours per member per day
// Server component: loads WorkloadData and passes to WorkloadClient

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import WorkloadClient from './WorkloadClient'
import type { Role, WorkloadData } from '@/types'

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

export default async function WorkloadPage({
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
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile || !can(profile.role as Role, 'view_team_tasks')) {
    redirect('/dashboard')
  }

  const role = profile.role as Role
  const weekStart = params.week ?? getMondayISO()
  const weekEnd = getSundayISO(weekStart)

  // ── Scope members ───────────────────────────────────────────────────────────
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

  // ── Planned hours (from plan_entries) ──────────────────────────────────────
  const { data: plans } = memberIds.length > 0
    ? await admin.from('weekly_plans').select('id, user_id')
        .in('user_id', memberIds).eq('week_start_date', weekStart)
    : { data: [] }

  const planByUser = Object.fromEntries(
    (plans ?? []).map((p: { id: string; user_id: string }) => [p.user_id, p.id])
  )
  const planIds = (plans ?? []).map((p: { id: string }) => p.id)

  const { data: entries } = planIds.length > 0
    ? await admin.from('plan_entries')
        .select('plan_id, day_of_week, planned_hours')
        .in('plan_id', planIds)
    : { data: [] }

  // planned hours per user per dow
  const plannedMap: Record<string, Record<number, number>> = {}
  for (const e of entries ?? []) {
    const userId = Object.entries(planByUser).find(([, pid]) => pid === e.plan_id)?.[0]
    if (!userId) continue
    if (!plannedMap[userId]) plannedMap[userId] = {}
    plannedMap[userId][e.day_of_week] = (plannedMap[userId][e.day_of_week] ?? 0) + e.planned_hours
  }

  // ── Actual hours (from eod_wrapups.actual_tasks_json) ──────────────────────
  const { data: wrapups } = memberIds.length > 0
    ? await admin.from('eod_wrapups')
        .select('user_id, wrapup_date, actual_tasks_json')
        .in('user_id', memberIds)
        .gte('wrapup_date', weekStart).lte('wrapup_date', weekEnd)
    : { data: [] }

  // actual hours per user per dow
  const actualMap: Record<string, Record<number, number>> = {}
  for (const w of wrapups ?? []) {
    const dow = new Date(w.wrapup_date).getDay()
    const tasks = Array.isArray(w.actual_tasks_json) ? w.actual_tasks_json : []
    const totalActual = tasks.reduce((sum: number, t: { actual_hours?: number }) => sum + (t.actual_hours ?? 0), 0)
    if (!actualMap[w.user_id]) actualMap[w.user_id] = {}
    actualMap[w.user_id][dow] = (actualMap[w.user_id][dow] ?? 0) + totalActual
  }

  // ── Build WorkloadData ─────────────────────────────────────────────────────
  const workingDaysSet = new Set<number>()
  const memberRows = (members as {
    id: string; name: string; available_hours: number; work_week: number[]
  }[] ?? []).map(m => {
    const workWeek: number[] = m.work_week ?? []
    workWeek.forEach(d => workingDaysSet.add(d))

    const planned = plannedMap[m.id] ?? {}
    const actual = actualMap[m.id] ?? {}

    const days: Record<number, { planned_hours: number; actual_hours: number; utilisation_pct: number }> = {}
    for (const dow of workWeek) {
      const p = planned[dow] ?? 0
      const a = actual[dow] ?? 0
      days[dow] = {
        planned_hours: p,
        actual_hours: a,
        utilisation_pct: p > 0 ? Math.round((a / p) * 100) : 0,
      }
    }

    const totalPlanned = Object.values(planned).reduce((s, h) => s + h, 0)
    const totalActual = Object.values(actual).reduce((s, h) => s + h, 0)

    return {
      user: { id: m.id, name: m.name, available_hours: m.available_hours, work_week: workWeek },
      days,
      weekly_variance_hours: Math.round((totalActual - totalPlanned) * 10) / 10,
    }
  })

  const workingDays = [1, 2, 3, 4, 5].filter(d => workingDaysSet.has(d))

  const data: WorkloadData = {
    week_start: weekStart,
    members: memberRows,
    working_days: workingDays,
  }

  return <WorkloadClient data={data} weekStart={weekStart} workingDays={workingDays} />
}
