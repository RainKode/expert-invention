# Sunday — Product Guide

> **For stakeholders, leadership, and pilot users.**
> This document explains what Sunday does, how it works, and what every type of user experiences — from the moment the system is set up to daily use.

---

## What Is Sunday?

Sunday is a task and planning system built for one purpose: **making sure managers know what their team committed to, what they actually did, and whether their days are planned.**

Every piece of work is tracked from creation to completion. Every task requires a written report before it can be closed. Every employee plans their week. Every manager sees the full picture — in real time, with no chasing.

Sunday is not a generic project management tool. It is an **accountability and visibility system** designed for organisations that need to know, with certainty, that work is being done — and have proof when it is.

---

## Who Uses Sunday?

| Role | What They Do in Sunday |
|------|----------------------|
| **Employee** | Creates tasks, plans their week, checks in daily, wraps up each day, submits completion reports |
| **Senior Employee** | Same as Employee, plus can self-assign tasks without waiting for a manager |
| **Assistant Manager** | Oversees a sub-team — can assign tasks and view their sub-team's plans and capacity |
| **Manager** | Owns a team — assigns work, monitors output, reviews plans, approves task completions, exports reports |
| **Senior Manager** | Sees everything across multiple teams or an entire department |
| **Admin / HR** | Sets up the system — creates users, teams, departments. Manages settings. Views the full audit trail |

---

## The Complete Journey — Start to Finish

### Phase 0: First-Time Bootstrap (Creating the First Admin)

When Sunday is deployed for the first time, there are no users. The first person to access the system is routed to a **bootstrap page** at `/setup`:

1. The system checks if any admin account exists
2. If no admin exists, the bootstrap form is shown — enter name, email, and password
3. A password strength meter (4-segment) guides the admin to choose a strong password
4. Once submitted, the first admin account is created and the bootstrap page permanently locks itself
5. All subsequent users must be created by this admin through the normal user management flow

This ensures no default credentials and no external setup scripts are needed.

---

### Phase 1: System Setup (Admin)

Before anyone logs in, an Admin sets up the organisation. A **guided setup wizard** walks first-time admins through three steps with a progress bar:

**Step 1 — Create Departments** — e.g. "Engineering", "Sales", "Operations"  
**Step 2 — Create Teams** — e.g. "Backend Team" under Engineering, with department assignment  
**Step 3 — Add Employees** — create users directly from the setup flow (name, email, role, team). Each new user receives an invite email immediately. For bulk imports, a link to the full user management page is provided.

Once the wizard is complete, the admin can continue with detailed configuration:

1. **Assign Managers** — each team gets a manager; each department gets a senior manager
2. **Configure Team Settings** — for each team, decide:
   - **Planning Mode:** Locked (employees must submit plans by a deadline) or Fluid (plans are always open)
   - **Submission Deadline:** e.g. "Sunday 10:00pm" — when locked plans must be submitted
   - **Daily Check-in:** mandatory or optional for this team
   - **EOD Wrap-up:** mandatory or optional for this team
5. **Create User Accounts** — either one by one or via bulk CSV import. For each employee:
   - Name, email, role
   - Assigned team and reporting manager
   - Work week pattern (Sun–Thu, Mon–Fri, etc.)
   - Timezone
   - Billable permissions (can they log revenue-generating work?)
   - Available hours per day (default: 8, adjustable)
6. **System sends email invitations** automatically — each employee gets a branded email with a "Set Your Password" button linking to a secure token-based password setup page (tokens expire after 7 days; admins can resend invites at any time)

---

### Phase 2: Employee Onboarding (First Login)

When an employee clicks their invite link and sets their password, they experience a simple 3-step welcome:

1. **Welcome Screen** — "Hello [Name]. You've been added to [Team Name], reporting to [Manager Name]."
2. **Your Tasks** — Any tasks already assigned to them are shown immediately
3. **Set Up Your First Plan** — A prompt to plan their first week by dragging tasks into days

No tutorials. No demo data. No feature tours. Just their real work, ready to go.

---

### Phase 3: The Weekly Planning Cycle

This is the heartbeat of Sunday — a weekly rhythm that every employee follows.

#### Step 1: Plan the Week

At the start of each week (or before the team's submission deadline), the employee opens their **Weekly Plan**:

- They see a grid with their working days as columns (respecting their configured work week — Sun–Thu, Mon–Fri, etc.)
- All their unplanned tasks appear in a pool at the top
- They **drag tasks into days** and set how many hours each will take
- A **capacity bar** per day shows whether they're on track:
  - **Green** = 80–100% of available hours planned
  - **Amber** = under-planned or slightly over
  - **Red** = almost empty or severely overloaded

In **Locked Mode**, the employee submits the plan by the deadline. Once submitted, it's locked — only a manager can unlock it if changes are needed.

In **Fluid Mode**, the plan is always visible and always editable. No submission required.

#### Step 2: Daily Check-in (Morning)

Each morning, the employee opens the **Daily Check-in**:

- It's pre-populated from today's planned tasks
- The employee confirms what they're focusing on, adds any notes
- One tap to submit

This gives the manager a daily signal without a meeting.

#### Step 3: Do the Work

Throughout the day, the employee works on their tasks:

- Update task status: **To Do → In Progress → In Review → Done**
- Submit a **completion report** when finishing (mandatory — the system won't let a task close without one)
- If a reviewer is assigned, the task goes to them for approval before it's marked Done
- Log ad hoc work that wasn't planned — it's captured as an "Ad Hoc" task so unplanned work is still visible

#### Step 4: EOD Wrap-up (End of Day)

At the end of the day, the employee opens the **EOD Wrap-up**:

- It's **pre-filled** by the system from the day's task activity (no manual re-entry)
- Shows: what was planned vs what was actually done, with hours comparison
- The employee confirms, corrects any hours, adds notes
- **Discrepancies are flagged** automatically (e.g. "You planned 3 hours for this but logged 5")
- One click to submit

#### Step 5: Carry-over

Any task not completed today **automatically rolls to the next working day**. The employee gets a notification. Over time, this builds a visible record of what keeps slipping.

---

### Phase 4: What the Manager Sees

While employees plan and execute, managers have a real-time command centre.

#### Dashboard — My Overview
Every user (including managers) sees their personal view:
- Today's tasks
- Weekly completion rate (tasks done vs committed)
- Upcoming deadlines (next 3 days)
- Carry-overs from previous days

#### Team Pulse — The Management View
The primary screen for managers. Shows:

- **Capacity Grid** — every team member as a row, each day as a column. Cells show planned hours with colour coding. At a glance, the manager sees who is well-planned, who is overloaded, and who has empty days.
- **The Big Fat Warning** — if any employee has **zero tasks planned** for any day, a prominent, unmissable alert appears at the top. It cannot be hidden until the employee submits a plan or the manager acknowledges it.
- **Overdue Tasks** — all tasks past their due date, grouped by employee
- **Completion Rate** per employee for the current week

#### Workload View
A deeper look at utilisation:
- **Planned hours vs actual hours** per employee, per day
- Colour-coded cells show where reality diverged from the plan
- **Click any cell** to drill down to the specific tasks for that employee on that day (navigates to filtered task view)
- Cells show hover effects (ring highlight + subtle scale) to indicate interactivity

#### Activity Feed
A live stream of everything happening:
- "Ahmed completed Task X — 9:42am"
- "Sara added a subtask to Project Y — 11:15am"
- "Task Z is now overdue — assigned to Karim"
- "Nadia submitted her weekly plan — 8:55am"

Employees see activity for tasks they're involved in. Managers see all team activity.

---

### Phase 5: Task Lifecycle — From Creation to Completion

Every piece of work in Sunday follows this lifecycle:

```
Created → To Do → In Progress → In Review (optional) → Done
```

**Creating a Task:**
- Anyone can create a task for themselves
- Managers can assign tasks to their team members
- A **Quick Task button** is available on every screen — one click opens a creation modal
- Required: Title, Assignee, Due Date, Estimated Hours, Priority, Project, Task Type (Planned/Ad Hoc), Task Nature (Core/Supporting), Billable toggle

**Working on a Task:**
- Employee moves it to "In Progress" when they start (blocked if a dependency isn't finished yet)
- When done, they submit a **completion report** — a written note, a file attachment, or both
- This is non-negotiable. The system enforces it.

**Review Flow (if a Reviewer is assigned):**
- Task moves to "In Review" — the reviewer is notified
- Reviewer either **approves** (task → Done) or **sends back** with a reason (task → In Progress, assignee notified)
- Only the assigned reviewer (or a manager) can close the task

**No Reviewer?**
- The assignee marks it Done directly after submitting their completion report

**Reassignment:**
- Managers can reassign tasks to different team members
- The system records: who it was assigned to before, who it's assigned to now, who made the change, when, and why
- The original assignment is **never erased**

**Ad Hoc / Backdated Tasks:**
- For employees who handle unpredictable work (firefighters), a task can be created and marked complete in one step
- This captures work that was already done before there was time to plan

**Task Timeline:**
Every task carries a permanent, read-only timeline showing every event that ever happened to it — creation, status changes, reassignments, reviews, file uploads, completion reports. This is the audit trail for individual work items.

---

### Phase 6: The Kanban Board

An alternative view of tasks as a drag-and-drop board:

- **4 columns:** To Do → In Progress → In Review → Done
- Drag a card between columns to change its status (all rules still enforced — can't skip steps, can't close without a report)
- **Filter by:** assignee, project, priority, task type, billing status, custom fields
- **Save filter combinations** as named views (personal or shared with the team)
- Managers see all team tasks; employees see their own

---

### Phase 7: Reporting & Export

Managers and admins can generate reports on demand:

| Report | What It Shows | Formats |
|--------|--------------|---------|
| **Weekly Team Performance** | Tasks committed vs completed per employee, completion rate, planned vs actual hours, overdue count | PDF, CSV |
| **Individual Employee Report** | All tasks for a period with status, hours, on-time analysis | PDF, CSV |
| **Billable Hours Summary** | All revenue-generating tasks, who worked them, hours estimated vs actual | PDF, CSV |
| **System Activity Report** | All task activity across all teams (Admin only) | CSV |
| **Task Export** | Full data dump of all tasks with all fields including custom fields | CSV |

- All reports respect access scope — a manager can only pull data for their own team/department
- Date range is always selectable (default: current week)
- PDF reports are professionally formatted, not raw data dumps

---

### Phase 8: Notifications — Nothing Falls Through the Cracks

Sunday sends notifications through two channels:

**In-App Notifications (always on):**
- Task assigned to you
- Task reassigned away from you
- Task due today
- Task moved to review (for the reviewer)
- Task sent back by reviewer
- Dependency unblocked (you can now start a blocked task)
- Task carried over from a previous day (automatic daily check)

**In-App + Email (for urgent events):**
- Task is overdue → employee + their manager
- Weekly plan not submitted by deadline → employee + their manager
- An employee has zero tasks planned → their manager

**User-controllable notifications (can be turned off):**
- Task marked Done
- Someone comments on your plan
- Someone comments on a task you're involved in

A **notification panel** slides out from the top bar. Unread count badge is always visible.

**Real-Time Delivery:**
- Notifications appear instantly via Supabase Realtime (WebSocket subscriptions) — no page refresh needed
- The notification badge updates within seconds of a new notification being created
- A fallback poll (every 60 seconds) ensures delivery even if the WebSocket connection drops

**Email Notifications:**
- When a notification's channel is set to "both" (in-app + email), an email is automatically sent via Resend
- Emails use inline-styled templates with Sunday branding for maximum email client compatibility
- Email sending is non-blocking — if the email service is unavailable, in-app notifications still work

---

### Phase 9: Search & Custom Fields

**Global Search:**
- Available from any screen via the top bar (keyboard shortcut: Ctrl+K)
- Searches across task titles, project names, and people
- Results grouped by category with match highlighting

**Custom Fields:**
- Managers and admins can create additional fields beyond the standard ones
- **Field types:** Text, Number, Date, Dropdown (with custom options), Checkbox
- **Scope:** apply to all tasks, a specific team's tasks, or a specific project's tasks
- Custom fields appear in task creation, task detail, board filters, and CSV exports
- Archiving a field hides it from new tasks but preserves existing data

---

### Phase 10: File Attachments

- Attach files to tasks (as general attachments or as part of completion reports) and to EOD wrap-ups
- **Supported:** PDF, Word, Excel, Images (JPG/PNG), Video
- **In-app preview** for PDFs and images (no download required)
- Drag-and-drop upload
- Files are permanent — they stay even if a task is archived
- Every upload is logged in the task's timeline

---

### Phase 11: Admin Controls

**User Management:**
- Create, edit, deactivate, and reactivate user accounts
- Bulk import users via CSV
- When deactivating: all open tasks must be reassigned or closed first (a modal walks the admin through each one)

**Team & Department Structure:**
- Create and edit departments and teams
- Assign managers and senior managers
- Collapsible hierarchy view

**Audit Trail (Admin Only):**
- Every significant system action is logged: account changes, team changes, permission changes, report exports, deactivations
- Filterable by date, event type, and actor
- This is the compliance and security record

**System Settings (Admin Only):**
- Organisation name
- Default available hours per day
- Archive window (months before completed tasks move to archive)

---

### Phase 12: Archiving

- Tasks that have been marked Done for longer than the configured window (default: 6 months) are automatically archived
- Archived tasks are **removed from active views** but remain fully searchable and included in reports
- All attachments, timelines, and completion reports are preserved
- **Nothing is ever permanently deleted**

---

## What Makes Sunday Different

| Feature | Sunday | Typical Competitors |
|---------|--------|-------------------|
| **Completion reports mandatory** | Every task requires written evidence before closure. Enforced by the system. | Optional or non-existent |
| **Full task timeline** | Permanent, chronological log of every event on every task | Basic activity logs, often editable |
| **Planned vs Ad Hoc tracking** | Every task categorised — managers see the firefighting ratio over time | Not tracked |
| **Core vs Supporting classification** | Revenue work vs overhead, visible per employee | Not tracked |
| **Integrated planning loop** | Weekly plan → daily check-in → EOD wrap-up → carry-over. Built in, not bolted on | Separate tools or missing entirely |
| **Timezone-aware work weeks** | Each employee's schedule and deadlines respect their own timezone | Usually global settings only |
| **Big Fat Warning for unplanned days** | Prominent, unmissable manager alert when employees have empty days | Subtle badges or nothing |
| **HR integration roadmap** | Built to connect with WorkPulse for attendance, performance reviews, accountability scoring | Standalone with no HR path |

---

## The Two Questions Sunday Answers Every Day

1. **"Did my team do what they committed to?"**
   → Completion rates, overdue lists, task timelines, mandatory reports

2. **"Are their days actually planned?"**
   → Capacity grids, weekly plans, daily check-ins, big fat warnings

If the answer to either question is "no" — Sunday makes sure the manager knows immediately, and there is a record of what happened for when that matters later.

---

## Technical Summary

| | |
|---|---|
| **Platform** | Web application (desktop + mobile responsive) |
| **Access** | Browser-based — no app install required |
| **Authentication** | Email + password with secure invite flow, first-admin bootstrap, token-based password setup |
| **Data** | Hosted on Supabase (PostgreSQL) with row-level security |
| **Email** | Transactional emails via Resend (invite, notification) |
| **Real-Time** | Supabase Realtime (WebSocket) for instant notifications |
| **Scheduled Jobs** | Vercel Cron (daily notifications at 8am, weekly archiving at 2am Sunday) |
| **Error Handling** | Global error boundaries with branded recovery UI at every layout level |
| **Deployment** | Ready for Vercel or any Node.js hosting |
| **Language** | English (v1) |
| **Billing** | Internal tool — no per-seat cost for v1 |

---

## Pilot Deployment

- **Target:** All ventures under Magpie Nest Group (~50–60 office employees)
- **Rollout:** All ventures simultaneously
- **Excluded from v1:** Field workers, external contractors, multi-language, calendar integrations

---

## Future Roadmap (Post v1)

- **WorkPulse HR Integration** — attendance feeds into available hours; task completion feeds into performance reviews
- **Accountability Meter** — composite performance score per employee
- **Recurring Tasks** — for regular-cadence work
- **Workload Balancing** — system recommendations when someone is overloaded
- **Scheduled Reports** — auto-sent to managers weekly
- **Calendar Sync** — Google Calendar / Outlook integration for weekly plans
- **Multi-language Support** — Bengali, Arabic, and others based on deployment needs
- **Field Worker Support** — mobile-first task experience for non-office employees
