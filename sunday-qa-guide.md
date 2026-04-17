# Sunday — Complete Application Flow (QA Reference Guide)

## What Is Sunday?

A task and planning management system where managers see **what their team committed to, what they actually did, and whether their days are planned**. Built for office employees of the Magpie Nest Group (~50–60 users across 6 ventures, multiple timezones).

---

## SEGMENT 1: Authentication & Account Lifecycle

### 1.1 — Admin Creates a User
1. Admin navigates to **Admin → Users** (`/admin/users`)
2. Clicks **"Add User"** → modal opens
3. Fills in: Name, Email, Role (Employee / Senior Employee / Assistant Manager / Manager / Senior Manager / Admin), Team, Reporting Manager, Work Week (Sun–Thu or Mon–Fri), Timezone, Billable Permissions (billable / non-billable / both)
4. On submit → API creates Supabase Auth user + `profiles` row + generates an `invite_token`
5. System sends an **email invite** with a link containing the token

### 1.2 — Bulk Import (CSV)
1. Admin goes to **Admin → Users → Import** (`/admin/users/import`)
2. 4-step wizard: Instructions → Upload CSV → Preview & Validate → Done
3. **All-or-nothing** — if any row fails validation, nothing is committed
4. Server returns per-row errors for the preview step

### 1.3 — Employee Accepts Invite (Set Password)
1. Employee clicks the invite link → lands on `/set-password?token=xxx`
2. System validates the token (not expired, not already used)
3. Employee sets their password (4-segment strength meter: length, uppercase, number, special)
4. On submit → password set in Supabase Auth, invite_token consumed, profile marked active

### 1.4 — Login
1. Employee goes to `/login`
2. Enters email + password
3. API checks credentials AND checks if the account is **deactivated** → blocked if so
4. On success → redirect based on role: Admin → `/admin/users`, others → `/dashboard`

### 1.5 — Forgot Password
1. User clicks "Forgot Password" on login screen → `/forgot-password`
2. Enters email → success state shown (regardless of whether email exists, for security)
3. Email contains a reset link

### 1.6 — Reset Password
1. User follows the email link → `/reset-password`
2. Sets a new password with strength meter
3. On submit → password updated in Supabase Auth

### 1.7 — Deactivation
1. Admin clicks deactivate on a user
2. **Deactivation Modal** opens showing all open tasks assigned to that user
3. Admin must **resolve every open task** (either reassign to a team member OR close it) — cannot proceed until all resolved
4. Once all tasks resolved → account deactivated, login disabled
5. All historical data preserved permanently

### 1.8 — Reactivation
- Admin can reactivate a deactivated account → simple confirm dialog. All historical data restored.

---

## SEGMENT 2: First Login / Onboarding

### 2.1 — Employee Onboarding
1. On first login, middleware detects un-onboarded user → redirect to `/onboarding`
2. **3-step wizard** (outside the main app shell):
   - **Step 1 — Welcome**: Shows employee name, assigned team, and manager
   - **Step 2 — Profile**: Any pre-assigned tasks are shown
   - **Step 3 — Ready**: Prompt to set up first weekly plan
3. On completion → `onboarded = true` on profile → redirected to main app

### 2.2 — Admin Setup Flow
1. First admin sees **Admin Setup** (`/admin/setup`)
2. Guided checklist tracking 5 setup steps:
   - Create departments
   - Create teams
   - Assign managers
   - Create/import users
   - Configure team settings
3. Progress bar shows completion. Each step has deep links to the relevant admin page.

---

## SEGMENT 3: App Shell & Navigation

### 3.1 — Sidebar
- Role-aware navigation — items shown/hidden based on user permissions
- **All roles:** Dashboard, My Tasks, Board (Kanban), Weekly Plan, Daily Check-in, EOD Wrap-up, Activity Feed, Settings, Notifications (preferences)
- **Manager+ only:** Team Tasks, Team Plans, Team Pulse, Workload
- **Admin only:** Users, Teams, Audit Trail, System Settings
- **Mobile:** Collapses to bottom nav + hamburger overlay

### 3.2 — Top Bar
- **Global Search Bar** with Ctrl+K / Cmd+K shortcut
- Notification **bell icon** — filled when unread, badge shows count (max 99+)
- User avatar / dropdown for logout

### 3.3 — Quick Task Creation (FAB)
- **Floating Action Button** (fixed bottom-right on mobile) available on every screen
- Opens the `QuickTaskModal` — a glassmorphism modal for creating a task from anywhere

---

## SEGMENT 4: Task Module (Core)

### 4.1 — Creating a Task
1. Via Quick Task Modal OR from My Tasks / Team Tasks page
2. **Required fields:** Title, Assignee, Due Date, Estimated Hours, Task Type (Planned/Ad Hoc), Task Nature (Core/Supporting), Billable (if user has permission), Priority (High/Medium/Low), Project/Category, Status starts at "To Do"
3. **Optional:** Description, Reviewer, Dependencies, Custom Fields (loaded dynamically based on project)
4. **Billable gate:** Only users with billable permission enabled can mark a task as Billable
5. **Ad hoc backdating:** Can create a task and immediately mark it complete (for firefighters logging work already done) — requires actual_hours + completion report

### 4.2 — Task Status Flow (Strict)
```
To Do → In Progress → In Review → Done
```
- **Cannot skip statuses**
- **To Do → In Progress:** Blocked if dependencies not yet Done (system warns)
- **In Progress → In Review:** Requires a **completion report** on file (text note or file attachment). If dragged on Kanban without a report, the Completion Report Modal opens first.
- **In Review → Done:** Only the **assigned Reviewer** or Manager+ can do this
- **In Review → Send Back (In Progress):** Reviewer can send back with a required reason (visible to assignee)
- If **no Reviewer** is assigned, assignee marks Done directly after submitting their report

### 4.3 — Completion Report (Mandatory)
- A task **cannot** move to Done without a completion report — enforced at API level
- **Two forms:** Written text note OR file attachment (or both)
- Opens as a modal: text area + file upload (drag & drop, supports PDF/Word/Excel/Images/Video, 25MB max)

### 4.4 — Task Reassignment
- Creator or Manager+ can reassign
- Modal shows searchable team member list + reason textarea
- On reassign → original assignment preserved in history, timeline records: old assignee, new assignee, who did it, when, reason

### 4.5 — Subtasks
- A task can have child subtasks
- Subtasks inherit parent's project and assignee by default (overridable)
- If a subtask is shifted (reassigned/rescheduled), it's logged in the parent's timeline

### 4.6 — Dependencies
- Task B can depend on Task A → Task B **cannot move to In Progress** until Task A is Done
- **Circular dependency prevention** — validated via BFS traversal at API level
- System warns the assignee and their manager when a dependency blocks progress
- When Task A completes → **dependency_unblocked** notification sent to Task B's assignee

### 4.7 — Task Timeline
- Every task has a **Timeline tab** — chronological log of everything that happened
- Includes: creation, assignee changes, reviewer changes, status changes, subtask events, file attachments, dependencies, completion reports, comments, custom field changes
- **Read-only. Cannot be edited or deleted.**

### 4.8 — My Tasks Page (`/tasks`)
- Status tabs across top: To Do / In Progress / In Review / Done
- Filter pills: Priority, Type, Nature, Project, Billable
- Each row shows: priority color bar, title (links to detail), status badge, project, due date
- Overdue tasks visually flagged

### 4.9 — Team Tasks Page (`/team/tasks`)
- Same as My Tasks + **Assignee column** + Overdue-only filter chip
- Scoped by role: Manager → their team, Senior Manager → their department, Admin → all

### 4.10 — Task Detail Page (`/tasks/[id]`)
- Header with progress buttons (status transitions)
- If reviewer: Approve / Send Back buttons
- Two-column layout:
  - **Left (Details tab):** Description, Subtasks list, Dependencies grid, File Attachments, Completion Report section
  - **Left (Timeline tab):** Full event history
  - **Right sidebar:** Metadata card (Status, Priority, Assignee, Reviewer, Due Date, Est./Actual/Review Hours, Type, Nature, Billable, Project), Custom Fields (inline editable)

---

## SEGMENT 5: Kanban Board (`/board`)

1. **4 columns:** To Do → In Progress → In Review → Done
2. **Drag & drop** cards between columns — enforces same status rules as API
3. If dragging to "In Review" without a completion report → modal pops up first
4. **Optimistic updates** — card moves instantly, reverts if API fails
5. **Filter bar:** Search (title), Priority, Type, Nature, Project, Billable, Assignee dropdowns
6. **Custom field filters:** Dynamic per-field controls (text search, number range, date range, dropdown select, checkbox toggle)
7. **Active filter chips** with individual removal + "Clear all"
8. **Saved Views:** Save any filter combo as a named view (personal or shared for managers)
9. Managers see **all team tasks**; employees see only their own

---

## SEGMENT 6: Planning Module

### 6.1 — Weekly Plan (`/plan`)
1. **Week grid** with columns for each day of the employee's configured work week
2. **Task pool** on top — unplanned tasks shown as draggable pills
3. **Drag tasks from pool → day columns** (DnD)
4. For each task in a day: set **planned hours** (input)
5. **Capacity bar** per day: Green (80–100% of available hours), Amber (50–79% or over 110%), Red (<50% or empty)
6. **Week navigation** arrows to go to previous/next weeks
7. **Submit flow (Locked Mode):** Submit button locks the plan. Once locked, only a Manager can unlock.
8. **Fluid Mode:** No submit button. Plan is always visible and editable.
9. **Manager Comments** section at bottom — manager can leave comments; employee sees them.
10. **Carry-over:** Incomplete tasks from previous days auto-roll to next working day with notification.

### 6.2 — Daily Check-in (`/checkin`)
1. Pre-populated from today's plan entries
2. Employee toggles tasks as confirmed/unconfirmed for the day
3. Optional notes field
4. Capacity bento card showing day's load
5. Submit → record saved with timestamp
6. Shows "submitted" state after submission
7. Can be **mandatory per team** (manager configurable)

### 6.3 — EOD Wrap-up (`/wrapup`)
1. **Pre-filled** from plan entries + task actual_hours (not manual double-entry)
2. 12-column table: Task | Planned Hours | Actual Hours | Match indicator
3. Actual hours are **editable** — employee can correct
4. Notes field
5. **Discrepancies auto-computed:** if |planned - actual| ≥ 0.5 hours, flagged
6. File attachments section (after submission, not before)
7. Submit → record saved
8. Can be **mandatory per team** (manager configurable)

### 6.4 — Team Plans (`/team/plans`) — Manager+ only
1. **Big Fat Warning Banner** at top — lists team members who have **unplanned days** (prominently, cannot be ignored)
2. **Capacity grid:** Each team member = row, each day of their work week = column, cell shows planned hours with color coding (Healthy/Low/Over/Empty)
3. **Submission status** column per team member (Submitted / Draft / Fluid)
4. **Completion stats** cards

---

## SEGMENT 7: Manager Dashboard

### 7.1 — My Overview (`/dashboard`) — All roles
- **Today's Tasks** (left, 7 cols): tasks due/in progress/done today
- **Completion Rate** (right, 5 cols): SVG donut chart — done tasks vs committed this week
- **Upcoming Deadlines:** tasks due in next 3 days
- **Carry-overs:** tasks that rolled from previous days
- Manager sees **quick-links bento** (Team Pulse, Workload, Reports); employee sees **personal week bento**

### 7.2 — Team Pulse (`/dashboard/team-pulse`) — Manager+ only
- **Amber Warning Zone:** list of team members with unplanned days as pills. Manager can **acknowledge** with a comment (logged to audit trail)
- **Capacity Grid:** members as rows × days as columns, color-coded (Green/Amber/Red)
- **Overdue Tasks:** all overdue across team, grouped by employee
- **Completion Rate** per employee this week
- **Week navigation**

### 7.3 — Workload View (`/dashboard/workload`) — Manager+ only
- **KPI Summary Banner:** total planned vs actual hours
- **Table:** each member row shows "Planned / Actual" per day in colored pills (green if match, amber/red if discrepancy)
- **Actual hours sourced from EOD wrap-ups** (canonical source)
- **Week navigation**

### 7.4 — Activity Feed (`/dashboard/activity`) — All roles, scoped
- Live stream of team activity
- **8 filter types** as pills
- Event cards: avatar initial + event-type dot + description + timestamp
- **Cursor-based pagination** ("Load earlier activity")
- **Scoping:** Employee → own events, Manager → team, Senior Manager → department, Admin → all

---

## SEGMENT 8: Notifications

### 8.1 — Notification Panel
- Slides out from the **bell icon** in TopBar (right-side drawer, 400px)
- **Filter chips** (read/unread/all)
- Icon-coded notification list
- Loading skeletons, empty state
- Footer link to **Notification Preferences**

### 8.2 — 13 Notification Triggers

| # | Trigger | Channel | Disableable? |
|---|---------|---------|-------------|
| 1 | Task assigned to you | In-app | No |
| 2 | Task reassigned away from you | In-app | No |
| 3 | Task due today | In-app | No |
| 4 | Task overdue | In-app + Email | No |
| 5 | Task moved to In Review | In-app | No |
| 6 | Task sent back by reviewer | In-app | No |
| 7 | Task marked Done | In-app | **Yes** |
| 8 | Dependency unblocked | In-app | No |
| 9 | Weekly plan not submitted by deadline | In-app + Email | No |
| 10 | Daily check-in not submitted (if mandatory) | In-app | No |
| 11 | Employee has zero tasks planned | In-app + Email | No |
| 12 | Comment on your plan | In-app | **Yes** |
| 13 | Comment on a task you're in | In-app | **Yes** |

- **8 fire inline** (when the triggering action happens)
- **5 run via cron** (`/api/cron/notifications`): due today, overdue, plan not submitted, check-in missing, zero planned
- **Polling:** Panel refreshes every 30s, badge count every 60s
- **Email sending** defined but email provider not yet wired (channel flag set correctly)

### 8.3 — Notification Preferences (`/settings/notifications`)
- 10 **required** types shown as locked (cannot disable)
- 3 **optional** types shown as toggleable switches

---

## SEGMENT 9: Global Search

- Available from **every screen** via the TopBar search bar
- **Ctrl+K / Cmd+K** keyboard shortcut to focus
- **300ms debounce** on input
- Searches across: **Task titles** (full-text via PostgreSQL tsvector), **Project names** (trigram), **People names/emails** (trigram)
- **Glassmorphism dropdown** with categorized results (Tasks, Projects, People)
- Keyboard navigation (↑ ↓ Enter)
- Match highlighting in results
- "See all N results" footer
- Scrim overlay behind dropdown when active
- **Archived tasks excluded** from results

---

## SEGMENT 10: File Attachments

- Supported on: **Tasks** (attachments + completion reports) and **EOD Wrap-ups**
- **Drag & drop** or file browse
- **Allowed types:** PDF, Word (.docx), Excel (.xlsx), Images (JPG, PNG), Video
- **Max size:** 25MB per file
- **Storage:** Supabase Storage bucket `task-files`, organized as `tasks/{task_id}/{timestamp}_{filename}`
- **In-app preview:** PDFs via iframe (signed URL), Images via native `<img>` tag
- **Unsupported preview types** (Word, Excel, video) → "Download Instead" fallback
- **Zoom controls** in preview modal (25% increments)
- **Files are permanent** — deleting a task does not delete its files
- Timeline events logged on upload

---

## SEGMENT 11: Custom Fields

### 11.1 — Management (`/settings/custom-fields`)
- Only **Manager+** can create/edit/archive custom fields
- **Field types:** Text, Number, Date, Dropdown (with configurable options), Checkbox
- **Scope:** Global, Team-specific, or Project-specific
- **Soft-archive:** Archiving hides the field from new tasks but preserves existing data
- Tab filters: All / Active / Archived

### 11.2 — Usage
- Custom fields appear in **Quick Task Modal** (dynamically fetched based on selected project)
- Custom fields appear in **Task Detail** sidebar (inline editable: click to edit → typed input → save/cancel)
- Custom fields usable as **Board filters** (dynamic per-field filter controls)
- Custom field values included in **Task Export CSV**
- Custom field values included in **Saved Views** filter state

---

## SEGMENT 12: Reporting & Export

### 12.1 — Reports Page (`/reports`) — Manager+ only
- Two-column layout: **Report type selector** (left) + **Parameters & Generate** (right)
- **5 report types:**

| Report | Formats | Access |
|--------|---------|--------|
| Weekly Team Performance | PDF, CSV | Manager+ |
| Individual Employee | PDF, CSV | Manager+ |
| Billable Hours Summary | PDF, CSV | Manager+ |
| System Activity | CSV only | Admin only |
| Task Export | CSV only | Manager+ |

- **Parameters:** Date range (default: current week), Team selector, Employee selector (contextual per report type), Format toggle (PDF/CSV)
- PDFs generated server-side via **pdfmake** with Indigo-Slate themed headers and clean tables
- CSVs generated via **PapaParse**
- Downloads as blob via `URL.createObjectURL`
- Reports respect **manager's access scope** (can't pull reports outside their department)

---

## SEGMENT 13: Admin Module

### 13.1 — User Management (`/admin/users`)
- Full CRUD table with role badges
- Actions: Edit, Deactivate (with task reassignment modal), Reactivate, Resend Invite
- Filters for role/status

### 13.2 — Team/Department Management (`/admin/teams`)
- Collapsible department → team hierarchy view
- Create/edit departments, create/edit teams
- Assign managers to teams, senior managers to departments

### 13.3 — Audit Trail (`/admin/audit-trail`) — Admin only
- **Paginated** view of all system events
- **Filters:** Date range, Event type dropdown, Actor dropdown
- **Columns:** Timestamp, Actor, Event Type, Description, Old Value, New Value
- Sources from `audit_log` table (user account changes, team structure changes, permission changes, exports, deactivations)

### 13.4 — Admin Setup Flow (`/admin/setup`)
- 5-step guided checklist for first-time admin setup
- Progress bar, deep links to each step

---

## SEGMENT 14: Settings

### 14.1 — User Preferences (`/settings`) — All users
- Notification preference toggles (3 optional types)
- Default task view: **List** or **Kanban** (segmented control)

### 14.2 — Team Settings (`/settings/team`) — Manager+ only
- Planning mode: **Locked** (submit by deadline) or **Fluid** (always editable)
- Submission deadline: Day + Time (only shown in Locked mode)
- Daily check-in mandatory: Yes/No toggle
- EOD wrap-up mandatory: Yes/No toggle
- Link to manage custom fields

### 14.3 — System Settings (`/settings/system`) — Admin only
- **Organisation name**
- **Default available hours per day** (stepper, default: 8)
- **Archive window** (months before completed tasks are archived, default: 6)
- Quick management links (Users, Teams)

---

## SEGMENT 15: Archiving

- Cron job (`/api/cron/archive-tasks`) moves tasks with `status=done` + `completed_at` older than the configured archive window to `status=archived`
- Archived tasks are **excluded from all active views**: task lists, board, search, dashboard widgets, notifications, reports
- Archived tasks retain full timeline and attachments
- **Nothing is ever permanently deleted in v1**

---

## SEGMENT 16: Roles & Access Matrix (Quick Reference)

| Capability | Employee | Sr. Employee | Asst. Manager | Manager | Sr. Manager | Admin |
|------------|----------|-------------|---------------|---------|-------------|-------|
| Create task for self | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create task for others | — | — | Sub-team | Team | Department | All |
| Assign reviewer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View own tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View team tasks | — | — | Sub-team | Team | Department | All |
| Reassign tasks | — | — | Sub-team | Team | Department | All |
| Submit weekly plan | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Comment on plans | — | — | ✓ | ✓ | ✓ | ✓ |
| Create custom fields | — | — | — | ✓ | ✓ | ✓ |
| Manage users/teams | — | — | — | — | — | ✓ |
| Export reports | — | — | — | ✓ | ✓ | ✓ |
| View audit trail | — | — | — | — | — | ✓ |

---

## SEGMENT 17: Edge Cases & Recovery Scenarios

| Scenario | How Sunday Handles It |
|----------|----------------------|
| Employee leaves mid-week with open tasks | Admin deactivates → system generates reassignment list → must resolve all before deactivation finalises |
| Reviewer is unavailable | Manager can override: reassign reviewer role or mark Done themselves (logged in Timeline) |
| Two managers reassign same task simultaneously | Last write wins — both actions logged in Timeline; notification confirms final state |
| EOD wrap-up submitted but tasks not marked complete | System flags discrepancy: "You reported X as done but task is still In Progress" |
| Task dependency broken (Task A deleted but Task B depends on it) | System alerts Task B's assignee + manager; dependency flagged as broken |
| Employee plans more hours than available | Warning shown but not blocked; manager sees amber/red on capacity grid |
| Employee plans zero hours for a day | Flagged to manager as unplanned (Big Fat Warning); not blocked |
| Plan submission deadline missed | In-app notification to employee + urgent email to manager; plan remains editable |
| Custom field deleted after tasks use it | Field archived (not deleted); existing data preserved; field hidden from new tasks |
| Employee in different timezone appears "late" | All deadline compliance calculated in **employee's own timezone**, not manager's |

---

## SEGMENT 18: Known Deferred Items (Not Yet Wired)

1. **Email sending** — channel flags set, but no email provider (Resend/SendGrid) integrated
2. **Task comments API** — `comment_on_task` notification type exists, but no `/api/tasks/[id]/comments` route yet
3. **Cron scheduling** — `/api/cron/notifications` and `/api/cron/archive-tasks` exist but need Vercel Cron or external scheduler
4. **Real-time updates** — No polling or Supabase Realtime subscriptions on board/plans/dashboard
5. **`.env.local`** — Needs real Supabase credentials to test against a live DB
6. **Database migrations** — 9 migration files need to be applied to the Supabase project
7. **Role enum mismatch** — `types/index.ts` uses `senior_employee`/`assistant_manager`; some routes reference different DB values — needs reconciliation before production

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, `src/` directory) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 |
| Auth / DB | Supabase (`@supabase/ssr`, cookie-based) |
| Forms | React Hook Form + Zod v4 |
| Drag & Drop | @dnd-kit/core, sortable, utilities |
| CSV | PapaParse |
| PDF | pdfmake (server-side) |
| Icons | Material Symbols Outlined (Google Fonts) |
| Font | Plus Jakarta Sans |
| Design System | "The Digital Atrium / Architectural Quietude" — Indigo-Slate palette |
