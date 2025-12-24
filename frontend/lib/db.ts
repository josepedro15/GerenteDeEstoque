import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDb(): Pool {
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

export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: (string | number | boolean | null)[] = []
): Promise<QueryResult<T>> {
    const db = getDb();
    return db.query<T>(text, params);
}

