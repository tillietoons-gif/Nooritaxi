## 2025-05-14 - Spatial Bounding Box & Parallel Routing

**Learning:** Fetching all online drivers and filtering them in-memory is inefficient when the driver pool grows. Implementing a spatial bounding box in the database query (using `currentLat`/`currentLng` indexes) significantly reduces memory usage and DB-to-API payload size. Additionally, sequential "routing" API calls (mocked or real) introduce unnecessary latency; parallelizing these calls with `Promise.all` reduces total execution time to the duration of the slowest single call.

**Action:** Always use bounding box queries for location-based searches before applying more complex distance algorithms (like Haversine or OSRM). Parallelize independent async operations like external routing checks.
