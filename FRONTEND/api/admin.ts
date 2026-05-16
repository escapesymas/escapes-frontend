import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

// Usamos el driver 'pg' que SÍ está en tu package.json
const pool = new Pool({
  connectionString: "postgresql://postgres:EscapesPostgres2026Vercel@212.227.134.161:5432/escapes_db",
  ssl: false
});

const db = drizzle(pool);

export default async function handler(req: any, res: any) {
    const { action, userId } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Si no hay ID, devolvemos 401
    if (!userId || userId === 'undefined' || userId === '0') {
        return res.status(401).json({ error: 'Sesión no detectada' });
    }

    try {
        switch (action) {
            case 'dashboard-stats':
                // Consultas SQL directas
                const userRes = await db.execute(sql`SELECT count(*) as count FROM users`);
                const postRes = await db.execute(sql`SELECT count(*) as count FROM forum_posts`);
                const orderRes = await db.execute(sql`SELECT count(*) as count FROM orders`);
                const salesRes = await db.execute(sql`SELECT COALESCE(SUM(total), 0) as total FROM orders`);

                return res.status(200).json({
                    users: Number(userRes.rows[0]?.count || 0),
                    posts: Number(postRes.rows[0]?.count || 0),
                    orders: Number(orderRes.rows[0]?.count || 0),
                    sales: Number(salesRes.rows[0]?.total || 0)
                });

            default:
                return res.status(200).json({ status: "ok", message: "API Admin Ready" });
        }
    } catch (error: any) {
        console.error("ADMIN API ERROR:", error);
        return res.status(500).json({ 
            error: "Error de base de datos",
            message: error.message 
        });
    }
}
