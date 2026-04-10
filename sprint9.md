# Stitch Prompts — Sprint 9 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 9 Dependency:** All previous sprints must be complete. Reports aggregate task data (Sprint 2), planning and wrap-up data (Sprint 4), and user/team data (Sprint 1). Meaningful report output requires real data from all three layers.

---

## SCREEN 22 — REPORTS

---

**🎨 Stitch Prompt — Reports Screen: Page Layout & Report Type Selector — Sunday**

```
Design the Reports screen for Sunday at route /reports. Access: Manager and above. Employees see the 403 screen from Sprint 1 if they navigate here directly.

Full app shell present. Page title "Reports" in headline-sm (1.5rem, -0.02em tracking), on_surface. Subtext "Generate and download reports for your team." in label-md on_surface_variant. Asymmetric editorial top padding — more sky above the title.

Report Type Selector (below page header):
- A vertical radio group of report type cards. Each option is a selectable card — not a standard radio button.
- Card: surface_container_lowest (#ffffff), 12px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05), 8px vertical gap between cards. No border.
- Card contents: leading icon (24px, on_surface_variant) + report name (label-md Plus Jakarta Sans Medium, on_surface) + one-line description (label-sm on_surface_variant). All left-aligned. A radio indicator (24px circle) right-aligned.
  - Unselected radio: surface_container_low fill, ghost border at outline_variant 15% opacity.
  - Selected radio: Indigo-Slate gradient fill, on_primary fill checkmark inside.
- Selected card state: the entire card receives a soft Indigo-Slate tonal background (surface_container_low tinted Indigo at 6% opacity). The left edge gets a 3px Indigo-Slate vertical strip — same quiet selection marker used throughout Sunday. Card ambient shadow deepens slightly.
- Card hover (unselected): surface_container_high tonal shift. No border.

Five report type cards (in order):
1. Chart icon — "Weekly Team Performance" — "Planned vs completed tasks per team member for a selected week."
2. Person icon — "Individual Employee" — "Full task and planning summary for one employee over a date range."
3. Currency icon — "Billable Hours Summary" — "Breakdown of billable hours logged across your team."
4. Download icon — "Full Task Export" — "All task records with all fields — suitable for spreadsheet analysis."
5. Shield icon — "System Activity" — "A log of all structural changes to users, teams, roles, and settings." — THIS CARD IS ONLY RENDERED FOR ADMIN ROLE. Manager and Asst Manager never see it.

Below the selector: Report Parameter Area (changes based on selected type — see next prompt).
```

💡 *Tip: Making each report type a full selectable card (not a radio + label) gives managers enough context to know what they're generating before they commit — reducing failed generations caused by wrong type selection.*

---

**🎨 Stitch Prompt — Reports Screen: Parameter Area, Format Selector & Generate — Sunday**

```
Design the Report Parameter Area, Format Selector, and Generate button section of the Reports screen for Sunday.

All parameter inputs appear in a surface_container_lowest (#ffffff) card below the Report Type Selector. Card: 16px radius, ambient shadow 0px 8px 24px rgba(77,85,106,0.06). No border. 24px internal padding. Smooth height animation (200ms ease-out) as parameter fields show/hide based on selected report type.

Shared parameter (always shown regardless of type):
- Date Range Picker: label "Date range" in label-sm Plus Jakarta Sans Medium, on_surface_variant. Two date inputs side by side ("From" / "To"), each 48px radius, surface_container_low fill, calendar icon right, no border. Defaults to the current week on page load. Required.

Conditional parameters (animated show/hide per type):

Weekly Team Performance + Billable Hours Summary:
- Team selector: searchable dropdown (24px radius, surface_container_low fill). Scoped to the manager's accessible teams. Required.

Individual Employee only:
- Team selector (as above, shown first).
- Employee selector: searchable dropdown (24px radius, surface_container_low fill), filtered by selected team. Shows avatar + name per option. Required.

Full Task Export:
- No additional parameters beyond date range. All task fields including custom fields are exported automatically.

System Activity (Admin only):
- No additional parameters beyond date range. Full system log is exported.

Format Selector (below parameters, within the same card):
- Label "Output format" in label-sm Plus Jakarta Sans Medium, on_surface_variant.
- Segmented pill group: "PDF" · "CSV". Selected: Indigo-Slate gradient fill, on_primary text. Unselected: surface_container_low fill, on_surface_variant text. 48px radius.
- Format constraints (enforced silently by showing only available options):
  - System Activity: only "CSV" pill rendered. PDF option not shown.
  - Full Task Export: only "CSV" pill rendered.
  - All other types: both PDF and CSV available.

Generate Button (below the parameter card):
- "Generate Report" — Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium on_primary. Full-width up to 320px, left-aligned.
- Disabled appearance (surface_container_low fill, on_surface_variant text) when required fields are missing — not clickable. No tooltip needed; missing fields have inline validation on the fields themselves.
- Loading state (after click, while generating): button label changes to "Generating…" with a small spinning circle icon (18px, on_primary, left of text). Button is non-interactive (not greyed — maintains gradient, just non-clickable) during generation. The rest of the page remains interactive (user can scroll, view previous results).

Generated Report Result Card (appears below the Generate button on success):
- surface_container_lowest, 12px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05). 4px top gap from the button.
- Enters with a smooth fade-in + slide-up (150ms ease-out).
- Card contents:
  - Report name in label-md Plus Jakarta Sans Medium, on_surface (e.g. "Weekly Team Performance — Alpha Team").
  - Date range and generated timestamp in label-sm on_surface_variant: "Apr 7 – Apr 11, 2026 · Generated at 10:32 AM".
  - Download buttons side by side (only the generated formats): "Download PDF" (Indigo-Slate gradient, 48px radius, on_primary) and/or "Download CSV" (tertiary fill #d0c3ba, 48px radius, on_surface). Pill buttons with download icon left of label.
- Multiple result cards stack vertically (newest at top) if the user generates multiple times in one session. Each has its own download buttons — old results remain accessible until the page is refreshed.

Error State (appears below the Generate button on failure, replaces or sits below result cards):
- surface_container_low card, 3px amber left strip, 8px radius, ambient shadow.
- Content: amber warning icon (20px) + label-md on_surface "Failed to generate report. Please try again." + "Retry" text link (label-sm, Indigo-Slate) right-aligned.
- Auto-dismissed if a subsequent generation attempt succeeds.
```

💡 *Tip: Keeping old result cards visible after new generations allows managers to compare different date ranges or formats without re-generating — a small UX detail that saves meaningful time in reporting workflows.*

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 9

---

**🎨 Stitch Prompt — Report Type Card Component — Sunday**

```
Design the Report Type Card component for Sunday's Reports screen.

This is a selectable card — combines the function of a radio button with the information density of a card.

Container: surface_container_lowest (#ffffff), 12px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05). Full page-column width. 8px vertical gap between cards.

States:

Unselected (default):
- White card, standard ambient shadow.
- Radio indicator: 24px circle, surface_container_low fill, ghost border outline_variant 15% opacity.

Hover:
- surface_container_high tonal background shift. Shadow unchanged. Radio indicator unchanged.
- Cursor: pointer.

Selected:
- Card background: very faint Indigo-Slate tonal wash (#4d556a at 5% opacity over white). This is barely perceptible — a whisper of selection, not a shout.
- Left edge: 3px Indigo-Slate (#4d556a) vertical strip (full card height, inside the card boundary, 12px radius on the left side only).
- Radio indicator: 24px circle, Indigo-Slate gradient fill (#4d556a → #656d84, 135°), white checkmark icon (16px) centred inside.
- Shadow: deepens slightly to 0px 8px 24px rgba(77,85,106,0.08).

Card interior layout (horizontal flex, 16px internal padding, 52px row height minimum):
- Left: report type icon (24px, on_surface_variant — unchanged across all states).
- Centre (column): report name (label-md Plus Jakarta Sans Medium, on_surface) + description (label-sm on_surface_variant, below the name, truncated to 1 line on mobile).
- Right: radio indicator circle.
```

---

**🎨 Stitch Prompt — Generated Report Result Card — Sunday**

```
Design the Generated Report Result Card component for Sunday.

Container: surface_container_lowest (#ffffff), 12px radius, ambient shadow 0px 4px 16px rgba(77,85,106,0.05). No border.
Entrance animation: fade-in + translateY(8px → 0px), 150ms ease-out.

Card interior (16px padding all sides):
- Top row: report type icon (20px, on_surface_variant, left) + report name (label-md Plus Jakarta Sans Medium, on_surface) + generated timestamp pill (surface_container_low fill, 24px radius, label-sm on_surface_variant: "Generated at 10:32 AM", right-aligned).
- Second row: date range in label-sm on_surface_variant (e.g. "Apr 7 – Apr 11, 2026"). Left-aligned.
- Third row (download actions, 8px top gap): PDF download button (Indigo-Slate gradient, 48px radius, download icon left, label-md Plus Jakarta Sans Medium on_primary) + CSV download button (tertiary fill #d0c3ba, 48px radius, download icon left, label-md on_surface). Only show the buttons for the format(s) that were selected.

Multiple cards stack with 8px vertical gap, newest on top.
```

---

*All prompts above are ready to paste directly into Stitch. Recommended order: Reports page layout and type selector → parameter area (static and conditional fields) → format selector and generate button → result card and error state → shared components.*
