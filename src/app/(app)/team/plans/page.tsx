import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import TeamPlansClient from './TeamPlansClient'
import type { Role } from '@/types'

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function TeamPlansPage({
  searchParams,
}: {
  searchParams: { week?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role as Role | undefined
  if (!role || !can(role, 'view_team_tasks')) {
    redirect('/plan')
  }

  const weekStart = searchParams.week
    ? new Date(searchParams.week)
    : getMondayOfWeek(new Date())
  const weekStartISO = weekStart.toISOString().split('T')[0]

  // Fetch team members
  let membersQuery = admin
    .from('profiles')
    .select('id, name, available_hours, work_week, team_id')
    .eq('status', 'active')
    .neq('id', user.id) // exclude the manager themselves

  if (role === 'manager' || role === 'assistant_manager') {
    const teamId = profile?.team_id
    if (!teamId) return redirect('/plan')
    membersQuery = membersQuery.eq('team_id', teamId)
  }

  const { data: members } = await membersQuery
  const memberList = members ?? []
  const memberIds = memberList.map((m) => m.id)

  let plans: Record<string, unknown>[] = []
  let entries: { plan_id: string; day_of_week: number; planned_hours: number }[] = []

  if (memberIds.length > 0) {
    const { data: plansData } = await admin
      .from('weekly_plans')
      .select('*')
      .in('user_id', memberIds)
      .eq('week_start_date', weekStartISO)

    plans = plansData ?? []
    const planIds = plans.map((p) => (p as { id: string }).id)

    if (planIds.length > 0) {
      const { data: entriesData } = await admin
        .from('plan_entries')
        .select('plan_id, day_of_week, planned_hours')
        .in('plan_id', planIds)
      entries = entriesData ?? []
    }
  }

  // Build member summaries
  const memberSummaries = memberList.map((member) => {
    const plan = plans.find((p) => (p as { user_id: string }).user_id === member.id) ?? null
    const memberEntries = plan
      ? entries.filter((e) => e.plan_id === (plan as { id: string }).id)
      : []

    const day_hours: Record<number, number> = {}
    for (const entry of memberEntries) {
      day_hours[entry.day_of_week] = (day_hours[entry.day_of_week] ?? 0) + Number(entry.planned_hours)
    }

    const workWeek: number[] = Array.isArray(member.work_week) ? member.work_week : [1, 2, 3, 4, 5]
    const unplanned_days = workWeek.filter((d) => (day_hours[d] ?? 0) === 0)

    return {
      user: {
        id: member.id,
        name: member.name,
        available_hours: member.available_hours ?? 8,
        work_week: workWeek,
      },
      plan: plan as { id: string; submission_status: string; locked: boolean } | null,
      day_hours,
      submission_status: (plan as { submission_status?: string } | null)?.submission_status ?? 'draft',
      unplanned_days,
    }
  })

  return (
    <TeamPlansClient
      members={memberSummaries}
      weekStartISO={weekStartISO}
      teamName="My Team"
    />
  )
}
