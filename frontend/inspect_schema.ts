
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("Checking for 'messages' table...");
    const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .limit(1);

    if (msgError) {
        console.log("Messages table check result:", msgError.message);
        if (msgError.message.includes("relation") && msgError.message.includes("does not exist")) {
            console.log("[FAIL] Table 'messages' does NOT exist yet.");
        }
    } else {
        console.log("[SUCCESS] Table 'messages' exists.");
    }
}

inspectSchema();
