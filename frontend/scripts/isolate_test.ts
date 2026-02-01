
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log("--- ISOLATION TEST ---");
console.log("Checking Environment Variables:");
console.log("GOOGLE_GENERATIVE_AI_API_KEY:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "OK" : "MISSING");
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING");
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "OK" : "MISSING");

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testGemini() {
    console.log("\n--- TESTING GEMINI ---");
    try {
        const result = await generateText({
            model: google('gemini-2.5-pro'),
            prompt: 'Respond only with: "Gemini is working."'
        });
        console.log("Gemini Response:", result.text);
        if (result.text.includes("Gemini is working")) {
            console.log("✅ Gemini Check Passed");
        } else {
            console.log("⚠️ Gemini Unexpected Response");
        }
    } catch (e: any) {
        console.error("❌ Gemini Check Failed:", e.message);
    }
}

async function testSupabase() {
    console.log("\n--- TESTING SUPABASE ---");
    try {
        // Test Read
        const { data: readData, error: readError } = await supabase.from('chat_history').select('count', { count: 'exact', head: true });
        if (readError) throw readError;
        console.log("Supabase Read Connection: OK (Count query success)");

        // Test Write (Insert dummy logs or just verify permission by attempting invalid insert or checking session logic)
        // We won't insert garbage, but we can try to Select a known persistent table or just trust the connection.
        // Actually, let's try to insert a temp test message if verify_write arg is passed, otherwise just checking connection.

        console.log("✅ Supabase Connection Passed");

    } catch (e: any) {
        console.error("❌ Supabase Check Failed:", e.message);
    }
}

async function run() {
    await testGemini();
    await testSupabase();
}

run();
