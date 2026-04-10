import Papa from 'papaparse'
import type {
  WeeklyTeamReport,
  IndividualEmployeeReport,
  BillableHoursReport,
  SystemActivityReport,
  TaskExportRow,
} from './aggregation'

// ─── Weekly Team CSV ────────────────────────────────────────────────────────

export function weeklyTeamToCSV(report: WeeklyTeamReport): string {
  const rows = report.rows.map(r => ({
    Employee: r.employee_name,
    'Tasks Committed': r.tasks_committed,
    'Tasks Completed': r.tasks_completed,
    'Completion Rate (%)': r.completion_rate,
    'Planned Hours': r.planned_hours,
    'Actual Hours': r.actual_hours,
    'Hours Variance': r.hours_variance,
    'Overdue Tasks': r.overdue_count,
  }))

  // Append totals row
  rows.push({
    Employee: 'TOTAL',
    'Tasks Committed': report.totals.tasks_committed,
    'Tasks Completed': report.totals.tasks_completed,
    'Completion Rate (%)': report.totals.completion_rate,
    'Planned Hours': report.totals.planned_hours,
    'Actual Hours': report.totals.actual_hours,
    'Hours Variance': Math.round((report.totals.actual_hours - report.totals.planned_hours) * 10) / 10,
    'Overdue Tasks': report.totals.overdue_count,
  })

  return Papa.unparse(rows)
}

// ─── Individual Employee CSV ────────────────────────────────────────────────

export function individualToCSV(report: IndividualEmployeeReport): string {
  const rows = report.rows.map(r => ({
    Task: r.task_title,
    Project: r.project_name,
    Status: r.status,
    Priority: r.priority,
    'Estimated Hours': r.estimated_hours ?? '',
    'Actual Hours': r.actual_hours ?? '',
    'Due Date': r.due_date ?? '',
    'Completed At': r.completed_at ?? '',
    'On Time': r.on_time === null ? '' : r.on_time ? 'Yes' : 'No',
  }))

  return Papa.unparse(rows)
}

// ─── Billable Hours CSV ─────────────────────────────────────────────────────

export function billableToCSV(report: BillableHoursReport): string {
  const rows = report.rows.map(r => ({
    Task: r.task_title,
    Project: r.project_name,
    Assignee: r.assignee_name,
    'Estimated Hours': r.estimated_hours ?? '',
    'Actual Hours': r.actual_hours ?? '',
    Status: r.status,
  }))

  rows.push({
    Task: 'TOTAL',
    Project: '',
    Assignee: '',
    'Estimated Hours': report.totals.total_estimated as unknown as string,
    'Actual Hours': report.totals.total_actual as unknown as string,
    Status: `${report.totals.completed} completed`,
  })

  return Papa.unparse(rows)
}

// ─── System Activity CSV ────────────────────────────────────────────────────

export function systemActivityToCSV(report: SystemActivityReport): string {
  const rows = report.rows.map(r => ({
    Timestamp: r.timestamp,
    User: r.user_name,
    'Event Type': r.event_type,
    Description: r.description,
    'Target Type': r.target_type ?? '',
    'Target ID': r.target_id ?? '',
  }))

  return Papa.unparse(rows)
}

// ─── Full Task Export CSV ───────────────────────────────────────────────────

export function taskExportToCSV(rows: TaskExportRow[]): string {
  if (rows.length === 0) return ''

  // Collect all custom field keys (beyond standard keys)
  const standardKeys = new Set([
    'id', 'title', 'description', 'status', 'priority', 'task_type', 'task_nature',
    'billable', 'assignee_name', 'creator_name', 'reviewer_name', 'project_name',
    'due_date', 'estimated_hours', 'actual_hours', 'created_at', 'completed_at',
  ])

  const customKeys = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!standardKeys.has(key)) customKeys.add(key)
    }
  }

  const csvRows = rows.map(r => {
    const base: Record<string, unknown> = {
      ID: r.id,
      Title: r.title,
      Description: r.description ?? '',
      Status: r.status,
      Priority: r.priority,
      'Task Type': r.task_type,
      'Task Nature': r.task_nature,
      Billable: r.billable ? 'Yes' : 'No',
      Assignee: r.assignee_name,
      Creator: r.creator_name,
      Reviewer: r.reviewer_name ?? '',
      Project: r.project_name ?? '',
      'Due Date': r.due_date ?? '',
      'Estimated Hours': r.estimated_hours ?? '',
      'Actual Hours': r.actual_hours ?? '',
      'Created At': r.created_at,
      'Completed At': r.completed_at ?? '',
    }
    for (const ck of customKeys) {
      base[ck] = r[ck] ?? ''
    }
    return base
  })

  return Papa.unparse(csvRows)
}
