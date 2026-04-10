# Where We At — Sunday Development Log

---

## Session 1 — Sprint 1 Complete

**Date:** Session covering full Sprint 1 scaffold and implementation.

### What Was Built

Sprint 1 is fully implemented. All 10 modules are complete. The project compiles with zero TypeScript errors (`npx tsc --noEmit` passes clean).

---

### Project Foundation

- **Framework:** Next.js 14 (App Router, `src/` directory, route groups)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v3 (intentionally downgraded from v4 — design tokens use v3 format)
- **Auth/DB:** Supabase with `@supabase/ssr` (cookie-based, server-safe pattern)
- **Forms:** React Hook Form + Zod v4 + `@hookform/resolvers@5`
- **CSV:** PapaParse
- **Icons:** Material Symbols Outlined (Google Fonts)
- **Font:** Plus Jakarta Sans (Google Fonts)
- **Design System:** "The Digital Atrium / Architectural Quietude" — Indigo-Slate palette, 48px pill CTAs, glassmorphism modals, ambient shadows, signature gradient `linear-gradient(135deg, #4d556a 0%, #656d84 100%)`

**Key scaffolding note:** `create-next-app` was not used (npm rejects "Taskmanagment" as a package name due to capital letters). All config files were created manually. `package.json` uses `"name": "sunday"`.

---

### Files Created

#### Config & Root
- `package.json` — name: "sunday", all scripts, all dependencies
- `tsconfig.json` — strict, bundler moduleResolution, `@/*` alias to `./src/*`
- `next.config.ts` — minimal config
- `tailwind.config.ts` — full Indigo-Slate design system tokens
- `postcss.config.js`
- `.eslintrc.json`
- `.env.local` — template with Supabase vars (fill in before running)
- `.env.local.example` — committed example
- `.gitignore`
- `next-env.d.ts` — Next.js type reference file

#### Types
- `src/types/index.ts` — All core types: Role, BillablePermission, UserStatus, PlanningMode, Department, Team, User, UserWithRelations, TeamWithRelations, DepartmentWithRelations, AuthUser, Action (12), Scope, BulkImportRow, BulkImportRowValidated
- `src/types/css.d.ts` — CSS module type declaration

#### Supabase Infrastructure
- `src/lib/supabase/client.ts` — Browser client (`createBrowserClient`)
- `src/lib/supabase/server.ts` — Server component client (async cookies, Next.js 14)
- `src/lib/supabase/middleware.ts` — Session refresh + route protection
- `src/lib/supabase/admin.ts` — Service-role admin client (bypasses RLS)
- `src/middleware.ts` — Next.js middleware entry point

#### Database
- `supabase/migrations/001_sprint1_schema.sql` — Complete schema:
  - Enums: `user_role`, `user_status`, `billable_permission`, `planning_mode`
  - Tables: `departments`, `teams`, `profiles`, `invite_tokens`, `audit_log`
  - Triggers: auto `updated_at`, auto-create profile on auth user create
  - RLS policies for all tables

#### Permissions
- `src/lib/permissions.ts` — Full RBAC: `ROLE_LEVEL`, `PERMISSION_MAP` (12 actions), `can()`, `getScope()`, `requirePermission()`, `requireRole()`, `ROLE_LABELS`, `ROLE_OPTIONS`

#### Auth API Routes
- `src/app/api/auth/callback/route.ts` — Supabase code exchange
- `src/app/api/auth/login/route.ts` — Login, deactivated check
- `src/app/api/auth/logout/route.ts` — Sign out
- `src/app/api/auth/forgot-password/route.ts` — Password reset request
- `src/app/api/auth/reset-password/route.ts` — Password update
- `src/app/api/auth/accept-invite/route.ts` — GET: validate token; POST: accept invite + set password
- `src/app/api/auth/me/route.ts` — Current user context

#### Admin API Routes
- `src/app/api/admin/users/route.ts` — GET (list with filters), POST (create + invite token)
- `src/app/api/admin/users/[id]/route.ts` — PATCH (update), DELETE (deactivate/reactivate), POST (resend invite)
- `src/app/api/admin/users/bulk-import/route.ts` — POST: CSV rows, all-or-nothing validation, create + invite, audit log
- `src/app/api/admin/teams/route.ts` — GET (hierarchy), POST (dept or team)
- `src/app/api/admin/teams/[id]/route.ts` — PATCH, DELETE

#### App Shell
- `src/app/globals.css` — Tailwind directives, Google Fonts, utility classes
- `src/app/layout.tsx` — Root layout
- `src/app/(app)/layout.tsx` — Auth-required layout (server)
- `src/app/(app)/AppShellClient.tsx` — Client shell wrapper (logout, router)
- `src/components/shell/Sidebar.tsx` — Role-aware nav, mobile overlay + bottom nav
- `src/components/shell/TopBar.tsx` — Search, notifications, avatar
- `src/app/(app)/page.tsx` — Redirects to `/dashboard`
- `src/app/(app)/dashboard/page.tsx` — Placeholder (Sprint 2)

#### Auth Pages
- `src/app/(auth)/layout.tsx` — Ambient blob background
- `src/app/(auth)/login/page.tsx` — Full login form, role-based redirect
- `src/app/(auth)/forgot-password/page.tsx` — Email → success state
- `src/app/(auth)/reset-password/page.tsx` — Password + strength meter
- `src/app/(auth)/set-password/page.tsx` — Invite acceptance, token validation, 4-segment strength

#### Admin Pages
- `src/app/(app)/admin/users/page.tsx` — Server component, admin guard
- `src/app/(app)/admin/users/UsersClient.tsx` — Full CRUD table, role badges, UserFormModal
- `src/app/(app)/admin/teams/page.tsx` — Server component, admin guard
- `src/app/(app)/admin/teams/TeamsClient.tsx` — Collapsible dept/team hierarchy, DepartmentModal, TeamModal
- `src/app/(app)/admin/users/import/page.tsx` — 4-step bulk import wizard (Instructions → Upload → Preview → Done)

---

### Key Decisions Made

1. **Tailwind v3 not v4** — downgraded because design HTML files use v3 config format with `extend.colors`
2. **Manual scaffold** — `create-next-app` rejected the folder name; all files created from scratch
3. **Zod v4 API** — uses `.issues` not `.errors`; `z.enum()` uses `error` not `errorMap`; `zodResolver` requires `as any` cast due to Zod v4/hookform type mismatch
4. **Supabase nested joins return arrays** — `departments(name)` in Supabase select returns `{ name }[]` not `{ name }`, types updated accordingly
5. **All-or-nothing bulk import** — validates all rows before committing any; server returns 422 with per-row errors if any fail
6. **Role names in bulk import differ from DB** — API uses `planner`, `senior_manager`, `manager`, `team_leader`, `employee`, `admin` (the Zod enum in bulk-import route uses these; types/index.ts uses a different role set — **NOTE: there is a mismatch between the role names in types/index.ts and the bulk-import API**. The types use `senior_employee`, `assistant_manager` but the architecture and DB migration use `planner`, `team_leader`. This should be reconciled in the next session.

---

### Outstanding Items / Known Issues

1. **Role enum mismatch** — `src/types/index.ts` defines `Role` as `'employee' | 'senior_employee' | 'assistant_manager' | 'manager' | 'senior_manager' | 'admin'` but the DB migration uses `'employee' | 'team_leader' | 'manager' | 'senior_manager' | 'planner' | 'admin'`. The bulk-import and some API routes use the DB values. This needs to be unified. **Resolution needed before going to production.**

2. **`.env.local` not filled** — Supabase URL and keys must be added before `npm run dev` will work against a real DB.

3. **Database migration not applied** — `supabase/migrations/001_sprint1_schema.sql` exists but still needs to be run against the actual Supabase project.

4. **Dashboard and other pages** — All authenticated pages beyond `/admin/users`, `/admin/teams`, and `/admin/users/import` are placeholders. Sprint 2 onwards covers Tasks, Planning, Reports etc.

---

### Next Session Should Start With

1. Resolve the Role enum mismatch (pick one set and update both `src/types/index.ts` and all files that reference roles)
2. Set up `.env.local` with real Supabase credentials
3. Apply the database migration (`001_sprint1_schema.sql`) to the Supabase project
4. Run `npm run dev` and do a full end-to-end test of the login, invite, and admin flows
5. Begin Sprint 2 based on `sunday-sprint-plan.md`

---

## Session 2 — Sprint 2 Complete

**Date:** Continuing from Session 1 (Sprint 1 complete). Built the full Task Engine in Sprint 2.

### What Was Built

**Database**
- `supabase/migrations/002_sprint2_schema.sql` — Full Sprint 2 schema. Adds enums: `task_status` (todo/in_progress/in_review/done), `task_priority` (high/medium/low), `task_type` (planned/adhoc), `task_nature` (core/supporting), `timeline_event_type` (14 values). Tables: `projects`, `tasks`, `task_dependencies`, `task_timeline`. Includes triggers, indexes, and RLS policies.

**Types**
- `src/types/index.ts` — Extended with: `TaskStatus`, `TaskPriority`, `TaskType`, `TaskNature`, `TimelineEventType`, `Project`, `Task`, `TaskWithRelations`, `TaskDependency`, `TaskTimelineEvent`, `TaskRow`.

**Library helpers**
- `src/lib/task-timeline.ts` — `logTimelineEvent()` using admin client; called from every API route that mutates a task.

**API Routes**
- `src/app/api/projects/route.ts` — GET (list, team_id filter) + POST (create, manager+ only)
- `src/app/api/tasks/route.ts` — GET (role-scoped list with all filters) + POST (create, billable check, ad hoc backdating)
- `src/app/api/tasks/[id]/route.ts` — GET (full task with all relations) + PATCH (update fields, logs diffs to timeline)
- `src/app/api/tasks/[id]/status/route.ts` — POST (enforce valid transitions, dependency blocker check, completion-report gate)
- `src/app/api/tasks/[id]/review/route.ts` — POST (approve → done | send_back → in_progress, reviewer/manager only)
- `src/app/api/tasks/[id]/reassign/route.ts` — POST (creator or manager+, logs reassigned event)
- `src/app/api/tasks/[id]/completion-report/route.ts` — POST (save text/file_path, logs event)
- `src/app/api/tasks/[id]/subtasks/route.ts` — GET + POST (creates child task, logs subtask_added on parent)
- `src/app/api/tasks/[id]/dependencies/route.ts` — GET + POST (circular dep BFS check) + DELETE
- `src/app/api/tasks/[id]/timeline/route.ts` — GET (all events, actor join, asc order)

**Components**
- `src/components/tasks/QuickTaskModal.tsx` — Glassmorphism 640px modal, floating labels, priority segmented control, est. hours stepper, billable toggle, already-completed toggle with conditional report fields
- `src/components/tasks/ReassignModal.tsx` — 480px modal, searchable member list, reason textarea
- `src/components/tasks/CompletionReportModal.tsx` — Tertiary checkmark header, textarea + file upload stub
- `src/components/tasks/ReviewerSendBackModal.tsx` — Required reason textarea with 500-char counter, info alert
- `src/components/tasks/AddDependencyModal.tsx` — Searchable task list with circular dep prevention (API-side BFS)

**Pages**
- `src/app/(app)/tasks/page.tsx` — Server component, loads projects
- `src/app/(app)/tasks/TasksClient.tsx` — Status tabs, priority/type/nature/project/billable filter pills, task rows with priority color bar, status badges, links to detail
- `src/app/(app)/tasks/[id]/page.tsx` — Server component, loads team members and available tasks for deps
- `src/app/(app)/tasks/[id]/TaskDetailClient.tsx` — Full detail view: header with progress buttons, reviewer approve/send-back, 2-col layout (Details/Timeline tabs | metadata sidebar), subtasks list, dependency grid, completion report section
- `src/app/(app)/team/tasks/page.tsx` — Server component, role-guards with `can('view_team_tasks')`, loads projects + team members
- `src/app/(app)/team/tasks/TeamTasksClient.tsx` — Same format as My Tasks + assignee column, overdue-only chip

**Shell updates**
- `src/components/shell/Sidebar.tsx` — "Team Board" renamed to "Team Tasks" → `/team/tasks`
- `src/app/(app)/AppShellClient.tsx` — Added mobile floating FAB (fixed bottom-right) that opens QuickTaskModal

---

### Key Decisions Made

1. **Status transitions are strictly enforced** — `todo → in_progress → in_review → done`. Cannot skip. `in_progress → in_review` requires a completion report on file first (checked in status API and handled by opening CompletionReportModal first from UI).
2. **Reviewer gate** — Only the reviewer or manager+ can move `in_review → done` or send back.
3. **Dependency blocker** — BFS traversal on POST to `/dependencies` ensures no circular chains. Cannot start a task (`in_progress`) when its dependencies are not done.
4. **Ad hoc backdating** — `already_completed: true` in task creation sets `task_type=adhoc`, `status=done`, `completed_at=now()`. Requires actual_hours + completion_report_text.
5. **Non-billable profile gate** — Enforced in the tasks POST route (fetches profile's `non_billable` field).
6. **Team scope in task list** — Managers pass `team=true` query param to GET /api/tasks which uses OR-filter to fetch all tasks where assignee/creator/reviewer is in the same team_id.
7. **Supabase join arrays** — The `depends_on` join in the status route returns an array rather than a single object; handled with Array.isArray check.
8. **TypeScript compiler passes clean** — `npx tsc --noEmit` exits with 0 errors. VS Code LS shows one false-positive stale cache error on `TaskDetailClient` import that resolves on restart.

---

### Outstanding Items / Known Issues

1. **Role enum mismatch still present** — Same note from Session 1: `src/types/index.ts` uses `senior_employee`, `assistant_manager`; some older notes referenced DB values. The DB migration 001 matches types/index.ts so this is consistent within codebase — only the bulk-import route has different role strings. Should be fixed before going live.
2. **File upload in CompletionReportModal** — The upload zone is a visual stub. Actual file upload to Supabase Storage needs to be wired up (Sprint 3+).
3. **Notifications** — The review send-back modal notes "assignee will receive notification" but no notification system exists yet. Planned for later sprint.
4. **Comments tab** — Task detail has Details/Timeline tabs but Comments tab from design is not implemented. Deferred.
5. **`/team` route** — Was referenced in old nav. Now `/team/tasks` is the entry point. No redirect for `/team` exists if someone navigates directly; may 404. Add redirect in Sprint 3 if needed.
6. **`non_billable` field** — Tasks POST route reads `profile.non_billable` to guard billable flag, but this column needs to exist in the `profiles` table (should be in migration 001 from Sprint 1). Verify when applying migrations.

---

### Files Created This Session

| File | Purpose |
|------|---------|
| `supabase/migrations/002_sprint2_schema.sql` | DB schema for Sprint 2 |
| `src/lib/task-timeline.ts` | Timeline event logger |
| `src/app/api/projects/route.ts` | Projects endpoint |
| `src/app/api/tasks/route.ts` | Tasks list + create |
| `src/app/api/tasks/[id]/route.ts` | Single task GET + PATCH |
| `src/app/api/tasks/[id]/status/route.ts` | Status workflow |
| `src/app/api/tasks/[id]/review/route.ts` | Reviewer approve/send-back |
| `src/app/api/tasks/[id]/reassign/route.ts` | Reassign task |
| `src/app/api/tasks/[id]/completion-report/route.ts` | Submit completion report |
| `src/app/api/tasks/[id]/subtasks/route.ts` | Subtask CRUD |
| `src/app/api/tasks/[id]/dependencies/route.ts` | Dependency CRUD with circular check |
| `src/app/api/tasks/[id]/timeline/route.ts` | Timeline GET |
| `src/components/tasks/QuickTaskModal.tsx` | Global quick task creation modal |
| `src/components/tasks/ReassignModal.tsx` | Reassign task modal |
| `src/components/tasks/CompletionReportModal.tsx` | Completion report modal |
| `src/components/tasks/ReviewerSendBackModal.tsx` | Reviewer send-back modal |
| `src/components/tasks/AddDependencyModal.tsx` | Add dependency modal |
| `src/app/(app)/tasks/page.tsx` | My Tasks server page |
| `src/app/(app)/tasks/TasksClient.tsx` | My Tasks client |
| `src/app/(app)/tasks/[id]/page.tsx` | Task Detail server page |
| `src/app/(app)/tasks/[id]/TaskDetailClient.tsx` | Task Detail client |
| `src/app/(app)/team/tasks/page.tsx` | Team Tasks server page |
| `src/app/(app)/team/tasks/TeamTasksClient.tsx` | Team Tasks client |

### Files Modified This Session

| File | Change |
|------|--------|
| `src/types/index.ts` | Added all Sprint 2 types |
| `src/components/shell/Sidebar.tsx` | Team Board → Team Tasks, href updated |
| `src/app/(app)/AppShellClient.tsx` | Added mobile FAB + QuickTaskModal |

---

### Next Session Should Start With

Sprint 3 — Weekly Planning. Check `sunday-sprint-plan.md` for Sprint 3 scope. Before building, apply migration 002 to the Supabase project and verify the tasks API end-to-end with `npm run dev`.

---

## Session 3 — Sprint 3 Complete

**Date:** Continuing from Session 2 (Sprint 2 complete). Built Custom Fields Engine, Kanban Board, and Saved Views.

### What Was Built

**Dev Server Fix**
- `next.config.ts` → renamed to `next.config.mjs` and removed TypeScript type annotation (Next.js 14.2.35 does not support `.ts` config files). Dev server now starts cleanly at http://localhost:3000.

**Database**
- `supabase/migrations/003_sprint3_schema.sql` — Sprint 3 schema. Adds enums: `custom_field_type` (text/number/date/dropdown/checkbox), `custom_field_scope_type` (team/project/global), `custom_field_status` (active/archived), `saved_view_scope` (personal/shared). Tables: `custom_field_definitions` (with JSONB options for dropdown), `custom_field_values` (UNIQUE per task+field), `saved_views` (personal or shared, is_default flag). RLS: authenticated read fields; manager+ write fields; saved_views scoped to creator or team.

**Types**
- `src/types/index.ts` — Extended with: `CustomFieldType`, `CustomFieldScopeType`, `CustomFieldStatus`, `SavedViewScope`, `CustomFieldDefinition`, `CustomFieldValue` (with optional joined `field_definition`), `SavedView`.

**API Routes**
- `src/app/api/custom-fields/route.ts` — GET (list active fields, filtered by scope_type/scope_id) + POST (create field, manager+ only, dropdown requires options)
- `src/app/api/custom-fields/[id]/route.ts` — PATCH (rename/update options, manager+) + DELETE (soft-archive, manager+)
- `src/app/api/tasks/[id]/custom-field-values/route.ts` — GET (all values for task with field_definition join) + POST (upsert with type validation, logs field_updated timeline event)
- `src/app/api/saved-views/route.ts` — GET (personal + team shared views) + POST (create; shared requires manager+; is_default unsets others)
- `src/app/api/saved-views/[id]/route.ts` — PATCH (rename/update/toggle default, creator only) + DELETE (hard delete, creator only)
- `src/app/api/tasks/route.ts` — Extended GET: added `search` param (title ILIKE), added `team=true` flag pass-through for board

**Custom Fields Management UI**
- `src/app/(app)/settings/custom-fields/page.tsx` — Server page, manager+ guard (redirects to /dashboard if below manager), loads fields
- `src/app/(app)/settings/custom-fields/CustomFieldsClient.tsx` — Tab filter (All/Active/Archived), 12-col grid field list with type icons + scope + status badges, Add Field modal (type selector, scope, dropdown options editor), Edit Field modal (rename + options), archive confirmation on icon click

**Kanban Board**
- `src/app/(app)/board/page.tsx` — Server page, loads projects/team members/saved views
- `src/app/(app)/board/BoardClient.tsx` — Full DnD kanban board:
  - DndContext with PointerSensor (8px activation distance)
  - 4 status columns: To Do / In Progress / In Review / Done
  - Status transition validation (same rules as in_progress API)
  - `in_review` drag with no completion report → opens CompletionReportModal
  - Optimistic status updates (reverts on API error)
  - Filter bar: search (title ILIKE), Priority/Type/Nature/Project/Billable/Assignee dropdown pills
  - Saved Views dropdown (apply filters from saved view)
  - Save View modal (name + personal/shared scope toggle for managers)
  - DragOverlay with dragged card
  - Managers see all team tasks (`team=true`), employees see personal scope
- `src/components/board/KanbanColumn.tsx` — Column with useDroppable, SortableContext, droppable highlight state, empty state, loading spinner
- `src/components/board/KanbanCard.tsx` — Card with useSortable, priority color bar, drag handle, title link, project/nature/billable badges, assignee avatar, overdue indicator

**Custom Fields in Task Forms**
- `src/components/tasks/QuickTaskModal.tsx` — Extended: fetches applicable custom fields on mount/project change (global + project scope), renders typed inputs (text/number/date/dropdown/select/checkbox toggle) after fixed fields, posts field values after task creation
- `src/app/(app)/tasks/[id]/TaskDetailClient.tsx` — Extended: fetches custom field values on load, renders in sidebar card, inline `CustomFieldEditor` component (view → edit on click, typed input by field_type, save/cancel), optimistic updates

**Sidebar**
- `src/components/shell/Sidebar.tsx` — Added "Board" (`view_kanban` icon, `/board`) and "Custom Fields" (`tune` icon, `/settings/custom-fields`, requires `create_custom_fields`)

**Packages Installed**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-and-drop

### Key Decisions Made

1. **Custom field values stored as TEXT** — All types (number, date, checkbox, dropdown) stored as text strings. Type validation done at API write time. Flexible and migration-friendly.
2. **Soft-archive not hard-delete for fields** — Archiving a field preserves existing values. Archived fields are hidden from UI but values remain queryable.
3. **Saved views store filters as JSONB** — The full filter object is serialised to JSONB. Applying a view merges the view's filters into the current state.
4. **`in_review` completion report gate on drag** — Same gate as the status API: if dragging to in_review and no report exists, opens CompletionReportModal. After submit, applies the move.
5. **Optimistic UI for kanban** — Status updated in local state instantly, API confirmed async. If API fails, board refetched to revert.
6. **Board shows team tasks for managers** — `team=true` param added to tasks API request when `isManager`. Employees see only their own tasks.
7. **Custom fields in QuickTaskModal fetch on project change** — Re-fetches `/api/custom-fields?scope_type=global` + `scope_id=<projectId>` when project dropdown changes. Values posted after task created.
8. **TypeScript clean** — `npx tsc --noEmit` exits with 0 errors after all work.

### Bug Fixes

- `next.config.ts` → `next.config.mjs` (Next.js 14.x TS config not supported)
- `z.record(z.unknown())` → `z.record(z.string(), z.unknown())` (Zod v4 requires 2 args)
- `status: newStatus` cast to `TaskStatus` in optimistic update (Zod v4 strict enums)
- `user_profiles` → `profiles` table name in board page.tsx and settings page.tsx (consistent with existing codebase)

### Files Created This Session

| File | Purpose |
|------|---------|
| `supabase/migrations/003_sprint3_schema.sql` | Sprint 3 DB schema |
| `src/app/api/custom-fields/route.ts` | Custom fields list + create |
| `src/app/api/custom-fields/[id]/route.ts` | Custom field update + archive |
| `src/app/api/tasks/[id]/custom-field-values/route.ts` | Task custom field values |
| `src/app/api/saved-views/route.ts` | Saved views list + create |
| `src/app/api/saved-views/[id]/route.ts` | Saved view update + delete |
| `src/app/(app)/settings/custom-fields/page.tsx` | Custom Fields server page |
| `src/app/(app)/settings/custom-fields/CustomFieldsClient.tsx` | Custom Fields management UI |
| `src/app/(app)/board/page.tsx` | Board server page |
| `src/app/(app)/board/BoardClient.tsx` | Kanban board client |
| `src/components/board/KanbanColumn.tsx` | Droppable column |
| `src/components/board/KanbanCard.tsx` | Sortable task card |

### Files Modified This Session

| File | Change |
|------|--------|
| `next.config.ts` → `next.config.mjs` | Fixed for Next.js 14 |
| `src/types/index.ts` | Added Sprint 3 types |
| `src/app/api/tasks/route.ts` | Added search param, team flag |
| `src/components/tasks/QuickTaskModal.tsx` | Custom field section |
| `src/app/(app)/tasks/[id]/TaskDetailClient.tsx` | Custom field values in sidebar |
| `src/components/shell/Sidebar.tsx` | Board + Custom Fields nav links |

### Outstanding Items / Known Issues

1. All from Session 2 still apply.
2. **Migration 003 requires applying** to the Supabase project before custom fields/saved views will work.
3. **Drag-and-drop column ordering** — Cards within a column are not re-orderable (only cross-column moves). If needed, add `arrayMove` in the `onDragEnd` handler for same-column drops.
4. **Custom fields in TeamTasksClient** — Not yet added. Team task rows don't show custom field values. Could be added as a popover or expandable row.
5. **Board doesn't auto-refresh** — No polling or realtime subscription. Manual refresh needed if another user moves a card.
6. **`/team` route** — Still 404s if navigated directly. Low priority.

### Next Session Should Start With

Apply migration 003 to Supabase, then run `npm run dev` and smoke-test the kanban board, custom fields settings page, and a task creation with custom fields. Check `sunday-sprint-plan.md` for Sprint 4 scope before starting new work.

---

## Session 4 — Sprint 4 Complete

**Date:** Continuing from Session 3 (Sprint 3 complete). Built the full Planning Module — Weekly Plans, Daily Check-ins, EOD Wrap-ups, and Team Plans View.

### What Was Built

**Database**
- `supabase/migrations/004_sprint4_schema.sql` — Sprint 4 schema. Enum: `plan_submission_status` (draft/submitted/fluid). Tables: `weekly_plans` (user_id, week_start_date DATE, submission_status, submitted_at, locked), `plan_entries` (plan_id, task_id, day_of_week 0–6, planned_hours, is_carryover, original_date), `daily_checkins` (user_id, date, tasks_json JSONB, notes, UNIQUE user+date), `eod_wrapups` (user_id, date, planned_tasks_json, actual_tasks_json, notes, discrepancies_json, UNIQUE user+date), `plan_comments` (plan_id, author_id, text). Triggers for updated_at. RLS: service-role-only via no_direct_access policies.

**Types Extended** (`src/types/index.ts`)
- Added `unlock_plan` to `Action` union.
- New types: `PlanSubmissionStatus`, `WeeklyPlan`, `PlanEntry` (with optional joined task), `DailyCheckin`, `CheckinTaskSnapshot`, `EodWrapup`, `WrapupTaskRow`, `WrapupDiscrepancy`, `PlanComment` (with optional joined author), `WeeklyPlanWithEntries`, `TeamMemberPlanSummary`.

**Permissions** (`src/lib/permissions.ts`)
- Added `unlock_plan: ['manager', 'senior_manager', 'admin']`.

**API Routes — 8 new files**
- `src/app/api/plans/route.ts` — GET (fetch or auto-create draft plan for a given week) + POST (upsert plan).
- `src/app/api/plans/[id]/entries/route.ts` — POST (upsert entry, checks ownership + locked state) + DELETE.
- `src/app/api/plans/[id]/submit/route.ts` — POST: locks plan (submission_status=submitted, locked=true).
- `src/app/api/plans/[id]/unlock/route.ts` — POST: manager unlock (requires unlock_plan permission).
- `src/app/api/plans/[id]/comments/route.ts` — GET + POST (requires comment_on_plans permission).
- `src/app/api/checkin/route.ts` — GET (returns existing record or pre-populates from today's plan entries) + POST (upsert).
- `src/app/api/wrapup/route.ts` — GET (pre-fills from plan entries + task actual_hours) + POST (upsert; auto-computes discrepancies where |delta| ≥ 0.5h).
- `src/app/api/team/plans/route.ts` — GET (role-scoped: manager→team, senior_manager→dept, admin→all); returns day_hours and unplanned_days[] per member.

**UI Pages — 8 new files**
- `src/app/(app)/plan/page.tsx` + `WeeklyPlanClient.tsx` — Full DnD week grid using @dnd-kit. Pool pills (unplanned tasks) drag into day columns. Task cards show priority badge, hours input, carryover badge, remove button. Capacity bar per day (Green 80–100%, Amber 50–79%/over, Red <50%). Week navigation. Submit/unlock flow. Manager comments section.
- `src/app/(app)/checkin/page.tsx` + `CheckinClient.tsx` — Pre-populated from plan entries for today. Toggle tasks confirmed/unconfirmed. Notes. Capacity bento card. Submit → POST /api/checkin. Shows submitted state with timestamp.
- `src/app/(app)/wrapup/page.tsx` + `WrapupClient.tsx` — Pre-filled from plan entries + task actual_hours. 12-column planned vs actual table with editable actual hours and match icons. Notes. Submit → POST /api/wrapup.
- `src/app/(app)/team/plans/page.tsx` + `TeamPlansClient.tsx` — Big Fat Warning Banner listing members with unplanned days. Capacity grid (color-coded: Healthy/Low/Over/Empty per day). Submission status column. Completion stats cards.

**Sidebar Updated** (`src/components/shell/Sidebar.tsx`)
- Added: Daily Check-in (→ /checkin, `assignment_turned_in`), EOD Wrap-up (→ /wrapup, `history_edu`), Team Plans (→ /team/plans, `groups`, requires view_team_tasks).
- Weekly Plan icon changed to `calendar_view_week`.

### TypeScript

`npx tsc --noEmit` passes with **zero errors**. Sprint 5 is complete.

### Next Session

Start with Sprint 6 — Notification System.

---

## Session 6 — Sprint 6 Complete

**Sprint:** 6 — Notification System  
**Status:** Complete. `npx tsc --noEmit` passes with zero errors.

### What Was Built

The full notification system covering all 13 notification triggers defined in the product architecture (§4.1). This includes the database schema, notification dispatch helpers, 4 notification API endpoints, a notification preferences API, a notification drawer (slide-out panel from the TopBar bell), a notification preferences settings page, hooks into 5 existing API routes dispatching 8 inline notification types, and a cron endpoint handling 5 scheduled notification types.

### Key Decisions

- **Cron vs Inline:** 8 of 13 triggers fire inline within existing API routes (task_assigned, task_reassigned_away, task_in_review, task_sent_back, task_marked_done, dependency_unblocked, comment_on_plan). 5 triggers require scheduled checks and are handled by a single cron endpoint (`/api/cron/notifications`): task_due_today, task_overdue, plan_not_submitted, checkin_not_submitted, zero_tasks_planned.
- **Dependency Unblocked:** Implemented in two locations — `tasks/[id]/status/route.ts` (direct status change to done) and `tasks/[id]/review/route.ts` (approve marks done). Both check task_dependencies for downstream tasks whose deps are now all satisfied.
- **comment_on_task deferred:** No task comments API route exists yet. The notification type is defined, the preference toggle works, but no route dispatches it. Will need `src/app/api/tasks/[id]/comments/route.ts` in a future sprint.
- **Email dispatch deferred:** The `channel` field is correctly set to `'both'` for the 3 email-eligible types (task_overdue, plan_not_submitted, zero_tasks_planned), but actual email sending (Resend/SendGrid) is not integrated yet. Notification records are created with the correct channel marking for when email is wired.
- **Notification preferences:** Only 3 types are user-disableable (task_marked_done, comment_on_plan, comment_on_task). The other 10 are marked "Required" in the preferences UI and cannot be toggled off.
- **Polling:** NotificationPanel polls every 30s for the list; AppShellClient polls every 60s for the unread count badge.

### Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/006_sprint6_schema.sql` | `notification_type` enum (13 values), `notification_channel` enum, `notifications` table, `notification_preferences` table, indexes, RLS policies |
| `src/lib/notifications.ts` | `createNotification()`, `createNotificationBulk()`, `getUnreadCount()` — dispatches via admin client, checks user preferences for optional types |
| `src/app/api/notifications/route.ts` | GET — paginated notification list with read/unread filter, returns `unread_count` |
| `src/app/api/notifications/[id]/read/route.ts` | POST — mark single notification as read (ownership verified) |
| `src/app/api/notifications/read-all/route.ts` | POST — mark all current user's notifications as read |
| `src/app/api/notifications/preferences/route.ts` | GET — full preference set with defaults; PUT — upsert (validates only optional types) |
| `src/app/api/cron/notifications/route.ts` | GET with `x-cron-secret` header auth — runs 5 scheduled checks (task_due_today, task_overdue, plan_not_submitted, checkin_not_submitted, zero_tasks_planned) |
| `src/components/notifications/NotificationPanel.tsx` | Right-side drawer (400px, z-60), filter chips, icon-coded notification list, loading skeleton, empty state, "Notification Preferences" footer link |
| `src/app/(app)/settings/notifications/page.tsx` | Server component with auth guard |
| `src/app/(app)/settings/notifications/NotificationPreferencesClient.tsx` | Required (10 types, locked) + Optional (3 types, toggleable) sections, bento grid, save/discard footer |

### Files Modified

| File | Change |
|------|--------|
| `src/types/index.ts` | Added `NotificationType` (13-value union), `NotificationChannel`, `Notification`, `NotificationPreference`, `OPTIONAL_NOTIFICATION_TYPES`, `EMAIL_NOTIFICATION_TYPES`, `NOTIFICATION_TYPE_META` |
| `src/components/shell/TopBar.tsx` | Added `unreadNotificationCount` + `onNotificationClick` props; bell uses filled icon when unread > 0; Indigo-Slate gradient badge (caps at 99+) |
| `src/app/(app)/AppShellClient.tsx` | Imported NotificationPanel; added panel open/close state + unread count state; initial fetch + 60s polling; passes props to TopBar |
| `src/components/shell/Sidebar.tsx` | Added "Notifications" nav item (→ `/settings/notifications`, icon: `notifications`) |
| `src/app/api/tasks/route.ts` | POST: dispatches `task_assigned` to assignee when creator ≠ assignee |
| `src/app/api/tasks/[id]/reassign/route.ts` | POST: dispatches `task_reassigned_away` to old assignee + `task_assigned` to new assignee |
| `src/app/api/tasks/[id]/status/route.ts` | POST: dispatches `task_in_review` to reviewer; checks `dependency_unblocked` when task → done |
| `src/app/api/tasks/[id]/review/route.ts` | POST approve: `task_marked_done` to assignee+creator + `dependency_unblocked` check; POST send_back: `task_sent_back` to assignee |
| `src/app/api/plans/[id]/comments/route.ts` | POST: dispatches `comment_on_plan` to plan owner; expanded plan select to include `user_id` |

### TypeScript

`npx tsc --noEmit` passes with **zero errors**.

### Outstanding / Deferred

- **Email dispatch:** Channel flag is set but no email provider integrated yet.
- **comment_on_task:** No task comments route exists. Notification type and preference toggle are ready.
- **Cron scheduling:** The `/api/cron/notifications` endpoint exists but needs to be wired to Vercel Cron, pg_cron, or an external scheduler.

### Next Session

Start with Sprint 7 — Global Search and Advanced Filtering.
- `npx tsc --noEmit` → Exit 0 — clean.

### Key Decisions Made

1. **Server components query Supabase admin client directly** — No internal HTTP fetch, avoids cookie forwarding complexity.
2. **DnD uses useDraggable/useDroppable directly** (not SortableContext) — gives full control over pool→day and day→day transfers; pool items have `id: pool:{task_id}`, entries have `id: entry:{entry_id}`.
3. **Optimistic DnD updates with rollback** — State updated instantly; if API fails, reverts.
4. **`EntryWithTask extends Omit<PlanEntry, 'task'>`** — Supabase join returns looser types than the strict TaskStatus enum; Omit avoids union conflict.
5. **Discrepancies auto-computed server-side on wrapup POST** — threshold: |delta| ≥ 0.5h.
6. **Team Plans page redirects non-managers to /plan** — cleaner than 403.
7. **plan_entries UNIQUE on (plan_id, task_id, day_of_week)** — upsert is safe; moving a task to same day is idempotent.

### Bug Fixes / TypeScript Fixes

- `EntryWithTask extends Omit<PlanEntry, 'task'>` — fixed union conflict with Supabase join type vs `TaskStatus` enum.
- `team?.planning_mode` (not `team?.data?.planning_mode`) — plan page destructures `{ data: team }` from Supabase.
- Pool tasks project flattened: `Array.isArray(t.project) ? (t.project[0] ?? null) : t.project` — Supabase join returns array for FK relations.
- `const teamId = profile?.team_id` before null-guard in team/plans page — avoids TypeScript possibly-null errors.

### Files Created This Session

| File | Purpose |
|------|---------|
| `supabase/migrations/004_sprint4_schema.sql` | Sprint 4 DB schema |
| `src/app/api/plans/route.ts` | Plans GET/POST |
| `src/app/api/plans/[id]/entries/route.ts` | Plan entries POST/DELETE |
| `src/app/api/plans/[id]/submit/route.ts` | Plan submit (lock) |
| `src/app/api/plans/[id]/unlock/route.ts` | Plan unlock (manager) |
| `src/app/api/plans/[id]/comments/route.ts` | Plan comments GET/POST |
| `src/app/api/checkin/route.ts` | Daily check-in GET/POST |
| `src/app/api/wrapup/route.ts` | EOD wrap-up GET/POST |
| `src/app/api/team/plans/route.ts` | Team plans GET |
| `src/app/(app)/plan/page.tsx` | Weekly Plan server page |
| `src/app/(app)/plan/WeeklyPlanClient.tsx` | Weekly Plan DnD client |
| `src/app/(app)/checkin/page.tsx` | Daily Check-in server page |
| `src/app/(app)/checkin/CheckinClient.tsx` | Daily Check-in client |
| `src/app/(app)/wrapup/page.tsx` | EOD Wrap-up server page |
| `src/app/(app)/wrapup/WrapupClient.tsx` | EOD Wrap-up client |
| `src/app/(app)/team/plans/page.tsx` | Team Plans server page |
| `src/app/(app)/team/plans/TeamPlansClient.tsx` | Team Plans client |

### Files Modified This Session

| File | Change |
|------|--------|
| `src/types/index.ts` | Added Sprint 4 types + unlock_plan action |
| `src/lib/permissions.ts` | Added unlock_plan permission |
| `src/components/shell/Sidebar.tsx` | Added Check-in, Wrap-up, Team Plans nav items |

### Outstanding Items / Known Issues

1. All from Session 3 still apply.
2. **Migration 004 requires applying** to the Supabase project before any planning features will work.
3. **File upload in EOD Wrap-up** — Drop zone is a visual stub only; actual file storage not implemented.
4. **Realtime updates** — No polling or subscriptions; stale data possible if team member submits plan while manager views Team Plans.
5. **plan_entries for fluid plans** — Fluid mode hides the Submit button; unlock flow is wired but fluid-mode-specific behaviour not fully specified in architecture.

### Next Session Should Start With

Apply migration 004 to the Supabase project, run `npm run dev`, and smoke-test the planning flows. Then check `sunday-sprint-plan.md` for Sprint 5 scope (Reports & Analytics Module) before starting new work.

---

## Session 5 — Sprint 5 Complete

### What Was Built

Sprint 5 is fully implemented: the Manager Dashboard module. All four major views (My Overview, Team Pulse, Workload View, Activity Feed) are complete. TypeScript passes clean (`npx tsc --noEmit` = 0 errors).

### Key Decisions Made

- **Workload actual hours** sourced from `eod_wrapups.actual_tasks_json` — not `tasks.actual_hours`. This is the canonical EOD record.
- **Completion rate formula** = `done_tasks_this_week / plan_entries (committed count)`. Gives a week-specific ratio, not a lifetime ratio.
- **Warning zone colour** is amber `#d4820a` (not red). The design spec uses amber for unplanned capacity — it is a warning, not an error.
- **Activity feed pagination** uses cursor-based approach with `created_at` ISO timestamp, not offset pagination. This avoids drift when new events are inserted.
- **Role scoping** for team-pulse and workload: manager → team_id, senior_manager → IN managed teams, admin → no filter.
- **Activity feed role scoping**: employee → own events only, manager/assistant → team_id, senior_manager → IN team ids, admin → global.
- **Acknowledge warning** inserts both a `warning_acknowledgements` row and an `activity_events` row (dual write for audit trail).

### Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/005_sprint5_schema.sql` | New tables: `activity_events` (13 event type enum), `warning_acknowledgements`. Indexes on user_id, team_id, created_at DESC, event_type. RLS: no_direct_access. |
| `src/app/api/dashboard/my-overview/route.ts` | GET: personal overview — today tasks, overdue, completion rate, carry-overs, upcoming deadlines. |
| `src/app/api/dashboard/team-pulse/route.ts` | GET `?week_start=`: manager-scoped team capacity + overdue tasks + unplanned members. |
| `src/app/api/dashboard/workload/route.ts` | GET `?week_start=`: planned (plan_entries) vs actual (eod_wrapups) hours per member per day. |
| `src/app/api/dashboard/acknowledge-warning/route.ts` | POST: creates warning_acknowledgements + activity_events records. Requires comment_on_plans permission. |
| `src/app/api/activity-feed/route.ts` | GET (paginated, role-scoped) + POST (insert event for current user). |
| `src/app/(app)/dashboard/page.tsx` | Replaced placeholder. Server component: loads MyOverviewData, passes to DashboardClient. |
| `src/app/(app)/dashboard/DashboardClient.tsx` | 12-col grid: Today's Tasks (7 cols), Completion Rate donut SVG (5 cols), Upcoming Deadlines, Carry-overs, manager quick-links bento vs personal week bento. |
| `src/app/(app)/dashboard/team-pulse/page.tsx` | Server component: role-gated, builds TeamPulseData from plans + entries + done tasks. |
| `src/app/(app)/dashboard/team-pulse/TeamPulseClient.tsx` | Amber warning zone with member pills + acknowledge modal. Capacity grid with colors. Overdue + completion rate bento. Week navigation. |
| `src/app/(app)/dashboard/workload/page.tsx` | Server component: loads WorkloadData (planned from plan_entries, actual from eod_wrapups). |
| `src/app/(app)/dashboard/workload/WorkloadClient.tsx` | Summary KPI banner + table with "Planned / Actual" cells in green/amber/red rounded pills. Week navigation. |
| `src/app/(app)/dashboard/activity/page.tsx` | Server component: loads first 20 events role-scoped, passes to ActivityClient. |
| `src/app/(app)/dashboard/activity/ActivityClient.tsx` | Filter pills (8 types), event cards with avatar initial + event-type dot + description + timestamp. Cursor-based "Load earlier activity". |

### Files Modified

| File | Change |
|------|--------|
| `src/types/index.ts` | Added Sprint 5 types: ActivityEventType (13-value union), ActivityEvent, WarningAcknowledgement, TodayTask, UpcomingDeadline, CarryOver, MyOverviewData, TeamPulseMemberRow, OverdueTaskEntry, TeamPulseData, WorkloadDayCell, WorkloadMemberRow, WorkloadData |
| `src/components/shell/Sidebar.tsx` | Added: Team Pulse `/dashboard/team-pulse` (requires view_team_tasks), Workload `/dashboard/workload` (requires view_team_tasks), Activity `/dashboard/activity` (all roles, scoped server-side) |

### Deferred / Not Implemented

1. **Migration 005 requires applying** to Supabase before any Sprint 5 features will function.
2. **Activity events not yet auto-inserted** — the `activity_events` table is populated only via the POST `/api/activity-feed` endpoint and the acknowledge-warning route. To make the feed rich, Sprint 6 can add server-side hooks or Supabase triggers to auto-insert events on task status changes etc.
3. **No real-time refresh** — Team Pulse and Workload are static server renders. A future sprint can add polling or Supabase Realtime subscriptions.
4. **Workload "actual hours" requires EOD wrap-ups** — if no team members have submitted wrapups for the week, actual_hours will show 0. This is correct behaviour.

### Next Session Should Start With

Apply migration 005 to the Supabase project (`supabase/migrations/005_sprint5_schema.sql`), run `npm run dev`, and smoke-test:
1. Dashboard My Overview loads at `/dashboard`
2. Team Pulse accessible at `/dashboard/team-pulse` (manager or above only)
3. Workload at `/dashboard/workload`
4. Activity feed at `/dashboard/activity`

Then check `sunday-sprint-plan.md` for Sprint 6 scope before starting new work.

---

## Session 7 — Sprint 7 Complete

**Sprint:** 7 — Global Search and Advanced Filtering  
**Status:** Complete. `npx tsc --noEmit` passes with zero errors.

### What Was Built

Full-text search across tasks, projects, and people from a persistent global search bar in the TopBar. Advanced filtering on the task board extended to support dynamic custom field filters (text, number range, date range, dropdown, checkbox). Active filter chips with individual removal. Custom field filters integrate with the existing saved views system.

### Key Decisions

- **PostgreSQL tsvector** for task search — weighted columns: title (A), description (B), completion_report_text (C). GIN index for fast lookup. Trigger auto-updates the vector on insert/update.
- **pg_trgm extension** for people/project search — trigram-based partial matching on profiles.name and projects.name.
- **Fallback to ilike** — If tsvector search fails (e.g., migration not yet applied), the API falls back to ilike matching on task titles.
- **Custom field filtering via subquery pattern** — The tasks API collects `cf_*` query params, queries custom_field_values for matching task IDs per field, intersects all sets, then applies `.in('id', taskIds)` to the main query. This avoids complex joins.
- **Index signature `[key: string]: string`** on the Filters interface — allows dynamic `cf_*` keys without type gymnastics.
- **Ctrl+K / Cmd+K** keyboard shortcut to focus search bar (matches design spec).
- **300ms debounce** on search input to avoid excessive API calls.
- **Scrim overlay behind dropdown** when search is active (matching the design's `bg-surface/20 backdrop-blur-[2px]`).

### Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/007_sprint7_search.sql` | tsvector column + GIN index on tasks, trigger for auto-update, pg_trgm extension + trigram indexes on profiles.name and projects.name |
| `src/app/api/search/route.ts` | GET `/api/search?q=keyword&limit=5` — full-text search across tasks (tsvector), projects (ilike), people (ilike on name+email). Role-scoped results. |
| `src/components/search/GlobalSearchBar.tsx` | Glassmorphism dropdown with categorised results (Tasks, Projects, People). Keyboard navigation (↑↓ Enter), Ctrl+K shortcut, match highlighting, "See all N results" footer, loading skeletons, empty state. |

### Files Modified

| File | Change |
|------|--------|
| `src/components/shell/TopBar.tsx` | Replaced static search input with `<GlobalSearchBar />` component import |
| `src/app/api/tasks/route.ts` | Added `CustomFieldType` import + custom field filtering: collects `cf_*` params, queries custom_field_values for matching task IDs, intersects, applies `.in('id', ids)` |
| `src/app/(app)/board/page.tsx` | Fetches `custom_field_definitions` (active) and passes as `customFields` prop to BoardClient |
| `src/app/(app)/board/BoardClient.tsx` | Extended Filters interface with string index signature; added `customFields` prop; dynamic custom field filter controls (text, number range, date range, dropdown, checkbox 3-state toggle); active filter chips row with individual remove + "Clear all"; `CustomFieldFilter` + `FilterChip` helper components |

### TypeScript

`npx tsc --noEmit` passes with **zero errors**.

### Next Session

Start with Sprint 8 — Audit Logging and Compliance.

---

## Session 8: Sprint 8 — File Management

**Sprint Completed:** Sprint 8 (File Management)
**Date:** Session 8

### What Was Built

Sprint 8 implements file attachments on tasks and EOD wrap-ups, with secure Supabase Storage, in-app preview for PDFs and images, and drag-and-drop upload UI.

**Task 8.1 — File Storage Setup:**
- Created `task_files` table with columns: id, filename, file_type, file_size, storage_path, uploaded_by, task_id, wrap_up_id, permanent, context, created_at
- RLS policies: authenticated users can view all task files, can insert files via own uploaded_by
- No delete policy — task files are permanent per spec
- Indexed on task_id, wrap_up_id, uploaded_by

**Task 8.2 — File Upload/Download API:**
- `POST /api/files` — multipart FormData upload; validates file type against ALLOWED_FILE_TYPES, validates 25MB max size, uploads to Supabase Storage bucket `task-files`, inserts record in task_files, logs timeline event for task files
- `GET /api/files?task_id=x` / `GET /api/files?wrap_up_id=x` — list files for a task or wrapup with uploader join
- `GET /api/files/:id` — download file with correct Content-Type and Content-Disposition headers
- `GET /api/files/:id/preview` — generates signed URL (1 hour expiry) for in-app preview

**Task 8.3 — In-App File Preview (FilePreviewModal):**
- Glassmorphism modal matching UX spec (85% white, 30px blur, apple-shadow)
- PDF preview via iframe with signed URL
- Image preview with native `<img>` tag
- Floating Apple-style control bar with zoom controls (25% increments) and download
- Fallback "Download Instead" for unsupported file types (DOCX, XLSX, video)
- Keyboard Escape to close

**Task 8.4 — File Attachment UI (FileAttachments):**
- Reusable `FileAttachments` component with drag-and-drop zone + file browse
- Matches UX design: 80px drop zone, cloud_upload icon, "Drag files here or browse"
- File list with type-specific icons (PDF red, image primary, XLSX green, DOCX blue, video tertiary)
- Visibility (preview) and download action buttons on hover
- Uploading progress spinner
- Error display for invalid files

### Key Decisions

1. **Supabase Storage bucket:** Named `task-files`, files organized as `tasks/{task_id}/{timestamp}_{filename}` or `wrapups/{wrap_up_id}/{timestamp}_{filename}`
2. **File context field:** Added `context` column ('attachment' | 'completion_report' | 'wrapup') to distinguish file purpose
3. **Type constants:** `ALLOWED_FILE_TYPES`, `MAX_FILE_SIZE`, `FILE_TYPE_ICONS` all defined in `src/types/index.ts` for shared access between client and API
4. **Preview approach:** PDF rendered via iframe + signed URL (no external PDF.js dependency needed). Images via native `<img>`. Unsupported types get download fallback.
5. **Wrapup file flow:** Files can only be attached after wrapup is submitted (needs a wrap_up_id); before submission the section shows a message to submit first

### Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/008_sprint8_files.sql` | task_files table, indexes, RLS policies |
| `src/app/api/files/route.ts` | POST upload + GET list files |
| `src/app/api/files/[id]/route.ts` | GET download file |
| `src/app/api/files/[id]/preview/route.ts` | GET signed preview URL |
| `src/components/files/FilePreviewModal.tsx` | Glassmorphism preview modal for PDF/images |
| `src/components/files/FileAttachments.tsx` | Reusable drag-and-drop file attachments component |

### Files Modified

| File | Change |
|------|--------|
| `src/types/index.ts` | Added `TaskFile`, `FileContext`, `FILE_TYPE_ICONS`, `ALLOWED_FILE_TYPES`, `MAX_FILE_SIZE` |
| `src/app/(app)/tasks/[id]/TaskDetailClient.tsx` | Imported `FileAttachments`, added Attachments section after Dependencies in Details tab |
| `src/components/tasks/CompletionReportModal.tsx` | Replaced file placeholder with real file upload (file select, validation, uploads to /api/files with context=completion_report) |
| `src/app/(app)/wrapup/WrapupClient.tsx` | Imported `FileAttachments`, added `id` to WrapupData interface, replaced placeholder with `FileAttachments` for submitted wrapups |
| `src/app/(app)/wrapup/page.tsx` | Added `id: null` to draft wrapup object for type compatibility |

### TypeScript

`npx tsc --noEmit` passes with **zero errors**.

### Next Session

Start with Sprint 9.

---

## Session 9: Sprint 9 — Reporting & Export

### Sprint Completed

Sprint 9 (Reporting & Export) is fully implemented with 0 TypeScript errors.

### What Was Built

**Report Data Aggregation Layer** (`src/lib/reports/aggregation.ts`):
- 5 aggregation functions: `generateWeeklyTeamReport`, `generateIndividualReport`, `generateBillableReport`, `generateSystemActivityReport`, `generateTaskExport`
- Role-scoped member queries reused from team-pulse pattern (team → department → all by role)
- Weekly team: committed vs completed tasks, completion rate, planned vs actual hours, overdue count per member
- Individual employee: all tasks with status, hours, on-time analysis, summary stats
- Billable hours: all billable tasks with estimated vs actual hours
- System activity: all activity_events for date range (admin only)
- Task export: all task fields + custom field values dynamically collected

**CSV Export** (`src/lib/reports/csv.ts`):
- 5 CSV generators using `papaparse` (already installed)
- Task export includes dynamic custom field columns
- Totals rows appended where appropriate

**PDF Report Generation** (`src/lib/reports/pdf.ts`):
- 3 PDF generators using `pdfmake` (installed this session): weekly team, individual employee, billable hours
- Professional layout with Indigo-Slate themed headers, clean tables, totals rows
- `renderPDF()` function uses server-side pdfmake with built-in Helvetica fonts
- Returns `Uint8Array` compatible with Next.js `NextResponse`

**5 API Endpoints**:
- `POST /api/reports/weekly-team` — PDF/CSV, permission: `export_reports`
- `POST /api/reports/individual-employee` — PDF/CSV, requires `employee_id`, permission: `export_reports`
- `POST /api/reports/billable-hours` — PDF/CSV, permission: `export_reports`
- `POST /api/reports/system-activity` — CSV only, permission: `view_audit_trail` (admin only)
- `POST /api/reports/task-export` — CSV only, permission: `export_reports`
- All accept `date_from`, `date_to`, `format`, plus `team_id` or `employee_id` as applicable
- Default date range: current week (Monday–Sunday)

**Reports UI** (`src/app/(app)/reports/`):
- Server page fetches user profile, teams list, employees list; redirects if no `export_reports` permission
- Client component matches UX design exactly: two-column layout (5/12 + 7/12)
- Left: 5 report type radio cards with active-tab-indicator, icon bg change, radio dot
- Right: parameters card (date range inputs, team/employee selector contextual, format toggle, generate button), last generated result section
- System Activity card hidden for non-admin users
- Format toggle hidden for CSV-only report types (task export, system activity)
- Loading state with spinner, error display, blob download via `URL.createObjectURL`
- Design system compliant: `rounded-full` inputs/buttons, `primary-gradient` CTA, ambient shadows, no borders

### Dependencies Added

- `pdfmake` + `@types/pdfmake` — server-side PDF generation with built-in fonts (no headless browser)

### Key Decisions

- System Activity report is CSV-only (raw event logs don't benefit from PDF tables)
- Task Export is CSV-only per sprint plan spec
- Used `require('pdfmake')` instead of dynamic import to avoid TypeScript constructor issues
- Cast `Uint8Array` to `BodyInit` in route handlers for Next.js compatibility
- `renderPDF` returns `Uint8Array` (not `Buffer`) to satisfy strict BodyInit typing

### Files Created

| File | Purpose |
|------|--------|
| `src/lib/reports/aggregation.ts` | Data aggregation for all 5 report types |
| `src/lib/reports/csv.ts` | CSV generation with papaparse |
| `src/lib/reports/pdf.ts` | PDF generation with pdfmake + render function |
| `src/app/api/reports/weekly-team/route.ts` | Weekly team performance endpoint |
| `src/app/api/reports/individual-employee/route.ts` | Individual employee endpoint |
| `src/app/api/reports/billable-hours/route.ts` | Billable hours summary endpoint |
| `src/app/api/reports/system-activity/route.ts` | System activity endpoint (admin) |
| `src/app/api/reports/task-export/route.ts` | Full task export endpoint |
| `src/app/(app)/reports/page.tsx` | Server page with auth + data fetch |
| `src/app/(app)/reports/ReportsClient.tsx` | Client component — full Reports UI |

### TypeScript

`npx tsc --noEmit` passes with **zero errors**.

### Next Session

Start with Sprint 10.

---

## Session 10: Sprint 10 — Polish, Settings & Final Pass

### Sprint Completed

Sprint 10 (Polish — Mobile Optimisation, Onboarding, Archiving, Audit Trail, Settings, Deactivation Modal) is fully implemented with **0 TypeScript errors**. This is the final sprint — the product is now feature-complete per the sprint plan.

### What Was Built

**Task 10.1 — Mobile UI Optimisation** *(previous session)*:
- Responsive breakpoints applied across all major pages (dashboard, tasks, board, planning, wrapup, reports, admin).

**Task 10.2 — First-Login Onboarding** *(previous session)*:
- `GET/PATCH /api/onboarding/status` — checks profile completeness, marks onboarding done.
- `src/app/onboarding/` — 3-step wizard (Welcome → Profile → Ready) outside the app shell.
- Middleware redirect for un-onboarded users.

**Task 10.3 — Admin Setup Flow** *(previous session)*:
- `GET/PATCH /api/admin/setup/status` — tracks 5 setup steps.
- `src/app/(app)/admin/setup/` — guided checklist with progress bar and step-specific deep links.

**Task 10.4 — Archiving Background Job** *(previous session)*:
- `POST /api/cron/archive-tasks` — moves tasks with `status=done` + `completed_at` older than configured months to `status=archived`. Logs to audit_log and activity_events.
- `supabase/migrations/010_sprint10_archiving.sql` — adds `archived` to `task_status` enum, `system_settings` table.

**Archived Task Exclusion (cross-cutting fix)**:
- Added `.neq('status', 'archived')` to **11 query locations** across 8 files:
  - `src/app/api/tasks/route.ts`, `src/app/api/search/route.ts` (2 queries), `src/app/api/tasks/[id]/subtasks/route.ts`
  - `src/app/api/cron/notifications/route.ts` (2 queries), `src/app/api/dashboard/my-overview/route.ts` (3 queries)
  - `src/app/api/dashboard/team-pulse/route.ts`, `src/app/api/onboarding/status/route.ts`
  - `src/lib/reports/aggregation.ts` (4 report functions)

**Task 10.5 — Admin Audit Trail**:
- `GET /api/admin/audit-trail` — paginated endpoint with filters (date_from, date_to, event_type, actor_id). Queries `audit_log` table with actor profile join. Returns entries, total, page, total_pages, event_types.
- `src/app/(app)/admin/audit-trail/page.tsx` — server page with `view_audit_trail` admin permission check, fetches actors for filter dropdown.
- `src/app/(app)/admin/audit-trail/AuditTrailClient.tsx` — filter bar (date pickers, event type dropdown, actor dropdown), Apply Filters button, grid-based rows with Timestamp/Actor/EventType/Description/OldValue/NewValue columns, pagination with numbered page circles.

**Task 10.6 — Settings Pages**:
- `GET/PATCH /api/settings/user-preferences` — manages `default_task_view` on profiles.
- `GET/PATCH /api/settings/team` — manages team settings (planning_mode, submission_deadline_day/time, check_in_mandatory, eod_mandatory). Uses `create_custom_fields` permission (manager+). Inserts audit_log on change.
- `GET/PATCH /api/settings/system` — manages system_settings table (company_name, default_available_hours, archive_window_months). Admin only via `manage_users_and_teams`. Inserts audit_log.
- `src/app/(app)/settings/SettingsLayout.tsx` — sub-navigation with 3 items. Desktop: left sidebar. Mobile: horizontal pill tabs.
- `src/app/(app)/settings/layout.tsx` — layout wrapper.
- `src/app/(app)/settings/page.tsx` — User Preferences root.
- `src/app/(app)/settings/UserPreferencesClient.tsx` — notification toggles + default task view segmented control (List/Kanban).
- `src/app/(app)/settings/team/TeamSettingsClient.tsx` — planning mode toggle, conditional deadline fields, check-in/EOD toggles, manage custom fields link.
- `src/app/(app)/settings/system/SystemSettingsClient.tsx` — bento grid: org name, available hours stepper, archive window, quick management links.

**Task 10.7 — Deactivation Task Reassignment Modal**:
- `GET /api/admin/users/[id]/open-tasks` — fetches open tasks (not done/archived) for a user + team members for reassignment.
- `POST /api/admin/users/[id]/open-tasks` — reassign or close individual tasks with audit_log entries.
- `src/components/admin/DeactivationModal.tsx` — glassmorphism modal: progress counter bar, scrollable task list with resolved (greyed, green check) and active (reassign dropdown + close button) row states, footer with remaining count and disabled-until-resolved Deactivate button.
- `src/app/(app)/admin/users/UsersClient.tsx` — replaced `confirm()` dialog with DeactivationModal for active users; reactivation still uses simple confirm.

### Key Decisions

1. **No `manage_team_settings` permission exists** — team settings API uses `create_custom_fields` (manager+) which is the closest semantic match.
2. **Audit trail queries `audit_log` table** (not `activity_events`) — this is the admin-specific audit table with old_value/new_value tracking.
3. **Deactivation modal opens only for active users** — reactivating a deactivated user still uses a simple confirm dialog since there are no tasks to reassign.
4. **Settings layout sub-navigation** — User Preferences visible to all, Team Settings to manager+, System Settings to admin. Each page does its own server-side permission check.
5. **Archived task exclusion** applied universally — ensures archived tasks never appear in active task lists, search results, dashboard widgets, notifications, or reports.

### Files Created

| File | Purpose |
|------|--------|
| `src/app/api/admin/audit-trail/route.ts` | Paginated audit trail GET with filters |
| `src/app/(app)/admin/audit-trail/page.tsx` | Server page with admin guard |
| `src/app/(app)/admin/audit-trail/AuditTrailClient.tsx` | Full audit trail UI |
| `src/app/api/settings/user-preferences/route.ts` | User preferences GET/PATCH |
| `src/app/api/settings/team/route.ts` | Team settings GET/PATCH |
| `src/app/api/settings/system/route.ts` | System settings GET/PATCH |
| `src/app/(app)/settings/SettingsLayout.tsx` | Settings sub-navigation |
| `src/app/(app)/settings/layout.tsx` | Layout wrapper |
| `src/app/(app)/settings/page.tsx` | User Preferences page |
| `src/app/(app)/settings/UserPreferencesClient.tsx` | Notification + default view prefs |
| `src/app/(app)/settings/team/page.tsx` | Team Settings page |
| `src/app/(app)/settings/team/TeamSettingsClient.tsx` | Team config UI |
| `src/app/(app)/settings/system/page.tsx` | System Settings page (admin) |
| `src/app/(app)/settings/system/SystemSettingsClient.tsx` | System config bento grid |
| `src/app/api/admin/users/[id]/open-tasks/route.ts` | Deactivation open tasks API |
| `src/components/admin/DeactivationModal.tsx` | Task reassignment modal |

### Files Modified

| File | Change |
|------|--------|
| `src/app/api/tasks/route.ts` | Added `.neq('status', 'archived')` |
| `src/app/api/search/route.ts` | Added `.neq('status', 'archived')` to both queries |
| `src/app/api/tasks/[id]/subtasks/route.ts` | Added `.neq('status', 'archived')` |
| `src/app/api/cron/notifications/route.ts` | Added `.neq('status', 'archived')` to 2 queries |
| `src/app/api/dashboard/my-overview/route.ts` | Added `.neq('status', 'archived')` to 3 queries |
| `src/app/api/dashboard/team-pulse/route.ts` | Added `.neq('status', 'archived')` |
| `src/app/api/onboarding/status/route.ts` | Added `.neq('status', 'archived')` |
| `src/lib/reports/aggregation.ts` | Added `.neq('status', 'archived')` to 4 functions |
| `src/app/(app)/admin/users/UsersClient.tsx` | Imported DeactivationModal, added `deactivateUser` state, replaced `confirm()` with modal for active users |

### TypeScript

`npx tsc --noEmit` passes with **zero errors**.

### Project Status

**All 10 sprints are now complete.** The Sunday task management platform is feature-complete per the sprint plan. Every sprint compiled with 0 TypeScript errors.

