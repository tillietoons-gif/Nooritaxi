
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sequentialCreateRide() {
  const start = Date.now();

  // 1. First block: Create ride and find driver
  await delay(50); // mock tx.trip.create
  await delay(50); // mock dispatch.findNearestOnlineDriver

  // 2. Second block: Update ride, driver and find devices
  await delay(50); // mock tx.trip.update
  await delay(50); // mock tx.driver.updateMany
  await delay(50); // mock tx.pushDevice.findMany

  return Date.now() - start;
}

async function parallelCreateRide() {
  const start = Date.now();

  // 1. First block: Parallelize create and dispatch
  await Promise.all([
    delay(50), // mock tx.trip.create
    delay(50), // mock dispatch.findNearestOnlineDriver
  ]);

  // 2. Second block: Parallelize updates and device fetching
  await Promise.all([
    delay(50), // mock tx.trip.update
    delay(50), // mock tx.driver.updateMany
    delay(50), // mock tx.pushDevice.findMany
  ]);

  return Date.now() - start;
}

async function run() {
  console.log('--- Profiling createRide Latency (Mocked 50ms per query) ---');

  const seqTime = await sequentialCreateRide();
  console.log(`Sequential execution: ${seqTime}ms`);

  const parTime = await parallelCreateRide();
  console.log(`Parallel execution:   ${parTime}ms`);

  const improvement = ((seqTime - parTime) / seqTime * 100).toFixed(1);
  console.log(`Latency reduction:    ${improvement}%`);
}

run();
