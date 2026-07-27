# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-07-27 - [WAI-ARIA Combobox & Keyboard cycling on book page]

**Learning:** Custom address suggestion lists or autocomplete dropdowns are highly fragile for screen reader users and keyboard-only navigators if standard ARIA combobox specifications are absent. Key interactions like modulo-based ArrowUp/ArrowDown wrap-around must be natively managed while properly updating focus/selection status.

**Action:** Always implement the complete combobox spec on search/address lists: role="combobox", aria-autocomplete="list", aria-expanded={isOpen}, aria-controls={dropdownId}, aria-activedescendant={activeId}, alongside role="listbox" on the container, role="option" / aria-selected on children, and tabIndex={-1} on list items so standard focus order isn't hijacked.
