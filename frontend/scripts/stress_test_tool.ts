import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const QUERIES = [
    { type: 'specific_item', value: 'cimento' },
    { type: 'specific_item', value: 'tubo' },
    { type: 'specific_item', value: 'conexao' },
    { type: 'specific_item', value: 'areia' },
    { type: 'low_stock', value: 'undefined' },
    { type: 'specific_item', value: 'tijolo' },
    { type: 'specific_item', value: 'piso' },
    { type: 'specific_item', value: 'argamassa' },
    { type: 'specific_item', value: 'bucha' },
    { type: 'specific_item', value: 'parafuso' },
];

async function runStressTest() {
    console.log("🚀 Starting Stress Test (50 iterations)...");

    // Dynamic import to ensure dotenv is loaded first
    const { tools } = await import('../app/api/chat/tools') as any;

    let successCount = 0;
    let failureCount = 0;
    let emptyCount = 0;

    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
        const query = QUERIES[i % QUERIES.length];
        const iterNum = i + 1;

        process.stdout.write(`\r[${iterNum}/50] Testing '${query.value}' (${query.type})... `);

        try {
            const startIter = Date.now();
            const result: any = await tools.analyzeStock.execute!({
                filterType: query.type as any,
                filterValue: query.value
            });
            const duration = Date.now() - startIter;

            if (result.error) {
                failureCount++;
                console.log(`❌ Error: ${result.error}`);
            } else if (result.count !== undefined) {
                successCount++;
                if (result.count === 0) emptyCount++;
                // console.log(`✅ OK (${result.count} items) - ${duration}ms`);
            } else if (result.message) {
                successCount++;
                emptyCount++;
                // console.log(`⚠️ Empty (${result.message}) - ${duration}ms`);
            }
        } catch (e: any) {
            failureCount++;
            console.log(`❌ Exception: ${e.message}`);
        }
    }

    const totalTime = (Date.now() - startTime) / 1000;

    console.log("\n\n--- SUMMARY ---");
    console.log(`Total Requests: 50`);
    console.log(`Success: ${successCount}`);
    console.log(`Failures: ${failureCount}`);
    console.log(`Empty Results: ${emptyCount}`);
    console.log(`Total Time: ${totalTime.toFixed(2)}s`);
    console.log(`Average Time: ${(totalTime / 50).toFixed(2)}s`);
}

runStressTest();
