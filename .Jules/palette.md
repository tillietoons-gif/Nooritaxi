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

## 2026-06-13 - ARIA-Compliant Combobox & Visual Focus feedback
**Learning:** Custom suggestion/search lists (like pickup and dropoff inputs in the booking page) must be fully navigable by keyboard and announced properly by assistive technologies. Using `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, and `aria-activedescendant` provides standard screen reader integration. Combining the input relative container with the `group` class allows applying `group-focus-within:text-gold` on visual elements like icons for delightful, high-contrast, context-aware focus cues.

**Action:** Always implement loop-around arrow key navigation, Enter selection, and Escape dismissal for custom combobox lists, paired with proper visual feedback.
