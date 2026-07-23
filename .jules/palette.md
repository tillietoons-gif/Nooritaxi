# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-07-23 - Global Search Keyboard Shortcut & Accessible Form Labels
**Learning:** Adding standard keyboard shortcuts (such as `/` to focus search fields) greatly speeds up navigation for power users, but we must protect against hijacking focus when a user is typing inside interactive fields like input fields, textareas, or contenteditable areas. Additionally, empty `htmlFor` attributes on typography/label primitives create invalid elements and cause React rendering warnings.

**Action:** Implement global listeners with comprehensive tag-exclusion logic (`tagName !== "input" && tagName !== "textarea" && tagName !== "select"`), provide a visual `<kbd>` cue, and ensure all labels are semantically paired or left unassigned without empty strings.
