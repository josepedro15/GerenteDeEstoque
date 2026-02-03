import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
console.log(`Loading .env from ${envPath}`);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Attempt to read Service Role Key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
}

// Prefer Service Role for testing to bypass RLS, then Anon
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const keyType = supabaseServiceKey ? "SERVICE_ROLE (Admin)" : "ANON (Public)";

if (!supabaseKey) {
    console.error("Missing Supabase Key");
    process.exit(1);
}

console.log(`Using Supabase Key: ${keyType}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalyzeStock() {
    console.log("Testing analyzeStock logic...");

    // Test 1: Low Stock
    console.log("\n--- Test 1: Low Stock Filter ---");
    // status_ruptura
    let query1 = supabase.from('dados_estoque')
        .select('*')
        .in('status_ruptura', ['🟠 Crítico', '🔴 Ruptura', 'Crítico', 'Ruptura'])
        .limit(5);

    const { data: data1, error: error1 } = await query1;

    if (error1) {
        console.error("Error 1:", error1);
    } else {
        console.log(`Found ${data1?.length} items with low stock.`);
        if (data1 && data1.length > 0) {
            console.log("Sample Item:", {
                id: data1[0].id_produto,
                produto: data1[0].produto_descricao,
                status: data1[0].status_ruptura
            });
        }
    }

    // Test 2: Specific Item
    const searchTerm = 'argamassa';
    console.log(`\n--- Test 2: Specific Item '${searchTerm}' ---`);
    let query2 = supabase.from('dados_estoque')
        .select('*')
        .ilike('produto_descricao', `%${searchTerm}%`)
        .limit(5);

    const { data: data2, error: error2 } = await query2;

    if (error2) {
        console.error("Error 2:", error2);
    } else {
        console.log(`Found ${data2?.length} items matching '${searchTerm}'.`);
        if (data2 && data2.length > 0) {
            console.log("Sample Item:", {
                id: data2[0].id_produto,
                produto: data2[0].produto_descricao,
                estoque: data2[0].estoque_atual,
                preco: data2[0].preco
            });
        }
    }
}

testAnalyzeStock();
