import { type Role, type Action, type Scope } from '@/types'

// ─── Role Hierarchy ────────────────────────────────────────────────────────────
// Lower number = less permissions. Each role inherits all below it.

const ROLE_LEVEL: Record<Role, number> = {
  employee: 1,
  senior_employee: 2,
  assistant_manager: 3,
  manager: 4,
  senior_manager: 5,
  admin: 6,
}

export function getRoleLevel(role: Role): number {
  return ROLE_LEVEL[role]
}

export function hasRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole]
}

// ─── Permission Matrix ─────────────────────────────────────────────────────────
// Based on access control matrix in sunday-product-architecture.md §2.2

const PERMISSION_MAP: Record<Action, Role[]> = {
  create_task_for_self: ['employee', 'senior_employee', 'assistant_manager', 'manager', 'senior_manager', 'admin'],
  create_task_for_others: ['assistant_manager', 'manager', 'senior_manager', 'admin'],
  assign_reviewer: ['employee', 'senior_employee', 'assistant_manager', 'manager', 'senior_manager', 'admin'],
  view_team_tasks: ['assistant_manager', 'manager', 'senior_manager', 'admin'],
  view_capacity_grid: ['assistant_manager', 'manager', 'senior_manager', 'admin'],
  reassign_tasks: ['assistant_manager', 'manager', 'senior_manager', 'admin'],
  submit_weekly_plan: ['employee', 'senior_employee', 'assistant_manager', 'manager', 'senior_manager'],
  unlock_plan: ['manager', 'senior_manager', 'admin'],
  comment_on_plans: ['assistant_manager', 'manager', 'senior_manager', 'admin'],
  create_custom_fields: ['manager', 'senior_manager', 'admin'],
  manage_users_and_teams: ['admin'],
  export_reports: ['manager', 'senior_manager', 'admin'],
  view_audit_trail: ['admin'],
}

// ─── Permission Check ──────────────────────────────────────────────────────────

/**
 * Check if a user with a given role is permitted to perform an action.
 */
export function can(role: Role, action: Action): boolean {
  const allowedRoles = PERMISSION_MAP[action]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

// ─── Scope Resolution ──────────────────────────────────────────────────────────

/**
 * Given a role, return the broadest scope that role has visibility into.
 *
 * - employee / senior_employee → self only
 * - assistant_manager → sub_team (their sub-team)
 * - manager → team (their team)
 * - senior_manager → department
 * - admin → all
 */
export function getScope(role: Role): Scope {
  switch (role) {
    case 'admin':
      return 'all'
    case 'senior_manager':
      return 'department'
    case 'manager':
      return 'team'
    case 'assistant_manager':
      return 'sub_team'
    default:
      return 'self'
  }
}

// ─── Route Guards (for use in API routes) ─────────────────────────────────────

/**
 * Throw-style helper for API route protection.
 * Returns an error response object if the user lacks permission.
 */
export function requirePermission(
  role: Role | undefined,
  action: Action
): { allowed: boolean; status?: number; error?: string } {
  if (!role) {
    return { allowed: false, status: 401, error: 'Unauthenticated' }
  }
  if (!can(role, action)) {
    return { allowed: false, status: 403, error: 'Insufficient permissions' }
  }
  return { allowed: true }
}

/**
 * Require a minimum role level.
 */
export function requireRole(
  userRole: Role | undefined,
  minimumRole: Role
): { allowed: boolean; status?: number; error?: string } {
  if (!userRole) {
    return { allowed: false, status: 401, error: 'Unauthenticated' }
  }
  if (!hasRoleAtLeast(userRole, minimumRole)) {
    return { allowed: false, status: 403, error: 'Insufficient permissions' }
  }
  return { allowed: true }
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  employee: 'Employee',
  senior_employee: 'Senior Employee',
  assistant_manager: 'Assistant Manager',
  manager: 'Manager',
  senior_manager: 'Senior Manager',
  admin: 'Admin',
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'senior_employee', label: 'Senior Employee' },
  { value: 'assistant_manager', label: 'Assistant Manager' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior_manager', label: 'Senior Manager' },
  { value: 'admin', label: 'Admin' },
]
