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

## 2024-06-25 - Required Field Accessibility Pattern
**Learning:** For a consistent and accessible experience with required form fields, use a visual indicator (red asterisk) wrapped in `aria-hidden="true"` inside the label, and apply `aria-required="true"` directly to the input. This provides clear visual guidance without adding redundant announcements for screen reader users who already hear the "required" state from the input attribute.

**Action:** Apply the `<span className="text-destructive ml-1" aria-hidden="true">*</span>` pattern to labels of mandatory inputs and ensure `aria-required="true"` is present on the input elements.

## 2024-06-25 - Semantic Grouping for Multi-Button Selection
**Learning:** When presenting a set of buttons for role selection or similar mutually exclusive options, wrapping them in a container with `role="group"` and `aria-labelledby` ensures screen readers announce the context of the choices being made.

**Action:** Use `role="group"` and `aria-labelledby` referencing a descriptive (possibly `sr-only`) label for any grid or list of selection buttons.
