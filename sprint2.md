# Stitch Prompts — Sprint 2 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 2 Dependency:** All prompts assume Sprint 1's App Shell is in place — sidebar, top bar, role badge, auth guard, and toast system are already established.

---

## APP SHELL UPDATE — "+ New Task" Button

---

**🎨 Stitch Prompt — App Shell Update: Persistent New Task Button — Sunday**

```
Update the Sunday App Shell (sidebar + top bar established in Sprint 1) to add a persistent "+ New Task" primary action button.

Placement: Fixed at the bottom of the sidebar, above the user avatar row. Full-width within the sidebar padding.

Button style:
- Indigo-Slate gradient (#4d556a → #656d84, 135°), 48px radius, Plus Jakarta Sans Medium, on_primary text.
- Left icon: a "+" symbol (20px, on_primary).
- Label: "+ New Task".
- Hover: gradient slightly brightened. Ambient shadow intensifies to 0px 8px 32px rgba(77,85,106,0.12).

Mobile (hamburger drawer open):
- Same button appears at the bottom of the overlay drawer, above the user row.
- Tapping it closes the drawer and opens the Quick Task Creation modal (M1).

This button persists on every authenticated screen across the entire application from this sprint onwards.
```

💡 *Tip: Anchoring the CTA at the sidebar bottom (not the top bar) reinforces the structural hierarchy — it's a workspace-level action, not a page-level one.*

---

## SCREEN 9 — MY TASKS

---

**🎨 Stitch Prompt — My Tasks Screen — Sunday**

```
Design the My Tasks screen for Sunday at route /tasks. Visible to all authenticated roles.

Full app shell present. Page title "My Tasks" in headline-sm (1.5rem, -0.02em tracking), on_surface. Subtext "Tasks assigned to you." in label-md, on_surface_variant.

Status Filter Tabs (horizontal tab group, below page header):
- Tabs: All · To Do · In Progress · In Review · Done.
- Active tab: Indigo-Slate gradient underline (3px, full-width of tab) with on_surface text in Plus Jakarta Sans Medium. Inactive: transparent, on_surface_variant.
- Tab bar has no border, no card background — it floats on the #f7f9fb page surface.
- On mobile: tabs scroll horizontally with momentum. No truncation.

Toolbar (below tabs):
- Left: filter dropdowns side by side — "Priority", "Type", "Nature", "Project", "Billable". Each: 24px radius, surface_container_low fill, on_surface_variant chevron right. No borders.
- Right: "Due Date" date range picker (48px radius, surface_container_low fill) and a "Sort" dropdown (24px radius).
- All filter controls use on_surface_variant placeholder labels.

Task List (below toolbar):
- No outer table border. Each task is a card row: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05). 4px vertical gap between rows.
- Left edge: a 3px vertical priority stripe, full card height. High priority: #c0392b desaturated to a muted red. Medium: muted amber. Low / None: surface_container — invisible, maintains spacing.
- Card row contents (left to right):
  - Priority stripe (3px).
  - Task title in Plus Jakarta Sans Medium, on_surface.
  - Status badge (pill, 24px radius): "To Do" — surface_container_low fill, on_surface_variant text. "In Progress" — Indigo-Slate (#4d556a) soft tonal fill, on_surface text. "In Review" — tertiary (#d0c3ba) fill, on_surface text. "Done" — soft green tonal fill, on_surface text.
  - Project tag: pill, 24px radius, surface_container fill, on_surface_variant label-sm text.
  - Billable badge: a "$" symbol in a 24px diameter circle, surface_container fill, on_surface_variant text. Only shown if task is billable.
  - Due date: label-sm, on_surface_variant. If past today and not Done: display in muted red with the label "Overdue" appended in the same red — "Apr 8 · Overdue".
  - Assignee avatar: 32px diameter circle, initials or photo. Right-aligned.
  - Inline status dropdown chevron: far right. Clicking opens a small status-change dropdown (glassmorphism: 80% opacity, 20px blur, ambient shadow). Business rules enforced — selecting Done opens M8 automatically. Blocked transitions show a tooltip above the dropdown.

Row hover: surface_container_high background. No border.
Clicking the row title navigates to /tasks/:id (Task Detail).

Skeleton loader: shimmer rows matching card height, priority stripe placeholder, two text block placeholders, badge placeholder.
Empty state (per tab): Centred. display-md icon reflecting the tab. Heading "No tasks here." label-md body appropriate to the tab — e.g. "Tasks you've completed will appear here." for the Done tab. No CTA on empty Done — CTA "Create a task" (Indigo-Slate gradient pill) on empty All/To Do tabs.
```

💡 *Tip: The priority stripe replaces any "priority" label column — it communicates urgency pre-attentively, before the user reads a single word.*

---

## SCREEN 10 — TASK DETAIL

---

**🎨 Stitch Prompt — Task Detail Screen: Layout & Header — Sunday**

```
Design the Task Detail screen for Sunday at route /tasks/:id. Two-column layout within the app shell.

Page-level header (above the two columns, full width):
- Back link "← My Tasks" or "← Team Tasks" in label-sm, on_surface_variant.
- Task title: editable inline heading in headline-sm, on_surface. Clicking the title reveals a text input (48px radius, surface_container_low fill) with save/cancel on blur or Enter.
- Below title: left-border priority stripe replicated as a horizontal tag — "High Priority" pill (24px radius, muted red tonal fill) or absent if low/none.
- Right of the title row: Status badge with inline status dropdown. Same glassmorphism dropdown as My Tasks. Same business rule enforcement.

Two-column layout:
- Left column (main content): 65% width. Right column (sidebar): 35% width. No divider between columns — tonal shift achieves separation. Left is #f7f9fb, right is surface_container_low — a perceptible but soft tonal step.
- On mobile: right sidebar stacks fully below left main content. Tabs remain accessible above the fold.
```

💡 *Tip: The tonal column separation avoids a vertical divider line — the sidebar "lifts" slightly by being a cooler tone than the page base.*

---

**🎨 Stitch Prompt — Task Detail Screen: Main Content Area (Left Column) — Sunday**

```
Design the left column (main content area) of the Task Detail screen for Sunday.

Tab switcher (top of left column):
- Tabs: "Details" · "Timeline" · "Comments".
- Same tab style as My Tasks status tabs: Indigo-Slate gradient underline on active, on_surface_variant for inactive. No card, no border on tab row.

Details Tab content (default):
1. Description section:
   - Section label "Description" in label-sm, on_surface_variant. Plus Jakarta Sans Medium.
   - Rich text editor area: surface_container_lowest, 8px radius, ambient shadow. Toolbar (top of editor): Bold, Italic, bullet list, numbered list, link — icon buttons in on_surface_variant. No border on toolbar — surface_container_low fill with 8px top radius. Editor content in label-md, on_surface.
   - If no description: placeholder text "Add a description…" in on_surface_variant.

2. Subtask List section:
   - Section label "Subtasks" in label-sm Plus Jakarta Sans Medium, on_surface_variant. Count of subtasks in parentheses: "(3)" in same label weight.
   - Each subtask row: surface_container_lowest, 8px radius, 4px vertical gap. Contains: completion toggle (circle checkbox, 24px — unchecked: surface_container outline at 15% opacity; checked: Indigo-Slate gradient fill, checkmark icon), subtask title in label-md on_surface, assignee avatar (28px circle), due date in label-sm on_surface_variant. Clicking title opens the subtask's own Task Detail page.
   - Overdue subtask due date: muted red + "Overdue" label appended.
   - "+ Add Subtask" link below the list: label-sm, Indigo-Slate (#4d556a), underline on hover. Clicking opens the inline M13 form appended below the list (not a modal).

3. Dependencies section:
   - Section label "Dependencies" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
   - Two sub-sections stacked: "Blocked by" and "Blocks". Each sub-label in label-sm on_surface_variant.
   - Each dependency entry: surface_container_lowest row, 8px radius, 4px gap. Task title links to that task. If "Blocked by" task is not yet Done: a muted red dot indicator (8px circle) left of the title, with tooltip "This task is not yet complete — you are blocked."
   - "+ Add Dependency" link below: same style as "+ Add Subtask".

4. Completion Report section (visible only when status is In Progress or In Review):
   - Section label "Completion Report" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
   - Textarea: surface_container_lowest fill, 8px radius, ambient shadow, no border. Placeholder "Describe what was completed…" in on_surface_variant.
   - Below textarea: file upload zone — small pill button "Attach file" (tertiary fill, 48px radius, paperclip icon). Shows attached file name as a pill chip with × remove after selection.
   - Helper note: label-sm on_surface_variant: "At least a written report or file attachment is required before marking Done."
   - When task status is Done: this section becomes read-only. Textarea replaced by formatted text block. Attached file shown as a download pill (surface_container fill, 24px radius, download icon).

Reviewer Action Buttons (shown only to the assigned reviewer, only when status is In Review):
   - Rendered at the bottom of the Details tab, above the tab switcher.
   - "Approve — Mark Done" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium) and "Send Back" (tertiary fill #d0c3ba, 48px radius, on_surface text) side by side.
   - "Send Back" triggers Modal M9.
```

---

**🎨 Stitch Prompt — Task Detail Screen: Right Sidebar (Metadata Column) — Sunday**

```
Design the right sidebar (metadata column) of the Task Detail screen for Sunday.

Sidebar background: surface_container_low — one tonal step above the page base, no border.
Sidebar padding: generous — 24px horizontal, 20px vertical. Asymmetric top: more top space before the first field to give editorial "sky."

Each metadata field is a stacked pair: label above, value below.
- Label: label-sm, on_surface_variant, Plus Jakarta Sans Regular.
- Value: label-md, on_surface, Plus Jakarta Sans Medium when the value is a name or tag; Regular for dates and numbers.
- 16px vertical gap between field pairs. No horizontal dividers between fields.
- On hover (for editable fields, per role): the value row shows a subtle surface_container_high tonal background and a pencil icon (on_surface_variant, 16px) appears to the right — signaling editability without permanent chrome.
- Clicking an editable field replaces the value with an inline input (48px radius for text/number inputs, 24px radius for dropdowns). Save on blur or Enter. Cancel on Escape.

Metadata fields (in order):
1. Assignee — avatar + full name. Editable dropdown (scoped by manager's team). Role-restricted.
2. Reviewer — avatar + full name or "None assigned". Editable dropdown. Role-restricted.
3. Due Date — formatted date (e.g. "Apr 15, 2026"). Editable date picker. Overdue: muted red display + "Overdue" label-sm below.
4. Estimated Hours — number with "hrs" suffix. Editable number input (48px radius, stepper).
5. Actual Hours — number with "hrs" suffix (only shown after task is Done or has a completion report). Read-only if Done.
6. Priority — pill badge (24px radius) matching list card priority stripe: High / Medium / Low. Editable segmented pill group on click.
7. Type — text value (e.g. "Design", "Development"). Editable dropdown.
8. Nature — text value. Editable dropdown.
9. Project — project tag pill. Editable searchable dropdown.
10. Billable — a pill toggle: "Billable" (Indigo-Slate soft tonal fill) or "Non-Billable" (surface_container fill). Disabled with tooltip if user has no billable permission.
11. Created By — name, label-sm on_surface_variant. Read-only.
12. Created On — date, label-sm on_surface_variant. Read-only.

Mobile: sidebar stacks below the main content column. All fields retain inline-edit functionality. Full-width, single-column layout.
```

---

**🎨 Stitch Prompt — Task Detail Screen: Timeline Tab — Sunday**

```
Design the Timeline tab content for the Task Detail screen in Sunday.

Tab: activated by clicking "Timeline" in the tab switcher.

Timeline is a vertically stacked, read-only event log. Entries are append-only — no edit or delete affordances.

Timeline entry anatomy:
- Left: a vertical connector line (1px, surface_container_high) running the full height of the list. At each entry: a 10px circle dot on the connector. Colour varies by event type: status changes — Indigo-Slate (#4d556a). Assignments — tertiary (#d0c3ba). Comments / notes — surface_container. System events — on_surface_variant.
- Right of the connector: event content block (no card, no border — just typography on the #f7f9fb background).
  - Actor name: label-md Plus Jakarta Sans Medium, on_surface.
  - Action description: label-md Plus Jakarta Sans Regular, on_surface_variant. Includes old → new values inline when relevant (e.g. "changed status from In Progress → In Review").
  - Timestamp: label-sm on_surface_variant, formatted as relative time ("2 hours ago") with ISO full date revealed on hover via tooltip (glassmorphism style).
- 12px vertical gap between entries.

No dividers between entries. The connector line and dot system create chronological structure visually.

Oldest entry at the bottom. Newest at the top. "Task created" is always the last (oldest) entry.
Empty state: not possible if task exists — a creation entry always exists.
```

---

**🎨 Stitch Prompt — Task Detail Screen: Comments Tab — Sunday**

```
Design the Comments tab content for the Task Detail screen in Sunday.

Comment input (pinned at the bottom of the tab area):
- Textarea: surface_container_lowest, 8px radius, ambient shadow, no border. Placeholder "Add a comment…" in on_surface_variant.
- Below textarea (right-aligned): "Post" button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium, on_primary text). Only active when textarea has content.

Comment thread (above input, scrollable):
- Each top-level comment: surface_container_lowest card, 8px radius, ambient shadow, 8px vertical gap. No borders, no dividers.
- Comment card contents: avatar (36px circle) + name (label-md Medium, on_surface) + timestamp (label-sm on_surface_variant) in a row. Body text below in label-md on_surface, regular. "Reply" text link below body in label-sm on_surface_variant.
- Threaded replies: indented 32px from left edge. Same card style but slightly smaller — surface_container fill (one tone warmer than parent) to visually nest. 4px gap between replies.
- No pagination — uses virtualized infinite scroll. Newest comment at the top.
```

💡 *Tip: Nesting replies with a tonal background shift (not indentation alone) ensures thread hierarchy remains clear even when deeply nested.*

---

## SCREEN 11 — TEAM TASKS

---

**🎨 Stitch Prompt — Team Tasks Screen — Sunday**

```
Design the Team Tasks screen for Sunday at route /team/tasks. Access: Assistant Manager and above.

Full app shell. Page title "Team Tasks" in headline-sm, on_surface. Subtext reflects scope: "Showing tasks for [Team Name]" (Manager) or "Showing tasks for [Department Name]" (Senior Manager / Admin) — in label-md, on_surface_variant.

Status Filter Tabs: identical to My Tasks — All · To Do · In Progress · In Review · Done.

Toolbar (below tabs):
- All My Tasks filters (Priority, Type, Nature, Project, Billable, Due Date, Sort) plus:
- "Assignee" dropdown (multi-select, 24px radius, surface_container_low fill) — scoped to the manager's team or department. Shows avatar + name per option.
- "Overdue Only" toggle chip: when active — Indigo-Slate gradient fill, on_primary text, 48px radius pill. When inactive — surface_container_low fill, on_surface_variant text.

Task List (same row card structure as My Tasks) plus one additional column:
- Assignee column: avatar (32px circle) + full name in label-md on_surface. Positioned after the task title.
- Row action: "Reassign" icon button (person-swap icon, on_surface_variant, 24px) appears on hover. Triggers Modal M7.

Overdue rows: entire card receives a very faint muted red tonal background (surface_container_low tinted warm) in addition to the red due date label — makes overdue tasks scannable at page level.

Scope note: Assistant Manager sees only their sub-team. Manager sees their full team. Senior Manager / Admin sees all teams in their department or organisation.

Skeleton, empty state, error state: identical pattern to My Tasks, adjusted copy ("No team tasks here." etc.).
```

💡 *Tip: The scope note in the page subtext ("Showing tasks for Alpha Team") prevents confusion when multiple manager roles use the same screen at different scopes.*

---

## SCREEN 29 — PROJECT / CATEGORY MANAGEMENT

---

**🎨 Stitch Prompt — Project / Category Management Screen — Sunday**

```
Design the Project / Category Management screen for Sunday at route /settings/projects. Access: Manager and above.

Full app shell. Page title "Projects" in headline-sm, on_surface. Subtext "Manage categories for task organisation." in label-md, on_surface_variant.

Right-aligned header action: "+ Add Project" button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium).

Project List:
- No outer table border. Each project is a simple row card: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05), 4px vertical gap.
- Row contents: project name in Plus Jakarta Sans Medium, on_surface. Scope badge beside the name: "Team" (surface_container_low fill, on_surface_variant, 24px radius pill) or "Global" (Indigo-Slate soft tonal fill, on_surface, 24px radius pill). Task count in label-sm on_surface_variant ("14 tasks"). Action icons right-aligned: Edit (pencil) and Delete (trash).
- Delete is only active if the project has 0 tasks — otherwise greyed (surface_container_low fill, on_surface_variant icon) with tooltip "Remove all tasks from this project before deleting."

Skeleton, empty state ("No projects yet. Add your first project to start categorising tasks." CTA "Add Project"), error state — standard Sunday patterns.
```

💡 *Tip: Disabling delete on projects with active tasks (rather than allowing cascade delete) protects data integrity and reflects the quiet, responsible tone of the product.*

---

## MODALS

---

**🎨 Stitch Prompt — Modal M1: Quick Task Creation — Sunday**

```
Design the Quick Task Creation modal for Sunday. Triggered by the persistent "+ New Task" button in the sidebar. Available on every authenticated screen.

Modal overlay: glassmorphism — 80% surface opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06).
Modal card: surface_container_lowest (#ffffff), 24px radius, ambient shadow. Wider modal — max-width 640px. Centred vertically and horizontally.

Modal header: "New Task" in headline-sm, on_surface. × close icon (on_surface_variant, 24px) far right.

Form layout: single-column, stacked fields. 12px vertical gap between fields. No section dividers.

Fields (in order):
1. Task Title — full-width text input, 48px radius, surface_container_low fill. Required. Placeholder "What needs to be done?" Character counter far right: "0/200" in label-sm on_surface_variant.
2. Assignee — searchable dropdown, 24px radius. Scoped by role: Admin/Manager sees all team members; Employee sees only themselves. Shows avatar + name per option.
3. Due Date — date picker input, 48px radius. Must be today or future unless "Already completed" toggle is on.
4. Estimated Hours — number input with +/− stepper, 48px radius.
5. Priority — segmented pill group: "High" · "Medium" · "Low". Selected: Indigo-Slate gradient. Unselected: surface_container_low. 48px radius each.
6. Type — dropdown, 24px radius. (e.g. Design, Development, QA, Admin)
7. Nature — dropdown, 24px radius.
8. Project — searchable dropdown, 24px radius. Items scoped to team.
9. Billable — pill toggle: "Billable" (Indigo-Slate tonal fill) / "Non-Billable" (surface_container fill). 48px radius. If user has no billable permission: toggle is rendered but visually quieted (surface_container fill, on_surface_variant, locked icon) with a tooltip on hover: "You don't have billable permissions."
10. Reviewer — searchable dropdown, 24px radius, optional. Shows "Optional" in label-sm on_surface_variant beside the field label.
11. Description — collapsed by default. A "▾ Add description" text link (label-sm, Indigo-Slate) expands a rich text editor (bold, italic, lists, links) with a smooth height animation. Editor: surface_container_lowest, 8px radius, ambient shadow.

"Already completed" toggle (below all standard fields):
- A thin toggle row: label "Mark as already completed" in label-md on_surface. Toggle switch right-aligned: On — Indigo-Slate fill; Off — surface_container_low.
- When toggled ON: two additional fields animate in smoothly:
  - Actual Hours (number input, 48px radius).
  - Completion Report (textarea, surface_container_lowest, 8px radius + file upload pill button below). Helper text: "Required — this is the completion record for the backdated task."
- When toggled ON: the Due Date field's "today or future" validation is removed.

Footer (sticky):
- "Cancel" (tertiary fill #d0c3ba, 48px radius) · "Create Task" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium). Right-aligned.
- If "Already completed" is on: button label changes to "Create as Done".

Inline validation on blur. On failed submit: warning banner at top of form. surface_container_low background, warm left strip.
```

💡 *Tip: The description field being collapsed by default keeps the modal feeling light — most tasks don't need a description at creation time, and surfacing it on demand respects the quiet aesthetic.*

---

**🎨 Stitch Prompt — Modal M7: Reassign Task — Sunday**

```
Design the Reassign Task modal for Sunday. Triggered from Task Detail sidebar and Team Tasks row action.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 480px.

Header: "Reassign Task" in headline-sm, on_surface. × close icon.

Body:
- Current task title shown in label-md Plus Jakarta Sans Medium, on_surface (read-only context — not a field).
- "Currently assigned to:" label-sm on_surface_variant. Current assignee avatar + name in label-md on_surface below.
- New Assignee field: searchable dropdown, 24px radius, surface_container_low fill. Scoped to manager's team. Current assignee is excluded from the options list. Required.
- Reason field: optional textarea (surface_container_lowest, 8px radius, ambient shadow, no border). Placeholder "Reason for reassignment (optional)." label-sm below: "This will be logged in the task timeline." on_surface_variant. Max 500 characters — counter in label-sm on_surface_variant bottom-right.

Footer: "Cancel" (tertiary, 48px radius) · "Reassign" (Indigo-Slate gradient, 48px radius). Right-aligned.
```

💡 *Tip: Excluding the current assignee from the options list prevents a no-op reassign silently — the new selection is guaranteed to be a change.*

---

**🎨 Stitch Prompt — Modal M8: Completion Report Prompt — Sunday**

```
Design the Completion Report Prompt modal for Sunday. Triggered automatically when a user changes any task's status to "Done" via the inline status dropdown.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 520px.

Header: "Complete this task" in headline-sm, on_surface. No close icon — the modal cannot be dismissed without submitting or cancelling (completion is a deliberate action).

Body:
- Task title shown in label-md Plus Jakarta Sans Medium, on_surface. Read-only.
- Instruction in label-md, on_surface_variant: "Provide a completion report before marking this task as done. At least a written summary or attached file is required."
- Completion Report Textarea: surface_container_lowest, 8px radius, ambient shadow, no border. Placeholder "Summarise what was completed, decisions made, or outcomes achieved…" Rich text toolbar: Bold, Italic, bulleted list. Height: 120px minimum, expands with content.
- File attachment: below the textarea. "Attach a file" pill button (tertiary fill #d0c3ba, 48px radius, paperclip icon left). After selection: file name displayed as a pill chip (surface_container_high fill, 24px radius, × remove icon right).
- Validation note below: label-sm on_surface_variant "You must provide at least one: a written report or a file."

Conditional footer context note (in label-sm on_surface_variant, above the buttons):
- If task has a reviewer: "Submitting will move this task to In Review for [Reviewer Name]."
- If no reviewer: "Submitting will mark this task as Done immediately."

Footer: "Cancel" (tertiary, 48px radius) · "Submit Report" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium). Right-aligned. "Submit Report" is visually quieted (surface_container_low fill, on_surface_variant text) until at least one of text or file is present.
```

💡 *Tip: Removing the × close icon forces intentionality — trying to escape the modal via Cancel returns the task to its previous status, making every Done intentional.*

---

**🎨 Stitch Prompt — Modal M9: Reviewer Send-Back — Sunday**

```
Design the Reviewer Send-Back modal for Sunday. Triggered by the "Send Back" button on Task Detail — only visible to the assigned reviewer when task is In Review.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 480px.

Header: "Send back for revision" in headline-sm, on_surface. × close icon.

Body:
- Task title in label-md Plus Jakarta Sans Medium, on_surface. Read-only context.
- "Assigned to:" label-sm on_surface_variant. Assignee avatar + name in label-md on_surface.
- Send-back reason textarea: required. surface_container_lowest, 8px radius, ambient shadow. Placeholder "Describe what needs to be revised or corrected…" Minimum 10 characters — character counter "0/10 minimum" becomes "✓" in Indigo-Slate tonal color once threshold is met. No maximum mentioned in UI — it's a free-form note.
- Note below textarea: label-sm on_surface_variant "This reason will be permanently logged in the task timeline and the assignee will be notified."

Footer: "Cancel" (tertiary, 48px radius) · "Send Back" (surface_container fill, on_surface text — muted, not gradient, not red — a quiet but clear secondary destructive pattern). Right-aligned.
"Send Back" is visually quieted until the 10-character minimum is met.
```

💡 *Tip: The muted fill on "Send Back" (not a danger red) maintains Sunday's quiet authority tone — the severity is communicated through the required reason, not alarming colour.*

---

**🎨 Stitch Prompt — Modal M13: Add Subtask Inline Form — Sunday**

```
Design the Add Subtask inline form for Sunday. Triggered by "+ Add Subtask" on Task Detail — appears inline below the subtask list, not as a floating modal.

This is an inline form, not a floating modal. It expands below the last subtask row with a smooth height animation (200ms ease-out). It does not use an overlay or glassmorphism.

Inline form card: surface_container_low fill, 8px radius, ambient shadow, 4px top gap separating it from the last subtask row.

Fields (compact layout):
- Title input: full-width, 48px radius, surface_container_lowest fill. Placeholder "Subtask title…" Required. No label shown — placeholder is sufficient.
- Below title: two optional fields arranged in a row:
  - Assignee: compact dropdown (24px radius, surface_container_lowest fill) with an avatar icon left. Defaults to the parent task's assignee on open. on_surface_variant placeholder.
  - Due Date: compact date picker (48px radius, surface_container_lowest fill). on_surface_variant placeholder "Due date (optional)".
- Action row below: "Add Subtask" pill button (Indigo-Slate gradient, 48px radius, label-md Plus Jakarta Sans Medium) left-aligned. "Cancel" text link (label-sm, on_surface_variant) right of the button.

Submitting adds the subtask to the list with a smooth fade-in entry animation. The inline form collapses away. Success toast: "Subtask added" — standard toast system.
```

💡 *Tip: Keeping this inline (not a modal) preserves focus — the user never loses context of the parent task while adding children.*

---

**🎨 Stitch Prompt — Modal M14: Add Dependency — Sunday**

```
Design the Add Dependency modal for Sunday. Triggered by "+ Add Dependency" on Task Detail.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 480px.

Header: "Add Dependency" in headline-sm, on_surface. × close icon.

Body:
- Instruction in label-md on_surface_variant: "Select a task that must be completed before this one can proceed."
- Task search field: 48px radius, surface_container_low fill, magnifier icon left, no border. Placeholder "Search tasks by title…" Results appear in a dropdown below (glassmorphism: 80% opacity, 20px blur) showing task title + assignee avatar + status badge per result row. 24px radius on the results dropdown.
- Selected task: after selection, the search field is replaced by a confirmation pill chip (surface_container_high, 24px radius, × remove) showing the selected task title + status badge.
- Circular dependency error state: if the selected task would create a circular dependency chain, the selection is rejected. An error message appears below the field: label-sm, on_surface_variant "This would create a circular dependency — [Task A] → this task → [Task A]." The "Add Dependency" button remains quieted (disabled appearance).

Footer: "Cancel" (tertiary, 48px radius) · "Add Dependency" (Indigo-Slate gradient, 48px radius). Right-aligned. Quieted until a valid task is selected.
```

💡 *Tip: Showing the circular dependency chain in the error message ("Task A → this task → Task A") clarifies exactly why the selection is rejected — no ambiguity.*

---

**🎨 Stitch Prompt — Modal M19: Add / Edit Project — Sunday**

```
Design the Add / Edit Project modal for Sunday. Triggered from the Project Management screen.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 440px.

Header: "Add Project" or "Edit Project" in headline-sm, on_surface. × close icon.

Fields:
- Project Name: full-width input, 48px radius, surface_container_low fill. Label "Project name" in label-sm on_surface_variant. Required. Validation: must be unique within its scope.
- Scope Type: segmented pill group — "Team-scoped" · "Global". Selected: Indigo-Slate gradient. Unselected: surface_container_low. 48px radius.
  - When "Team-scoped" is selected: a "Team" dropdown reveals below (24px radius, surface_container_low fill, animated height — same conditional pattern as the Team modal from Sprint 1). Shows only teams in the manager's scope.
  - When "Global" is selected: the team dropdown collapses away.
- Helper note below scope: label-sm on_surface_variant. "Team-scoped projects are only available within that team's tasks. Global projects appear across all teams."

Footer: "Cancel" (tertiary, 48px radius) · "Save Project" (Indigo-Slate gradient, 48px radius). Right-aligned.
```

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 2

---

**🎨 Stitch Prompt — Task Card / Row Component — Sunday**

```
Design the reusable Task Card / Row component for Sunday. Used across My Tasks, Team Tasks, and any future list view.

Anatomy (all variants share this base):
- Container: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05). No border.
- Left edge: 3px × full height priority stripe. High: desaturated muted red (#c0392b at 60% saturation). Medium: muted amber. Low / None: surface_container fill (invisible, maintains layout rhythm).
- Content (left to right): Title (Plus Jakarta Sans Medium, on_surface) → Status Badge (pill 24px radius, status-specific tonal fill) → Project Tag (label-sm, surface_container fill, 24px radius) → Billable "$" badge (optional, surface_container fill, 24px diameter circle) → Due Date (label-sm on_surface_variant, or muted red + "Overdue" label) → Assignee avatar (32px circle, rightmost).
- Team Tasks variant adds Assignee name text beside the avatar, left of the avatar.
- Row hover: surface_container_high full-row background. Reveals action icons (Edit pencil, Reassign person-swap) on far right. No border on hover.
- Overdue state: due date text becomes muted red, "· Overdue" label appended in the same color.
```

---

**🎨 Stitch Prompt — Inline Status Dropdown — Sunday**

```
Design the Inline Status Dropdown component for Sunday. Appears on hover or click of any status badge in task rows and the Task Detail header.

Trigger: clicking the status badge pill opens the dropdown below it.

Dropdown panel: glassmorphism (80% surface opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06)). 24px radius. No border. Min-width 200px.

Dropdown options (stacked, 8px vertical gap, no dividers):
- Each option is a row: status badge pill (left) + status label (label-md on_surface) + current checkmark (right, Indigo-Slate, 16px — only on the currently active status).
- Row hover: surface_container_high tonal background shift. 8px radius.
- "Done" option: when selected, does not change to Done immediately — triggers M8 (Completion Report modal) instead. A subtle "Requires report" label-sm on_surface_variant annotation appears below the "Done" option row.
- Blocked transitions: if a business rule blocks a transition (e.g. moving a dependency-blocked task to In Progress), the option row is rendered in on_surface_variant with a lock icon (16px, right) instead of a checkmark. A tooltip on hover explains the block: "This task is blocked by [Task Name]."
```

💡 *Tip: Annotating the "Done" option with "Requires report" sets expectation before the user clicks — reducing surprise when the modal opens.*

---

**🎨 Stitch Prompt — Overdue Indicator Component — Sunday**

```
Design the Overdue Indicator component for Sunday. Applied wherever a due date is displayed when the date has passed and the task is not Done.

Standard (list rows and sidebar): Due date text displayed in muted desaturated red (not alarming — consistent with Sunday's quiet tone: think #c0392b at 50% opacity over on_surface_variant). Immediately after the date: "· Overdue" text label in the same muted red. On_surface_variant weight text, label-sm size.

Task Detail sidebar: same muted red date display + an "Overdue" pill badge (muted red tonal fill at 15% opacity, muted red text, 24px radius) below the date field.

Team Tasks row: the entire card receives a very faint warm tonal background (surface_container_low with a subtle warm tint) in addition to the red date label — making overdue tasks scannable at a glance across many rows.

Never use a solid red or high-saturation warning red — the indicator reads through tone and label, not alarm.
```

---

**🎨 Stitch Prompt — Rich Text Editor Component — Sunday**

```
Design the Rich Text Editor component for Sunday. Used in task descriptions and completion report textareas.

Container: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05). No border.

Toolbar (top of editor, same container):
- surface_container_low fill, 8px top radius only. No border between toolbar and content area — tonal shift creates the separation.
- Toolbar buttons (icon-only, 24px icons, on_surface_variant): Bold (B), Italic (I), Bulleted List, Numbered List, Insert Link.
- Active formatting state: button gets surface_container fill tonal background (8px radius) and on_surface icon color (slightly darker).
- 8px gap between toolbar buttons.

Content area:
- Padding: 16px all sides. Min-height 120px. Expands with content.
- Placeholder text in on_surface_variant when empty.
- Typed content in label-md on_surface. Headings in Plus Jakarta Sans Medium. Links in Indigo-Slate (#4d556a), underline on hover.
- Bullet and numbered lists indent 16px with 4px item gap.

No outer border on the full component — the ambient shadow defines the boundary.
```

---

*All prompts above are ready to paste directly into Stitch. Build in the order listed — establish the App Shell update (New Task button) first, then screens 9–11 and 29, then modals, then shared components. Every prompt references Sunday's Architectural Quietude design system.*
