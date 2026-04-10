// GET /api/dashboard/team-pulse?week_start=YYYY-MM-DD
// Returns team capacity grid, unplanned warnings, overdue tasks, completion rates
// Access: assistant_manager and above

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
  const today = new Date().toISOString().split('T')[0]

  // ── Scope team members by role ───────────────────────────────────────────
  let membersQuery = admin
    .from('profiles')
    .select('id, name, available_hours, work_week, team_id')
    .neq('status', 'deactivated')

  if (role === 'assistant_manager' || role === 'manager') {
    if (!profile.team_id) return NextResponse.json({ error: 'No team assigned' }, { status: 400 })
    membersQuery = membersQuery.eq('team_id', profile.team_id)
  } else if (role === 'senior_manager') {
    // fetch teams in their department
    const { data: dept } = await admin
      .from('teams')
      .select('id')
      .eq('manager_id', user.id)
    const teamIds = (dept ?? []).map((t: { id: string }) => t.id)
    if (profile.team_id) teamIds.push(profile.team_id)
    membersQuery = membersQuery.in('team_id', teamIds)
  }
  // admin: no filter — all members

  const { data: members } = await membersQuery

  if (!members || members.length === 0) {
    return NextResponse.json({
      week_start: weekStart,
      members: [],
      overdue_tasks: [],
      unplanned_members: [],
    })
  }

  const memberIds = members.map((m: { id: string }) => m.id)

  // ── Fetch weekly plans for all members ───────────────────────────────────
  const { data: plans } = await admin
    .from('weekly_plans')
    .select('id, user_id, submission_status')
    .in('user_id', memberIds)
    .eq('week_start_date', weekStart)

  const planByUser = Object.fromEntries(
    (plans ?? []).map((p: { id: string; user_id: string; submission_status: string }) => [p.user_id, p])
  )

  // ── Fetch plan entries for all found plans ────────────────────────────────
  const planIds = (plans ?? []).map((p: { id: string }) => p.id)
  let entriesByPlan: Record<string, { day_of_week: number; planned_hours: number }[]> = {}
  if (planIds.length > 0) {
    const { data: entries } = await admin
      .from('plan_entries')
      .select('plan_id, day_of_week, planned_hours')
      .in('plan_id', planIds)

    for (const e of entries ?? []) {
      if (!entriesByPlan[e.plan_id]) entriesByPlan[e.plan_id] = []
      entriesByPlan[e.plan_id].push(e)
    }
  }

  // ── Fetch done tasks this week (for completion rate) ─────────────────────
  const { data: doneTasksRaw } = await admin
    .from('tasks')
    .select('assignee_id')
    .in('assignee_id', memberIds)
    .eq('status', 'done')
    .gte('completed_at', weekStart + 'T00:00:00Z')
    .lte('completed_at', weekEnd + 'T23:59:59Z')

  const doneCountByUser: Record<string, number> = {}
  for (const t of doneTasksRaw ?? []) {
    doneCountByUser[t.assignee_id] = (doneCountByUser[t.assignee_id] ?? 0) + 1
  }

  // ── Fetch total tasks assigned this week (in plan) ────────────────────────
  // Use plan entries count as "committed"
  const committedByUser: Record<string, number> = {}
  for (const plan of plans ?? []) {
    committedByUser[plan.user_id] = entriesByPlan[plan.id]?.length ?? 0
  }

  // ── Overdue tasks across the team ─────────────────────────────────────────
  const { data: overdueRaw } = await admin
    .from('tasks')
    .select('id, title, due_date, assignee_id, assignee:profiles!tasks_assignee_id_fkey(name)')
    .in('assignee_id', memberIds)
    .lt('due_date', today)
    .neq('status', 'done')
    .order('due_date', { ascending: true })
    .limit(20)

  const todayMs = new Date(today).getTime()
  const overdueFormatted = (overdueRaw ?? []).map((t: {
    id: string; title: string; due_date: string; assignee_id: string;
    assignee: { name: string } | { name: string }[] | null
  }) => {
    const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee
    return {
      id: t.id,
      title: t.title,
      assignee_id: t.assignee_id,
      assignee_name: (assignee as { name: string } | null)?.name ?? '',
      due_date: t.due_date,
      days_overdue: Math.ceil((todayMs - new Date(t.due_date).getTime()) / 86400000),
    }
  })

  // ── Build member rows ─────────────────────────────────────────────────────
  const memberRows = (members as {
    id: string; name: string; available_hours: number; work_week: number[]
  }[]).map(m => {
    const plan = planByUser[m.id]
    const entries = plan ? (entriesByPlan[plan.id] ?? []) : []

    // Sum planned hours per day
    const dayHours: Record<number, number> = {}
    for (const e of entries) {
      dayHours[e.day_of_week] = (dayHours[e.day_of_week] ?? 0) + e.planned_hours
    }

    // Unplanned working days = work_week days with 0 planned hours *in the current/future part of the week*
    const currentDow = new Date().getDay()
    const unplannedDays = (m.work_week ?? []).filter((dow: number) => {
      // only flag days that are today or in the future within this week's range
      if (dow < currentDow) return false
      return (dayHours[dow] ?? 0) === 0
    })

    const doneCt = doneCountByUser[m.id] ?? 0
    const committed = committedByUser[m.id] ?? 0

    return {
      user: { id: m.id, name: m.name, available_hours: m.available_hours, work_week: m.work_week ?? [] },
      submission_status: (plan?.submission_status ?? null) as string | null,
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

  return NextResponse.json({
    week_start: weekStart,
    members: memberRows,
    overdue_tasks: overdueFormatted,
    unplanned_members: unplannedMembers,
  })
}
