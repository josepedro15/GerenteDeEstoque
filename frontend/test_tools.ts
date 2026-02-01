
import dotenv from 'dotenv';
import path from 'path';

// Load env first
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env.local' });

async function verifyAnalyzeStock() {
    console.log("Environment loaded.");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error("Error: NEXT_PUBLIC_SUPABASE_URL not set.");
    }

    try {
        // Import tools AFTER env is loaded
        const { tools } = await import('./lib/ai/tools');

        console.log("Testing analyzeStock...");

        // Test 1: Purchase Analysis (Low Stock)
        console.log("\n--- Test 1: Purchase Analysis (Filter: low_stock) ---");
        // @ts-ignore
        const result1 = await tools.analyzeStock.execute({ filter: 'low_stock', query: '' }) as unknown as string;
        console.log("Result 1:", result1 ? result1.substring(0, 200) + "..." : "No result");

        if (result1.includes("Ruptura") || result1.includes("Crítico")) {
            console.log("[SUCCESS] Found Ruptura/Crítico items.");
        } else {
            console.log("[WARNING] No Ruptura/Crítico items found. Check database content.");
        }

        // Test 2: Specific Product (query: 'cimento')
        console.log("\n--- Test 2: Specific Product (Query: cimento) ---");
        // @ts-ignore
        const result2 = await tools.analyzeStock.execute({ query: 'cimento' }) as unknown as string;
        console.log("Result 2:", result2 ? result2.substring(0, 200) + "..." : "No result");
        if (result2.toLowerCase().includes("cimento")) {
            console.log("[SUCCESS] Found Cimento.");
        } else {
            console.log("[WARNING] Cimento not found.");
        }
    } catch (e: any) {
        console.error("Test Failed:", e);
    }
}

verifyAnalyzeStock();
