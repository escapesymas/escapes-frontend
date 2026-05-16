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
                const [userCount] = await db.select({ value: count() }).from(users);
                const [postCount] = await db.select({ value: count() }).from(forumPosts);
                const [orderCount] = await db.select({ value: count() }).from(orders);
                
                // Usamos COALESCE para evitar que SUM devuelva null en tablas vacías
                const [totalSales] = await db.select({ 
                    value: sql<number>`COALESCE(SUM(${orders.total}), 0)` 
                }).from(orders);

                return res.status(200).json({
                    users: userCount?.value || 0,
                    posts: postCount?.value || 0,
                    orders: orderCount?.value || 0,
                    sales: totalSales?.value || 0
                });

            case 'products-list':
                const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
                return res.status(200).json(allProducts);

            case 'update-stock':
                if (req.method !== 'POST') return res.status(405).end();
                const { productId, newStock } = req.body;
                await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));
                return res.status(200).json({ success: true });

            case 'moderation-feed':
                // Obtener últimos posts y respuestas para moderar
                const latestPosts = await db.select({
                    id: forumPosts.id,
                    title: forumPosts.title,
                    author: users.username,
                    createdAt: forumPosts.createdAt
                })
                .from(forumPosts)
                .leftJoin(users, eq(forumPosts.userId, users.id))
                .orderBy(desc(forumPosts.createdAt))
                .limit(10);

                return res.status(200).json(latestPosts);

            default:
                return res.status(400).json({ error: 'Acción de administración no reconocida' });
        }
    } catch (error: any) {
        console.error('[ADMIN API ERROR]:', error);
        return res.status(500).json({ error: error.message });
    }
}
