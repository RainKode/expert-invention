# Sunday — Development Sprint Plan

**Source Document:** sunday-product-architecture.md (v1.0, 9 April 2026)
**Date:** 9 April 2026
**Total Sprints:** 10
**Estimated Modules:** 14 (9 explicit, 5 inferred)
**Target:** Phase 1 — Launch (v1 MVP)

---

## Executive Summary

Sunday is a task and time management system built for manager accountability — the core loop being: assign work, track it, enforce completion reports, and surface whether employees' weeks are actually planned. It targets ~50–60 office staff across six ventures under Magpie Nest Group, operating across Bangladesh, UK, and US timezones with varied work week patterns (Sun–Thu, Mon–Fri). The system is standalone for v1 with a clear architectural intent to become either a commercial SaaS product or a module within the WorkPulse HR platform.

The build is structured across 10 sprints, ordered by strict dependency logic. Sprint 1 lays the authentication, user management, and organisational hierarchy foundation — nothing works without knowing who someone is, what team they belong to, and what their role permits. Sprints 2–3 build the task engine and its lifecycle, which is the atomic unit everything else hangs on. Sprints 4–5 introduce the planning discipline (weekly plans, daily check-ins, EOD wrap-ups) and the manager dashboard. Sprints 6–8 layer on the cross-cutting systems (notifications, search/filtering, file handling) that turn the core features into a polished product. Sprint 9 delivers reporting and export — deliberately late because reports need the data to exist first. Sprint 10 is mobile optimisation, archiving, onboarding polish, and the system audit trail.

When all 10 sprints are complete, the team will have a fully functional, responsive task and planning management system with mandatory completion reports, timezone-aware weekly planning, capacity grids, role-cascading dashboards, full task lifecycle logging, exportable reports in PDF and CSV, in-app and email notifications, global search, and a system-level audit trail. Every feature listed in Phase 1 of the product architecture will be built and deployable.

---

## Master Module Registry

| # | Module | Source | Description |
|---|--------|--------|-------------|
| 1 | **Authentication & Session Management** | Inferred | Login, password reset, email invite acceptance, session handling, logout. Not explicitly named as a module in the PAD but required for every user interaction. |
| 2 | **User & Team Management** | Explicit (§3.4) | Admin control panel — user CRUD, role assignment, team/department hierarchy, work week/timezone config, billable permissions, bulk user import. |
| 3 | **Role & Permission Engine** | Inferred | Centralised RBAC system enforcing the 6-tier cascading role hierarchy across all modules. Described in the access control matrix but not separated as a module. |
| 4 | **Task Engine** | Explicit (§3.1) | Task CRUD, all fixed fields, status workflow (To Do → In Progress → In Review → Done), mandatory completion reports, reviewer flow, reassignment with history, ad hoc backdating, dependency enforcement, subtasks. |
| 5 | **Task Timeline (Lifecycle Log)** | Explicit (§3.1 sub) | Immutable chronological log of every event on a task. Read-only. Permanent. |
| 6 | **Custom Fields Engine** | Inferred | Dynamic field creation per team/project by Managers/Admins. Sits on top of fixed task fields. Separated because it requires its own schema logic, archiving behaviour, and filter integration. |
| 7 | **Planning Module** | Explicit (§3.2) | Weekly plan creation, daily check-in, EOD wrap-up, carry-over, locked/fluid mode, plan submission deadlines, plan comments. |
| 8 | **Manager Dashboard** | Explicit (§3.3) | My Overview, Team Pulse (capacity grid + big fat warning), Task Board (Kanban), Workload View, Activity Feed. |
| 9 | **Notification System** | Explicit (§4.1) | In-app notification engine + email dispatch for urgent events. 13 trigger types with configurable opt-outs on select items. |
| 10 | **Search & Filtering** | Explicit (§4.2) | Global search across tasks/descriptions/reports, multi-criteria task filters, saved views (personal + shared). |
| 11 | **File Management** | Explicit (§4.3) | File upload on tasks and wrap-ups, in-app preview (PDF/images), secure storage, permanent retention, supported file types enforcement. |
| 12 | **Reporting & Export** | Explicit (§3.5) | Five report types (weekly team performance, individual employee, billable hours, system activity, full task export), PDF and CSV formats, role-scoped access. |
| 13 | **Settings & Preferences** | Explicit (§4.6) | User-level (timezone, notification prefs, default view, saved filters), team-level (planning mode, deadlines, mandatory check-ins, custom fields), system-level (org branding, default hours, archiving window). |
| 14 | **Archiving & Data Retention** | Inferred | Configurable archiving window, auto-archive completed tasks, retain full history and attachments, searchable archived data. Described in §4.13 but needs its own background job logic and UI integration. |

---

## Module Dependency Map

```
Level 0 — Foundation (no dependencies)
├── Authentication & Session Management
├── User & Team Management
└── Role & Permission Engine

Level 1 — Core Engine (depends on Level 0)
├── Task Engine ← Users, Roles, Teams
├── Task Timeline ← Task Engine
└── Custom Fields Engine ← Task Engine, Teams

Level 2 — Planning Layer (depends on Level 1)
├── Planning Module ← Task Engine, Users (timezone/work week)
└── Settings & Preferences ← Users, Teams (partial — user prefs can exist early)

Level 3 — Visibility Layer (depends on Levels 1–2)
├── Manager Dashboard ← Task Engine, Planning Module, Users/Teams
├── Notification System ← Task Engine, Planning Module, Users
├── Search & Filtering ← Task Engine, Custom Fields
└── File Management ← Task Engine

Level 4 — Output Layer (depends on everything)
├── Reporting & Export ← Task Engine, Planning Module, Users/Teams, Dashboard data
└── Archiving & Data Retention ← Task Engine, File Management, Settings
```

**Dependency flow in plain language:**

- You cannot build tasks without users and roles.
- You cannot build planning without tasks and timezone-aware user profiles.
- You cannot build the dashboard without tasks and plans to display.
- You cannot build notifications without events to trigger them.
- You cannot build reports without data to report on.
- You cannot build archiving without data to archive and settings to configure the window.

---

## Sprint Plan

---

### Sprint 1: Foundation — Authentication, Users, Roles, and Organisational Structure

**Goal:** A running application where an Admin can log in, create the organisational hierarchy (departments → teams → managers), create employee accounts with full configuration, and send email invites. The role and permission system is active. No one can do any work yet — but everyone exists.

**Duration Estimate:** 2 weeks for a 2-person team

#### UI/UX Feature List

**Page: Login**
Purpose: Authenticate users into the system
URL Pattern: `/login`
Access: Public (unauthenticated users)

Layout Sections:
- Hero/brand section: Sunday logo, tagline ("Did they do it? Are their days planned?"), organisation name
- Login form: Email + password fields, "Sign In" button, "Forgot Password" link

Components:
- Email input field with validation
- Password input field with show/hide toggle
- Sign In button — submits credentials, redirects to dashboard on success
- Forgot Password link — navigates to password reset flow
- Error message display — invalid credentials, account deactivated message

Actions Available:
- Sign In: Authenticates and redirects to appropriate dashboard based on role
- Forgot Password: Navigates to `/forgot-password`

States:
- Empty state: Form ready for input
- Loading state: Button shows spinner during authentication
- Error state: Inline error message below form ("Invalid email or password" / "This account has been deactivated")

---

**Page: Forgot Password**
Purpose: Allow users to request a password reset link
URL Pattern: `/forgot-password`
Access: Public

Layout Sections:
- Simple form: Email input, "Send Reset Link" button, "Back to Login" link

Components:
- Email input with validation
- Submit button
- Success confirmation message ("If this email exists, a reset link has been sent")

Actions Available:
- Send Reset Link: Dispatches password reset email
- Back to Login: Returns to `/login`

States:
- Empty state: Form ready
- Loading state: Button spinner
- Success state: Confirmation message (same message regardless of whether email exists — security)

---

**Page: Set Password (Invite Acceptance)**
Purpose: New employees set their password from email invite
URL Pattern: `/set-password?token=xxx`
Access: Public (valid invite token required)

Layout Sections:
- Welcome message showing employee name and team
- Password + confirm password fields
- "Set Password & Continue" button

Components:
- Password field with strength indicator
- Confirm password field with match validation
- Submit button

Actions Available:
- Set Password: Creates credentials, redirects to first login experience

States:
- Empty state: Form ready with welcome message
- Error state: Invalid/expired token message with "Contact your administrator" instruction
- Loading state: Button spinner

---

**Page: Admin — User Management**
Purpose: Admin creates, edits, deactivates, and manages all user accounts
URL Pattern: `/admin/users`
Access: Admin only

Layout Sections:
- Header: Page title, "Add User" button, "Bulk Import" button
- Filter bar: Search by name/email, filter by role, filter by team, filter by status (active/deactivated)
- User list table: Name, email, role, team, manager, timezone, status, actions

Components:
- User table with sortable columns (name, role, team, status)
- Search input — filters table in real-time
- Role filter dropdown
- Team filter dropdown
- Status toggle filter (Active / Deactivated / All)
- Pagination controls
- Row actions: Edit, Deactivate/Reactivate

Actions Available:
- Add User: Opens user creation form/modal
- Bulk Import: Opens CSV upload flow
- Edit User (row action): Opens edit form
- Deactivate User (row action): Triggers deactivation flow with task reassignment prompt
- Reactivate User (row action): Restores account, confirmation required

Data Displayed:
- User name: From user record
- Email: From user record
- Role: Badge showing role level
- Team: Team name, linked to team management
- Manager: Reporting manager name
- Work Week: e.g. "Sun–Thu" or "Mon–Fri"
- Timezone: e.g. "Asia/Dhaka", "Europe/London"
- Status: Active (green) / Deactivated (grey)

States:
- Empty state: "No employees yet. Add your first team member to get started."
- Loading state: Table skeleton
- Error state: "Failed to load users. Please try again."

---

**Page: Admin — User Create/Edit Form**
Purpose: Create or edit a user account with all configuration
URL Pattern: `/admin/users/new` or `/admin/users/:id/edit`
Access: Admin only

Layout Sections:
- Personal info section: Name, email
- Role & team section: Role selector, team selector, reporting manager selector
- Schedule section: Work week pattern (day checkboxes), timezone selector, available hours per day override
- Permissions section: Billable task toggle (billable / non-billable / both)

Components:
- Text inputs: Name, email
- Role dropdown: Employee, Senior Employee, Assistant Manager, Manager, Senior Manager, Admin
- Team dropdown: Populated from existing teams
- Manager dropdown: Populated from users in Manager+ roles, filtered to relevant team/department
- Work week day selector: Checkboxes for each day of the week (default varies by region)
- Timezone dropdown: All IANA timezones with search
- Available hours input: Number field, default 8, overridable
- Billable permissions toggle: Billable only / Non-billable only / Both
- Save button, Cancel button

Actions Available:
- Save: Creates/updates user, sends email invite if new
- Cancel: Returns to user list

States:
- Empty state: Blank form (create mode)
- Populated state: Pre-filled fields (edit mode)
- Validation errors: Inline per field

---

**Page: Admin — Team Management**
Purpose: Create and manage teams and departments
URL Pattern: `/admin/teams`
Access: Admin only

Layout Sections:
- Header: "Teams & Departments" title, "Add Department" button, "Add Team" button
- Hierarchy view: Departments as collapsible parent rows, teams nested underneath, showing assigned manager, member count, planning mode

Components:
- Department rows: Name, senior manager, team count, expand/collapse
- Team rows (nested): Name, manager, member count, planning mode badge (Locked/Fluid), submission deadline
- Add Department modal: Name, assign Senior Manager
- Add Team modal: Name, parent department, assign Manager, planning mode, submission deadline (day + time)
- Edit/delete actions per row

Actions Available:
- Add Department: Opens department creation modal
- Add Team: Opens team creation modal
- Edit Department/Team: Opens edit modal
- Expand/Collapse: Shows/hides nested teams

Data Displayed:
- Department name, assigned senior manager, team count
- Team name, assigned manager, member count, planning mode, submission deadline

States:
- Empty state: "No departments yet. Start by creating your organisational structure."
- Loading state: Skeleton rows
- Error state: Inline error message

---

**Page: Admin — Bulk User Import**
Purpose: Upload a CSV to create multiple user accounts at once
URL Pattern: `/admin/users/import` (or modal from user management page)
Access: Admin only

Layout Sections:
- Instructions section: Expected CSV format, downloadable template
- Upload section: Drag-and-drop or file picker
- Preview section: Parsed CSV data in table form with validation status per row
- Confirm section: "Import X users" button

Components:
- CSV template download link
- File upload area (drag-and-drop + browse)
- Preview table: Name, email, role, team, timezone — with row-level validation indicators
- Error summary: "3 rows have issues — expand to see details"
- Import button with count
- Cancel button

Actions Available:
- Download Template: Downloads sample CSV
- Upload CSV: Parses and previews
- Import: Creates all valid accounts, sends invites
- Cancel: Returns to user management

States:
- Empty state: Upload prompt with instructions
- Preview state: Parsed data displayed with validation
- Error state: Rows with issues highlighted in red with explanations
- Success state: "X users created. Y invitations sent."

---

#### Module Specifications

**Module: Authentication & Session Management**
Purpose: Secure user authentication, session persistence, and password management
Dependencies: None (foundational)
Connects To: Every module (all requests are authenticated)

Core Functions:
- Login: Accepts email + password, validates against stored credentials, returns session token, records login event
- Logout: Invalidates session token, redirects to login
- Password Reset: Generates time-limited reset token, sends email with reset link, allows new password creation
- Invite Acceptance: Validates invite token, allows first-time password creation, activates account
- Session Validation: Middleware on every request — validates token, loads user context (role, team, permissions)

Data Model (Plain Language):
- Session: User ID, token, created at, expires at, IP address
- Password Reset Token: User ID, token, created at, expires at, used (boolean)
- Invite Token: User ID, token, created at, expires at, accepted (boolean)

Business Rules:
- Sessions expire after a configurable period of inactivity (suggest 24 hours for v1)
- Password reset tokens expire after 1 hour
- Invite tokens expire after 7 days — Admin can resend
- Deactivated accounts cannot log in — return specific error message
- All login attempts (success and failure) are logged for audit

API/Integration Needs:
- POST `/api/auth/login` — authenticate user
- POST `/api/auth/logout` — end session
- POST `/api/auth/forgot-password` — request reset
- POST `/api/auth/reset-password` — set new password with token
- POST `/api/auth/accept-invite` — set password from invite
- GET `/api/auth/me` — return current user context
- Email dispatch for invite and reset emails (transactional email service needed)

---

**Module: User & Team Management**
Purpose: Admin control panel for organisational structure — users, teams, departments, and all per-user configuration
Dependencies: Authentication (users must be creatable and invitable)
Connects To: Every module — provides the user, team, and hierarchy data everything else relies on

Core Functions:
- Create User: Sets name, email, role, team, manager, work week, timezone, available hours, billable permissions. Triggers invite email.
- Edit User: Updates any user field. Changes are logged.
- Deactivate User: Disables login, generates open task reassignment list, preserves all history.
- Reactivate User: Re-enables login, restores all data.
- Create/Edit Department: Name, assigned Senior Manager.
- Create/Edit Team: Name, parent department, assigned Manager, planning mode (locked/fluid), plan submission deadline (day + time).
- Bulk User Import: Parses CSV, validates, creates multiple accounts in one operation.

Data Model (Plain Language):
- User: ID, name, email, password hash, role, team ID, reporting manager ID, work week pattern (array of days), timezone, available hours per day, billable permission type (billable/non-billable/both), status (active/deactivated), created at, deactivated at
- Team: ID, name, department ID, manager user ID, planning mode (locked/fluid), plan submission deadline (day + time), daily check-in mandatory (boolean), EOD wrap-up mandatory (boolean)
- Department: ID, name, senior manager user ID

Business Rules:
- Email must be unique across all users (active and deactivated)
- A user can only belong to one team
- A team can only belong to one department
- Deactivation cannot complete until all open tasks are reassigned or closed
- Manager dropdown is filtered: only users with Manager+ roles in the relevant department/team
- Work week defaults: Sun–Thu for Dhaka timezone, Mon–Fri for UK/US timezones (configurable)
- Bulk import validates all rows before committing — partial imports are not allowed

API/Integration Needs:
- CRUD endpoints for users, teams, departments
- POST `/api/admin/users/bulk-import` — CSV upload and processing
- GET `/api/users/:id/open-tasks` — for deactivation flow
- Transactional email service for invite dispatch

---

**Module: Role & Permission Engine**
Purpose: Centralised access control enforcing the 6-tier cascading role hierarchy
Dependencies: User & Team Management (roles are assigned to users)
Connects To: Every module — every action checks permissions

Core Functions:
- Permission Check: Given a user, an action, and a target resource, determine if the action is allowed
- Scope Resolution: Given a user's role, determine what data they can see (own / sub-team / team / department / all)
- Cascading Role Logic: Senior Manager inherits all Manager abilities, Manager inherits all Assistant Manager abilities, etc.

Data Model (Plain Language):
- Permission Matrix: Role → Action → Scope mapping (as defined in PAD §2.2). Stored as configuration, not per-user data.

Business Rules:
- Roles cascade upward — every role inherits all permissions of roles below it
- Admin has full system access regardless of team/department
- Scope is determined by team/department hierarchy — a Manager sees their team, a Senior Manager sees their department
- Permission checks happen server-side on every request — never trust client-side role checks alone
- "Create task for others" is scoped: Assistant Manager → sub-team only, Manager → team only, Senior Manager → department only, Admin → anyone

API/Integration Needs:
- Middleware function: `checkPermission(user, action, resource)` — returns boolean
- Middleware function: `getScope(user)` — returns list of user IDs the requesting user can view/manage

---

#### Task Breakdown

```
Task 1.1: Project Setup and Infrastructure
Type: Full-stack / Configuration
Description: Initialise the Next.js 14 project with TypeScript, configure Supabase 
  (database, auth, storage), set up the development environment, CI/CD pipeline, 
  environment variables, and base project structure (folder layout, shared types, 
  API route patterns).
Depends On: None
Estimated Complexity: Medium
Acceptance Criteria:
- Next.js 14 app runs locally with TypeScript
- Supabase project created with connection working
- Base folder structure matches agreed conventions
- Environment variables managed securely
- README documents setup steps

Task 1.2: Database Schema — Users, Teams, Departments
Type: Backend
Description: Create database tables for users, teams, and departments with all fields 
  from the PAD. Include indexes, foreign keys, and row-level security policies.
Depends On: 1.1
Estimated Complexity: Medium
Acceptance Criteria:
- Users table includes all fields (name, email, role, team_id, manager_id, work_week, 
  timezone, available_hours, billable_permission, status, timestamps)
- Teams table includes all fields (name, department_id, manager_id, planning_mode, 
  submission_deadline, check_in_mandatory, eod_mandatory)
- Departments table includes all fields (name, senior_manager_id)
- Foreign key relationships enforced
- Row-level security policies drafted (Admin can manage all, users can read own)

Task 1.3: Authentication — Login, Logout, Session Management
Type: Backend + Frontend
Description: Implement email/password authentication using Supabase Auth. Build login 
  page, logout functionality, session persistence via cookies/tokens, and auth middleware 
  that validates every API request.
Depends On: 1.1, 1.2
Estimated Complexity: Medium
Acceptance Criteria:
- User can log in with email and password
- Invalid credentials show appropriate error
- Deactivated accounts cannot log in
- Session persists across page refreshes
- Logout clears session and redirects to login
- Auth middleware rejects unauthenticated API requests

Task 1.4: Password Reset Flow
Type: Backend + Frontend
Description: Build the forgot password flow — email submission, reset token generation, 
  email dispatch, and new password creation page.
Depends On: 1.3
Estimated Complexity: Simple
Acceptance Criteria:
- User can request password reset by email
- Reset email is sent with time-limited token (1 hour)
- Reset page allows new password creation
- Expired tokens show appropriate error
- Same success message regardless of email existence (security)

Task 1.5: Email Invite and Onboarding Flow
Type: Backend + Frontend
Description: When Admin creates a user, system generates an invite token and sends an 
  email. New user clicks the link, sets their password, and is redirected to the 
  application. Build the invite acceptance page.
Depends On: 1.3, 1.2
Estimated Complexity: Medium
Acceptance Criteria:
- Admin creating a user triggers invite email automatically
- Invite email contains a link with a unique token (valid 7 days)
- Invite acceptance page shows user name and team
- User sets password and is logged in automatically
- Expired invite tokens show error with "contact administrator" message
- Admin can resend invite for users who haven't accepted

Task 1.6: Role & Permission Engine Implementation
Type: Backend
Description: Build the centralised permission checking middleware. Implement the 
  cascading role hierarchy and scope resolution logic as defined in the PAD access 
  control matrix (§2.2).
Depends On: 1.2
Estimated Complexity: Complex
Acceptance Criteria:
- Permission check function accepts (user, action, resource) and returns boolean
- Scope resolution function returns correct user IDs based on role and team hierarchy
- All 6 roles cascade correctly (Employee → Admin)
- Scope restrictions enforced: Asst Manager sees sub-team, Manager sees team, Sr Manager sees department, Admin sees all
- Permission checks are applied as middleware on all API routes
- Unit tests cover all role/action/scope combinations from the access control matrix

Task 1.7: Admin — User Management UI
Type: Frontend
Description: Build the user management page with user list table, search, filters 
  (role, team, status), and row actions (edit, deactivate, reactivate). Includes the 
  create/edit user form with all fields.
Depends On: 1.2, 1.3, 1.6
Estimated Complexity: Complex
Acceptance Criteria:
- User list displays all users with sortable columns
- Search filters by name and email in real-time
- Role, team, and status filters work correctly
- Create user form includes all fields from the PAD
- Edit user form pre-populates existing data
- Deactivate action prompts for confirmation
- Only Admin role can access this page

Task 1.8: Admin — Team & Department Management UI
Type: Frontend
Description: Build the team and department management page with hierarchical view, 
  create/edit modals for departments and teams, and all team configuration fields 
  (planning mode, submission deadline, mandatory check-ins).
Depends On: 1.2, 1.6, 1.7
Estimated Complexity: Medium
Acceptance Criteria:
- Departments display as collapsible parent rows
- Teams nested under their department
- Create/edit department modal with name and senior manager selector
- Create/edit team modal with all fields (name, department, manager, planning mode, deadline, mandatory flags)
- Hierarchy reflects real parent-child relationships
- Only Admin role can access this page

Task 1.9: Bulk User Import (CSV)
Type: Full-stack
Description: Build the CSV upload flow for bulk user creation. Includes template 
  download, file parsing, row-level validation, preview table, and batch account 
  creation with invite dispatch.
Depends On: 1.7, 1.5
Estimated Complexity: Complex
Acceptance Criteria:
- Downloadable CSV template matches expected format
- File upload accepts .csv files
- Parsed data shown in preview table with per-row validation
- Invalid rows highlighted with specific error messages
- All-or-nothing import — no partial commits
- Successful import creates accounts and sends invites
- Success summary shows count of created users

Task 1.10: App Shell — Navigation, Layout, and Route Protection
Type: Frontend
Description: Build the main application shell — sidebar navigation, top bar with user 
  info and logout, responsive layout container, and route protection that redirects 
  unauthenticated users to login and enforces role-based page access.
Depends On: 1.3, 1.6
Estimated Complexity: Medium
Acceptance Criteria:
- Sidebar navigation with links scoped by role (Admin sees admin pages, Managers see dashboard, etc.)
- Top bar shows logged-in user name, role, and logout button
- Routes are protected — unauthenticated users redirect to /login
- Role-restricted pages return 403 or redirect if accessed by wrong role
- Responsive: sidebar collapses to hamburger menu on mobile
- Loading states during route transitions
```

#### Sprint Outcome

After Sprint 1, the application has a working authentication system, a fully configured organisational hierarchy (departments, teams, users with roles), and a navigation shell. An Admin can log in, create departments and teams, create individual or bulk-imported employee accounts, and those employees can accept their invites and log in. No task functionality exists yet — but the entire people and permissions infrastructure is in place. The system knows who everyone is, what team they are on, who their manager is, what timezone they work in, and what they are allowed to do.

---

### Sprint 2: Task Engine Core — Creation, Assignment, Status, and Completion

**Goal:** Employees and managers can create tasks with all fixed fields, assign them, move them through statuses, and complete them with mandatory completion reports. The reviewer flow works. The fundamental unit of work in Sunday is live.

**Duration Estimate:** 2.5 weeks for a 2-person team

#### UI/UX Feature List

**Page: My Tasks**
Purpose: An employee's personal view of all tasks assigned to them
URL Pattern: `/tasks`
Access: All roles

Layout Sections:
- Header: "My Tasks" title, task count, "New Task" button
- Filter bar: Status filter, priority filter, task type (planned/ad hoc), due date range
- Task list: Grouped by status (To Do, In Progress, In Review, Done), each task as a row/card

Components:
- Task row/card: Title, due date, priority badge, status badge, billable indicator, project/category tag
- Status filter tabs or dropdown
- Priority filter
- Sort options (due date, priority, created date)
- "New Task" button — opens quick creation modal

Actions Available:
- Click task: Navigate to task detail page
- New Task: Opens task creation modal
- Change status: Inline status change via dropdown (subject to rules — cannot skip to Done without report)

Data Displayed:
- Task title, assignee (self in this view), due date, estimated hours, priority, status, task type, task nature, billable badge, project

States:
- Empty state: "No tasks yet. Create your first task or wait for your manager to assign one."
- Loading state: Task card skeletons
- Error state: "Failed to load tasks. Please try again."

---

**Page: Task Detail**
Purpose: Full view of a single task — all fields, timeline, subtasks, completion report
URL Pattern: `/tasks/:id`
Access: Anyone who can view the task (assignee, creator, reviewer, manager of assignee's team, and above)

Layout Sections:
- Header: Task title (editable by creator/assignee), status badge, priority badge
- Main content area (left): Description (rich text, editable), subtasks list, dependencies, completion report section
- Sidebar (right): Metadata fields — assignee, creator, reviewer, due date, estimated hours, actual hours, review hours, task type, task nature, billable, project, custom fields
- Timeline tab: Full lifecycle log (read-only)
- Comments section: Threaded comments on the task

Components:
- Editable title (inline)
- Rich text description editor
- Sidebar metadata fields — each editable by appropriate roles (assignee can update status/actual hours, creator can reassign, manager can reassign)
- Subtask list: Add subtask button, each subtask shows title, status, assignee
- Dependency display: "Blocked by [Task X]" or "Blocks [Task Y]" with links
- Completion report area: Text input or file upload — appears when moving to Done
- Timeline: Chronological event list (read-only)
- Comment input + threaded comment display

Actions Available:
- Edit any editable field (role-permissioned)
- Change status: Via dropdown — enforces rules (cannot go to Done without report, cannot go to In Progress if dependency not met)
- Add subtask: Opens inline subtask creation
- Add dependency: Link to another task
- Submit completion report: Text or file — required before Done
- Add comment: Text input at bottom
- Reassign: Change assignee (manager+ or creator, logged in timeline)

Data Displayed:
- All task fields as listed in PAD §3.1
- Task Timeline events in chronological order
- Subtask list with statuses
- Comments thread

States:
- Normal state: Task with all data
- In Review state: Completion report visible, reviewer action buttons (Approve / Send Back)
- Done state: Read-only except comments and timeline
- Loading state: Field-level skeletons
- Error state: "Task not found" for invalid IDs / permission errors

---

**Page: Quick Task Creation Modal**
Purpose: Fast task creation from any screen — persistent access
URL Pattern: Modal overlay (no dedicated URL)
Access: All roles (scope of assignee selection depends on role)

Layout Sections:
- Compact form: Title, assignee, due date, estimated hours, priority, task type, task nature, billable toggle, project, reviewer (optional), description (optional, collapsible)

Components:
- Title input (required)
- Assignee selector: Self (default for employees), or team members (for managers+). Scoped by role.
- Due date picker (required)
- Estimated hours input (required)
- Priority selector: High / Medium / Low
- Task type toggle: Planned / Ad Hoc
- Task nature toggle: Core / Supporting
- Billable toggle: Only visible/enabled if user has billable permissions
- Project/Category selector (required)
- Reviewer selector (optional): Any user in the same team/department
- Description: Collapsible rich text area (optional)
- Create button, Cancel button

Actions Available:
- Create Task: Saves and closes modal, shows success toast, task appears in assignee's list
- Cancel: Closes modal without saving

States:
- Default: Form with sensible defaults (assignee = self, priority = medium, type = planned, nature = core)
- Validation errors: Inline per field
- Loading: Create button spinner
- Billable disabled state: Toggle greyed out with tooltip "Billable permissions not enabled for your account"

---

**Page: Team Tasks (Manager view)**
Purpose: Manager sees all tasks across their team
URL Pattern: `/team/tasks`
Access: Assistant Manager and above (scoped to their team/sub-team/department)

Layout Sections:
- Header: "Team Tasks" title, team name, task count, "New Task" button
- Filter bar: Assignee filter, status, priority, task type, task nature, billable, project, due date range, overdue only toggle
- Task list: Same format as My Tasks but showing all team members' tasks

Components:
- Same as My Tasks but with assignee column visible
- Assignee filter dropdown showing team members
- "Overdue Only" toggle filter
- All other filters from My Tasks

Actions Available:
- Click task: Navigate to task detail
- New Task: Opens quick creation modal (can assign to any team member)
- Reassign: Inline reassignment on task row (manager+ only)

Data Displayed:
- All task fields plus assignee name for each task

States:
- Same as My Tasks
- Empty state: "No tasks for your team yet. Create a task to get started."

---

#### Module Specifications

**Module: Task Engine**
Purpose: The atomic unit of Sunday — every piece of work lives as a task with full lifecycle tracking
Dependencies: User & Team Management, Role & Permission Engine
Connects To: Planning Module, Manager Dashboard, Notifications, Search & Filtering, Reporting, File Management

Core Functions:
- Create Task: Accepts all fixed fields (title, description, assignee, reviewer, due date, estimated hours, task type, task nature, billable, priority, project). Creator set automatically. Status defaults to "To Do". Triggers notification to assignee.
- Update Task: Any editable field. Every change logged in Task Timeline. Permissions enforced per role.
- Change Status: To Do → In Progress → In Review → Done. Enforces rules: cannot skip to Done without completion report, cannot move to In Progress if blocked by dependency, "In Review" only if reviewer is assigned.
- Submit Completion Report: Text or file upload. Required before task can move to Done. Stored permanently.
- Reviewer Flow: When assignee submits report, task moves to "In Review". Reviewer can mark Done or send back with comments.
- Reassign Task: Change assignee. Logs original assignee, new assignee, who made the change, when, and optional reason in timeline.
- Ad Hoc Backdating: Create task with status already set to Done + completion report + actual hours. For firefighter-type work already completed.
- Create Subtask: Nested task under parent. Inherits parent's project and assignee by default (overridable). Subtask shifts logged in parent timeline.
- Set Dependency: Link Task B to depend on Task A. Task B cannot move to In Progress until Task A is Done. System warns assignee and manager.

Data Model (Plain Language):
- Task: ID, title, description, creator_id, assignee_id, reviewer_id, due_date, estimated_hours, actual_hours, review_hours, task_type (planned/adhoc), task_nature (core/supporting), billable (boolean), priority (high/medium/low), status (todo/in_progress/in_review/done), project_id, parent_task_id (for subtasks), completion_report_text, completion_report_file_id, created_at, updated_at, completed_at
- Task Dependency: task_id, depends_on_task_id
- Project/Category: ID, name, team_id (or global)

Business Rules:
- Task cannot move to Done without a completion report (text or file) — system enforced
- If reviewer is assigned, only reviewer can mark Done (or Admin override)
- If no reviewer, assignee marks Done after submitting report
- Billable toggle only enabled for users with billable permissions
- Reassignment preserves full history — original assignment never deleted
- Subtask inherits parent project and assignee by default
- Dependencies are one-level for v1 (no chained dependency graphs)
- Status transitions: To Do ↔ In Progress → In Review → Done. No backwards from Done in v1 (flag for discussion).
- Ad hoc tasks can be created already-complete with backdated hours

API/Integration Needs:
- CRUD endpoints for tasks: POST/GET/PUT/DELETE `/api/tasks`
- GET `/api/tasks?assignee=X&status=Y&...` — filtered task list
- POST `/api/tasks/:id/status` — status change with validation
- POST `/api/tasks/:id/completion-report` — submit report
- POST `/api/tasks/:id/subtasks` — create subtask
- POST `/api/tasks/:id/dependencies` — set dependency
- CRUD for projects/categories

---

**Module: Task Timeline (Lifecycle Log)**
Purpose: Immutable chronological record of everything that happens to a task
Dependencies: Task Engine
Connects To: Task Detail UI, Audit Trail (system-level), Reporting

Core Functions:
- Log Event: Every task state change, assignment, reassignment, comment, file upload, dependency trigger, status change, and completion event creates a timeline entry
- Read Timeline: Returns all events for a task in chronological order

Data Model (Plain Language):
- Timeline Event: ID, task_id, event_type (created/assigned/status_changed/reassigned/comment/file_added/dependency_triggered/report_submitted/marked_done/custom_field_changed), actor_id (who did it), timestamp, old_value, new_value, metadata (JSON — e.g. reassignment reason)

Business Rules:
- Timeline is append-only — events cannot be edited or deleted
- Every write operation on a task must create a corresponding timeline event (enforced at the data layer)
- Timeline is visible to anyone who can view the task
- Events are displayed in chronological order (oldest first)

API/Integration Needs:
- GET `/api/tasks/:id/timeline` — returns all events
- Internal: `logTimelineEvent(taskId, eventType, actorId, oldValue, newValue, metadata)` — called by all task mutation functions

---

#### Task Breakdown

```
Task 2.1: Database Schema — Tasks, Projects, Timeline Events, Dependencies
Type: Backend
Description: Create database tables for tasks (all fixed fields), projects/categories, 
  task timeline events, and task dependencies. Include indexes for common queries 
  (by assignee, status, due date, team).
Depends On: Sprint 1 complete
Estimated Complexity: Complex
Acceptance Criteria:
- Tasks table with all fields from the PAD
- Projects table with name and team_id
- Timeline events table (task_id, event_type, actor, timestamps, old/new values)
- Dependencies table (task_id, depends_on_task_id)
- Appropriate indexes for query performance
- Row-level security: users can see tasks they are involved in or within their management scope

Task 2.2: Task CRUD API
Type: Backend
Description: Build API endpoints for creating, reading, updating, and deleting tasks. 
  Includes permission checks (who can create tasks for whom, who can edit what), 
  billable permission enforcement, and automatic timeline event logging on every mutation.
Depends On: 2.1
Estimated Complexity: Complex
Acceptance Criteria:
- POST /api/tasks creates a task with all fixed fields, enforces required fields
- GET /api/tasks returns filtered task list (by assignee, status, priority, project, date range, etc.)
- PUT /api/tasks/:id updates fields with permission checks
- Every mutation creates a timeline event automatically
- Assignee scope enforced by role (managers can only assign within their team)
- Billable toggle rejected if user lacks billable permissions
- Creator field auto-set from session

Task 2.3: Task Status Workflow
Type: Backend
Description: Implement the status transition logic with all business rules — 
  cannot skip to Done without completion report, reviewer flow (In Review gate), 
  dependency blocking (cannot start if dependency incomplete).
Depends On: 2.2
Estimated Complexity: Complex
Acceptance Criteria:
- Status transitions enforced: To Do ↔ In Progress → In Review → Done
- Cannot move to Done without completion report text or file
- If reviewer is assigned, task goes to In Review first — only reviewer or Admin can mark Done
- If no reviewer, assignee can mark Done directly after submitting report
- Cannot move to In Progress if blocked by incomplete dependency
- Send-back from reviewer returns task to In Progress with comment logged
- All status changes logged in timeline

Task 2.4: Subtask System
Type: Backend + Frontend
Description: Implement subtask creation, display, and management. Subtasks are nested 
  tasks that inherit parent project and assignee by default. Subtask status changes 
  logged in parent timeline.
Depends On: 2.2
Estimated Complexity: Medium
Acceptance Criteria:
- Subtask can be created under any task
- Subtask inherits parent's project and assignee (overridable)
- Subtask appears in parent task's detail view
- Subtask status changes logged in parent's timeline
- Subtask has its own timeline
- Subtask can have its own completion report

Task 2.5: Task Dependency System
Type: Backend + Frontend
Description: Implement one-level task dependencies. Task B depends on Task A — Task B 
  cannot move to In Progress until Task A is Done. Visual display and warnings.
Depends On: 2.2
Estimated Complexity: Medium
Acceptance Criteria:
- Dependency can be set between any two tasks
- Blocked task cannot move to In Progress — system returns error with explanation
- Dependency unblock triggers notification to blocked task's assignee
- Dependency displayed on task detail page ("Blocked by Task X" / "Blocks Task Y")
- Circular dependency detection (A blocks B blocks A — rejected)

Task 2.6: Completion Report Enforcement
Type: Backend + Frontend
Description: Build the completion report submission flow — text input or file upload — 
  and enforce that no task can be marked Done without it. Includes the reviewer 
  approve/send-back flow.
Depends On: 2.3
Estimated Complexity: Medium
Acceptance Criteria:
- Completion report section appears on task detail when status is In Progress or In Review
- Report can be text, file, or both
- System blocks status change to Done without a report
- Reviewer sees report and can approve (→ Done) or send back (→ In Progress) with comment
- Report is stored permanently and visible on the task detail page
- Timeline logs report submission and reviewer actions

Task 2.7: Ad Hoc Task Backdating
Type: Backend + Frontend
Description: Allow employees to create a task that is already complete — for work done 
  before it could be logged. Sets status to Done, requires actual hours and completion 
  report at creation time.
Depends On: 2.2, 2.6
Estimated Complexity: Simple
Acceptance Criteria:
- Quick task modal has an "Already completed" toggle
- When toggled, actual hours and completion report fields become required
- Task is created with status Done, completion date set to creation date (or configurable)
- Timeline shows: "Task created as completed (ad hoc)"
- Task type auto-set to "Ad Hoc"

Task 2.8: Task Reassignment
Type: Backend + Frontend
Description: Implement task reassignment with full history preservation. Manager+ can 
  reassign within their scope. Logs original assignee, new assignee, who made the change, 
  when, and optional reason.
Depends On: 2.2
Estimated Complexity: Medium
Acceptance Criteria:
- Reassign action available to managers (scoped to team), creators, and Admin
- Reassignment modal: new assignee selector, optional reason text field
- Timeline logs: "Reassigned from [A] to [B] by [C] — Reason: [text]"
- Notification sent to both old and new assignee
- Original assignment history never deleted

Task 2.9: My Tasks Page
Type: Frontend
Description: Build the personal tasks view — filtered list of all tasks assigned to 
  the logged-in user, grouped or filterable by status, with access to all task actions.
Depends On: 2.2, 2.3
Estimated Complexity: Medium
Acceptance Criteria:
- Displays all tasks assigned to current user
- Filterable by status, priority, task type, task nature, billable, project, due date range
- Sortable by due date, priority, created date
- Click task navigates to task detail
- "New Task" button opens quick creation modal
- Empty state for no tasks

Task 2.10: Task Detail Page
Type: Frontend
Description: Build the full task detail page with all sections — metadata sidebar, 
  description, subtasks, dependencies, completion report, timeline tab, comments.
Depends On: 2.2, 2.3, 2.4, 2.5, 2.6
Estimated Complexity: Complex
Acceptance Criteria:
- All task fields displayed and editable by appropriate roles
- Subtask list with add/edit/status change
- Dependency display with links to dependent/blocking tasks
- Completion report section with text input and file upload
- Timeline tab showing all events chronologically (read-only)
- Comment section with add and threaded display
- Status change dropdown enforcing all business rules
- Responsive layout (sidebar collapses on mobile)

Task 2.11: Quick Task Creation Modal
Type: Frontend
Description: Build the persistent quick task creation modal accessible from any screen. 
  Compact form with all required fields, role-scoped assignee selection, and billable 
  permission enforcement.
Depends On: 2.2
Estimated Complexity: Medium
Acceptance Criteria:
- Modal accessible via "New Task" button on all pages
- All required fields present: title, assignee, due date, estimated hours, priority, type, nature, billable, project
- Assignee selector scoped by role
- Billable toggle disabled if user lacks permissions
- Optional description (collapsible)
- Optional reviewer selector
- "Already completed" toggle for ad hoc backdating
- Task created on submit, success toast shown

Task 2.12: Team Tasks Page (Manager View)
Type: Frontend
Description: Build the team tasks page showing all tasks across the manager's team 
  scope, with assignee visibility and reassignment capabilities.
Depends On: 2.9, 2.8
Estimated Complexity: Medium
Acceptance Criteria:
- Displays all tasks for users within the manager's scope
- Assignee column visible
- All filters from My Tasks plus assignee filter
- Reassign action available inline
- "Overdue Only" toggle filter
- Access restricted to Assistant Manager and above

Task 2.13: Project/Category Management
Type: Full-stack
Description: Build basic project/category CRUD — create, edit, list. Projects are used 
  as a required field on tasks. Simple admin or manager function.
Depends On: 2.1
Estimated Complexity: Simple
Acceptance Criteria:
- Create project with name and optional team scope
- Edit project name
- List projects (filtered by team if team-scoped)
- Project selector on task creation and edit is populated from this data
- Manager+ and Admin can create projects
```

#### Sprint Outcome

After Sprint 2, the core task system is live. Employees can create tasks (self-assigned or receive manager-assigned tasks), move them through the status workflow, submit completion reports, and have tasks reviewed. Managers can create and assign tasks to their team, reassign tasks, and view all team tasks. Subtasks, dependencies, and ad hoc backdating all work. Every action is logged in the immutable task timeline. The quick task creation modal is available from every screen. This is the beating heart of Sunday — everything else layers on top of this.

---

### Sprint 3: Custom Fields and Task Board (Kanban)

**Goal:** Managers can create custom fields for their teams/projects, and all users get the Kanban task board view with full filtering and saved views. The task system reaches feature-completeness for v1.

**Duration Estimate:** 1.5 weeks for a 2-person team

#### UI/UX Feature List

**Page: Task Board (Kanban)**
Purpose: Visual board view of tasks organised by status columns
URL Pattern: `/board`
Access: All roles (data scoped by role)

Layout Sections:
- Header: "Task Board" title, filter bar, saved views dropdown, "New Task" button
- Board area: Four columns (To Do / In Progress / In Review / Done), cards in each column

Components:
- Kanban column: Status header with count, scrollable card list
- Task card: Title, assignee avatar/name, due date, priority indicator (colour), billable badge, overdue indicator
- Drag-and-drop: Move cards between columns (enforces status transition rules)
- Filter bar: Assignee, project, priority, task type, task nature, billable, date range, has reviewer, overdue only, custom field values
- Saved views dropdown: Personal and shared views
- "Save Current Filters" action

Actions Available:
- Drag card to new column: Changes status (enforces rules — prompts for completion report if moving to Done)
- Click card: Navigate to task detail
- Save view: Save current filter combination as named view
- New Task: Opens quick creation modal

Data Displayed:
- Per card: Title, assignee, due date, priority badge, billable indicator
- Per column: Status name, task count

States:
- Empty state: "No tasks match your filters" or "No tasks yet"
- Loading state: Column skeletons
- Drag blocked state: Visual indicator when a card cannot be dropped (e.g. dependency block, no completion report)

---

**Page: Custom Field Management**
Purpose: Manager/Admin creates and manages custom fields for a team or project
URL Pattern: `/settings/custom-fields` (or accessible from team settings)
Access: Manager and above

Layout Sections:
- Header: "Custom Fields" title, team/project selector, "Add Field" button
- Field list: Existing custom fields showing name, type, scope, status

Components:
- Custom field list: Name, field type (text/number/date/dropdown/checkbox), scope (team/project), created by
- Add field modal: Name, type selector, options (for dropdown type), scope selector
- Edit field: Rename, modify options (for dropdown)
- Archive field: Soft delete — preserves existing data, removes from new tasks

Actions Available:
- Add Field: Creates a new custom field
- Edit Field: Modify field properties
- Archive Field: Removes from new tasks, preserves existing data

States:
- Empty state: "No custom fields. Create one to track additional data on your team's tasks."

---

#### Module Specifications

**Module: Custom Fields Engine**
Purpose: Dynamic field creation and management for tasks, per team or project
Dependencies: Task Engine, User & Team Management
Connects To: Task Engine (field values on tasks), Search & Filtering (custom field filters), Reporting (custom fields in exports)

Core Functions:
- Create Custom Field: Name, type (text/number/date/dropdown/checkbox), options (for dropdown), scope (team/project)
- Edit Custom Field: Rename, modify dropdown options
- Archive Custom Field: Soft-delete — existing task values preserved, field hidden from new tasks
- Set Custom Field Value: On task creation or edit, set values for applicable custom fields
- Read Custom Field Values: Returned as part of task data for applicable tasks

Data Model (Plain Language):
- Custom Field Definition: ID, name, field_type, options (JSON for dropdown), scope_type (team/project), scope_id, created_by, status (active/archived), created_at
- Custom Field Value: ID, task_id, field_definition_id, value (stored as text, cast by type on read)

Business Rules:
- Only Managers and Admins can create custom fields
- Custom fields are scoped — a field created for Team A only appears on Team A's tasks
- Archiving a field preserves all existing values — they remain visible on tasks that used them
- System fixed fields (title, assignee, due date, status, completion report) cannot be modified or removed
- Custom field changes on tasks are logged in the task timeline

API/Integration Needs:
- CRUD endpoints for custom field definitions
- Endpoints for setting/reading custom field values on tasks
- Filter integration: custom fields appear as filter options in task views

---

#### Task Breakdown

```
Task 3.1: Database Schema — Custom Fields
Type: Backend
Description: Create tables for custom field definitions and custom field values. 
  Design for flexible storage (field values as text with type casting).
Depends On: Sprint 2 complete
Estimated Complexity: Medium
Acceptance Criteria:
- Custom field definition table with all fields
- Custom field value table linking tasks to field values
- Indexes on task_id and field_definition_id
- Flexible value storage supporting all types

Task 3.2: Custom Field CRUD API
Type: Backend
Description: API endpoints for creating, editing, archiving custom fields and 
  setting/reading values on tasks.
Depends On: 3.1
Estimated Complexity: Medium
Acceptance Criteria:
- CRUD for field definitions (Manager+ permission enforced)
- Set value endpoint — validates type and options
- Read values returned as part of task GET responses
- Archive endpoint soft-deletes (preserves existing values)
- Custom field changes logged in task timeline

Task 3.3: Custom Field Management UI
Type: Frontend
Description: Build the custom field management page with create/edit/archive 
  functionality.
Depends On: 3.2
Estimated Complexity: Medium
Acceptance Criteria:
- List of existing fields with type and scope
- Create field modal with all options
- Edit and archive actions
- Dropdown type shows options editor

Task 3.4: Custom Fields in Task Forms
Type: Frontend
Description: Integrate custom fields into task creation modal and task detail page. 
  Show applicable custom fields based on task's team/project scope.
Depends On: 3.2, 3.3
Estimated Complexity: Medium
Acceptance Criteria:
- Task creation modal shows applicable custom fields below fixed fields
- Task detail sidebar shows custom field values (editable)
- Custom fields render correctly by type (text input, number, date picker, dropdown, checkbox)
- Only active (non-archived) fields appear on new tasks
- Archived field values still visible on existing tasks

Task 3.5: Task Board (Kanban) — Backend Support
Type: Backend
Description: Ensure task API supports the query patterns needed for board view — 
  grouped by status, filtered by multiple criteria simultaneously.
Depends On: Sprint 2 complete
Estimated Complexity: Simple
Acceptance Criteria:
- GET /api/tasks supports simultaneous multi-filter query
- Results can be grouped by status
- Performance acceptable for team-size datasets

Task 3.6: Task Board (Kanban) — Frontend
Type: Frontend
Description: Build the Kanban board with four status columns, task cards, 
  drag-and-drop status changes, full filter bar, and saved views.
Depends On: 3.5
Estimated Complexity: Complex
Acceptance Criteria:
- Four columns: To Do, In Progress, In Review, Done
- Cards show: title, assignee, due date, priority colour, billable badge
- Drag-and-drop between columns enforces status rules
- Dragging to Done triggers completion report prompt
- Drag blocked visual for dependency-blocked tasks
- Full filter bar with all criteria including custom fields
- Responsive (simplified for mobile)

Task 3.7: Saved Views
Type: Full-stack
Description: Implement saved filter views — users can save a filter combination 
  as a named view. Personal views are private. Managers can create shared views 
  visible to their team.
Depends On: 3.6
Estimated Complexity: Medium
Acceptance Criteria:
- "Save View" action saves current filters with a name
- Personal views visible only to creator
- Shared views (Manager+) visible to entire team
- Saved views appear in dropdown on task board and task list
- Edit and delete saved views
- Default view per user (setting)
```

#### Sprint Outcome

After Sprint 3, the task system is feature-complete for v1. Managers can create custom fields to track team-specific data, all users have a Kanban board view with drag-and-drop, and filter combinations can be saved as reusable views. The task creation and management workflow now covers every requirement from the Phase 1 feature list.

---

### Sprint 4: Planning Module — Weekly Plans, Daily Check-ins, EOD Wrap-ups

**Goal:** Employees can plan their weeks by assigning tasks to days, submit their plans (locked or fluid mode), do morning check-ins and end-of-day wrap-ups, and managers can see and comment on plans. The carry-over system handles incomplete tasks.

**Duration Estimate:** 2.5 weeks for a 2-person team

#### UI/UX Feature List

**Page: My Weekly Plan**
Purpose: Employee plans their work week by assigning tasks to specific days with estimated hours
URL Pattern: `/plan` or `/plan/week/:weekStart`
Access: All employee roles

Layout Sections:
- Header: Week selector (prev/next arrows, week date range display), submission status badge, "Submit Plan" button (locked mode only)
- Week grid: Columns for each day of the employee's work week, rows for tasks. Each cell shows planned hours.
- Summary row: Total planned hours per day vs available hours (colour-coded)
- Unplanned tasks area: Tasks assigned to the employee not yet slotted into the plan

Components:
- Week navigation: Arrows + date range display
- Day columns: Based on user's configured work week (e.g. Sun–Thu shows 5 columns for those days)
- Task slots per day: Drag tasks from unplanned area into day slots, set estimated hours per day
- Carry-over indicators: Tasks rolled from previous days marked with a carry-over badge
- Summary footer: Planned hours / Available hours per day — Green (80–100%), Amber (50–79% or >110%), Red (<50% or empty)
- Submit Plan button: Visible in locked mode, locks the plan after submission
- Submission status badge: "Not Submitted" / "Submitted at [time]" / "Fluid Mode — always editable"
- Manager comments section: Comments from manager displayed below the plan

Actions Available:
- Drag task to day: Assigns task to that day's plan with hour estimate
- Remove task from day: Returns to unplanned
- Adjust hours: Change planned hours per task per day
- Submit Plan: Locks plan (in locked mode), sends notification
- Navigate weeks: View past or future weeks

Data Displayed:
- Tasks with title, estimated hours, priority
- Planned hours vs available hours per day
- Carry-over badges on rolled tasks
- Manager comments with timestamps

States:
- Empty state: "Your plan is empty. Drag tasks into your days to plan your week."
- Submitted state: Plan locked (locked mode), fields greyed out, "Submitted at [time]" badge
- Overdue warning: Submission deadline passed, prominent "Plan not submitted" warning
- Fluid mode: No submit button, always editable, status shows "Fluid Mode"

---

**Page: Daily Check-in**
Purpose: Brief morning confirmation of today's focus
URL Pattern: `/checkin` (or modal/prompt on login)
Access: All employee roles

Layout Sections:
- Today's planned tasks: Pre-populated from weekly plan for today
- Focus notes: Optional text area for additional context
- Submit button

Components:
- Task list (read-only): Tasks planned for today from weekly plan, showing title and planned hours
- Add task option: "Working on something not in your plan?" — opens quick task creation
- Notes input: Short text field for anything else the employee wants to flag
- Submit button: Confirms check-in for the day

Actions Available:
- Submit Check-in: Records the check-in with timestamp
- Add unplanned task: Opens quick task creation (pre-set to "Ad Hoc")

Data Displayed:
- Today's planned tasks with hours
- Yesterday's carry-overs (if any)

States:
- Not submitted: Form ready
- Already submitted today: Shows submitted check-in (read-only) with timestamp
- No plan for today: Warning — "You have no tasks planned for today. Add tasks or check in anyway."
- Optional state: If team does not have mandatory check-in, shows as a dismissible prompt

---

**Page: EOD Wrap-up**
Purpose: End-of-day summary — what was done vs what was planned
URL Pattern: `/wrapup` (or modal/prompt at end of day)
Access: All employee roles

Layout Sections:
- Planned vs Actual comparison: Table showing today's planned tasks, their status, planned hours, actual hours logged
- Auto-filled data: System pre-fills based on task status changes during the day
- Discrepancy flags: Tasks marked done in wrap-up but still In Progress in task system (and vice versa)
- Notes input: Free text for additional context
- Submit button

Components:
- Task comparison table: Task title, planned hours, actual hours, status (auto-populated), match indicator
- Discrepancy alerts: "You reported [task] as done but it is still In Progress — update the task or correct this"
- Notes text area
- Submit button

Actions Available:
- Confirm wrap-up: Submit with auto-filled data
- Override status: Flag a task as done in the wrap-up (triggers prompt to update task status)
- Add notes: Additional context

Data Displayed:
- Tasks planned for today vs actual completions
- Hours planned vs hours logged
- Carry-over candidates (tasks not completed today)

States:
- Pre-filled: System auto-populates from task activity
- Discrepancy state: Highlights mismatches between wrap-up and task statuses
- Submitted: Read-only with timestamp
- Optional state: Dismissible if team doesn't require mandatory EOD

---

**Page: Team Plans View (Manager)**
Purpose: Manager sees all team members' weekly plans in one view
URL Pattern: `/team/plans` or `/team/plans/week/:weekStart`
Access: Assistant Manager and above

Layout Sections:
- Header: Week selector, team name
- Plan grid: One row per employee, columns for each day, planned hours per cell
- Submission status column: Submitted / Not Submitted / Fluid Mode per employee
- Comment action per employee

Components:
- Employee rows: Name, submission status badge
- Day cells: Planned hours (colour-coded by capacity), click to expand and see task list for that day
- Big fat warning: Prominent alert row at top for any employee with zero planned hours on any day
- Comment button per employee: Opens comment panel for that employee's plan

Actions Available:
- Expand day cell: See tasks behind the number
- Comment on plan: Add comment visible to the employee
- Navigate weeks: View past/future weeks

States:
- All planned: Clean grid, green cells
- Warnings present: Big fat warning banner — "[Employee] has zero hours planned for [Day]"
- Deadline missed: Employee row highlighted — "Plan not submitted by deadline"

---

#### Module Specifications

**Module: Planning Module**
Purpose: Structures employee time into planned weeks, daily confirmations, and end-of-day accountability
Dependencies: Task Engine (tasks are what get planned), User & Team Management (timezone, work week, team planning mode)
Connects To: Manager Dashboard (capacity grid), Notifications (deadline alerts), Reporting (plan compliance)

Core Functions:
- Create/Edit Weekly Plan: Assign tasks to specific days of the employee's work week with estimated hours per day. Respects employee's configured work week pattern.
- Submit Plan (Locked Mode): Formally submits the plan by the team's deadline. Plan becomes read-only until manager unlocks.
- Plan Submission Deadline Enforcement: System checks deadline (day + time in employee's timezone). If missed, triggers notification to employee and urgent email to manager.
- Daily Check-in: Employee confirms morning focus. Pre-populated from plan. Optional per team (mandatory configurable).
- EOD Wrap-up: End-of-day summary auto-filled from task activity. Employee confirms or adds notes. Optional per team (mandatory configurable).
- Carry-over: Tasks not completed on their planned day auto-roll to next working day. Employee notified. Carry-over logged visibly on the plan.
- Plan Comments (Manager): Manager can comment on any employee's plan. Comments visible to the employee.
- Manager Unlock: In locked mode, manager can unlock a submitted plan for the employee to edit.

Data Model (Plain Language):
- Weekly Plan: ID, user_id, week_start_date, submission_status (draft/submitted/fluid), submitted_at, locked (boolean)
- Plan Entry: ID, plan_id, task_id, day_of_week, planned_hours
- Daily Check-in: ID, user_id, date, tasks_json (snapshot of planned tasks), notes, submitted_at
- EOD Wrap-up: ID, user_id, date, planned_tasks_json, actual_tasks_json, notes, discrepancies_json, submitted_at
- Plan Comment: ID, plan_id, author_id, text, created_at

Business Rules:
- Work week is per employee — plan shows only their configured working days
- Submission deadline is per team, applied in employee's timezone
- Locked mode: plan is read-only after submission unless manager unlocks
- Fluid mode: plan is always editable, no formal submission
- Carry-over happens automatically at end of day (based on employee's timezone)
- Daily check-in and EOD wrap-up can be mandatory or optional per team
- Managers cannot edit an employee's plan — only comment
- EOD wrap-up is pre-filled by system from task activity — not manual double-entry
- Plan submission compliance is tracked (used in reporting)

API/Integration Needs:
- CRUD for weekly plans and plan entries
- POST `/api/plans/:id/submit` — formal submission
- POST `/api/plans/:id/unlock` — manager unlock
- CRUD for daily check-ins and EOD wrap-ups
- POST `/api/plans/:id/comments` — manager comments
- Background job: carry-over at end of each working day per timezone
- Background job: deadline check — triggers notifications when missed

---

#### Task Breakdown

```
Task 4.1: Database Schema — Plans, Check-ins, Wrap-ups, Plan Comments
Type: Backend
Description: Create tables for weekly plans, plan entries (task-day-hours), daily 
  check-ins, EOD wrap-ups, and plan comments.
Depends On: Sprint 2 complete
Estimated Complexity: Medium
Acceptance Criteria:
- Weekly plan table with submission status and lock flag
- Plan entries table linking plans to tasks per day
- Check-in and wrap-up tables with snapshot data
- Plan comments table
- Indexes on user_id + week_start_date

Task 4.2: Weekly Plan CRUD API
Type: Backend
Description: API for creating and editing weekly plans — assigning tasks to days 
  with hours. Includes submit, lock/unlock, and plan comments.
Depends On: 4.1
Estimated Complexity: Complex
Acceptance Criteria:
- Create/update plan entries (task → day → hours)
- Submit endpoint locks plan in locked mode
- Unlock endpoint available to managers
- Plan respects employee's configured work week (only their working days)
- Plan comments CRUD (manager+ only)
- Validation: planned hours per day surfaced (warnings, not blocks)

Task 4.3: Daily Check-in API
Type: Backend
Description: API for submitting and retrieving daily check-ins. Pre-populates from 
  weekly plan.
Depends On: 4.2
Estimated Complexity: Medium
Acceptance Criteria:
- GET returns pre-populated check-in from plan for today
- POST submits check-in with timestamp
- Respects team mandatory/optional setting
- One check-in per user per day

Task 4.4: EOD Wrap-up API
Type: Backend
Description: API for end-of-day wrap-ups. Auto-fills from task activity during the day. 
  Detects discrepancies between wrap-up and task statuses.
Depends On: 4.2
Estimated Complexity: Complex
Acceptance Criteria:
- GET returns pre-filled wrap-up from task status changes today
- Discrepancy detection: task marked complete in wrap-up but still In Progress
- POST submits wrap-up with notes
- Respects team mandatory/optional setting
- One wrap-up per user per day

Task 4.5: Carry-over Background Job
Type: Backend
Description: Background job that runs at end of each employee's working day (timezone-aware), 
  identifies incomplete planned tasks, and rolls them to the next working day. Creates 
  carry-over entries and triggers notifications.
Depends On: 4.2
Estimated Complexity: Complex
Acceptance Criteria:
- Runs per timezone at end of each working day
- Identifies tasks planned for today that are not Done
- Creates plan entry for next working day (respects employee's work week — skips non-working days)
- Marks original entry as carried over
- Triggers in-app notification to employee
- Carry-over visible as badge/indicator on plan

Task 4.6: Plan Submission Deadline Check
Type: Backend
Description: Background job that checks whether plans have been submitted by the team 
  deadline. Triggers notifications when deadlines are missed.
Depends On: 4.2
Estimated Complexity: Medium
Acceptance Criteria:
- Runs at each team's configured deadline time (in each employee's timezone)
- Checks if plan is submitted (or if team is in fluid mode — skip)
- Missing submission: in-app notification to employee + urgent email to manager
- Logged for plan submission compliance tracking

Task 4.7: My Weekly Plan UI
Type: Frontend
Description: Build the weekly plan page — week grid with day columns, drag tasks 
  from unplanned area, hours per day, capacity summary, submit flow.
Depends On: 4.2
Estimated Complexity: Complex
Acceptance Criteria:
- Day columns match employee's work week
- Drag-and-drop tasks from unplanned area to days
- Hours adjustable per task per day
- Summary row: planned vs available, colour-coded
- Submit button (locked mode) with confirmation
- Submission status badge
- Week navigation
- Carry-over badges on rolled tasks
- Manager comments displayed

Task 4.8: Daily Check-in UI
Type: Frontend
Description: Build the daily check-in page/modal — pre-populated tasks, notes input, 
  submit action.
Depends On: 4.3
Estimated Complexity: Simple
Acceptance Criteria:
- Shows today's planned tasks from weekly plan
- Notes input field
- Submit confirms check-in
- Already-submitted state (read-only with timestamp)
- Prompt on login if not yet submitted (for mandatory teams)

Task 4.9: EOD Wrap-up UI
Type: Frontend
Description: Build the EOD wrap-up page/modal — auto-filled comparison, discrepancy 
  flags, notes, submit.
Depends On: 4.4
Estimated Complexity: Medium
Acceptance Criteria:
- Pre-filled from task activity
- Planned vs actual comparison table
- Discrepancy alerts with action prompts
- Notes text area
- Submit with confirmation
- Already-submitted state (read-only)

Task 4.10: Team Plans View (Manager)
Type: Frontend
Description: Build the manager's team plans overview — all employees' plans in a grid, 
  submission status, big fat warning for unplanned employees, comment actions.
Depends On: 4.2, 4.7
Estimated Complexity: Complex
Acceptance Criteria:
- One row per team member, day columns
- Planned hours per cell, colour-coded
- Submission status per employee
- Big fat warning for zero-planned days
- Expand day cell to see tasks
- Comment action per employee
- Week navigation
- Scope matches manager's access (team/department)
```

#### Sprint Outcome

After Sprint 4, the planning discipline is live. Employees can plan their work weeks by assigning tasks to days, submit plans by their team's deadline, do morning check-ins and end-of-day wrap-ups. Managers see all team plans in one view, can comment on plans, and get alerts when employees miss deadlines or have unplanned days. Carry-over handles incomplete work automatically. The two core questions Sunday answers — "Did they do it?" and "Are their days planned?" — now have data feeding them.

---

### Sprint 5: Manager Dashboard — Capacity Grid, Workload View, Activity Feed

**Goal:** Managers get their command centre — My Overview, Team Pulse with capacity grid and the big fat warning, Workload View with real-time utilisation, and a live activity feed. Senior Managers see cross-team.

**Duration Estimate:** 2 weeks for a 2-person team

#### UI/UX Feature List

**Page: Dashboard — My Overview**
Purpose: Personal dashboard for any user showing their own task and plan status
URL Pattern: `/dashboard` (default landing after login)
Access: All roles

Layout Sections:
- Today's tasks widget: Tasks due today — in progress, completed, overdue
- Weekly completion rate widget: Tasks done vs total this week (progress bar/donut)
- Upcoming deadlines widget: Tasks due in next 3 days
- Carry-over widget: Tasks that rolled over from previous days

Components:
- Task summary cards per widget
- Completion rate visual (progress bar or donut chart)
- Click-through: Any task in a widget navigates to task detail

States:
- Fresh start: "Welcome to Sunday. Your first task will appear here when it's assigned."
- Active: Populated widgets
- All clear: "All caught up — no overdue tasks, no carry-overs."

---

**Page: Dashboard — Team Pulse**
Purpose: Manager's primary view — team capacity, planning status, overdue alerts
URL Pattern: `/dashboard/team-pulse`
Access: Assistant Manager and above

Layout Sections:
- Big fat warning zone: Top of page, impossible to miss — employees with zero planned tasks
- Capacity grid: Employees as rows, work-week days as columns, planned vs available hours per cell
- Overdue task list: Tasks past due, grouped by employee
- Completion rate per employee: This week's done vs committed

Components:
- Warning banner: "[Employee] has no tasks planned for [Day]" — red, prominent, per employee, per day. Cannot be dismissed without action.
- Capacity grid table: Each cell shows "X / Y hrs" (planned / available), colour-coded — Green (80–100%), Amber (50–79% or >110%), Red (<50% or empty)
- Click cell to expand: Shows tasks behind the number
- Overdue list: Task title, assignee, due date, days overdue
- Completion rate bars per employee

Actions Available:
- Click cell: Expand to see tasks for that employee on that day
- Click overdue task: Navigate to task detail
- Quick task creation: Button always visible

States:
- All good: Green grid, no warnings, no overdue
- Warnings present: Red cells, big fat warning banner
- Loading: Grid skeleton

---

**Page: Dashboard — Workload View**
Purpose: Real-time utilisation — planned vs actual hours logged
URL Pattern: `/dashboard/workload`
Access: Manager and above

Layout Sections:
- Utilisation grid: Same layout as capacity grid but showing planned hours vs actual logged hours
- Real-time updates as tasks are completed

Components:
- Grid: Employee rows, day columns, "Planned X / Actual Y hrs" per cell
- Colour coding: Mirrors capacity grid
- Click cell to see task details

---

**Page: Activity Feed**
Purpose: Live stream of team activity
URL Pattern: Side panel or `/dashboard/activity`
Access: All roles (scoped — employees see own task activity, managers see team)

Layout Sections:
- Chronological feed: Most recent activity at top
- Feed entries: "[Person] [action] [object] — [timestamp]"

Components:
- Activity entries: Avatar, name, action description, timestamp
- Filter: By activity type (task created, status changed, plan submitted, etc.)
- Infinite scroll / load more

---

#### Module Specifications

**Module: Manager Dashboard**
Purpose: Centralised visibility for managers — capacity, workload, overdue, completion rates, activity
Dependencies: Task Engine, Planning Module, User & Team Management
Connects To: Notifications (overdue alerts), Reporting

Core Functions:
- My Overview: Aggregate current user's task data — due today, completion rate, deadlines, carry-overs
- Team Pulse: Aggregate team data — capacity grid (planned vs available per employee per day), big fat warning for unplanned, overdue list, completion rates
- Workload View: Real-time planned vs actual hours per employee per day
- Activity Feed: Scoped event stream — employees see own tasks, managers see team

Data Model (Plain Language):
- No new tables required — dashboard is computed from task, plan, and user data
- Activity Feed may benefit from a denormalised activity_events table (user_id, event_type, description, target_id, timestamp) for performance

Business Rules:
- Capacity grid respects each employee's work week and timezone
- Big fat warning: Any employee with zero planned hours on a working day triggers the warning. Cannot be dismissed without the employee submitting a plan or the manager explicitly acknowledging it (creates audit log).
- Completion rate: Calculated as tasks with status Done this week / total tasks committed this week
- Available hours from user profile — default 8, overridable by Admin
- Senior Managers see aggregated data across all teams in their department
- Admin sees system-wide

API/Integration Needs:
- GET `/api/dashboard/my-overview` — aggregated personal stats
- GET `/api/dashboard/team-pulse` — capacity grid data, overdue list, completion rates
- GET `/api/dashboard/workload` — planned vs actual per employee per day
- GET `/api/activity-feed` — scoped activity events (paginated)

---

#### Task Breakdown

```
Task 5.1: Dashboard Data Aggregation API — My Overview
Type: Backend
Description: API endpoint returning aggregated personal stats — today's tasks, 
  weekly completion rate, upcoming deadlines, carry-overs.
Depends On: Sprints 2-4 complete
Estimated Complexity: Medium
Acceptance Criteria:
- Returns today's tasks (due today, in progress, overdue)
- Weekly completion rate calculation
- Next 3 days' deadlines
- Carry-over list
- All data respects employee's timezone

Task 5.2: Dashboard Data Aggregation API — Team Pulse
Type: Backend
Description: API endpoint returning team capacity grid data, big fat warning triggers, 
  overdue task list, and per-employee completion rates.
Depends On: 5.1
Estimated Complexity: Complex
Acceptance Criteria:
- Capacity grid: planned vs available per employee per day of their work week
- Colour code thresholds applied server-side
- Big fat warning: returns list of employees with zero planned days
- Overdue tasks grouped by employee
- Completion rate per employee this week
- Scope restricted by requesting user's role

Task 5.3: Dashboard Data Aggregation API — Workload View
Type: Backend
Description: API endpoint returning planned vs actual hours per employee per day, 
  updated in real-time from task completions.
Depends On: 5.1
Estimated Complexity: Medium
Acceptance Criteria:
- Planned hours from plan entries
- Actual hours from task completion logs
- Per employee per day
- Real-time (or near-real-time) data freshness

Task 5.4: Activity Feed System
Type: Backend
Description: Create activity events table and write logic that generates feed entries 
  from task and plan events. Build scoped read API (employees see own, managers see team).
Depends On: Sprint 2 complete
Estimated Complexity: Medium
Acceptance Criteria:
- Activity events table (user_id, event_type, description, target_id, timestamp)
- Events generated on: task created, status changed, assigned, reassigned, 
  plan submitted, check-in, wrap-up, comment added
- Scoped read: employees see events on their tasks, managers see team events
- Paginated API endpoint

Task 5.5: My Overview Dashboard UI
Type: Frontend
Description: Build the personal overview dashboard with today's tasks, completion rate, 
  deadlines, and carry-overs widgets.
Depends On: 5.1
Estimated Complexity: Medium
Acceptance Criteria:
- All four widgets populated with real data
- Completion rate as visual (progress bar or donut)
- Click-through to task detail
- Responsive layout
- Empty/loading/error states

Task 5.6: Team Pulse Dashboard UI
Type: Frontend
Description: Build the Team Pulse page — capacity grid, big fat warning, overdue list, 
  completion rates. The manager's primary screen.
Depends On: 5.2
Estimated Complexity: Complex
Acceptance Criteria:
- Capacity grid with colour-coded cells
- Big fat warning: prominent, top of page, cannot be missed
- Overdue list grouped by employee
- Completion rate per employee
- Click cell to expand tasks
- Quick task creation button
- Responsive (simplified grid on mobile)

Task 5.7: Workload View UI
Type: Frontend
Description: Build the workload utilisation grid — planned vs actual hours, real-time 
  updates, same layout as capacity grid.
Depends On: 5.3
Estimated Complexity: Medium
Acceptance Criteria:
- Grid: employee rows, day columns, planned/actual hours
- Colour coding matching capacity grid
- Click cell to see tasks
- Updates without full page refresh

Task 5.8: Activity Feed UI
Type: Frontend
Description: Build the activity feed as a side panel or dedicated tab — chronological, 
  scoped, filterable.
Depends On: 5.4
Estimated Complexity: Medium
Acceptance Criteria:
- Chronological feed, newest first
- Avatar, name, action, timestamp per entry
- Filter by activity type
- Infinite scroll or load more
- Accessible from any dashboard view
```

#### Sprint Outcome

After Sprint 5, managers have their command centre. My Overview shows each user's personal task status. Team Pulse gives managers the capacity grid with colour coding and the unmissable big fat warning when employees have unplanned days. The Workload View shows real-time utilisation. The Activity Feed provides a live stream of team events. The system now answers both core questions with data — managers can see at a glance whether their team committed to work and whether their days are planned.

---

### Sprint 6: Notification System

**Goal:** All 13 notification triggers are live — in-app notifications for everything, urgent email notifications for overdue tasks, missed plan submissions, and unplanned employees. Configurable opt-outs on select notifications.

**Duration Estimate:** 1.5 weeks for a 2-person team

#### Module Specifications

**Module: Notification System**
Purpose: Ensure the right people know the right things at the right time — in-app always, email for urgent events
Dependencies: Task Engine, Planning Module, User & Team Management
Connects To: All modules (events trigger notifications)

Core Functions:
- Create Notification: Generated by system events. Stores recipient, type, message, link, read status, channel (in-app / email / both).
- Read Notifications: Return unread and recent notifications for a user.
- Mark Read: Single or bulk mark-as-read.
- Email Dispatch: For urgent triggers (overdue, missed plan, unplanned employee), send email in addition to in-app.
- Preference Management: Some notifications are optionally disableable (task marked Done, comment on plan, comment on task).

Data Model (Plain Language):
- Notification: ID, recipient_user_id, type (one of 13 triggers), title, message, link (URL to relevant page), read (boolean), channel (in_app / email / both), created_at
- Notification Preference: user_id, notification_type, enabled (boolean) — only for optional notifications

Business Rules:
- 10 of 13 notification types cannot be disabled by the user
- 3 can be disabled: task marked Done, comment on plan, comment on task
- Email is sent only for: overdue task, plan not submitted by deadline, employee has zero tasks planned
- All notifications link to the relevant resource (task, plan, etc.)
- Notifications are never deleted — marked read only

API/Integration Needs:
- GET `/api/notifications` — paginated, filterable by read status
- POST `/api/notifications/:id/read` — mark read
- POST `/api/notifications/read-all` — bulk mark read
- PUT `/api/notifications/preferences` — update opt-out settings
- Email service integration (transactional email — same as auth emails)
- Event listener/hook system: task events, plan events, and dashboard triggers dispatch notifications

#### Task Breakdown

```
Task 6.1: Database Schema — Notifications and Preferences
Type: Backend
Description: Create notifications table and notification preferences table.
Depends On: Sprints 1-5 complete
Estimated Complexity: Simple
Acceptance Criteria:
- Notifications table with all fields
- Preferences table with user_id, type, enabled
- Index on recipient_user_id + read status

Task 6.2: Notification Generation Logic
Type: Backend
Description: Build the event-to-notification mapping. Hook into task and plan events 
  to generate appropriate notifications per the 13 triggers in the PAD.
Depends On: 6.1
Estimated Complexity: Complex
Acceptance Criteria:
- All 13 triggers generate correct notifications
- Correct recipients per trigger
- Correct channel (in-app only vs in-app + email) per trigger
- Preference checks applied (optional notifications respect user settings)
- Links point to correct resource

Task 6.3: Email Dispatch for Urgent Notifications
Type: Backend
Description: Implement email sending for the three urgent notification types — overdue 
  task, missed plan deadline, unplanned employee.
Depends On: 6.2
Estimated Complexity: Medium
Acceptance Criteria:
- Email sent on: task overdue (to assignee + manager), plan not submitted (to employee + manager), 
  zero tasks planned (to manager)
- Email contains: clear subject, relevant details, link to the app
- Email delivery reliable (retry logic, error handling)
- Does not send duplicate emails

Task 6.4: Notification API
Type: Backend
Description: CRUD endpoints for reading notifications, marking read, and managing 
  preferences.
Depends On: 6.1
Estimated Complexity: Simple
Acceptance Criteria:
- GET returns paginated notifications for current user
- Mark read and mark all read work correctly
- Preferences update endpoint validates only optional types

Task 6.5: Notification UI — Bell Icon, Panel, and Settings
Type: Frontend
Description: Build the notification bell in the top bar, notification dropdown/panel 
  showing recent notifications, mark-read actions, and notification preference settings.
Depends On: 6.4
Estimated Complexity: Medium
Acceptance Criteria:
- Bell icon in top bar with unread count badge
- Click opens notification panel/dropdown
- Each notification shows: type icon, message, timestamp, read/unread indicator
- Click notification: marks read + navigates to linked resource
- "Mark all read" action
- Notification preferences in user settings (toggle for optional types)
- Real-time or near-real-time updates (new notifications appear without refresh)
```

#### Sprint Outcome

After Sprint 6, the notification system is fully operational. Every significant event in Sunday triggers appropriate notifications. Overdue tasks, missed plan deadlines, and unplanned employees generate urgent emails to managers. Users see a live notification bell with unread count, and can manage their preferences for optional notification types. The system actively surfaces problems instead of waiting for managers to discover them.

---

### Sprint 7: Global Search and Advanced Filtering

**Goal:** Full-text search across all task data, global search bar accessible from every screen, and advanced filtering with custom field support.

**Duration Estimate:** 1 week for a 2-person team

#### Module Specifications

**Module: Search & Filtering**
Purpose: Find anything in Sunday quickly — tasks, people, projects, completion reports
Dependencies: Task Engine, Custom Fields Engine, User & Team Management
Connects To: All list/board views

Core Functions:
- Global Search: Full-text search across task titles, descriptions, assignee names, project names, and completion reports. Results ranked by relevance.
- Advanced Filters: Multi-criteria filtering on all task fields including custom fields.
- Saved Views: Already built in Sprint 3 — this sprint extends filter options.

Business Rules:
- Search results are scoped by the user's role (employees see own tasks, managers see team, etc.)
- Archived tasks appear in search results but clearly marked as archived
- Search is accessible via persistent search bar on every screen
- Minimum 2 characters to trigger search

API/Integration Needs:
- GET `/api/search?q=keyword` — full-text search endpoint
- Full-text search index on task titles, descriptions, completion reports, assignee names, project names
- Extend existing task filter API to support custom field value filtering

#### Task Breakdown

```
Task 7.1: Full-Text Search Implementation
Type: Backend
Description: Implement full-text search across task data. Use Supabase full-text search 
  (PostgreSQL tsvector) or equivalent. Index task titles, descriptions, completion reports, 
  assignee names, project names.
Depends On: Sprints 1-3 complete
Estimated Complexity: Complex
Acceptance Criteria:
- Search returns relevant results across all indexed fields
- Results ranked by relevance
- Results scoped by user's role and team
- Performance acceptable (<500ms for team-size datasets)
- Archived tasks included in results, flagged as archived
- Minimum 2 characters to trigger

Task 7.2: Custom Field Filtering
Type: Backend
Description: Extend task filter API to support filtering by custom field values. 
  Dynamic filter — custom fields vary by team/project.
Depends On: Sprint 3 complete
Estimated Complexity: Medium
Acceptance Criteria:
- Filter API accepts custom field ID + value pairs
- Works with all custom field types (text search, number range, date range, dropdown match, checkbox boolean)
- Integrates with saved views (custom field filters can be saved)

Task 7.3: Global Search UI
Type: Frontend
Description: Build the persistent global search bar in the top navigation. Shows 
  instant results as user types. Categorised results (tasks, projects, people).
Depends On: 7.1
Estimated Complexity: Medium
Acceptance Criteria:
- Search bar visible on every screen (top nav)
- Instant results as user types (debounced)
- Results categorised: Tasks, Projects, People
- Click result navigates to relevant page
- "No results" state
- Keyboard shortcut to focus search (Ctrl+K / Cmd+K)

Task 7.4: Custom Field Filters in UI
Type: Frontend
Description: Add custom field filter options to the task board and task list filter 
  bars. Dynamic — shows only fields applicable to the selected team/project.
Depends On: 7.2
Estimated Complexity: Medium
Acceptance Criteria:
- Custom fields appear as filter options alongside fixed field filters
- Filter type matches field type (text search, dropdown select, date picker, etc.)
- Only applicable custom fields shown (based on team/project scope)
- Works with saved views
```

#### Sprint Outcome

After Sprint 7, users can search for anything in Sunday from any screen. Full-text search covers tasks, descriptions, completion reports, people, and projects. Filters support all fixed and custom fields. The system is fully navigable at scale — even as task volume grows, finding specific work is fast.

---

### Sprint 8: File Management

**Goal:** File attachments on tasks (completion reports and supporting docs) and planning wrap-ups, with in-app preview for PDFs and images, secure storage, and permanent retention.

**Duration Estimate:** 1 week for a 2-person team

#### Module Specifications

**Module: File Management**
Purpose: Attach, store, preview, and permanently retain files on tasks and wrap-ups
Dependencies: Task Engine, Planning Module
Connects To: Task Detail (attachment display), Reporting (attachments in exports), Archiving (file retention)

Core Functions:
- Upload File: Attach file to task (completion report or supporting doc) or EOD wrap-up. Validates file type and size.
- Download File: Download attached file.
- Preview File: In-app preview for PDFs and images without downloading.
- Delete File: Files linked to tasks cannot be deleted — they are permanent. Only unattached uploads can be removed.

Data Model (Plain Language):
- File: ID, filename, file_type, file_size, storage_path, uploaded_by, uploaded_at, task_id (or wrap_up_id), permanent (boolean — true once attached to a task)

Business Rules:
- Supported types: PDF, DOCX, XLSX, JPG, PNG, common video formats
- Maximum file size: TBD by technical team (flagged as open question)
- Files on tasks are permanent — cannot be deleted even if the task is archived
- Deleting a task archives it; files persist
- In-app preview required for PDF and images at minimum
- File uploads logged in task timeline

API/Integration Needs:
- POST `/api/files/upload` — multipart upload with task/wrap-up association
- GET `/api/files/:id` — download file
- GET `/api/files/:id/preview` — preview URL (signed URL from storage)
- Supabase Storage or equivalent for file hosting

#### Task Breakdown

```
Task 8.1: File Storage Setup
Type: Backend / Configuration
Description: Configure Supabase Storage (or equivalent) for file hosting. Set up 
  buckets, access policies, and signed URL generation for secure previews.
Depends On: Sprint 1 infrastructure
Estimated Complexity: Medium
Acceptance Criteria:
- Storage bucket configured with appropriate access policies
- Signed URLs generated for secure, time-limited access
- File size limits enforced at upload
- File type validation

Task 8.2: File Upload/Download API
Type: Backend
Description: Build upload and download endpoints. Associate files with tasks or 
  wrap-ups. Log uploads in task timeline.
Depends On: 8.1
Estimated Complexity: Medium
Acceptance Criteria:
- Multipart upload working
- File associated with correct task or wrap-up
- File type and size validated
- Upload logged in task timeline
- Download endpoint returns file with correct content type
- Permanent flag set on task-attached files

Task 8.3: In-App File Preview
Type: Frontend
Description: Build in-app preview for PDFs and images. Use embedded viewer (PDF.js 
  or similar for PDFs, native img tag for images).
Depends On: 8.2
Estimated Complexity: Medium
Acceptance Criteria:
- PDF preview within the app (no download required)
- Image preview within the app
- Preview modal or inline viewer
- Fallback download link for unsupported preview types (DOCX, XLSX, video)

Task 8.4: File Attachment UI on Tasks and Wrap-ups
Type: Frontend
Description: Integrate file upload into task detail (completion report section + 
  general attachments) and EOD wrap-up form. Show attached files with preview/download.
Depends On: 8.2, 8.3
Estimated Complexity: Medium
Acceptance Criteria:
- File upload component on task detail (drag-and-drop + browse)
- File upload on EOD wrap-up form
- Attached files displayed with icon, filename, size, preview/download actions
- Files visible in completion report area
- No delete button on task-attached files (permanent)
```

#### Sprint Outcome

After Sprint 8, files work throughout Sunday. Employees can attach supporting documents and completion report files to tasks, managers can preview PDFs and images in-app, and all files are permanently stored and linked to their tasks. The evidence trail is complete — not just text reports, but actual documents.

---

### Sprint 9: Reporting and Export

**Goal:** All five report types are functional — weekly team performance, individual employee, billable hours summary, system activity, and full task export. PDF and CSV formats. Role-scoped access.

**Duration Estimate:** 2 weeks for a 2-person team

#### Module Specifications

**Module: Reporting & Export**
Purpose: Transform Sunday's operational data into exportable, formal records
Dependencies: Task Engine, Planning Module, User & Team Management, File Management
Connects To: Manager Dashboard (some reporting data overlaps)

Core Functions:
- Generate Weekly Team Performance Report: Tasks committed vs completed per employee, completion rate, planned vs actual hours, overdue count. Per team. PDF and CSV.
- Generate Individual Employee Report: All tasks for a period with status, hours, planned vs actual, on-time vs overdue. PDF and CSV.
- Generate Billable Hours Summary: All billable tasks, assignee, hours estimated vs actual, completion status. PDF and CSV.
- Generate System Activity Report: All task activity across all teams for a date range. CSV only. Admin only.
- Full Task Export: All tasks with all fields (including custom fields) for a given filter set. CSV.

Business Rules:
- All reports are generated on demand (no scheduling in v1)
- Reports respect the requesting user's access scope — managers cannot pull reports for teams outside their department
- Date range is always selectable, default is current week
- CSV exports include all fields including custom fields
- PDF exports are formatted for readability — clean tables, headers, summary stats. Not a raw dump.

API/Integration Needs:
- POST `/api/reports/weekly-team` — generates report, returns file download link
- POST `/api/reports/individual-employee` — same pattern
- POST `/api/reports/billable-hours` — same pattern
- POST `/api/reports/system-activity` — Admin only
- POST `/api/reports/task-export` — accepts filter params, returns CSV
- PDF generation library (server-side)
- CSV generation

#### Task Breakdown

```
Task 9.1: Report Data Aggregation Layer
Type: Backend
Description: Build the data aggregation functions that compute report metrics — 
  completion rates, planned vs actual, on-time rates, billable summaries — from raw 
  task and plan data.
Depends On: Sprints 1-5 complete
Estimated Complexity: Complex
Acceptance Criteria:
- Weekly team metrics: committed vs completed, completion rate, planned vs actual hours, overdue count
- Individual employee metrics: all tasks for period, status, hours, on-time analysis
- Billable metrics: all billable tasks, hours, completion status
- System activity: all events for date range
- Functions are role-scoped (query only within requester's access)

Task 9.2: CSV Export Generation
Type: Backend
Description: Build CSV generation for all report types and the full task export. 
  Include all fields including custom fields for task exports.
Depends On: 9.1
Estimated Complexity: Medium
Acceptance Criteria:
- Clean CSV output with headers
- All fixed and custom fields included in task export
- Date range filtering
- Role-scoped data
- Download link returned to frontend

Task 9.3: PDF Report Generation
Type: Backend
Description: Build formatted PDF reports for weekly team performance, individual 
  employee, and billable hours. Clean layout with tables, headers, summary statistics.
Depends On: 9.1
Estimated Complexity: Complex
Acceptance Criteria:
- Clean, professional PDF layout (not raw data dump)
- Tables with proper formatting
- Summary statistics (totals, averages, rates)
- Headers showing team name, date range, generated by, generated at
- Download link returned to frontend

Task 9.4: Report API Endpoints
Type: Backend
Description: Build API endpoints for each report type — accept parameters (team, 
  date range, employee), validate permissions, trigger generation, return download link.
Depends On: 9.2, 9.3
Estimated Complexity: Medium
Acceptance Criteria:
- Endpoints for all 5 report types
- Permission checks (Manager+ for most, Admin for system activity)
- Date range parameter with current week default
- Returns download link or streams file
- Error handling for invalid parameters or insufficient permissions

Task 9.5: Reports UI
Type: Frontend
Description: Build the reports page — report type selection, parameter inputs (team, 
  date range, employee), generate button, download links for generated reports.
Depends On: 9.4
Estimated Complexity: Medium
Acceptance Criteria:
- Report type selector (5 types)
- Parameter inputs: date range picker, team selector (for team reports), employee selector (for individual)
- Generate button triggers report creation
- Loading state during generation
- Download links for PDF and CSV
- Access restricted by role (Admin sees system activity option, others don't)
- History of recently generated reports (optional enhancement)
```

#### Sprint Outcome

After Sprint 9, all reporting is live. Managers can pull weekly performance reports, individual employee breakdowns, and billable hours summaries in both PDF and CSV formats. Admins can export system-wide activity and do full task data dumps. Every report respects access scope. The paper trail lives beyond the app.

---

### Sprint 10: Polish — Mobile Optimisation, Onboarding, Archiving, Audit Trail, Settings

**Goal:** Mobile UI refinement, first-login onboarding flow, admin setup flow, archiving background job, system-level audit trail, and user/team/system settings pages. The product is deployment-ready.

**Duration Estimate:** 2 weeks for a 2-person team

#### Task Breakdown

```
Task 10.1: Mobile UI Optimisation Pass
Type: Frontend
Description: Review every page and component for mobile responsiveness. Ensure all 
  core features work on mobile. Simplify heavy data views (capacity grid, workload grid) 
  for mobile. Optimise daily check-in and EOD wrap-up for quick mobile interaction.
Depends On: All previous sprints
Estimated Complexity: Complex
Acceptance Criteria:
- All pages functional on mobile browsers (iOS Safari, Chrome Android)
- Sidebar collapses to hamburger menu
- Task creation modal works well on mobile
- Daily check-in and EOD wrap-up optimised for quick mobile input
- Capacity grid and workload grid have simplified mobile layouts
- No horizontal scroll issues
- Touch targets sized appropriately

Task 10.2: First-Login Onboarding Flow
Type: Frontend
Description: Build the employee onboarding experience — welcome screen with name, 
  team, and manager; display any pre-assigned tasks; guided prompt to create first 
  weekly plan. No tutorial bloat.
Depends On: Sprints 1, 4
Estimated Complexity: Medium
Acceptance Criteria:
- First login shows welcome screen with employee name, team, manager
- Pre-assigned tasks displayed immediately
- Non-skippable prompt: "Set up your first weekly plan"
- Navigates to planning module with guidance
- After plan saved, onboarding complete
- Flag on user record that onboarding is complete (don't show again)

Task 10.3: Admin Setup Flow
Type: Frontend
Description: Build the guided admin setup experience — create departments first, 
  then teams, then add employees (bulk or individual). Logical sequence.
Depends On: Sprint 1
Estimated Complexity: Simple
Acceptance Criteria:
- Step-by-step flow: Departments → Teams → Employees
- Progress indicator
- Can be re-entered from admin settings
- Guides admin through minimum viable setup

Task 10.4: Archiving Background Job
Type: Backend
Description: Build the background job that archives completed tasks older than the 
  configurable archiving window (default 6 months). Archived tasks hidden from active 
  views but searchable and reportable. Files and timeline preserved.
Depends On: Sprints 2, 7, 8
Estimated Complexity: Medium
Acceptance Criteria:
- Runs on schedule (nightly or weekly)
- Archives completed tasks older than the configured window
- Archived tasks excluded from active views (My Tasks, Team Tasks, Kanban)
- Archived tasks included in search results (with "Archived" badge)
- Archived tasks accessible in reports
- All attachments and timeline events preserved
- Archiving window configurable in system settings

Task 10.5: System-Level Audit Trail
Type: Backend + Frontend
Description: Build the system-level audit trail — logs all significant admin and 
  system actions. Admin-only access. User account changes, team structure changes, 
  permission changes, exports run, accounts deactivated.
Depends On: Sprint 1
Estimated Complexity: Medium
Acceptance Criteria:
- Audit events logged for: user created/edited/deactivated/reactivated, 
  team created/edited, department created/edited, role changes, permission changes, 
  exports generated, system settings changed
- Each event records: who, what, when, old value, new value
- Admin-only audit trail page with date range filter and event type filter
- Audit data cannot be edited or deleted
- Retained permanently

Task 10.6: Settings Pages — User, Team, System
Type: Frontend
Description: Build the settings pages for user preferences (timezone, notification 
  prefs, default view), team settings (planning mode, deadlines, mandatory flags, 
  custom fields), and system settings (org name, default hours, archiving window).
Depends On: Sprints 1, 6
Estimated Complexity: Medium
Acceptance Criteria:
- User settings: display timezone, notification preferences (toggles for optional types), 
  default task view (kanban/list), saved filter views management
- Team settings (Manager/Admin): planning mode toggle, submission deadline, 
  daily check-in mandatory toggle, EOD mandatory toggle, custom fields link
- System settings (Admin): organisation name/branding, default available hours, 
  archiving window, user management link, team management link
- All settings persist immediately on change

Task 10.7: Deactivation Task Reassignment Flow
Type: Full-stack
Description: When Admin deactivates a user, build the flow that shows all open tasks 
  assigned to that user and requires reassignment or closure before deactivation 
  completes. Notification to manager.
Depends On: Sprints 1, 2
Estimated Complexity: Medium
Acceptance Criteria:
- Deactivation triggers open task list for that user
- Admin and manager see the list
- Each task must be reassigned to another user or closed
- Deactivation does not complete until all tasks are handled
- Manager receives notification listing the tasks
- Deactivation logged in system audit trail

Task 10.8: End-to-End Testing and Bug Fixes
Type: Full-stack
Description: Comprehensive testing across all modules — role-based access, timezone 
  handling, deadline enforcement, notification triggers, report accuracy, mobile 
  responsiveness, edge cases from PAD §5.
Depends On: All previous tasks
Estimated Complexity: Complex
Acceptance Criteria:
- All role/permission combinations tested
- Timezone edge cases tested (employee in Dhaka, manager in London)
- All 13 notification triggers verified
- Capacity grid calculations verified
- Completion report enforcement verified
- All edge cases from PAD §5 tested
- Mobile testing on iOS Safari and Chrome Android
- Performance testing with realistic data volumes (~60 users, 1000+ tasks)
```

#### Sprint Outcome

After Sprint 10, Sunday is deployment-ready. Mobile works properly for all core workflows. New employees get a clean onboarding experience. Admins have a guided setup flow. Old tasks archive automatically. The system audit trail gives Admin full visibility into every structural change. All settings are configurable. The product has been tested end-to-end against the full PAD specification including edge cases.

---

## Cross-Sprint Connection Map

| Sprint | What the Product Can Do After This Sprint |
|--------|------------------------------------------|
| **Sprint 1** | Admin can log in, create the org structure (departments, teams), create user accounts, and send invites. Employees can log in. Navigation shell is live. Nothing productive yet — but everyone exists. |
| **Sprint 2** | Tasks work. Create, assign, status workflow, completion reports, reviewer flow, subtasks, dependencies, reassignment, ad hoc backdating. The core unit of work is functional. |
| **Sprint 3** | Custom fields extend tasks per team. Kanban board provides visual task management. Saved views let users personalise their workspace. Task system is feature-complete. |
| **Sprint 4** | Planning discipline is live. Weekly plans, daily check-ins, EOD wrap-ups, carry-over, locked/fluid modes. Managers can see team plans and comment. Deadline enforcement is active. |
| **Sprint 5** | Managers have their dashboard — capacity grid, big fat warning, workload utilisation, overdue alerts, activity feed. The two core questions are now answerable with data. |
| **Sprint 6** | Notifications flow everywhere. In-app for all events, urgent emails for overdue, missed plans, unplanned employees. The system actively surfaces problems. |
| **Sprint 7** | Global search finds anything. Advanced filters cover all fields including custom fields. The system scales — large task volumes are navigable. |
| **Sprint 8** | Files attach to tasks and wrap-ups. PDFs and images preview in-app. Evidence is stored permanently. The completion report system has full-fidelity documentation. |
| **Sprint 9** | Reports export to PDF and CSV. Weekly performance, individual employee, billable hours, system activity, full task export. The paper trail lives outside the app. |
| **Sprint 10** | Mobile is polished. Onboarding guides new users. Archiving manages old data. Audit trail tracks system changes. Settings are configurable. Sunday is production-ready. |

---

## Traceability Matrix

| Product Requirement | Module | Sprint | Status |
|---|---|---|---|
| User accounts with full role hierarchy | User & Team Management, Role & Permission Engine | 1 | Planned |
| Team and department structure | User & Team Management | 1 | Planned |
| Timezone and work week configuration per user | User & Team Management | 1 | Planned |
| Billable permissions per user | User & Team Management | 1 | Planned |
| Task creation with all fixed fields | Task Engine | 2 | Planned |
| Custom fields (Manager/Admin per team/project) | Custom Fields Engine | 3 | Planned |
| Task Timeline — full lifecycle log | Task Timeline | 2 | Planned |
| Reviewer flow — only reviewer can close | Task Engine | 2 | Planned |
| Mandatory completion report enforcement | Task Engine | 2 | Planned |
| Task reassignment with history preservation | Task Engine | 2 | Planned |
| Weekly plan submission — locked and fluid modes | Planning Module | 4 | Planned |
| Configurable plan submission deadline (timezone-aware) | Planning Module | 4 | Planned |
| Daily check-in (optional/mandatory per team) | Planning Module | 4 | Planned |
| EOD wrap-up — auto-filled from task activity | Planning Module | 4 | Planned |
| Plan comments by manager | Planning Module | 4 | Planned |
| Carry-over with notification | Planning Module | 4, 6 | Planned |
| Manager Dashboard — My Overview | Manager Dashboard | 5 | Planned |
| Manager Dashboard — Team Pulse | Manager Dashboard | 5 | Planned |
| Manager Dashboard — Task Board | Manager Dashboard | 3 | Planned |
| Manager Dashboard — Workload View | Manager Dashboard | 5 | Planned |
| Capacity grid with colour coding and big fat warning | Manager Dashboard | 5 | Planned |
| Activity feed — scoped by role | Manager Dashboard | 5 | Planned |
| Quick task creation modal — persistent on all screens | Task Engine | 2 | Planned |
| Global search | Search & Filtering | 7 | Planned |
| Task filters with saved views | Search & Filtering | 3, 7 | Planned |
| In-app notifications (all triggers) | Notification System | 6 | Planned |
| Urgent email notifications | Notification System | 6 | Planned |
| Weekly performance report — PDF and CSV | Reporting & Export | 9 | Planned |
| Individual employee report — PDF and CSV | Reporting & Export | 9 | Planned |
| Billable hours summary — PDF and CSV | Reporting & Export | 9 | Planned |
| Full task export — CSV | Reporting & Export | 9 | Planned |
| Responsive web interface with mobile UI | All modules | 10 (polish) | Planned |
| File attachments on tasks with in-app preview | File Management | 8 | Planned |
| Bulk user import via CSV | User & Team Management | 1 | Planned |
| System-level audit trail (Admin) | Audit Trail | 10 | Planned |
| Archiving with configurable window | Archiving & Data Retention | 10 | Planned |
| Subtasks | Task Engine | 2 | Planned |
| Dependencies (one level, v1) | Task Engine | 2 | Planned |
| Ad hoc task backdating | Task Engine | 2 | Planned |
| Self-plan autonomy for Senior Employees+ | Planning Module | 4 | Planned |
| Plan submission compliance tracking | Planning Module, Reporting | 4, 9 | Planned |
| Deactivation with task reassignment workflow | User & Team Management | 10 | Planned |
| Re-activation of deactivated accounts | User & Team Management | 1 | Planned |
| First login onboarding flow | Onboarding | 10 | Planned |
| Admin setup flow (departments → teams → employees) | Onboarding | 10 | Planned |
| Organisation name and branding (system setting) | Settings | 10 | Planned |
| Default available hours (system setting) | Settings | 10 | Planned |
| User notification preferences | Notification System, Settings | 6, 10 | Planned |
| Default task view preference (kanban/list) | Settings | 10 | Planned |
| System activity report — CSV (Admin only) | Reporting & Export | 9 | Planned |
| Edge case handling (§5 — all scenarios) | All modules | 10 (testing) | Planned |

---

## Inferred Additions

| Inferred Module/Feature | Justification |
|---|---|
| **Authentication & Session Management** (full module) | The PAD describes user login, email invites, and password resets but does not name this as a standalone module. It is foundational — every request requires authentication, and the invite/password flows need dedicated logic. |
| **Role & Permission Engine** (separated module) | The PAD includes a detailed access control matrix (§2.2) but embeds it in the user roles section. The cascading 6-tier hierarchy with scope resolution is complex enough to warrant its own module — it is middleware that every other module calls. |
| **Custom Fields Engine** (separated module) | Custom fields are mentioned as a task feature, but they require their own schema design, archiving behaviour (field deleted but data preserved), filter integration, and export inclusion. This is a mini-module, not a field on a form. |
| **Archiving & Data Retention** (separated module) | Described in §4.13 but needs a background job, configurable window in settings, search integration (archived tasks searchable but hidden from active views), and file retention logic. More than a setting toggle. |
| **Activity Events Table** | The activity feed is described in the dashboard section but needs a denormalised events table for performance. Without it, generating the feed requires expensive joins across task, plan, and user tables on every page load. |
| **Comments on Tasks** | The PAD mentions comments in the notification triggers and task timeline (§3.1, §4.1) but does not call out a task comments feature explicitly in the task module spec. Inferred because the notification table lists "New comment on a task you are involved in" as a trigger, and comments appear in the timeline events list. |
| **Project/Category Management** | Project/Category is a required field on tasks but the PAD doesn't describe how projects are created or managed. Inferred as a simple CRUD function for Managers/Admins. |

---

## Open Questions for Development Team

| # | Question | Context |
|---|---|---|
| 1 | **Maximum file attachment size** | Affects Supabase Storage configuration and hosting costs. The PAD flags this as an open question. Recommend 10MB for v1 with option to increase. |
| 2 | **Per-day available hours vs flat daily default** | The PAD asks whether non-standard hours (6-hour shifts) can be set per day rather than a blanket number. This affects the user management schema — add a `daily_hours_override` JSON field (day → hours) or keep it simple with one number? |
| 3 | **Completion report minimum length or structure** | Open Question #7 in the PAD — should the system enforce a minimum word count or structured format? Recommend a minimum character count (e.g. 50 chars) for v1 rather than a structured template. |
| 4 | **Custom fields in quick task creation modal** | Open Question #4 — adding custom fields to the quick modal increases complexity. Recommend: fixed fields only in the quick modal, custom fields editable after creation on the task detail page. |
| 5 | **Backward status transitions** | Can a Done task be reopened? The PAD doesn't specify. Recommend: no backward from Done in v1. If work needs to be redone, create a new task. Discuss with Product Owner. |
| 6 | **Manager visibility of daily check-ins and EOD wrap-ups** | Open Question #8 — can managers see individual daily history or only weekly plans? Recommend: yes, managers can view check-in and wrap-up history per employee. |
| 7 | **Plan behaviour when a contained task is deleted/archived externally** | Open Question #5 — recommendation: plan shows the entry as "Task removed" with a visual indicator, plan hours recalculate, manager is notified. |
| 8 | **Transactional email service selection** | Needed for invite emails, password resets, and urgent notifications. Options: Resend, SendGrid, AWS SES, Postmark. Decision needed before Sprint 1 begins. |
| 9 | **PDF generation library** | Needed for Sprint 9 reports. Options: Puppeteer (HTML→PDF), jsPDF, PDFKit, ReportLab (if Python micro-service). Decision should align with the team's comfort and the desired PDF quality. |
| 10 | **Real-time vs near-real-time for activity feed and dashboard** | True real-time (WebSockets/Supabase Realtime) vs polling (every 30s). Affects infrastructure complexity. Recommend Supabase Realtime subscriptions for dashboard and activity feed updates. |
| 11 | **Multi-tenancy architecture decision** | Not needed for v1 (single Magpie Nest Group deployment) but the PAD notes Sunday may become SaaS. Recommend: add a `tenant_id` column to all tables now (single value for v1) so the schema is multi-tenant-ready without a future migration. |

---

*Plan complete. Every Phase 1 feature from the PAD is mapped to a module and sprint. Nothing was dropped. If the last sprint ships and everything in this plan is built, Sunday works.*
