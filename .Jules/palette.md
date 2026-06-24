# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-06-12 - Accessible Helper Text Association
**Learning:** In the 'Noori' design system, helper text (rendered with `LabelSm`) must be explicitly linked to inputs via `aria-describedby` to ensure screen readers announce security protocols or requirements.

**Action:** Always verify `id` and `aria-describedby` linkage when adding contextual hints to forms.

## 2024-05-24 - Accessibility Landmarks & Landmark Association
**Learning:** For global accessibility features like "Skip to main content" to function correctly, every major route's primary content container MUST have a stable `id="main-content"`. Additionally, when using Radix-based UI primitives like our `Button`, always use the `asChild` prop when nesting navigation components (like Next.js `Link`) to prevent invalid semantic HTML (nested interactive elements).

**Action:** Ensure all new pages include a `<main id="main-content">` landmark. Standardize `Link`/`Button` nesting using `asChild`.

## 2024-06-24 - Accessible Form Grouping & Mandatory Field Patterns
**Learning:** To semantically group multiple related interactive elements (like role selection buttons), wrap them in a container with `role="group"` and `aria-labelledby` pointing to a visually hidden (`sr-only`) label. For mandatory fields, the project follows a dual-indicator pattern: a red visual asterisk `<span className="text-destructive ml-1" aria-hidden="true">*</span>` and the semantic `aria-required="true"` attribute on the input.

**Action:** Apply `role="group"` to custom selection grids. Use the dual-indicator pattern for all mandatory form inputs to ensure both visual and screen reader clarity.
