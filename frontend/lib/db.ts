// @ts-nocheck
import { Pool } from 'pg';

let pool: Pool;

export function getDb() {
    if (!pool) {
        pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'sistema_pedidos',
            password: process.env.DB_PASSWORD || 'postgres',
            port: parseInt(process.env.DB_PORT || '5432'),
        });
    }
    return pool;
}

export async function query(text: string, params: any[] = []) {
    const db = getDb();
    return db.query(text, params);
}
