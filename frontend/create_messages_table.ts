
import dotenv from 'dotenv';
import { Client } from 'pg';

// Load env first
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env.local' });

async function runMigration() {
    console.log("Starting migration...");

    // Check for DATABASE_URL or try to construct it from Supabase credentials if possible, 
    // but usually Supabase provides a direct postgres connection string in the dashboard. 
    // If not in env, we might be stuck. Let's assume user put it in .env or we check .env.local content via logic.

    // Note: The 'supabase-js' client uses REST API and cannot create tables. 
    // We need the direct Postgres connection string (DATABASE_URL) or (POSTGRES_URL).

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!dbUrl) {
        console.error("Error: DATABASE_URL or POSTGRES_URL not found in environment. Cannot create table.");
        // Fallback: Check if we can infer it or ask user. 
        // For now, fail gracefully.
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();

        const createTableQuery = `
            create table if not exists messages (
                id uuid default gen_random_uuid() primary key,
                session_id text not null,
                role text not null,
                content text not null,
                created_at timestamp with time zone default timezone('utc'::text, now()) not null
            );
            create index if not exists messages_session_id_idx on messages(session_id);
        `;

        await client.query(createTableQuery);
        console.log("[SUCCESS] Table 'messages' created (or already exists).");
    } catch (err: any) {
        console.error("Migration Failed:", err.message);
    } finally {
        await client.end();
    }
}

runMigration();
