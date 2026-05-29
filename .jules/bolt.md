## 2026-05-29 - [Spatial Optimization in Driver Dispatch]
**Learning:** Initial implementation of driver dispatch fetched drivers by rating first, then filtered by distance in memory. This is a O(N) bottleneck that skips nearby drivers if they aren't highly rated globally.
**Action:** Use spatial bounding box pre-filtering in SQL to utilize the `[currentLat, currentLng]` index, ensuring O(log N) search and correct "nearest" semantics.

## 2026-05-29 - [Point-in-Polygon Bounding Box Early Exit]
**Learning:** Point-in-polygon (PIP) algorithms like ray-casting are O(V) where V is the number of vertices. Checking a point against many complex polygons (e.g., surge zones) can become expensive.
**Action:** Always wrap expensive PIP checks in a simple O(1) bounding box pre-check to quickly discard distant polygons.
