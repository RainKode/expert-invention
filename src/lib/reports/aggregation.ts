import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/types'
import { getScope } from '@/lib/permissions'

// ─── Helper ─────────────────────────────────────────────────────────────────

function getMondayISO(date?: string): string {
  const d = date ? new Date(date) : new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getSundayISO(mondayISO: string): string {
  const d = new Date(mondayISO)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

// ─── Scoped Members Query ───────────────────────────────────────────────────

async function getScopedMemberIds(
  userId: string,
  role: Role,
  teamId: string | null,
  filterTeamId?: string,
  filterEmployeeId?: string,
): Promise<string[]> {
  const admin = createAdminClient()
  const scope = getScope(role)

  // If filtering by employee, just return that one
  if (filterEmployeeId) return [filterEmployeeId]

  let query = admin
    .from('profiles')
    .select('id, team_id')
    .eq('status', 'active')

  if (filterTeamId) {
    query = query.eq('team_id', filterTeamId)
  } else if (scope === 'team' || scope === 'sub_team') {
    if (!teamId) return []
    query = query.eq('team_id', teamId)
  } else if (scope === 'department') {
    const { data: teams } = await admin
      .from('teams')
      .select('id')
      .eq('manager_id', userId)
    const teamIds = (teams ?? []).map((t: { id: string }) => t.id)
    if (teamId) teamIds.push(teamId)
    query = query.in('team_id', teamIds)
  }
  // admin (scope === 'all'): no filter

  const { data: members } = await query
  return (members ?? []).map((m: { id: string }) => m.id)
}

// ─── Report Types ───────────────────────────────────────────────────────────

export interface WeeklyTeamReportRow {
  employee_name: string
  tasks_committed: number
  tasks_completed: number
  completion_rate: number
  planned_hours: number
  actual_hours: number
  hours_variance: number
  overdue_count: number
}

export interface WeeklyTeamReport {
  team_name: string
  date_from: string
  date_to: string
  generated_at: string
  generated_by: string
  rows: WeeklyTeamReportRow[]
  totals: {
    tasks_committed: number
    tasks_completed: number
    completion_rate: number
    planned_hours: number
    actual_hours: number
    overdue_count: number
  }
}

export interface IndividualEmployeeReportRow {
  task_title: string
  project_name: string
  status: string
  priority: string
  estimated_hours: number | null
  actual_hours: number | null
  due_date: string | null
  completed_at: string | null
  on_time: boolean | null
}

export interface IndividualEmployeeReport {
  employee_name: string
  date_from: string
  date_to: string
  generated_at: string
  generated_by: string
  rows: IndividualEmployeeReportRow[]
  summary: {
    total_tasks: number
    completed: number
    in_progress: number
    overdue: number
    on_time_rate: number
    total_estimated: number
    total_actual: number
  }
}

export interface BillableHoursRow {
  task_title: string
  project_name: string
  assignee_name: string
  estimated_hours: number | null
  actual_hours: number | null
  status: string
}

export interface BillableHoursReport {
  date_from: string
  date_to: string
  generated_at: string
  generated_by: string
  rows: BillableHoursRow[]
  totals: {
    total_tasks: number
    total_estimated: number
    total_actual: number
    completed: number
  }
}

export interface SystemActivityRow {
  timestamp: string
  user_name: string
  event_type: string
  description: string
  target_type: string | null
  target_id: string | null
}

export interface SystemActivityReport {
  date_from: string
  date_to: string
  generated_at: string
  generated_by: string
  rows: SystemActivityRow[]
  total_events: number
}

export interface TaskExportRow {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  task_type: string
  task_nature: string
  billable: boolean
  assignee_name: string
  creator_name: string
  reviewer_name: string | null
  project_name: string | null
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  created_at: string
  completed_at: string | null
  [key: string]: unknown // custom fields
}

// ─── Aggregation Functions ──────────────────────────────────────────────────

export async function generateWeeklyTeamReport(
  userId: string,
  role: Role,
  teamId: string | null,
  generatorName: string,
  dateFrom: string,
  dateTo: string,
  filterTeamId?: string,
): Promise<WeeklyTeamReport> {
  const admin = createAdminClient()
  const memberIds = await getScopedMemberIds(userId, role, teamId, filterTeamId)

  // Get team name
  let teamName = 'All Teams'
  if (filterTeamId) {
    const { data: team } = await admin.from('teams').select('name').eq('id', filterTeamId).single()
    teamName = team?.name ?? 'Unknown Team'
  }

  if (memberIds.length === 0) {
    return {
      team_name: teamName, date_from: dateFrom, date_to: dateTo,
      generated_at: new Date().toISOString(), generated_by: generatorName,
      rows: [],
      totals: { tasks_committed: 0, tasks_completed: 0, completion_rate: 0, planned_hours: 0, actual_hours: 0, overdue_count: 0 },
    }
  }

  // Get member names
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name')
    .in('id', memberIds)
  const nameMap = Object.fromEntries((profiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name]))

  // Tasks in date range
  const { data: tasks } = await admin
    .from('tasks')
    .select('id, assignee_id, status, due_date, estimated_hours, actual_hours, completed_at')
    .in('assignee_id', memberIds)
    .gte('created_at', dateFrom + 'T00:00:00Z')
    .lte('created_at', dateTo + 'T23:59:59Z')
    .neq('status', 'archived')

  // Plan entries for planned hours
  const weekStart = getMondayISO(dateFrom)
  const { data: plans } = await admin
    .from('weekly_plans')
    .select('id, user_id')
    .in('user_id', memberIds)
    .eq('week_start_date', weekStart)

  let plannedByUser: Record<string, number> = {}
  if (plans && plans.length > 0) {
    const planIds = plans.map((p: { id: string }) => p.id)
    const { data: entries } = await admin
      .from('plan_entries')
      .select('plan_id, planned_hours')
      .in('plan_id', planIds)

    const planUserMap = Object.fromEntries(plans.map((p: { id: string; user_id: string }) => [p.id, p.user_id]))
    for (const e of entries ?? []) {
      const uid = planUserMap[e.plan_id]
      if (uid) plannedByUser[uid] = (plannedByUser[uid] ?? 0) + Number(e.planned_hours)
    }
  }

  // Wrapups for actual hours
  const { data: wrapups } = await admin
    .from('eod_wrapups')
    .select('user_id, actual_tasks_json')
    .in('user_id', memberIds)
    .gte('date', dateFrom)
    .lte('date', dateTo)

  const actualByUser: Record<string, number> = {}
  for (const wu of wrapups ?? []) {
    const tasks_arr: { actual_hours: number }[] = wu.actual_tasks_json ?? []
    const total = tasks_arr.reduce((s, t) => s + (t.actual_hours ?? 0), 0)
    actualByUser[wu.user_id] = (actualByUser[wu.user_id] ?? 0) + total
  }

  const today = new Date().toISOString().split('T')[0]

  const rows: WeeklyTeamReportRow[] = memberIds.map(uid => {
    const memberTasks = (tasks ?? []).filter((t: { assignee_id: string }) => t.assignee_id === uid)
    const committed = memberTasks.length
    const completed = memberTasks.filter((t: { status: string }) => t.status === 'done').length
    const overdue = memberTasks.filter((t: { status: string; due_date: string | null }) =>
      t.status !== 'done' && t.due_date && t.due_date < today
    ).length
    const planned = plannedByUser[uid] ?? 0
    const actual = actualByUser[uid] ?? 0

    return {
      employee_name: nameMap[uid] ?? 'Unknown',
      tasks_committed: committed,
      tasks_completed: completed,
      completion_rate: committed > 0 ? Math.round((completed / committed) * 100) : 0,
      planned_hours: Math.round(planned * 10) / 10,
      actual_hours: Math.round(actual * 10) / 10,
      hours_variance: Math.round((actual - planned) * 10) / 10,
      overdue_count: overdue,
    }
  })

  const totals = {
    tasks_committed: rows.reduce((s, r) => s + r.tasks_committed, 0),
    tasks_completed: rows.reduce((s, r) => s + r.tasks_completed, 0),
    completion_rate: 0,
    planned_hours: Math.round(rows.reduce((s, r) => s + r.planned_hours, 0) * 10) / 10,
    actual_hours: Math.round(rows.reduce((s, r) => s + r.actual_hours, 0) * 10) / 10,
    overdue_count: rows.reduce((s, r) => s + r.overdue_count, 0),
  }
  totals.completion_rate = totals.tasks_committed > 0
    ? Math.round((totals.tasks_completed / totals.tasks_committed) * 100) : 0

  return {
    team_name: teamName, date_from: dateFrom, date_to: dateTo,
    generated_at: new Date().toISOString(), generated_by: generatorName,
    rows, totals,
  }
}

export async function generateIndividualReport(
  userId: string,
  role: Role,
  teamId: string | null,
  generatorName: string,
  dateFrom: string,
  dateTo: string,
  employeeId: string,
): Promise<IndividualEmployeeReport> {
  const admin = createAdminClient()

  const { data: employee } = await admin
    .from('profiles')
    .select('name')
    .eq('id', employeeId)
    .single()

  const { data: tasks } = await admin
    .from('tasks')
    .select('*, project:projects(name), assignee:profiles!tasks_assignee_id_fkey(name)')
    .eq('assignee_id', employeeId)
    .gte('created_at', dateFrom + 'T00:00:00Z')
    .lte('created_at', dateTo + 'T23:59:59Z')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  const rows: IndividualEmployeeReportRow[] = (tasks ?? []).map((t: {
    title: string; project: { name: string } | { name: string }[] | null;
    status: string; priority: string;
    estimated_hours: number | null; actual_hours: number | null;
    due_date: string | null; completed_at: string | null;
  }) => {
    const project = Array.isArray(t.project) ? t.project[0] : t.project
    const onTime = t.completed_at && t.due_date
      ? t.completed_at.split('T')[0] <= t.due_date
      : null

    return {
      task_title: t.title,
      project_name: project?.name ?? '—',
      status: t.status,
      priority: t.priority,
      estimated_hours: t.estimated_hours,
      actual_hours: t.actual_hours,
      due_date: t.due_date,
      completed_at: t.completed_at,
      on_time: onTime,
    }
  })

  const completed = rows.filter(r => r.status === 'done').length
  const onTimeCount = rows.filter(r => r.on_time === true).length
  const todayStr = new Date().toISOString().split('T')[0]
  const overdue = rows.filter(r => r.status !== 'done' && r.due_date && r.due_date < todayStr).length

  return {
    employee_name: employee?.name ?? 'Unknown',
    date_from: dateFrom, date_to: dateTo,
    generated_at: new Date().toISOString(), generated_by: generatorName,
    rows,
    summary: {
      total_tasks: rows.length,
      completed,
      in_progress: rows.filter(r => r.status === 'in_progress').length,
      overdue,
      on_time_rate: completed > 0 ? Math.round((onTimeCount / completed) * 100) : 0,
      total_estimated: rows.reduce((s, r) => s + (r.estimated_hours ?? 0), 0),
      total_actual: rows.reduce((s, r) => s + (r.actual_hours ?? 0), 0),
    },
  }
}

export async function generateBillableReport(
  userId: string,
  role: Role,
  teamId: string | null,
  generatorName: string,
  dateFrom: string,
  dateTo: string,
  filterTeamId?: string,
): Promise<BillableHoursReport> {
  const admin = createAdminClient()
  const memberIds = await getScopedMemberIds(userId, role, teamId, filterTeamId)

  if (memberIds.length === 0) {
    return {
      date_from: dateFrom, date_to: dateTo,
      generated_at: new Date().toISOString(), generated_by: generatorName,
      rows: [], totals: { total_tasks: 0, total_estimated: 0, total_actual: 0, completed: 0 },
    }
  }

  const { data: tasks } = await admin
    .from('tasks')
    .select('title, status, estimated_hours, actual_hours, assignee:profiles!tasks_assignee_id_fkey(name), project:projects(name)')
    .in('assignee_id', memberIds)
    .eq('billable', true)
    .gte('created_at', dateFrom + 'T00:00:00Z')
    .lte('created_at', dateTo + 'T23:59:59Z')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  const rows: BillableHoursRow[] = (tasks ?? []).map((t: {
    title: string; status: string;
    estimated_hours: number | null; actual_hours: number | null;
    assignee: { name: string } | { name: string }[] | null;
    project: { name: string } | { name: string }[] | null;
  }) => {
    const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee
    const project = Array.isArray(t.project) ? t.project[0] : t.project
    return {
      task_title: t.title,
      project_name: project?.name ?? '—',
      assignee_name: assignee?.name ?? '—',
      estimated_hours: t.estimated_hours,
      actual_hours: t.actual_hours,
      status: t.status,
    }
  })

  return {
    date_from: dateFrom, date_to: dateTo,
    generated_at: new Date().toISOString(), generated_by: generatorName,
    rows,
    totals: {
      total_tasks: rows.length,
      total_estimated: rows.reduce((s, r) => s + (r.estimated_hours ?? 0), 0),
      total_actual: rows.reduce((s, r) => s + (r.actual_hours ?? 0), 0),
      completed: rows.filter(r => r.status === 'done').length,
    },
  }
}

export async function generateSystemActivityReport(
  generatorName: string,
  dateFrom: string,
  dateTo: string,
): Promise<SystemActivityReport> {
  const admin = createAdminClient()

  const { data: events } = await admin
    .from('activity_events')
    .select('*, user:profiles!activity_events_user_id_fkey(name)')
    .gte('created_at', dateFrom + 'T00:00:00Z')
    .lte('created_at', dateTo + 'T23:59:59Z')
    .order('created_at', { ascending: false })
    .limit(5000)

  const rows: SystemActivityRow[] = (events ?? []).map((e: {
    created_at: string; event_type: string; description: string;
    target_type: string | null; target_id: string | null;
    user: { name: string } | { name: string }[] | null;
  }) => {
    const user = Array.isArray(e.user) ? e.user[0] : e.user
    return {
      timestamp: e.created_at,
      user_name: user?.name ?? 'System',
      event_type: e.event_type,
      description: e.description,
      target_type: e.target_type,
      target_id: e.target_id,
    }
  })

  return {
    date_from: dateFrom, date_to: dateTo,
    generated_at: new Date().toISOString(), generated_by: generatorName,
    rows, total_events: rows.length,
  }
}

export async function generateTaskExport(
  userId: string,
  role: Role,
  teamId: string | null,
  generatorName: string,
  dateFrom: string,
  dateTo: string,
  filterTeamId?: string,
): Promise<TaskExportRow[]> {
  const admin = createAdminClient()
  const memberIds = await getScopedMemberIds(userId, role, teamId, filterTeamId)

  if (memberIds.length === 0) return []

  const { data: tasks } = await admin
    .from('tasks')
    .select(`
      id, title, description, status, priority, task_type, task_nature, billable,
      due_date, estimated_hours, actual_hours, created_at, completed_at,
      assignee:profiles!tasks_assignee_id_fkey(name),
      creator:profiles!tasks_creator_id_fkey(name),
      reviewer:profiles!tasks_reviewer_id_fkey(name),
      project:projects(name)
    `)
    .in('assignee_id', memberIds)
    .gte('created_at', dateFrom + 'T00:00:00Z')
    .lte('created_at', dateTo + 'T23:59:59Z')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(10000)

  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id)

  // Fetch custom field values
  let cfvMap: Record<string, Record<string, string>> = {}
  if (taskIds.length > 0) {
    const { data: cfvs } = await admin
      .from('custom_field_values')
      .select('task_id, value, field_definition:custom_field_definitions(name)')
      .in('task_id', taskIds)

    for (const cfv of cfvs ?? []) {
      const fd = Array.isArray(cfv.field_definition) ? cfv.field_definition[0] : cfv.field_definition
      if (!fd) continue
      if (!cfvMap[cfv.task_id]) cfvMap[cfv.task_id] = {}
      cfvMap[cfv.task_id][fd.name] = cfv.value ?? ''
    }
  }

  return (tasks ?? []).map((t: {
    id: string; title: string; description: string | null;
    status: string; priority: string; task_type: string; task_nature: string; billable: boolean;
    due_date: string | null; estimated_hours: number | null; actual_hours: number | null;
    created_at: string; completed_at: string | null;
    assignee: { name: string } | { name: string }[] | null;
    creator: { name: string } | { name: string }[] | null;
    reviewer: { name: string } | { name: string }[] | null;
    project: { name: string } | { name: string }[] | null;
  }) => {
    const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee
    const creator = Array.isArray(t.creator) ? t.creator[0] : t.creator
    const reviewer = Array.isArray(t.reviewer) ? t.reviewer[0] : t.reviewer
    const project = Array.isArray(t.project) ? t.project[0] : t.project

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      task_type: t.task_type,
      task_nature: t.task_nature,
      billable: t.billable,
      assignee_name: assignee?.name ?? '—',
      creator_name: creator?.name ?? '—',
      reviewer_name: reviewer?.name ?? null,
      project_name: project?.name ?? null,
      due_date: t.due_date,
      estimated_hours: t.estimated_hours,
      actual_hours: t.actual_hours,
      created_at: t.created_at,
      completed_at: t.completed_at,
      ...cfvMap[t.id],
    }
  })
}
