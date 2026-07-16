# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-07-16 - [Contact Page UX & Accessibility]

**Learning:** Actionable `tel:` and `mailto:` links within a semantic `<address>` block improve mobile usability and clarity for contact information. Character counters should be associated with inputs via `aria-describedby` and use `aria-live="polite"` to keep assistive technology users informed of remaining space without interrupting their typing flow.

**Action:** Ensure all contact information uses appropriate URI schemes and semantic tags. Implement character counters with appropriate ARIA attributes for all constrained text areas.
