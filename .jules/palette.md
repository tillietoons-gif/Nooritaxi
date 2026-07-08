# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-07-08 - Accessible Combobox for Location Search

**Learning:** Implementing keyboard navigation for search suggestions requires the WAI-ARIA Combobox pattern (role="combobox", aria-activedescendant, etc.) to ensure screen readers can track the active suggestion without moving focus from the input field. Brittle regex in tests checking for multi-line or formatted UI strings should be avoided or made more flexible.

**Action:** Use a shared 'handleKeyDown' logic and 'aria-activedescendant' for all future suggestion/autocomplete components. Always use regex (e.g., /Terminal 1.*KBL-4242/) in tests to accommodate varying separators (hyphens vs bullets) rendered by UI components.
