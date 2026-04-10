# Stitch Prompts — Sprint 5 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 5 Dependency:** Sprints 2, 3, and 4 must be complete. Dashboard widgets aggregate task data (Sprint 2), custom field data (Sprint 3), and plan/check-in data (Sprint 4). Nothing meaningful to display without all three.

---

## SCREEN 18 — DASHBOARD: MY OVERVIEW

---

**🎨 Stitch Prompt — Dashboard My Overview: Layout & Widget Grid — Sunday**

```
Design the My Overview dashboard screen for Sunday at route /dashboard. Default landing page after login for all roles.

Full app shell. Page title "Good morning, [First Name]." in headline-sm (1.5rem, -0.02em tracking), on_surface. Subtext: today's date and day in label-md on_surface_variant — "Thursday, April 10, 2026." Asymmetric top padding — twice the top space as bottom space under the title to create editorial sky.

Widget grid layout (below page header):
- Two-column widget grid on desktop. Four widget cards: "Today's Tasks" (left, taller), "Weekly Completion Rate" (right, shorter), "Upcoming Deadlines" (right, shorter), "Carry-overs" (left, shorter). On mobile: all four stack in a single column.
- Widget cards: surface_container_lowest (#ffffff), 16px radius, ambient shadow 0px 8px 32px rgba(77,85,106,0.06). No border. Generous internal padding (24px), asymmetric top padding (28px above widget headings).

Widget 1 — "Today's Tasks":
- Widget heading "Today's Tasks" in label-md Plus Jakarta Sans Medium, on_surface. Task count chip (surface_container fill, 24px radius, label-sm on_surface_variant) beside the heading: e.g. "6 tasks".
- Task list inside the widget: compact task rows. Each row: 4px vertical gap, no card, no borders. Just priority dot (8px circle, coloured per priority) + task title (label-md on_surface, truncated 1 line) + status badge (pill, 24px radius, status-specific tonal fill, label-sm) + due time (label-sm on_surface_variant, right-aligned).
- Overdue tasks in the list: title text in muted desaturated red, due date shows "Overdue" in the same muted red.
- "View all" text link at the bottom of the widget (label-sm, Indigo-Slate) navigating to /tasks.
- Clicking any task row navigates to Task Detail.

Widget 2 — "Weekly Completion Rate":
- Widget heading "This Week" in label-md Plus Jakarta Sans Medium, on_surface.
- A large donut chart, centred in the widget. Outer ring: surface_container_low track. Filled arc: Indigo-Slate gradient. Donut hole: display-md percentage number (e.g. "72%") in on_surface, Plus Jakarta Sans Medium — tight -0.02em tracking. Below the number: label-sm on_surface_variant "tasks done".
- Colour coding of the filled arc: green (#2d6a4f) at ≥80%, Indigo-Slate at 50–79%, amber (#d4820a) below 50%.
- Raw numbers below the chart: "9 of 14 tasks completed" in label-sm on_surface_variant, centred.

Widget 3 — "Upcoming Deadlines":
- Widget heading "Due in 3 Days" in label-md Plus Jakarta Sans Medium, on_surface.
- At most 3 task entries. Same compact row style as Today's Tasks, but the right-aligned element is the due date ("Tomorrow" / "Apr 12") in label-sm on_surface_variant.
- "See all deadlines" text link at bottom → /tasks filtered by due date.
- Empty (All Clear) state: centred within the widget. Soft checkmark icon (on_surface_variant, 24px). label-md on_surface_variant "No deadlines in the next 3 days." No CTA.

Widget 4 — "Carry-overs":
- Widget heading "Carried Over" in label-md Plus Jakarta Sans Medium, on_surface. Amber dot (8px, #d4820a) beside the heading if any carry-overs exist.
- Same compact task row style. Carry-over badge (amber tonal, 24px radius, "Carried over" label-sm) shown per row — same badge component from Sprint 4.
- "Go to plan" text link at bottom → /plan.
- Empty (All Clear) state: centred. Soft check icon. label-md on_surface_variant "No carry-overs — you're all caught up."

Fresh Start state (new employee with no tasks):
- All four widget cards are shown, but each contains the same centred state: outline icon + "Nothing here yet" heading + 1 sentence of guidance specific to the widget (e.g. "Your assigned tasks will appear here." / "Completion data will show once you have tasks.").
- No error tone — these are warm, welcoming empty states. Tertiary (#d0c3ba) accent on the icon colours.
```

💡 *Tip: Using a donut chart for completion rate (not a bar) creates the "high-contrast visual moment" specified in the design system — display-md numbers inside the hole immediately draw the eye.*

---

## SCREEN 19 — DASHBOARD: TEAM PULSE

---

**🎨 Stitch Prompt — Dashboard Team Pulse Screen — Sunday**

```
Design the Team Pulse dashboard screen for Sunday at route /dashboard/team-pulse. Access: Asst Manager and above. Employees hitting this route directly see the 403 screen from Sprint 1.

Full app shell. Page title "Team Pulse" in headline-sm, on_surface. Subtext showing scope in label-md on_surface_variant: "Alpha Team — [current week]" (Manager) or "Design Department — [current week]" (Senior Manager / Admin).

Big Fat Warning Zone (same component designed in Sprint 4 — full-width, unmissable, above the grid, requires acknowledgement via M16 instead of the Sprint 4 dismiss). If no unplanned employees: zone not rendered.

Capacity Grid (below warning zone):
- Same visual structure and cell colour coding as the Team Plans View capacity grid from Sprint 4.
- Left column: fixed, shows employee name + avatar + completion rate percentage (label-sm on_surface_variant below the name — e.g. "64% done").
- Day columns: matching each working day this week. Today highlighted with Indigo-Slate gradient column header pill.
- Each cell: "X / Y hrs" · colour-coded background (green / amber / red thresholds from Sprint 4).
- Cell click: glassmorphism popover listing that employee's planned tasks for the day.
- Row hover: surface_container_high shift. Comment icon on hover (far right) opens M15 Plan Comment drawer.

Overdue Tasks Section (below the capacity grid):
- Section label "Overdue Tasks — Your Team" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Each overdue task: surface_container_lowest card row, 8px radius, ambient shadow, 4px gap. Contents: task title (label-md Plus Jakarta Sans Medium, muted desaturated red) + assignee avatar + assignee name (label-sm on_surface_variant) + "[N] days overdue" pill (muted red tonal fill, 24px radius, label-sm). Clicking row navigates to Task Detail.
- Empty state: soft check icon + "No overdue tasks in your team." label-md on_surface_variant. No CTA.

Completion Rate Per Employee (below overdue section):
- Section label "Completion Rates" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Each employee row: avatar + name + horizontal progress bar + percentage. Same design as Team Plans completion rate section from Sprint 4 — green / amber / red fill based on thresholds.
```

💡 *Tip: The Big Fat Warning Zone appearing before the grid means the manager must visually encounter unplanned employees before reaching the analytical grid — this ordering is not cosmetic, it's the accountability model.*

---

## SCREEN 20 — DASHBOARD: WORKLOAD VIEW

---

**🎨 Stitch Prompt — Dashboard Workload View Screen — Sunday**

```
Design the Workload View dashboard screen for Sunday at route /dashboard/workload. Access: Manager and above.

Full app shell. Page title "Workload" in headline-sm, on_surface. Subtext: scope + week in label-md on_surface_variant. Week navigator (chevron + week label, same pattern as My Weekly Plan).

Freshness indicator (top-right of page header, beside the week navigator):
- label-sm on_surface_variant: "Updated 3 minutes ago." with a soft refresh icon (16px, on_surface_variant) that rotates (360° animation, 600ms ease-in-out) when the data refreshes in the background. Clicking the icon forces a manual refresh.

Workload Grid (same structural layout as Capacity Grid):
- Left column: employee name + avatar + a utilisation delta badge: "↑ +2h" or "↓ -1h" (label-sm, green for under-utilised/on-track, amber for overloaded) — showing planned vs actual delta summary for the week.
- Day columns: each working day. Today highlighted.
- Each cell content: "Planned Xh / Actual Yh". Actual hours auto-populated from task completion logs and EOD wrap-up submissions.
- Cell background colour coding (same thresholds as capacity grid, but calculated from planned/available ratio):
  - Green: actual ≈ planned (within 10%).
  - Amber: actual is 10–40% over or under planned.
  - Red: actual is >40% over or under planned, or planned is zero.
- Cells update near-real-time as tasks are completed — no full page refresh. Cells that refresh animate their number with a subtle fade-through (150ms).
- Cell hover: glassmorphism popover. Shows: employee name, day, planned hours, actual hours, list of tasks completed that day with their hours. Compact task rows: title + actual hours label-sm on_surface_variant.

No Big Fat Warning Banner on this screen (that lives on Team Pulse). This screen is analytical rather than alerting.
```

💡 *Tip: The rotating refresh icon is a subtle "alive" indicator — it communicates that the data is fresh without requiring the manager to understand polling intervals.*

---

## SCREEN 21 — ACTIVITY FEED

---

**🎨 Stitch Prompt — Activity Feed Screen — Sunday**

```
Design the Activity Feed screen for Sunday at route /dashboard/activity. All authenticated roles (scoped).

Full app shell. Page title "Activity" in headline-sm, on_surface. Subtext in label-md on_surface_variant — scope-dependent: "Your recent activity" (Employee) or "Your team's activity" (Manager+) or "Your department's activity" (Senior Manager).

Activity Type Filter (below page header):
- A horizontally scrollable multi-select chip row. Each chip: 24px radius pill. Inactive: surface_container_low fill, on_surface_variant text. Selected: Indigo-Slate gradient fill, on_primary text.
- Filter options: "Task Created" · "Status Changed" · "Plan Submitted" · "Check-in Submitted" · "Wrap-up Submitted" · "Comment Added" · "Assignment Changed" · "Custom Field Edited".
- "All" chip at the far left — selecting it deselects all others and shows everything. When individual chips are selected, "All" deselects.
- Filter updates the feed in real time without page refresh.

Activity Feed (below filter):
- No outer container border. Feed entries on the #f7f9fb page background.
- Each entry: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 12px rgba(77,85,106,0.05), 4px vertical gap.
- Entry anatomy (horizontally arranged):
  - Left: actor avatar (36px circle with initials or photo) + a type indicator dot overlaid at the avatar's bottom-right corner (10px circle, coloured by event type: Indigo-Slate for status changes, tertiary #d0c3ba for comments, amber for plan events, soft green for completions).
  - Centre: action text in label-md, on_surface. Format: "[Actor Name] [action verb] [object name]." Linked object names (task titles, plan week, etc.) are rendered in Plus Jakarta Sans Medium weight and Indigo-Slate colour — they are clickable links navigating to the resource.
    Examples:
    "Ahmed changed Design Review status to In Review."
    "Sara submitted her plan for Apr 7 – Apr 11."
    "Lena commented on the task UX Audit Report."
  - Right: relative timestamp — "3 min ago" / "Yesterday at 2:15 PM". label-sm on_surface_variant. Hovering reveals ISO full timestamp in a glassmorphism tooltip.

Unread indicator: if an activity entry is new since the user last visited the feed, a small Indigo-Slate dot (8px diameter) appears to the left of the entry card (outside the card, in the 4px gap space).

Infinite scroll / Load more:
- A "Load earlier activity" pill button (surface_container_low fill, 48px radius, on_surface_variant text) centred below the last loaded entry — appears once the initial batch (25 entries) is fully visible. Clicking loads the next 25 with a smooth append animation.
- When no more entries exist: label-sm on_surface_variant, centred "You've reached the beginning of the activity log."

Empty state (no activity yet, or filters return nothing): centred outline activity icon, headline "No activity yet.", body label-md on_surface_variant adjusted to context ("Your team's actions will appear here as they work." or "Try removing some filters.").
```

💡 *Tip: Colour-coding the avatar type indicator dot (not the entry background) keeps the feed visually quiet while still allowing rapid scanning by event type — colour signals type without dominating the reading experience.*

---

## MODAL M16 — BIG FAT WARNING ACKNOWLEDGE

---

**🎨 Stitch Prompt — Modal M16: Big Fat Warning Acknowledge — Sunday**

```
Design the Big Fat Warning Acknowledge modal for Sunday. Triggered by clicking "Acknowledge" on a warning entry in the Big Fat Warning Banner on Team Pulse (and in Sprint 4's Team Plans View).

This modal cannot be closed without completing acknowledgement. There is no × close button. The only exit is through the "Acknowledge" action or "Cancel" (which does nothing to the warning — it remains unacknowledged).

Glassmorphism overlay: 80% surface opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06). The blur effect amplifies the sense that this requires attention.
Card: surface_container_lowest (#ffffff), 24px radius, ambient shadow. Max-width 480px. Centred.

Header: "Acknowledge Unplanned Days" in headline-sm, on_surface. No close icon.

Body:
- Employee avatar (40px circle) + employee name in label-md Plus Jakarta Sans Medium, on_surface. Row below: reporting to label in label-sm on_surface_variant.
- Warning description in label-md on_surface_variant: "[Employee Name] has no tasks planned for the following working days this week:"
- Unplanned day pills (same chip style as the Banner): surface_container fill, 24px radius, label-sm on_surface_variant. One chip per unplanned day.
- Amber tonal info note (surface_container_low bg, 3px amber left strip, 8px radius): label-sm on_surface_variant "Acknowledging creates an audit log entry — it does not resolve the issue. Follow up with [Employee Name] directly."

Acknowledgement explanation textarea (below the note):
- Label "Add a note (optional)" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Textarea: surface_container_lowest, 8px radius, ambient shadow, no border. Placeholder "e.g. Employee is on leave, or tasks have been added offline…"
- Max 500 characters. Counter label-sm on_surface_variant bottom-right.

Footer (right-aligned):
- "Cancel" (tertiary fill #d0c3ba, 48px radius) — exits the modal, warning remains unacknowledged.
- "Acknowledge" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium) — logs the acknowledgement (with note if provided) to the audit trail and marks the warning entry as acknowledged in the banner.
```

💡 *Tip: The optional note textarea turns the acknowledgement into a meaningful management action, not just a click-through — it creates a richer audit trail and encourages managers to record their reasoning.*

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 5

---

**🎨 Stitch Prompt — Overview Widget Card Component — Sunday**

```
Design the Overview Widget Card base component for Sunday's My Overview dashboard.

Card container: surface_container_lowest (#ffffff), 16px radius, ambient shadow 0px 8px 32px rgba(77,85,106,0.06). No border. Internal padding: 24px horizontal, 28px top, 20px bottom — the asymmetric top padding creates editorial sky above the widget heading.

Widget heading: label-md Plus Jakarta Sans Medium, on_surface. Left-aligned.
Supplementary badge (optional, beside heading): surface_container fill, 24px radius, label-sm on_surface_variant — shows counts or short context labels (e.g. "6 tasks", "3 overdue").

Content area: occupies the remaining card height. Content type varies by widget (task list, donut chart, progress bars, carry-over rows). Content area has no internal border or divider separating it from the heading — vertical spacing achieves separation.

Footer link (optional, always the last element in the card): label-sm Indigo-Slate (#4d556a), left-aligned. "View all →" or "Go to plan →" style. Underline on hover.

Empty state (within the card, replaces content area): centred. Outline icon (24px, on_surface_variant). label-md on_surface_variant message. Optional tertiary-toned icon colour for welcome/fresh states.

On mobile: widget cards stack in a single column, full-width. Donut chart in Widget 2 scales down proportionally (max 160px diameter on mobile).
```

---

**🎨 Stitch Prompt — Activity Entry Component — Sunday**

```
Design the Activity Entry component for Sunday's Activity Feed.

Container: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 4px 12px rgba(77,85,106,0.05). 4px vertical gap between entries. No border.

Internal layout (horizontal flex, 12px gap):
- Left: actor avatar stack. 36px circle (initials or photo). At the avatar's bottom-right: a 10px event type indicator dot with a 1.5px surface_container_lowest ring to separate it from the avatar. Dot colour per type:
  - Status Changed: Indigo-Slate (#4d556a).
  - Completion / Done: soft green (#2d6a4f).
  - Plan / Check-in / Wrap-up events: amber (#d4820a).
  - Comment Added: tertiary (#d0c3ba) — filled, not outline.
  - Assignment Changed: on_surface_variant.
  - Task Created: Indigo-Slate soft tonal.
- Centre: action text in label-md on_surface. Plus Jakarta Sans Regular. Linked object names in Medium weight and Indigo-Slate (#4d556a) colour — clickable. 1-line preferred, wraps to 2 lines maximum.
- Right: timestamp in label-sm on_surface_variant. Right-aligned, no wrap.

Unread state: a small Indigo-Slate (#4d556a) dot (8px diameter) in the 4px gap to the left of the card. No background change on the card itself — the dot is sufficient.

Hover: surface_container_high tonal background shift on the card. No border on hover.
```

---

*All prompts above are ready to paste directly into Stitch. Recommended order: My Overview widget grid → individual widget states → Team Pulse (Big Fat Warning Banner first, then Capacity Grid) → Workload View → Activity Feed → Modal M16 → shared components.*
