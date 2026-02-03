import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest() {
    console.log("🛠️ Testing analyzeStock tool execution...");

    // Dynamic import to ensure dotenv is loaded first
    const { tools } = await import('../app/api/chat/tools') as any;

    try {
        console.log("\n--- TEST 1: Specific Item (Cimento) ---");
        const result1 = await tools.analyzeStock.execute({ filterType: 'specific_item', filterValue: 'cimento' });
        console.log("Result:", JSON.stringify(result1, null, 2));

        console.log("\n--- TEST 2: Low Stock (Ruptura/Crítico) ---");
        const result2 = await tools.analyzeStock.execute({ filterType: 'low_stock' });

        if (result2 && 'items' in result2 && Array.isArray(result2.items)) {
            console.log(`Found ${result2.count} items. Showing first 3:`);
            console.log(JSON.stringify(result2.items.slice(0, 3), null, 2));
        } else {
            console.log("Result:", JSON.stringify(result2, null, 2));
        }

    } catch (e) {
        console.error("❌ Test Failed:", e);
    }
}

runTest();
