
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function mockTransfer(ms) {
    console.log(`Starting transfer (${ms}ms)...`);
    await delay(ms);
    console.log(`Transfer finished.`);
}

async function mockDeposit(ms) {
    console.log(`Starting deposit (${ms}ms)...`);
    await delay(ms);
    console.log(`Deposit finished.`);
}

async function runSequential() {
    console.log('\n--- Running Sequential ---');
    const start = Date.now();
    await mockTransfer(50);
    await mockDeposit(50);
    const end = Date.now();
    console.log(`Total time: ${end - start}ms`);
    return end - start;
}

async function runParallel() {
    console.log('\n--- Running Parallel ---');
    const start = Date.now();
    await Promise.all([
        mockTransfer(50),
        mockDeposit(50)
    ]);
    const end = Date.now();
    console.log(`Total time: ${end - start}ms`);
    return end - start;
}

async function main() {
    const seq = await runSequential();
    const par = await runParallel();
    console.log(`\nReduction: ${(((seq - par) / seq) * 100).toFixed(2)}%`);
}

main();
