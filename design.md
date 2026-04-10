# Design System Specification: The Architectural Quietude
 
## 1. Overview & Creative North Star: "The Digital Atrium"
This design system is built on the philosophy of **"task Managment."** In architecture, an atrium provides light, air, and a sense of monumental calm. For an HR SaaS, we move away from the cluttered "dashboard" look and toward a curated, editorial experience. 
 
The system rejects the traditional "boxed-in" web aesthetic. By eliminating 1px borders and utilizing tonal shifts, we create an environment that feels infinite yet structured. It is high-end, quiet, and intentional, designed for HR professionals who value clarity over noise.
 
**The Creative North Star:**
*   **Architectural Depth:** Using layers of color rather than lines to define space.
*   **Intentional Asymmetry:** Breaking the grid with oversized typography and sweeping radii.
*   **Quiet Authority:** A palette that feels grounded (Indigo-Slate) and breathable (Mist White).
 
---
 
## 2. Colors & Surface Logic
 
### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries are defined solely through:
1.  **Tonal Shifts:** Placing a `surface_container_low` card on a `surface` background.
2.  **Shadow Depth:** Using diffused ambient shadows to lift elements.
3.  **Negative Space:** Using generous padding to imply grouping.
 
### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tokens to create "nested" depth:
*   **Base Layer (`surface`):** The foundation of the page (#f7f9fb).
*   **Secondary Layer (`surface_container_low`):** Used for large structural groupings or sidebar backgrounds.
*   **Interactive Layer (`surface_container_lowest`):** Used for primary cards and white-space containers (#ffffff) to provide maximum "lift."
 
### The "Glass & Gradient" Rule
To ensure the platform feels premium and custom:
*   **Signature Gradient:** Main CTAs and Primary Brand moments must use a linear gradient: `primary_container` (#4d556a) to `secondary` (#656d84) at 135 degrees.
*   **Glassmorphism:** Overlays (Dropdowns, Tooltips, Modals) must utilize the Glass effect: 80% opacity of the surface color, 20px `backdrop-blur`, and the specific ambient shadow: `0px 24px 48px rgba(77, 85, 106, 0.06)`.
 
---
 
## 3. Typography: Editorial Authority
We utilize **Plus Jakarta Sans** for its geometric clarity and modern humanist touch.
 
*   **Page Titles (`headline-sm`):** The anchor of the page. Set at 1.5rem with a **-0.02em letter-spacing**. This "tight" tracking gives the header an authoritative, editorial feel.
*   **Hierarchy as Navigation:** Use `display-md` for empty states or hero stats to create a high-contrast visual "moment" that breaks the monotony of data.
*   **Labeling:** `label-md` and `label-sm` should be used sparingly for metadata, always in `on_surface_variant` (#434655) to maintain the quiet aesthetic.
 
---
 
## 4. Elevation & Depth
 
### The Layering Principle
Depth is achieved by "stacking" tones. 
*   **Example:** A user profile card (`surface_container_lowest`) sits atop a workspace area (`surface_container_low`), which sits atop the global background (`background`). This creates a soft, natural lift that mimics fine paper.
 
### Ambient Shadows & Ghost Borders
*   **Ambient Shadows:** Avoid "Drop Shadows." Use high-blur, low-opacity shadows. The shadow color should always be a tinted Indigo-Slate (`#4d556a` at 6% opacity) rather than a neutral grey.
*   **The Ghost Border:** If accessibility requires a stroke (e.g., in high-contrast mode or specific data inputs), use `outline_variant` (#c6c6cd) at **15% opacity**. Never use a 100% opaque border.
 
---
 
## 5. Components
 
### Buttons & Chips (The "Pill" Form)
*   **Radius:** Always 48px (`xl` or `full`).
*   **Primary:** Uses the Signature Indigo-Slate Gradient. Text is `on_primary`.
*   **Tertiary:** Uses the `tertiary` token (#d0c3ba) for a sophisticated, warm-neutral alternative to standard grey buttons.
*   **Search/Input Fields:** Must use the 48px radius to match the soft architectural language.
 
### Navigation Items & Dropdowns (The "Soft" Form)
*   **Radius:** 24px (`md` or `lg`). This creates a visual distinction between "Action" elements (Buttons) and "Structural" elements (Nav/Menus).
*   **Dropdowns:** Must implement the Glassmorphism rule (80% opacity + 20px blur).
 
### Cards & Lists (No-Divider Rule)
*   **Instruction:** Forbid the use of horizontal divider lines (`
`). 

*   **Separation:** Separate list items using a 4px or 8px vertical gap and a subtle background hover state (`surface_container_high`). 
*   **Hierarchy:** Use typography weight and `on_surface_variant` color shifts to distinguish between a "Title" and "Subtitle" within a list.
 
---
 
## 6. Do’s and Don’ts
 
### Do
*   **Do** use asymmetrical padding. Give titles more "sky" (top padding) than bottom padding to create an editorial flow.
*   **Do** use `tertiary` (#d0c3ba) for "Human" elements—mentorship icons, employee anniversaries, or soft notifications.
*   **Do** rely on `Plus Jakarta Sans` medium weights for buttons to ensure legibility against the Indigo-Slate gradients.
 
### Don't
*   **Don't** use sharp corners. Everything in this system is softened to create a "Quiet" atmosphere.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#191c1e) to keep the contrast sophisticated, not jarring.
*   **Don't** use standard "Material" shadows. If it looks like a default shadow, it is too heavy. It must feel like light passing through glass.