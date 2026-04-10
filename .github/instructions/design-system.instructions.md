---
description: "Use when building, copying, redesigning, or recreating any UI component, screen, or layout. Enforces The Architectural Quietude design system. Read design.md in the workspace root before writing any UI code."
applyTo: "**/*.tsx"
---

# Design System: The Architectural Quietude

Before writing any UI code, read `design.md` in the workspace root. It is the single source of truth. The rules below are a strict summary — `design.md` wins on any ambiguity.

## Step 0 — Always Read First

Before implementing any screen, component, or layout:
1. Open `design.md` in the workspace root and read it fully.
2. If a UX HTML file exists under `Ui-Ux/`, read it before writing a single line of markup.

## Colors & Surfaces

- **Never use 1px solid borders** for containment or sectioning. Boundaries come from tonal shifts between surface tokens only.
- Surface hierarchy (outermost → innermost): `surface` (#f7f9fb) → `surface-container-low` → `surface-container-lowest` (#ffffff).
- Use `surface-container-lowest` for primary cards to achieve the maximum "lift" against the page.
- Text color is always `on-surface` (#191c1e). **Never use pure black (#000000).**
- Metadata labels use `on-surface-variant` (#45464c / #434655) only.

## Gradient & Glassmorphism

- **Signature Gradient** (primary CTAs, brand moments): `linear-gradient(135deg, #4d556a 0%, #656d84 100%)`. In Tailwind: `bg-gradient-to-br from-[#4d556a] to-[#656d84]`.
- **Glassmorphism** (modals, dropdowns, overlays): `bg-surface/80 backdrop-blur-[20px] shadow-[0px_24px_48px_rgba(77,85,106,0.06)]`.
- Ambient shadows use Indigo-Slate at 6% opacity: `shadow-[0px_24px_48px_rgba(77,85,106,0.06)]`. Never use heavy drop shadows.

## Typography

- Page titles: `text-[1.5rem] font-bold tracking-tight` (–0.02em).
- Empty state / hero stats: large display weight to create a visual "moment".
- Never use `font-black` unnecessarily — reserve it for critical numeric callouts.

## Border Radius

- **Buttons, chips, inputs, pills**: `rounded-full` (48px). No exceptions.
- **Nav items, menu items, dropdowns, cards**: `rounded-[24px]` or `rounded-xl`.
- **No sharp corners anywhere.** `rounded-none` and `rounded-sm` are forbidden in UI components.

## Borders & Ghost Borders

- If a stroke is absolutely required (accessibility/contrast), use `border border-outline-variant/15` only — never full opacity.
- Horizontal `<hr>` divider lines between list items are **forbidden**. Use vertical `gap-2` spacing instead.

## List Item Separation

- Separate list items with `gap-2` or `gap-4` vertical spacing + `hover:bg-surface-container-high` hover state.
- Do not use `divide-y` or `border-b` between list rows.

## Elevation Checklist (run before submitting any UI PR)

- [ ] No 1px solid border used for sectioning
- [ ] All buttons/inputs are `rounded-full`
- [ ] All nav/card elements use `rounded-[24px]` or `rounded-xl`
- [ ] Gradient is `from-[#4d556a] to-[#656d84]` on primary CTAs
- [ ] Modals use glassmorphism (`bg-surface/80 backdrop-blur-[20px]`)
- [ ] Shadows are ambient (`rgba(77,85,106,0.06)`), not heavy drop shadows
- [ ] No `#000000` text — only `text-on-surface` or `text-on-surface-variant`
- [ ] No `<hr>` or `divide-y` between list items
- [ ] `design.md` was read before starting this component
