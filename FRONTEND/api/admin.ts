import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: "postgresql://postgres:EscapesPostgres2026Vercel@212.227.134.161:5432/escapes_db",
  ssl: false
});

const db = drizzle(pool);

export default async function handler(req: any, res: any) {
    const { action, userId, email } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verificación Robusta: ID o Email de Admin
    let isAdmin = false;
    if (email?.toLowerCase() === 'info@escapesymas.com') {
        isAdmin = true;
    } else if (userId && userId !== 'undefined' && userId !== '0') {
        const adminUser = await db.execute(sql`SELECT role FROM users WHERE wp_id = ${parseInt(userId)}`);
        if (adminUser.rows[0]?.role === 'admin') isAdmin = true;
    }

    if (!isAdmin) {
        return res.status(401).json({ error: 'Sesión no autorizada' });
    }

    try {
        switch (action) {
            case 'dashboard-stats':
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

            case 'products-list':
                const products = await db.execute(sql`SELECT * FROM products ORDER BY created_at DESC`);
                return res.status(200).json(products.rows);

            case 'create-product':
                if (req.method !== 'POST') return res.status(405).end();
                const { name, sku, price, stock, category, brand, imageUrl } = req.body;
                
                // Valores por defecto para evitar errores de NULL
                const safeCategory = category || 'General';
                const safeBrand = brand || 'Escapes y Más';
                const safeImage = imageUrl || '';

                await db.execute(sql`
                    INSERT INTO products (name, sku, price, stock, category, brand, image_url)
                    VALUES (${name}, ${sku}, ${parseFloat(price)}, ${parseInt(stock)}, ${safeCategory}, ${safeBrand}, ${safeImage})
                `);
                return res.status(200).json({ success: true });

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
