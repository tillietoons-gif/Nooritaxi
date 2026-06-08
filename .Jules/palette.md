## 2025-05-29 - [Micro-UX: Password Toggle & Search Clear]
**Learning:** Users often struggle with password entry errors on mobile and web when masking is mandatory. A simple visibility toggle significantly reduces friction. Additionally, icon-only buttons in navigation (like notification bells or search clear buttons) require explicit aria-labels to be accessible.
**Action:** Always include a password visibility toggle in auth forms and ensure every icon-button has an `aria-label`.

## 2026-06-03 - [Accessibility: Global Focus Management & Skip Link]

**Learning:** Global layout components like headers and footers often lack clear focus indicators for keyboard users, and deep page structures benefit significantly from a "Skip to Main Content" link to reduce repetitive navigation. Consistency in focus styles across brand elements (logo) and functional elements (nav links) improves perceived quality.

**Action:** Implement "Skip to Content" links in `layout.tsx` targeting a consistent `id="main-content"` on every page's primary container. Always use `focus-visible` to provide high-contrast focus rings (`ring-primary`) on all interactive elements.

## 2025-06-10 - [UX: Form Usability & Mobile Optimization]

**Learning:** Authentication forms significantly benefit from specific `autoComplete` attributes (`tel`, `current-password`, `new-password`, `name`) which reduce cognitive load by allowing password managers and browser autofill to work seamlessly. Additionally, using `type="tel"` for phone inputs ensures the correct numeric keypad is displayed on mobile devices, preventing user frustration.

**Action:** Always apply appropriate `autoComplete` and `type` attributes to form inputs, especially in critical paths like login and signup.
