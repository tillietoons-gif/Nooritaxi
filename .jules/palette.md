# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-07-04 - [Form Feedback & Base UI Consistency]

**Learning:** Base UI components like `Textarea` often lag behind `Input` in accessibility styling (e.g., `aria-invalid` support), leading to inconsistent error feedback. Additionally, using `htmlFor=""` on typography components intended as section headers creates invalid semantic associations.

**Action:** Always verify that `aria-invalid` utility classes are synchronized across all form primitive components. Use `aria-describedby` combined with `aria-live="polite"` for dynamic form feedback like character counters to ensure screen reader users receive timely updates without being interrupted.
