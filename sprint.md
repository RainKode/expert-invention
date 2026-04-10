# Stitch Prompts — Sprint 1 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

---

## APP SHELL

---

**🎨 Stitch Prompt — App Shell — Sunday**

```
Design the persistent App Shell for Sunday, an HR SaaS platform.

Sidebar (left, fixed, full height):
- Background surface: surface_container_low, no border — separation achieved through subtle tonal shift from the main page background (#f7f9fb).
- Sunday wordmark at the top in Plus Jakarta Sans Medium.
- Navigation items use 24px radius pill shape. Active state: Indigo-Slate gradient (#4d556a → #656d84, 135°) with on_primary text. Inactive: transparent background, on_surface_variant (#434655) text. Hover: surface_container_high fill — no border.
- Nav items are role-scoped: Admin sees Dashboard, Users, Teams, and Settings. Managers see Dashboard and Teams only. Employees see Dashboard only.
- Bottom of sidebar: user avatar, name, and role badge.
- No horizontal dividers — use 8px vertical gap between nav groups.

Top Bar (right of sidebar, fixed):
- Background: #ffffff, ambient shadow: 0px 4px 24px rgba(77,85,106,0.06).
- Right side: user's full name in Plus Jakarta Sans Medium, followed by a colour-coded Role Badge (pill, 48px radius, filled with role-specific tonal color).
- No 1px borders on the top bar edge.

Role Badge variants (all pill-shaped, 48px radius):
- Admin: Indigo-Slate gradient fill, white text.
- Senior Manager: deep slate (#434655) fill, white text.
- Manager: surface_container_low fill, on_surface text.
- Employee: tertiary (#d0c3ba) fill, on_surface text.
- Contractor: warm sand fill, on_surface text.
- Viewer: outline ghost style — ghost border at outline_variant (#c6c6cd) 15% opacity, on_surface text.

Mobile behaviour:
- Sidebar collapses entirely. Top bar shows a hamburger icon (left side).
- Tapping hamburger opens a full-height overlay drawer. Overlay uses glassmorphism: 80% surface_container_low opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06). Drawer slides in from the left. A dark scrim (40% opacity) covers the main content behind the drawer.
- Drawer contains identical nav items to the desktop sidebar.

Auth Guard visual:
- If a non-admin user reaches an admin-only route, display a full-page 403 screen centered within the app shell. Large display-md numeral "403" in on_surface_variant. Heading below in headline-sm. Body copy in on_surface_variant. A single pill CTA button (Indigo-Slate gradient) linking back to the dashboard. No decorative borders.
```

💡 *Tip: Build the sidebar as a self-contained component first — the role-scoping logic will make it the single most-reused structural element in the product.*

---

## SCREEN 1 — LOGIN

---

**🎨 Stitch Prompt — Login Screen — Sunday**

```
Design the Login screen for Sunday at route /login. Public access. No sidebar — full-page layout.

Layout: Vertically and horizontally centred card on a full-bleed #f7f9fb background. Card uses surface_container_lowest (#ffffff), 24px radius, ambient shadow 0px 24px 48px rgba(77,85,106,0.06) — no border.

Card contents (top to bottom):
- Sunday wordmark in Plus Jakarta Sans Medium, centred.
- Page heading "Welcome back" in headline-sm (1.5rem, -0.02em letter-spacing), on_surface (#191c1e), centred.
- Subtext "Sign in to your account" in label-md, on_surface_variant (#434655), centred.
- Email input field: 48px radius, surface_container_low fill, label "Email address" above in label-sm on_surface_variant. No border — use tonal fill to define the field shape.
- Password input field: same style. Includes a show/hide toggle icon on the right side of the field (eye icon, on_surface_variant).
- "Forgot password?" link aligned right, in label-sm, Indigo-Slate color (#4d556a).
- Primary CTA button "Sign in": full-width, 48px radius, Indigo-Slate gradient (#4d556a → #656d84, 135°), Plus Jakarta Sans Medium, on_primary text.

Error states:
- Invalid credentials: A warning banner appears above the form fields. surface_container_low background, tertiary (#d0c3ba) left accent strip, body text in on_surface. Message: "The email or password you entered is incorrect." — deliberately non-specific. No red borders on inputs.
- Deactivated account: Same banner style, distinct message: "Your account has been deactivated. Contact your administrator." Tertiary warm tone distinguishes it from a generic error.
- Empty field on submit: Inline label in on_surface_variant below the field — label-sm weight — "This field is required." No red color — use on_surface_variant to maintain the quiet aesthetic.

No decorative illustrations. Background is a clean, breathable #f7f9fb. Generous padding inside the card — asymmetric: more top padding than bottom to evoke editorial "sky."
```

💡 *Tip: The error banner uses tertiary warmth (#d0c3ba) instead of red — this preserves Sunday's quiet authority tone even in error states.*

---

## SCREEN 2 — FORGOT PASSWORD

---

**🎨 Stitch Prompt — Forgot Password Screen — Sunday**

```
Design the Forgot Password screen for Sunday at route /forgot-password. Public access. No sidebar — full-page layout, identical shell to the Login screen.

Card (surface_container_lowest, 24px radius, ambient shadow, no border) centred on #f7f9fb background:

Default state (form):
- Heading "Reset your password" in headline-sm, on_surface, centred.
- Body copy "Enter your work email and we'll send a reset link." in label-md, on_surface_variant, centred.
- Email input: 48px radius, surface_container_low fill, label "Work email" in label-sm on_surface_variant. No border.
- Primary CTA "Send reset link": full-width, 48px radius, Indigo-Slate gradient. Plus Jakarta Sans Medium. on_primary text.
- Below the button: "Back to sign in" as a plain text link in label-sm, on_surface_variant, centred.

Success state (after submit, replaces form):
- A soft check icon in tertiary (#d0c3ba), centred.
- Heading "Check your inbox" in headline-sm, on_surface.
- Body copy: "If that email is registered, you'll receive a link shortly. Check your spam folder if it doesn't arrive." — intentionally non-revealing for security. label-md, on_surface_variant.
- "Back to sign in" link, centred, label-sm.
- No confirmation of whether the email exists — same message regardless of outcome.
```

💡 *Tip: The non-revealing success message is a security requirement — never confirm or deny that an email exists in the system.*

---

## SCREEN 3 — SET PASSWORD (INVITE ACCEPTANCE)

---

**🎨 Stitch Prompt — Set Password / Invite Acceptance Screen — Sunday**

```
Design the Set Password screen for Sunday at route /set-password?token=xxx. Public access (valid token only).

Full-page layout, no sidebar. Centred card on #f7f9fb background. Card: surface_container_lowest, 24px radius, ambient shadow, no border.

Valid token state:
- Warm welcome heading "Welcome to Sunday, [First Name]" in headline-sm (1.5rem, -0.02em tracking), on_surface, centred. First name is pulled from the invite record.
- Subtext in label-md, on_surface_variant: "You've been added to [Team Name]. Set your password to get started." Team name displayed in Plus Jakarta Sans Medium weight.
- New Password input: 48px radius, surface_container_low fill, no border.
- Confirm Password input: same style.
- Password strength indicator: a horizontal progress bar below the New Password field. Bar fills left-to-right in 4 segments. Weak: 1 segment, tertiary (#d0c3ba). Fair: 2 segments, muted indigo. Strong: 3 segments, Indigo-Slate. Very Strong: 4 segments, Indigo-Slate gradient. No text labels — visual only. Height: 4px with 48px radius.
- Primary CTA "Set password & sign in": full-width, 48px radius, Indigo-Slate gradient.

Expired / invalid token state (replaces form):
- Soft lock icon in on_surface_variant, centred.
- Heading "This link has expired" in headline-sm, on_surface.
- Body copy: "Invite links expire after 72 hours. Ask your administrator to resend your invite." label-md, on_surface_variant.
- No CTA that could be exploited — read-only message only.
```

💡 *Tip: The password strength bar uses color alone (not text labels) to keep the UI uncluttered — ensure it still meets accessibility via ARIA attributes.*

---

## SCREEN 4 — ADMIN: USER MANAGEMENT

---

**🎨 Stitch Prompt — Admin User Management Screen — Sunday**

```
Design the Admin User Management screen for Sunday at route /admin/users. Admin access only.

Full app shell present (sidebar + top bar). Page renders within the main content area.

Page header (asymmetric editorial spacing — more sky above the title):
- Page title "Users" in headline-sm (1.5rem, -0.02em tracking), on_surface.
- Subtext "Manage your organisation's accounts and invitations." in label-md, on_surface_variant.
- Right-aligned action buttons: "Import" (tertiary ghost button, 48px radius, #d0c3ba fill) and "Add User" (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium, on_primary text).

Toolbar (below header, above table):
- Live search field: 48px radius, surface_container_low fill, search icon on left, no border. Placeholder "Search by name or email…" in on_surface_variant.
- Dropdown filters side by side: "All Roles", "All Teams", "All Statuses". Each: 24px radius, surface_container_low fill, on_surface_variant label, chevron icon right. No border — tonal fill defines shape.
- Status filter is a three-way toggle chip group: "All" | "Active" | "Deactivated". Active selection: Indigo-Slate gradient fill, on_primary text. Inactive: surface_container_low fill. 48px radius pills.

Data Table:
- No external border on the table container. Table sits on #f7f9fb page background. Rows use surface_container_lowest (#ffffff) fill with 8px corner radius.
- No horizontal dividers between rows. Rows are separated by a 4px vertical gap.
- Column headers in label-sm, on_surface_variant. Sortable columns show a subtle sort chevron on hover.
- Columns: Avatar + Full Name, Email, Role Badge, Team, Status Badge, Last Active, Actions.
- Role Badge: pill, 48px radius, role-specific fills (as defined in App Shell).
- Status Badge: "Active" — soft green tonal fill, on_surface text. "Deactivated" — surface_container_low fill, on_surface_variant text. "Invite Pending" — tertiary (#d0c3ba) fill, on_surface text. All pills, 48px radius.
- Row hover: surface_container_high background shift — no border.
- Actions column: icon-only button row. Icons: Edit (pencil), Deactivate/Reactivate (toggle), Resend Invite (envelope — only visible on Invite Pending rows). All icons in on_surface_variant, 24px.
- Pagination below table: Previous / Next pill buttons (48px radius, surface_container_low fill), centred. "Showing 1–25 of 143 users" in label-sm, on_surface_variant.

Skeleton loader state: Grey shimmer blocks matching each row height and column width. Applied while data is fetching.
Empty state: Centred within the table area. display-md empty icon (outline person group), headline "No users yet", label-md subtext "Add your first team member to get started." CTA "Add User" (Indigo-Slate gradient pill).
Error state: Banner at top of table area. surface_container_low background, warm left strip. "Could not load users. Try again." with a "Retry" text link.
```

💡 *Tip: The 4px row gap replaces dividers entirely — the white card rows floating on the grey background creates the visual separation without any lines.*

---

## SCREEN 5 — ADMIN: USER CREATE FORM

---

**🎨 Stitch Prompt — Admin User Create Form — Sunday**

```
Design the Admin User Create Form for Sunday at route /admin/users/new. Admin access only.

Full app shell present. Breadcrumb above page title: "Users / New User" in label-sm, on_surface_variant. Title "Add New User" in headline-sm, on_surface.

Form layout: Single-column, max-width 720px, centred in the content area. 4 grouped sections separated by section headings — no dividers, only generous vertical spacing (asymmetric: more top spacing before each section heading).

Section 1 — Personal Information:
- Heading "Personal Information" in label-md Plus Jakarta Sans Medium, on_surface.
- Fields: First Name (half-width), Last Name (half-width) side by side. Email Address (full-width).
- All inputs: 48px radius, surface_container_low fill, label above in label-sm on_surface_variant. No borders.

Section 2 — Role & Team:
- Heading "Role & Team" in label-md Plus Jakarta Sans Medium, on_surface.
- Fields: Role (dropdown, 24px radius), Team (dropdown, searchable, 24px radius). Reporting Manager (dropdown, filtered by selected team — label notes "Filtered by selected team", label-sm on_surface_variant). All full-width, stacked.

Section 3 — Schedule:
- Heading "Schedule" in label-md Plus Jakarta Sans Medium, on_surface.
- Work Week: 7 day-of-week toggle chips in a horizontal row (Mon Tue Wed Thu Fri Sat Sun). Selected day: Indigo-Slate gradient, on_primary. Unselected: surface_container_low, on_surface_variant. 24px radius each.
- Timezone: Searchable dropdown (IANA timezone list). 48px radius, surface_container_low fill.
- Available Hours Per Day: Number input with +/− stepper. 48px radius.

Section 4 — Permissions:
- Heading "Permissions" in label-md Plus Jakarta Sans Medium, on_surface.
- Billable Permission Type: segmented control or radio pill group. Options: "None", "Standard", "Full". Pill-shaped, 48px radius. Selected: Indigo-Slate gradient. Unselected: surface_container_low.
- Helper text below: "Defaults to None if not selected." in label-sm, on_surface_variant.

Form footer (sticky at bottom of content area):
- "Cancel" button (tertiary, 48px radius, #d0c3ba fill) and "Save & Send Invite" button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium) side by side, right-aligned.

Validation:
- Per-field inline error on blur: label-sm text below the field in on_surface_variant (not red). E.g. "Email address is required." or "This email is already in use."
- On failed submit: A warning banner at the top of the form. surface_container_low background, warm left strip. "Please fix the errors above before saving." No red anywhere.
```

💡 *Tip: The segmented permission control using pill chips keeps the "no sharp corners" rule while providing clearly distinct states.*

---

## SCREEN 6 — ADMIN: USER EDIT FORM

---

**🎨 Stitch Prompt — Admin User Edit Form — Sunday**

```
Design the Admin User Edit Form for Sunday at route /admin/users/:id/edit. Admin access only.

Identical layout to the User Create Form (4 sections, same field structure, same section headings, same spacing).

Key differences from the Create Form:
- Page title: "Edit User — [Full Name]" in headline-sm, on_surface.
- All fields are pre-populated with the user's existing data on load.
- Email Address field: if the user has accepted their invite, the email field is read-only. Style: same 48px radius pill shape but with surface_container background (slightly darker tonal fill) and a lock icon inside the right edge. Label below in label-sm on_surface_variant: "Email cannot be changed after invite accepted."
- If the invite is still pending, email remains editable.
- Skeleton loader: All input fields show shimmer placeholder blocks while the user data is loading.
- Footer: "Cancel" and "Save Changes" buttons. Same style as Create Form.
```

💡 *Tip: Use the tonal background shift (not a border or disabled style) to visually communicate the read-only email state — consistent with the no-border design language.*

---

## SCREEN 7 — ADMIN: TEAM & DEPARTMENT MANAGEMENT

---

**🎨 Stitch Prompt — Admin Team & Department Management Screen — Sunday**

```
Design the Admin Team & Department Management screen for Sunday at route /admin/teams. Admin access only.

Full app shell. Page title "Teams & Departments" in headline-sm, on_surface. Subtext "Manage your organisation structure." in label-md, on_surface_variant.

Right-aligned action buttons: "Add Department" (tertiary, 48px radius, #d0c3ba fill) and "Add Team" (Indigo-Slate gradient, 48px radius).

Hierarchy Tree Table:
- No outer table border. Table rows on #f7f9fb page background.
- Department rows (parent): surface_container (#e8eaed) fill, 8px radius. Left edge: a subtle 3px vertical strip in Indigo-Slate (#4d556a) to visually anchor the parent row. Department name in Plus Jakarta Sans Medium, on_surface. Senior Manager name in label-sm on_surface_variant beside the name. Expand/collapse chevron icon on the far left — rotates 90° when expanded.
- Team rows (child): surface_container_lowest (#ffffff) fill, 8px radius. Indented by 32px from the parent row left edge. Team name in on_surface. Manager name in label-sm on_surface_variant. Planning mode badge (pill, 24px radius): "Flexible" in tertiary fill; "Locked" in Indigo-Slate gradient. No horizontal dividers — 4px vertical gap between all rows.
- Action icons per row (right-aligned): Edit (pencil) and Delete (trash, only if no members assigned). on_surface_variant icons.
- Collapsed state: Only department rows visible. Expanded: child team rows appear below the parent with an animated slide-down.

Skeleton state: Shimmer rows in two sizes (wider for department, indented for teams).
Empty state: Centred icon, headline "No departments yet", CTA "Add Department".
```

💡 *Tip: The 3px Indigo-Slate left strip on department rows creates hierarchy without any 1px borders — it reads as an architectural indent, not a divider.*

---

## SCREEN 8 — ADMIN: BULK USER IMPORT

---

**🎨 Stitch Prompt — Admin Bulk User Import Screen — Sunday**

```
Design the Admin Bulk User Import screen for Sunday at route /admin/users/import. Admin access only. Stepped flow: 4 steps with a visual step indicator at the top.

Step indicator (horizontal, below page title):
- 4 numbered circles connected by a thin line. Active step: Indigo-Slate gradient fill, on_primary number. Completed step: solid #4d556a fill, checkmark icon. Upcoming: surface_container_low fill, on_surface_variant number. Connecting line: surface_container_high. 48px radius circles.
- Step labels below each circle in label-sm: "Instructions", "Upload", "Preview", "Confirm". on_surface_variant for inactive, on_surface for active.

Step 1 — Instructions:
- Card (surface_container_lowest, 24px radius, ambient shadow). 
- Headline "Before you import" in headline-sm, on_surface.
- Numbered list of rules in label-md, on_surface_variant. Uses 8px gap between items — no bullet dividers.
- Download CSV Template button: tertiary fill (#d0c3ba), 48px radius. Icon: download arrow left of label.
- "Next: Upload" button (Indigo-Slate gradient, 48px radius) at bottom right.

Step 2 — Upload:
- Large drop zone card (surface_container_low fill, 24px radius, ambient shadow). Dashed ghost border at outline_variant (#c6c6cd) 15% opacity — the only acceptable border in this system.
- Centred: upload cloud icon in on_surface_variant, headline "Drop your CSV here" in headline-sm, subtext "or browse files" as a link in Indigo-Slate. label-sm restriction note: "Accepts .csv files only, max 5MB." on_surface_variant.
- After file selected: File name shown in a pill chip (surface_container_high, 24px radius) with a remove × icon.
- "Back" (ghost button) and "Next: Preview" (Indigo-Slate gradient) at bottom.

Step 3 — Preview:
- Table showing each parsed row. Same row style as User Management table (white cards, 4px gap, no dividers).
- Each row has a validation status icon: green check (valid), amber warning (fixable issue), red × (blocking error). Icon in the first column.
- Hover on a row with issues: surface_container_high highlight, tooltip (glassmorphism: 80% opacity, 20px blur, ambient shadow) showing the specific validation message.
- Summary banner above table: "X rows valid · Y rows have issues." Tertiary warm fill if any issues. Indigo-Slate if all valid.
- "Back" and "Confirm Import" (Indigo-Slate gradient). If any blocking errors: "Confirm Import" is visually dimmed (surface_container_low fill, on_surface_variant text) — not red, not disabled-looking, just quiet.

Step 4 — Confirm:
- Success: Centred. Soft check motif in tertiary (#d0c3ba). display-md number showing users imported. Headline "Import complete" in headline-sm. Subtext in label-md on_surface_variant. CTA "Go to Users" (Indigo-Slate gradient, 48px radius).
- The import is all-or-nothing: if errors exist in Step 3, the user is blocked from reaching Step 4 without resolving or removing problematic rows.
```

💡 *Tip: The dashed ghost border on the drop zone is the one exception to the no-border rule — use outline_variant at 15% opacity, not 100%. It reads as a suggestion, not a wall.*

---

## MODALS

---

**🎨 Stitch Prompt — Modal M2: Confirm Deactivate User — Sunday**

```
Design the Confirm Deactivate User modal for Sunday. Triggered by row action on the User Management screen.

Modal overlay: glassmorphism — 80% surface opacity, 20px backdrop-blur, ambient shadow 0px 24px 48px rgba(77,85,106,0.06). No dark full-screen scrim — the blur effect is the container cue.
Modal card: surface_container_lowest (#ffffff), 24px radius, ambient shadow, no border. Max-width 480px, centred.

Contents:
- Headline "Deactivate [Full Name]?" in headline-sm, on_surface.
- Warning body in label-md, on_surface_variant: "This user has [N] open tasks. Before deactivating, ensure these tasks are reassigned. Deactivated users cannot log in."
- If no open tasks: simpler body "This user will no longer be able to log in. You can reactivate them at any time."
- Two buttons right-aligned: "Cancel" (tertiary, 48px radius, #d0c3ba fill) and "Deactivate" (surface_container_low fill with on_surface text — intentionally muted, not a danger red). The quiet style of the destructive action reflects Sunday's non-alarming tone.
```

💡 *Tip: Avoid red for the deactivate action — Sunday's vocabulary uses muted, warm tones for warnings, preserving the quiet authority feel even in critical moments.*

---

**🎨 Stitch Prompt — Modal M3: Confirm Reactivate User — Sunday**

```
Design the Confirm Reactivate User modal for Sunday.

Same glassmorphism overlay and card style as M2.

Contents:
- Headline "Reactivate [Full Name]?" in headline-sm, on_surface.
- Body in label-md, on_surface_variant: "This user will be able to log in again with their existing credentials."
- Two buttons: "Cancel" (tertiary fill) and "Reactivate" (Indigo-Slate gradient, 48px radius) — the positive action uses the gradient CTA.
```

💡 *Tip: Reactivate uses the Indigo-Slate gradient CTA (a positive, constructive action) while Deactivate uses a muted fill — the contrast communicates intent without color-coding danger.*

---

**🎨 Stitch Prompt — Modal M4: Add / Edit Department — Sunday**

```
Design the Add / Edit Department modal for Sunday.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 480px.

Title: "Add Department" or "Edit Department" in headline-sm, on_surface.

Fields:
- Department Name: full-width input, 48px radius, surface_container_low fill, label "Department name" in label-sm on_surface_variant. Validation: must be unique.
- Senior Manager: dropdown, 24px radius, searchable. Filtered to show only users with Senior Manager or Admin roles. Helper text below in label-sm on_surface_variant: "Only Senior Managers and Admins are shown."
- Both fields required.

Footer: "Cancel" (tertiary, 48px radius) · "Save Department" (Indigo-Slate gradient, 48px radius). Right-aligned.
Inline validation on blur per field. On failed submit: brief label-sm message below each failing field in on_surface_variant.
```

---

**🎨 Stitch Prompt — Modal M5: Add / Edit Team — Sunday**

```
Design the Add / Edit Team modal for Sunday.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Wider than other modals — max-width 560px to accommodate the full team form.

Title: "Add Team" or "Edit Team" in headline-sm, on_surface.

Fields (stacked, full-width):
- Team Name: 48px radius input.
- Department: dropdown (24px radius) — selects from existing departments.
- Manager: dropdown (24px radius) — filtered by selected department.
- Planning Mode: segmented pill control. "Flexible" | "Locked". Selected: Indigo-Slate gradient. Unselected: surface_container_low. 48px radius pills.
- Submission Deadline Day + Time: Two inputs side by side (day dropdown + time picker). These fields are ONLY visible (animate in with a smooth fade + height transition) when Planning Mode is set to "Locked". Hidden — not disabled — when mode is Flexible.
- Mandatory Check-In: toggle switch. On: Indigo-Slate fill. Off: surface_container_low. Label "Require daily check-in" in label-md on_surface.
- Mandatory EOD Report: same toggle style. Label "Require end-of-day report."
- All toggles stacked with 8px gap — no horizontal dividers.

Footer: "Cancel" (tertiary) · "Save Team" (Indigo-Slate gradient). Right-aligned.
```

💡 *Tip: The conditional fade-in of the deadline fields (not a show/hide jump) maintains the calm, editorial pace of the UI — nothing should feel abrupt in Sunday.*

---

**🎨 Stitch Prompt — Modal M6: Resend Invite — Sunday**

```
Design the Resend Invite modal for Sunday. Only visible on users with "Invite Pending" status.

Glassmorphism overlay. Card: surface_container_lowest, 24px radius, ambient shadow. Max-width 440px.

Contents:
- Headline "Resend invite?" in headline-sm, on_surface.
- Body in label-md, on_surface_variant: "A new invite link will be sent to [email@address.com]. The previous link will expire immediately." Email address shown in Plus Jakarta Sans Medium, on_surface.
- Two buttons: "Cancel" (tertiary, 48px radius) · "Resend Invite" (Indigo-Slate gradient, 48px radius). Right-aligned.
- Success state (inline, replaces buttons): A soft check icon in tertiary (#d0c3ba) followed by "Invite sent." in label-md on_surface_variant. Modal auto-dismisses after 2 seconds.
```

---

## SHARED COMPONENT PROMPTS

---

**🎨 Stitch Prompt — Toast Notification System — Sunday**

```
Design the Toast Notification component for Sunday. Positioned fixed at the bottom-right of the viewport. Stacks vertically with 8px gap if multiple toasts appear.

Toast card: surface_container_lowest (#ffffff), 24px radius, ambient shadow 0px 24px 48px rgba(77,85,106,0.06). Max-width 360px. No border.

Left accent: a 3px vertical strip in the left edge, 100% card height. Color varies by variant:
- Success: soft green.
- Error: muted warm red (desaturated — not alarming).
- Warning: tertiary (#d0c3ba).
- Info: Indigo-Slate (#4d556a).

Content: icon (24px) matching accent color, headline in label-md Plus Jakarta Sans Medium on_surface, optional body in label-sm on_surface_variant.

Behaviour: Animate in from the right (slide + fade, 200ms ease-out). Auto-dismiss after 4 seconds with a subtle height-collapse animation. A thin progress line at the bottom of the card depletes over 4 seconds showing time remaining — Indigo-Slate fill on surface_container_low track.
```

---

**🎨 Stitch Prompt — Skeleton Loader — Sunday**

```
Design the Skeleton Loader component for Sunday.

Skeleton blocks are rounded rectangles matching the shape of the content they replace. Radius: 8px for block shapes, 48px for pill/badge shapes, 50% for avatar circles.

Color: surface_container (#e8eaed) base. Shimmer animation: a subtle horizontal gradient sweep from surface_container to surface_container_low and back, 1.5s loop, ease-in-out. No hard edges — the shimmer transitions are soft.

Applied to:
- Data table rows: full-width shimmer row blocks with gaps matching real row spacing.
- Form fields: input-shaped blocks at 48px height and 48px radius.
- Page titles: wide block at headline-sm height.
- Avatar circles: 40px × 40px circle shimmer.
```

---

**🎨 Stitch Prompt — Empty State — Sunday**

```
Design the Empty State component for Sunday. Applied to every list, table, and grid that returns no results.

Layout: Vertically centred within the content container. Uses display-md sizing for the primary icon to create a high-contrast "visual moment" that breaks the data monotony.

Structure (centred, stacked):
- Outline icon in on_surface_variant, display-md size (reflects the content type: person group for Users, building for Teams, etc.).
- Heading in headline-sm, on_surface. E.g. "No users yet."
- Body copy in label-md, on_surface_variant (1–2 sentences max). Helpful, actionable. E.g. "Add your first team member to get started."
- Optional CTA button: Indigo-Slate gradient, 48px radius. Not always present — only when a direct action resolves the empty state.

No decorative illustrations, no filler graphics. The empty state speaks through typography and generous negative space — consistent with The Digital Atrium philosophy.
```

---

*All prompts above are ready to paste directly into Stitch. Apply one screen at a time. After establishing the App Shell, proceed in the order listed — each screen builds on the shell's established language.*
