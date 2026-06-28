-- =============================================================
-- AUDITORÍA DE CALIDAD DE DATOS — Escapes y Más
-- Generado por gstack ecommerce-audit (28 Jun 2026)
--
-- EJECUCIÓN SEGURA: todas las queries son SELECT. No modifican datos.
-- =============================================================


-- ============================================================
-- 1. PRODUCTOS SIN COMPATIBILITY (no se pueden usar con selector de moto)
-- ============================================================
SELECT
  'products_without_compatibility' AS check_name,
  COUNT(*) AS affected,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM products), 1) AS pct_of_total
FROM products
WHERE compatibility IS NULL
   OR jsonb_array_length(compatibility) = 0
   OR compatibility::text = '[]'
   OR compatibility::text = '[{"brand": ""}]';


-- Detalle: muestra los primeros 5 productos afectados
SELECT id, sku, name, brand, stock,
       compatibility IS NULL AS compat_null,
       jsonb_array_length(compatibility) AS compat_entries
FROM products
WHERE compatibility IS NULL
   OR jsonb_array_length(compatibility) = 0
   OR compatibility::text = '[]'
ORDER BY stock DESC NULLS LAST
LIMIT 5;


-- ============================================================
-- 2. PRODUCTOS SIN IMAGEN VÁLIDA
-- ============================================================
SELECT
  'products_without_image' AS check_name,
  COUNT(*) AS affected,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM products), 1) AS pct_of_total
FROM products
WHERE images IS NULL
   OR images = '[]'::jsonb
   OR jsonb_array_length(images) = 0
   OR images->0->>'src' IS NULL
   OR images->0->>'src' = '';


-- ============================================================
-- 3. PRODUCTOS CON URL REMOTA DE BIHR (causa de imágenes pixeladas por 403 Cloudflare)
-- ============================================================
SELECT
  'products_with_remote_bihr_image' AS check_name,
  COUNT(*) AS affected,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM products WHERE images IS NOT NULL), 1) AS pct_with_image
FROM products
WHERE images->0->>'src' LIKE '%mybihr.com%';


-- ============================================================
-- 4. SKUs MALFORMADOS (contienen caracteres raros o son demasiado cortos)
-- ============================================================
SELECT
  'malformed_skus' AS check_name,
  COUNT(*) AS affected
FROM products
WHERE sku IS NULL
   OR length(sku) < 3
   OR sku ~ '[^A-Za-z0-9._\-/]'
   OR sku = ''
   OR sku = 'undefined'
   OR sku = 'null';


-- Detalle
SELECT id, sku, name, stock
FROM products
WHERE sku IS NULL
   OR length(sku) < 3
   OR sku ~ '[^A-Za-z0-9._\-/]'
   OR sku = ''
   OR sku = 'undefined'
   OR sku = 'null'
LIMIT 10;


-- ============================================================
-- 5. PRODUCTOS CON PRECIO 0 O NEGATIVO
-- ============================================================
SELECT
  'invalid_price' AS check_name,
  COUNT(*) AS affected
FROM products
WHERE price IS NULL OR price <= 0 OR sale_price < 0;


-- Detalle
SELECT id, sku, name, brand, price, sale_price, stock
FROM products
WHERE price IS NULL OR price <= 0 OR sale_price < 0
ORDER BY stock DESC NULLS LAST
LIMIT 10;


-- ============================================================
-- 6. STOCK 0 EN PRODUCTOS POPULARES (muchos carritos)
-- ============================================================
SELECT
  'popular_products_out_of_stock' AS check_name,
  COUNT(*) AS affected
FROM products p
WHERE p.stock <= 0
  AND p.id IN (
    SELECT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at > NOW() - INTERVAL '6 months'
    GROUP BY oi.product_id
    HAVING SUM(oi.quantity) >= 5
  );


-- ============================================================
-- 7. PRODUCTOS DUPLICADOS POR NOMBRE SIMILAR (posibles errores de catálogo)
-- ============================================================
SELECT
  name,
  COUNT(*) AS duplicates,
  STRING_AGG(DISTINCT sku, ', ') AS skus
FROM products
WHERE name IS NOT NULL AND length(name) > 10
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;


-- ============================================================
-- 8. PRODUCTOS SIN CATEGORÍA (huérfanos de navegación)
-- ============================================================
SELECT
  'orphan_products' AS check_name,
  COUNT(*) AS affected
FROM products
WHERE (category_id IS NULL OR category_id = 0)
  AND (category2 IS NULL OR category2 = '')
  AND (category3 IS NULL OR category3 = '');


-- ============================================================
-- 9. RESUMEN EJECUTIVO (una sola fila por categoría)
-- ============================================================
SELECT
  'TOTAL_PRODUCTS' AS metric, COUNT(*)::text AS value FROM products
UNION ALL
SELECT 'WITH_COMPATIBILITY', COUNT(*)::text FROM products
  WHERE compatibility IS NOT NULL AND jsonb_array_length(compatibility) > 0
UNION ALL
SELECT 'WITH_VALID_IMAGE', COUNT(*)::text FROM products
  WHERE images IS NOT NULL AND images != '[]'::jsonb AND images->0->>'src' IS NOT NULL AND images->0->>'src' != ''
UNION ALL
SELECT 'IN_STOCK', COUNT(*)::text FROM products WHERE stock > 0
UNION ALL
SELECT 'OUT_OF_STOCK', COUNT(*)::text FROM products WHERE stock <= 0
UNION ALL
SELECT 'WITH_CATEGORY', COUNT(*)::text FROM products
  WHERE (category_id IS NOT NULL AND category_id != 0) OR (category2 IS NOT NULL AND category2 != '') OR (category3 IS NOT NULL AND category3 != '');


-- ============================================================
-- 10. PRODUCTOS TOP 100 POR STOCK QUE TIENEN IMAGEN REMOTA (candidatos a re-descargar)
-- ============================================================
SELECT id, sku, name, brand, stock,
       images->0->>'src' AS first_image_url
FROM products
WHERE images->0->>'src' LIKE '%mybihr.com%'
  AND stock > 10
ORDER BY stock DESC
LIMIT 20;


-- ============================================================
-- 11. PRODUCTOS SIN DESCRIPTION (afecta SEO y conversiones)
-- ============================================================
SELECT
  'products_without_description' AS check_name,
  COUNT(*) AS affected
FROM products
WHERE description IS NULL
   OR description = ''
   OR length(description) < 50;


-- ============================================================
-- 12. PRODUCTOS SIN ESPECIFICACIONES TÉCNICAS (specs)
-- ============================================================
SELECT
  'products_without_specs' AS check_name,
  COUNT(*) AS affected
FROM products
WHERE specs IS NULL
   OR specs = '{}'::jsonb
   OR specs::text = '{}';


-- ============================================================
-- 13. USUARIOS SIN EMAIL O CON EMAIL INVÁLIDO
-- ============================================================
SELECT
  'invalid_user_emails' AS check_name,
  COUNT(*) AS affected
FROM users
WHERE email IS NULL
   OR email = ''
   OR email !~ '^[^@]+@[^@]+\.[^@]+$'
   OR email = 'guest@escapesymas.com';


-- ============================================================
-- 14. USUARIOS CON ROL ADMIN HARDCODEADO (relacionado con #3 del fix)
-- ============================================================
SELECT
  'admin_users_in_db' AS check_name,
  COUNT(*) AS affected,
  STRING_AGG(email, ', ') AS emails
FROM users
WHERE role = 'admin';


-- ============================================================
-- 15. PEDIDOS PENDIENTES ANTIGUOS (>7 días sin pagar)
-- ============================================================
SELECT
  'old_pending_orders' AS check_name,
  COUNT(*) AS affected
FROM orders
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days';


-- ============================================================
-- 16. RESUMEN GLOBAL: calidad del catálogo
-- ============================================================
SELECT
  'catalog_quality_score' AS metric,
  'pct_ok' AS detail,
  ROUND(
    100.0 * SUM(
      CASE WHEN
        sku IS NOT NULL AND length(sku) >= 3
        AND price IS NOT NULL AND price > 0
        AND (images IS NOT NULL AND images != '[]'::jsonb AND images->0->>'src' IS NOT NULL AND images->0->>'src' != '')
      THEN 1 ELSE 0 END
    ) / COUNT(*), 1
  ) AS pct
FROM products;
