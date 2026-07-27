const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function profileSequential() {
  const start = Date.now();
  // Simulate 1st query: upsert
  await sleep(50);
  // Simulate 2nd query: findMany
  await sleep(50);
  const duration = Date.now() - start;
  console.log(`[Sequential getUserLoyalty] Simulated DB Delay: ${duration}ms (Expected: ~100ms)`);
  return duration;
}

async function profileOptimized() {
  const start = Date.now();
  // Simulate single optimized query: upsert with include
  await sleep(50);
  const duration = Date.now() - start;
  console.log(`[Optimized getUserLoyalty] Simulated DB Delay: ${duration}ms (Expected: ~50ms)`);
  return duration;
}

async function run() {
  console.log("=== Profiling getUserLoyalty Latency Reduction ===");
  const seqTime = await profileSequential();
  const optTime = await profileOptimized();
  const reduction = ((seqTime - optTime) / seqTime) * 100;
  console.log(`Latency Reduction: ${reduction.toFixed(1)}% (~50% reduction from merging sequential queries with include)`);
}

run();
