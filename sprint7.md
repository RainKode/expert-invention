# Stitch Prompts — Sprint 7 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 7 Dependency:** Sprints 2 and 3 must be complete — search indexes task data (Sprint 2) and custom field values (Sprint 3). The global search bar was installed as an empty placeholder in Sprint 1's App Shell — this sprint makes it functional. No new full screens are built; existing components are extended.

---

## APP SHELL UPDATE — GLOBAL SEARCH BAR

---

**🎨 Stitch Prompt — App Shell Update: Global Search Bar — Wired & Functional — Sunday**

```
Update the top bar of the Sunday App Shell to complete the Global Search Bar — previously installed as a placeholder in Sprint 1, now connected to real full-text search.

Search bar placement: top bar, centred (between the sidebar edge and the notification bell). Width: 40% of top bar width on desktop, full-width on mobile (replaces other top bar elements when focused on mobile).

Default (unfocused) state:
- Input: 48px radius, surface_container_low fill, no border. Magnifier icon (16px, on_surface_variant) inside the left of the field. Placeholder text "Search tasks, projects, people…" in on_surface_variant, label-md.
- Right side of field: keyboard shortcut badge "Ctrl K" (or "⌘ K" on Mac) — a small pill (24px radius, surface_container fill, label-sm on_surface_variant) inside the right edge of the field. Disappears when the field is focused.
- Pressing Ctrl+K / Cmd+K from any screen focuses the field instantly, regardless of cursor position.

Focused state:
- The field expands slightly (height stays 48px, but a soft ambient shadow appears: 0px 4px 20px rgba(77,85,106,0.08)) to acknowledge focus.
- Keyboard shortcut badge disappears.
- Search results dropdown panel appears below the field (see Search Results Dropdown prompt).
- A backdrop scrim (surface at 20% opacity) dims the rest of the page lightly behind the dropdown panel. Clicking the scrim or pressing Escape dismisses the panel and blurs the field.

Mobile behaviour:
- A magnifier icon button (on_surface_variant, 24px) sits in the top bar in place of the full search input.
- Tapping it expands the search bar to full-width (slide in from right, 200ms ease-out), replacing the top bar title temporarily.
- A "Cancel" text link (label-sm, on_surface_variant) appears right of the expanded field. Tapping Cancel collapses the bar back to the icon.
```

💡 *Tip: The Ctrl+K shortcut badge inside the unfocused field is a passive teacher — it trains users to discover the keyboard shortcut without any onboarding modal or tooltip campaign.*

---

## SEARCH RESULTS DROPDOWN

---

**🎨 Stitch Prompt — Search Results Dropdown — Sunday**

```
Design the Search Results Dropdown for the Global Search Bar in Sunday. Appears below the search field after the user types 2 or more characters (debounced at 300ms).

Dropdown panel:
- Position: directly below the search input field, same left edge. Width: matches the search input width.
- Style: glassmorphism — 80% surface_container_lowest opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06). 16px radius. No border.
- Max-height: 480px. Scrollable within if results overflow.

Results are grouped into three sections. Each section is separated by 8px vertical space and a label-sm Plus Jakarta Sans Medium group header in on_surface_variant (e.g. "Tasks", "Projects", "People"). No dividers — spacing only.

**Tasks section (up to 5 results):**
- Each result row: full-width, 12px horizontal padding, 10px vertical padding. No card — the row IS the surface. Hover: surface_container_high shift (8px radius).
- Row contents: task title (label-md on_surface, matched search term highlighted — matched characters receive Indigo-Slate (#4d556a) colour and Plus Jakarta Sans Medium weight, not a yellow background) + status badge (pill, 24px radius, status-specific tonal fill, label-sm) right-aligned + assignee avatar (28px circle, far right).
- Archived tasks: task title rendered in on_surface_variant (receded) + an "Archived" pill badge (surface_container_low fill, label-sm on_surface_variant, 24px radius, right-aligned beside the status badge).
- "See all task results" row at the bottom of the Tasks section (when more than 5 exist): label-sm Indigo-Slate, right arrow icon. Navigates to /tasks with the search query pre-applied.

**Projects section (up to 5 results):**
- Each result row: folder icon (16px, on_surface_variant, left) + project name (label-md on_surface, matched terms highlighted) + scope badge (pill, 24px radius: "Team" surface_container_low fill / "Global" Indigo-Slate soft tonal fill, label-sm on_surface_variant) right-aligned.
- "See all project results" row if overflow.

**People section (up to 5 results):**
- Each result row: avatar (32px circle) + full name (label-md on_surface, highlighted) + role badge (pill, 24px radius, role-specific tonal fill from Sprint 1, label-sm) right-aligned.
- "See all people results" row if overflow.

**No results state:**
- Replaces all section groups. Centred within the panel. Outline magnifier icon (on_surface_variant, 32px). label-md on_surface_variant "No results for "[query]"." label-sm on_surface_variant below: "Try a different spelling or a shorter phrase."

**Loading state (while fetching, shown immediately on keystroke before results arrive):**
- Skeleton shimmer rows: 3 shimmer blocks in the Tasks section, 2 in Projects, 2 in People. Same spacing as real results. Shimmer: surface_container to surface_container_low sweep, 1.2s loop, 48px radius on each shimmer block.

Keyboard navigation:
- Arrow keys navigate between result rows. Selected row: Indigo-Slate gradient left edge strip (3px), surface_container tonal shift — same quiet selection pattern used elsewhere.
- Enter on a selected row navigates to that resource and closes the dropdown.
- Escape closes the dropdown and returns focus to the search field.
```

💡 *Tip: Highlighting matched characters with Indigo-Slate weight change (not yellow background highlight) keeps the search results in Sunday's quiet aesthetic while still surfacing why a result matched.*

---

## DYNAMIC CUSTOM FIELD FILTERS

---

**🎨 Stitch Prompt — Dynamic Custom Field Filters: Filter Bar Extension — Sunday**

```
Design the Dynamic Custom Field Filters extension for the filter bars on the Task Board (/board), My Tasks (/tasks), and Team Tasks (/team/tasks) in Sunday.

Custom field filter controls appear dynamically after the existing static filters (Priority, Type, Nature, Project, Billable) in the filter bar. They are generated based on the custom fields active in the current user's team scope (from Sprint 3's Custom Field Management).

Each custom field type renders a different filter control:

Text field → Compact text search input:
- 48px radius, surface_container_low fill, no border, magnifier icon left. Placeholder "[Field Name]…" (e.g. "Client…"). Typing filters results to tasks where the field value contains the typed string (debounced 300ms). Width: 160px.

Number field → Min / Max range input:
- Two compact inputs side by side, each 70px wide, 48px radius, surface_container_low fill. Labels "Min" and "Max" in label-sm on_surface_variant above each. A "–" separator between them in on_surface_variant.

Date field → Date range picker:
- Same compact date range picker used in the existing filter bar. 48px radius, surface_container_low fill, calendar icon right, on_surface_variant placeholder "From – To". Width: 200px.

Dropdown field → Select dropdown:
- 24px radius, surface_container_low fill, chevron right, on_surface_variant label matching the field name. Options dropdown panel: glassmorphism (80% opacity, 20px blur, ambient shadow). Shows the field's defined option values. Multi-select: selecting an option adds it as a chip, does not close the dropdown.

Checkbox field → Boolean toggle:
- A compact pill toggle: "[Field Name]: Any · Yes · No". Three-state segmented control. 48px radius. "Any" = surface_container_low (unfiltered). "Yes" = Indigo-Slate gradient. "No" = surface_container fill (on_surface_variant text). Width fits content.

Filter bar overflow behaviour:
- If the filter bar becomes too wide to display all static + custom field filters in one row, a "More filters" pill button (surface_container_low fill, 48px radius, on_surface_variant, filter icon + count badge showing number of hidden filters) appears at the right end of the filter bar.
- Clicking "More filters" opens a glassmorphism dropdown panel (24px radius) listing all hidden filters stacked vertically. Active filters in this overflow panel are shown with their selected state intact.

Custom field filter + Saved Views (from Sprint 3):
- When a view is saved, any active custom field filters are included in the saved filter state.
- When a saved view is loaded, custom field filter controls populate with the saved values.
- If a custom field has been archived since the view was saved: the filter control is shown with an "Archived field" pill label beside it (surface_container_low fill, 24px radius, on_surface_variant label-sm) and is non-interactive. A helper tooltip on hover: "This custom field has been archived — the filter is inactive."

Active filter chips (in the filter bar chip row, as established in Sprint 3):
- Custom field filters active chips display the field name + selected value(s). Format: "[Field Name]: [Value]". Same chip style as static filter chips — surface_container fill, 24px radius, label-sm on_surface_variant, × remove icon.
```

💡 *Tip: The "More filters" overflow pill with a count badge ensures the filter bar never breaks its single-row layout regardless of how many custom fields a team has — scalability without visual chaos.*

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 7

---

**🎨 Stitch Prompt — Search Highlight Component — Sunday**

```
Design the Search Term Highlight component for Sunday. Applied wherever search queries match content in the results dropdown.

Matched text rendering:
- The matched substring within a result's title, name, or label is rendered in Plus Jakarta Sans Medium weight (one step heavier than the surrounding text) and Indigo-Slate (#4d556a) colour.
- Non-matched surrounding text renders in its default style (Plus Jakarta Sans Regular, on_surface).
- No background highlight, no underline, no border — weight and colour alone carry the match signal.
- Multiple matched substrings within a single result (e.g. a query matching two words) each receive the same treatment independently.

Example rendering:
- Query: "design review"
- Result title: "Final Design Review — Q2"
- "Design" renders in Medium weight + Indigo-Slate. "Review" renders in Medium weight + Indigo-Slate. "Final " and " — Q2" render in Regular weight + on_surface.

This treatment is used consistently across Tasks, Projects, and People result rows in the dropdown. It is NOT applied to badge text or metadata (timestamps, status labels) — only to the primary name/title being searched.
```

---

**🎨 Stitch Prompt — "More Filters" Overflow Panel — Sunday**

```
Design the "More Filters" overflow panel for Sunday's filter bars. Ensures the filter bar never wraps to a second row regardless of custom field count.

Trigger button (rightmost element in the filter bar when overflow occurs):
- "More filters" label + filter icon (16px, on_surface_variant, left) + count badge (Indigo-Slate gradient pill, 24px radius, label-sm on_primary, showing number of hidden active or inactive filters).
- Button style: surface_container_low fill, 48px radius, on_surface_variant text. When any hidden filters are active: Indigo-Slate gradient fill, on_primary text + count badge turns to on_primary white on Indigo-Slate — signals hidden active filters visually.

Overflow panel (opens below the trigger button):
- Glassmorphism (80% surface opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06)). 16px radius. Max-height 400px, scrollable. Width: 320px.
- Panel header row: "Additional Filters" label-sm Plus Jakarta Sans Medium on_surface_variant. Right: "Clear all" text link (label-sm, Indigo-Slate) — clears only the hidden filters, not the visible ones.
- Each filter listed vertically, full-width. Label above the control (label-sm on_surface_variant). Control matches its type (text input, range, dropdown, boolean toggle — same designs as the main filter bar).
- Controls in this panel use full panel width (not the compact fixed widths of the main bar).
- Active state is preserved: if a filter in the overflow panel is active, the trigger button badge count updates and the trigger button changes to the active Indigo-Slate gradient fill.
- Clicking outside the panel or pressing Escape closes it. Applied filters persist.
```

---

*All prompts above are ready to paste directly into Stitch. Recommended order: App Shell search bar update → Search Results Dropdown (all states: results, no results, loading, keyboard navigation) → Dynamic Custom Field Filters by type → Filter bar overflow panel → shared components (Search Highlight, More Filters panel).*
