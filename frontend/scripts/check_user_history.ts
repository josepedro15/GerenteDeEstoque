
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Admin Key to bypass RLS for verification
);

const TARGET_USER_ID = "65ba6d49-7ad2-412a-81d0-586ee301cbe8";

async function checkHistory() {
    console.log(`Checking history for user: ${TARGET_USER_ID}`);
    const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', TARGET_USER_ID);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data?.length} messages.`);
    if (data && data.length > 0) {
        console.log("Last message:", data[data.length - 1]);
    }
}

checkHistory();
