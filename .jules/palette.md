# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2026-03-05 - [Global Keyboard Focus Shortcuts]

**Learning:** Global keyboard shortcuts (such as `/` to focus search inputs) can significantly boost power-user momentum, but must explicitly check that `document.activeElement` is not an editable field (like `INPUT`, `TEXTAREA`, or elements with `contenteditable="true"`) to avoid disrupting standard text entry. Providing a semantic label (via `<LabelMd htmlFor="...">`) and a visual cue (via `<kbd>`) ensures perfect screen reader association and interactive clarity.

**Action:** Implement ref forwarding using `React.forwardRef` on primitive input components to allow programmatic focus targeting, and mount a global event listener inside a `useEffect` to safely intercept keystrokes for targeting.
