import { db } from '../lib/db.js';
import { products, orders, users, forumPosts, forumReplies } from '../lib/schema.js';
import { eq, desc, sql, count } from 'drizzle-orm';

export default async function handler(req: any, res: any) {
    const { action, userId } = req.query;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // SEGURIDAD: Verificar que el usuario que hace la petición es ADMIN
    if (!userId || userId === '0' || userId === 'undefined') {
        return res.status(401).json({ error: 'ID de usuario no válido o no proporcionado' });
    }
    
    const adminUser = await db.select().from(users).where(eq(users.wpId, parseInt(userId))).limit(1);
    if (!adminUser[0] || adminUser[0].role !== 'admin') {
        // Fallback: si el email es el del admin, le dejamos pasar aunque el ID falle
        if (adminUser[0]?.email !== 'info@escapesymas.com') {
            return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
        }
    }

    try {
        switch (action) {
            case 'dashboard-stats':
                // Consultas ultra-simples para evitar errores de driver
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
                const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
                return res.status(200).json(allProducts);

            case 'update-stock':
                if (req.method !== 'POST') return res.status(405).end();
                const { productId, newStock } = req.body;
                await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));
                return res.status(200).json({ success: true });

            default:
                return res.status(400).json({ error: 'Acción no reconocida' });
        }
    } catch (error: any) {
        console.error('[ADMIN API CRASH]:', error);
        return res.status(500).json({ 
            error: "Error interno en la API de Administración",
            message: error.message,
            stack: error.stack 
        });
    }
}
