// GET /api/team/plans?week_start=YYYY-MM-DD
// Manager view: all team members' plans for a given week with daily hour sums

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import type { Role } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role as Role | undefined
  if (!role || !can(role, 'view_team_tasks')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')
  if (!weekStart) {
    return NextResponse.json({ error: 'week_start query param required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch team members visible to this manager
  const teamId = profile?.team_id
  let membersQuery = admin
    .from('profiles')
    .select('id, name, available_hours, work_week, team_id')
    .eq('status', 'active')

  if (role === 'manager' || role === 'assistant_manager') {
    if (!teamId) return NextResponse.json({ members: [] })
    membersQuery = membersQuery.eq('team_id', teamId)
  } else if (role === 'senior_manager') {
    // Get all teams in their department
    const { data: teams } = await admin
      .from('teams')
      .select('id, department_id')
      .eq('manager_id', user.id)

    const teamIds = (teams ?? []).map((t) => t.id)
    if (teamIds.length > 0) {
      membersQuery = membersQuery.in('team_id', teamIds)
    }
  }
  // admin sees all (no extra filter)

  const { data: members, error: membersError } = await membersQuery
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })

  const memberIds = (members ?? []).map((m) => m.id)
  if (memberIds.length === 0) return NextResponse.json({ members: [] })

  // Fetch plans for all members for this week
  const { data: plans } = await admin
    .from('weekly_plans')
    .select('*')
    .in('user_id', memberIds)
    .eq('week_start_date', weekStart)

  // Fetch all entries for those plans
  const planIds = (plans ?? []).map((p) => p.id)
  let entries: {plan_id: string; day_of_week: number; planned_hours: number}[] = []
  if (planIds.length > 0) {
    const { data: entriesData } = await admin
      .from('plan_entries')
      .select('plan_id, day_of_week, planned_hours')
      .in('plan_id', planIds)
    entries = entriesData ?? []
  }

  // Build per-member summary
  const result = (members ?? []).map((member) => {
    const plan = (plans ?? []).find((p) => p.user_id === member.id) ?? null
    const memberEntries = plan
      ? entries.filter((e) => e.plan_id === plan.id)
      : []

    // day_hours: sum planned_hours per day_of_week
    const day_hours: Record<number, number> = {}
    for (const entry of memberEntries) {
      day_hours[entry.day_of_week] = (day_hours[entry.day_of_week] ?? 0) + entry.planned_hours
    }

    // Detect unplanned working days (work_week array days with 0 planned hours)
    const workWeek: number[] = Array.isArray(member.work_week) ? member.work_week : [1, 2, 3, 4, 5]
    const unplanned_days = workWeek.filter((d) => (day_hours[d] ?? 0) === 0)

    return {
      user: {
        id: member.id,
        name: member.name,
        available_hours: member.available_hours ?? 8,
        work_week: workWeek,
      },
      plan,
      day_hours,
      submission_status: plan?.submission_status ?? 'draft',
      unplanned_days,
    }
  })

  return NextResponse.json({ members: result, week_start: weekStart })
}
