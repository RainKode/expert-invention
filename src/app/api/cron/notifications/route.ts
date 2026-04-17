// GET /api/cron/notifications — runs scheduled notification checks
// Intended to be called by a cron job (Vercel Cron, pg_cron, or external scheduler)
// Generates: task_due_today, task_overdue, plan_not_submitted, checkin_not_submitted, zero_tasks_planned

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

// Simple auth via a secret header to prevent public triggering
function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET
  if (!expected) return false // Fail closed — CRON_SECRET must be set in production
  return secret === expected
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const results: Record<string, number> = {}

  // ── 1. task_due_today ─────────────────────────────────────────────────────
  const { data: dueTodayTasks } = await admin
    .from('tasks')
    .select('id, title, assignee_id')
    .eq('due_date', today)
    .neq('status', 'done')
    .neq('status', 'archived')

  let dueTodayCount = 0
  for (const task of dueTodayTasks ?? []) {
    if (!task.assignee_id) continue
    await createNotification({
      recipientId: task.assignee_id,
      type: 'task_due_today',
      title: 'Task Due Today',
      message: `"${task.title}" is due today`,
      link: `/tasks/${task.id}`,
      metadata: { task_id: task.id },
    })
    dueTodayCount++
  }
  results.task_due_today = dueTodayCount

  // ── 2. task_overdue ───────────────────────────────────────────────────────
  const { data: overdueTasks } = await admin
    .from('tasks')
    .select('id, title, assignee_id, creator_id')
    .lt('due_date', today)
    .neq('status', 'done')
    .neq('status', 'archived')

  let overdueCount = 0
  for (const task of overdueTasks ?? []) {
    if (!task.assignee_id) continue

    // Notify assignee
    await createNotification({
      recipientId: task.assignee_id,
      type: 'task_overdue',
      title: 'Task Overdue',
      message: `"${task.title}" is past its due date`,
      link: `/tasks/${task.id}`,
      metadata: { task_id: task.id },
    })

    // Notify manager of the assignee
    const { data: assigneeProfile } = await admin
      .from('profiles')
      .select('manager_id')
      .eq('id', task.assignee_id)
      .single()

    if (assigneeProfile?.manager_id && assigneeProfile.manager_id !== task.assignee_id) {
      await createNotification({
        recipientId: assigneeProfile.manager_id,
        type: 'task_overdue',
        title: 'Team Member Task Overdue',
        message: `"${task.title}" assigned to a team member is past its due date`,
        link: `/tasks/${task.id}`,
        metadata: { task_id: task.id, assignee_id: task.assignee_id },
      })
    }
    overdueCount++
  }
  results.task_overdue = overdueCount

  // ── 3. plan_not_submitted ─────────────────────────────────────────────────
  // Check for the current week – find users who should have a plan but haven't submitted
  const dayOfWeek = new Date().getDay()
  // Get all teams with locked planning mode and submission deadline today
  const { data: teams } = await admin
    .from('teams')
    .select('id, submission_deadline_day, manager_id')
    .eq('planning_mode', 'locked')
    .eq('submission_deadline_day', dayOfWeek)

  let planNotSubmittedCount = 0
  for (const team of teams ?? []) {
    // Find team members
    const { data: members } = await admin
      .from('profiles')
      .select('id, name, manager_id')
      .eq('team_id', team.id)
      .eq('status', 'active')

    for (const member of members ?? []) {
      // Check if they have a submitted plan for this week
      // Calculate the Monday of current week
      const now = new Date()
      const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset)
      const weekStart = monday.toISOString().split('T')[0]

      const { data: plan } = await admin
        .from('weekly_plans')
        .select('id, submission_status')
        .eq('user_id', member.id)
        .eq('week_start_date', weekStart)
        .single()

      if (!plan || plan.submission_status !== 'submitted') {
        // Notify the employee
        await createNotification({
          recipientId: member.id,
          type: 'plan_not_submitted',
          title: 'Weekly Plan Not Submitted',
          message: 'Your weekly plan has not been submitted by the deadline',
          link: '/plan',
          metadata: { week_start: weekStart },
        })

        // Notify their manager
        const managerId = member.manager_id ?? team.manager_id
        if (managerId) {
          await createNotification({
            recipientId: managerId,
            type: 'plan_not_submitted',
            title: 'Team Member Plan Missing',
            message: `${member.name}'s weekly plan has not been submitted`,
            link: '/team/plans',
            metadata: { employee_id: member.id, week_start: weekStart },
          })
        }
        planNotSubmittedCount++
      }
    }
  }
  results.plan_not_submitted = planNotSubmittedCount

  // ── 4. checkin_not_submitted ──────────────────────────────────────────────
  // Find teams with mandatory check-in where members haven't checked in today
  const { data: mandatoryCheckinTeams } = await admin
    .from('teams')
    .select('id')
    .eq('check_in_mandatory', true)

  let checkinMissedCount = 0
  for (const team of mandatoryCheckinTeams ?? []) {
    const { data: members } = await admin
      .from('profiles')
      .select('id, work_week')
      .eq('team_id', team.id)
      .eq('status', 'active')

    for (const member of members ?? []) {
      // Skip if today is not a working day for the member
      const workWeek = (member.work_week as number[]) ?? [1, 2, 3, 4, 5]
      if (!workWeek.includes(dayOfWeek)) continue

      // Check if check-in exists for today
      const { data: checkin } = await admin
        .from('daily_checkins')
        .select('id')
        .eq('user_id', member.id)
        .eq('date', today)
        .single()

      if (!checkin) {
        await createNotification({
          recipientId: member.id,
          type: 'checkin_not_submitted',
          title: 'Daily Check-in Missing',
          message: 'You haven\'t submitted your daily check-in yet',
          link: '/checkin',
          metadata: { date: today },
        })
        checkinMissedCount++
      }
    }
  }
  results.checkin_not_submitted = checkinMissedCount

  // ── 5. zero_tasks_planned ─────────────────────────────────────────────────
  // Find employees with submitted plans that have zero entries
  const now = new Date()
  const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  const weekStart = monday.toISOString().split('T')[0]

  const { data: allPlans } = await admin
    .from('weekly_plans')
    .select('id, user_id')
    .eq('week_start_date', weekStart)
    .eq('submission_status', 'submitted')

  let zeroPlannedCount = 0
  for (const plan of allPlans ?? []) {
    const { count } = await admin
      .from('plan_entries')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', plan.id)

    if ((count ?? 0) === 0) {
      // Find the employee's manager
      const { data: profile } = await admin
        .from('profiles')
        .select('name, manager_id, team_id')
        .eq('id', plan.user_id)
        .single()

      if (profile?.manager_id) {
        await createNotification({
          recipientId: profile.manager_id,
          type: 'zero_tasks_planned',
          title: 'Employee Has No Tasks Planned',
          message: `${profile.name} submitted a weekly plan with zero tasks`,
          link: '/team/plans',
          metadata: { employee_id: plan.user_id, week_start: weekStart },
        })
        zeroPlannedCount++
      }
    }
  }
  results.zero_tasks_planned = zeroPlannedCount

  // ── 6. task_carryover ─────────────────────────────────────────────────────
  // Find plan entries marked as carry-overs that haven't been notified yet
  // (entries with is_carryover=true created today via the planning page or background job)
  const { data: carryoverEntries } = await admin
    .from('plan_entries')
    .select(`
      id, task_id, is_carryover, original_date,
      plan:weekly_plans!inner(user_id)
    `)
    .eq('is_carryover', true)

  let carryoverCount = 0
  for (const entry of carryoverEntries ?? []) {
    const userId = (entry.plan as unknown as { user_id: string })?.user_id
    if (!userId || !entry.task_id) continue

    // Check if we already notified for this task carry-over today
    const { count: existingCount } = await admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('type', 'task_carryover')
      .gte('created_at', today)
      .contains('metadata', { task_id: entry.task_id })

    if ((existingCount ?? 0) > 0) continue

    // Get task title
    const { data: task } = await admin
      .from('tasks')
      .select('title')
      .eq('id', entry.task_id)
      .single()

    await createNotification({
      recipientId: userId,
      type: 'task_carryover',
      title: 'Task Carried Over',
      message: `"${task?.title ?? 'Untitled task'}" was carried over from ${entry.original_date ?? 'a previous day'}`,
      link: '/plan',
      metadata: { task_id: entry.task_id, original_date: entry.original_date },
    })
    carryoverCount++
  }
  results.task_carryover = carryoverCount

  return NextResponse.json({ success: true, results, date: today })
}
