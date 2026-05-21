const fs = require('fs');
const path = require('path');
const pg = require('pg');
const sharp = require('sharp');

const connectionString = "postgresql://postgres:EscapesPostgres2026Vercel@127.0.0.1:5432/escapes_db";
const pool = new pg.Pool({ connectionString });

const UPLOADS_DIR = "/var/www/vhosts/backendescapes.com/server/uploads";
const OPTIMIZED_DIR = path.join(UPLOADS_DIR, "optimized");

async function run() {
  console.log("📸 INICIANDO REGENERACIÓN DE TARJETAS 1:1 EN LOTE...");
  
  console.log("🔎 Consultando productos que requieren regeneración...");
  const { rows: products } = await pool.query(`
    SELECT id, sku, name, images 
    FROM products 
    WHERE images LIKE '%optimized%' 
      AND images NOT LIKE '%srcCardDesktop%'
    ORDER BY id ASC
  `);

  console.log(`🎯 Encontrados ${products.length} productos para procesar.`);

  if (products.length === 0) {
    console.log("✅ ¡Todos los productos ya cuentan con versiones 1:1 para tarjetas!");
    await pool.end();
    return;
  }

  const CONCURRENCY = 8;
  let activeIndex = 0;
  let completedCount = 0;
  let failedCount = 0;

  async function worker() {
    while (activeIndex < products.length) {
      const idx = activeIndex++;
      if (idx >= products.length) break;

      const product = products[idx];
      const sku = product.sku;
      const name = product.name;
      
      let imagesList = [];
      try {
        imagesList = JSON.parse(product.images);
      } catch (e) {
        continue;
      }

      if (!Array.isArray(imagesList) || imagesList.length === 0 || !imagesList[0]?.src) {
        continue;
      }

      const imgObj = imagesList[0];
      const desktopUrl = imgObj.src;

      // Extraer el nombre de archivo desktop
      let desktopFilename = "";
      try {
        desktopFilename = path.basename(new URL(desktopUrl).pathname);
      } catch (e) {
        desktopFilename = path.basename(desktopUrl);
      }

      if (!desktopFilename || !desktopFilename.endsWith('.webp')) {
        continue;
      }

      const localDesktopPath = path.join(OPTIMIZED_DIR, desktopFilename);
      const cardDesktopFilename = `${sku}-card-desktop.webp`;
      const cardMobileFilename = `${sku}-card-mobile.webp`;

      const destCardDesktop = path.join(OPTIMIZED_DIR, cardDesktopFilename);
      const destCardMobile = path.join(OPTIMIZED_DIR, cardMobileFilename);

      if (!fs.existsSync(localDesktopPath)) {
        failedCount++;
        continue;
      }

      try {
        // 1. Crear versión de tarjeta Desktop: 250x250, 1:1, fit contain, fondo blanco
        await sharp(localDesktopPath)
          .resize({
            width: 250,
            height: 250,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ quality: 80 })
          .toFile(destCardDesktop);

        // 2. Crear versión de tarjeta Móvil: 150x150, 1:1, fit contain, fondo blanco
        await sharp(localDesktopPath)
          .resize({
            width: 150,
            height: 150,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ quality: 75 })
          .toFile(destCardMobile);

        // 3. Actualizar objeto JSON
        imgObj.srcCardDesktop = `https://backendescapes.com/uploads/optimized/${cardDesktopFilename}`;
        imgObj.srcCardMobile = `https://backendescapes.com/uploads/optimized/${cardMobileFilename}`;

        await pool.query(
          `UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(imagesList), product.id]
        );

        completedCount++;
        if (completedCount % 100 === 0 || completedCount === products.length) {
          console.log(`📈 Progreso: ${completedCount}/${products.length} procesados (Fallidos: ${failedCount})`);
        }
      } catch (err) {
        console.error(`❌ Error en SKU ${sku}:`, err.message);
        failedCount++;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`\n🎉 PROCESO DE REGENERACIÓN FINALIZADO 🎉`);
  console.log(`✅ Tarjetas exitosamente generadas: ${completedCount}`);
  console.log(`❌ Conversiones fallidas: ${failedCount}`);

  await pool.end();
}

run().catch(console.error);
