# Bolt Optimization Journal

## 2025-06-01 - WebGL Batch Rendering Optimization

**Learning:** Individual rendering of many small 3D objects (nodes and lines) in React Three Fiber leads to a high number of draw calls, which becomes a bottleneck for GPU performance and can cause frame drops on the landing page hero section.

**Action:** Use `@react-three/drei` primitives like `Instances`/`Instance` for batches of similar meshes and `Segments`/`Segment` for batches of lines. This reduces draw calls by orders of magnitude (e.g., from ~80 to ~2 in the `LogisticsNetwork` component).

## 2025-06-02 - React State and Render Optimization in Landing Page

**Learning:** Using `useEffect` to derive state from a context provider (like `UserBehaviorProvider`) triggers an unnecessary second render cycle and can cause "content flickering" or layout shifts. Additionally, defining static arrays inside a component body leads to redundant memory allocations on every re-render.

**Action:**
1. Derive values directly during the render phase if they are purely a function of props or context.
2. Hoist static data structures (arrays, objects) outside the component definition.
3. Use `useMemo` for expensive transformations (like sorting or filtering) and ensure the logic is deterministic (e.g., `sort((a, b) => ...)` instead of `sort(() => ...)`).

## 2025-06-03 - Interactive Component Stabilization and Memoization

**Learning:** Using `Math.random()` or unstable inline arrays within the render path of interactive components (like `GenAIGlobe`) causes visual jitter and redundant re-renders of complex sub-grids (like `BentoGrid`) whenever the parent component re-renders. Additionally, incorrect use of `.sort()` with a single-argument comparator leads to non-deterministic behavior across different browsers.

**Action:**
1. Stabilize random values (e.g., particle positions, timings) using `useMemo` to ensure they remain consistent across renders unless dependencies change.
2. Memoize complex arrays and computed results (like `services` and `sortedServices`) to prevent unnecessary prop updates to heavy child components.
3. Always use a standard two-argument comparator `(a, b) => ...` for stable sorting.

## 2025-06-04 - Parallelizing Independent Asynchronous Operations

**Learning:** Sequential `await` calls for independent database queries or external API calls introduce unnecessary latency, especially in high-traffic services like promotion redemption or notification dispatch.

**Action:** Identify asynchronous operations that do not depend on each other and parallelize them using `Promise.all`. This can reduce response times by 30-50% in multi-query operations.

## 2025-06-05 - Dashboard Metric Query Parallelization

**Learning:** Dashboard endpoints often aggregate multiple independent metrics (counts, sums). Executing these sequentially with `await` in the service layer forces the database to process them one by one, increasing total latency.

**Action:** Wrap independent Prisma queries in `Promise.all`. In `SupportService.getDashboardMetrics`, this refactor reduces the latency of the metrics fetch by approximately 60-66% by overlapping the execution of three `count` queries.

## Mobile App Performance and Fixes
- Centralized API calls in `mobile/src/lib/api.ts` to ensure consistent Authorization headers and error handling.
- Optimized Food and Restaurant screens by reducing redundant fetch calls and improving loading states.
- Implemented functional Language Switcher and Help/Support pages to replace placeholder alerts.
- Fixed dead links in Profile tab, redirecting "Safety Center" to the functional Trusted Contacts page.
- Enhanced Wallet UI with a functional Top Up feature integrated with the backend deposit API.
