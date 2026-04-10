# Stitch Prompts — Sprint 4 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 4 Dependency:** Sprint 2 tasks and Sprint 1 user timezone/work-week config must be complete. The week grid is shaped by each employee's configured working days — not a universal Mon–Fri assumption.

---

## SCREEN 14 — MY WEEKLY PLAN

---

**🎨 Stitch Prompt — My Weekly Plan: Page Layout & Header — Sunday**

```
Design the My Weekly Plan screen for Sunday at route /plan or /plan/week/:weekStart. Accessible to all employees.

Full app shell present. Page header:
- Page title "My Plan" in headline-sm (1.5rem, -0.02em tracking), on_surface. Left-aligned.
- Week navigator beside the title: left chevron button (surface_container_low fill, 48px radius, on_surface_variant icon) · week label "Apr 7 – Apr 11, 2026" in label-md Plus Jakarta Sans Medium, on_surface · right chevron button (same style). Chevrons navigate to the previous and next weeks.
- Right-aligned elements:
  - Submission Status Badge (pill, 24px radius):
    "Not Submitted" — amber tonal fill, on_surface text.
    "Submitted at 9:14 AM" — soft green tonal fill, on_surface text.
    "Fluid Mode — always editable" — Indigo-Slate soft tonal fill, on_surface text.
  - "Submit Plan" pill button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium) — visible ONLY for Locked mode employees. Hidden entirely for Fluid mode employees.

Overdue Deadline Warning (Locked mode only, shown when deadline has passed without submission):
- Full-width banner, pinned below the page header (not inside the main scroll area). surface_container_low background with a 4px top strip in desaturated amber. Ambient shadow below the banner.
- Content: warning icon (amber, 20px) + label-md on_surface "Your plan submission deadline has passed. Submit your plan as soon as possible." + "Submit Now" text link in Indigo-Slate, right-aligned.
- This banner cannot be scrolled past — it remains pinned at the top of the content area until the plan is submitted.
```

💡 *Tip: The overdue deadline warning being pinned (not scrollable) is intentional — missing a plan submission is a meaningful event in Sunday's accountability model and should not be ignorable.*

---

**🎨 Stitch Prompt — My Weekly Plan: Week Grid — Sunday**

```
Design the Week Grid component on the My Weekly Plan screen for Sunday.

The grid occupies the full content width below the page header. Column count is NOT fixed at 5 — it matches the employee's configured working days. A Mon–Fri employee has 5 columns; a Sun–Thu employee has 5 different columns. Never render non-working days.

Column header row:
- Each column header: day abbreviation + date (e.g. "Mon · Apr 7"). label-md Plus Jakarta Sans Medium, on_surface. Centred in the column header cell.
- Today's column header: Indigo-Slate gradient background pill (48px radius) containing the day + date, on_primary text — visually anchors the current day.
- Column headers are sticky — they remain visible when the grid scrolls vertically.

Task slot rows (within each day column):
- Each dropped task occupies one slot — a card within the column.
- Task slot card: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 12px rgba(77,85,106,0.05). No border. Full column width minus 8px column padding.
- Card contents:
  - Left edge: 3px priority stripe (muted red / amber / surface_container for High / Medium / Low).
  - Task title: label-md Plus Jakarta Sans Medium, on_surface. 1-line max, truncated.
  - Below title: a small hours input field — compact, 32px height, 24px radius, surface_container_low fill. Placeholder "0h". Typing a number sets planned hours for that task on that day.
  - Carry-over Badge (amber tonal pill, 24px radius, label-sm on_surface): "Carried over" — shown left of the hours input only on tasks automatically rolled from a previous day. Tertiary (#d0c3ba) is too warm for this; use a distinct amber: #d4820a at 15% opacity fill, on_surface text.
  - Remove icon (× button, on_surface_variant, 16px, top-right of card). Removes the task from this day slot, returning it to the unplanned pool.
- Columns have no outer border. Background of each column area: surface_container (#e8eaed) fill with 12px radius — a soft tonal tray to receive dropped tasks. Column gap: 12px.

Unplanned Task Pool (below the grid):
- Full-width area below the grid columns. Label "Unplanned Tasks" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Tasks appear as compact horizontal pills in a wrapping row: surface_container_lowest, 24px radius, ambient shadow. Contents: priority stripe as a 6px diameter dot (left of title), task title (label-md on_surface), due date (label-sm on_surface_variant).
- Dragging a pill from the pool into a day column removes it from the pool and places it as a task slot card in the column. Entry animation: card fades in and drops from above (150ms ease-out).
- Empty pool state: label-sm on_surface_variant, centred in the pool area: "All tasks are planned for this week."

Drag-and-drop between day columns: task slot cards can be dragged between columns to reassign to a different day. Same drag visual language as Sprint 3's Kanban (ghost placeholder, cursor states, ambient shadow deepens).

Mobile (below 768px): grid shows ONE day column at a time. Left/right chevron navigation (full-width tap targets, on_surface_variant chevrons) switches between days. A horizontal position indicator (5 dots, matching column count — Indigo-Slate active dot, surface_container inactive) shows which day is in view. Unplanned pool appears below the single day column.
```

💡 *Tip: The unplanned pool using pill chips (not full cards) creates a clear visual hierarchy — planned tasks on the grid are "committed", unplanned tasks in the pool are "available". Different shapes communicate different states.*

---

**🎨 Stitch Prompt — My Weekly Plan: Day Summary Footer & Manager Comments — Sunday**

```
Design the Day Summary Footer Row and Manager Comments section on the My Weekly Plan screen for Sunday.

Day Summary Footer Row (pinned at the bottom of the grid, above the unplanned pool):
- One cell per day column. Sticky at the bottom of the grid scroll area.
- Each cell: surface_container_low background, 8px radius. Contents centred: "Planned X / Available Y hrs" in label-sm Plus Jakarta Sans Medium.
- Colour-coded background of each cell:
  - Green tonal (soft #2d6a4f at 10% opacity): 80–100% utilisation.
  - Amber tonal (#d4820a at 10% opacity): 50–79% OR above 110% (overplanned).
  - Red tonal (desaturated muted red at 10% opacity): below 50% OR completely empty (0 hours).
- The footer updates in real time as tasks and hours are added or removed — numbers animate with a subtle fade-through (150ms).

Manager Comments Section (below the unplanned pool):
- Section label "Manager Comments" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- If no comments: label-sm on_surface_variant, centred: "No comments from your manager yet."
- Each comment: a card row (surface_container_lowest, 8px radius, ambient shadow, 4px vertical gap). Contains: manager avatar (32px circle) + manager name (label-md Plus Jakarta Sans Medium, on_surface) + timestamp (label-sm on_surface_variant, right) + comment body (label-md on_surface_variant) below the name row.
- Comments are read-only from the employee view. No reply input.
- Employees cannot post comments on their own plan — this section is view-only.
```

---

## SCREEN 15 — DAILY CHECK-IN

---

**🎨 Stitch Prompt — Daily Check-in Screen — Sunday**

```
Design the Daily Check-in screen for Sunday at route /checkin. All employees.

Full app shell. Page title "Morning Check-in" in headline-sm, on_surface. Subtext: today's date in label-md on_surface_variant (e.g. "Thursday, April 10, 2026").

Default (unsubmitted) state:

Pre-populated task list (pulled from today's plan):
- Section label "Your tasks for today" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Each task: surface_container_lowest card, 8px radius, ambient shadow, 4px vertical gap. No border.
  - Left: 3px priority stripe.
  - Task title in label-md Plus Jakarta Sans Medium, on_surface.
  - Below title: status badge (pill, 24px radius, status-specific tonal fill from Sprint 2) + planned hours in label-sm on_surface_variant.
  - Right: a "ready to work on" toggle — on: Indigo-Slate fill; off (blocked/deferred): surface_container_low fill with a soft amber indicator dot (8px circle). Toggle allows the employee to flag which tasks they'll actually work on vs. which they're deferring.
- If no tasks are planned for today: empty state (centred, outline calendar icon, label-md on_surface_variant "Nothing planned for today — head to your Weekly Plan to add tasks."). CTA "Go to My Plan" (Indigo-Slate gradient pill).

Optional Notes field:
- Section label "Notes" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Textarea: surface_container_lowest, 8px radius, ambient shadow, no border. Placeholder "Any blockers, context, or intentions for the day? (optional)" in on_surface_variant.

Footer:
- "Submit Check-in" button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium, full-width max 400px, centred). Only active when page is in default state.

Submitted state (after submission — replaces the form entirely):
- A soft checkmark mark icon (on_surface_variant, 48px, centred).
- Heading "Check-in submitted" in headline-sm, on_surface. Centred.
- Submitted at timestamp: label-md on_surface_variant ("Submitted at 8:47 AM"). Centred.
- Read-only task list below — same card style, but all interactive controls (toggles) are removed. Labels only.
- Read-only notes below (if any were submitted): label-md on_surface_variant in a surface_container_lowest card.
- A "View my plan" text link (label-sm, Indigo-Slate) at the bottom navigating to /plan.
```

💡 *Tip: The submitted state completely replacing the form (not disabling it) prevents any accidental re-submission attempt and signals finality — the check-in is a deliberate, once-per-day action.*

---

## SCREEN 16 — EOD WRAP-UP

---

**🎨 Stitch Prompt — EOD Wrap-up Screen — Sunday**

```
Design the EOD Wrap-up screen for Sunday at route /wrapup. All employees.

Full app shell. Page title "End of Day Wrap-up" in headline-sm, on_surface. Subtext: today's date in label-md on_surface_variant.

Planned vs Actual Table:
- No outer table border. Table sits on the #f7f9fb page background.
- Column headers (label-sm Plus Jakarta Sans Medium, on_surface_variant): Task · Planned Hours · Actual Hours · Status · Match.
- Each row: surface_container_lowest (#ffffff), 8px radius, ambient shadow, 4px vertical gap. No borders, no dividers.
- Row contents:
  - Task title (label-md Plus Jakarta Sans Medium, on_surface). Links to Task Detail on click.
  - Planned Hours (label-md on_surface): auto-filled from the weekly plan. Read-only — displayed as text, not an input.
  - Actual Hours (label-md on_surface): auto-filled from task actual hour data where available. Editable inline — clicking the value reveals a compact number input (48px radius, surface_container_low fill) with save on blur.
  - Status (status badge pill, 24px radius, task-specific tonal fill). Reflects the current task system status. Read-only.
  - Match indicator:
    Green checkmark icon (on_surface, 20px) — planned and actual hours are within 10% of each other and status is consistent.
    Amber warning icon (#d4820a, 20px) — discrepancy between planned vs actual hours OR between wrap-up status and task system status.

Discrepancy Alert (inline, per row):
- Appears below any row flagged with an amber warning icon.
- A compact inline alert bar: surface_container_low background, 3px left amber accent strip, 8px radius, ambient shadow.
- Content in label-sm on_surface_variant: describes the specific discrepancy. Examples:
  "This task is marked Done here but shows In Progress in the task system. Update the task status to resolve."
  "Actual hours (6h) significantly exceed planned hours (2h). Update if needed."
- A "Go to task" text link in Indigo-Slate within the alert, opening Task Detail.

Notes field (below the table):
- Section label "Wrap-up Notes" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Textarea (surface_container_lowest, 8px radius, ambient shadow, no border). Placeholder "Any end-of-day context, blockers for tomorrow, or outcomes to highlight? (optional)".

File Upload (below notes):
- "Attach a file (optional)" pill button (tertiary fill #d0c3ba, 48px radius, paperclip icon). After selection: file name pill chip (surface_container_high, 24px radius, × remove).

Footer:
- "Submit Wrap-up" button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium, full-width max 400px, centred below the file upload area).

Submitted state: same pattern as Daily Check-in — entire form replaced by a confirmed read-only view. Checkmark icon, "Wrap-up submitted" heading, timestamp, read-only table and notes below.
```

💡 *Tip: Auto-filling actual hours from the task system (editable but pre-filled) respects the employee's time — they're confirming and adjusting, not re-entering everything from scratch.*

---

## SCREEN 17 — TEAM PLANS VIEW

---

**🎨 Stitch Prompt — Team Plans View: Big Fat Warning Banner — Sunday**

```
Design the Big Fat Warning Banner component for the Team Plans View screen for Sunday at route /team/plans. Access: Asst Manager and above.

This banner is THE first thing a manager sees when any employee has zero planned hours on a working day. It is not subtle. It is intentionally prominent.

Banner placement: Full-width, immediately below the page header. It sits ABOVE the capacity grid — the manager cannot see the grid until they scroll past it or acknowledge warnings. It is not dismissible by scrolling.

Banner anatomy:
- Background: surface_container_low with a 4px top strip in a saturated (but not aggressive) amber (#d4820a). This is the one place in Sunday where more visual weight is applied — the gravity of unplanned employees warrants it.
- Ambient shadow below: 0px 8px 24px rgba(77,85,106,0.08) — slightly heavier than standard to make the banner feel "grounded" and unmissable.
- Banner header row: warning icon (amber #d4820a, 24px) + heading "Unplanned Employees" in label-md Plus Jakarta Sans Medium, on_surface. Right-aligned: "Acknowledge all" text link in Indigo-Slate, label-sm.

Warning entries (listed below the header row inside the banner, 8px vertical gap, no dividers):
- Each entry: a row showing employee avatar (32px circle) + employee name (label-md Plus Jakarta Sans Medium, on_surface) + "has no tasks planned for:" label-sm on_surface_variant + day pill chips (surface_container fill, 24px radius, label-sm on_surface_variant — each chip is one unplanned day, e.g. "Mon" "Wed").
- Right of each entry row: "Acknowledge" pill button (surface_container fill, 48px radius, on_surface label-sm text). Clicking opens Modal M16.
- Acknowledged entries: row dims (all text shifts to on_surface_variant) and "Acknowledged" label-sm replaces the button — the row remains visible until the page is refreshed (so the manager sees their progress).

When ALL warnings are acknowledged: the banner collapses with a smooth height animation (200ms ease-out). A brief success toast: "All warnings acknowledged" appears.

When no unplanned employees exist: the banner is not rendered — no empty banner state, no placeholder.
```

💡 *Tip: Acknowledged entries staying visible (dimmed) rather than disappearing immediately gives the manager a sense of completion and prevents "did I acknowledge that?" doubt.*

---

**🎨 Stitch Prompt — Team Plans View: Capacity Grid — Sunday**

```
Design the Capacity Grid on the Team Plans View screen for Sunday.

Full app shell. Page title "Team Plans" in headline-sm, on_surface. Subtext reflects scope: "Alpha Team — week of Apr 7" in label-md on_surface_variant. Week navigator (same chevron + week label pattern as My Weekly Plan) right of the subtext.

Submission status summary row (between page header and Big Fat Warning Banner):
- A horizontal row of submission status pill chips — one per team member. Each shows: avatar (24px circle) + first name + submission status icon. "Submitted" — soft green dot. "Not submitted" — amber dot. "Fluid mode" — Indigo-Slate dot. Chips use surface_container_lowest fill, 24px radius, ambient shadow. Scrolls horizontally if overflow.

Big Fat Warning Banner (above the grid, as designed in the previous prompt).

Capacity Grid table (below the banner):
- Left column: employee name column (fixed, does not scroll). Each row: avatar (36px circle) + full name (label-md Plus Jakarta Sans Medium, on_surface) + submission status badge (pill, 24px radius, matching colours above). Row height: 56px.
- Day columns: one per working day in the team's schedule. Column header: day abbreviation + date, label-sm Plus Jakarta Sans Medium, on_surface_variant, centred. Today's column header highlighted with Indigo-Slate gradient pill (same pattern as My Weekly Plan).
- Each cell: shows "X / Y hrs" — planned hours / available hours. label-md Plus Jakarta Sans Medium, on_surface.
- Cell background colour coding:
  Green tonal (#2d6a4f at 10% opacity): 80–100%.
  Amber tonal (#d4820a at 10% opacity): 50–79% OR above 110%.
  Red tonal (desaturated muted red at 10% opacity): below 50% or zero.
  Zero hours on a working day: red tonal + a small amber warning dot (8px circle, #d4820a) top-right inside the cell.
- All cells: 8px radius. 4px gap between cells (horizontal and vertical). No borders — tonal fill defines each cell's boundary against the surface_container_low grid background.
- Cell hover: ambient shadow deepens, cursor: pointer. Clicking a cell opens a popover (glassmorphism: 80% opacity, 20px blur, ambient shadow, 24px radius) listing that employee's tasks for that day — same compact task row style as the My Weekly Plan slot cards.

Row hover: entire employee row (name + all day cells) receives surface_container_high tonal shift — no border.
Comment icon button (speech bubble icon, on_surface_variant, 20px) appears at the far right of each employee row on hover. Clicking opens Modal M15 (Plan Comment drawer).

Overdue completion rate section (below the grid):
- Section label "Completion Rates — This Week" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- One row per employee: name + a horizontal progress bar. Bar: surface_container fill track, Indigo-Slate gradient fill (progress at percentage of done tasks vs planned tasks). Width: full remaining column width. Height: 8px, 48px radius. Percentage label right of the bar: label-sm Plus Jakarta Sans Medium, on_surface.
- Colour coding on filled portion: green (≥80%), amber (50–79%), red (<50%).
```

💡 *Tip: The submission status summary chips above the grid give the manager a one-glance check of who's submitted before they even engage with the main grid — no need to scan the full grid for that info.*

---

## MODAL M15 — PLAN COMMENT DRAWER

---

**🎨 Stitch Prompt — Modal M15: Plan Comment Drawer — Sunday**

```
Design the Plan Comment drawer for Sunday. Triggered by the comment icon on a Team Plans employee row.

This is a right-side drawer, not a centred modal. It slides in from the right edge of the viewport (300ms ease-out). Width: 400px on desktop, full-width on mobile. A semi-transparent scrim (surface at 40% opacity) covers the rest of the page without glassmorphism — the drawer itself is solid.

Drawer panel: surface_container_lowest (#ffffff). No border on the left edge — ambient shadow on the drawer's left side (0px 0px 32px rgba(77,85,106,0.10)) provides the edge.

Drawer header (top, not sticky — scrolls with content):
- Employee avatar (40px circle) + employee name in headline-sm, on_surface. Left-aligned.
- Week label below name: label-sm on_surface_variant "Plan for Apr 7 – Apr 11, 2026".
- × close button (on_surface_variant, 24px) far right of the header row.

Comment thread (scrollable, takes most of the drawer height):
- Comments listed with newest at the top. Oldest at the bottom.
- Each comment card: surface_container_low fill, 8px radius, 8px vertical gap. No borders.
  - Manager avatar (32px circle) + manager name (label-md Plus Jakarta Sans Medium, on_surface) + timestamp (label-sm on_surface_variant, right).
  - Comment body: label-md on_surface_variant below the name/timestamp row.
- Manager can edit or delete their own comments — edit (pencil icon, 16px) and delete (trash icon, 16px) appear on card hover. Edit reveals the textarea inline with the comment replaced by an editable surface. Delete: confirmation via a small inline "Delete?" Yes/No prompt within the card — no separate modal.
- Empty state: centred within the thread area. label-md on_surface_variant "No comments yet. Add the first one below."
- Employees read comments here too — but they cannot see the input field (employees only see this display via their own plan's Manager Comments section).

New Comment input (pinned at the bottom of the drawer):
- Textarea: surface_container_low fill, 8px radius, no border. Placeholder "Add a comment on [Employee Name]'s plan…"
- Below textarea, right-aligned: "Post Comment" pill button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium). Active only when textarea has content.
- Character limit: 1000. Counter label-sm on_surface_variant bottom-right.

On post: comment animates into the thread at the top (fade + slide from right, 200ms). Input clears. Toast: "Comment posted."
```

💡 *Tip: Inline edit/delete on comments (no separate modal for delete confirmation) keeps the interaction lightweight — managers frequently refine comments and a confirmation modal would be friction-heavy in a communication tool.*

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 4

---

**🎨 Stitch Prompt — Submission Status Badge — Sunday**

```
Design the Submission Status Badge component for Sunday. Used on the My Weekly Plan header and the Team Plans View submission summary row.

Three variants, all pill-shaped at 24px radius:

"Not Submitted":
- Background: amber tonal (#d4820a at 12% opacity).
- Icon: clock outline (16px, #d4820a).
- Text: label-sm Plus Jakarta Sans Medium, on_surface "Not Submitted".

"Submitted at [time]":
- Background: soft green tonal (#2d6a4f at 10% opacity).
- Icon: checkmark circle (16px, soft green #2d6a4f).
- Text: label-sm Plus Jakarta Sans Medium, on_surface "Submitted at 9:14 AM".

"Fluid Mode — always editable":
- Background: Indigo-Slate soft tonal (#4d556a at 10% opacity).
- Icon: pencil (16px, #4d556a).
- Text: label-sm Plus Jakarta Sans Medium, on_surface "Fluid Mode".

No borders on any variant — tonal fill alone defines each badge against a white or light surface background.
```

---

**🎨 Stitch Prompt — Carry-over Badge — Sunday**

```
Design the Carry-over Badge component for Sunday. Displayed on task slot cards in the Week Grid when a task has been automatically rolled over from a previous day by the background carry-over job.

Badge style: pill, 24px radius. Background: amber tonal (#d4820a at 12% opacity). Icon: rotate/refresh arrow (14px, #d4820a, left of text). Text: "Carried over" in label-sm Plus Jakarta Sans Medium, on_surface.

Placement: below the task title, left-aligned, before the planned hours input field. The badge does not replace any other element — it inserts above the hours row.

Tooltip on hover (glassmorphism: 80% opacity, 20px blur, ambient shadow): "This task was not completed on [original day] and has been automatically moved to today."

The badge is informational only — no interaction. It disappears if the employee removes the task from the slot and re-adds it manually.
```

---

*All prompts above are ready to paste directly into Stitch. Recommended order: My Weekly Plan layout → Week Grid → Day Summary Footer + Manager Comments → Daily Check-in → EOD Wrap-up → Team Plans Big Fat Warning Banner → Capacity Grid → Plan Comment Drawer → Shared component badges.*
