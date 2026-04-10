# Stitch Prompts — Sprint 8 — Sunday

**Design System:** The Architectural Quietude ("The Digital Atrium")
**Brand:** Sunday
**Primary Palette:** Indigo-Slate gradient (#4d556a → #656d84, 135°)
**Typography:** Plus Jakarta Sans
**Vibe:** Quiet authority, editorial, architectural depth, no hard borders
**Surface Logic:** #f7f9fb base → #ffffff cards (tonal lift, no 1px lines)
**Glassmorphism:** Overlays at 80% surface opacity, 20px backdrop-blur, ambient shadow rgba(77,85,106,0.06)
**Radii:** 48px for buttons/inputs · 24px for nav items/dropdowns · ambient shadows only

> **Sprint 8 Dependency:** Sprint 2 (Task Detail and Completion Report scaffolding) and Sprint 4 (EOD Wrap-up UI) must be complete. This sprint wires existing upload placeholders to real storage and adds the Task Detail file section.

---

## TASK DETAIL UPDATE — FILE ATTACHMENTS SECTION

---

**🎨 Stitch Prompt — Task Detail: File Attachments Section — Sunday**

```
Update the Task Detail screen for Sunday (/tasks/:id) to add a dedicated File Attachments section in the main content area (left column), below the Dependencies section and above the Completion Report section.

Section label "Attachments" in label-sm Plus Jakarta Sans Medium, on_surface_variant. File count in parentheses: "(3)" in the same label style.

File Upload Component (within this section):
- Drag-and-drop zone: surface_container_low fill, 12px radius, ambient shadow 0px 2px 12px rgba(77,85,106,0.04). Ghost dashed border at outline_variant (#c6c6cd) 15% opacity — the only acceptable border in this system.
- Zone contents (centred): upload cloud icon (32px, on_surface_variant) + label-md on_surface_variant "Drag files here" + "or browse" as an Indigo-Slate (#4d556a) text link, same line.
- Zone height: 80px default. On active drag-over: zone background shifts to surface_container (#e8eaed), border opacity increases to 30%, smooth transition 150ms.
- Below zone: label-sm on_surface_variant "All file types accepted · Max 25MB per file."

Upload progress state (appears inline within the zone, replaces the icon/text during upload):
- Filename in label-md Plus Jakarta Sans Medium, on_surface. Left-aligned.
- Horizontal progress bar below filename: surface_container_low track, Indigo-Slate gradient fill, 48px radius, 4px height. Animated fill from 0–100%.
- Percentage label right of bar: label-sm on_surface_variant.
- If multiple files upload simultaneously: each file gets its own progress row stacked within the zone.

Error state (after upload attempt, inline):
- File row with a muted amber warning icon (16px, #d4820a) left of the filename + error description in label-sm on_surface_variant (e.g. "File too large — maximum 25MB." or "File type not supported. Try converting to PDF."). No red — consistent with Sunday's non-alarming error language.

Attached Files List (below the upload zone):
- Each attached file: surface_container_lowest (#ffffff) card row, 8px radius, ambient shadow 0px 2px 8px rgba(77,85,106,0.04), 4px vertical gap. No border.
- Row contents (left to right):
  - File type icon (24px, on_surface_variant): distinct icons for PDF (document with layered pages), PNG/JPG (landscape photo icon), XLSX (grid icon), DOCX (text page icon), generic (file icon).
  - Filename in label-md Plus Jakarta Sans Medium, on_surface. Truncated with ellipsis if over 2 lines.
  - File size in label-sm on_surface_variant (e.g. "2.4 MB"). Right of filename.
  - Preview icon (eye outline, 20px, on_surface_variant) — only shown for previewable types (PDF, PNG, JPG, JPEG). Clicking opens Modal M17.
  - Download icon (arrow-down-to-line, 20px, on_surface_variant) — always present. Clicking triggers file download.
  - NO delete button on any task-attached file. Files are permanent. No trash icon, no remove option.
- Row hover: surface_container_high tonal background shift. No border on hover.

Timeline log note (not a visual element here — but the spec): every file upload is automatically appended to the task timeline as an entry: "[Actor Name] attached [filename]."
```

💡 *Tip: The absence of a delete icon is a deliberate design statement — task files are a permanent audit record. If users look for it and don't find it, the empty space communicates permanence more clearly than any "permanent" label.*

---

## MODAL M17 — FILE PREVIEW

---

**🎨 Stitch Prompt — Modal M17: File Preview — Sunday**

```
Design the File Preview modal for Sunday. Triggered by clicking the preview icon on any previewable attached file (Task Detail, Completion Report, EOD Wrap-up).

Overlay: near-full black scrim (surface at 85% opacity) — this is the one modal in Sunday that uses a darker, more immersive overlay. The file preview requires focused attention without the page content visible behind it. No glassmorphism here — the dark scrim IS the container cue.

Modal panel: surface_container_lowest (#ffffff), 16px radius, ambient shadow. Centred. Max-width 900px, max-height 90vh. Flexible — adjusts to content.

Modal header (sticky at panel top):
- Left: file type icon (20px, on_surface_variant) + filename in label-md Plus Jakarta Sans Medium, on_surface + file size in label-sm on_surface_variant, space-separated.
- Right: "Download" pill button (tertiary fill #d0c3ba, 48px radius, download icon left, on_surface label-md) + × close button (on_surface_variant, 24px icon button, surface_container_low fill, 48px radius).

Preview content area (below header, fills remaining modal height):

PDF type:
- Full embedded PDF viewer (PDF.js-powered). Fills the content area width. Vertically scrollable.
- PDF toolbar below the header and above the PDF canvas: page count "Page 1 of X" in label-sm on_surface_variant + previous/next page arrow buttons (surface_container_low fill, 32px radius, on_surface_variant icons). Centred in a surface_container_low strip — no border, tonal background distinguishes the toolbar.
- If PDF fails to render: fallback state (see below).

Image type (PNG, JPG, JPEG):
- Image displayed centred in the content area, maintaining aspect ratio. Max dimensions: content area width × 80vh. Contained — no cropping.
- A subtle surface_container_low background behind the image (not pure black) maintains the Sunday aesthetic even in the preview.

Unsupported / download-only fallback (DOCX, XLSX, and any other type):
- Centred within the content area. Outline file icon (on_surface_variant, 64px — display-md sizing for visual moment). Filename in headline-sm, on_surface. Body copy in label-md on_surface_variant: "Preview is not available for this file type." CTA: "Download File" button (Indigo-Slate gradient, 48px radius, Plus Jakarta Sans Medium). Centred.

Close behaviour: × button, clicking the dark scrim outside the panel, or pressing Escape all close the modal.
```

💡 *Tip: The dark scrim (not glassmorphism) for the file preview is an intentional design exception — previewing a document requires the user's full focus, and the immersive overlay signals that this is a different mode of interaction.*

---

## SHARED COMPONENTS INTRODUCED IN SPRINT 8

---

**🎨 Stitch Prompt — File Upload Component (Reusable) — Sunday**

```
Design the File Upload Component for Sunday as a reusable component. Used on Task Detail (new Attachments section), Completion Report (Modal M8), and EOD Wrap-up (/wrapup).

Three size variants of the same component:

Large variant (Task Detail Attachments section):
- Full-width drag-and-drop zone. 80px height. 12px radius. surface_container_low fill.
- Ghost dashed border at outline_variant 15% opacity.
- Centred content: upload icon (32px, on_surface_variant) + label-md "Drag files here" + "or browse" Indigo-Slate link.
- Active drag state: surface_container fill, border opacity 30%.

Compact variant (Completion Report / EOD Wrap-up):
- A single-line pill button: "Attach a file" (tertiary fill #d0c3ba, 48px radius, paperclip icon left, label-md on_surface). No visible drop zone — drag-over on the button area activates the upload.
- After file selected: button is replaced by a pill chip (surface_container_high fill, 24px radius, paperclip icon + filename label-md on_surface + × remove icon right). The × remove clears the selection before upload — not after, since completed submission files are permanent.

All variants share:
- Upload progress: filename + % progress bar (surface_container_low track, Indigo-Slate gradient fill, 48px radius, 4px height). Replaces the interaction element during upload.
- Success: file transitions into the Attached File Row (large variant) or the chip persists (compact variant). No success toast for file uploads — the immediate appearance of the file in the list is the confirmation.
- Error: inline amber warning with filename + specific error reason. Never silent failure.
- Accepted types note: label-sm on_surface_variant below the component. "All file types accepted · Max 25MB per file."
```

---

**🎨 Stitch Prompt — Attached File Row Component (Reusable) — Sunday**

```
Design the Attached File Row component for Sunday. Used in Task Detail Attachments section, Completion Report read-only view, and EOD Wrap-up submitted view.

Container: surface_container_lowest (#ffffff), 8px radius, ambient shadow 0px 2px 8px rgba(77,85,106,0.04), 4px vertical gap between rows. No border.

Row layout (horizontal flex, 12px internal padding, 40px row height minimum):
- Left: file type icon (24px, on_surface_variant). Icon set:
  - PDF → layered document icon.
  - PNG / JPG / JPEG → landscape photo icon.
  - XLSX / CSV → grid/table icon.
  - DOCX → text page icon.
  - All others → generic file icon.
- Centre: filename in label-md Plus Jakarta Sans Medium, on_surface. Truncated with ellipsis if longer than available width. File size in label-sm on_surface_variant, immediately after the filename (same line, space-separated).
- Right (action icons, 20px each, on_surface_variant, 8px gap between):
  - Preview icon (eye outline): only rendered for PDF, PNG, JPG, JPEG. Clicking opens M17.
  - Download icon (arrow-down-to-line): always rendered. Clicking downloads the file.
  - NO delete / trash icon — files are permanent records.

Row hover: surface_container_high tonal background shift. Preview and download icons become on_surface (slightly darker, more visible). No border.

Read-only mode (Completion Report after Done, EOD Wrap-up after submission): identical visual — no interactive state change needed since files were always read-only for other users.
```

---

*All prompts above are ready to paste directly into Stitch. Recommended order: Task Detail Attachments section update → File Upload Component (all variants) → Attached File Row component → File Preview Modal M17.*
