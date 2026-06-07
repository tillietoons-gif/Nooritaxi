## 2025-05-29 - [Micro-UX: Password Toggle & Search Clear]
**Learning:** Users often struggle with password entry errors on mobile and web when masking is mandatory. A simple visibility toggle significantly reduces friction. Additionally, icon-only buttons in navigation (like notification bells or search clear buttons) require explicit aria-labels to be accessible.
**Action:** Always include a password visibility toggle in auth forms and ensure every icon-button has an `aria-label`.

## 2026-06-03 - [Accessibility: Global Focus Management & Skip Link]

**Learning:** Global layout components like headers and footers often lack clear focus indicators for keyboard users, and deep page structures benefit significantly from a "Skip to Main Content" link to reduce repetitive navigation. Consistency in focus styles across brand elements (logo) and functional elements (nav links) improves perceived quality.

**Action:** Implement "Skip to Content" links in `layout.tsx` targeting a consistent `id="main-content"` on every page's primary container. Always use `focus-visible` to provide high-contrast focus rings (`ring-primary`) on all interactive elements.

## 2026-06-07 - [Form UX: Autocomplete & Semantic Input Types]

**Learning:** Missing `autocomplete` attributes and generic `type="text"` for specialized fields (phone, passwords) significantly degrade the experience for mobile users and those relying on password managers. Browsers use these hints to provide correct virtual keyboards (e.g., numeric for `tel`) and secure credential suggestions.

**Action:** Always apply semantic `type` (e.g., `tel`, `email`) and standard `autoComplete` values (`name`, `tel`, `current-password`, `new-password`) to form inputs to ensure cross-device usability and security.
