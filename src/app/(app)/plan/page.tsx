import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import WeeklyPlanClient from './WeeklyPlanClient'

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default async function PlanPage({
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
    .select('role, team_id, available_hours, work_week')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Determine week
  const requestedWeek = searchParams.week
  const weekStart = requestedWeek
    ? new Date(requestedWeek)
    : getMondayOfWeek(new Date())
  const weekStartISO = toISODate(weekStart)

  // Fetch or create plan
  let { data: plan } = await admin
    .from('weekly_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStartISO)
    .single()

  if (!plan) {
    const { data: newPlan } = await admin
      .from('weekly_plans')
      .insert({ user_id: user.id, week_start_date: weekStartISO, submission_status: 'draft' })
      .select()
      .single()
    plan = newPlan
  }

  // Fetch entries + comments in parallel
  const [{ data: entries }, { data: comments }, { data: unplannedTasks }, { data: team }] =
    await Promise.all([
      plan
        ? admin
            .from('plan_entries')
            .select('*, task:tasks(id, title, priority, status, estimated_hours, project:projects(name))')
            .eq('plan_id', plan.id)
            .order('day_of_week')
        : Promise.resolve({ data: [] }),
      plan
        ? admin
            .from('plan_comments')
            .select('*, author:profiles(id, name, role)')
            .eq('plan_id', plan.id)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] }),
      // Tasks assigned to current user not yet in this plan
      admin
        .from('tasks')
        .select('id, title, priority, status, estimated_hours, project:projects(name)')
        .eq('assignee_id', user.id)
        .not('status', 'in', '("done")')
        .order('priority', { ascending: false })
        .limit(50),
      profile.team_id
        ? admin.from('teams').select('planning_mode, submission_deadline_day, submission_deadline_time').eq('id', profile.team_id).single()
        : Promise.resolve({ data: null }),
    ])

  // Filter out tasks already in plan
  const plannedTaskIds = new Set((entries ?? []).map((e) => e.task_id))
  const poolTasks = (unplannedTasks ?? []).filter((t) => !plannedTaskIds.has(t.id)).map((t) => ({
    ...t,
    project: Array.isArray(t.project) ? (t.project[0] ?? null) : t.project,
  }))

  return (
    <WeeklyPlanClient
      userId={user.id}
      userRole={profile.role}
      planId={plan?.id ?? null}
      weekStartISO={weekStartISO}
      plan={plan}
      entries={entries ?? []}
      comments={comments ?? []}
      poolTasks={poolTasks}
      availableHours={profile.available_hours ?? 8}
      workWeek={(profile.work_week as number[]) ?? [1, 2, 3, 4, 5]}
      planningMode={team?.planning_mode ?? 'fluid'}
    />
  )
}
