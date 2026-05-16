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
    const { action, id, search, category, page = '1', per_page = '20', orderBy = 'created_at', order = 'desc' } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');

    try {
        const pageNum = parseInt(page);
        const perPage = parseInt(per_page);
        const offset = (pageNum - 1) * perPage;

        switch (action) {
            // --- LISTADO DE PRODUCTOS ---
            case 'products': {
                let whereClause = `WHERE status = 'published'`;
                
                if (search) {
                    whereClause += ` AND (LOWER(name) LIKE LOWER('%${search}%') OR LOWER(sku) LIKE LOWER('%${search}%') OR LOWER(description) LIKE LOWER('%${search}%'))`;
                }

                // Count total
                const countRes = await db.execute(sql.raw(`SELECT count(*) as total FROM products ${whereClause}`));
                const total = Number(countRes.rows[0]?.total || 0);
                const totalPages = Math.ceil(total / perPage);

                // Fetch page
                const productsRes = await db.execute(sql.raw(
                    `SELECT * FROM products ${whereClause} ORDER BY ${orderBy} ${order} LIMIT ${perPage} OFFSET ${offset}`
                ));

                // Mapear al formato que espera el frontend (compatible con el tipo Product)
                const products = productsRes.rows.map(mapProductToFrontend);

                res.setHeader('X-WP-Total', total.toString());
                res.setHeader('X-WP-TotalPages', totalPages.toString());
                return res.status(200).json(products);
            }

            // --- PRODUCTO INDIVIDUAL ---
            case 'product': {
                if (!id) return res.status(400).json({ error: 'ID requerido' });
                
                const result = await db.execute(sql`SELECT * FROM products WHERE id = ${parseInt(id)} AND status = 'published'`);
                if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

                return res.status(200).json(mapProductToFrontend(result.rows[0]));
            }

            // --- CATEGORÍAS (desde productos únicos por ahora) ---
            case 'categories': {
                // Extraer categorías únicas de los productos
                const catRes = await db.execute(sql`
                    SELECT DISTINCT unnest(string_to_array(COALESCE(
                        (SELECT string_agg(DISTINCT c.name, ',') FROM unnest(ARRAY[status]) c(name)), 
                        'General'
                    ), ',')) as name FROM products WHERE status = 'published'
                `);
                
                // Simplificación: devolver categorías hardcodeadas por ahora
                const categories = [
                    { id: 1, name: 'Escapes', slug: 'escapes', count: 0 },
                    { id: 2, name: 'Filtros', slug: 'filtros', count: 0 },
                    { id: 3, name: 'Accesorios', slug: 'accesorios', count: 0 },
                    { id: 4, name: 'Protección', slug: 'proteccion', count: 0 },
                    { id: 5, name: 'Recambios', slug: 'recambios', count: 0 },
                ];
                return res.status(200).json(categories);
            }

            // --- BÚSQUEDA POR COMPATIBILIDAD ---
            case 'compatible': {
                const { brand, model, year } = req.query;
                if (!brand) return res.status(400).json({ error: 'Marca requerida' });

                let compatQuery = `SELECT * FROM products WHERE status = 'published' AND compatibility IS NOT NULL`;
                
                // Buscar en el JSON de compatibilidad
                if (brand) compatQuery += ` AND LOWER(compatibility) LIKE LOWER('%${brand}%')`;
                if (model) compatQuery += ` AND LOWER(compatibility) LIKE LOWER('%${model}%')`;
                if (year) compatQuery += ` AND LOWER(compatibility) LIKE LOWER('%${year}%')`;

                compatQuery += ` ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

                const compatRes = await db.execute(sql.raw(compatQuery));
                const compatProducts = compatRes.rows.map(mapProductToFrontend);

                return res.status(200).json(compatProducts);
            }

            default:
                return res.status(200).json({ status: 'ok', message: 'Catalog API v1.0 - PostgreSQL Native' });
        }
    } catch (error: any) {
        console.error("CATALOG API ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
}

// Mapeador: convierte fila de PostgreSQL al formato Product del frontend
function mapProductToFrontend(row: any) {
    const priceEur = (row.price || 0) / 100;
    const salePriceEur = row.sale_price ? row.sale_price / 100 : null;
    
    let images: any[] = [];
    try { images = row.images ? JSON.parse(row.images) : []; } catch { images = []; }
    if (typeof images === 'string') images = images ? [images] : [];
    // Asegurar formato [{src, alt}]
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
        source: 'postgresql'  // Marca para saber que viene de la DB nativa
    };
}
