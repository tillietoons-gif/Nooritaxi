# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-07-20 - ARIA Combobox Pattern for Custom Location Suggestions

**Learning:** Custom location suggest boxes lack native keyboard and screen reader support unless configured explicitly as ARIA comboboxes. For optimal accessibility and usability, a combobox needs to expose search lists as listboxes with a focus-within container style, wrap-around index navigation on arrow keys, and dynamic updates to `aria-activedescendant` and `aria-selected` to keep assistive tech synchronized.

**Action:** Wrap search suggest fields in relative containers styled with a `group` class and dynamic gold icon transitions (`group-focus-within:text-gold`). Add state-driven index mapping, intercept arrow keys and Escape, and ensure the suggestions list is accessible as a `role="listbox"` with `role="option"` elements.
