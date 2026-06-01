# Bolt Optimization Journal

## 2025-06-01 - WebGL Batch Rendering Optimization

**Learning:** Individual rendering of many small 3D objects (nodes and lines) in React Three Fiber leads to a high number of draw calls, which becomes a bottleneck for GPU performance and can cause frame drops on the landing page hero section.

**Action:** Use `@react-three/drei` primitives like `Instances`/`Instance` for batches of similar meshes and `Segments`/`Segment` for batches of lines. This reduces draw calls by orders of magnitude (e.g., from ~80 to ~2 in the `LogisticsNetwork` component).

## Mobile App Performance and Fixes
- Centralized API calls in `mobile/src/lib/api.ts` to ensure consistent Authorization headers and error handling.
- Optimized Food and Restaurant screens by reducing redundant fetch calls and improving loading states.
- Implemented functional Language Switcher and Help/Support pages to replace placeholder alerts.
- Fixed dead links in Profile tab, redirecting "Safety Center" to the functional Trusted Contacts page.
- Enhanced Wallet UI with a functional Top Up feature integrated with the backend deposit API.
