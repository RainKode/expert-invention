# Sunday — UI Sprint Breakdown
**Source:** sunday-sprint-plan.md | **Generated:** April 2026  
**Product:** Sunday — Task & Time Management System for Magpie Nest Group

---

## Assumptions Made

- **App shell is a persistent sidebar layout** — sidebar on left, top bar always visible, main content area scrollable. All authenticated screens inherit this shell.
- **Mobile breakpoint** is treated as < 768px throughout. Responsive behaviour is designed into each screen; Sprint 10 is the polish pass, not the first time mobile is considered.
- **Notifications panel** is a right-side overlay/drawer, not a dedicated page.
- **Global search bar** lives in the top navigation bar from Sprint 7 onwards.
- **Quick Task Creation Modal** is accessible from every authenticated screen via a persistent "New Task" button or keyboard shortcut.
- **No dedicated "back to login" redirect** for authenticated users — route guard handles this.
- **Comments on tasks** exist as a sub-section within the Task Detail page, not a separate screen.
- **Project/Category management** is a simple settings-accessible page, not a top-level nav item.
- **Settings** is a single section with three sub-pages: User Preferences, Team Settings (Manager+), System Settings (Admin).
- **Role badge** is always visible in the top bar for orientation.

---

## 1. Sprint Summary

Sunday is a ten-sprint build producing a task and planning management system for ~50–60 office staff across six ventures under the Magpie Nest Group. Sprint 1 establishes the authentication and organisational foundation. Sprints 2–3 build the complete task engine. Sprints 4–5 add planning discipline and the manager dashboard. Sprints 6–8 layer cross-cutting systems (notifications, search, file management). Sprint 9 delivers reports and exports. Sprint 10 polishes mobile, adds onboarding, archiving, audit trail, and settings. After all ten sprints, Sunday is production-deployable with a complete responsive UI, mandatory completion reports, timezone-aware planning, capacity grids, role-cascading dashboards, global search, and exportable reports.

---

## 2. Sprint Deliverables

This section maps the exact UI work required for each sprint, ordered by the dependency logic in the Sprint Plan. Only build what is listed under each sprint — screens and modals from later sprints are defined in Section 5 (Per-Screen Component Breakdown) for reference but are not in scope until their sprint arrives.

---

### Sprint 1 — Foundation: Authentication, Users, Roles & Org Structure

**Sprint Goal:** A running application where an Admin can log in, build the org hierarchy (departments → teams), create employee accounts, and send email invites. The role and permission system is live. No task functionality exists yet — but every person, team, and role in Sunday is configured and the application knows who everyone is.

**Duration Estimate:** 2 weeks

---

#### Screens to Build

| # | Screen | Route | Access | Notes |
|---|---|---|---|---|
| — | **App Shell** | All authenticated routes | All roles | Sidebar, top bar, role badge, auth guard, route protection, 403 screen, mobile hamburger drawer |
| 1 | Login | `/login` | Public | Email + password form, show/hide toggle, forgot password link, error states |
| 2 | Forgot Password | `/forgot-password` | Public | Email input, success message (non-revealing security), back to login link |
| 3 | Set Password — Invite Acceptance | `/set-password?token=xxx` | Public (valid token) | Welcome with employee name + team, password strength indicator, expired token error state |
| 4 | Admin — User Management | `/admin/users` | Admin only | Data table with live search, role/team/status filters, sort, pagination, all row actions |
| 5 | Admin — User Create Form | `/admin/users/new` | Admin only | All 10 user fields across 4 sections: personal info, role/team, schedule, permissions |
| 6 | Admin — User Edit Form | `/admin/users/:id/edit` | Admin only | Same as create — pre-populated. Email read-only after invite accepted. |
| 7 | Admin — Team & Department Management | `/admin/teams` | Admin only | Collapsible hierarchy tree table — departments as parent rows, teams as indented children |
| 8 | Admin — Bulk User Import | `/admin/users/import` | Admin only | Stepped flow: instructions → upload → row-by-row preview + validation → confirm import |

---

#### Modals to Build

| Modal | ID | Triggered By | Key Behaviour |
|---|---|---|---|
| Confirm Deactivate User | M2 | Row action on User Management | Warns about open tasks requiring reassignment before confirming |
| Confirm Reactivate User | M3 | Row action on User Management | Simple confirmation — user name shown |
| Add / Edit Department | M4 | Buttons on Team Management | Name + Senior Manager selector (filtered to Sr Manager / Admin roles only) |
| Add / Edit Team | M5 | Buttons on Team Management | Full team form — name, department, manager, planning mode, submission deadline, mandatory check-in/EOD flags |
| Resend Invite | M6 | Row action on User Management | Shows email address, confirms resend — only visible if invite not yet accepted |

---

#### Forms to Build

| Form | Location | Key Fields | Validation Notes |
|---|---|---|---|
| User Create / Edit | Screens 5 & 6 | First name, last name, email, role, team, reporting manager, work week (day checkboxes), timezone (searchable IANA list), available hours per day, billable permission type | All fields required except billable defaults. Email must be unique. Manager dropdown filtered by selected team/dept. |
| Add Department | Modal M4 | Department name (unique), senior manager | Both required |
| Add / Edit Team | Modal M5 | Team name, department, manager, planning mode, submission deadline day + time (conditional on Locked mode), mandatory check-in toggle, mandatory EOD toggle | Deadline fields are conditional — only required when planning mode is Locked |

---

#### Key Components Introduced in Sprint 1

| Component | Description |
|---|---|
| App Shell | Persistent sidebar + top bar across all authenticated screens. Sidebar nav items scoped by role. Mobile: collapses to hamburger icon, opens as overlay drawer. |
| Auth Guard | Wraps all routes. Redirects unauthenticated users to `/login`. Role-restricted pages return full-page 403 screen. |
| Role Badge | 6 role variants, colour-coded. Always visible in top bar next to user name. Also displayed in user table. |
| Status Badge (User) | Active (green) / Deactivated (grey). Used in user table. Distinct from task status badges introduced in Sprint 2. |
| Data Table | Sortable columns, live search (debounced 300ms), multi-dropdown filters, three-way status toggle filter, pagination, skeleton loader, empty state, error banner. Core pattern reused across many screens. |
| Hierarchy Tree Table | Collapsible parent rows (departments) with indented child rows (teams). Expand/collapse chevron toggle. Pattern used here and in Team Plans (Sprint 4). |
| Grouped Form Sections | Section headings (H2) dividing long forms into logical blocks. Inline validation per field on blur + full sweep on submit. Error banner at top of form on submit failure. |
| Toast Notifications | Bottom-right, auto-dismiss 4s. Success / Error / Warning / Info variants. Installed in app shell — live from this sprint onwards. |
| Stepped Flow | Instructions → Upload → Preview → Confirm pattern (Bulk Import). Reusable for future multi-step flows. |
| Skeleton Loader | Grey shimmer blocks matching content shape. Applied to every data-fetching screen throughout the product. |
| Empty State | Centred icon + heading + message + optional CTA button. Consistent pattern across every list, table, and grid screen. |

---

#### Sprint 1 — UI Acceptance Criteria

- [ ] Admin can log in with valid credentials and is redirected to the dashboard shell
- [ ] Invalid login attempts return a correct, non-specific error message
- [ ] Deactivated accounts see a specific "account deactivated" error — not a generic one
- [ ] Unauthenticated users on any route are redirected to `/login`
- [ ] Non-admin users attempting admin pages see the 403 screen
- [ ] Sidebar navigation links are scoped by role — employees see no admin pages, managers see team links
- [ ] Admin can create a department with a senior manager assigned
- [ ] Admin can create a team nested under a department with all configuration fields present and saved
- [ ] Admin can create an individual user — all 10 fields present, validated, invite sent automatically on save
- [ ] Admin can deactivate a user — confirmation modal appears, open task warning shown
- [ ] Admin can reactivate a user — confirmation required
- [ ] Admin can resend an invite — only available on users who have not yet accepted
- [ ] Admin can bulk import via CSV — parse, preview with per-row validation indicators, import all-or-nothing
- [ ] Invited user can click email link, reach Set Password page with their name and team shown, set password, and land in the app
- [ ] Password reset flow works end-to-end — request email, click link, set new password
- [ ] On mobile, sidebar collapses to a hamburger menu and opens as a full-height overlay drawer
- [ ] Every list screen shows loading skeleton, empty state with helpful message, and error state with retry

---

### Sprint 2 — Task Engine Core: Creation, Assignment, Status & Completion

**Sprint Goal:** Employees and managers can create tasks with all fixed fields, assign them, move them through statuses, and complete them with mandatory completion reports. The reviewer flow works. The fundamental unit of work in Sunday is live.

**Duration Estimate:** 2.5 weeks

**Depends On:** Sprint 1 fully complete — users, teams, roles, and auth must all be in place before tasks can be built.

---

#### Screens to Build

| # | Screen | Route | Access | Notes |
|---|---|---|---|---|
| 9 | My Tasks | `/tasks` | All roles | Task list filterable by status (tabs), priority, type, nature, due date, project, billable. Sort options. Inline status change enforces business rules. |
| 10 | Task Detail | `/tasks/:id` | Anyone with access to the task | Two-column layout: main content area (description, subtasks, dependencies, completion report) + right sidebar (all metadata fields). Details / Timeline / Comments tabs. |
| 11 | Team Tasks | `/team/tasks` | Asst Manager+ | Same as My Tasks with added assignee column, assignee filter, overdue-only toggle, and reassign row action. Scoped by manager's team/department. |
| 29 | Project / Category Management | `/settings/projects` | Manager+ | Simple list of projects — add, edit. Projects are assigned to tasks throughout the product. |

---

#### Modals to Build

| Modal | ID | Triggered By | Key Behaviour |
|---|---|---|---|
| Quick Task Creation | M1 | "+ New Task" — persistent on all authenticated screens | Full task form. Already-completed toggle reveals actual hours + report fields for ad hoc backdating. Assignee selection scoped by role. |
| Reassign Task | M7 | Reassign row action on Task Detail and Team Tasks | New assignee must differ from current and be in scope (manager's team). Optional reason field. Logs to timeline. |
| Completion Report Prompt | M8 | Status change → Done / drag to Done on Kanban | Text textarea + optional file upload. At least one required. Blocks Done status without submission. |
| Reviewer Send-Back | M9 | "Send Back" button on Task Detail — visible only to reviewer, only when In Review | Reason textarea required (min 10 chars). Task returns to In Progress. Assignee receives notification. |
| Add Subtask Inline Form | M13 | "+ Add Subtask" on Task Detail | Compact inline form appearing below subtask list. Title required. Assignee and due date optional. |
| Add Dependency | M14 | "+ Add Dependency" on Task Detail | Task search field. Selected task becomes blocker. Circular dependency check — rejected with error if circular. |
| Add / Edit Project | M19 | "+ Add Project" on Project Management | Project name + scope selector (team-scoped or global). |

---

#### Forms to Build

| Form | Location | Key Fields | Validation Notes |
|---|---|---|---|
| Quick Task Creation | Modal M1 | Title, assignee, due date, estimated hours, priority, type, nature, billable toggle, project, reviewer (optional), description (optional, collapsible), already-completed toggle → reveals actual hours + completion report | Title required (3–200 chars). Due date today or future unless already-completed. Billable toggle disabled with tooltip if user has no billable permission. |
| Completion Report | Modal M8 / Task Detail | Report text (textarea), report file (optional file upload) | At least one of text or file required. System blocks Done without this. |
| Reviewer Send-Back | Modal M9 | Send-back reason | Required. Minimum 10 characters. Logged permanently in task timeline. |
| Add Subtask | Modal M13 | Title (required), assignee (optional, defaults to parent assignee), due date (optional) | Compact inline layout. Minimal validation — just title required. |
| Reassign Task | Modal M7 | New assignee (required, scoped, different from current), reason (optional, max 500 chars) | New assignee must differ from current. Logged in timeline. |
| Add / Edit Project | Modal M19 | Project name (unique per scope), scope type (team / global), scope target | Name must be unique within its scope. |

---

#### Key Components Introduced in Sprint 2

| Component | Description |
|---|---|
| Task Card / Row | Title, left-border priority stripe (red / amber / grey), status badge, due date (red + "Overdue" label if past), billable "$" badge, project tag, assignee avatar. Core card pattern used on My Tasks, Team Tasks, and Kanban. |
| Status Filter Tabs | Tab group: All / To Do / In Progress / In Review / Done. Active tab highlighted. Horizontally scrollable on mobile. |
| Inline Status Dropdown | Per-row status change. Business rules enforced — changing to Done automatically opens M8 (completion report modal). Blocked transitions show tooltip explaining why. |
| Two-Column Task Detail | Main content (left): description editor, subtask list, dependency section, completion report area. Right sidebar: all metadata fields (assignee, reviewer, due date, hours, type, nature, billable, project, custom fields). Sidebar fields are inline-editable per role. On mobile: sidebar stacks below main content. |
| Tabs — Details / Timeline / Comments | Tab switcher on Task Detail main area. Timeline: read-only chronological log. Comments: threaded with input. Both tabs visible from this sprint. |
| Task Timeline | Append-only event list. Each entry: actor name, action description, old/new values where relevant, ISO timestamp. No edits, no deletes. |
| Rich Text Editor | Bold, italic, bulleted list, numbered list, links. Used in task description and completion report text input. |
| Completion Report Section | Appears in Task Detail when status is In Progress or In Review. Textarea + optional file upload. Required before Done. Read-only once task is Done. |
| Reviewer Action Buttons | "Approve — Mark Done" (primary) and "Send Back" (secondary, destructive). Only rendered for the assigned reviewer. Only visible when task is In Review. |
| Subtask List | Nested task rows under parent task detail. Each row: title, status toggle, assignee avatar, link to subtask detail page. "+ Add Subtask" inline form appends below list. |
| Dependency Display | Two sub-sections: "Blocked by" and "Blocks". Each entry links to the related task. Red indicator on any "Blocked by" entry whose blocker task is not yet Done. |
| "+ New Task" Button | Persistent primary action button installed in the app shell. Opens M1 from any screen. First introduced this sprint — update the shell. |
| Overdue Indicator | Due date displayed in red with "Overdue" text label. Applied to task cards, task table rows, and the sidebar due date field on Task Detail. |

---

#### Sprint 2 — UI Acceptance Criteria

- [ ] "+ New Task" button is visible and functional on every authenticated screen
- [ ] Quick Task Creation modal opens, all required fields are present and validated before task is created
- [ ] Created task appears in the assignee's My Tasks list immediately without page refresh
- [ ] Task Detail displays all fields with correct edit permissions per role
- [ ] Changing status to Done triggers the completion report modal — task cannot reach Done without it
- [ ] Submitting a completion report with a reviewer assigned moves the task to In Review
- [ ] Without a reviewer, submitting a completion report moves the task directly to Done
- [ ] Reviewer sees Approve and Send Back buttons only when task is In Review and they are the assigned reviewer
- [ ] Send-back moves task to In Progress, reason is shown in timeline, assignee is notified
- [ ] Timeline tab shows every action in chronological order — read-only, no edits possible
- [ ] Comments tab allows posting and displays threaded replies
- [ ] Subtask created from Task Detail appears in subtask list, opens its own detail page when clicked
- [ ] Dependency can be added — blocked task's "To In Progress" transition is blocked with explanation until blocker is Done
- [ ] Circular dependency attempt is rejected with a clear error message
- [ ] Team Tasks page is scoped correctly — Asst Manager sees sub-team, Manager sees full team
- [ ] Reassign action updates assignee, both former and new assignees are shown in timeline
- [ ] Already-completed toggle in quick task modal creates the task as Done with completion report
- [ ] Project Management page allows creating projects; projects appear in task creation form
- [ ] Mobile: Task Detail sidebar stacks below main content, tabs remain usable, filter bar scrolls horizontally

---

### Sprint 3 — Custom Fields & Task Board (Kanban)

**Sprint Goal:** Managers can create custom fields for their teams and projects. All users get the Kanban board with drag-and-drop, a full filter bar, and saved views. The task system reaches feature-completeness for v1.

**Duration Estimate:** 1.5 weeks

**Depends On:** Sprint 2 fully complete — task engine must be live before custom fields or board views can be built on top of it.

---

#### Screens to Build

| # | Screen | Route | Access | Notes |
|---|---|---|---|---|
| 12 | Task Board (Kanban) | `/board` | All roles (scoped) | Four-column board: To Do / In Progress / In Review / Done. Drag-and-drop with business rule enforcement. Filter bar. Saved views dropdown. |
| 13 | Custom Field Management | `/settings/custom-fields` | Manager+ | List of custom fields with type, scope, status. Add / edit / archive actions. |

---

#### Modals to Build

| Modal | ID | Triggered By | Key Behaviour |
|---|---|---|---|
| Add / Edit Custom Field | M10 | "+ Add Field" button on Custom Field Management | Name, field type (Text / Number / Date / Dropdown / Checkbox), dropdown options editor (only when type = Dropdown), scope (team / project). |
| Archive Custom Field Confirm | M11 | Archive action on Custom Field Management | Warning: existing task values are preserved. Archived field hidden from new tasks only. |
| Save View | M12 | "Save View" button on Task Board | View name input + "Share with team" toggle (Manager+ only). Saves current filter state. |

---

#### Forms to Build

| Form | Location | Key Fields | Validation Notes |
|---|---|---|---|
| Add / Edit Custom Field | Modal M10 | Name (unique per scope), field type, dropdown options (conditional), scope type (team / project), scope target | Options field appears only when field type = Dropdown. Min 2 options required then. |
| Save View | Modal M12 | View name (required, unique per personal scope), shared toggle | Manager+ required to enable shared toggle. |

---

#### Key Components Introduced in Sprint 3

| Component | Description |
|---|---|
| Kanban Board | Four-column horizontal layout. Cards are draggable between columns. Column headers show status name + task count badge. Board scrolls vertically within each column; columns scroll horizontally on overflow. |
| Draggable Task Card | Title, left-border priority colour stripe (red = High, amber = Medium, grey = Low), assignee avatar, due date (red if overdue), billable "$" badge. Draggable. Click navigates to Task Detail. |
| Drag-and-Drop Status Change | Moving a card to a new column triggers a status change. Business rules enforced: blocked transitions show a red column highlight with tooltip explaining why (e.g. "Completion report required" or "Blocked by dependency"). Dragging to Done column opens Completion Report Modal (M8). |
| Saved Views Dropdown | Dropdown in filter bar listing personal views and shared team views. Active view highlighted. Selecting a view restores all saved filters. |
| Custom Field Renderer | Renders the correct input control based on field type: text input, number input, date picker, dropdown select, or checkbox. Used in Task Detail sidebar and Task Creation Modal for applicable custom fields. |

---

#### Sprint 3 — UI Acceptance Criteria

- [ ] Kanban board displays all four columns with correct tasks in each
- [ ] Drag-and-drop between columns updates task status immediately without page refresh
- [ ] Dragging to Done column opens Completion Report Modal — task does not move until report submitted
- [ ] Columns visually block the drop (red highlight + tooltip) when a rule prevents the move
- [ ] Filter bar filters the board in real time — all existing filter types from My Tasks work here
- [ ] "Save View" saves the current filter combination as a named view, which then appears in the dropdown
- [ ] Shared views (Manager+) appear for all team members in the dropdown
- [ ] Custom Field Management lists all fields with correct type and scope
- [ ] Adding a custom field of type Dropdown requires at least 2 options before saving
- [ ] Custom fields appear on Task Detail sidebar and in Task Creation Modal for tasks matching the field's scope
- [ ] Archiving a custom field hides it from new tasks but existing task values remain visible

---

### Sprint 4 — Planning Module: Weekly Plans, Daily Check-ins, EOD Wrap-ups

**Sprint Goal:** Employees can plan their work week by assigning tasks to days, submit plans on a deadline (locked mode) or work freely (fluid mode), do morning check-ins and end-of-day wrap-ups, and have incomplete tasks carry over automatically. Managers can view all their team's plans and comment directly.

**Duration Estimate:** 2.5 weeks

**Depends On:** Sprint 2 complete (tasks must exist to be planned). Sprint 1 for user timezone and work week config.

---

#### Screens to Build

| # | Screen | Route | Access | Notes |
|---|---|---|---|---|
| 14 | My Weekly Plan | `/plan` or `/plan/week/:weekStart` | All employees | Week grid (day columns match user's configured work week). Drag tasks from unplanned pool into day slots. Set planned hours per task per day. Submit button (locked mode only). Manager comments displayed below grid. |
| 15 | Daily Check-in | `/checkin` | All employees | Pre-populated from today's plan. Optional notes. Submit. Already-submitted state shows read-only view with timestamp. |
| 16 | EOD Wrap-up | `/wrapup` | All employees | Auto-filled planned vs actual comparison table. Discrepancy alerts. File upload. Notes. Submit. |
| 17 | Team Plans View | `/team/plans` | Asst Manager+ | One row per team member × day columns grid. Colour-coded hours per cell. Submission status badge per employee. Big fat warning for zero-planned days. Comment action per employee row. |

---

#### Modals to Build

| Modal | ID | Triggered By | Key Behaviour |
|---|---|---|---|
| Plan Comment | M15 | Comment icon button on Team Plans per employee row | Right-side drawer. Textarea for new comment + thread of existing comments. Manager-authored only. Employee sees comments on their own plan. |

---

#### Key Components Introduced in Sprint 4

| Component | Description |
|---|---|
| Week Grid | Day columns (only the employee's configured working days — e.g. 5 columns for Sun–Thu employees, 5 columns for Mon–Fri employees). Task slots per day. Drag tasks from unplanned area below into slots. Hours input per slot. |
| Day Summary Footer Row | Below the grid. Shows "Planned X / Available Y hrs" per day column. Colour-coded: Green (80–100%), Amber (50–79% or above 110%), Red (below 50% or completely empty). |
| Carry-over Badge | Amber badge displayed on tasks that were rolled from a previous day automatically by the carry-over background job. |
| Submission Status Badge | Three states: "Not Submitted" (amber), "Submitted at [time]" (green), "Fluid Mode — always editable" (blue). Shown top-right of the plan header. |
| Capacity Grid (Team Plans) | Same visual structure as My Weekly Plan but one row per employee. Each cell shows planned hours. Clicking a cell expands to a popover showing that employee's tasks for that day. |
| Big Fat Warning Banner | Full-width red alert at top of Team Plans page. One entry per employee per day with zero planned hours on a working day. Cannot be dismissed by scrolling past — manager must acknowledge each one (logs to audit). |
| Overdue Deadline Warning | Full-width red alert on My Weekly Plan when the submission deadline has passed and the plan is not yet submitted. Prominent placement, top of page. |
| Planned vs Actual Table | On EOD Wrap-up. Columns: Task, Planned Hours, Actual Hours, Status, Match indicator. Actual hours auto-filled from task data; editable. Match indicator: green checkmark (matching) or amber warning (discrepancy). |
| Discrepancy Alert | Inline alert per row in EOD Wrap-up when a task is flagged Done in the wrap-up but still In Progress in the task system, or vice versa. Instructs the employee to resolve the mismatch. |

---

#### Sprint 4 — UI Acceptance Criteria

- [ ] My Weekly Plan shows day columns matching the logged-in employee's configured work week only (not fixed Mon–Fri for everyone)
- [ ] Dragging a task from the unplanned pool into a day column assigns it; hours input appears in the slot
- [ ] The summary footer updates in real time as tasks and hours are added/removed; colour coding reflects thresholds
- [ ] Submit Plan button locks the plan (locked mode); plan becomes read-only after submission
- [ ] Fluid mode employees see no Submit button; their plan remains always editable
- [ ] Overdue deadline warning appears prominently if the deadline has passed without submission
- [ ] Carry-over tasks display the amber carry-over badge; they appear in the correct next working day slot
- [ ] Manager comments appear below the grid with author name and timestamp
- [ ] Daily Check-in pre-populates with today's planned tasks from the weekly plan
- [ ] Submitting check-in switches the page to a read-only submitted view with timestamp
- [ ] EOD Wrap-up table auto-fills planned hours from the plan and actual hours from task logs
- [ ] Discrepancy alerts appear per row when task status in wrap-up does not match task system status
- [ ] File upload works on EOD Wrap-up
- [ ] Team Plans grid shows all team members, colour-coded per day, with correct scope (Asst Manager = sub-team, Manager = full team, Sr Manager = department)
- [ ] Big fat warning banner appears for any employee with zero planned hours on a working day — fully visible, not dismissible casually
- [ ] Plan Comment drawer opens and posts comments visible to the employee on their plan
- [ ] Mobile: week grid shows one day at a time on small screens with left/right navigation

---

### Sprint 5 — Manager Dashboard: Capacity Grid, Workload View, Activity Feed

**Sprint Goal:** Managers get their command centre — My Overview for personal task status, Team Pulse with capacity grid and the unmissable big fat warning, Workload View showing planned vs actual utilisation, and a live Activity Feed scoped by role. Senior Managers see across their whole department.

**Duration Estimate:** 2 weeks

**Depends On:** Sprints 2, 3, and 4 complete — dashboard data aggregates task, plan, and user data. Nothing meaningful to display without all three.

---

#### Screens to Build

| # | Screen | Route | Access | Notes |
|---|---|---|---|---|
| 18 | Dashboard — My Overview | `/dashboard` | All roles | Default landing page after login. Four widget cards: Today's Tasks, Weekly Completion Rate, Upcoming Deadlines (next 3 days), Carry-overs. Click any task in a widget → Task Detail. |
| 19 | Dashboard — Team Pulse | `/dashboard/team-pulse` | Asst Manager+ | Big fat warning zone at top. Capacity grid (employee rows × day columns). Overdue task section. Completion rate per employee. |
| 20 | Dashboard — Workload View | `/dashboard/workload` | Manager+ | Same grid structure as Team Pulse but showing planned hours vs actual hours logged. Near-real-time update indicator. |
| 21 | Activity Feed | `/dashboard/activity` | All (scoped) | Chronological event feed. Activity type filter. Infinite scroll or "Load more". Employees see own-task events; managers see team events. |

---

#### Modals to Build

| Modal | ID | Triggered By | Key Behaviour |
|---|---|---|---|
| Big Fat Warning Acknowledge | M16 | Clicking a warning entry on Team Pulse | Shows employee name and which days are unplanned. Manager must explicitly acknowledge — creates an audit log entry. Cannot close without acknowledging. |

---

#### Key Components Introduced in Sprint 5

| Component | Description |
|---|---|
| Overview Widget Card | Contained card with a heading, task list or metric inside. Four variants: Today's Tasks, Weekly Completion, Upcoming Deadlines, Carry-overs. On mobile: stacks vertically. |
| Completion Rate Visual | Progress bar or donut chart. Colour-coded by percentage. Displayed in the Weekly Completion Rate widget. |
| Capacity Grid | Full table: employee name column + one column per working day. Each cell: "X / Y hrs" (planned / available). Colour: Green (80–100%) / Amber (50–79% or above 110%) / Red (below 50% or zero). Click a cell to expand to a popover listing that employee's tasks for that day. |
| Workload Grid | Same layout as Capacity Grid but cell content is "Planned X / Actual Y hrs". Near-real-time — refreshes without full page reload. Includes a "Updated X minutes ago" freshness indicator. |
| Activity Entry | One row per event. Left: user avatar. Centre: action text e.g. "[Ahmed] changed [Design Review] status to In Review". Right: relative timestamp ("3 min ago"). Linked object names are clickable links to the relevant resource. |
| Activity Type Filter | Multi-select filter above the activity feed. Options: Task Created, Status Changed, Plan Submitted, Check-in Submitted, Wrap-up Submitted, Comment Added, Assignment Changed. |
| My Overview — Fresh Start State | Shown to a new employee with no tasks yet: "Welcome to Sunday. Your first task will appear here when it's assigned." Full-page or within widget area. |
| My Overview — All Clear State | When no overdue tasks and no carry-overs: "All caught up — no overdue tasks, no carry-overs." Displayed within relevant widgets. |

---

#### Sprint 5 — UI Acceptance Criteria

- [ ] My Overview is the default landing page after login for all roles
- [ ] Today's Tasks widget shows tasks due today with correct status badges; overdue tasks display red
- [ ] Weekly Completion Rate widget shows the correct done/total ratio with visual colour coding
- [ ] Upcoming Deadlines widget shows tasks due within the next 3 days
- [ ] Carry-over widget shows tasks rolled from previous days; empty state shown cleanly when none
- [ ] Clicking any task in any widget navigates to Task Detail
- [ ] Team Pulse is accessible only to Asst Manager and above — others see 403 if they try the route directly
- [ ] Big fat warning banner is the first thing visible on Team Pulse when unplanned days exist — above the grid, not hidden
- [ ] Capacity grid cells are correctly colour-coded based on thresholds; cells reflect real plan data
- [ ] Expanding a grid cell shows the actual tasks planned for that employee on that day
- [ ] Overdue task section lists all overdue team tasks with assignee name and "X days overdue" label
- [ ] Completion rate bars per employee show correct done/committed ratios
- [ ] Acknowledging a big fat warning opens M16 and logs the acknowledgement — not clearable without it
- [ ] Workload grid shows planned vs actual in each cell; actual hours update without refresh as tasks are completed
- [ ] Activity feed shows events for correct scope — employees see only their own task events; managers see full team
- [ ] Activity type filter reduces the feed to matching events only
- [ ] Senior Managers see data across all teams in their department, not just one team

---

### Sprint 6 — Notification System

**Sprint Goal:** All 13 notification triggers are wired up. In-app notifications reach users for all significant events. Urgent email notifications fire for overdue tasks, missed plan submissions, and unplanned employees. Users can opt out of the three configurable notification types from their settings.

**Duration Estimate:** 1.5 weeks

**Depends On:** Sprints 2, 4, and 5 — notification triggers come from task events, plan events, and dashboard events. Cannot build the notification system before there are events to trigger it.

---

#### Screens with Changes in Sprint 6

No new full screens. The following existing elements are completed or extended:

| Element | Where | What Is Built |
|---|---|---|
| Notification Bell Icon (top bar) | Global shell — top bar | Unread count badge. Click opens notification panel. Badge updates in real time without page refresh. |
| Notification Panel / Drawer | Right-side overlay | List of recent notifications. Each entry: type icon, message, timestamp, read/unread dot. Click notification → marks read + navigates to linked resource. "Mark all read" action at top. |
| Notification Preferences (settings) | `/settings` — User Preferences section | Toggle controls for the 3 optional notification types: "Task I created is marked Done", "Comment on my plan", "Comment on a task I'm involved in". All other types cannot be disabled. |

---

#### Key Components Introduced in Sprint 6

| Component | Description |
|---|---|
| Notification Bell | Icon button in top bar (already added to shell in Sprint 1 as a placeholder). This sprint wires it to real data. Unread count badge appears when unread exist. Badge disappears when all are read. |
| Notification Panel | Right-side overlay/drawer. Fixed height, scrollable. Each row: left icon (type indicator), message text, relative timestamp, unread dot. Bottom: "Load more" or infinite scroll for older notifications. |
| Notification Entry | Individual row. Click → opens linked resource in same tab + marks notification as read. Unread entries have a distinct background or dot indicator. |
| Notification Preference Toggles | Three toggles in User Preferences settings page. Persist per user. All non-optional notification types have no corresponding toggle — they cannot be disabled. |

---

#### Sprint 6 — UI Acceptance Criteria

- [ ] Notification bell in top bar shows a numeric badge when unread notifications exist
- [ ] Badge disappears when all notifications are marked read
- [ ] Opening the panel shows recent notifications with type icon, message, timestamp, and read/unread state
- [ ] Clicking a notification navigates to the linked resource (task, plan, etc.) and marks the notification as read
- [ ] "Mark all read" clears all unread indicators in the panel and the bell badge
- [ ] Notification panel updates in real time — new notifications appear without page refresh
- [ ] User Preferences settings page has three notification opt-out toggles — saving a preference persists it immediately
- [ ] Overdue task: assignee and their manager both receive in-app and email notifications
- [ ] Plan not submitted by deadline: employee and their manager both receive in-app and email notifications
- [ ] Zero tasks planned for a working day: manager receives in-app and email notification
- [ ] The 10 non-optional notification types cannot be toggled off — no toggle UI for them

---

### Sprint 7 — Global Search & Advanced Filtering

**Sprint Goal:** Full-text search across all task data works from every screen via a persistent search bar. Filters support all custom fields (dynamically). Users can find anything at scale.

**Duration Estimate:** 1 week

**Depends On:** Sprints 2 and 3 — search indexes task data and custom field values. Both must exist before search can cover them.

---

#### Screens with Changes in Sprint 7

No new full screens. The following existing elements are completed or extended:

| Element | Where | What Is Built |
|---|---|---|
| Global Search Bar | Top navigation bar — all authenticated screens | Previously a placeholder. This sprint wires it to the full-text search API. Instant results as user types (debounced). Categorised result groups: Tasks, Projects, People. Keyboard shortcut: Ctrl+K / Cmd+K focuses the bar. |
| Custom Field Filters | Task Board filter bar + My Tasks / Team Tasks filter bars | Dynamic filter options added for any custom fields applicable to the current user's team. Filter type matches field type (text search, number range, date picker, dropdown select, checkbox). Works with saved views. |

---

#### Key Components Introduced in Sprint 7

| Component | Description |
|---|---|
| Global Search Bar | Installed in the top nav from Sprint 1 as an empty element. This sprint makes it functional. Autocomplete dropdown appears as user types (min 2 characters). Results grouped by type: Tasks, Projects, People. Archived tasks marked with an "Archived" badge in results. Clicking a result navigates to the resource. |
| Search Results Dropdown | Floating panel beneath the search bar. Sections: Tasks, Projects, People. Max ~5 results per section with a "See all results" link. "No results" state when query returns nothing. Dismisses on Escape or outside click. |
| Dynamic Custom Field Filters | Filter controls added dynamically to filter bars based on the active team scope. Text fields get a text search input. Dropdown fields get a select. Number fields get a min/max range input. Date fields get a date range picker. Checkbox fields get a boolean toggle. |

---

#### Sprint 7 — UI Acceptance Criteria

- [ ] Global search bar is visible on every authenticated screen in the top nav
- [ ] Typing 2+ characters shows instant results in a dropdown without navigating away
- [ ] Results are grouped into Tasks, Projects, and People sections
- [ ] Archived tasks appear in results with a visible "Archived" badge
- [ ] Clicking a result navigates to the correct page
- [ ] Ctrl+K / Cmd+K focuses the search bar from any screen
- [ ] "No results" state is clear and helpful
- [ ] Custom field filters appear on the Task Board and task list filter bars for applicable fields
- [ ] Each custom field filter matches the correct input type for that field's data type
- [ ] Custom field filters can be saved as part of a saved view

---

### Sprint 8 — File Management

**Sprint Goal:** File attachments work on tasks and EOD wrap-ups. PDFs and images preview in-app. All files are stored permanently — no deletion once attached to a task.

**Duration Estimate:** 1 week

**Depends On:** Sprint 2 (tasks and wrap-ups must exist as attachment targets). Sprint 4 (EOD wrap-up file upload builds on the existing wrap-up UI).

---

#### Screens with Changes in Sprint 8

No new full screens. The following existing screens gain file functionality:

| Screen | Route | What Is Added |
|---|---|---|
| Task Detail | `/tasks/:id` | General file attachments section (separate from completion report). Drag-and-drop upload. Attached files list with preview/download. Files marked permanent — no delete button. Upload logged in task timeline. |
| EOD Wrap-up | `/wrapup` | File upload already scaffolded in Sprint 4 UI. This sprint wires it to real storage. |

---

#### Modals to Build

| Modal | ID | Triggered By | Key Behaviour |
|---|---|---|---|
| File Preview | M17 | Clicking any attached file (Task Detail, Wrap-up) | Full-width overlay. PDF viewer (PDF.js or similar) for PDFs. Native image display for JPG/PNG. Filename and file size in header. Download button. Close (✕ or Escape). Unsupported preview types show a download-only fallback. |

---

#### Key Components Introduced in Sprint 8

| Component | Description |
|---|---|
| File Upload Component | Drag-and-drop zone + "Browse files" button. Shows file name and size after selection. Progress indicator during upload. Error state if file type or size is rejected. Reusable — used on Task Detail, Completion Report, and EOD Wrap-up. |
| Attached File Row | Filename, file type icon, file size, preview icon (if previewable), download icon. No delete button for task-attached files (permanent). Clicking the preview icon opens M17. |
| File Preview Modal (M17) | Full-width overlay. PDF.js embedded for PDFs. Standard `<img>` for images. Download button always present. Close via ✕ button or pressing Escape. |

---

#### Sprint 8 — UI Acceptance Criteria

- [ ] Task Detail has a file attachment section separate from the completion report
- [ ] Drag-and-drop and click-to-browse both work for uploading files
- [ ] Unsupported file types are rejected at upload with a clear error (not a silent failure)
- [ ] Uploaded files appear in the attached files list immediately after upload
- [ ] Clicking a previewable file (PDF, image) opens the in-app preview modal — no forced download
- [ ] Clicking a non-previewable file (DOCX, XLSX) triggers download directly
- [ ] Download button in the preview modal works
- [ ] Task-attached files have no delete button — they are permanent
- [ ] File upload is logged in the task timeline ("Ahmed attached report.pdf")
- [ ] EOD Wrap-up file upload is now wired to real storage — files persist after submission
- [ ] File upload on completion report works as a supplement or replacement for report text

---

### Sprint 9 — Reporting & Export

**Sprint Goal:** All five report types are functional — weekly team performance, individual employee, billable hours summary, system activity, and full task export. PDF and CSV formats. Role-scoped access.

**Duration Estimate:** 2 weeks

**Depends On:** Everything. Reports aggregate task data (Sprint 2), planning data (Sprint 4), and user/team data (Sprint 1). Cannot be built meaningfully without all three layers having real data.

---

#### Screens to Build

| # | Screen | Route | Access | Notes |
|---|---|---|---|---|
| 22 | Reports | `/reports` | Manager+ | Report type selector, parameter inputs (date range, team, employee), format selector (PDF / CSV), Generate button, download links for generated files. System Activity report type hidden from non-admins. |

---

#### Key Components Introduced in Sprint 9

| Component | Description |
|---|---|
| Report Type Selector | Radio group or tab group. Five options: Weekly Team Performance, Individual Employee, Billable Hours Summary, Full Task Export, System Activity (visible to Admin only). Selecting a type shows/hides the relevant parameter fields below. |
| Report Parameter Area | Changes based on selected report type. Always includes: date range picker. Weekly Team and Billable additionally show: Team selector. Individual Employee additionally shows: Employee selector. |
| Format Selector | Toggle group: "PDF" / "CSV". System Activity is CSV only (no PDF option). Full Task Export is CSV only. |
| Generate Button | Primary button. Shows loading spinner + "Generating..." text during generation. Disabled while generating. |
| Generated Report Result | Card appearing below the generate button after success. Shows: report name, date range, generated at timestamp. PDF and/or CSV download buttons. |
| Report Error State | Alert below the generate button if generation fails. "Failed to generate report. Please try again." with a Retry button. |

---

#### Sprint 9 — UI Acceptance Criteria

- [ ] Reports page is accessible only to Manager and above — others see 403 or are not shown the sidebar link
- [ ] Selecting a report type shows only the relevant parameter fields for that type
- [ ] System Activity option is only visible to Admin
- [ ] Date range picker defaults to the current week, is required before generating
- [ ] Team selector is scoped — managers cannot select teams outside their access scope
- [ ] Generate button shows a loading state; the UI is non-interactive while generating
- [ ] After generation, a result card appears with working download links for PDF and/or CSV
- [ ] PDF downloads open a formatted, readable document — not a raw data dump
- [ ] CSV downloads open a clean spreadsheet with correct headers and all fields including custom fields
- [ ] Failed generation shows an error with a retry action

---

### Sprint 10 — Polish: Mobile, Onboarding, Archiving, Audit Trail, Settings

**Sprint Goal:** Mobile UI is refined for all core workflows. New employees get a guided onboarding experience. Admins have a setup flow. Old completed tasks archive automatically. The system audit trail gives Admin visibility into every structural change. All settings pages are fully built and functional. The product is production-ready.

**Duration Estimate:** 2 weeks

**Depends On:** All previous sprints complete. Sprint 10 is the polish and completion pass across the entire product.

---

#### Screens to Build

| # | Screen | Route | Access | Notes |
|---|---|---|---|---|
| 23 | Settings — User Preferences | `/settings` | All | Notification preferences (3 optional toggles). Default task view (List / Kanban toggle). Saved filter views manager (list + delete). |
| 24 | Settings — Team Settings | `/settings/team` | Manager+ | Planning mode toggle. Submission deadline (day + time, conditional on Locked mode). Daily check-in mandatory toggle. EOD wrap-up mandatory toggle. Link to Custom Fields page. |
| 25 | Settings — System Settings | `/settings/system` | Admin | Organisation name. Default available hours. Archiving window (number of months). Links to User Management and Team Management. |
| 26 | Admin — Audit Trail | `/admin/audit` | Admin | Filter by date range, event type, and actor. Chronological event table: timestamp, actor, event type, description, old value, new value. Pagination. |
| 27 | First-Login Onboarding Flow | `/onboarding` | New employees (first login only) | 3-step flow. No sidebar. Step 1: Welcome + team/manager info. Step 2: Pre-assigned tasks. Step 3: Prompt to set up weekly plan. |
| 28 | Admin Setup Flow | `/setup` | Admin (first time) | 3-step flow. No sidebar. Step 1: Create departments. Step 2: Create teams. Step 3: Add employees (individual or bulk). |

---

#### Modals to Build

| Modal | ID | Triggered By | Key Behaviour |
|---|---|---|---|
| Deactivation Task Reassignment Flow | M18 | Admin deactivating a user | Full-page modal or dedicated step flow. Shows all open tasks assigned to the user. Admin must reassign or close each task before deactivation completes. Cannot dismiss without handling all tasks. |

---

#### Key Components Introduced in Sprint 10

| Component | Description |
|---|---|
| Settings Sub-Nav | Left-side vertical navigation within the settings layout. Links: User Preferences (all), Team Settings (Manager+), System Settings (Admin). Active section highlighted. On mobile, becomes a top horizontal tab bar. |
| Audit Event Table | Full-width table: Timestamp, Actor (name + role), Event Type (badge), Description, Old Value, New Value. Old/New value columns truncate long text — full value on hover. Paginated. Read-only. |
| Audit Event Type Filter | Multi-select or group of toggles. Types: User Created, User Edited, User Deactivated, Team Created, Team Edited, Role Changed, Settings Changed, Export Generated. |
| Onboarding Step Flow | Full-screen layout with no sidebar navigation. Progress indicator at top (Step X of 3). Each step has a heading, content area, and a single forward button. No back navigation on Step 3. |
| Admin Setup Step Flow | Same structure as onboarding. Three steps: departments, teams, employees. Progress indicator. Forward button disabled until minimum data is entered (at least one department on Step 1, one team on Step 2). |
| Deactivation Task Reassignment List (M18) | Lists all open tasks for the user being deactivated. Each row: task title, current status, reassign dropdown (team-scoped), or "Close task" option. Deactivate button activates only when list is empty. |
| Archiving Window Selector | Number input + "months" label. In System Settings. Validates min (1 month) and max (reasonable upper bound). |

---

#### Sprint 10 — Mobile UI Refinement Pass

All screens built in Sprints 1–9 are reviewed and refined for mobile in this sprint. Specific changes:

| Screen | Mobile Treatment |
|---|---|
| Admin — User Management | Table collapses to stacked user cards — one card per employee showing name, role, team, status, and action buttons |
| Admin — Team Management | Hierarchy tree becomes a vertical accordion — departments collapse/expand, teams listed underneath |
| My Tasks / Team Tasks | Status filter tabs scroll horizontally; task rows become compact touch-friendly cards |
| Task Detail | Right sidebar moves entirely below the main content area; tabs (Details / Timeline / Comments) remain at top |
| Task Board (Kanban) | Defaults to list view on mobile; a column selector lets the user pick which status column to view |
| My Weekly Plan | Shows one day at a time on smallest screens; left/right arrows to navigate between days |
| Daily Check-in / EOD Wrap-up | Full-width layout with large touch targets; optimised for quick thumbs-only completion |
| Team Plans / Team Pulse / Workload View | Grid simplified — rows collapse; tap on employee name to expand that employee's day grid |
| Dashboard — My Overview | 2×2 widget grid becomes single-column stacked cards |
| Reports | Single column stacked form; same functionality |
| Settings | Left sub-nav becomes a top horizontal tab bar |

---

#### Sprint 10 — UI Acceptance Criteria

- [ ] Every page is functional on iOS Safari and Chrome Android at 375px and 768px widths
- [ ] No horizontal overflow on any screen in portrait mobile layout
- [ ] Touch targets are sized appropriately (minimum 44×44px for interactive elements)
- [ ] Daily check-in and EOD wrap-up can be completed entirely on mobile with no friction
- [ ] Sidebar collapses to hamburger menu on all mobile screens and opens as a full-height overlay drawer
- [ ] Notification settings page has all three optional toggle types; saving persists the preference
- [ ] Team settings page only accessible to Manager and above; settings saved are reflected immediately
- [ ] System settings page only accessible to Admin; archiving window and org name fields functional
- [ ] Audit trail lists events in correct chronological order; filters narrow results correctly
- [ ] Audit trail is read-only — no edit or delete actions visible
- [ ] First-login onboarding launches automatically on first login; does not re-appear after completion
- [ ] Admin setup flow launches on admin's first login; re-enterable from System Settings
- [ ] Deactivating a user triggers M18 — deactivation cannot complete while any open task remains unhandled
- [ ] After Sprint 10, no screen is missing a loading skeleton, empty state, or error state

---

## 3. Global Shell

| Shell Element | Type | Description | States / Variants |
|---|---|---|---|
| Top Navigation Bar | Component | Fixed top bar across all authenticated screens | Authenticated only |
| Sunday Logo / Wordmark | Image + Link | Top-left, navigates to `/dashboard` | Static |
| Global Search Bar | Input | Persistent search field — Sprint 7 onwards. `Ctrl+K` / `Cmd+K` shortcut | Default / Focused / With value / Results showing |
| Notification Bell | Icon Button | Shows unread count badge. Click opens notification panel | Default / Has unread (badge with count) / Panel open |
| Logged-In User Avatar | Avatar + Dropdown | Shows user's initials or photo, name, role badge. Dropdown: Profile, Settings, Logout | Default / Dropdown open |
| Role Badge | Badge | Inline role label next to user name in top bar | Static — Employee / Sr Employee / Asst Manager / Manager / Sr Manager / Admin |
| Logout Button | Button (in dropdown) | Clears session, redirects to `/login` | Default / Loading |
| Left Sidebar | Component | Navigation links scoped by role. Collapsible. | Expanded / Collapsed / Hidden (mobile) |
| Sidebar Nav Links | Nav Items | Links scoped by role — see Navigation Map | Active / Default / Hover |
| Hamburger Menu Button | Icon Button | Mobile only — opens sidebar as overlay drawer | Default / Open |
| Sidebar Overlay (mobile) | Overlay | Dark overlay behind open sidebar on mobile | Visible / Hidden |
| Main Content Area | Layout | Scrollable content area to the right of sidebar | Loading / Populated |
| Global Loading Overlay | Overlay | Full-screen spinner on route transitions | Visible / Hidden |
| Toast Notification Area | Component | Fixed bottom-right. Auto-dismisses. | Success / Error / Warning / Info |
| Error Boundary Screen | Screen | Full-page error state with refresh option | Visible on unhandled errors |
| Auth Guard Wrapper | Logic | Redirects unauthenticated users to `/login` | Active on all `/` routes |
| 403 / Permission Screen | Screen | Shown when a role tries to access a restricted page | Visible on permission failure |
| Notification Panel | Drawer | Right-side overlay showing recent notifications, mark-read actions | Open / Closed |

**Sidebar Nav Links by Role:**

| Link | Roles That See It | Route |
|---|---|---|
| Dashboard | All | `/dashboard` |
| My Tasks | All | `/tasks` |
| Task Board | All | `/board` |
| My Plan | All | `/plan` |
| Daily Check-in | All | `/checkin` |
| EOD Wrap-up | All | `/wrapup` |
| Team Tasks | Asst Manager+ | `/team/tasks` |
| Team Plans | Asst Manager+ | `/team/plans` |
| Team Pulse | Asst Manager+ | `/dashboard/team-pulse` |
| Workload View | Manager+ | `/dashboard/workload` |
| Activity Feed | All (scoped) | `/dashboard/activity` |
| Reports | Manager+ | `/reports` |
| Admin — Users | Admin | `/admin/users` |
| Admin — Teams | Admin | `/admin/teams` |
| Settings | All | `/settings` |
| Audit Trail | Admin | `/admin/audit` |

---

## 4. Screen Inventory

| # | Screen Name | Route | Who Sees It | Sprint |
|---|---|---|---|---|
| 1 | Login | `/login` | Public | 1 |
| 2 | Forgot Password | `/forgot-password` | Public | 1 |
| 3 | Set Password (Invite Acceptance) | `/set-password?token=xxx` | Public (valid token) | 1 |
| 4 | Admin — User Management | `/admin/users` | Admin | 1 |
| 5 | Admin — User Create Form | `/admin/users/new` | Admin | 1 |
| 6 | Admin — User Edit Form | `/admin/users/:id/edit` | Admin | 1 |
| 7 | Admin — Team & Department Management | `/admin/teams` | Admin | 1 |
| 8 | Admin — Bulk User Import | `/admin/users/import` | Admin | 1 |
| 9 | My Tasks | `/tasks` | All | 2 |
| 10 | Task Detail | `/tasks/:id` | Anyone with access | 2 |
| 11 | Team Tasks | `/team/tasks` | Asst Manager+ | 2 |
| 12 | Task Board (Kanban) | `/board` | All | 3 |
| 13 | Custom Field Management | `/settings/custom-fields` | Manager+ | 3 |
| 14 | My Weekly Plan | `/plan` or `/plan/week/:weekStart` | All employees | 4 |
| 15 | Daily Check-in | `/checkin` | All employees | 4 |
| 16 | EOD Wrap-up | `/wrapup` | All employees | 4 |
| 17 | Team Plans View | `/team/plans` | Asst Manager+ | 4 |
| 18 | Dashboard — My Overview | `/dashboard` | All | 5 |
| 19 | Dashboard — Team Pulse | `/dashboard/team-pulse` | Asst Manager+ | 5 |
| 20 | Dashboard — Workload View | `/dashboard/workload` | Manager+ | 5 |
| 21 | Activity Feed | `/dashboard/activity` | All (scoped) | 5 |
| 22 | Reports | `/reports` | Manager+ | 9 |
| 23 | Settings — User Preferences | `/settings` | All | 10 |
| 24 | Settings — Team Settings | `/settings/team` | Manager+ | 10 |
| 25 | Settings — System Settings | `/settings/system` | Admin | 10 |
| 26 | Admin — Audit Trail | `/admin/audit` | Admin | 10 |
| 27 | First-Login Onboarding Flow | `/onboarding` | New employees (first login) | 10 |
| 28 | Admin Setup Flow | `/setup` | Admin (first time) | 10 |
| 29 | Project / Category Management | `/settings/projects` | Manager+ | 2 |

**Modals (no dedicated route):**

| # | Modal Name | Triggered By | Sprint |
|---|---|---|---|
| M1 | Quick Task Creation Modal | "+ New Task" button (all screens) | 2 |
| M2 | Confirm Deactivate User Modal | Row action on User Management | 1 |
| M3 | Confirm Reactivate User Modal | Row action on User Management | 1 |
| M4 | Add Department Modal | Admin Team Management | 1 |
| M5 | Add/Edit Team Modal | Admin Team Management | 1 |
| M6 | Resend Invite Modal | Row action on User Management | 1 |
| M7 | Reassign Task Modal | Reassign action on Task Detail or Team Tasks | 2 |
| M8 | Completion Report Prompt | Status change → Done (from Kanban drag) | 2/3 |
| M9 | Completion Report — Reviewer Send-Back Modal | Reviewer rejects task | 2 |
| M10 | Add/Edit Custom Field Modal | Custom Field Management | 3 |
| M11 | Archive Custom Field Confirm Modal | Archive action on Custom Fields | 3 |
| M12 | Save View Modal | "Save Current Filters" action | 3 |
| M13 | Add Subtask Inline Form | Task Detail — Add Subtask | 2 |
| M14 | Add Dependency Modal | Task Detail — Add Dependency | 2 |
| M15 | Plan Comment Modal | Manager adds comment on Team Plans | 4 |
| M16 | Big Fat Warning Acknowledge Modal | Manager acknowledges unplanned employee | 5 |
| M17 | File Preview Modal | Click file attachment on Task Detail or Wrap-up | 8 |
| M18 | Deactivation Task Reassignment Flow Modal | Admin deactivates user | 10 |
| M19 | Add/Edit Project Modal | Project Management page | 2 |

---

## 5. Per-Screen Component Breakdown

---

### Screen 1 — Login — `/login`

**Layout:** Centered card on full-page background. Brand section above form.

**Page-Level States:**
- Loading state: Sign In button disabled with spinner
- Error state: Inline error banner below form
- Default: Empty form ready for input

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Sunday Logo | Image | Sunday wordmark/logo | — | Static | Top of card |
| Tagline | Text | "Did they do it? Are their days planned?" | — | Static | Subheading below logo |
| Organisation Name | Text | Org name from system config | — | Static | Below tagline |
| Email Input | Text Input | Label: "Email" / Placeholder: "you@company.com" | onChange → validate format | Default / Focused / With value / Error | Required |
| Password Input | Password Input | Label: "Password" / Placeholder: "Enter password" | onChange / Show-hide toggle | Default / Focused / With value / Show / Error | Required |
| Show/Hide Password Toggle | Icon Button | Eye icon / Slash-eye icon | onClick → toggle visibility | Show / Hide | Inside password field |
| Sign In Button | Button (Primary) | "Sign In" | onClick → submit credentials | Default / Loading (spinner) / Disabled | Full width |
| Forgot Password Link | Text Link | "Forgot password?" | onClick → navigate to `/forgot-password` | Default / Hover | Below Sign In button |
| Form-Level Error Message | Alert | "Invalid email or password" / "This account has been deactivated" | — | Visible on error / Hidden | Below password field |

---

### Screen 2 — Forgot Password — `/forgot-password`

**Layout:** Centered card, minimal.

**Page-Level States:**
- Default: Form ready
- Loading: Button spinner
- Success: Confirmation message replaces form

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Heading | Heading | "Reset your password" | — | Static | H1 |
| Instruction Text | Text | "Enter your email and we'll send a reset link." | — | Static | |
| Email Input | Text Input | Label: "Email" / Placeholder: "you@company.com" | onChange → validate | Default / Focused / Error | Required |
| Send Reset Link Button | Button (Primary) | "Send Reset Link" | onClick → submit | Default / Loading / Disabled | Full width |
| Back to Login Link | Text Link | "← Back to login" | onClick → navigate to `/login` | Default / Hover | Below button |
| Success Confirmation | Alert (Success) | "If this email exists, a reset link has been sent." | — | Visible on success | Replaces form — same message regardless |
| Form-Level Error | Alert | "Please enter a valid email address" | — | Visible / Hidden | |

---

### Screen 3 — Set Password (Invite Acceptance) — `/set-password?token=xxx`

**Layout:** Centered card with personalised welcome.

**Page-Level States:**
- Default: Form ready with welcome message
- Loading: Button spinner
- Error: Invalid/expired token — form replaced with error message

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Welcome Heading | Heading | "Welcome, [Employee Name]!" | — | Static | H1 |
| Team Context Text | Text | "You've been added to [Team Name]." | — | Static | Below heading |
| Password Input | Password Input | Label: "New Password" / Placeholder: "Create a password" | onChange → strength check | Default / Focused / Weak / Medium / Strong | Required |
| Password Strength Indicator | Progress Bar | Weak / Medium / Strong | onChange on password field | Weak (red) / Medium (amber) / Strong (green) | Below password field |
| Confirm Password Input | Password Input | Label: "Confirm Password" / Placeholder: "Re-enter your password" | onChange → match validation | Default / Focused / Mismatch error | Required |
| Password Mismatch Error | Inline Error | "Passwords do not match" | — | Visible / Hidden | Below confirm field |
| Set Password Button | Button (Primary) | "Set Password & Continue" | onClick → submit | Default / Loading / Disabled | Disabled until passwords match and valid |
| Expired Token Error | Alert (Error) | "This invite link has expired or is invalid. Contact your administrator." | — | Visible / Hidden | Replaces form on invalid token |

---

### Screen 4 — Admin — User Management — `/admin/users`

**Layout:** Full-width. Header row + filter bar + data table.

**Page-Level States:**
- Loading: Table skeleton rows
- Empty: Empty state message
- Error: Error banner
- Populated: Full table

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Users" | — | Static | H1 |
| Total User Count | Badge/Text | "[N] employees" | — | Dynamic | Next to title |
| Add User Button | Button (Primary) | "+ Add User" | onClick → navigate to `/admin/users/new` | Default / Hover | Top right |
| Bulk Import Button | Button (Secondary) | "Bulk Import" | onClick → navigate to `/admin/users/import` | Default / Hover | Next to Add User |
| Name/Email Search Input | Text Input | Placeholder: "Search by name or email..." | onChange → filter table live | Default / Focused / With value | Debounced 300ms |
| Role Filter Dropdown | Select | Label: "Role" / Options: All, Employee, Senior Employee, Asst Manager, Manager, Senior Manager, Admin | onChange → filter | Default / Open / Selected | Single select |
| Team Filter Dropdown | Select | Label: "Team" / Options: All + team list | onChange → filter | Default / Open / Selected | Single select |
| Status Filter Toggle | Toggle Group | "All" / "Active" / "Deactivated" | onClick → filter | All selected by default | Three-way toggle |
| Clear Filters Link | Text Link | "Clear filters" | onClick → reset all filters | Visible only when filters active | |
| Users Table | Table | Columns: Name, Email, Role, Team, Manager, Work Week, Timezone, Status, Actions | Row click → none (use actions) | Loading / Empty / Populated | Sortable: Name, Role, Team, Status |
| Table — Name Column | Text | "[First Last]" | — | Static | |
| Table — Email Column | Text | "[email]" | — | Static | |
| Table — Role Column | Badge | Role name, colour-coded by level | — | Static | |
| Table — Team Column | Text Link | Team name | onClick → Admin Teams page | Static | |
| Table — Manager Column | Text | Manager name | — | Static | |
| Table — Work Week Column | Text | "Sun–Thu" / "Mon–Fri" | — | Static | |
| Table — Timezone Column | Text | "Asia/Dhaka" / "Europe/London" | — | Static | |
| Table — Status Column | Badge | "Active" (green) / "Deactivated" (grey) | — | Active / Deactivated | |
| Row — Edit Button | Icon Button | Pencil icon | onClick → navigate to `/admin/users/:id/edit` | Default / Hover | Per-row |
| Row — Deactivate Button | Icon Button | User-minus icon | onClick → open Confirm Deactivate Modal | Default / Hover / Hidden (if already deactivated) | Per-row |
| Row — Reactivate Button | Icon Button | User-check icon | onClick → open Confirm Reactivate Modal | Default / Hover / Hidden (if active) | Per-row |
| Row — Resend Invite Button | Icon Button | Mail icon | onClick → open Resend Invite Modal | Visible only if invite not accepted | Per-row |
| Pagination Controls | Component | Prev / Page numbers / Next | onClick → change page | Default / Disabled at limits | |
| Empty State | State | "No employees yet. Add your first team member to get started." | "+ Add User" CTA button | Visible when 0 rows | |
| Table Skeleton | State | Grey loading rows | — | Visible during fetch | |
| Error Banner | Alert | "Failed to load users. Please try again." | Retry button | Visible on error | |

---

### Screen 5 & 6 — Admin — User Create / Edit Form — `/admin/users/new` and `/admin/users/:id/edit`

**Layout:** Single column form with grouped sections.

**Page-Level States:**
- Create mode: Blank form
- Edit mode: Pre-populated form
- Saving: Submit button loading
- Validation errors: Inline per field

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Add Employee" / "Edit Employee" | — | Static | H1 |
| Section Heading — Personal Info | Heading | "Personal Information" | — | Static | H2 |
| First Name Input | Text Input | Label: "First Name" / Placeholder: "First name" | onChange | Default / Focused / Error | Required |
| Last Name Input | Text Input | Label: "Last Name" / Placeholder: "Last name" | onChange | Default / Focused / Error | Required |
| Email Input | Text Input | Label: "Email Address" / Placeholder: "email@company.com" | onChange | Default / Focused / Error | Required. Read-only in edit mode after invite accepted. |
| Section Heading — Role & Team | Heading | "Role & Team" | — | Static | H2 |
| Role Dropdown | Select | Label: "Role" / Options: Employee, Senior Employee, Asst Manager, Manager, Senior Manager, Admin | onChange | Default / Open / Selected / Error | Required |
| Team Dropdown | Select | Label: "Team" / Options: populated from teams | onChange | Default / Open / Selected / Error | Required |
| Reporting Manager Dropdown | Select | Label: "Reporting Manager" / Options: Manager+ users filtered by team/dept | onChange | Default / Open / Selected | Required for non-Admin roles |
| Section Heading — Schedule | Heading | "Work Schedule" | — | Static | H2 |
| Work Week Day Selector | Checkbox Group | Labels: Mon, Tue, Wed, Thu, Fri, Sat, Sun | onChange → update selection | Default / Selected | Min 1 day required |
| Timezone Dropdown | Select + Search | Label: "Timezone" / Searchable IANA timezone list | onChange / onSearch | Default / Open / Searching / Selected | Required. Searchable. |
| Available Hours Input | Number Input | Label: "Available Hours Per Day" / Default: 8 | onChange | Default / Focused / Error | Min: 1, Max: 24 |
| Section Heading — Permissions | Heading | "Permissions" | — | Static | H2 |
| Billable Permissions Toggle | Toggle Group | "Non-Billable Only" / "Both" / "Billable Only" | onClick → set value | Three states | Default: Non-Billable |
| Save Button | Button (Primary) | "Save & Send Invite" (create) / "Save Changes" (edit) | onClick → submit form | Default / Loading / Disabled | Full width or right-aligned |
| Cancel Button | Button (Secondary) | "Cancel" | onClick → navigate back to `/admin/users` | Default / Hover | |
| Form-Level Error | Alert | "Please correct the errors below before saving." | — | Visible on submit fail | Top of form |
| Per-Field Validation Errors | Inline Error Text | Field-specific messages | Triggered onBlur + onSubmit | Visible / Hidden | Below each field |

---

### Screen 7 — Admin — Team & Department Management — `/admin/teams`

**Layout:** Full-width. Header + hierarchical tree table.

**Page-Level States:**
- Loading: Skeleton rows
- Empty: Empty state
- Populated: Department + nested team rows

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Teams & Departments" | — | Static | H1 |
| Add Department Button | Button (Primary) | "+ Add Department" | onClick → open Add Department Modal | Default / Hover | Top right |
| Add Team Button | Button (Secondary) | "+ Add Team" | onClick → open Add/Edit Team Modal | Default / Hover | Next to Add Department |
| Department Row | Table Row (Parent) | Department name, Senior Manager name, team count | onClick → expand/collapse | Expanded / Collapsed | Bolded row |
| Expand/Collapse Toggle | Icon Button | Chevron icon | onClick → toggle children | Expanded / Collapsed | Left of department name |
| Dept — Name Column | Text | Department name | — | Static | |
| Dept — Senior Manager Column | Text | Senior Manager name | — | Static | |
| Dept — Team Count Column | Text | "[N] teams" | — | Dynamic | |
| Dept — Edit Button | Icon Button | Pencil icon | onClick → open Add/Edit Department Modal (edit mode) | Default / Hover | Per department row |
| Dept — Delete Button | Icon Button | Trash icon | onClick → confirm modal | Default / Hover | Only if 0 teams |
| Team Row (Nested) | Table Row (Child) | Team name, Manager, member count, planning mode, submission deadline | — | Default | Indented under department |
| Team — Name Column | Text | Team name | — | Static | |
| Team — Manager Column | Text | Manager name | — | Static | |
| Team — Member Count Column | Text | "[N] members" | — | Dynamic | |
| Team — Planning Mode Badge | Badge | "Locked" (blue) / "Fluid" (grey) | — | Static | |
| Team — Submission Deadline Column | Text | "[Day] [Time] [TZ]" | — | Static | e.g. "Sunday 20:00 BST" |
| Team — Edit Button | Icon Button | Pencil icon | onClick → open Add/Edit Team Modal (edit mode) | Default / Hover | Per team row |
| Empty State | State | "No departments yet. Start by creating your organisational structure." | "+ Add Department" CTA | Visible when 0 departments | |
| Loading Skeleton | State | Skeleton rows | — | Visible during fetch | |

---

### Screen 8 — Admin — Bulk User Import — `/admin/users/import`

**Layout:** Stepped single-column flow: Instructions → Upload → Preview → Confirm.

**Page-Level States:**
- Step 1: Instructions + upload zone
- Step 2: Parsed preview table
- Step 3: Success summary or error list

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Bulk Import Users" | — | Static | H1 |
| Instructions Section | Text Block | CSV format explanation, required columns, encoding notes | — | Static | |
| Download CSV Template Link | Text Link + Icon | "Download CSV template" | onClick → download .csv | Default / Hover | |
| File Upload Zone | Drop Zone | "Drag and drop a .csv file here, or click to browse" | onDrop / onClick → file picker | Default / Drag-over (highlight) / File selected | Accepts .csv only |
| File Picker Input | Hidden Input | — | onChange → parse file | — | Triggered by upload zone click |
| Selected File Info | Text | "[filename.csv] — [N KB]" | — | Visible when file selected | Replace upload zone |
| Remove File Button | Icon Button | ✕ icon | onClick → clear selection | Default / Hover | Next to file info |
| Parse/Preview Button | Button (Primary) | "Preview Import" | onClick → parse CSV | Default / Loading | Triggers preview step |
| Preview Table | Table | Columns match CSV headers: Name, Email, Role, Team, Work Week, Timezone | — | Loading / Populated | |
| Row Validation Status | Icon per row | ✓ (valid, green) / ✗ (invalid, red) | — | Valid / Invalid | First column of preview table |
| Row Validation Error Tooltip | Tooltip | Specific error per row | onHover / onFocus | Visible / Hidden | On ✗ icon |
| Invalid Row Count Alert | Alert (Warning) | "[N] rows have errors and cannot be imported. Fix the CSV and re-upload." | — | Visible if errors present | Above import button |
| Import Button | Button (Primary, Destructive) | "Import [N] Users" | onClick → confirm and submit | Default / Loading / Disabled (if errors) | Disabled if any row invalid |
| Cancel Button | Button (Secondary) | "Cancel" | onClick → navigate to `/admin/users` | Default / Hover | |
| Success Summary | Alert (Success) | "[N] users created. Invite emails have been sent." | — | Visible on success | Replaces table |
| Back to User Management Link | Text Link | "← Back to Users" | onClick → navigate to `/admin/users` | Visible on success | |

---

### Screen 9 — My Tasks — `/tasks`

**Layout:** Full-width. Header + filter bar + task list.

**Page-Level States:**
- Loading: Card skeletons
- Empty: Empty state
- Populated: Task rows/cards grouped or filtered

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "My Tasks" | — | Static | H1 |
| Task Count | Text | "[N] tasks" | — | Dynamic | |
| New Task Button | Button (Primary) | "+ New Task" | onClick → open Quick Task Creation Modal | Default / Hover | Top right |
| Status Filter Tabs | Tab Group | All / To Do / In Progress / In Review / Done | onClick → filter by status | Active tab highlighted | |
| Priority Filter Dropdown | Select | Label: "Priority" / All / High / Medium / Low | onChange → filter | Default / Open / Selected | |
| Task Type Filter Dropdown | Select | Label: "Type" / All / Planned / Ad Hoc | onChange → filter | Default / Open / Selected | |
| Task Nature Filter Dropdown | Select | Label: "Nature" / All / Core / Supporting | onChange → filter | Default / Open / Selected | |
| Due Date Range Filter | Date Range Picker | Label: "Due Date" / From–To | onChange → filter | Default / Open / Selected | |
| Billable Filter Toggle | Toggle | "Billable only" | onChange → filter | On / Off | |
| Project Filter Dropdown | Select | Label: "Project" / All + project list | onChange → filter | Default / Open / Selected | |
| Sort Dropdown | Select | Label: "Sort by" / Due Date (asc/desc) / Priority / Created | onChange → resort | Default / Open / Selected | |
| Clear Filters Link | Text Link | "Clear filters" | onClick → reset filters | Visible when filters active | |
| Task Row/Card | List Item | Title, due date badge, priority badge, status badge, billable indicator, project tag | onClick → navigate to `/tasks/:id` | Default / Hover / Overdue (red due date) | |
| Task — Status Badge | Badge | To Do (grey) / In Progress (blue) / In Review (amber) / Done (green) | — | Four states | |
| Task — Priority Badge | Badge | High (red) / Medium (amber) / Low (grey) | — | Three states | |
| Task — Billable Indicator | Icon/Badge | "$" icon | — | Visible / Hidden | Only if billable task |
| Task — Overdue Indicator | Text (red) | Due date in red with "Overdue" label | — | Visible when past due date | |
| Inline Status Dropdown | Select (per row) | Current status options | onChange → change status (rules enforced) | Opens on click | Cannot jump to Done without report — triggers prompt |
| Empty State | State | "No tasks yet. Create your first task or wait for your manager to assign one." | "+ New Task" CTA | Visible when 0 tasks | |
| Loading Skeleton | State | Card skeleton rows | — | Visible during fetch | |
| Error Banner | Alert | "Failed to load tasks. Please try again." | Retry button | Visible on error | |

---

### Screen 10 — Task Detail — `/tasks/:id`

**Layout:** Two-column (main content left + metadata sidebar right). Timeline and Comments as tabs within main area.

**Page-Level States:**
- Loading: Field-level skeletons
- Normal: Populated task
- In Review: Reviewer action buttons visible
- Done: Read-only (except comments, timeline)
- Not Found / No Access: Error state

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Task Title | Editable Heading | Task title (H1) | onClick / onFocus → inline edit | Default / Editing / Read-only (Done state) | Editable by creator/assignee/manager |
| Status Badge | Badge + Dropdown | Current status | onClick → change status dropdown | To Do / In Progress / In Review / Done | Rules enforced — see business rules |
| Priority Badge | Badge + Dropdown | Current priority | onClick → change priority | High / Medium / Low | Editable by creator/manager |
| Task Type Badge | Badge | "Planned" / "Ad Hoc" | — | Static | |
| Task Nature Badge | Badge | "Core" / "Supporting" | — | Static | |
| Billable Badge | Badge | "$" / "Non-billable" | — | Visible / Hidden | |
| Tabs (main area) | Tab Group | "Details" / "Timeline" / "Comments" | onClick → switch tab | Active tab highlighted | |
| Description Editor | Rich Text Editor | Task description | onChange → auto-save or Save button | Default / Editing / Read-only | Collapsible |
| Subtasks Section | Sub-list | "Subtasks ([N])" heading + subtask rows | — | Expanded / Collapsed | |
| Subtask Row | List Item | Title, status badge, assignee avatar | onClick → navigate to subtask `/tasks/:subtaskId` | Default / Hover | |
| Subtask Status Toggle | Badge/Dropdown | Subtask status | onChange → update subtask status | To Do / In Progress / In Review / Done | |
| Add Subtask Button | Button (Secondary) | "+ Add Subtask" | onClick → open Add Subtask Inline Form | Default / Hover | Below subtask list |
| Dependencies Section | Sub-list | "Dependencies" heading | — | Expanded / Collapsed | |
| Blocked By Row | List Item | "Blocked by: [Task Title]" | onClick → navigate to that task | Default / Hover | Red indicator if blocking task not Done |
| Blocks Row | List Item | "Blocks: [Task Title]" | onClick → navigate to that task | Default / Hover | |
| Add Dependency Button | Button (Secondary) | "+ Add Dependency" | onClick → open Add Dependency Modal | Default / Hover | |
| Completion Report Section | Sub-section | "Completion Report" — appears when In Progress or In Review | — | Visible / Hidden based on status | |
| Completion Report Text Input | Textarea | Placeholder: "Describe what was completed..." | onChange | Default / Focused / Filled / Read-only (Done) | Required before marking Done |
| Completion Report File Upload | File Upload | "Attach a file" | onChange → upload | Default / Uploading / Uploaded | Optional alongside text |
| Reviewer Approve Button | Button (Primary) | "Approve — Mark Done" | onClick → approve → status → Done | Visible to reviewer when In Review | |
| Reviewer Send Back Button | Button (Secondary, Destructive) | "Send Back" | onClick → open Reviewer Send-Back Modal | Visible to reviewer when In Review | |
| Timeline Tab Content | Event List | Chronological events — oldest first | — | Read-only | See Timeline component below |
| Timeline Event Row | List Item | "[Actor] [action] — [timestamp]" with optional old/new value | — | Static | |
| Comments Tab Content | Thread | Comment list + input | — | Populated / Empty | |
| Comment Input | Textarea | Placeholder: "Add a comment..." | onChange | Default / Focused / With value | |
| Post Comment Button | Button (Primary) | "Post" | onClick → submit comment | Default / Loading / Disabled when empty | |
| Comment Row | List Item | Avatar, name, timestamp, comment text | — | Default | |
| Sidebar — Assignee Field | Editable Field | "Assignee" label + user name/avatar | onClick → user picker | Default / Editing | Editable by manager+ or creator |
| Sidebar — Creator Field | Read-Only Field | "Created by" + user name | — | Static | |
| Sidebar — Reviewer Field | Editable Field | "Reviewer" + user name or "None" | onClick → user picker | Default / Editing | Optional |
| Sidebar — Due Date Field | Editable Field | "Due Date" + date | onClick → date picker | Default / Editing / Overdue (red) | |
| Sidebar — Estimated Hours | Number Input | "Est. Hours" + number | onChange | Default / Editing | |
| Sidebar — Actual Hours | Number Input | "Actual Hours" + number | onChange | Default / Editing / Read-only (non-assignee) | |
| Sidebar — Review Hours | Number Input | "Review Hours" + number | onChange | Editable by reviewer | |
| Sidebar — Project Field | Editable Field | "Project" + project name | onClick → project picker | Default / Editing | |
| Sidebar — Custom Fields | Dynamic Fields | Rendered per type based on team's custom fields | onChange | Default / Editing | |
| Sidebar — Created At | Read-Only Field | "Created" + date/time | — | Static | |
| Task Not Found State | Error State | "Task not found or you don't have access." | "← Back to My Tasks" link | Visible on 404/403 | Full page |

---

### Screen 11 — Team Tasks — `/team/tasks`

**Layout:** Same as My Tasks but with additional assignee column and filter.

**Page-Level States:** Same as My Tasks.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Team Tasks" | — | Static | H1 |
| Team Name Subheading | Text | "[Team Name]" | — | Dynamic | Below title |
| Task Count | Text | "[N] tasks" | — | Dynamic | |
| New Task Button | Button (Primary) | "+ New Task" | onClick → Quick Task Creation Modal | Default / Hover | Can assign to any team member |
| Assignee Filter Dropdown | Select | Label: "Assignee" / All + team member list | onChange → filter | Default / Open / Selected | Additional filter vs My Tasks |
| Overdue Only Toggle | Toggle | "Overdue only" | onChange → filter | On / Off | Additional filter vs My Tasks |
| Status Filter Tabs | Tab Group | All / To Do / In Progress / In Review / Done | onClick → filter | Active tab highlighted | Same as My Tasks |
| [All other filters] | — | Same as My Tasks | — | Same as My Tasks | Priority, Type, Nature, Due Date, Billable, Project, Sort |
| Task Row/Card | List Item | Same as My Tasks + Assignee name/avatar column | onClick → `/tasks/:id` | Default / Hover / Overdue | |
| Row — Reassign Button | Icon Button | Person-swap icon | onClick → Reassign Task Modal | Default / Hover | Per-row. Manager+ only. |
| Empty State | State | "No tasks for your team yet. Create a task to get started." | "+ New Task" CTA | Visible when 0 | |

---

### Screen 12 — Task Board (Kanban) — `/board`

**Layout:** Four-column horizontal board. Filter bar above. Full-width scrollable.

**Page-Level States:**
- Loading: Column skeletons
- Empty: Empty state per column or global
- Populated: Cards in columns

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Task Board" | — | Static | H1 |
| New Task Button | Button (Primary) | "+ New Task" | onClick → Quick Task Creation Modal | Default / Hover | Top right |
| Saved Views Dropdown | Select | "Default View" + saved view list | onChange → apply saved filter | Default / Open / Active view highlighted | |
| Save View Button | Button (Secondary) | "Save View" | onClick → Save View Modal | Default / Hover | Saves current filters |
| [All filter controls] | Filter Bar | Same as My Tasks + Assignee (for managers) + custom field filters | onChange → filter board | Same as My Tasks | Horizontal filter row below title |
| Clear Filters Link | Text Link | "Clear filters" | onClick → reset | Visible when filters active | |
| Kanban Column — To Do | Column | "To Do" heading + task count | — | Default / Empty | |
| Kanban Column — In Progress | Column | "In Progress" heading + task count | — | Default / Empty | |
| Kanban Column — In Review | Column | "In Review" heading + task count | — | Default / Empty | |
| Kanban Column — Done | Column | "Done" heading + task count | — | Default / Empty | |
| Column Header | Text + Badge | Status name + "[N]" count badge | — | Static | |
| Task Card | Draggable Card | Title, assignee avatar, due date, priority colour stripe, billable badge | onDrag → move / onClick → `/tasks/:id` | Default / Dragging / Hover / Overdue | |
| Card — Priority Stripe | Colour Indicator | Left border: Red (High) / Amber (Medium) / Grey (Low) | — | Three states | |
| Card — Assignee Avatar | Avatar | User initials or photo | — | Static | |
| Card — Due Date | Text | Due date, red if overdue | — | Default / Overdue (red) | |
| Card — Billable Badge | Badge | "$" | — | Visible / Hidden | |
| Drag-and-Drop Handler | Interaction | Move card between columns | onDrop → update status | Allowed / Blocked | Blocked: dependency incomplete, no completion report |
| Drop Blocked Visual | Indicator | Column turns red, tooltip explains why | onDrag over blocked | Visible / Hidden | e.g. "Completion report required" |
| Completion Report Prompt | Modal trigger | Automatically opens M8 when card dragged to Done | onDrop to Done column | Triggered / Not triggered | |
| Empty Column State | State | "No tasks" (per column) | — | Visible when 0 cards | |
| Board Empty State | State | "No tasks match your filters" | Clear filters CTA | Visible when all columns empty | |

---

### Screen 13 — Custom Field Management — `/settings/custom-fields`

**Layout:** Single column. Header + field list table.

**Page-Level States:** Loading / Empty / Populated

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Custom Fields" | — | Static | H1 |
| Team/Project Scope Selector | Select | "Scope: [Team Name]" + team list | onChange → filter fields by scope | Default / Open / Selected | |
| Add Field Button | Button (Primary) | "+ Add Field" | onClick → Add/Edit Custom Field Modal | Default / Hover | |
| Field List Table | Table | Columns: Name, Field Type, Scope, Created By, Status, Actions | — | Loading / Empty / Populated | |
| Table — Name Column | Text | Field name | — | Static | |
| Table — Type Column | Badge | Text / Number / Date / Dropdown / Checkbox | — | Static | |
| Table — Scope Column | Text | "Team: [Name]" / "Project: [Name]" | — | Static | |
| Table — Created By Column | Text | User name | — | Static | |
| Table — Status Column | Badge | "Active" (green) / "Archived" (grey) | — | Active / Archived | |
| Row — Edit Button | Icon Button | Pencil icon | onClick → Add/Edit Custom Field Modal (edit mode) | Default / Hover / Hidden (archived) | |
| Row — Archive Button | Icon Button | Archive icon | onClick → Archive Confirm Modal | Default / Hover / Hidden (already archived) | |
| Empty State | State | "No custom fields. Create one to track additional data on your team's tasks." | "+ Add Field" CTA | Visible when 0 | |

---

### Screen 14 — My Weekly Plan — `/plan` or `/plan/week/:weekStart`

**Layout:** Grid layout. Header row (week nav + submission status). Day columns grid. Summary footer. Unplanned tasks panel below or sidebar.

**Page-Level States:**
- Loading: Grid skeleton
- Empty (no tasks in plan): Drag-prompt state
- Submitted (locked mode): Read-only grid
- Active: Editable grid

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "My Weekly Plan" | — | Static | H1 |
| Week Navigation — Previous Arrow | Icon Button | ← | onClick → previous week | Default / Hover / Disabled (future limit) | |
| Week Navigation — Date Range | Text | "12–16 Apr 2026" (or user's work week range) | — | Dynamic | Centre of nav |
| Week Navigation — Next Arrow | Icon Button | → | onClick → next week | Default / Hover | |
| Submission Status Badge | Badge | "Not Submitted" (amber) / "Submitted at [time]" (green) / "Fluid Mode — always editable" (blue) | — | Three states | Top right of header |
| Submit Plan Button | Button (Primary) | "Submit Plan" | onClick → submit + lock plan | Default / Hover / Hidden (fluid mode) / Hidden (already submitted) | Locked mode only |
| Week Grid | Grid | Day columns × task rows | — | Loading / Editable / Read-only | |
| Day Column Header | Text | Day name + date ("Mon 14 Apr") | — | Static | Columns match user's configured work week |
| Task Slot in Day Cell | Draggable Item | Task title + planned hours for that day | onDrag → remove from day / onHoursChange → update hours | Default / Hover | |
| Planned Hours Input (per slot) | Number Input | "[N] hrs" | onChange → update planned hours | Default / Focused / Error (exceeds available) | Inline in slot |
| Carry-over Badge | Badge | "Carry-over" | — | Visible / Hidden | On tasks rolled from previous days |
| Remove Task from Day Button | Icon Button | ✕ | onClick → return task to unplanned area | Default / Hover | In slot |
| Day Summary Footer Row | Row | "X / Y hrs" per column | — | Green (80–100%) / Amber (50–79% or >110%) / Red (<50% or empty) | Colour-coded |
| Available Hours Label | Text | "Available: [N] hrs" | — | Static per column | Below planned total |
| Unplanned Tasks Area | Panel | "Unplanned Tasks ([N])" heading + task cards | — | Expanded / Collapsed | Below grid or sidebar |
| Unplanned Task Card | Draggable Card | Task title, priority badge, due date | onDrag → place in day slot | Default / Dragging | |
| Manager Comments Section | Section | Comments from manager with name + timestamp | — | Visible / Hidden | Below grid |
| Manager Comment Entry | Text Block | "[Manager Name] — [Timestamp]: [Comment text]" | — | Static | |
| Overdue Deadline Warning | Alert (Red) | "Your plan was due [Day] at [Time] and has not been submitted." | — | Visible when deadline passed + not submitted | Prominent, top of page |
| Empty State | State | "Your plan is empty. Drag tasks from below into your days to plan your week." | — | Visible when grid empty | |

---

### Screen 15 — Daily Check-in — `/checkin`

**Layout:** Single column. Today's task list + notes input + submit.

**Page-Level States:**
- Not submitted: Form ready
- Already submitted today: Read-only with timestamp
- No plan for today: Warning state

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Daily Check-in" | — | Static | H1 |
| Date Subheading | Text | "Today — [Weekday, Day Month Year]" | — | Dynamic | |
| Today's Planned Tasks List | Read-Only List | Task title + planned hours per task | — | Populated / Empty | Pre-populated from weekly plan |
| Carry-over Alert | Alert (Amber) | "You have [N] carry-over tasks from yesterday." | — | Visible / Hidden | |
| Carry-over Task List | Read-Only List | Carry-over task titles | — | Visible / Hidden | Below main task list |
| No Plan Warning | Alert (Amber) | "You have no tasks planned for today. Add tasks or check in anyway." | — | Visible when no plan | |
| Notes Input | Textarea | Label: "Anything to flag?" / Placeholder: "Anything your manager should know about today?" | onChange | Default / Focused / With value | Optional |
| Add Unplanned Task Button | Button (Secondary) | "+ Add unplanned task" | onClick → Quick Task Creation Modal (pre-set: Ad Hoc) | Default / Hover | |
| Submit Check-in Button | Button (Primary) | "Submit Check-in" | onClick → submit | Default / Loading / Disabled (if already submitted) | |
| Already Submitted State | Read-Only View | "Check-in submitted at [time]" + task list + notes | — | Read-only | Replaces form |
| Optional Dismiss Button | Button (Text) | "Skip for today" | onClick → dismiss | Visible only if check-in is optional for the team | |

---

### Screen 16 — EOD Wrap-up — `/wrapup`

**Layout:** Single column. Planned vs actual comparison table + notes + submit.

**Page-Level States:**
- Not submitted: Form with auto-filled data
- Already submitted: Read-only view
- Discrepancies present: Warning alerts

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "EOD Wrap-up" | — | Static | H1 |
| Date Subheading | Text | "Today — [Weekday, Day Month Year]" | — | Dynamic | |
| Planned vs Actual Table | Table | Columns: Task, Planned Hours, Actual Hours, Status, Match | — | Loading / Populated | |
| Table — Task Column | Text Link | Task title | onClick → `/tasks/:id` | Static | |
| Table — Planned Hours Column | Text | Planned hours from weekly plan | — | Static | |
| Table — Actual Hours Column | Number Input | Auto-filled from task, editable | onChange | Default / Edited | Editable if task not yet marked Done |
| Table — Status Column | Select | Task status | onChange → update task status | To Do / In Progress / In Review / Done | |
| Table — Match Indicator | Icon | ✓ (green) / ⚠ (amber, discrepancy) | — | Matching / Discrepancy | |
| Discrepancy Alert | Alert (Amber) | "You reported [Task] as done but it's still In Progress. Update the task or correct this." | — | Visible per discrepancy | Per row, above table |
| File Upload — Wrap-up | File Upload | "Attach any supporting files" | onChange → upload | Default / Uploading / Uploaded | Optional |
| Attached Files List | File List | Filename, size, preview/download icon | onClick → preview or download | Populated / Empty | |
| Notes Input | Textarea | Label: "Any notes for your manager?" / Placeholder: "Optional wrap-up notes..." | onChange | Default / Focused | Optional |
| Submit Wrap-up Button | Button (Primary) | "Submit Wrap-up" | onClick → submit | Default / Loading | |
| Already Submitted State | Read-Only View | Submitted data with timestamp | — | Read-only | Replaces form |

---

### Screen 17 — Team Plans View — `/team/plans`

**Layout:** Grid layout. Employee rows × day columns. Same grid aesthetic as My Weekly Plan.

**Page-Level States:** Loading / Populated / Empty

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Team Plans" | — | Static | H1 |
| Week Navigation | Navigation | ← / Date Range / → | onClick → week change | Same as My Weekly Plan | |
| Scope Indicator | Text | "[Team Name] — [N] members" | — | Dynamic | |
| Employee Row Header | Text | "[Employee Name]" | — | Static | One row per team member |
| Submission Status Badge (per employee) | Badge | "Submitted" (green) / "Not Submitted" (amber) / "Fluid" (blue) | — | Per employee | |
| Day Cell (per employee per day) | Cell | Planned tasks + hours | onClick → expand cell | Green / Amber / Red (colour-coded same as summary footer) | Colour thresholds: same as My Plan |
| Expanded Cell Content | Popover/Drawer | Task list for that employee on that day | onClose → collapse | Visible / Hidden | Shows tasks behind the number |
| Unplanned Day Warning | Cell Indicator | Empty red cell with "⚠ Unplanned" | — | Visible when 0 planned hrs on working day | |
| Comment Button (per employee) | Icon Button | Speech bubble icon | onClick → Plan Comment Modal | Default / Hover | Per employee row |
| Comment Count Badge | Badge | "[N] comments" | — | Visible / Hidden | On comment button |
| Week Summary Row | Footer Row | Team totals | — | Static | |
| Empty State | State | "No team members have submitted plans for this week." | — | Visible when all empty | |

---

### Screen 18 — Dashboard — My Overview — `/dashboard`

**Layout:** Card grid. 2×2 or single-column widget layout.

**Page-Level States:** Loading / Fresh (no data) / Populated / All-clear

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "My Overview" | — | Static | H1 |
| Date Subheading | Text | "Today — [Weekday, Day Month]" | — | Dynamic | |
| Today's Tasks Widget | Card | Heading: "Today" + task list | — | Loading / Empty / Populated | |
| Today's Task Row | List Item | Task title, status badge | onClick → `/tasks/:id` | Default / Hover / Overdue | |
| Weekly Completion Rate Widget | Card | Heading: "This Week" + visual indicator | — | Loading / Populated | |
| Completion Rate Visual | Progress Bar or Donut Chart | "[N] of [M] tasks done — [X]%" | — | Percentage-based colour | |
| Upcoming Deadlines Widget | Card | Heading: "Next 3 Days" + task list | — | Loading / Empty / Populated | |
| Upcoming Task Row | List Item | Task title, due date | onClick → `/tasks/:id` | Default / Hover | |
| Carry-over Widget | Card | Heading: "Carry-overs ([N])" + task list | — | Loading / Empty / Populated | |
| Carry-over Task Row | List Item | Task title, original planned date | onClick → `/tasks/:id` | Default / Hover | |
| Fresh Start State | State | "Welcome to Sunday. Your first task will appear here when it's assigned." | — | Visible when no tasks ever | |
| All Clear State | State | "All caught up — no overdue tasks, no carry-overs." | — | Visible when everything clean | Within relevant widgets |

---

### Screen 19 — Dashboard — Team Pulse — `/dashboard/team-pulse`

**Layout:** Full-width. Big fat warning zone at top. Capacity grid. Overdue list. Completion rates.

**Page-Level States:** Loading / All-good / Warnings present

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Team Pulse" | — | Static | H1 |
| Week Navigation | Navigation | ← / Date Range / → | onClick → week change | Default | |
| Big Fat Warning Banner | Alert (Red, Full-Width) | "[Employee Name] has no tasks planned for [Day]" — one entry per employee per day | onClick → acknowledge (opens M16) | Visible / Hidden | Cannot be dismissed without action. Unmissable. |
| Capacity Grid | Table | Employee rows × work-week day columns | — | Loading / Populated | |
| Grid Cell | Cell | "X / Y hrs" (planned / available) | onClick → expand to see tasks | Green / Amber / Red | Colour thresholds: Green 80–100%, Amber 50–79% or >110%, Red <50% or empty |
| Grid Cell — Expanded Content | Popover | Task list for employee on that day | onClose → collapse | Visible / Hidden | |
| Capacity Grid — Employee Name Column | Text | Employee name | — | Static | |
| Overdue Tasks Section | Section | "Overdue Tasks" heading | — | Visible / Hidden | |
| Overdue Task Row | List Item | Task title, assignee name, due date, "[N] days overdue" label | onClick → `/tasks/:id` | Default / Hover | |
| Completion Rate Section | Section | "Completion Rates — This Week" heading | — | — | |
| Completion Rate Row | Row | Employee name + progress bar + "[N]/[M] done" | — | Per employee | |
| New Task Button | Button (Primary) | "+ New Task" | onClick → Quick Task Creation Modal | Persistent visible | |
| All Good State | State | Green grid, no banners | — | When no issues | |
| Loading Skeleton | State | Grid skeleton | — | Visible during fetch | |

---

### Screen 20 — Dashboard — Workload View — `/dashboard/workload`

**Layout:** Same grid structure as Capacity Grid (Team Pulse) but showing planned vs actual hours.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Workload View" | — | Static | H1 |
| Week Navigation | Navigation | ← / Date Range / → | onClick → week change | Default | |
| Workload Grid | Table | Employee rows × day columns | — | Loading / Populated | Same layout as capacity grid |
| Grid Cell | Cell | "Planned [X] / Actual [Y] hrs" | onClick → expand | Green / Amber / Red | Same colour thresholds |
| Grid Cell — Expanded Content | Popover | Task list with planned and actual hours | onClose → collapse | Visible / Hidden | |
| Live Update Indicator | Text/Badge | "Updated [X] minutes ago" | — | Dynamic | Near-real-time refresh |
| Loading Skeleton | State | Grid skeleton | — | Visible during fetch | |

---

### Screen 21 — Activity Feed — `/dashboard/activity`

**Layout:** Single-column scrollable feed. Filter controls at top.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Activity Feed" | — | Static | H1 |
| Activity Type Filter | Select / Multi-select | All / Task Created / Status Changed / Plan Submitted / Check-in / Wrap-up / Comment Added / Assignment Changed | onChange → filter | Default / Open / Selected | |
| Activity Entry | List Item | Avatar + "[Person] [action] [object] — [timestamp]" | onClick → navigate to linked resource | Default / Hover | |
| Entry — Avatar | Avatar | User initials or photo | — | Static | |
| Entry — Action Text | Text | "[Person] changed [Task] status to In Review" etc. | onClick on linked item name → navigate | Default | |
| Entry — Timestamp | Text | Relative time ("2 min ago" / "Yesterday at 14:32") | — | Static | |
| Load More Button | Button (Secondary) | "Load more" | onClick → fetch next page | Default / Loading | Or infinite scroll |
| Empty State | State | "No activity yet." | — | Visible when no events | |
| Loading State | State | Skeleton entries | — | Visible during fetch | |

---

### Screen 22 — Reports — `/reports`

**Layout:** Single column. Report type selector + parameters + generate button + results/download.

**Page-Level States:** Idle / Generating / Ready to download / Error

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Reports" | — | Static | H1 |
| Report Type Selector | Radio Group or Tab Group | Weekly Team Performance / Individual Employee / Billable Hours Summary / Full Task Export / System Activity (Admin only) | onChange → show/hide relevant params | Five options | System Activity hidden for non-Admin |
| Date Range Picker | Date Range Input | Label: "Date Range" / Default: current week | onChange | Default / Selected | For all report types |
| Team Selector | Select | Label: "Team" / Team list scoped by role | onChange | Default / Open / Selected | Visible for team-level reports |
| Employee Selector | Select | Label: "Employee" / Employee list | onChange | Default / Open / Selected | Visible for individual employee report |
| Format Selector | Toggle Group | "PDF" / "CSV" | onClick | PDF / CSV selected | System Activity: CSV only |
| Generate Button | Button (Primary) | "Generate Report" | onClick → submit | Default / Loading (spinner + "Generating...") | |
| Generated Report Result | Card | Report name, generated at timestamp | — | Visible after generation | |
| Download PDF Button | Button | "Download PDF" + file icon | onClick → trigger download | Visible / Hidden | |
| Download CSV Button | Button | "Download CSV" + file icon | onClick → trigger download | Visible / Hidden | |
| Error State | Alert | "Failed to generate report. Please try again." | Retry button | Visible on error | |
| Recent Reports List | List | Previously generated reports with download links | — | Optional enhancement | |

---

### Screen 23 — Settings — User Preferences — `/settings`

**Layout:** Settings page with sections. Left nav for settings sub-pages.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Settings" | — | Static | H1 |
| Settings Sub-Nav | Vertical Nav | User Preferences / Team Settings (Manager+) / System Settings (Admin) | onClick → navigate | Active section highlighted | |
| Section: Notification Preferences | Section | "Notification Preferences" heading | — | — | |
| Notification — Task Marked Done | Toggle | "Notify me when a task I created is marked Done" | onChange → save | On / Off | Optional — can be disabled |
| Notification — Comment on Plan | Toggle | "Notify me when my plan receives a comment" | onChange → save | On / Off | Optional |
| Notification — Comment on Task | Toggle | "Notify me when a task I'm involved in receives a comment" | onChange → save | On / Off | Optional |
| Section: Preferences | Section | "Preferences" heading | — | — | |
| Default Task View | Toggle Group | "List" / "Kanban" | onChange → save | List / Kanban | |
| Saved Filter Views Manager | List + Actions | List of saved views with edit/delete | — | Populated / Empty | |
| Saved View Row | List Item | View name, scope (personal/shared) | — | Default | |
| Delete Saved View Button | Icon Button | Trash icon | onClick → confirm delete | Default / Hover | Per row |
| Save Settings Button | Button (Primary) | "Save Preferences" | onClick → save all | Default / Loading / Saved (green tick) | Or auto-save per toggle |

---

### Screen 24 — Settings — Team Settings — `/settings/team`

**Layout:** Form layout with toggles and selectors.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Section Heading | Heading | "Team Settings — [Team Name]" | — | Static | H2 |
| Planning Mode Toggle | Toggle Group | "Locked" / "Fluid" | onChange → save | Two states | |
| Plan Submission Deadline — Day | Select | Day of week (Mon–Sun) | onChange | Default / Selected | For locked mode |
| Plan Submission Deadline — Time | Time Input | HH:MM | onChange | Default | For locked mode |
| Plan Submission Deadline — Timezone | Text | Displays team's primary timezone (from manager's profile) | — | Read-only display | Timezone from manager record |
| Daily Check-in Mandatory Toggle | Toggle | "Mandatory daily check-in" | onChange → save | On / Off | |
| EOD Wrap-up Mandatory Toggle | Toggle | "Mandatory EOD wrap-up" | onChange → save | On / Off | |
| Custom Fields Link | Text Link | "Manage custom fields →" | onClick → `/settings/custom-fields` | Default / Hover | |
| Save Team Settings Button | Button (Primary) | "Save Team Settings" | onClick → save | Default / Loading | |

---

### Screen 25 — Settings — System Settings — `/settings/system`

**Layout:** Form layout. Admin only.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Section Heading | Heading | "System Settings" | — | Static | H2 |
| Organisation Name Input | Text Input | Label: "Organisation Name" / Current value | onChange | Default / Edited | |
| Default Available Hours | Number Input | Label: "Default Available Hours Per Day" / Current value | onChange | Default / Edited | Applied to all new users |
| Archiving Window | Number Input + Select | Label: "Archive completed tasks after" / "[N] months" | onChange | Default / Edited | |
| User Management Link | Text Link | "Manage Users →" | onClick → `/admin/users` | Default / Hover | |
| Team Management Link | Text Link | "Manage Teams →" | onClick → `/admin/teams` | Default / Hover | |
| Save System Settings Button | Button (Primary) | "Save System Settings" | onClick → save | Default / Loading | |

---

### Screen 26 — Audit Trail — `/admin/audit`

**Layout:** Full-width. Filter bar + chronological event table.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "System Audit Trail" | — | Static | H1 |
| Date Range Filter | Date Range Picker | Label: "Date Range" | onChange → filter | Default / Selected | |
| Event Type Filter | Select / Multi-select | All / User Created / User Edited / User Deactivated / Team Created / Role Changed / Settings Changed / Export Generated / etc. | onChange → filter | Default / Open / Selected | |
| Actor Filter | Select | Label: "Performed by" / All + user list | onChange → filter | Default / Open / Selected | |
| Audit Events Table | Table | Columns: Timestamp, Actor, Event Type, Description, Old Value, New Value | — | Loading / Populated | |
| Table — Timestamp Column | Text | ISO date/time | — | Static | |
| Table — Actor Column | Text | User name + role | — | Static | |
| Table — Event Type Column | Badge | Event type label | — | Static | |
| Table — Description Column | Text | Human-readable summary | — | Static | |
| Table — Old Value Column | Text | Previous value (if applicable) | — | Static | Truncated, full on hover |
| Table — New Value Column | Text | New value (if applicable) | — | Static | Truncated, full on hover |
| Pagination Controls | Component | Prev / Page numbers / Next | onClick → page change | Default / Disabled at limits | |
| Empty State | State | "No audit events match your filters." | — | Visible when 0 results | |

---

### Screen 27 — First-Login Onboarding Flow — `/onboarding`

**Layout:** Stepped full-screen modal or dedicated page. No sidebar. 3 steps.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Progress Indicator | Steps | Step 1 of 3 / Step 2 of 3 / Step 3 of 3 | — | Step 1 / 2 / 3 | |
| Step 1 — Welcome Heading | Heading | "Welcome to Sunday, [Name]!" | — | Static | |
| Step 1 — Team Info | Text | "You're part of [Team Name], reporting to [Manager Name]." | — | Dynamic | |
| Step 1 — Next Button | Button (Primary) | "Get started →" | onClick → Step 2 | Default / Hover | |
| Step 2 — Pre-Assigned Tasks | Text | "You have [N] task(s) already assigned to you." | — | Dynamic | |
| Step 2 — Task List | List | Task titles with due dates | onClick → navigate later | Read-only | |
| Step 2 — Next Button | Button (Primary) | "See my tasks later — next →" | onClick → Step 3 | Default / Hover | |
| Step 3 — Plan Prompt Heading | Heading | "Set up your first weekly plan" | — | Static | |
| Step 3 — Instruction Text | Text | "Plan your week by assigning tasks to days. This helps your manager see your workload." | — | Static | |
| Step 3 — Go to Plan Button | Button (Primary) | "Set up my plan →" | onClick → `/plan` + onboarding flag saved | Default / Hover | Non-skippable by design |

---

### Screen 28 — Admin Setup Flow — `/setup`

**Layout:** Stepped full-screen. 3 steps with progress indicator.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Progress Indicator | Steps | Step 1: Departments / Step 2: Teams / Step 3: Employees | — | Step 1 / 2 / 3 | |
| Step 1 — Heading | Heading | "Create your departments" | — | Static | |
| Step 1 — Inline Department Form | Inline Form | Department name + Senior Manager selector | onSubmit → add to list | Default / Saving | |
| Step 1 — Added Departments List | List | Department names added so far | — | Dynamic | |
| Step 1 — Next Button | Button (Primary) | "Next: Create Teams →" | onClick → Step 2 | Disabled until 1+ departments added | |
| Step 2 — Heading | Heading | "Create your teams" | — | Static | |
| Step 2 — Inline Team Form | Inline Form | Team name + parent dept + Manager selector + planning mode | onSubmit → add | Default / Saving | |
| Step 2 — Added Teams List | List | Team names + departments | — | Dynamic | |
| Step 2 — Next Button | Button (Primary) | "Next: Add Employees →" | onClick → Step 3 | Disabled until 1+ teams added | |
| Step 3 — Heading | Heading | "Add your first employees" | — | Static | |
| Step 3 — Action Choice | Button Group | "Add individually" / "Bulk import CSV" | onClick → respective flow | — | |
| Step 3 — Done Button | Button (Primary) | "Go to dashboard →" | onClick → `/dashboard` + setup flag saved | Default / Hover | Can proceed with 0 employees added |
| Re-enter Setup Link | Text Link | In System Settings: "Re-run setup guide" | onClick → `/setup` | Default / Hover | |

---

### Screen 29 — Project / Category Management — `/settings/projects`

**Layout:** Simple list page. Header + table.

| Component | Type | Label / Content | Actions / Events | States | Notes |
|---|---|---|---|---|---|
| Page Title | Heading | "Projects & Categories" | — | Static | H1 |
| Add Project Button | Button (Primary) | "+ Add Project" | onClick → Add/Edit Project Modal | Default / Hover | |
| Projects Table | Table | Columns: Name, Scope, Created By, Actions | — | Loading / Populated | |
| Table — Name Column | Text | Project name | — | Static | |
| Table — Scope Column | Text | "Team: [Name]" / "Global" | — | Static | |
| Table — Created By Column | Text | User name | — | Static | |
| Row — Edit Button | Icon Button | Pencil icon | onClick → Add/Edit Project Modal (edit mode) | Default / Hover | |
| Empty State | State | "No projects yet. Create one to assign tasks." | "+ Add Project" CTA | Visible when 0 | |

---

## 6. Forms — Full Field Specification

---

### Form: User Create / Edit

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | first_name | Text Input | "First Name" | "First name" | Min 1 char, max 80 | Yes | |
| 2 | last_name | Text Input | "Last Name" | "Last name" | Min 1 char, max 80 | Yes | |
| 3 | email | Email Input | "Email Address" | "email@company.com" | Valid email format | Yes | Read-only post-invite acceptance in edit mode |
| 4 | role | Select | "Role" | "Select role" | Must select one | Yes | 6 options |
| 5 | team_id | Select | "Team" | "Select team" | Must select one | Yes | Populated from teams API |
| 6 | manager_id | Select | "Reporting Manager" | "Select manager" | Must select one | Yes (non-Admin) | Filtered: Manager+ in selected team/dept |
| 7 | work_week | Checkbox Group | "Work Week" | — | Min 1 day selected | Yes | Mon–Sun checkboxes |
| 8 | timezone | Select + Search | "Timezone" | "Search timezone..." | Must select one | Yes | All IANA timezones |
| 9 | available_hours | Number Input | "Available Hours Per Day" | "8" | Min 1, Max 24, integer | Yes | Default 8 |
| 10 | billable_permission | Toggle Group | "Billable Permissions" | — | Must select one | Yes | Non-Billable / Both / Billable |

**Submit Button:** "Save & Send Invite" (create) / "Save Changes" (edit) — disabled while saving  
**Cancel:** Navigate to `/admin/users` — no confirmation  
**Inline validation:** onBlur per field + onSubmit sweep  
**Form error location:** Alert banner at top of form  
**Success behaviour:** Create → redirect to `/admin/users` with success toast "User created. Invite sent." / Edit → redirect to `/admin/users` with toast "User updated."

---

### Form: Quick Task Creation Modal

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | title | Text Input | "Task Title" | "What needs to be done?" | Min 3 chars, max 200 | Yes | |
| 2 | assignee_id | Select | "Assignee" | "Select person" | Must select one | Yes | Default: self. Scoped by role. |
| 3 | due_date | Date Picker | "Due Date" | "DD/MM/YYYY" | Must be today or future (unless ad hoc) | Yes | |
| 4 | estimated_hours | Number Input | "Estimated Hours" | "e.g. 2" | Min 0.5, Max 24 | Yes | |
| 5 | priority | Select | "Priority" | "Select priority" | Must select one | Yes | Default: Medium |
| 6 | task_type | Toggle Group | "Type" | — | Must select one | Yes | Default: Planned |
| 7 | task_nature | Toggle Group | "Nature" | — | Must select one | Yes | Default: Core |
| 8 | billable | Toggle | "Billable" | — | — | No | Only enabled if user has billable permission |
| 9 | project_id | Select | "Project" | "Select project" | Must select one | Yes | Scoped by team |
| 10 | reviewer_id | Select | "Reviewer (optional)" | "None" | — | No | Any user in same team/dept |
| 11 | description | Rich Text | "Description (optional)" | "Add details..." | Max 2000 chars | No | Collapsible section |
| 12 | already_completed | Toggle | "Already completed?" | — | — | No | Ad hoc backdating toggle |
| 13 | actual_hours | Number Input | "Actual Hours" | "e.g. 2" | Required if already_completed | Conditional | Visible only when already_completed = true |
| 14 | completion_report | Textarea | "Completion Report" | "Describe what was done..." | Min 1 char; required if already_completed | Conditional | Visible only when already_completed = true |

**Submit Button:** "Create Task" — loading state "Creating..."  
**Cancel:** Close modal, no save  
**Inline validation:** onBlur + onSubmit  
**Success behaviour:** Modal closes, success toast "Task created", task appears in assignee's task list

---

### Form: Completion Report (status → Done)

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | report_text | Textarea | "Completion Report" | "Describe what was completed, how, and any notes..." | Min 1 char (recommended: 50+) | One of report_text or report_file | Enforced — cannot proceed without |
| 2 | report_file | File Upload | "Attach a file (optional)" | — | Supported types only | No | Supplements or replaces text |

**Submit Button:** "Submit Report" → triggers status change to Done (or In Review if reviewer assigned)  
**Cancel:** Close without changing status  
**Validation:** At least one of text or file required  
**Success behaviour:** Task status updates, toast "Completion report submitted"

---

### Form: Add / Edit Custom Field

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | name | Text Input | "Field Name" | "e.g. Client Reference" | Min 2 chars, max 80, unique per scope | Yes | |
| 2 | field_type | Select | "Field Type" | "Select type" | Must select one | Yes | Text / Number / Date / Dropdown / Checkbox |
| 3 | options | Tag Input / List | "Options" (dropdown only) | "Add option..." | Min 2 options if type = Dropdown | Conditional | Visible only when type = Dropdown |
| 4 | scope_type | Toggle Group | "Scope" | — | Must select one | Yes | Team / Project |
| 5 | scope_id | Select | "Team" or "Project" | "Select..." | Must select one | Yes | Populated based on scope_type |

**Submit Button:** "Add Field" / "Save Changes"  
**Cancel:** Close modal  
**Success behaviour:** Modal closes, field appears in list, toast "Custom field added"

---

### Form: Reassign Task Modal

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | new_assignee_id | Select | "Reassign To" | "Select person" | Must select one, different from current | Yes | Scoped to manager's team |
| 2 | reason | Textarea | "Reason (optional)" | "Why is this task being reassigned?" | Max 500 chars | No | Logged in timeline |

**Submit Button:** "Reassign Task"  
**Cancel:** Close modal  
**Success behaviour:** Modal closes, task assignee updated, both assignees notified, timeline entry logged

---

### Form: Add Subtask

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | title | Text Input | — | "Subtask title..." | Min 3 chars | Yes | Inline, compact |
| 2 | assignee_id | Select (compact) | — | "Assignee" | — | No | Default: parent task assignee |
| 3 | due_date | Date Picker (compact) | — | "Due date" | — | No | |

**Submit:** "Add" button (small, inline)  
**Cancel:** ✕ or blur  
**Success:** Subtask appears in list, parent timeline updated

---

### Form: Reviewer Send-Back

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | send_back_reason | Textarea | "Reason for sending back" | "Explain what needs to be corrected..." | Min 10 chars | Yes | Logged in timeline + notified to assignee |

**Submit:** "Send Back"  
**Cancel:** Close modal — task remains In Review  
**Success:** Task moves to In Progress, assignee notified, timeline updated

---

### Form: Add Department

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | name | Text Input | "Department Name" | "e.g. Operations" | Min 2 chars, max 80, unique | Yes | |
| 2 | senior_manager_id | Select | "Senior Manager" | "Select user" | Must select one | Yes | Filtered: Senior Manager or Admin role |

---

### Form: Add / Edit Team

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | name | Text Input | "Team Name" | "e.g. UK Block Management" | Min 2 chars, max 80, unique per dept | Yes | |
| 2 | department_id | Select | "Department" | "Select department" | Must select one | Yes | |
| 3 | manager_id | Select | "Team Manager" | "Select manager" | Must select one | Yes | Filtered: Manager role users |
| 4 | planning_mode | Toggle Group | "Planning Mode" | — | Must select one | Yes | Locked / Fluid |
| 5 | submission_deadline_day | Select | "Submission Deadline — Day" | "Select day" | Required if locked mode | Conditional | Days of week |
| 6 | submission_deadline_time | Time Input | "Submission Deadline — Time" | "HH:MM" | Required if locked mode | Conditional | 24hr format |
| 7 | check_in_mandatory | Toggle | "Daily check-in mandatory" | — | — | No | Default: Off |
| 8 | eod_mandatory | Toggle | "EOD wrap-up mandatory" | — | — | No | Default: Off |

---

### Form: Save View

| # | Field Name | Type | Label | Placeholder | Validation | Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | view_name | Text Input | "View Name" | "e.g. My overdue high-priority tasks" | Min 2 chars, max 80 | Yes | |
| 2 | shared | Toggle | "Share with team" | — | — | No | Manager+ only. Default: Off (personal) |

---

### Form: Reports (parameter inputs)

| # | Field | Type | Label | Validation | Required | Visible For |
|---|---|---|---|---|---|---|
| 1 | report_type | Radio/Tab | "Report Type" | Must select one | Yes | All |
| 2 | date_from | Date Picker | "From" | Must be before date_to | Yes | All |
| 3 | date_to | Date Picker | "To" | Must be after date_from | Yes | All |
| 4 | team_id | Select | "Team" | Must select one | Yes | Weekly Team, Billable |
| 5 | employee_id | Select | "Employee" | Must select one | Yes | Individual Employee |
| 6 | format | Toggle Group | "Format" | Must select one | Yes | PDF+CSV / CSV only |

---

## 7. Modals & Drawers Inventory

| Modal / Drawer | Triggered By | Width | Closeable By | Contents | Actions |
|---|---|---|---|---|---|
| M1 — Quick Task Creation | "+ New Task" button (all screens) | 560px centred modal | Cancel button, ESC, backdrop | Full task form | Create Task, Cancel |
| M2 — Confirm Deactivate User | Row deactivate action | 440px centred | Cancel, ESC | Warning + user name + "All open tasks must be reassigned" info | Proceed to Reassignment Flow, Cancel |
| M3 — Confirm Reactivate User | Row reactivate action | 440px centred | Cancel, ESC | Confirmation message + user name | Reactivate, Cancel |
| M4 — Add/Edit Department | Add/Edit dept buttons | 480px centred | Cancel, ESC, backdrop | Department form | Save, Cancel |
| M5 — Add/Edit Team | Add/Edit team buttons | 560px centred | Cancel, ESC, backdrop | Team form | Save, Cancel |
| M6 — Resend Invite | Row resend action | 440px centred | Cancel, ESC | Confirmation + user email | Resend Invite, Cancel |
| M7 — Reassign Task | Reassign action | 480px centred | Cancel, ESC | Reassign form | Reassign, Cancel |
| M8 — Completion Report Prompt | Kanban drag to Done / status → Done | 560px centred | Cancel (reverts status) | Completion report text + file upload | Submit Report, Cancel |
| M9 — Reviewer Send-Back | Reviewer "Send Back" button | 480px centred | Cancel, ESC | Reason textarea | Send Back, Cancel |
| M10 — Add/Edit Custom Field | Field management | 480px centred | Cancel, ESC, backdrop | Custom field form | Save, Cancel |
| M11 — Archive Custom Field | Archive action | 440px centred | Cancel, ESC | Warning about data preservation | Archive Field, Cancel |
| M12 — Save View | "Save View" action | 440px centred | Cancel, ESC, backdrop | View name + shared toggle | Save, Cancel |
| M13 — Add Subtask | "+ Add Subtask" | Inline (below list) | ✕ button | Compact subtask form | Add, Cancel (✕) |
| M14 — Add Dependency | "+ Add Dependency" | 480px centred | Cancel, ESC | Task search + selection | Add Dependency, Cancel |
| M15 — Plan Comment | Comment button on Team Plans | 480px right-side drawer | ✕, ESC | Textarea + existing comments thread | Post Comment, Close |
| M16 — Big Fat Warning Acknowledge | Click warning banner | 480px centred | Cancel only | Employee name + unplanned days + action options | Acknowledge (logs audit), Cancel |
| M17 — File Preview | Click file attachment | Full-width overlay | ✕, ESC, backdrop | PDF.js or img viewer + filename + download button | Download, Close |
| M18 — Deactivation Task Reassignment | Admin deactivates user | Full-page modal or dedicated step | Cannot close without completing | Open tasks list + reassign/close per task | Complete Deactivation (after all handled) |
| M19 — Add/Edit Project | Add project button | 440px centred | Cancel, ESC | Project name + scope | Save, Cancel |

---

## 8. Navigation & Routing Map

| From | Action | To | Condition |
|---|---|---|---|
| `/login` | Successful login | `/dashboard` | Session valid |
| `/login` | Click "Forgot password" | `/forgot-password` | Always |
| `/forgot-password` | Click "Back to login" | `/login` | Always |
| `/set-password?token=xxx` | Set password successfully | `/onboarding` (first login) or `/dashboard` | First login → onboarding; re-invite → dashboard |
| Any page | Not authenticated | `/login` | Auth guard |
| Any page | Role-restricted page accessed | 403 screen or redirect to `/dashboard` | Permission check fails |
| `/admin/users` | Click "+ Add User" | `/admin/users/new` | Admin only |
| `/admin/users` | Click Edit (row) | `/admin/users/:id/edit` | Admin only |
| `/admin/users` | Click "Bulk Import" | `/admin/users/import` | Admin only |
| `/admin/users/new` or `/edit` | Save successfully | `/admin/users` | — |
| `/admin/users/new` or `/edit` | Click Cancel | `/admin/users` | — |
| `/tasks` | Click task row | `/tasks/:id` | — |
| `/tasks` | Click "+ New Task" | Quick Task Modal overlay | — |
| `/tasks/:id` | Click subtask | `/tasks/:subtaskId` | — |
| `/tasks/:id` | Click dependency task link | `/tasks/:dependencyId` | — |
| `/board` | Click task card | `/tasks/:id` | — |
| `/board` | Drag card to Done | Completion Report Modal (M8) | Status rules |
| `/dashboard` | Click task in widget | `/tasks/:id` | — |
| `/dashboard/team-pulse` | Click grid cell | Popover (inline expand) | — |
| `/dashboard/team-pulse` | Click overdue task | `/tasks/:id` | — |
| `/dashboard/activity` | Click activity entry | Linked resource (task/plan) | — |
| `/plan` | Click unplanned task (sidebar) | Drag into grid — no nav | — |
| `/settings/custom-fields` | Navigated from team settings or sidebar | Custom Fields page | Manager+ |
| Notification bell click | Open | Notification panel overlay | Authenticated |
| Notification entry click | Navigate to resource | Linked resource URL | — |
| Global search result click | Navigate to resource | `/tasks/:id` / `/admin/users/:id` / etc. | — |
| `/onboarding` (step 3 complete) | Click "Set up my plan" | `/plan` | First login |
| `/setup` (step 3 complete) | Click "Go to dashboard" | `/dashboard` | Admin |
| Sidebar — Dashboard | Click | `/dashboard` | Authenticated |
| Sidebar — My Tasks | Click | `/tasks` | Authenticated |
| Sidebar — Task Board | Click | `/board` | Authenticated |
| Sidebar — My Plan | Click | `/plan` | Authenticated |
| Sidebar — Team Pulse | Click | `/dashboard/team-pulse` | Asst Manager+ |
| Sidebar — Reports | Click | `/reports` | Manager+ |
| Sidebar — Admin Users | Click | `/admin/users` | Admin |
| Sidebar — Audit Trail | Click | `/admin/audit` | Admin |
| Top bar — Settings | Click user dropdown → Settings | `/settings` | Authenticated |
| Top bar — Logout | Click user dropdown → Logout | `/login` | Always |

---

## 9. Global / Shared Components Used in This Sprint

| Component | Used On | Description |
|---|---|---|
| Avatar | Top bar, task cards, team plans, activity feed, comments | Circular photo or initials fallback. Sizes: sm (24px), md (32px), lg (40px) |
| Badge | Roles, statuses, priorities, planning modes, task types | Colour-coded pill. Variants: status, role, type, nature, billable |
| Status Badge | Tasks everywhere | To Do (grey) / In Progress (blue) / In Review (amber) / Done (green) |
| Priority Badge | Tasks everywhere | High (red) / Medium (amber) / Low (grey) |
| Role Badge | User records, top bar | 6 role variants with distinct colours |
| Empty State | Every list/table screen | Centred icon + heading + message + optional CTA button |
| Toast Notification | Global | Success / Error / Warning / Info. Auto-dismiss 4s. Fixed bottom-right. |
| Skeleton Loader | All data-fetching screens | Grey shimmer blocks matching content shape |
| Confirmation Modal | Destructive actions throughout | Title, message, Confirm (destructive red) + Cancel |
| File Upload Component | Task Detail, EOD Wrap-up, Bulk Import | Drag-and-drop zone + browse button + file info display |
| Date Picker | Task creation, filters, reports, settings | Calendar picker. Respects locale. |
| Date Range Picker | Filters, reports | Two-calendar or from-to input pair |
| Rich Text Editor | Task description, completion report | Bold, italic, bullets, links. Min features. |
| Number Input | Hours fields | Min/max enforced. Integer or decimal. |
| Colour-Coded Grid Cell | Team Pulse, Workload View | Green / Amber / Red based on threshold. |
| Capacity Progress Bar | Team Pulse, My Overview completion widget | Coloured fill based on percentage |
| Inline Edit Field | Task Detail sidebar, task title | Hover reveals edit affordance. Click activates input. Save on blur or Enter. |
| Pagination Controls | User table, audit trail, task lists | Prev / [1] [2] [3] / Next. Disabled at limits. |
| Search Input | User Management, Global Search | Debounced 300ms. Clear ✕ button when populated. |
| Settings Sub-Nav | Settings pages | Vertical left-side nav within settings layout |
| Carry-over Badge | Weekly Plan, Daily Check-in | Amber badge indicating rolled task |
| Overdue Indicator | Task cards, task tables | Red due date text + "Overdue" label |
| Section Heading (H2) | Form pages, settings | Divides form into logical groups with optional description |

---

## 10. Responsive Considerations

| Screen | Desktop Layout | Mobile Layout | Key Differences |
|---|---|---|---|
| Login | Centred card ~400px | Full-width card with padding | Essentially same |
| Admin — User Management | Sidebar + full data table | Bottom nav + stacked user cards (or simplified table) | Table collapses to card list; column count reduced |
| Admin — Team Management | Sidebar + hierarchy tree table | Stacked department/team cards with expand | Hierarchy becomes vertical accordion |
| Admin — Bulk Import | Two-column (instructions + upload) | Single column stacked | Same flow, stacked |
| My Tasks | Sidebar + task list | Bottom nav + task list | No sidebar; status filter scrolls horizontally |
| Task Detail | Two-column (main + sidebar) | Single column; sidebar moves below main content | Tabs remain; sidebar fields stack below description |
| Task Board (Kanban) | Four horizontal columns | Horizontal scroll or single-column list fallback | Mobile: simplified to list view by default with column selector |
| My Weekly Plan | Grid (days as columns) | Simplified day-by-day vertical scroll | One day visible at a time on smallest screens |
| Daily Check-in | Centred single column | Full-width, large touch targets | Optimised for quick mobile input — Sprint 10 focus |
| EOD Wrap-up | Centred single column | Full-width, large touch targets | Same — Sprint 10 polish |
| Team Plans | Grid (employees × days) | Simplified — employee rows, tap to expand day | Grid cannot fit on mobile without simplification |
| Dashboard — My Overview | 2×2 card grid | Single column stacked cards | Same data, different layout |
| Dashboard — Team Pulse | Full-width grid + overdue list | Stacked sections; grid simplified | Big fat warning always full-width and prominent |
| Dashboard — Workload View | Grid | Simplified single-column | Same as Team Pulse |
| Reports | Form + download section | Single column | Same flow |
| Settings | Left nav + form | Top tabs + form | Nav moves to tabs |
| Modals | Centred overlay | Bottom sheet or full-screen | All modals → bottom sheet on mobile |

---

## 10. Sprint UI Checklist

```
SPRINT 1 — Foundation
- [ ] Global shell — sidebar, top bar, notification bell, avatar dropdown, auth guard
- [ ] Sidebar nav — role-scoped links for all roles
- [ ] Mobile hamburger + sidebar overlay
- [ ] Toast notification system
- [ ] Login page — form, validation, error states
- [ ] Forgot Password page — form, success state
- [ ] Set Password (Invite) page — form, strength indicator, expired token state
- [ ] Admin — User Management page — table, search, filters, row actions
- [ ] Admin — User Management — loading state
- [ ] Admin — User Management — empty state
- [ ] Admin — User Create form — all sections, all fields, validation
- [ ] Admin — User Edit form — pre-populated, all fields, validation
- [ ] Confirm Deactivate User modal
- [ ] Confirm Reactivate User modal
- [ ] Resend Invite modal
- [ ] Admin — Team & Department Management page — hierarchy tree, expand/collapse
- [ ] Admin — Team Management — empty state
- [ ] Add/Edit Department modal
- [ ] Add/Edit Team modal
- [ ] Admin — Bulk User Import page — upload zone, preview table, row validation
- [ ] Bulk Import — success summary state
- [ ] Shared: Avatar component
- [ ] Shared: Badge component (role, status, type)
- [ ] Shared: Empty State component
- [ ] Shared: Skeleton Loader
- [ ] Shared: Confirmation Modal
- [ ] Shared: Pagination Controls
- [ ] 403 / Permission Error screen
- [ ] Error Boundary screen
- [ ] Global Loading Overlay

SPRINT 2 — Task Engine
- [ ] My Tasks page — task list, filter bar, status tabs, sort
- [ ] My Tasks — empty state
- [ ] My Tasks — loading skeleton
- [ ] My Tasks — overdue indicator on cards
- [ ] My Tasks — inline status change dropdown (rules enforced)
- [ ] Task Detail page — two-column layout
- [ ] Task Detail — all sidebar metadata fields (editable by role)
- [ ] Task Detail — description rich text editor
- [ ] Task Detail — subtasks section + subtask rows
- [ ] Task Detail — add subtask inline form (M13)
- [ ] Task Detail — dependencies section (blocked by / blocks)
- [ ] Task Detail — add dependency modal (M14)
- [ ] Task Detail — completion report section (text + file)
- [ ] Task Detail — In Review state (reviewer action buttons)
- [ ] Task Detail — reviewer approve button
- [ ] Task Detail — reviewer send-back modal (M9)
- [ ] Task Detail — Done state (read-only except comments/timeline)
- [ ] Task Detail — Timeline tab (read-only event list)
- [ ] Task Detail — Comments tab (post + thread display)
- [ ] Task Detail — loading skeleton
- [ ] Task Detail — Not Found / No Access state
- [ ] Quick Task Creation Modal (M1) — all fields
- [ ] Quick Task Creation Modal — billable disabled state + tooltip
- [ ] Quick Task Creation Modal — "Already completed" toggle (ad hoc backdating)
- [ ] Quick Task Creation Modal — validation states
- [ ] Completion Report Prompt modal (M8) — triggered on drag-to-Done / status change
- [ ] Reassign Task modal (M7)
- [ ] Team Tasks page — same as My Tasks + assignee column + overdue toggle + reassign
- [ ] Team Tasks — empty state
- [ ] Project / Category Management page
- [ ] Add/Edit Project modal (M19)
- [ ] Shared: Rich Text Editor component
- [ ] Shared: File Upload component
- [ ] Shared: Inline Edit Field component
- [ ] Shared: Overdue Indicator component
- [ ] Shared: Carry-over Badge

SPRINT 3 — Custom Fields + Kanban
- [ ] Task Board (Kanban) — four columns, task cards, drag-and-drop
- [ ] Kanban — priority colour stripe on cards
- [ ] Kanban — drag blocked visual + tooltip
- [ ] Kanban — completion report prompt on drag to Done
- [ ] Kanban — filter bar (all fields)
- [ ] Kanban — saved views dropdown
- [ ] Kanban — empty state per column
- [ ] Kanban — loading skeleton
- [ ] Kanban — mobile simplified layout
- [ ] Save View modal (M12)
- [ ] Custom Field Management page — field list table
- [ ] Custom Field Management — empty state
- [ ] Add/Edit Custom Field modal (M10) — all types
- [ ] Archive Custom Field confirm modal (M11)
- [ ] Task Create Modal — custom fields section (dynamic by team)
- [ ] Task Detail sidebar — custom field values (editable)
- [ ] Custom fields render by type: Text, Number, Date, Dropdown, Checkbox

SPRINT 4 — Planning
- [ ] My Weekly Plan — week grid with day columns
- [ ] My Weekly Plan — unplanned tasks panel/sidebar
- [ ] My Weekly Plan — drag task to day slot
- [ ] My Weekly Plan — planned hours input per slot
- [ ] My Weekly Plan — remove task from day button
- [ ] My Weekly Plan — day summary footer (colour-coded)
- [ ] My Weekly Plan — week navigation
- [ ] My Weekly Plan — submission status badge (all three states)
- [ ] My Weekly Plan — Submit Plan button (locked mode)
- [ ] My Weekly Plan — carry-over badges
- [ ] My Weekly Plan — manager comments section
- [ ] My Weekly Plan — overdue deadline warning
- [ ] My Weekly Plan — submitted/locked state (read-only)
- [ ] My Weekly Plan — empty state
- [ ] Daily Check-in — task list, carry-over alert, notes input, submit
- [ ] Daily Check-in — already submitted today state (read-only)
- [ ] Daily Check-in — no plan for today warning
- [ ] Daily Check-in — optional dismiss button (if not mandatory)
- [ ] EOD Wrap-up — planned vs actual table
- [ ] EOD Wrap-up — discrepancy alerts per row
- [ ] EOD Wrap-up — file upload
- [ ] EOD Wrap-up — notes input
- [ ] EOD Wrap-up — already submitted state
- [ ] Team Plans View — employee rows × day columns grid
- [ ] Team Plans View — submission status per employee
- [ ] Team Plans View — colour-coded cells
- [ ] Team Plans View — expandable day cells
- [ ] Team Plans View — unplanned day warning cells
- [ ] Team Plans View — comment button + plan comment drawer (M15)
- [ ] Team Plans View — week navigation
- [ ] Shared: Colour-Coded Grid Cell component
- [ ] Shared: Date Picker component
- [ ] Shared: Date Range Picker component

SPRINT 5 — Manager Dashboard
- [ ] Dashboard — My Overview — today's tasks widget
- [ ] Dashboard — My Overview — weekly completion rate widget (visual)
- [ ] Dashboard — My Overview — upcoming deadlines widget
- [ ] Dashboard — My Overview — carry-over widget
- [ ] Dashboard — My Overview — fresh start state
- [ ] Dashboard — My Overview — all-clear state
- [ ] Dashboard — My Overview — loading skeletons
- [ ] Dashboard — Team Pulse — big fat warning banner (per employee per day)
- [ ] Dashboard — Team Pulse — capacity grid (colour-coded cells)
- [ ] Dashboard — Team Pulse — grid cell expand (tasks popover)
- [ ] Dashboard — Team Pulse — overdue tasks section
- [ ] Dashboard — Team Pulse — completion rates per employee (progress bars)
- [ ] Dashboard — Team Pulse — all-good state (no warnings)
- [ ] Dashboard — Team Pulse — loading skeleton
- [ ] Dashboard — Team Pulse — mobile simplified layout
- [ ] Big Fat Warning Acknowledge modal (M16)
- [ ] Dashboard — Workload View — planned vs actual grid
- [ ] Dashboard — Workload View — live update indicator
- [ ] Activity Feed — chronological entry list
- [ ] Activity Feed — activity type filter
- [ ] Activity Feed — load more / infinite scroll
- [ ] Activity Feed — empty state
- [ ] Shared: Progress Bar / Donut Chart component
- [ ] Shared: Capacity Progress Bar component (grid cell)

SPRINT 6 — Notifications
- [ ] Notification Bell — unread count badge in top bar
- [ ] Notification Panel — overlay/drawer
- [ ] Notification Panel — notification entries (icon, message, timestamp, read/unread)
- [ ] Notification Panel — click entry → navigate + mark read
- [ ] Notification Panel — "Mark all read" button
- [ ] Notification Panel — empty state
- [ ] Notification Panel — loading state
- [ ] Notification Panel — real-time badge update (no refresh)
- [ ] User Settings — Notification Preferences section (toggles for 3 optional types)

SPRINT 7 — Search & Filtering
- [ ] Global Search Bar — in top navigation bar (all screens)
- [ ] Global Search — instant results dropdown as user types (debounced)
- [ ] Global Search — categorised results: Tasks / Projects / People
- [ ] Global Search — result click navigates to resource
- [ ] Global Search — "No results" state
- [ ] Global Search — keyboard shortcut (Ctrl+K / Cmd+K)
- [ ] Custom field filter options in Task Board filter bar
- [ ] Custom field filter options in My Tasks / Team Tasks filter bar
- [ ] Filter type matches custom field type (text, dropdown, date, etc.)
- [ ] Shared: Search Input component (with clear button)

SPRINT 8 — File Management
- [ ] Task Detail — file upload zone (completion report + general attachments)
- [ ] Task Detail — attached file list (icon, name, size, preview/download actions)
- [ ] Task Detail — no-delete indicator on task-attached files
- [ ] EOD Wrap-up — file upload component
- [ ] EOD Wrap-up — attached file list
- [ ] File Preview modal (M17) — PDF viewer (PDF.js)
- [ ] File Preview modal — image viewer
- [ ] File Preview modal — download button
- [ ] File Preview modal — fallback download link (unsupported types)
- [ ] Shared: File Preview component (inline within modal)
- [ ] Shared: Attached Files List component

SPRINT 9 — Reports
- [ ] Reports page — report type selector (5 types, Admin sees all)
- [ ] Reports page — date range parameter inputs
- [ ] Reports page — team selector parameter
- [ ] Reports page — employee selector parameter
- [ ] Reports page — format toggle (PDF / CSV)
- [ ] Reports page — Generate button with loading state
- [ ] Reports page — download links (PDF, CSV) after generation
- [ ] Reports page — error state
- [ ] Reports page — recent reports list (optional)

SPRINT 10 — Polish & Completion
- [ ] Settings — User Preferences page (notification toggles, default view, saved views)
- [ ] Settings — Team Settings page (planning mode, deadline, mandatory flags)
- [ ] Settings — System Settings page (org name, default hours, archiving window)
- [ ] Settings — sub-navigation component
- [ ] Admin — Audit Trail page (table, filters, pagination)
- [ ] First-Login Onboarding Flow — 3 steps
- [ ] Admin Setup Flow — 3 steps with progress indicator
- [ ] Deactivation Task Reassignment Flow modal (M18)
- [ ] Mobile pass — sidebar to hamburger (all screens)
- [ ] Mobile pass — task creation modal (mobile-optimised)
- [ ] Mobile pass — daily check-in mobile optimisation
- [ ] Mobile pass — EOD wrap-up mobile optimisation
- [ ] Mobile pass — capacity grid / workload grid simplified mobile layout
- [ ] Mobile pass — Kanban simplified to list on mobile
- [ ] Mobile pass — bottom sheets for all modals on mobile
- [ ] Mobile pass — touch targets ≥ 44px all interactive elements
- [ ] Mobile pass — no horizontal scroll on any screen
- [ ] Archived task badge in search results
- [ ] "Archived" badge on task records in archived state
```

---

*Breakdown complete. Every screen, form, modal, shared component, route, and responsive consideration from all 10 sprints is listed. A junior developer should be able to build the entire Sunday frontend from this document without guessing at anything. If Stitch is being used for design, every component in Section 10 is a discrete design deliverable.*
