## 2025-05-29 - [Micro-UX: Password Toggle & Search Clear]
**Learning:** Users often struggle with password entry errors on mobile and web when masking is mandatory. A simple visibility toggle significantly reduces friction. Additionally, icon-only buttons in navigation (like notification bells or search clear buttons) require explicit aria-labels to be accessible.
**Action:** Always include a password visibility toggle in auth forms and ensure every icon-button has an `aria-label`.

## 2026-06-04 - [Accessibility: Skip to Main Content]

**Learning:** Large navigation menus create significant friction for keyboard and screen reader users. A "Skip to main content" link is a critical accessibility requirement (WCAG 2.4.1) that allows bypassing repetitive blocks. Using `focus:fixed` ensures the link is visible and accessible even when interacting with sticky headers.

**Action:** Ensure all new major layouts include the `SkipToContent` component and a corresponding `id="main-content"` on the primary landmark.
