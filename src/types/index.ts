// Sunday — Core Type Definitions
// Based on sunday-product-architecture.md & sunday-sprint-plan.md

export type Role =
  | 'employee'
  | 'senior_employee'
  | 'assistant_manager'
  | 'manager'
  | 'senior_manager'
  | 'admin'

export type BillablePermission = 'billable' | 'non_billable' | 'both'

export type UserStatus = 'active' | 'deactivated'

export type PlanningMode = 'locked' | 'fluid'

// ─── Database Types ──────────────────────────────────────────────────────────

export interface Department {
  id: string
  name: string
  senior_manager_id: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  department_id: string
  manager_id: string | null
  planning_mode: PlanningMode
  submission_deadline_day: number | null  // 0 = Sunday, 1 = Monday … 6 = Saturday
  submission_deadline_time: string | null  // HH:MM in 24h
  check_in_mandatory: boolean
  eod_mandatory: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  team_id: string | null
  manager_id: string | null
  work_week: number[]  // Array of day numbers: 0=Sun,1=Mon…6=Sat
  timezone: string    // IANA timezone string e.g. "Asia/Dhaka"
  available_hours: number  // Default 8
  billable_permission: BillablePermission
  status: UserStatus
  invite_accepted: boolean
  onboarding_complete: boolean
  created_at: string
  updated_at: string
  deactivated_at: string | null
}

// ─── Extended / Joined Types ─────────────────────────────────────────────────

export interface UserWithRelations extends User {
  team?: Team | null
  manager?: Pick<User, 'id' | 'name' | 'email'> | null
  department?: Department | null
}

export interface TeamWithRelations extends Team {
  department?: Department | null
  manager?: Pick<User, 'id' | 'name' | 'email'> | null
  members?: User[]
}

export interface DepartmentWithRelations extends Department {
  senior_manager?: Pick<User, 'id' | 'name' | 'email'> | null
  teams?: TeamWithRelations[]
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  role: Role
  name: string
  team_id: string | null
  status: UserStatus
}

// ─── Permission Types ─────────────────────────────────────────────────────────

export type Action =
  | 'create_task_for_self'
  | 'create_task_for_others'
  | 'view_team_tasks'
  | 'view_capacity_grid'
  | 'reassign_tasks'
  | 'comment_on_plans'
  | 'create_custom_fields'
  | 'manage_users_and_teams'
  | 'export_reports'
  | 'view_audit_trail'
  | 'submit_weekly_plan'
  | 'unlock_plan'
  | 'assign_reviewer'

export type Scope = 'self' | 'sub_team' | 'team' | 'department' | 'all'

// ─── Bulk Import Types ────────────────────────────────────────────────────────

export interface BulkImportRow {
  name: string
  email: string
  role: string
  team_name: string
  timezone: string
  manager_email?: string
  work_week?: string  // e.g. "Mon,Tue,Wed,Thu,Fri"
  available_hours?: string
  billable_permission?: string
}

export interface BulkImportRowValidated extends BulkImportRow {
  _index: number
  _errors: string[]
  _valid: boolean
}

// ─── Task Engine Types ────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskType = 'planned' | 'adhoc'
export type TaskNature = 'core' | 'supporting'

export type TimelineEventType =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'reassigned'
  | 'comment_added'
  | 'file_added'
  | 'dependency_added'
  | 'dependency_resolved'
  | 'completion_report_submitted'
  | 'marked_done'
  | 'sent_back'
  | 'subtask_added'
  | 'subtask_status_changed'
  | 'field_updated'

export interface Project {
  id: string
  name: string
  team_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  creator_id: string
  assignee_id: string
  reviewer_id: string | null
  project_id: string | null
  parent_task_id: string | null

  status: TaskStatus
  priority: TaskPriority
  task_type: TaskType
  task_nature: TaskNature
  billable: boolean

  due_date: string | null   // ISO date string YYYY-MM-DD
  estimated_hours: number | null
  actual_hours: number | null
  review_hours: number | null

  completion_report_text: string | null
  completion_report_file_path: string | null

  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskWithRelations extends Task {
  creator?: Pick<User, 'id' | 'name' | 'email'> | null
  assignee?: Pick<User, 'id' | 'name' | 'email'> | null
  reviewer?: Pick<User, 'id' | 'name' | 'email'> | null
  project?: Pick<Project, 'id' | 'name'> | null
  subtasks?: Task[]
  dependencies?: TaskDependency[]
}

export interface TaskDependency {
  task_id: string
  depends_on_task_id: string
  created_at: string
  // joined fields
  depends_on_task?: Pick<Task, 'id' | 'title' | 'status'>
}

export interface TaskTimelineEvent {
  id: string
  task_id: string
  event_type: TimelineEventType
  actor_id: string | null
  old_value: string | null
  new_value: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  // joined
  actor?: Pick<User, 'id' | 'name'> | null
}

// Lightweight type for task list views
export interface TaskRow {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  task_type: TaskType
  task_nature: TaskNature
  billable: boolean
  due_date: string | null
  estimated_hours: number | null
  assignee_id: string
  assignee?: Pick<User, 'id' | 'name'>
  project?: Pick<Project, 'id' | 'name'> | null
  creator_id: string
  parent_task_id: string | null
  created_at: string
}

// ─── Custom Fields (Sprint 3) ─────────────────────────────────────────────────

export type CustomFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox'
export type CustomFieldScopeType = 'team' | 'project' | 'global'
export type CustomFieldStatus = 'active' | 'archived'
export type SavedViewScope = 'personal' | 'shared'

export interface CustomFieldDefinition {
  id: string
  name: string
  field_type: CustomFieldType
  options: string[] | null        // populated for dropdown type
  scope_type: CustomFieldScopeType
  scope_id: string | null         // team_id or project_id
  created_by: string
  status: CustomFieldStatus
  created_at: string
  updated_at: string
}

export interface CustomFieldValue {
  id: string
  task_id: string
  field_definition_id: string
  value: string | null
  set_by: string | null
  created_at: string
  updated_at: string
  // joined
  field_definition?: CustomFieldDefinition
}

export interface SavedView {
  id: string
  name: string
  filters: Record<string, unknown>
  scope: SavedViewScope
  created_by: string
  team_id: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

// ─── Planning Module (Sprint 4) ───────────────────────────────────────────────

export type PlanSubmissionStatus = 'draft' | 'submitted' | 'fluid'

export interface WeeklyPlan {
  id: string
  user_id: string
  week_start_date: string   // ISO date YYYY-MM-DD (always a Monday)
  submission_status: PlanSubmissionStatus
  submitted_at: string | null
  locked: boolean
  created_at: string
  updated_at: string
}

export interface PlanEntry {
  id: string
  plan_id: string
  task_id: string
  day_of_week: number       // 0=Sun … 6=Sat
  planned_hours: number
  is_carryover: boolean
  original_date: string | null
  created_at: string
  updated_at: string
  // joined
  task?: Pick<Task, 'id' | 'title' | 'priority' | 'status' | 'estimated_hours'>
}

export interface DailyCheckin {
  id: string
  user_id: string
  date: string              // ISO date YYYY-MM-DD
  tasks_json: CheckinTaskSnapshot[]
  notes: string | null
  submitted_at: string
}

export interface CheckinTaskSnapshot {
  task_id: string
  title: string
  priority: TaskPriority
  planned_hours: number
  category?: string
  confirmed: boolean        // did user tick it for today
}

export interface EodWrapup {
  id: string
  user_id: string
  date: string
  planned_tasks_json: WrapupTaskRow[]
  actual_tasks_json: WrapupTaskRow[]
  notes: string | null
  discrepancies_json: WrapupDiscrepancy[] | null
  submitted_at: string
}

export interface WrapupTaskRow {
  task_id: string
  title: string
  planned_hours: number
  actual_hours: number
  status: TaskStatus
  category?: string
}

export interface WrapupDiscrepancy {
  task_id: string
  title: string
  planned_hours: number
  actual_hours: number
  delta: number
}

export interface PlanComment {
  id: string
  plan_id: string
  author_id: string
  text: string
  created_at: string
  // joined
  author?: Pick<User, 'id' | 'name' | 'role'>
}

// Extended plan with entries + comments
export interface WeeklyPlanWithEntries extends WeeklyPlan {
  entries: PlanEntry[]
  comments: PlanComment[]
  user?: Pick<User, 'id' | 'name' | 'available_hours' | 'work_week'>
}

// For team plans grid view (manager)
export interface TeamMemberPlanSummary {
  user: Pick<User, 'id' | 'name' | 'available_hours' | 'work_week'>
  plan: WeeklyPlan | null
  day_hours: Record<number, number>   // day_of_week → planned_hours sum
  submission_status: PlanSubmissionStatus
  unplanned_days: number[]            // day_of_week values with 0 hours on working days
}

// ─── Manager Dashboard (Sprint 5) ────────────────────────────────────────────

export type ActivityEventType =
  | 'task_created'
  | 'task_status_changed'
  | 'task_assigned'
  | 'task_reassigned'
  | 'task_completed'
  | 'task_commented'
  | 'plan_submitted'
  | 'plan_unlocked'
  | 'checkin_submitted'
  | 'wrapup_submitted'
  | 'field_updated'
  | 'user_joined'
  | 'warning_acknowledged'

export interface ActivityEvent {
  id: string
  user_id: string
  team_id: string | null
  event_type: ActivityEventType
  description: string
  target_id: string | null
  target_type: string | null   // 'task' | 'plan' | 'checkin' | 'wrapup' | 'user'
  metadata: Record<string, unknown> | null
  created_at: string
  // joined
  user?: Pick<User, 'id' | 'name'>
}

export interface WarningAcknowledgement {
  id: string
  manager_id: string
  employee_id: string
  week_start: string            // ISO date YYYY-MM-DD
  unplanned_days: number[]
  note: string | null
  created_at: string
}

// My Overview — personal dashboard data
export interface TodayTask {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  project_name: string | null
  due_date: string | null
  estimated_hours: number | null
}

export interface UpcomingDeadline {
  id: string
  title: string
  due_date: string
  project_name: string | null
  days_until: number
}

export interface CarryOver {
  id: string
  title: string
  original_date: string      // ISO date (the day it was planned)
  day_of_week: number
}

export interface MyOverviewData {
  today_tasks: TodayTask[]          // tasks due today (any status except done)
  overdue_tasks: TodayTask[]        // tasks past due date, not done
  completion_rate: number           // 0–100 percentage
  completed_this_week: number       // count of done tasks this week
  total_committed_this_week: number // count of tasks in plan this week
  upcoming_deadlines: UpcomingDeadline[]  // next 3 days
  carry_overs: CarryOver[]          // plan entries with is_carryover=true for current week
  greeting_name: string
}

// Team Pulse — manager view
export interface TeamPulseMemberRow {
  user: Pick<User, 'id' | 'name' | 'available_hours' | 'work_week'>
  submission_status: PlanSubmissionStatus | null
  day_hours: Record<number, number>   // dow → planned hours
  completion_rate: number             // 0–100
  completed_tasks: number
  total_tasks: number
  unplanned_days: number[]
}

export interface OverdueTaskEntry {
  id: string
  title: string
  assignee_id: string
  assignee_name: string
  due_date: string
  days_overdue: number
}

export interface TeamPulseData {
  week_start: string
  members: TeamPulseMemberRow[]
  overdue_tasks: OverdueTaskEntry[]
  unplanned_members: Pick<User, 'id' | 'name'>[]  // members with any unplanned working day
}

// Workload View — planned vs actual
export interface WorkloadDayCell {
  planned_hours: number
  actual_hours: number
  utilisation_pct: number   // actual / planned * 100 (0 if planned = 0)
}

export interface WorkloadMemberRow {
  user: Pick<User, 'id' | 'name' | 'available_hours' | 'work_week'>
  days: Record<number, WorkloadDayCell>   // dow → cell data
  weekly_variance_hours: number           // total (actual - planned) across the week
}

export interface WorkloadData {
  week_start: string
  members: WorkloadMemberRow[]
  working_days: number[]   // union of all member work_week days present this week
}

// ─── Notification System (Sprint 6) ──────────────────────────────────────────

export type NotificationType =
  | 'task_assigned'
  | 'task_reassigned_away'
  | 'task_due_today'
  | 'task_overdue'
  | 'task_in_review'
  | 'task_sent_back'
  | 'task_marked_done'
  | 'dependency_unblocked'
  | 'plan_not_submitted'
  | 'checkin_not_submitted'
  | 'zero_tasks_planned'
  | 'comment_on_plan'
  | 'comment_on_task'

export type NotificationChannel = 'in_app' | 'email' | 'both'

export interface Notification {
  id: string
  recipient_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  read: boolean
  channel: NotificationChannel
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: NotificationType
  enabled: boolean
  updated_at: string
}

// The 3 notification types users can disable
export const OPTIONAL_NOTIFICATION_TYPES: NotificationType[] = [
  'task_marked_done',
  'comment_on_plan',
  'comment_on_task',
]

// Notification types that also send email
export const EMAIL_NOTIFICATION_TYPES: NotificationType[] = [
  'task_overdue',
  'plan_not_submitted',
  'zero_tasks_planned',
]

// Metadata for notification type display
export const NOTIFICATION_TYPE_META: Record<NotificationType, { icon: string; label: string }> = {
  task_assigned: { icon: 'assignment_ind', label: 'Task Assigned' },
  task_reassigned_away: { icon: 'swap_horiz', label: 'Task Reassigned' },
  task_due_today: { icon: 'today', label: 'Due Today' },
  task_overdue: { icon: 'warning', label: 'Overdue' },
  task_in_review: { icon: 'rate_review', label: 'In Review' },
  task_sent_back: { icon: 'undo', label: 'Sent Back' },
  task_marked_done: { icon: 'task_alt', label: 'Completed' },
  dependency_unblocked: { icon: 'lock_open', label: 'Unblocked' },
  plan_not_submitted: { icon: 'calendar_today', label: 'Plan Overdue' },
  checkin_not_submitted: { icon: 'assignment_turned_in', label: 'Check-in Missing' },
  zero_tasks_planned: { icon: 'event_busy', label: 'No Tasks Planned' },
  comment_on_plan: { icon: 'chat_bubble_outline', label: 'Plan Comment' },
  comment_on_task: { icon: 'comment', label: 'Task Comment' },
}

// ─── File Management (Sprint 8) ──────────────────────────────────────────────

export type FileContext = 'attachment' | 'completion_report' | 'wrapup'

export interface TaskFile {
  id: string
  filename: string
  file_type: string              // MIME type
  file_size: number              // bytes
  storage_path: string
  uploaded_by: string
  task_id: string | null
  wrap_up_id: string | null
  permanent: boolean
  context: FileContext
  created_at: string
  // joined
  uploader?: Pick<User, 'id' | 'name'> | null
}

// File type categories for icon display
export const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  'application/pdf': { icon: 'picture_as_pdf', color: 'text-error' },
  'image/png': { icon: 'image', color: 'text-primary' },
  'image/jpeg': { icon: 'image', color: 'text-primary' },
  'image/jpg': { icon: 'image', color: 'text-primary' },
  'image/gif': { icon: 'image', color: 'text-primary' },
  'image/webp': { icon: 'image', color: 'text-primary' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'description', color: 'text-[#2B579A]' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: 'table_chart', color: 'text-green-600' },
  'application/msword': { icon: 'description', color: 'text-[#2B579A]' },
  'application/vnd.ms-excel': { icon: 'table_chart', color: 'text-green-600' },
  'video/mp4': { icon: 'videocam', color: 'text-tertiary' },
  'video/webm': { icon: 'videocam', color: 'text-tertiary' },
  'video/quicktime': { icon: 'videocam', color: 'text-tertiary' },
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

