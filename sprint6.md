# Stitch Prompts — Sprint 6 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 6 Dependency:** Sprints 2, 4, and 5 must be complete. Notification triggers fire from task events (Sprint 2), planning events (Sprint 4), and dashboard alerts (Sprint 5). The notification bell was installed as a placeholder in Sprint 1's App Shell — this sprint wires it to real data.

---

## APP SHELL UPDATE — NOTIFICATION BELL

---

**🎨 Stitch Prompt — App Shell Update: Notification Bell & Unread Badge — Sunday**

```
Update the top bar of the Sunday App Shell (established in Sprint 1) to complete the Notification Bell component — previously installed as a placeholder, now wired to real data.

Notification Bell placement: top bar, right side — left of the user avatar and role badge.

Bell icon: outline bell icon (24px, on_surface_variant). Becomes on_surface when notifications exist.

Unread count badge (appears when unread notifications exist):
- Positioned at the top-right corner of the bell icon (overlapping, not adjacent).
- Small pill shape — 18px tall, min-width 18px, auto-width for 2–3 digit counts. 48px radius.
- Background: Indigo-Slate gradient (#4d556a → #656d84, 135°). Text: on_primary, label-sm Plus Jakarta Sans Medium.
- For counts above 99: display "99+" with the same badge style.
- Badge entrance animation: scale from 0 to 1 (100ms ease-out spring) when first unread arrives. Exit: scale to 0 (80ms ease-in) when all notifications are read.
- Badge updates in real time without page refresh.

Bell icon states:
- No unread: outline bell, on_surface_variant, no badge.
- Has unread: solid bell (filled variant), on_surface, badge present.
- Panel open: solid bell, Indigo-Slate (#4d556a) colour, no badge visible (badge moves inside the panel header).

Clicking the bell toggles the Notification Panel (right-side overlay drawer). Clicking anywhere outside the panel closes it.
```

💡 *Tip: Using a filled vs outline bell icon (not just the badge) to signal unread state gives users a second visual cue — badge counts can be missed peripherally, but the icon state change is unmissable.*

---

## NOTIFICATION PANEL / DRAWER

---

**🎨 Stitch Prompt — Notification Panel: Structure & Entry List — Sunday**

```
Design the Notification Panel for Sunday. Opens as a right-side overlay drawer anchored to the top bar. Does not push the main content — it overlays.

Panel dimensions: 400px wide (desktop), full-width (mobile). Max-height: viewport height minus top bar height. Fixed position.
Panel background: surface_container_lowest (#ffffff). No border on left/bottom edges — ambient shadow on panel left and bottom: 0px 0px 48px rgba(77,85,106,0.10).
A semi-transparent scrim (surface at 30% opacity) covers the rest of the page without glassmorphism. Clicking the scrim closes the panel.

Panel header (sticky at panel top):
- Left: "Notifications" in label-md Plus Jakarta Sans Medium, on_surface.
- Right: unread count badge (same pill style as the top bar badge — shows inside the panel header when panel is open). + "Mark all read" text link (label-sm, Indigo-Slate #4d556a). "Mark all read" is hidden when no unread exist.
- Header bottom: no border — a 4px shadow below the header area (ambient, not 1px line) separates it from the scrollable list.

Notification entry list (scrollable, below header):
- Entries stacked with 0px gap — entries are not cards. The full-width row IS the entry. Separation comes from content spacing and the read/unread background distinction.
- Unread entry background: surface_container_low (one tonal step off-white). Read entry: surface_container_lowest (#ffffff). The tonal shift communicates state without a border or dot overlay.
- Entry anatomy (horizontal, 16px internal padding, 14px top/bottom):
  - Left: type icon in a 36px circle. Circle background: tonal variant of the event type colour (same event type colours as the Activity Feed dot indicator, but as a full circle at 10% opacity). Icon inside: 20px, full event type colour.
    - Task status change: Indigo-Slate circle.
    - Task completed: soft green circle.
    - Plan/check-in events: amber circle.
    - Comment: tertiary (#d0c3ba) circle.
    - Assignment: on_surface_variant circle.
    - Mention: Indigo-Slate gradient circle (distinguishable from status change by gradient vs flat).
  - Centre: notification message (label-md on_surface, Maximum 2 lines, then truncated). Linked object names in Plus Jakarta Sans Medium weight. Below message: relative timestamp in label-sm on_surface_variant.
  - Right: unread dot — 8px Indigo-Slate circle, centred vertically. Only shown on unread entries. Disappears on read.
- Entry hover: surface_container_high shift (applies to the full-width row). Cursor: pointer.
- Clicking an entry: marks it as read (background shifts to surface_container_lowest, dot disappears), closes the panel, navigates to the linked resource (task, plan, etc.).

Empty state (no notifications):
- Centred within the panel body. Outline bell icon (on_surface_variant, 40px). label-md on_surface_variant "Nothing yet — notifications will appear here." No CTA.

"Load more" (at the bottom of the loaded list):
- A "Load older notifications" text link (label-sm, Indigo-Slate, centred below the last entry). Appears once the initial batch (20 entries) is fully shown. Loading appends entries with a smooth fade-in.
- Once exhausted: label-sm on_surface_variant "You've seen all notifications."
```

💡 *Tip: Using the full-width tonal background shift (unread = surface_container_low, read = surface_container_lowest) instead of a border or heavy dot creates a subtle, high-quality unread indicator — the list never feels noisy.*

---

## NOTIFICATION PREFERENCES — SETTINGS PAGE EXTENSION

---

**🎨 Stitch Prompt — Notification Preferences: User Settings Section — Sunday**

```
Design the Notification Preferences section added to the User Preferences settings page for Sunday at /settings.

This section appears within the existing settings page layout (sidebar settings nav + content area), not as a new full page. It is one section among other preference sections.

Section heading "Notification Preferences" in headline-sm, on_surface. Subtext: "Manage which notifications you receive. Some notifications are required and cannot be disabled." in label-md on_surface_variant. Asymmetric top padding — editorial sky above the heading.

Notification type groups (two visual groups, separated by label-sm section labels — no dividers):

Group 1 — "Required Notifications" (label-sm Plus Jakarta Sans Medium, on_surface_variant as group header):
- A read-only list of the 10 non-optional notification types. Each: surface_container_lowest card row, 8px radius, ambient shadow 0px 2px 8px rgba(77,85,106,0.04), 4px gap.
- Row contents: type icon (20px, on_surface_variant, left) + notification name (label-md on_surface) + a "Required" pill badge (surface_container_low fill, on_surface_variant label-sm, 24px radius) right-aligned.
- No toggle rendered for any item in this group. The "Required" badge communicates non-configurability without needing a disabled toggle (which would invite clicking).
- Examples of required types shown (not interactive): "Task assigned to you", "Task status changed by reviewer", "Plan submission deadline reminder", "Task overdue", etc.

Group 2 — "Optional Notifications" (label-sm Plus Jakarta Sans Medium, on_surface_variant as group header):
- Three toggle rows, one per optional notification type.
- Each row: surface_container_lowest card, 8px radius, ambient shadow, 4px gap.
- Row contents: type icon (20px, on_surface_variant, left) + notification name (label-md on_surface) + brief description (label-sm on_surface_variant, below the name, same left indent) + toggle switch (right-aligned). Toggle On: Indigo-Slate fill. Toggle Off: surface_container_low fill.
- The three optional types:
  1. "Task I created is marked Done" — "Receive a notification when a task you originally created is completed by its assignee."
  2. "Comment on my plan" — "Receive a notification when a manager comments on your weekly plan."
  3. "Comment on a task I'm involved in" — "Receive a notification for new comments on tasks where you are assignee, reviewer, or creator."
- Toggling saves immediately (optimistic update). Brief success toast: "Preference saved." No explicit Save button for this section — it is auto-saved per toggle.
```

💡 *Tip: Listing required notifications (read-only) alongside optional ones gives users full transparency about what they will always receive — this builds trust and eliminates the confusion of "why am I getting this when I didn't opt in?"*

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 6

---

**🎨 Stitch Prompt — Notification Entry Component (Standalone) — Sunday**

```
Design the Notification Entry component for Sunday. Used inside the Notification Panel. Also used if a notification tray or notification page is built in future — design it as a self-contained component.

Container: full-width row. Not a card — the row IS the surface. 16px horizontal padding, 14px vertical padding. Entry is the full width of its parent container.

Read / unread backgrounds:
- Unread: surface_container_low (#e8eaed approx). Slightly off-white — perceptibly different from the panel background.
- Read: surface_container_lowest (#ffffff) — blends into the panel background, recedes visually.
- Transition between states: 200ms background-color ease — no flash, no jump.

Left: Event type icon in a 36px circle:
- Circle fill: event type colour at 10% opacity (soft ambient tonal circle).
- Icon inside: 20px at 100% type colour.
- Type colours: Status Changes → Indigo-Slate (#4d556a). Completed → soft green (#2d6a4f). Plans/check-ins → amber (#d4820a). Comments → tertiary (#d0c3ba) at full fill. Assignments → on_surface_variant (#434655). Mentions → Indigo-Slate gradient (distinguishable from Status Changes by gradient fill on the circle).

Centre content block (flex column, fills remaining width):
- Message text: label-md on_surface. Max 2 lines before truncation. Linked object names in Plus Jakarta Sans Medium weight, Indigo-Slate (#4d556a) colour.
- Timestamp: label-sm on_surface_variant. Relative ("3 min ago") with ISO full date on hover (glassmorphism tooltip).

Right: unread dot — 8px circle, Indigo-Slate (#4d556a) fill. Centred vertically. Shown on unread only. Disappears with a 150ms opacity fade when the entry is marked read.

Hover: full-width row background shifts to surface_container_high. Cursor: pointer.
Click: marks read + navigates. No separate "mark read" button — the click itself is the read action.
```

---

*All prompts above are ready to paste directly into Stitch. Recommended order: App Shell bell update → Notification Panel structure → Notification Panel entry list states → Notification Preferences settings section → Notification Entry standalone component.*
