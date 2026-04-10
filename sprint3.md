# Stitch Prompts — Sprint 3 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 3 Dependency:** Sprint 1 (shell, auth, roles) and Sprint 2 (task creation, completion flow, inline status logic) must be complete. All business rules from Sprint 2 are inherited by the Kanban drag-and-drop system.

---

## SCREEN 12 — TASK BOARD (KANBAN)

---

**🎨 Stitch Prompt — Task Board: Overall Layout & Column Structure — Sunday**

```
Design the Task Board (Kanban view) for Sunday at route /board. Accessible to all authenticated roles, scoped by role.

Full app shell present (sidebar, top bar, persistent "+ New Task" button from Sprint 2). The board occupies the full remaining viewport width and height — no page scroll on the outer container. Each column scrolls independently.

Page header (above board):
- Page title "Board" in headline-sm (1.5rem, -0.02em tracking), on_surface. Left-aligned.
- Right-aligned: "Save View" pill button (tertiary fill #d0c3ba, 48px radius, bookmark icon left, Plus Jakarta Sans Medium) and a "Saved Views" dropdown (24px radius, surface_container_low fill, on_surface_variant, chevron right).

Filter bar (below page header, above board columns):
- Same filter components as My Tasks from Sprint 2: Priority, Type, Nature, Project, Billable dropdowns (24px radius, surface_container_low fill) + Live search (48px radius, surface_container_low fill, magnifier icon, no border) + Due Date range picker.
- Assignee filter added (for Manager+ roles): multi-select dropdown, 24px radius.
- Filters update the board in real time — no "Apply" button needed.
- Active filters are surfaced as dismissible pill chips directly in the filter bar after the dropdowns. Each chip: surface_container fill, 24px radius, label-sm on_surface_variant, × remove icon. Removing a chip clears that filter.

Four-column Kanban layout:
- Columns sit side by side, full height of the viewport below the filter bar. Columns do not wrap.
- On screens narrower than the combined column width: the column area scrolls horizontally. Columns maintain fixed width (280px each on desktop).
- Column gap: 16px.
- Each column: surface_container_low fill, 16px radius, no border. Ambient shadow: 0px 4px 24px rgba(77,85,106,0.04).

Column header (top of each column, sticky within the column):
- Column name in label-md Plus Jakarta Sans Medium, on_surface. Left-aligned, 16px top padding.
- Task count badge: a small pill (24px radius, surface_container fill, label-sm on_surface_variant) showing the count of visible tasks. E.g. "12". Right-aligned in the header row.
- Columns: "To Do" · "In Progress" · "In Review" · "Done".
- Header is separated from the card list below by 8px space only — no divider line.

Column body:
- Scrollable card list. Cards stack vertically with 8px gap.
- 12px horizontal padding, 8px top padding inside the column body.
- When a column is empty (after filtering): centred empty state within the column body. Outline icon (matching the status), single label-md line in on_surface_variant. No CTA button inside columns.
```

💡 *Tip: Fixed-width columns (not fluid) ensure card content never reflows as tasks are dragged — width stability is critical for a calm drag experience.*

---

**🎨 Stitch Prompt — Task Board: Draggable Task Card — Sunday**

```
Design the Draggable Task Card component for the Sunday Kanban board.

Card base: surface_container_lowest (#ffffff), 12px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05). No border. Full column width minus column padding.

Card anatomy (top to bottom):
- Top row: priority stripe — a 3px × full-width horizontal stripe at the very top of the card (inside the card, not a border). High: desaturated muted red. Medium: muted amber. Low / None: surface_container (invisible, maintains top spacing rhythm).
- Card body (12px padding all sides):
  - Task title: label-md Plus Jakarta Sans Medium, on_surface. 2-line max — truncated with ellipsis if longer.
  - Below title (second row): Project tag pill (label-sm, surface_container fill, 24px radius) + Billable "$" badge (surface_container fill, 24px circle — only if billable). Left-aligned, 4px gap.
  - Bottom row: Due date label — label-sm on_surface_variant, or muted red + "Overdue" if past today and not Done. Right-aligned: assignee avatar (28px circle with initials or photo).

Card states:
- Default: as above.
- Hover: ambient shadow deepens to 0px 8px 24px rgba(77,85,106,0.10). Card lifts subtly (translateY -1px). Cursor: grab.
- Dragging (active): card becomes semi-transparent (80% opacity). A "ghost" placeholder (surface_container_low, dashed ghost border at outline_variant 15% opacity, matching card height) remains in the original position. Dragging card follows the cursor with the deepened shadow. Cursor: grabbing.
- Click (not drag): navigates to /tasks/:id. Distinguish from drag with a 4px movement threshold before initiating drag.

Do not use any border on the card — ambient shadow and tonal contrast against the column background define the edge.
```

💡 *Tip: The horizontal priority stripe at the top of the card (not the left side as in list view) works better in fixed-width Kanban columns where vertical space is the primary axis.*

---

**🎨 Stitch Prompt — Task Board: Drag-and-Drop Status Change & Business Rule Enforcement — Sunday**

```
Design the drag-and-drop interaction states and business rule enforcement for the Sunday Kanban board.

Valid drop (card dragged to an allowed column):
- Target column highlights with a surface_container_high background (one tonal step warmer) and a soft Indigo-Slate glow outline (ghost border, outline_variant at 15% opacity). The transition is smooth (150ms ease-in-out).
- A drop position indicator line appears between cards at the insertion point — a 2px horizontal line in Indigo-Slate (#4d556a), full column width. Smooth entry animation.
- On drop: card animates into its new position (200ms ease-out). Status updates immediately (optimistic update). Toast notification: "Task moved to In Progress" — standard toast system bottom-right.

Blocked drop — Completion Report Required (dragging to Done):
- Column does NOT highlight with the valid drop colour.
- Column receives a very faint warm tonal background (surface_container_low with a barely-perceptible warm cast) — a quiet visual signal, not an alarming red.
- A tooltip appears below the dragged card (glassmorphism: 80% surface opacity, 20px blur, ambient shadow): "A completion report is required before marking Done."
- On drop: the card is not placed. Instead, Modal M8 (Completion Report) opens. If the user submits the report, the card then animates into the Done column. If they cancel, the card returns to its origin column with a smooth slide-back animation.

Blocked drop — Dependency Not Resolved (blocked task dragged to In Progress):
- Same quiet warm tonal column background.
- Tooltip below card (glassmorphism): "This task is blocked by [Task Name], which is not yet Done."
- On drop: card is rejected and returns to origin. No modal — the tooltip explanation is sufficient.

Blocked drop — Role Restriction:
- Same quiet warm column background + tooltip: "You don't have permission to move tasks to this status."
- Card returns to origin on drop.

Column header task count badge: updates in real time as cards are dragged between columns. Animate the number with a subtle fade through (old number fades out, new fades in, 150ms).
```

💡 *Tip: The quiet warm tonal highlight for blocked drops (rather than red) keeps the board feeling calm even when rules fire — the tooltip provides the explanation, not alarming colour.*

---

**🎨 Stitch Prompt — Task Board: Filter Bar & Saved Views — Sunday**

```
Design the Saved Views system for the Sunday Task Board filter bar.

Saved Views dropdown (top-right of page header):
- Trigger button: "Saved Views" label + chevron down + bookmark icon. surface_container_low fill, 24px radius, on_surface_variant text. When a saved view is active: button label changes to the view name, Indigo-Slate (#4d556a) text, bookmark icon filled.
- Dropdown panel: glassmorphism (80% surface opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06)). 24px radius. Min-width 260px.
- Dropdown sections (separated by 8px vertical gap — no dividers):
  - Section label "My Views" — label-sm Plus Jakarta Sans Medium, on_surface_variant.
  - Personal view rows: view name in label-md on_surface, "Edit" icon (pencil, 16px, on_surface_variant) and "Delete" icon (trash, 16px, on_surface_variant) appear on row hover. Active view: row gets Indigo-Slate soft tonal background, on_surface text in Medium weight, checkmark icon right.
  - Section label "Team Views" (only shown to Manager+ or if shared views exist) — label-sm Plus Jakarta Sans Medium, on_surface_variant.
  - Team view rows: same style plus a "Shared" pill badge (label-sm, tertiary #d0c3ba fill, 24px radius) beside the name.
  - Row hover for all: surface_container_high background, 8px radius. No border.
- "+ Save current view" row at the bottom — label-sm Indigo-Slate (#4d556a), bookmark+ icon left. Triggers Modal M12.

Active filter chips (in filter bar):
- When any filter is active, pill chips appear in the filter bar row after the dropdown controls.
- Each chip: surface_container fill, 24px radius, label-sm on_surface_variant text, × remove icon right (on_surface_variant, 12px).
- "Clear all" text link (label-sm, on_surface_variant) appears at the far right of the chip row when any chips are present.
- Chips animate in (fade + scale from 0.8, 150ms) and out (fade, 100ms) as filters are applied or removed.
```

---

## SCREEN 13 — CUSTOM FIELD MANAGEMENT

---

**🎨 Stitch Prompt — Custom Field Management Screen — Sunday**

```
Design the Custom Field Management screen for Sunday at route /settings/custom-fields. Access: Manager and above.

Full app shell. Page title "Custom Fields" in headline-sm (1.5rem, -0.02em tracking), on_surface. Subtext "Define additional fields for tasks in your team or projects." in label-md, on_surface_variant.

Right-aligned header action: "+ Add Field" button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium, on_primary text).

Custom Field List:
- No outer table border. Each field is a card row: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05), 4px vertical gap. No borders.
- Row contents (left to right):
  - Field type icon (20px, on_surface_variant): Text (T), Number (#), Date (calendar), Dropdown (chevron list), Checkbox (tick square). Reflects the field type visually before the name.
  - Field name in Plus Jakarta Sans Medium, on_surface.
  - Field type label: label-sm on_surface_variant (e.g. "Text", "Dropdown", "Date").
  - Scope badge: pill (24px radius). "Team-scoped" — surface_container_low fill, on_surface_variant. "Project-scoped" — tertiary (#d0c3ba) fill, on_surface. Scope target name in label-sm appended: "Alpha Team" or "Project X".
  - Status badge: "Active" — soft green tonal fill, on_surface text, 24px radius pill. "Archived" — surface_container_low fill, on_surface_variant text — visually quiet.
  - Task usage count: label-sm on_surface_variant, right of scope badge. E.g. "Used in 34 tasks."
  - Action icons (right-aligned, visible on row hover): Edit (pencil, on_surface_variant, 20px) and Archive (box-archive icon, on_surface_variant, 20px). Archived fields show a Restore icon instead of Archive.
- Archived fields: entire row receives surface_container_low background (one tone cooler) and all text shifts to on_surface_variant — the field visually recedes without being removed.

Filter pill tabs above the list: "All" · "Active" · "Archived". Same tab style as My Tasks status tabs (Indigo-Slate underline on active, on_surface_variant inactive). No card background on tab row.

Skeleton loader: shimmer rows with icon placeholder, two text block placeholders, two badge placeholders.
Empty state (no fields): centred icon (sliders), headline "No custom fields yet.", body "Add fields to capture extra data on tasks for your team." CTA "+ Add Field" (Indigo-Slate gradient pill).
Empty state (Archived tab): "No archived fields." No CTA.
```

💡 *Tip: Field type icons left of the name allow managers to scan the list by type at a glance — especially useful when a team has many fields across types.*

---

## MODALS

---

**🎨 Stitch Prompt — Modal M10: Add / Edit Custom Field — Sunday**

```
Design the Add / Edit Custom Field modal for Sunday. Triggered by "+ Add Field" or the Edit action on Custom Field Management.

Glassmorphism overlay (80% surface opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06)).
Card: surface_container_lowest (#ffffff), 24px radius, ambient shadow. Max-width 520px. Centred.

Header: "Add Custom Field" or "Edit Custom Field" in headline-sm, on_surface. × close icon (on_surface_variant, 24px) far right.

Fields (stacked, 12px vertical gap between fields):

1. Field Name — full-width text input, 48px radius, surface_container_low fill. Label "Field name" in label-sm on_surface_variant. Required. Validation: unique per scope. Placeholder "e.g. Client, Sprint, Risk Level".

2. Field Type — segmented pill group (horizontal, scrollable on narrow screens):
   Segments: "Text" · "Number" · "Date" · "Dropdown" · "Checkbox"
   Each segment: pill, 48px radius. Selected: Indigo-Slate gradient fill, on_primary text, Plus Jakarta Sans Medium. Unselected: surface_container_low fill, on_surface_variant text.
   Each segment has a leading icon (16px, matching the type icon from the list screen).

3. Dropdown Options Editor (conditional — only visible when Field Type = Dropdown):
   - Animates in with a smooth height reveal (200ms ease-out) when Dropdown is selected. Fully collapses when any other type is selected.
   - Section sub-label "Options" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
   - Each option: a row with a drag handle icon (⠿, on_surface_variant, left) + text input (48px radius, surface_container_low fill) + × remove button (on_surface_variant, 16px, right).
   - Options are reorderable by drag. Drag handle cursor: grab. On drag: same ghost + placeholder pattern as Kanban cards.
   - "＋ Add option" link below the option list: label-sm, Indigo-Slate (#4d556a). Appends a new empty option row with a smooth height animation.
   - Minimum 2 options required. If fewer than 2 are present, the footer "Save" button is visually quieted (surface_container_low fill, on_surface_variant text) and a helper note below the options reads: label-sm on_surface_variant "At least 2 options are required."

4. Scope Type — segmented pill group: "Team-scoped" · "Project-scoped". Same segment style as Field Type.

5. Scope Target (conditional):
   - "Team-scoped" selected: searchable Team dropdown (24px radius, surface_container_low fill). Scoped to manager's accessible teams.
   - "Project-scoped" selected: searchable Project dropdown (24px radius, surface_container_low fill). Scoped to manager's accessible projects.
   - Both animate in/out with smooth height transitions matching the Dropdown Options conditional pattern.
   - Helper note below: label-sm on_surface_variant "This field will appear on tasks within the selected scope only."

Footer (sticky):
- "Cancel" (tertiary fill #d0c3ba, 48px radius) · "Save Field" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium). Right-aligned.
- Inline validation on blur per field. On failed submit: warning banner at top of form (surface_container_low background, warm left strip, label-md on_surface_variant).
```

💡 *Tip: The conditional Dropdown Options editor appearing inline (not a separate step) keeps the form feeling unified — the user sees the complete configuration of their field in one view.*

---

**🎨 Stitch Prompt — Modal M11: Archive Custom Field Confirm — Sunday**

```
Design the Archive Custom Field Confirm modal for Sunday. Triggered by the Archive action on Custom Field Management.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 480px. Centred.

Header: "Archive this field?" in headline-sm, on_surface. × close icon.

Body:
- Field name shown in Plus Jakarta Sans Medium, on_surface (read-only context, not a form field). Below it: the field type label in label-sm on_surface_variant.
- Warning body in label-md, on_surface_variant: "Archiving this field will hide it from new task creation and the task editor. Existing task values using this field are preserved — they will remain visible on tasks where they were already set."
- Usage context: label-md on_surface_variant "This field is currently used in [N] tasks." — N pulled from the task count on the list screen.
- A tertiary (#d0c3ba) left accent strip on the warning paragraph (3px left border at full paragraph height — the one acceptable border in this system) makes the informational warning visually distinct without using red or alarming colour.

Footer: "Cancel" (tertiary fill, 48px radius) · "Archive Field" (surface_container fill, on_surface text — muted, not red, not gradient — the same quiet destructive pattern used throughout Sunday). Right-aligned.
```

💡 *Tip: The tertiary warm accent strip on the warning paragraph signals "pay attention" without signalling "danger" — consistent with Sunday's non-alarming approach to destructive actions.*

---

**🎨 Stitch Prompt — Modal M12: Save View — Sunday**

```
Design the Save View modal for Sunday. Triggered by the "Save View" button on the Task Board.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 440px. Centred.

Header: "Save current view" in headline-sm, on_surface. × close icon.

Context note (below header, above fields): label-md on_surface_variant "The current filter combination will be saved as a named view." Filters currently active are shown as a read-only chip row (same pill chip style as the filter bar — surface_container fill, 24px radius, label-sm on_surface_variant, no × remove). If no filters are active: note reads "No filters are currently applied. You can still save this as a blank view."

Fields:
1. View Name — full-width text input, 48px radius, surface_container_low fill. Label "View name" in label-sm on_surface_variant. Required. Unique within personal scope. Placeholder "e.g. My Overdue High Priority Tasks".

2. Share with team toggle (visible only to Manager+ roles):
   - A toggle row below the name field: label "Share with team" in label-md on_surface. Toggle switch right-aligned — On: Indigo-Slate fill; Off: surface_container_low fill.
   - When toggled on: helper text below in label-sm on_surface_variant "Team members will see this view in their Saved Views dropdown."
   - For Employee role: this toggle is not rendered — personal views only, no mention of the sharing feature.

Footer: "Cancel" (tertiary fill, 48px radius) · "Save View" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium). Right-aligned.
On save: modal closes. Success toast: "View saved — '[View Name]'". The new view immediately appears in the Saved Views dropdown, highlighted as the active view.
```

💡 *Tip: Showing the active filter chips inside the modal gives the user a final confirmation of what they're saving — preventing confusion about what "the current view" contains.*

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 3

---

**🎨 Stitch Prompt — Custom Field Renderer Component — Sunday**

```
Design the Custom Field Renderer component for Sunday. Used wherever custom fields appear: the Task Detail right sidebar and the Task Creation Modal (M1).

The renderer outputs a different control depending on the field type. All controls follow Sunday's established input language.

Shared anatomy for all types:
- Field label: label-sm Plus Jakarta Sans Medium, on_surface_variant. Above the control.
- 12px vertical gap between the label and the control, and 16px vertical gap between separate custom field entries.
- No section divider between custom fields — gap and typography hierarchy alone provide separation.

Per field type:

Text:
- Input: 48px radius, surface_container_low fill, no border. Placeholder in on_surface_variant.

Number:
- Input: 48px radius, surface_container_low fill, +/− stepper icons right-aligned inside the field (on_surface_variant, 16px each). Accepts numeric input only.

Date:
- Input: 48px radius, surface_container_low fill, calendar icon right-aligned inside the field (on_surface_variant, 16px). Opens a glassmorphism date picker panel on click (24px radius, 80% surface opacity, 20px blur, ambient shadow).

Dropdown:
- Select: 24px radius, surface_container_low fill, chevron down right-aligned, on_surface_variant label. Options panel: glassmorphism dropdown (24px radius, 80% opacity, 20px blur, ambient shadow). Each option: label-md on_surface, 8px vertical gap between options, hover: surface_container_high fill.

Checkbox:
- A toggle switch layout: label text in label-md on_surface (the field name acts as the toggle label). Toggle right-aligned — On: Indigo-Slate fill; Off: surface_container_low fill plus ghost border at outline_variant 15% opacity.

Task Detail sidebar placement:
- Custom fields appear below the standard metadata fields, separated by a label-sm section header: "Custom Fields" in on_surface_variant Plus Jakarta Sans Medium, with 20px top space above it (editorial sky).
- Inline-edit on hover follows the same pattern as all sidebar fields: surface_container_high tonal background on hover, pencil icon appears right.

Task Creation Modal (M1) placement:
- Custom fields relevant to the selected project or team scope appear in a collapsible "Additional Fields" section at the bottom of the form.
- "▾ Additional Fields" expand link in label-sm Indigo-Slate. Expanding reveals custom field controls with a smooth height animation. Collapsed by default to keep the modal lean.

Archived custom field values (Task Detail only):
- If a task has a value for a now-archived field, it is shown in read-only format with an "Archived field" label-sm pill (surface_container fill, 24px radius, on_surface_variant) beside the field name. The value is visible but the control is not editable — no input rendered, just a text display of the value.
```

💡 *Tip: Collapsing custom fields in the Task Creation Modal by default keeps the creation experience fast — managers who need them expand, everyone else isn't slowed down.*

---

**🎨 Stitch Prompt — Kanban Board: Mobile Responsive Layout — Sunday**

```
Design the mobile-responsive adaptation of the Kanban Task Board for Sunday.

On screens below 768px width, the four-column horizontal Kanban layout is not feasible. Adapt as follows:

Mobile layout:
- The column area becomes a horizontal scroll container. Each column is 80vw wide (never full-width — the next column is partially visible, signaling horizontal scrollability).
- A subtle fade-out gradient on the right edge of the viewport (surface_container_low to transparent, 32px wide) signals additional columns exist.
- A horizontal scroll indicator: four dots below the columns (matching the four columns). Active column: Indigo-Slate gradient dot (8px diameter). Inactive: surface_container fill (6px). Scrolling between columns animates the active dot. 24px radius on active dot.

Filter bar on mobile:
- Collapsed by default into a single "Filter" pill button (surface_container_low fill, 48px radius, filter icon, on_surface_variant label, filter count badge if active). Tapping expands the filter bar as a slide-down panel below the header. Each dropdown occupies full width. Stacked vertically.
- Active filter chips appear in a horizontally scrollable row below the "Filter" button when filters are applied (filters are not expanded all the time).

Dragging on mobile:
- Long-press on a task card (400ms hold) initiates drag mode. Card elevates (ambient shadow deepens), haptic feedback if available. User can drag horizontally between columns. Columns scroll to accommodate.
- Column drop zones expand slightly in height during drag to create a larger target area.
```

💡 *Tip: Showing 80vw columns (not 100vw) is critical — users must see the edge of the next column or they won't discover horizontal scroll exists.*

---

*All prompts above are ready to paste directly into Stitch. Recommended order: start with the Kanban layout and column structure, establish the draggable card, then wire the drag business rules, then the filter/saved views system, then Custom Field Management, then modals M10–M12, and finally the Custom Field Renderer component.*
