# Sunday — Product Architecture Document

> A focused task and time management system that gives managers full visibility into what their team committed to, what they actually did, and whether their days were planned — built to sit alongside the WorkPulse HR platform and eventually integrate with it.

**Version:** 1.0
**Date:** 9 April 2026
**Status:** Product Definition Complete — Ready for Technical Planning
**Product Owner:** RainKode / Magpie Nest Group
**Pilot Deployment:** All ventures under Magpie Nest Group simultaneously

---

## 1. Executive Summary

### 1.1 The Problem

Managers assign work and have no reliable way of knowing whether it was done, when it was done, or how long it took. Employees — particularly those without strong time management habits or without enough context to proceed — end up firefighting instead of planning. The result is missed commitments, unclear accountability, and no paper trail when things go wrong.

### 1.2 The Solution

Sunday is a task and planning system where every piece of work is created, assigned, tracked, and closed with a mandatory completion report. Employees plan their weeks (and optionally their days), managers see the whole team's capacity and output in real time, and every task carries a full lifecycle log from creation to completion. Nothing disappears. Everything is recorded. If someone is annoyed that their work is being tracked, the system is working.

### 1.3 Target Users

Office-based employees and their managers across organisations running 24/7 operations with distributed teams across multiple timezones. Version 1 targets the Magpie Nest Group's office staff (~50–60 employees) across all six ventures. Field workers are explicitly excluded from v1.

### 1.4 Business Model

Internal operational tool for v1 — no external billing. Built as a standalone product with the architecture to eventually become a commercially licensed SaaS product or to be absorbed into the WorkPulse HR platform as a module.

### 1.5 Core Value Proposition

Sunday answers two questions that every manager needs answered every single day:
**"Did my team do what they committed to?" and "Are their days actually planned?"**

---

## 2. User Roles and Permissions

### 2.1 User Types

Sunday uses a hierarchical role structure reflecting real organisational seniority. Roles are not flat — they cascade, meaning a Senior Manager sees everything a Manager sees, plus more.

| Role | Description | Key Abilities |
|------|-------------|---------------|
| **Employee** | Individual contributor. Does the work. | Create own tasks, log time, submit plans, complete tasks with reports |
| **Senior Employee / Executive** | More experienced IC. May self-plan fully. | All Employee abilities + can self-assign tasks without manager initiation |
| **Assistant Manager** | Junior management. Oversees a small team or sub-team. | All SE abilities + assign tasks to their sub-team, view sub-team plans and capacity |
| **Manager** | Owns a team. Primary accountability layer. | All AM abilities + full team task management, approve/comment on plans, view team dashboard |
| **Senior Manager / Department Head** | Owns multiple teams or a department. | All Manager abilities + cross-team visibility, department-wide capacity view |
| **Admin / HR** | System administrator. No operational role in task work. | Full system access — user management, team structure, settings, system-wide audit trail, all reports |

> **Note on Firefighters:** Employees in business systems / performance roles who handle high volumes of ad hoc work are not a separate role — they are Employees or Senior Employees with a higher proportion of self-assigned, unplanned tasks. The system handles this through task type (Planned vs Ad Hoc) rather than a special role.

### 2.2 Access Control Summary

| Action | Employee | Sr. Employee | Asst. Manager | Manager | Sr. Manager | Admin |
|--------|----------|--------------|---------------|---------|-------------|-------|
| Create task for self | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create task for others | — | — | Sub-team only | Team only | Dept only | ✓ |
| Assign reviewer to task | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mark task Done (no reviewer) | Self only | Self only | Self only | Self only | Self only | ✓ |
| Mark task Done (with reviewer) | Reviewer only | Reviewer only | Reviewer only | Reviewer only | Reviewer only | ✓ |
| View own tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View team tasks | — | — | Sub-team | Team | Department | ✓ |
| View capacity grid | — | — | Sub-team | Team | Department | ✓ |
| Reassign tasks | — | — | Sub-team | Team | Department | ✓ |
| Submit weekly plan | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Comment on team plans | — | — | ✓ | ✓ | ✓ | ✓ |
| Create/edit custom fields | — | — | — | ✓ | ✓ | ✓ |
| Manage users and teams | — | — | — | — | — | ✓ |
| Export reports | — | — | — | ✓ | ✓ | ✓ |
| View system audit trail | — | — | — | — | — | ✓ |

### 2.3 User Lifecycle

**Account Creation:**
Admin creates the employee account manually. Sets role, team, reporting manager, work week pattern (e.g. Sun–Thu or Mon–Fri), timezone, and billable task permissions. Employee receives an email invite to set their password.

**First Login:**
Employee lands on a simple welcome screen showing their assigned team, their manager, and any tasks already assigned to them. A non-intrusive prompt guides them to set up their first weekly plan. No tutorial bloat.

**Active Use:**
Employee plans weeks, creates and receives tasks, logs completions with reports. Manager monitors via dashboard. Admin manages structure and exports reports.

**Departure:**
Admin deactivates account. All tasks currently assigned are flagged for reassignment — manager receives a notification listing them. Historical task data, completion reports, and audit trail are preserved permanently. Deactivated accounts are visible in task history but cannot log in.

**Re-activation:**
Admin can reactivate a deactivated account. All historical data is restored. The employee picks up where they left off.

---

## 3. Product Modules

---

### 3.1 Task Module

**Purpose:** The atomic unit of Sunday. Every piece of work — planned or unplanned, billable or not, simple or complex — lives here as a task. No task is complete without a report.

**User Stories:**
- As a Manager, I can create a task, assign it to an employee, set a due date and estimated hours, and know it cannot be closed without a completion report, so that I have evidence of work done.
- As an Employee, I can create my own tasks for work I pick up independently, so that my self-directed work is visible and logged alongside assigned work.
- As a Reviewer, I am the only person who can mark a task Done when I am assigned as reviewer, so that I am accountable for quality before closure.
- As a Manager, I can see the full lifecycle of any task — every status change, every reassignment, every review — so that I can understand exactly what happened and when.
- As an Employee (firefighter role), I can log an ad hoc task after I have already done it, so that unplanned work is captured even when it happens before there is time to plan.
- As a Manager, I can reassign a task to another employee when someone is unavailable, and the system preserves the original assignment history, so that accountability is never lost.

**Task Fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Title | Text | Short name of the task | Yes |
| Description | Rich text | Full context, instructions, background | No |
| Creator | Auto | Who created the task — set automatically | Yes |
| Assignee | User selector | Who is doing the task | Yes |
| Reviewer | User selector | Who must approve completion. If set, only this person can mark Done | No |
| Due Date | Date | When the task must be completed | Yes |
| Estimated Hours | Number | How long the task is expected to take | Yes |
| Actual Hours | Number | How long it actually took — logged on completion | Yes (at completion) |
| Review Hours | Number | Time spent by reviewer, if applicable | No |
| Task Type | Toggle | Planned or Ad Hoc | Yes |
| Task Nature | Toggle | Core or Supporting | Yes |
| Billable | Toggle | Billable (revenue-generating) or Non-Billable | Yes |
| Priority | Selector | High / Medium / Low | Yes |
| Status | Selector | To Do / In Progress / In Review / Done | Yes |
| Project / Category | Selector | Which project or work area this belongs to | Yes |
| Dependencies | Task link | Links to another task that must be completed first (one level, v1) | No |
| Subtasks | Nested tasks | Smaller steps within the task | No |
| Completion Report | Text or File | Written note or attached file. Mandatory before closing | Yes (at completion) |
| Custom Fields | Variable | Additional fields created by Managers/Admins per team or project | No |

**Key Behaviours:**

- A task cannot move to Done without a completion report — either a written note or a file attachment. This is enforced by the system, not by trust.
- If a Reviewer is assigned, the task moves to "In Review" when the Assignee submits their report. The Reviewer then reviews and marks Done (or sends back with comments).
- If no Reviewer is assigned, the Assignee marks Done directly after submitting their report.
- When a task is reassigned, the system logs: original assignee, new assignee, who made the change, the date, and optionally a reason. The task history is never erased.
- Ad hoc tasks can be created and immediately marked complete (backdated) for work already done — this is explicitly allowed for firefighter-type employees.
- Subtasks inherit the parent task's project and assignee by default but can be overridden.
- If a subtask is shifted (reassigned or rescheduled), it is logged in the parent task's timeline.
- Dependencies: if Task B depends on Task A, Task B cannot move to In Progress until Task A is Done. The system warns the assignee and their manager.
- Billable task permissions are set per user by Admin. An employee can only mark a task Billable if they have billable permissions enabled on their account.
- Custom fields can be created by Managers and Admins at the project or team level. Some system fields (Title, Assignee, Due Date, Status, Completion Report) are fixed and cannot be removed.

**Task Timeline (Lifecycle View):**

Every task has a Timeline tab. This is a chronological log of everything that ever happened to the task. Anyone who can view the task can see the timeline. It includes:

- Task created — by whom, when
- Assignee set / changed — from whom, to whom, by whom, when
- Reviewer set / changed
- Status changes — who moved it, when
- Subtasks added, completed, or shifted
- Comments added
- Files attached
- Dependencies triggered
- Completion report submitted
- Task marked Done — by whom, when
- Any custom field changes

This view is read-only. It cannot be edited or deleted.

**Connections to Other Modules:**
- Feeds into Daily Check-in and Weekly Plan (tasks appear in planning views)
- Feeds into Manager Dashboard (overdue, completion rates, capacity)
- Feeds into Activity Feed
- Feeds into Reporting & Export
- Feeds into Notifications (overdue, status changes, assignments)

---

### 3.2 Planning Module

**Purpose:** Ensures employees' time is structured in advance — not reactive. Managers can see at a glance whether their team's week is planned, and whether the plan matches the work available.

**User Stories:**
- As an Employee, I can plan my week by selecting which tasks I will work on each day and estimating how long each will take, so that my week has structure before it starts.
- As a Manager, I can see every team member's weekly plan in a single view, so that I can spot who is underplanned, overloaded, or completely unplanned before the week begins.
- As a Manager, I can comment on an employee's plan and flag concerns, so that we can align before work starts rather than discovering problems at the end of the week.
- As an Employee, I can do a quick daily check-in each morning confirming what I am focusing on today, so that my manager has a daily signal even without a formal meeting.
- As an Employee, I can submit an end-of-day wrap-up showing what I completed vs what I planned, so that my day is documented and discrepancies are visible.
- As an Admin, I can set whether a team operates on locked plans (must submit by a deadline) or fluid plans (always visible, never formally submitted), so that different teams can work in the way that suits them.

**Planning Features:**

| Feature | Description | Who Can Use It | Priority |
|---------|-------------|----------------|----------|
| Weekly Plan | Employee selects tasks for the week, assigns them to days, estimates hours | All roles | P1 |
| Plan Submission Deadline | Configurable per team — e.g. submit by Sunday 10pm or Monday 9am (in employee's local time) | Admin/Manager sets, Employee submits | P1 |
| Locked Mode | Plan is locked after submission. Manager must unlock for changes | Admin/Manager sets | P1 |
| Fluid Mode | Plan is always visible and editable. No formal submission | Admin/Manager sets | P1 |
| Daily Check-in | Brief morning confirmation of today's focus, pulled from weekly plan | All employees | P1 |
| EOD Wrap-up | End-of-day summary — pre-filled from task activity, employee confirms or adds notes | All employees | P1 |
| Plan Comments | Manager leaves comments on an employee's plan | Manager and above | P1 |
| Carry-over | Incomplete tasks from today auto-roll to the next working day with a notification to the employee | System automated | P1 |
| Self-plan Autonomy | Some employees (Senior Employees and above) can plan fully independently without manager initiation | Configurable per user | P1 |

**Key Behaviours:**

- The work week is configured per employee (e.g. Sun–Thu for Dhaka, Mon–Fri for UK/US). The weekly plan respects each employee's work week, not a global calendar.
- All submission deadlines are relative to the employee's configured timezone.
- If an employee does not submit their plan by the deadline (in locked mode), the system sends an in-app notification to the employee and an urgent email to their manager.
- EOD wrap-up is pre-filled by the system based on task status changes during the day. The employee confirms, adds notes if needed, and submits. This is not manual double-entry.
- Daily check-in is optional at the system level but can be made mandatory per team by the manager.
- EOD wrap-up is optional at the system level but can be made mandatory per team by the manager.
- Carry-over creates a visible log — the employee can see which tasks rolled from previous days, building a natural record of delays.
- Managers cannot edit an employee's plan directly. They can only comment and flag. The employee must make changes.

**Connections to Other Modules:**
- Pulls tasks from Task Module into planning views
- Feeds unsubmitted plan alerts into Notifications
- Feeds planned hours into Capacity Grid in Manager Dashboard
- EOD wrap-up data feeds into weekly performance reports

---

### 3.3 Manager Dashboard

**Purpose:** The manager's single screen for knowing the state of their team — what was committed, what is getting done, what is stuck, and who is not planned.

**User Stories:**
- As a Manager, I can open my dashboard and immediately see if anyone on my team has no plan for the week, so that I can intervene before the week starts.
- As a Manager, I can see all overdue tasks across my team in one list, so that I know exactly what is at risk without hunting through individual profiles.
- As a Manager, I can see each employee's completion rate for the week (tasks done vs tasks committed), so that I have a factual basis for performance conversations.
- As a Senior Manager, I can see capacity and completion data across multiple teams under me, so that I have a department-wide view without needing separate reports.
- As a Manager, I can create a task directly from the dashboard with one click, so that assigning work is fast and never requires navigating away.

**Dashboard Views:**

**View 1 — My Overview (visible to all roles)**
A personal dashboard showing:
- Today's tasks — what is due, in progress, or done today
- Weekly completion rate — tasks done vs total tasks this week (shown as a simple widget)
- Upcoming deadlines — tasks due in the next 3 days
- Pending carry-overs — tasks that rolled over from previous days

**View 2 — Team Pulse (Manager and above)**
The primary management view:
- Capacity grid — all team members as rows, days of their work week as columns. Each cell shows planned hours vs available hours. Colour coded: green (80–100% planned), amber (50–79% or over 110%), red (under 50% or completely empty)
- Big fat warning — any employee with zero tasks planned for any day gets a prominent alert, not a subtle one
- Overdue task list — all tasks past due date, not yet Done, grouped by employee
- Completion rate widget per employee — this week's tasks done vs committed
- Quick task creation button — always visible, opens a modal overlay without leaving the dashboard

**View 3 — Task Board (all roles)**
Kanban-style board:
- Columns: To Do / In Progress / In Review / Done
- Each card shows: task title, assignee, due date, priority indicator, billable indicator
- Filterable by: assignee, project, priority, task type (planned/ad hoc), task nature (core/supporting), billable status, date range
- Filters are saveable as named views
- Quick task creation button on this view as well

**View 4 — Workload View (Manager and above)**
Utilisation grid:
- Planned hours vs actual hours logged, per employee, per day
- Updates in real time as tasks are completed
- Colour coding mirrors capacity grid
- Click any cell to see the tasks behind the numbers

**Activity Feed (persistent, all views)**
A live stream of team activity — visible in a side panel or dedicated tab:
- "Ahmed marked Task X complete — 9:42am"
- "Sara added a subtask to Project Y — 11:15am"
- "Task Z is now overdue — assigned to Karim"
- "Nadia submitted her weekly plan — 8:55am"
Employees see activity on tasks they are involved in. Managers see all team activity.

**Key Behaviours:**

- The capacity grid respects each employee's configured work week and timezone. A manager seeing their team's grid will see employees' days aligned to each person's own work week.
- The "big fat warning" for unplanned employees is not a subtle badge — it is a visible, prominent alert at the top of the Team Pulse view. It cannot be dismissed without either the employee submitting a plan or the manager acknowledging it.
- Completion rates are calculated automatically from task status data. No manual input required from managers or employees.
- The quick task creation button opens a modal (a pop-up overlay). The manager fills in the required fields and assigns. The task appears immediately in the assignee's task list and triggers an in-app notification.
- Available hours defaults to 8 hours per working day unless overridden at the user level by Admin.

**Connections to Other Modules:**
- Pulls task data from Task Module
- Pulls plan data from Planning Module
- Feeds into Notifications (overdue alerts, unplanned warnings)
- Feeds into Reporting & Export

---

### 3.4 User and Team Management Module

**Purpose:** Admin's control panel for setting up and maintaining the organisational structure that Sunday runs on.

**User Stories:**
- As an Admin, I can create an employee account, set their role, assign them to a team, configure their work week and timezone, and set their billable permissions, so that the system reflects the real organisation.
- As an Admin, I can create and name teams and departments, assign managers to them, and nest sub-teams under departments, so that the hierarchy in Sunday matches the real hierarchy in the organisation.
- As an Admin, I can deactivate an employee account and trigger a task reassignment workflow, so that no work is lost when someone leaves.

**Features:**

| Feature | Description | Who Can Use It | Priority |
|---------|-------------|----------------|----------|
| Create / edit user | Name, email, role, team, manager, work week, timezone, billable permissions | Admin | P1 |
| Deactivate user | Disables login, flags open tasks for reassignment, preserves history | Admin | P1 |
| Create / edit teams | Name, department, assigned manager, planning mode (locked/fluid), plan submission deadline | Admin | P1 |
| Create / edit departments | Name, assigned senior manager | Admin | P1 |
| Set available hours per user | Override default 8 hours/day for non-standard schedules | Admin | P1 |
| Billable permissions | Toggle per user whether they can create billable tasks, non-billable tasks, or both | Admin | P1 |
| Bulk user actions | Reassign multiple tasks, change team assignments | Admin | P2 |

**Key Behaviours:**

- When an account is deactivated, the system generates a list of all open tasks assigned to that employee and presents it to the Admin and the employee's manager. They must either reassign or close each task before the deactivation is finalised.
- Teams have a planning mode setting (locked or fluid) that applies to all employees in the team. Individual overrides are possible for specific employees (e.g. Senior Employees with full autonomy).
- Plan submission deadlines are set per team in the team settings. The deadline is stored as a day + time combination (e.g. "Sunday 10:00pm") and applied relative to each employee's timezone.

**Connections to Other Modules:**
- Feeds role and team data into all other modules
- Feeds timezone and work week configuration into Planning Module
- Feeds billable permissions into Task Module

---

### 3.5 Reporting and Export Module

**Purpose:** Turns Sunday's activity data into exportable records — the paper trail that lives beyond the app. "App might be king but paper is everything."

**User Stories:**
- As a Manager, I can export my team's weekly performance report as a PDF, so that I have a formal record for reviews, audits, or stakeholder updates.
- As an Admin, I can pull a system-wide report of all task activity across all teams for any date range, so that leadership has full visibility.
- As a Manager, I can see a billable hours summary — which tasks were billable, who worked them, how many hours — so that revenue-generating work is tracked.

**Report Types:**

| Report | Contents | Format | Who Can Access |
|--------|----------|--------|----------------|
| Weekly Team Performance | Tasks committed vs completed per employee, completion rate, planned vs actual hours, overdue count | PDF, CSV | Manager and above |
| Individual Employee Report | All tasks for a period — status, hours, planned vs actual, on time vs overdue | PDF, CSV | Manager and above |
| Billable Hours Summary | All billable tasks, assignee, hours estimated vs actual, completion status | PDF, CSV | Manager and above |
| System Activity Report | All task activity across all teams for a date range | CSV | Admin only |
| Task Export | Full export of all tasks with all fields for a given filter set | CSV | Manager and above |

**Key Behaviours:**

- Reports are generated on demand — not scheduled for v1.
- All reports respect the manager's access scope. A manager cannot pull a report for teams outside their department.
- Date range is always selectable. Default is current week.
- CSV exports include all task fields including custom fields.
- PDF exports are formatted for readability — not a raw data dump.

**Connections to Other Modules:**
- Pulls all data from Task Module and Planning Module
- Scoped by role and team from User Management Module

---

## 4. Cross-Cutting Concerns

### 4.1 Notifications

Sunday uses two channels: in-app notifications (always) and email (urgent events only).

| Trigger | Channel | Recipient | User Can Disable? |
|---------|---------|-----------|-------------------|
| Task assigned to you | In-app | Assignee | No |
| Task reassigned away from you | In-app | Previous assignee | No |
| Task due today | In-app | Assignee | No |
| Task overdue | In-app + Email | Assignee + their Manager | No |
| Task moved to In Review | In-app | Reviewer | No |
| Task sent back by reviewer | In-app | Assignee | No |
| Task marked Done | In-app | Creator + Assignee | Yes |
| Dependency unblocked (Task A done, Task B can start) | In-app | Task B assignee | No |
| Weekly plan not submitted by deadline | In-app + Email | Employee + their Manager | No |
| Daily check-in not submitted (if mandatory) | In-app | Employee | No |
| Employee has zero tasks planned (big fat warning) | In-app + Email | Manager | No |
| Comment added to your plan | In-app | Plan owner | Yes |
| New comment on a task you are involved in | In-app | All involved parties | Yes |

### 4.2 Search and Filtering

**Global Search:** Searches across task titles, descriptions, assignee names, project names, and completion reports. Available from any screen via a persistent search bar.

**Task Filters (Task Board and all task list views):**
- Assignee
- Project / Category
- Status (To Do / In Progress / In Review / Done)
- Priority (High / Medium / Low)
- Task Type (Planned / Ad Hoc)
- Task Nature (Core / Supporting)
- Billable / Non-Billable
- Due Date range
- Created Date range
- Has Reviewer / No Reviewer
- Overdue only
- Custom field values (for custom fields added by managers)

**Saved Views:** Any combination of filters can be saved as a named view per user. Personal saved views are private. Managers can create shared views visible to their whole team.

### 4.3 File Handling

- File attachments are supported on tasks (as part of completion reports or supporting documentation) and on planning wrap-ups.
- Supported file types: PDF, Word documents, Excel spreadsheets, images (JPG, PNG), and common video formats for v1.
- Maximum file size per attachment: to be determined by the technical team based on hosting setup — flag as Open Question.
- Files can be previewed in-app without downloading (PDF and image preview at minimum).
- Files are stored securely and linked to the task permanently. Deleting a task does not delete its files — they are archived.

### 4.4 Data Import and Export

**Import (v1):**
- Bulk user import via CSV (for Admin setting up accounts)
- No task import in v1 — tasks are created natively in Sunday

**Export:**
- Weekly performance reports — PDF and CSV
- Full task export — CSV with all fields
- System activity report — CSV (Admin only)
- All exports are scoped to the exporting user's access level

### 4.5 Activity History and Audit Trail

**Task-level (Task Timeline):** Every state change, assignment, comment, file, and completion event on a task is logged chronologically and permanently. Visible to anyone who can view the task. Cannot be edited or deleted.

**System-level Audit Trail (Admin only):** Logs all system events — user account changes, team structure changes, permission changes, exports run, accounts deactivated. Accessible only to Admin. Retained permanently.

**Planning-level:** Weekly plan submissions, daily check-ins, and EOD wrap-ups are all timestamped and stored. Managers can see historical plans for their team.

### 4.6 Settings and Preferences

**User-level settings (each employee can configure):**
- Display timezone (defaults to configured timezone, can be changed)
- Notification preferences (which optional notifications to receive in-app)
- Default task view (Kanban / List)
- Saved filter views

**Team-level settings (Manager and Admin):**
- Planning mode (Locked or Fluid)
- Plan submission deadline (day + time)
- Daily check-in mandatory (yes/no)
- EOD wrap-up mandatory (yes/no)
- Custom fields for this team

**System-level settings (Admin only):**
- Organisation name and branding
- Default available hours per day (default: 8)
- User management
- Team and department structure
- Billable permissions per user
- Archiving window (how many months before completed tasks are archived)

### 4.7 Onboarding Experience

**First Login Flow:**
1. Employee is welcomed by name and shown their team and manager
2. Any tasks already assigned to them are displayed immediately
3. A simple, non-skippable prompt: "Set up your first weekly plan" — takes them to the planning module with guidance on how to slot tasks into days
4. After the plan is saved, onboarding is complete. No tutorial, no demo data, no feature tour unless they ask for help.

**Admin Setup Flow:**
1. Admin creates the organisational structure first (departments → teams → managers)
2. Then bulk imports or manually creates employee accounts
3. System sends email invites automatically

### 4.8 Reporting and Analytics

Covered in full in Module 3.5. Summary of metrics available:

- Tasks completed vs committed (per employee, per team, per period)
- Planned hours vs actual hours (per employee, per period)
- On-time completion rate (tasks completed by due date vs total)
- Ad hoc vs planned task ratio (per employee — useful for identifying firefighters)
- Billable hours total (per employee, per team, per period)
- Overdue task count and average delay
- Plan submission compliance rate (per team)

### 4.9 Billing and Subscription

Not applicable for v1. Sunday is deployed as an internal tool for Magpie Nest Group at no per-seat cost. Commercial licensing model to be defined if Sunday becomes a standalone product in future.

### 4.10 Integrations

**v1:** None. Fully standalone.

**Planned (v2/v3):**
- WorkPulse HR — employee records, attendance data feeds into available hours, task completion feeds into performance review module
- Calendar integration (Google Calendar / Outlook) — weekly plans sync to calendar
- Accountability Meter — composite performance score fed by Sunday task data

### 4.11 Mobile Considerations

Sunday is built with a responsive web interface that works on both desktop and mobile browsers. A dedicated mobile UI is included in v1 scope. All core features must work on mobile:
- Viewing and updating tasks
- Daily check-in and EOD wrap-up (these are particularly important on mobile — quick, daily actions)
- Notifications
- Task creation (quick modal)

Heavy data views (capacity grid, workload utilisation grid) are desktop-primary but must be viewable on mobile in a simplified format.

### 4.12 Multi-language and Multi-currency

**v1:** English only. No multi-currency (Sunday does not handle payments — billable task tracking is for internal logging purposes only, not invoicing).

**Future:** Multi-language support may be required as the Magpie Nest Group operates across Bangladesh, UK, and US. Flag for v3 planning.

### 4.13 Archiving and Data Retention

- Completed tasks older than a configurable window (default: 6 months) are automatically archived
- Archived tasks are not visible in active views but are fully searchable via global search and accessible in reports
- Archived tasks retain their full Task Timeline and all attachments
- Archiving is not deletion — nothing is ever permanently deleted in v1
- Admin sets the archiving window in system settings
- Deactivated user data is retained permanently

---

## 5. Edge Cases and Recovery Scenarios

| Scenario | How Sunday Handles It |
|----------|----------------------|
| Employee leaves mid-week with open tasks | Admin deactivates account → system generates reassignment list → manager and admin must reassign or close all open tasks before deactivation finalises |
| Reviewer is unavailable to approve a task | Manager can override and either reassign the reviewer role or mark the task Done themselves (with this override logged in the Task Timeline) |
| Two managers try to reassign the same task simultaneously | Last write wins — system logs both actions in Task Timeline. Notification sent to both managers confirming the final state |
| Employee submits EOD wrap-up but forgot to mark tasks complete | System flags the discrepancy — "You reported X as done but the task is still In Progress." Employee must either update the task or correct the wrap-up |
| Task dependency broken — Task A gets deleted but Task B depended on it | System alerts Task B's assignee and their manager. Dependency is flagged as broken. Manager must resolve manually |
| Employee plans more hours than available in a day | System warns ("You have planned 11 hours for a day with 8 available hours") but does not block. Manager sees amber/red on capacity grid |
| Employee plans zero hours for a day | System flags to manager as an unplanned day (big fat warning). Does not block the employee |
| Plan submission deadline missed | In-app notification to employee + urgent email to manager. Plan remains editable — deadline is a trigger for alerts, not a hard lock that prevents late submission |
| Custom field deleted by manager after tasks already use it | Field is archived, not deleted. Existing task data using that field is preserved. Field no longer appears on new tasks |
| File attachment on a completed task becomes corrupted | System flags the file as unavailable but preserves the task record and completion report text. Admin is notified |
| Employee in a different timezone submits plan that appears to be "late" from manager's perspective | All deadline compliance is calculated against the employee's own configured timezone, not the manager's. System shows the employee's local submission time |

---

## 6. Market Context

### 6.1 Competitor Overview

| Product | Strength | Weakness (relevant to Sunday) |
|---------|----------|-------------------------------|
| ClickUp | Extremely feature-rich, custom fields, good views | Bloated for non-technical users, overwhelming onboarding |
| Asana | Clean UI, good task assignment and tracking | No daily planning structure, weak accountability enforcement |
| Monday.com | Visual, flexible, good dashboards | Expensive, overkill for internal accountability use case |
| Notion | Flexible, good for documentation | Not a task management tool — accountability is weak |
| Karbon | Excellent task timeline / lifecycle view | Built for accounting firms, expensive, not HR-adjacent |
| Weekdone | Weekly planning, OKR alignment | Not a task management tool, planning-only |
| Connecteam | Good for frontline workers, task checklists | Not suited for knowledge workers or complex task structures |

### 6.2 Standard Features (Market Baseline)

Users who have used ClickUp, Asana, or Monday.com will expect these features as standard. Sunday must include all of them:
- Task creation with title, description, due date, assignee
- Task status tracking (To Do / In Progress / Done)
- Priority levels
- Subtasks
- File attachments on tasks
- In-app notifications
- Manager overview / team dashboard
- Search and filtering
- Mobile access
- Activity log on tasks

### 6.3 Differentiators

What makes Sunday different from everything above:

1. **Mandatory completion reports.** No task closes without evidence. This is not a setting — it is the rule. No competitor enforces this.
2. **Task Timeline / Lifecycle View.** Full chronological history of every task from creation to closure. Karbon comes closest but is not HR-adjacent.
3. **Planned vs Ad Hoc tracking.** Every task is explicitly categorised. Over time, managers can see the ratio of firefighting vs planned work per employee — a signal no other tool surfaces automatically.
4. **Core vs Supporting task classification.** Managers can see whether employees are spending time on revenue-driving work or administrative overhead. Novel in this category.
5. **Weekly planning with timezone-aware work weeks.** Built for 24/7, multi-timezone organisations from the ground up — not bolted on.
6. **Integrated daily planning loop.** Weekly plan → daily check-in → EOD wrap-up → carry-over. A complete planning discipline baked into the product, not optional add-ons.
7. **HR integration roadmap.** Built to connect to WorkPulse — attendance, performance reviews, accountability meter. No competitor is building for this use case.

---

## 7. Release Phases

### Phase 1 — Launch (v1, MVP)

The complete core loop. Every feature needed to answer: "Did they do it, and are their days planned?"

- User accounts with full role hierarchy (Employee → Admin)
- Team and department structure
- Timezone and work week configuration per user
- Billable permissions per user
- Task creation with all fixed fields (title, description, assignee, reviewer, due date, estimated hours, actual hours, review hours, task type, task nature, billable, priority, status, project, dependencies, subtasks, completion report)
- Custom fields (Manager/Admin can create per team or project)
- Task Timeline — full lifecycle log
- Reviewer flow — only reviewer can close task when assigned
- Mandatory completion report enforcement
- Task reassignment with history preservation
- Weekly plan submission — locked and fluid modes per team
- Configurable plan submission deadline (timezone-aware)
- Daily check-in (optional per team, mandatory configurable)
- EOD wrap-up — auto-filled from task activity (optional per team, mandatory configurable)
- Plan comments by manager
- Carry-over with notification
- Manager Dashboard — My Overview, Team Pulse, Task Board, Workload View
- Capacity grid with colour coding and big fat warning
- Activity feed — scoped by role
- Quick task creation modal — persistent on all screens
- Global search
- Task filters with saved views
- In-app notifications (all triggers)
- Urgent email notifications (overdue, missed plan, unplanned employee)
- Weekly performance report — PDF and CSV
- Individual employee report — PDF and CSV
- Billable hours summary — PDF and CSV
- Full task export — CSV
- Responsive web interface with mobile UI
- File attachments on tasks with in-app preview
- Bulk user import via CSV
- System-level audit trail (Admin)
- Archiving with configurable window

### Phase 2 — Growth

Features that make Sunday competitive and sticky once the core loop is proven:

- Utilisation analytics — performance trends over time (not just current week)
- Recurring tasks — for work that happens on a regular cadence
- Workload balancing suggestions — system recommends reassignment when someone is overloaded
- Manager plan approval — formal approve/reject flow before plan is locked
- Scheduled report delivery — auto-send weekly reports to managers every Monday
- Bulk task actions — reassign, close, or update multiple tasks at once
- Integration hooks ready for WorkPulse — API endpoints prepared but not yet live
- Advanced custom reporting — filter and build reports from any combination of fields

### Phase 3 — Scale

Features for when Sunday has real usage data and is connecting to the broader HR ecosystem:

- WorkPulse integration — attendance data feeds into available hours; task completion feeds into performance review
- Accountability Meter — composite score per employee built from task completion rate, plan submission compliance, on-time rate, and billable hours
- Performance review data export — formal HR-ready report for review cycles
- Field worker support — mobile-first task experience for non-office employees
- Multi-language support — Bengali, Arabic, or other languages based on deployment needs
- Calendar integration — Google Calendar and Outlook sync for weekly plans
- API for external integrations — other tools can push/pull task data from Sunday

---

## 8. Open Questions

These are items that were not fully resolved during the product definition and must be decided before or during technical planning.

| # | Question | Why It Matters | Who Decides |
|---|----------|----------------|-------------|
| 1 | What is the maximum file size for task attachments? | Affects hosting and storage costs | Technical team |
| 2 | What is the available hours default for employees with non-standard hours (e.g. 6-hour shifts)? Can this be set per day rather than a blanket daily number? | 24/7 office with varied shift patterns — a flat 8 hours per day may not be accurate for all employees | Admin / HR |
| 3 | The user left item "11" blank at the end of the interview. Is there an additional feature, requirement, or concern that needs to be captured? | Unknown — may be significant | Product Owner |
| 4 | Should the quick task creation modal allow setting custom fields, or only fixed fields? Full custom field support in the modal adds complexity to a flow designed to be fast. | UX trade-off — speed vs completeness | Product Owner |
| 5 | What happens to a weekly plan if a task within it is deleted or archived by someone else mid-week? Does the plan automatically update, or does it show a broken reference? | Edge case but will happen — needs a defined behaviour | Technical + Product Owner |
| 6 | When Sunday eventually becomes a commercial product, what is the pricing model? Per seat? Per team? Flat fee? This does not affect v1 but shapes architectural decisions around multi-tenancy. | Affects how the system is architected for future scaling | Product Owner / Business |
| 7 | Is there a character limit or format requirement for completion reports? A one-word report ("done") defeats the purpose of accountability. Should the system enforce a minimum word count or require a structured format? | Core to the accountability purpose of the product | Product Owner |
| 8 | Can a Manager see an individual employee's Daily Check-in and EOD Wrap-up history, or only the weekly plan? | Affects how much daily visibility managers have vs weekly summary only | Product Owner |

---

## 9. Glossary

| Term | Plain-language Definition |
|------|--------------------------|
| **Task** | A single piece of work. Has an owner, a due date, and cannot be closed without a report. |
| **Assignee** | The person responsible for completing a task. |
| **Creator** | The person who created the task. May be the same as the assignee (self-assigned) or different (manager-assigned). |
| **Reviewer** | An optional third party who must approve a task before it can be marked complete. If a reviewer is set, they — and only they — can close the task. |
| **Task Timeline** | A permanent, read-only log of everything that ever happened to a task, in chronological order. Like a paper trail for a single piece of work. |
| **Planned Task** | A task that was scheduled in advance as part of a weekly plan. |
| **Ad Hoc Task** | A task that was not planned — it came up unexpectedly and had to be handled. |
| **Core Task** | Work that is central to the employee's role and directly drives the business forward (e.g. a sales executive closing a deal). |
| **Supporting Task** | Work that is necessary but secondary — administrative, maintenance, or operational tasks that support core work. |
| **Billable Task** | A task that generates revenue for the business. Only employees with billable permissions can create or log billable tasks. |
| **Weekly Plan** | An employee's declared intention for the week — which tasks they will work on, on which days, for how many hours. |
| **Daily Check-in** | A brief morning confirmation of what the employee is focusing on today. Pulled from their weekly plan. |
| **EOD Wrap-up** | An end-of-day summary of what was completed vs planned. Pre-filled by the system from task activity. |
| **Locked Mode** | A planning mode where the weekly plan is formally submitted by a deadline and cannot be changed without manager unlock. |
| **Fluid Mode** | A planning mode where the weekly plan is always visible and always editable — no formal submission required. |
| **Carry-over** | When a task is not completed on its planned day, it automatically moves to the next working day. The employee is notified. |
| **Capacity Grid** | A table showing each employee's planned hours vs available hours, by day. Green = well planned. Amber = under or over. Red = empty or severely overloaded. |
| **Utilisation** | A measure of how much of an employee's available time was actually used for logged work. |
| **Dependency** | A link between two tasks meaning one cannot start until the other is finished. |
| **Custom Field** | An additional data field that a Manager or Admin adds to tasks for a specific team or project. These sit on top of the standard fixed fields. |
| **Audit Trail** | A system-level log of all significant actions taken in Sunday — who changed what, when. Used for security and accountability reviews. |
| **Archiving** | Moving old completed tasks out of active views after a set period. Archived tasks are not deleted — they are still searchable and reportable. |
| **Firefighter** | Informal term for employees (typically in business systems or performance roles) who handle a high volume of unplanned, ad hoc tasks. Not a separate role in Sunday — handled through task type classification. |
| **WorkPulse** | The broader HR management platform being developed in parallel. Sunday is designed to integrate with WorkPulse in a future phase. |
| **Accountability Meter** | A planned future feature (Phase 3) that will generate a composite performance score per employee based on Sunday task data and WorkPulse HR data. |
