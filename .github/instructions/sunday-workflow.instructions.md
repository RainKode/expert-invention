---
description: "Use when developing Sunday, working on sprints, continuing a session, or confused about any product feature, scope, or design decision. Covers how to orient yourself, what to read first, and how to log progress."
applyTo: "**"
---

# Sunday Development Workflow

## 1. Starting Any Session — Read Context First

Before writing a single line of code or making any decision, read `where we at.md` in the workspace root.

- This file contains the full written context of what has been built, what was referenced, and what decisions were made in previous sessions.
- If it is empty or does not exist, treat the project as a fresh start and proceed to the architecture document.
- Do not rely on memory or assumptions from prior context — always re-read this file at the start of each session.

## 2. Product Confusion or Feature Questions — Read the Architecture

If there is any confusion about what the product does, how a feature should behave, what a role can do, or what scope is in v1, read `sunday-product-architecture.md`.

- This file is the single source of truth for the entire product.
- Do not invent behaviour, infer scope, or make assumptions that contradict this document.
- When in doubt, the architecture document wins.

## 3. Active Development — Follow the Sprint Plan

All development work is structured around `sunday-sprint-plan.md`.

- Check which sprint is currently in progress before starting work.
- Only build what is in scope for the current sprint — do not skip ahead or pull in work from future sprints.
- Respect the dependency order defined in the sprint plan; do not build a module that depends on one that hasn't been completed yet.
- Each sprint, when completed successfully, produces a shippable, working increment of the product.

## 4. After a Successful Sprint — Update the Log

After each sprint is completed successfully, update `where we at.md` with a concise but complete session log. Include:

- Which sprint was completed and what modules/features were built.
- Key decisions made during the session (e.g., schema choices, library selections, behavioural calls).
- Files created or modified and their purpose.
- Any references consulted (architecture sections, external docs, etc.).
- Anything left incomplete or deferred, and why.
- What the next session should start with.

Write this in plain prose — clear enough that someone with no memory of the session can pick up exactly where this session left off.

## 5. Continuing Mid-Sprint

If a session ends mid-sprint (incomplete work), still update `where we at.md` with:

- Current sprint and what was accomplished so far.
- Exactly where in the sprint work stopped.
- What the next immediate step is.

## 6. UI/UX Implementation — Always Follow the Design Files

All UI must be built from the design files located in `F:\Taskmanagment\Ui-Ux`.

- That folder contains subfolders named after each screen or feature (e.g., `login`, `dashboard`, `task-board`).
- Each subfolder contains two design artefacts:
  - An **image** — the visual reference for the screen.
  - An **HTML file** — the full UX definition including layout, structure, spacing, and component behaviour.
- The HTML file is the authoritative design spec. Always read it before building the corresponding screen.
- Implement the UI to match the design exactly — do not invent layouts, rearrange sections, or substitute components.
- Every screen must be made **responsive** — the design file defines the desktop intent; adapt appropriately for tablet and mobile without breaking the design language.
- If a screen is being built and no design file exists for it yet, flag this before proceeding rather than guessing.

## Reference Files

| File | Purpose |
|------|---------|
| `sunday-product-architecture.md` | Complete product definition — roles, features, rules, scope |
| `sunday-sprint-plan.md` | Sprint order, module registry, dependency map, per-sprint deliverables |
| `where we at.md` | Running session log — read first, update after every sprint |
| `F:\Taskmanagment\Ui-Ux\` | UX design folder — image + HTML per screen, authoritative design spec |
