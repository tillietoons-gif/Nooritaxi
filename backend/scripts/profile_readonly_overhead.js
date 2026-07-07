
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const queryDelay = 50;
    const txOverhead = 10;

    console.log('--- Simulating Read-Only Transaction Overhead ---');

    // Sequential in transaction (Prisma $transaction with array of queries)
    // Actually Prisma $transaction executes them sequentially or in parallel depending on how it's called.
    // If it's an array, it's sequential.
    const start1 = Date.now();
    await delay(txOverhead); // Transaction start
    await delay(queryDelay); // findMany
    await delay(queryDelay); // count
    await delay(txOverhead); // Transaction commit
    const time1 = Date.now() - start1;
    console.log(`Prisma $transaction (sequential): ${time1}ms`);

    // Promise.all (parallel)
    const start2 = Date.now();
    await Promise.all([delay(queryDelay), delay(queryDelay)]);
    const time2 = Date.now() - start2;
    console.log(`Promise.all (parallel): ${time2}ms`);

    console.log(`\nLatency reduction: ${time1 - time2}ms (~${(((time1 - time2) / time1) * 100).toFixed(2)}%)`);
}

main();
