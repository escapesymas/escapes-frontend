import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: "postgresql://postgres:EscapesPostgres2026Vercel@212.227.134.161:5432/escapes_db",
  ssl: false
});

const db = drizzle(pool);

// Mapeador: convierte fila de PostgreSQL al formato Product del frontend
function mapProductToFrontend(row: any) {
    const priceEur = (row.price || 0) / 100;
    const salePriceEur = row.sale_price ? row.sale_price / 100 : null;
    
    let images: any[] = [];
    try { images = row.images ? JSON.parse(row.images) : []; } catch { images = []; }
    if (typeof images === 'string') images = images ? [images] : [];
    images = images.map((img: any) => typeof img === 'string' ? { src: img, alt: row.name } : img);
    
    let compatibility: any[] = [];
    try { compatibility = row.compatibility ? JSON.parse(row.compatibility) : []; } catch { compatibility = []; }

    return {
        id: row.id,
        title: row.name,
        name: row.name,
        slug: row.sku?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `product-${row.id}`,
        price: salePriceEur || priceEur,
        regularPrice: priceEur,
        salePrice: salePriceEur,
        sku: row.sku || '',
        image: images.length > 0 ? images[0].src : '',
        images: images,
        inStock: (row.stock || 0) > 0,
        stock: row.stock || 0,
        category: 'General',
        categorySlug: 'general',
        categoryId: row.category_id || 0,
        description: row.description || '',
        shortDescription: row.description ? row.description.substring(0, 150) + '...' : '',
        status: row.status,
        compatibility: compatibility,
        attributes: [],
        averageRating: 0,
        ratingCount: 0,
        source: 'postgresql'
    };
}

export default async function handler(req: any, res: any) {
    const { action, userId, email } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // ================================================================
    // RUTAS PÚBLICAS (Catálogo) - No requieren autenticación
    // ================================================================
    try {
        switch (action) {
            case 'catalog-products': {
                const { search, page = '1', per_page = '20' } = req.query;
                const pageNum = parseInt(page);
                const perPage = parseInt(per_page);
                const offset = (pageNum - 1) * perPage;

                let countQuery = `SELECT count(*) as total FROM products WHERE status = 'published'`;
                let selectQuery = `SELECT * FROM products WHERE status = 'published'`;
                
                if (search) {
                    const searchClause = ` AND (LOWER(name) LIKE LOWER('%' || '${search.replace(/'/g, "''")}' || '%') OR LOWER(sku) LIKE LOWER('%' || '${search.replace(/'/g, "''")}' || '%') OR LOWER(description) LIKE LOWER('%' || '${search.replace(/'/g, "''")}' || '%'))`;
                    countQuery += searchClause;
                    selectQuery += searchClause;
                }

                selectQuery += ` ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

                const countRes = await db.execute(sql.raw(countQuery));
                const total = Number(countRes.rows[0]?.total || 0);
                const totalPages = Math.ceil(total / perPage) || 1;

                const productsRes = await db.execute(sql.raw(selectQuery));
                const products = productsRes.rows.map(mapProductToFrontend);

                res.setHeader('X-WP-Total', total.toString());
                res.setHeader('X-WP-TotalPages', totalPages.toString());
                return res.status(200).json(products);
            }

            case 'catalog-product': {
                const { id } = req.query;
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                const result = await db.execute(sql`SELECT * FROM products WHERE id = ${parseInt(id)} AND status = 'published'`);
                if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
                return res.status(200).json(mapProductToFrontend(result.rows[0]));
            }

            case 'catalog-compatible': {
                const { brand, model, year, page: cPage = '1', per_page: cPerPage = '20' } = req.query;
                if (!brand) return res.status(400).json({ error: 'Marca requerida' });
                const cOffset = (parseInt(cPage) - 1) * parseInt(cPerPage);

                let compatQuery = `SELECT * FROM products WHERE status = 'published' AND compatibility IS NOT NULL`;
                if (brand) compatQuery += ` AND LOWER(compatibility) LIKE LOWER('%${brand.replace(/'/g, "''")}%')`;
                if (model) compatQuery += ` AND LOWER(compatibility) LIKE LOWER('%${model.replace(/'/g, "''")}%')`;
                if (year) compatQuery += ` AND LOWER(compatibility) LIKE LOWER('%${year.replace(/'/g, "''")}%')`;
                compatQuery += ` ORDER BY created_at DESC LIMIT ${parseInt(cPerPage)} OFFSET ${cOffset}`;

                const compatRes = await db.execute(sql.raw(compatQuery));
                return res.status(200).json(compatRes.rows.map(mapProductToFrontend));
            }
        }
    } catch (publicError: any) {
        // Si es una ruta pública que falló, devolver error
        if (action?.startsWith('catalog-')) {
            console.error("CATALOG API ERROR:", publicError);
            return res.status(500).json({ error: publicError.message });
        }
    }

    // ================================================================
    // RUTAS PROTEGIDAS (Admin) - Requieren autenticación
    // ================================================================
    let isAdmin = false;
    if (email?.toLowerCase() === 'info@escapesymas.com') {
        isAdmin = true;
    } else if (userId && userId !== 'undefined' && userId !== '0') {
        const adminUser = await db.execute(sql`SELECT role FROM users WHERE wp_id = ${parseInt(userId)}`);
        if (adminUser.rows[0]?.role === 'admin') isAdmin = true;
    }

    if (!isAdmin) return res.status(401).json({ error: 'Sesión no autorizada' });

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
                const body = req.body;
                
                const safeName = (body.name || "Sin nombre").substring(0, 255);
                const safeSku = (body.sku || `SKU-${Date.now()}`).substring(0, 100);
                const rawPrice = parseFloat(body.price);
                const priceInCents = isNaN(rawPrice) ? 0 : Math.round(rawPrice * 100);
                const rawSalePrice = parseFloat(body.salePrice);
                const salePriceCents = isNaN(rawSalePrice) ? null : Math.round(rawSalePrice * 100);
                const safeStock = parseInt(body.stock) || 0;
                const safeDesc = body.description || null;
                const safeImages = body.images && body.images.length > 0 ? JSON.stringify(body.images) : null;
                const safeCompat = body.compatibility && body.compatibility.length > 0 ? JSON.stringify(body.compatibility) : null;
                const safeStatus = body.status || 'published';

                await db.execute(sql`
                    INSERT INTO products (name, sku, price, sale_price, stock, description, images, compatibility, status)
                    VALUES (${safeName}, ${safeSku}, ${priceInCents}, ${salePriceCents}, ${safeStock}, ${safeDesc}, ${safeImages}, ${safeCompat}, ${safeStatus})
                `);
                
                return res.status(200).json({ success: true });

            default:
                return res.status(200).json({ status: "ok" });
        }
    } catch (error: any) {
        console.error("ADMIN API ERROR:", error);
        return res.status(500).json({ 
            error: "Error de base de datos",
            message: error.message,
            detail: error.detail
        });
    }
}
