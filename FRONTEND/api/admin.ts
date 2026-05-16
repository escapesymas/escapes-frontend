import { postgres } from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

// Conexión directa para evitar errores de importación en Vercel
const connectionString = "postgresql://postgres:EscapesPostgres2026Vercel@212.227.134.161:5432/escapes_db";
const client = postgres(connectionString, { ssl: false });
const db = drizzle(client);

export default async function handler(req: any, res: any) {
    const { action, userId } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Check ID
    if (!userId || userId === 'undefined' || userId === '0') {
        return res.status(401).json({ error: 'Acceso denegado: ID no válido' });
    }

    try {
        switch (action) {
            case 'dashboard-stats':
                const userRes = await db.execute(sql`SELECT count(*) as count FROM users`);
                const postRes = await db.execute(sql`SELECT count(*) as count FROM forum_posts`);
                const orderRes = await db.execute(sql`SELECT count(*) as count FROM orders`);
                const salesRes = await db.execute(sql`SELECT COALESCE(SUM(total), 0) as total FROM orders`);

                return res.status(200).json({
                    users: Number(userRes[0]?.count || 0),
                    posts: Number(postRes[0]?.count || 0),
                    orders: Number(orderRes[0]?.count || 0),
                    sales: Number(salesRes[0]?.total || 0)
                });

            default:
                return res.status(200).json({ message: "API Admin activa" });
        }
    } catch (error: any) {
        return res.status(500).json({ 
            error: "Error de conexión directa a PostgreSQL",
            message: error.message 
        });
    }
}
