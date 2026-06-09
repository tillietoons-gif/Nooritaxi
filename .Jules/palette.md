# UX & Accessibility Learnings

## High-Tech + Cultural Uniqueness (Mobile)
- **Visual Identity:** Combined modern 'high-tech' aesthetics (glassmorphism, deep emerald shadows, sharp typography) with traditional Afghan geometric patterns.
- **Micro-patterns:** Introduced `PatternOverlay` using SVG paths to create subtle, repeating localized motifs in headers and primary cards without increasing asset size.
- **Color Strategy:** Used Emerald Green (#006947) as the primary 'Tech' base and Gold (#D4AF37) as the 'Cultural' accent, creating a unique premium feel.
- **Accessibility:**
  - Maintained high contrast for text (white on emerald, foreground on off-white).
  - Used large touch targets (14-16px height for primary buttons) to accommodate one-handed mobile use.
  - Consistent RTL-ready layout structures.

## 2024-05-22 - Premium Form Feedback Pattern

**Learning:** Users experience high anxiety during form transmissions in mission-critical applications. Replacing standard HTML forms with a "Protocol-driven" UI that includes transition states (Loading -> Success Confirmation) significantly improves perceived reliability.

**Action:** Use `AnimatePresence` from `framer-motion` to swap between the form and a success state. Ensure the success state provides a clear action to return or proceed, and includes a visual confirmation (e.g., `CheckCircle2`).
