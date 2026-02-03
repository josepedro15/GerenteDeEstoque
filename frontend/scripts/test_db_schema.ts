import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    console.log("🔍 Checking 'dados_estoque' schema...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing env vars");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase
            .from('dados_estoque')
            .select('*')
            .limit(1);

        if (error) {
            console.error("❌ Link Error:", error);
            return;
        }

        if (!data || data.length === 0) {
            console.warn("⚠️ Table is empty, cannot verify columns.");
            return;
        }

        console.log("✅ Success! First row columns:");
        console.log(Object.keys(data[0]));
        console.log("Example Row:", data[0]);

    } catch (e) {
        console.error("Exec Error:", e);
    }
}

checkSchema();
