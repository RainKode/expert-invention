// GET /api/dashboard/workload?week_start=YYYY-MM-DD
// Returns planned vs actual hours per team member per day
// Access: manager and above

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import type { Role } from '@/types'

function getMondayISO(date?: string): string {
  const d = date ? new Date(date) : new Date()
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getSundayISO(mondayISO: string): string {
  const d = new Date(mondayISO)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
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
  if (!can(role, 'view_team_tasks')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start') ?? getMondayISO()
  const weekEnd = getSundayISO(weekStart)

  // ── Scope members ─────────────────────────────────────────────────────────
  let membersQuery = admin
    .from('profiles')
    .select('id, name, available_hours, work_week')
    .neq('status', 'deactivated')

  if (role === 'assistant_manager' || role === 'manager') {
    if (!profile.team_id) return NextResponse.json({ error: 'No team' }, { status: 400 })
    membersQuery = membersQuery.eq('team_id', profile.team_id)
  } else if (role === 'senior_manager') {
    const { data: teams } = await admin
      .from('teams')
      .select('id')
      .eq('manager_id', user.id)
    const teamIds = (teams ?? []).map((t: { id: string }) => t.id)
    if (profile.team_id) teamIds.push(profile.team_id)
    membersQuery = membersQuery.in('team_id', teamIds)
  }

  const { data: members } = await membersQuery
  if (!members?.length) {
    return NextResponse.json({ week_start: weekStart, members: [], working_days: [] })
  }

  const memberIds = members.map((m: { id: string }) => m.id)

  // ── Planned hours from plan entries ───────────────────────────────────────
  const { data: plans } = await admin
    .from('weekly_plans')
    .select('id, user_id')
    .in('user_id', memberIds)
    .eq('week_start_date', weekStart)

  const planByUser = Object.fromEntries(
    (plans ?? []).map((p: { id: string; user_id: string }) => [p.user_id, p.id])
  )

  const planIds = (plans ?? []).map((p: { id: string }) => p.id)
  const plannedByUserDay: Record<string, Record<number, number>> = {}

  if (planIds.length > 0) {
    const { data: entries } = await admin
      .from('plan_entries')
      .select('plan_id, day_of_week, planned_hours')
      .in('plan_id', planIds)

    for (const plan of plans ?? []) {
      for (const e of entries ?? []) {
        if (e.plan_id !== plan.id) continue
        if (!plannedByUserDay[plan.user_id]) plannedByUserDay[plan.user_id] = {}
        plannedByUserDay[plan.user_id][e.day_of_week] =
          (plannedByUserDay[plan.user_id][e.day_of_week] ?? 0) + e.planned_hours
      }
    }
  }

  // ── Actual hours: sum eod_wrapup actual_tasks_json per user per day ───────
  const { data: wrapups } = await admin
    .from('eod_wrapups')
    .select('user_id, date, actual_tasks_json')
    .in('user_id', memberIds)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  // Convert date → day_of_week
  const actualByUserDay: Record<string, Record<number, number>> = {}
  for (const wu of wrapups ?? []) {
    const dow = new Date(wu.date).getDay()
    const tasks: { actual_hours: number }[] = wu.actual_tasks_json ?? []
    const totalActual = tasks.reduce((sum, t) => sum + (t.actual_hours ?? 0), 0)
    if (!actualByUserDay[wu.user_id]) actualByUserDay[wu.user_id] = {}
    actualByUserDay[wu.user_id][dow] = (actualByUserDay[wu.user_id][dow] ?? 0) + totalActual
  }

  // ── Build rows ────────────────────────────────────────────────────────────
  const allWorkingDays = new Set<number>()

  const memberRows = (members as {
    id: string; name: string; available_hours: number; work_week: number[]
  }[]).map(m => {
    const workWeek: number[] = m.work_week ?? []
    workWeek.forEach(d => allWorkingDays.add(d))

    const days: Record<number, { planned_hours: number; actual_hours: number; utilisation_pct: number }> = {}
    let weeklyVariance = 0

    for (const dow of workWeek) {
      const planned = plannedByUserDay[m.id]?.[dow] ?? 0
      const actual = actualByUserDay[m.id]?.[dow] ?? 0
      const utilPct = planned > 0 ? Math.round((actual / planned) * 100) : 0
      days[dow] = { planned_hours: planned, actual_hours: actual, utilisation_pct: utilPct }
      weeklyVariance += actual - planned
    }

    return {
      user: { id: m.id, name: m.name, available_hours: m.available_hours, work_week: workWeek },
      days,
      weekly_variance_hours: Math.round(weeklyVariance * 10) / 10,
    }
  })

  return NextResponse.json({
    week_start: weekStart,
    members: memberRows,
    working_days: Array.from(allWorkingDays).sort(),
  })
}
