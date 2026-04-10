# Stitch Prompts — Sprint 10 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 10 Dependency:** All previous sprints complete. This is the polish and completion pass — onboarding, settings, audit trail, archiving, the deactivation reassignment flow, and a full mobile refinement pass across every screen.

---

## SETTINGS ARCHITECTURE — SHARED SUB-NAV

---

**🎨 Stitch Prompt — Settings Layout: Sub-Navigation — Sunday**

```
Design the Settings layout and sub-navigation for Sunday. All settings screens share this structure.

Full app shell (sidebar + top bar). The settings area is a nested layout within the main content area.

Settings sub-nav (left side of settings content area, fixed width 240px):
- Background: surface_container_low fill. No border on the right edge — a tonal shift against the main content area (surface_container_lowest #ffffff) creates the boundary.
- Top of sub-nav: "Settings" in label-sm Plus Jakarta Sans Medium, on_surface_variant — a section label, not a link.
- Nav items (below the label, 4px vertical gap):
  - "User Preferences" — visible to all roles.
  - "Team Settings" — visible to Manager and above only.
  - "System Settings" — visible to Admin only.
  - "Custom Fields" (links to /settings/custom-fields from Sprint 3) — visible to Manager and above.
  - "Projects" (links to /settings/projects from Sprint 2) — visible to Manager and above.
- Each item: label-md on_surface_variant, 12px horizontal padding, 36px height, 8px radius. Hover: surface_container_high tonal shift. Active/selected: Indigo-Slate soft tonal background (#4d556a at 8% opacity), on_surface text, 3px Indigo-Slate left strip. No borders.
- Role-restricted items are not rendered at all (not greyed out) for users without access — consistent with Sprint 1's sidebar scoping pattern.

Mobile adaptation (below 768px):
- Sub-nav transforms into a horizontal tab bar pinned below the main top bar.
- Tabs are scrollable horizontally. Active tab: Indigo-Slate underline (3px), on_surface text Medium weight. Inactive: on_surface_variant.
- No visible divider line under the tab bar — tonal shift from surface_container_low (tabs area) to surface_container_lowest (content) creates the separation.

Settings content area (right of sub-nav):
- surface_container_lowest (#ffffff). 32px padding. Scrollable independently of the sub-nav.
- Each settings page fills this content area — sub-nav does not scroll when content does.
```

💡 *Tip: Not rendering inaccessible sub-nav items (rather than showing them greyed out) is correct — greyed items invite curiosity and attempts. Silence is cleaner.*

---

## SCREEN 23 — SETTINGS: USER PREFERENCES

---

**🎨 Stitch Prompt — Settings: User Preferences Screen — Sunday**

```
Design the User Preferences settings screen for Sunday at route /settings. Accessible to all authenticated roles.

Uses the Settings layout with sub-nav from the previous prompt. "User Preferences" is the active sub-nav item.

Page title "User Preferences" in headline-sm, on_surface. Asymmetric editorial top padding.

Three settings sections, separated by generous vertical spacing (no dividers — spacing only):

Section 1 — Notification Preferences:
(Built in Sprint 6 — reference that design. Fully integrated here as the first section of User Preferences. No redesign needed — just confirm placement.)

Section 2 — Default Task View:
- Section heading "Default Task View" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Description label-md on_surface_variant below heading: "Choose whether tasks open in list or board view by default."
- Segmented pill group: "List View" · "Kanban Board". Selected: Indigo-Slate gradient fill, on_primary text. Unselected: surface_container_low fill, on_surface_variant text. 48px radius.
- Leading icons inside each segment: list icon for List View, grid icon for Kanban Board (16px, matching text colour of the segment state).
- Saves immediately on selection. Success toast: "Default view updated."

Section 3 — Saved Filter Views Manager:
- Section heading "Saved Views" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Description: label-md on_surface_variant "Views you've saved from the Task Board and task lists."
- Saved views list (same card row style as Sprint 3's Saved Views dropdown):
  - Each row: surface_container_lowest, 8px radius, ambient shadow, 4px gap.
  - View name (label-md Plus Jakarta Sans Medium, on_surface) + screen origin label (label-sm on_surface_variant: "Task Board" or "My Tasks") + "Shared" pill (tertiary #d0c3ba fill, 24px radius, label-sm on_surface — only shown on shared views, Manager+ only).
  - Action icons on row hover (right-aligned): Edit (pencil, 20px, on_surface_variant) and Delete (trash, 20px, on_surface_variant).
  - Delete: inline "Delete?" Yes / No confirmation within the row (no separate modal). "Yes" removes the row with a smooth height-collapse animation.
- Empty state: label-md on_surface_variant centred below the heading: "No saved views yet — save a view from the Task Board or task lists." No CTA button (saves happen elsewhere).
```

---

## SCREEN 24 — SETTINGS: TEAM SETTINGS

---

**🎨 Stitch Prompt — Settings: Team Settings Screen — Sunday**

```
Design the Team Settings screen for Sunday at route /settings/team. Access: Manager and above. Employees see 403 or the sub-nav item is not rendered.

Uses the Settings layout. "Team Settings" is the active sub-nav item.

Page title "Team Settings" in headline-sm, on_surface. Subtext: "Managing settings for [Team Name]." in label-md on_surface_variant.

Settings sections (separated by vertical spacing, no dividers):

Section 1 — Planning Mode:
- Section heading "Planning Mode" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Description: label-md on_surface_variant "Controls how team members submit their weekly plans."
- Segmented pill group: "Flexible" · "Locked". Selected: Indigo-Slate gradient. Unselected: surface_container_low fill. 48px radius.
  - "Flexible" — subtext below the segment group: label-sm on_surface_variant "Team members can edit their plan at any time. No submission required."
  - "Locked" — subtext: label-sm on_surface_variant "Plans must be submitted by the deadline. Plans become read-only after submission."
- Conditional field (smooth height animation — same conditional pattern as Sprint 1's Team modal M5):
  - When "Locked" is selected, a "Submission Deadline" row reveals below the subtext.
  - Submission Deadline: two fields side by side — "Day" dropdown (24px radius, surface_container_low fill: Mon/Tue/Wed/Thu/Fri/Sat/Sun) and "Time" input (48px radius, surface_container_low fill, time picker). Label "Submission Deadline" in label-sm Plus Jakarta Sans Medium, on_surface_variant above the row.
- Saves immediately on change. Toast: "Planning mode updated."

Section 2 — Daily Check-in:
- Section heading "Daily Check-in" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Toggle row: label "Require daily check-in" in label-md on_surface. Description label-sm on_surface_variant below: "Team members must submit a morning check-in each working day." Toggle right-aligned — On: Indigo-Slate fill; Off: surface_container_low fill. Auto-saves on toggle.

Section 3 — EOD Wrap-up:
- Same toggle row pattern as Daily Check-in. Label: "Require end-of-day wrap-up." Description: "Team members must submit an end-of-day report each working day."

Section 4 — Links:
- "Manage Custom Fields" — text link row (label-md Indigo-Slate, right-arrow icon) navigating to /settings/custom-fields.
- "Manage Projects" — text link row navigating to /settings/projects.
- Both rows: surface_container_lowest, 8px radius, ambient shadow, hover: surface_container_high. Simple linked rows — no complex styling needed.
```

---

## SCREEN 25 — SETTINGS: SYSTEM SETTINGS

---

**🎨 Stitch Prompt — Settings: System Settings Screen — Sunday**

```
Design the System Settings screen for Sunday at route /settings/system. Access: Admin only.

Uses the Settings layout. "System Settings" is the active sub-nav item.

Page title "System Settings" in headline-sm, on_surface. Subtext: "Organisation-wide configuration." in label-md on_surface_variant.

Settings sections:

Section 1 — Organisation:
- Section heading "Organisation" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Organisation name field: full-width text input, 48px radius, surface_container_low fill, no border. Label "Organisation name" in label-sm on_surface_variant above. Pre-populated with current name. Saves on blur or Enter — "Save" text link appears inline right of the field on any change (label-sm, Indigo-Slate).

Section 2 — Defaults:
- Section heading "Defaults" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Default available hours per day: number input with +/− stepper, 48px radius, surface_container_low fill. Label "Default available hours per day" in label-sm on_surface_variant above. Helper note below: label-sm on_surface_variant "Applied to new employees automatically. Individual settings override this." Saves on blur.

Section 3 — Archiving:
- Section heading "Task Archiving" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Description: label-md on_surface_variant "Completed tasks are automatically archived after a set period. Archived tasks remain accessible but do not appear in active views."
- Archiving Window Selector: a number input + "months" static label beside it. Input: 64px wide, 48px radius, surface_container_low fill. Label "Archive tasks after" in label-sm on_surface_variant above the input. Validation: min 1 month. If value below 1: inline label-sm on_surface_variant error "Minimum archiving period is 1 month." On change: "Save" text link appears inline.

Section 4 — Quick Links (Admin shortcuts):
- "Manage Users" — navigates to /admin/users.
- "Manage Teams & Departments" — navigates to /admin/teams.
- "View Audit Trail" — navigates to /admin/audit.
- "Admin Setup Flow" — navigates to /setup (re-enterable from here per the spec).
- All rendered as linked rows: surface_container_lowest, 8px radius, ambient shadow, label-md on_surface, right-arrow icon, hover: surface_container_high.
```

---

## SCREEN 26 — ADMIN: AUDIT TRAIL

---

**🎨 Stitch Prompt — Admin Audit Trail Screen — Sunday**

```
Design the Admin Audit Trail screen for Sunday at route /admin/audit. Admin access only.

Full app shell. Page title "Audit Trail" in headline-sm, on_surface. Subtext "A read-only log of all structural changes in Sunday." in label-md on_surface_variant.

Filter bar (below page header):
- Date Range Picker (48px radius, surface_container_low fill, no border, calendar icon). Left-aligned.
- "Event Type" multi-select dropdown (24px radius, surface_container_low fill). Options: User Created · User Edited · User Deactivated · Team Created · Team Edited · Role Changed · Settings Changed · Export Generated.
- "Actor" searchable dropdown (24px radius) — filter by which user performed the action.
- All filters apply in real time (debounced). Active filter chips appear below the filter row (same chip style as Sprint 3 / Sprint 7 filter bars).

Audit Event Table (below filter bar):
- No outer table border. Events sit on the #f7f9fb page background.
- Column headers (label-sm Plus Jakarta Sans Medium, on_surface_variant, stuck at top of table on scroll): Timestamp · Actor · Event Type · Description · Old Value · New Value.
- Each row: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 2px 8px rgba(77,85,106,0.04), 4px vertical gap. No borders.
- Row contents:
  - Timestamp: label-md on_surface — full ISO format "Apr 10, 2026 · 09:41 AM". Non-truncated.
  - Actor: avatar (28px circle) + name (label-md on_surface) + role badge (pill, 24px radius, role-specific tonal fill) in a compact inline row.
  - Event Type badge: pill (24px radius). Colour per type:
    - User Created/Edited: Indigo-Slate soft tonal fill, on_surface text.
    - User Deactivated: amber tonal fill (#d4820a at 12% opacity), on_surface text.
    - Team Created/Edited: surface_container fill, on_surface_variant text.
    - Role Changed: tertiary (#d0c3ba) fill, on_surface text.
    - Settings Changed: surface_container fill, on_surface text.
    - Export Generated: soft green tonal fill, on_surface text.
  - Description: label-md on_surface_variant. Plain English description of the action (e.g. "Changed Ahmed's role from Employee to Manager"). Up to 2 lines before truncation.
  - Old Value: label-sm on_surface_variant. Truncated at 120 characters — full value revealed on hover via glassmorphism tooltip (80% opacity, 20px blur, ambient shadow). Greyed placeholder "—" if not applicable.
  - New Value: same treatment as Old Value.
- NO edit, delete, or action buttons on any row. Fully read-only.
- Row hover: surface_container_high tonal shift, no border.

Pagination (below table): Previous / Next pill buttons (surface_container_low fill, 48px radius, on_surface_variant) + "Showing 1–50 of 1,284 events" in label-sm on_surface_variant. Centred.

Skeleton loader, empty state ("No audit events match your filters." with a "Clear filters" text link), error state — standard Sunday patterns.
```

💡 *Tip: Truncating Old Value and New Value columns with hover tooltips keeps the table scannable — most rows matter for the action description, not the raw values. Full values are discoverable when needed.*

---

## SCREEN 27 — FIRST-LOGIN ONBOARDING FLOW

---

**🎨 Stitch Prompt — Employee First-Login Onboarding Flow — Sunday**

```
Design the First-Login Onboarding Flow for Sunday at route /onboarding. Triggered automatically on an employee's first login. Shown only once — never re-displayed after completion.

NO sidebar or top bar. Full-viewport flow with its own minimal chrome.

Page chrome:
- Top: Sunday wordmark (centred) in Plus Jakarta Sans Medium. 24px top padding.
- Step progress indicator: 3 numbered circles connected by a thin line (same pattern as the Bulk Import stepped flow from Sprint 1). Active step: Indigo-Slate gradient fill, on_primary number. Completed step: Indigo-Slate solid fill, checkmark. Upcoming: surface_container_low fill, on_surface_variant number. Connecting line: surface_container_high.
- Step labels below: "Welcome" · "Your Tasks" · "Your Plan". label-sm on_surface_variant for inactive, on_surface for active.
- Background: #f7f9fb full-page.

Step 1 — Welcome:
- Centred card (surface_container_lowest, 24px radius, ambient shadow, max-width 560px).
- Large greeting: "Welcome to Sunday, [First Name]." in display-md sizing — the biggest typographic moment in the onboarding. Plus Jakarta Sans Medium, on_surface. Tight -0.02em tracking. Centred.
- Below: team info row — team avatar / team colour indicator (36px circle in tertiary #d0c3ba) + "[First Name] is part of [Team Name]" in label-md on_surface, centred.
- Reporting manager: "Your manager is [Manager Name]." with manager avatar + name chip (surface_container fill, 24px radius, avatar + name, label-md). Centred.
- Body copy in label-md on_surface_variant, centred, short: "Sunday is where you plan your work, track your tasks, and stay in sync with your team. Let's get you set up."
- Forward button: "Let's go →" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium, full-width max 280px, centred).

Step 2 — Your Tasks:
- Card (same shell). Heading "Tasks waiting for you" in headline-sm, on_surface.
- If tasks are pre-assigned: a compact task list (up to 5 tasks) using the same task row style from My Tasks — priority stripe, title, status badge, due date. "You have [N] tasks assigned. You can view and manage them all from My Tasks."
- If no tasks: "No tasks assigned yet. You'll see them here when your manager assigns work." — on_surface_variant, centred. Soft outline task icon above.
- Forward button: "Continue →" (Indigo-Slate gradient). No back button.

Step 3 — Your Plan:
- Card (same shell). Heading "Plan your first week" in headline-sm, on_surface.
- Illustration substitute: a simple 5-column mini grid (days as header pills in surface_container_low, 48px radius — Mon Tue Wed Thu Fri — with empty drop zone hints as surface_container fill rounded rectangles beneath each). This is a static visual preview, not interactive.
- Body copy: label-md on_surface_variant "Head to My Plan to organise your tasks by day. Drag tasks into your days to get started."
- Two buttons centred: "Go to My Plan" (Indigo-Slate gradient, 48px radius, primary) · "Skip for now" (tertiary fill #d0c3ba, 48px radius, on_surface). "Skip for now" marks onboarding complete and lands the user on the dashboard.
- No back button on Step 3.
```

💡 *Tip: The mini grid visual on Step 3 plants the planning mental model before the user encounters the real screen — they arrive at /plan knowing what to expect, significantly reducing first-use confusion.*

---

## SCREEN 28 — ADMIN SETUP FLOW

---

**🎨 Stitch Prompt — Admin Setup Flow — Sunday**

```
Design the Admin Setup Flow for Sunday at route /setup. Triggered on admin's first login. Re-enterable from System Settings.

NO sidebar or top bar on first-login entry. When re-entered from System Settings, the top bar is present but the sidebar nav is not — the setup flow takes full content focus. Full-viewport flow.

Page chrome (same structure as employee onboarding):
- Sunday wordmark centred (top).
- Step progress indicator: 3 steps. "Departments" · "Teams" · "Employees". Active: Indigo-Slate gradient fill. Completed: checkmark. Upcoming: surface_container_low.
- Background: #f7f9fb.

Step 1 — Create Departments:
- Card (surface_container_lowest, 24px radius, ambient shadow, max-width 680px, centred).
- Heading "Set up your departments" in headline-sm, on_surface.
- Subtext: label-md on_surface_variant "Departments group your teams. Start with at least one before adding teams."
- Department form (embedded inline — not a modal): Department name input (full-width, 48px radius, surface_container_low fill) + Senior Manager dropdown (24px radius, searchable) side by side on wider screens, stacked on narrow. "Add Department" pill button (Indigo-Slate gradient, 48px radius) below.
- Created departments list below the form: each as a compact row card (surface_container_lowest, 8px radius, ambient shadow, 4px gap) with department name + senior manager name + delete icon (trash, on_surface_variant — deletable only if no teams added yet).
- Forward button "Next: Teams →" (Indigo-Slate gradient, full-width max 280px, centred) — DISABLED (surface_container_low fill, on_surface_variant) until at least one department exists.

Step 2 — Create Teams:
- Same card shell. Heading "Add your teams" in headline-sm, on_surface.
- Subtext: label-md on_surface_variant "Teams sit inside departments. Add team details below."
- Team form (same fields as Modal M5 from Sprint 1, embedded inline): Team name, Department (dropdown scoped to created departments), Manager, Planning Mode (segmented pill), conditional Submission Deadline, Check-in toggle, EOD toggle.
- Created teams list below: department-grouped hierarchy (parent department label in label-sm Plus Jakarta Sans Medium on_surface_variant, child team rows indented 24px — same tree logic as /admin/teams). Delete icon per team.
- Forward button "Next: Employees →" — DISABLED until at least one team exists.

Step 3 — Add Employees:
- Card shell. Heading "Add your team members" in headline-sm, on_surface.
- Subtext: label-md on_surface_variant "Add employees individually or import a CSV. Invites are sent automatically."
- Two action sections side by side (separated by a label-sm on_surface_variant "Or" divider between them — vertical, centred):
  - Left: "Add Individual" — a compact single-employee mini-form (First name, Last name, Email, Role, Team dropdowns). "Add & Invite" button (Indigo-Slate gradient, 48px radius).
  - Right: "Import CSV" — compact upload drop zone (same component as Sprint 1's bulk import). "Import" button (tertiary #d0c3ba fill, 48px radius).
- Added employees list: compact rows (avatar initials + name + team + "Invite pending" amber badge). No delete — employees can be deactivated later from User Management.
- Completion button: "Finish Setup →" (Indigo-Slate gradient, full-width max 280px, centred). Available immediately — employees are optional at setup time.
- "Finish Setup →" navigates to /dashboard.
```

---

## MODAL M18 — DEACTIVATION TASK REASSIGNMENT FLOW

---

**🎨 Stitch Prompt — Modal M18: Deactivation Task Reassignment Flow — Sunday**

```
Design Modal M18 — the Deactivation Task Reassignment Flow for Sunday. Triggered when an Admin initiates user deactivation with open tasks present (from User Management or the Confirm Deactivate modal M2 flow).

This is a large, focused modal — it functions as a mini task management screen within a modal overlay. It cannot be dismissed without handling all open tasks.

Overlay: 80% surface opacity, 20px backdrop-blur, ambient shadow. No × close icon on the modal card — the only exits are through completion or cancellation.
Card: surface_container_lowest (#ffffff), 24px radius, ambient shadow. Max-width 720px. Max-height 80vh. Centred. Vertically scrollable internally.

Modal header (sticky):
- Heading "Before deactivating [Full Name]" in headline-sm, on_surface.
- Subtext in label-md on_surface_variant: "This user has [N] open tasks. Reassign or close each task before deactivation can complete."
- Progress indicator (right of subtext): "[X] of [N] resolved" in label-sm on_surface_variant. Updates in real time as tasks are handled. When X = N: changes to a green "All tasks resolved ✓" label.

Task list (scrollable content, below header):
- Each task: surface_container_lowest card row, 8px radius, ambient shadow 0px 2px 8px rgba(77,85,106,0.04), 4px gap.
- Row contents:
  - 3px priority stripe (left edge, full row height). High: muted red. Medium: amber. Low: surface_container.
  - Task title (label-md Plus Jakarta Sans Medium, on_surface).
  - Status badge (pill, 24px radius, status-specific tonal fill).
  - Resolution controls (right side, 8px gap between):
    - "Reassign to" dropdown (24px radius, surface_container_low fill, team-scoped options excluding the departing user). Selecting a person reassigns the task immediately (optimistic) and marks this row resolved.
    - "Close task" pill button (surface_container_low fill, 48px radius, on_surface_variant label-sm). Clicking marks the task closed (a distinct "Closed" status, not Done — requires no completion report) and marks this row resolved.
  - Resolved row state: the entire row receives surface_container_low background (recedes). Resolution controls are replaced by a "Resolved ✓" label-sm in soft green + who it was assigned to or "Closed" note in on_surface_variant.

Modal footer (sticky at bottom of modal):
- Left: "Cancel deactivation" text link (label-sm, on_surface_variant). Exits the modal — the user is NOT deactivated and all task changes made are preserved (reassignments and closures remain).
- Right: "Deactivate [Name]" pill button (surface_container_low fill, on_surface text — muted, not red) — DISABLED (further quieted: surface_container fill, on_surface_variant text) until all [N] tasks are resolved. Enables and becomes slightly more prominent (on_surface text darkens) once all tasks handled.
```

💡 *Tip: Making reassignments and closures immediately visible (resolved row recedes, progress counter updates) gives the admin satisfying progress feedback — deactivating someone with 20 open tasks would feel overwhelming without this per-row resolution feedback.*

---

## SPRINT 10 — MOBILE REFINEMENT PASS

---

**🎨 Stitch Prompt — Mobile Refinement: Admin User Management (375px) — Sunday**

```
Adapt the Admin User Management screen (/admin/users) for Sunday for mobile viewports at 375px width.

The data table layout from Sprint 1 is not usable at this width. Replace the table with stacked user cards.

Each user card: surface_container_lowest (#ffffff), 12px radius, ambient shadow 0px 4px 12px rgba(77,85,106,0.05), 8px vertical gap. Full device width minus 16px horizontal margin.

Card contents (stacked layout):
- Top row: avatar (40px circle) + full name (label-md Plus Jakarta Sans Medium, on_surface) + role badge (pill, 24px radius, role-specific tonal fill, label-sm) right-aligned.
- Second row: email address (label-sm on_surface_variant, truncated with ellipsis if overflow).
- Third row: Team tag pill (surface_container fill, 24px radius, label-sm on_surface_variant) + Status badge (Active/Deactivated/Invite Pending, pill, 24px radius, status-specific tonal fill) side by side. Left-aligned, 8px gap.
- Bottom row: action buttons — "Edit" (tertiary fill #d0c3ba, 48px radius, label-sm) + "Deactivate"/"Reactivate" (surface_container_low fill, 48px radius, label-sm) + "Resend Invite" (surface_container_low fill, 48px radius, label-sm — only if Invite Pending). Scrolls horizontally within the card if all three actions don't fit. 8px gap between buttons. 44px minimum touch target height.

Live search field: full-width, 48px radius. Below the page header. Filters cards in real time.
Filter dropdowns collapse into a "Filter" pill button (same overflow pattern as Sprint 7's "More Filters"). Tapping opens a full-screen filter sheet (slides up from bottom — not a dropdown): each filter listed full-width with its control. "Apply Filters" CTA at bottom of the sheet (Indigo-Slate gradient, full-width).
```

---

**🎨 Stitch Prompt — Mobile Refinement: Task Detail (375px) — Sunday**

```
Adapt the Task Detail screen (/tasks/:id) for Sunday at 375px mobile width.

The two-column layout from Sprint 2 collapses to a single column.

Layout order (top to bottom, full width):
1. Page header: back link + task title (editable inline, wraps to 2 lines max) + status badge with inline status dropdown.
2. Tabs: "Details" · "Timeline" · "Comments" — horizontally scrollable tab bar. Active: Indigo-Slate gradient underline. Tabs stick below the page header on scroll.
3. Main content (Details tab): description editor (full-width) → subtask list → dependency section → completion report → reviewer actions. Each section full-width, 16px horizontal padding.
4. Metadata sidebar (stacked below main content, full-width): all metadata fields from the right sidebar now display in a single-column grid. Two fields per row on wider mobile (≥414px). One field per row at 375px. Each field: label above + value below, same inline-edit on tap behaviour. 44px minimum tap target height on all interactive values.

Touch targets:
- Status dropdown trigger: minimum 44×44px.
- Subtask completion toggle: 44px diameter tap zone (not just the 24px circle).
- All icon action buttons: 44×44px tap target even if icon is smaller.
- Inline hours stepper: +/− buttons each minimum 44×44px.
```

---

**🎨 Stitch Prompt — Mobile Refinement: My Weekly Plan (375px) — Sunday**

```
Adapt the My Weekly Plan screen (/plan) for Sunday at 375px. (Designed in Sprint 4's mobile prompt — confirm and refine here.)

The week grid shows ONE day column at a time. The day fills the full viewport width.

Day navigation:
- Large left/right chevron buttons flanking the day title. Each chevron: 56px diameter, surface_container_low fill, 48px radius. Generous tap target — the primary navigation on this screen.
- Day title centred: day name + date in label-md Plus Jakarta Sans Medium, on_surface.
- Position indicator: 5–7 dots (matching work week day count) below the navigation row. Indigo-Slate gradient active dot (10px), surface_container inactive (8px). 48px radius.

Task slot cards: full-width minus 16px margin. Priority stripe at top (horizontal, full card width). Hours input: full-width within the card, 48px radius, 44px height.
Unplanned pool: below the single day view. Pills scroll horizontally. Drag replaced by tap-to-assign on mobile: tapping an unplanned task opens a bottom sheet (surface_container_lowest, 24px top radius) for selecting which day — day options as full-width pill buttons (48px radius, surface_container_low fill).

Day Summary Footer: single cell for the current day only — full-width, colour-coded, "Planned X / Available Y hrs."
Submit Plan button (Locked mode): fixed at the bottom of the viewport above safe-area. Full-width, 48px radius, Indigo-Slate gradient. Always visible regardless of scroll position.
```

---

**🎨 Stitch Prompt — Mobile Refinement: Dashboard My Overview (375px) — Sunday**

```
Adapt the Dashboard My Overview screen (/dashboard) for Sunday at 375px.

The 2×2 widget grid from Sprint 5 collapses to a single-column stacked layout. All four widget cards are full viewport width minus 16px margin. 12px vertical gap between widgets.

Widget order (top to bottom): Today's Tasks → Weekly Completion Rate → Upcoming Deadlines → Carry-overs. This order prioritises the most immediately actionable content.

Widget sizing: each widget adapts its natural height. The Weekly Completion Rate donut chart scales to max 160px diameter on mobile, centred within the widget.

Today's Tasks widget: task rows are touch-friendly — minimum 44px row height. Priority dot (10px), title (truncated), status badge. Tapping anywhere on the row navigates to Task Detail.

Greeting heading ("Good morning, [Name]."): scales down from headline-sm to label-lg (1.25rem) on 375px to prevent oversized text breaking the single-column layout rhythm.
```

---

**🎨 Stitch Prompt — Mobile Refinement: Team Plans & Capacity Grids (375px) — Sunday**

```
Adapt the Team Plans (/team/plans) and Team Pulse (/dashboard/team-pulse) screens for Sunday at 375px. Both use the same capacity grid structure.

The multi-column team × day grid cannot render at 375px. Adapt to a vertical accordion model.

Each team member is a collapsible accordion row:
- Collapsed state: full-width surface_container_lowest card, 8px radius, ambient shadow. Contents: avatar (36px) + employee name (label-md Plus Jakarta Sans Medium, on_surface) + submission status badge (right-aligned) + expand chevron (far right, on_surface_variant). Minimum 52px height. 44px touch target for the entire row.
- Expanded state: card expands below the header row to show a mini day grid for that employee. Day columns appear as compact day pills (Mon Tue Wed Thu Fri, 24px radius, surface_container_low fill, label-sm on_surface_variant) with a planned hours label below each. Colour-coded fill per day (green/amber/red thresholds from Sprint 4). Comment icon appears below the day grid: "Add comment" label-sm Indigo-Slate, speech bubble icon left.
- Only one accordion row can be expanded at a time (single-expand accordion).

Big Fat Warning Banner: full-width on mobile. Warning entries stack vertically. "Acknowledge" button is full-width per entry (48px radius, surface_container_low fill) — large touch target.
```

---

*All prompts above are ready to paste directly into Stitch. Recommended order: Settings sub-nav layout → User Preferences → Team Settings → System Settings → Audit Trail → Employee Onboarding Flow → Admin Setup Flow → Modal M18 → then the mobile refinement pass in order: User Management → Task Detail → My Weekly Plan → Dashboard → Team Plans/Capacity Grids.*
