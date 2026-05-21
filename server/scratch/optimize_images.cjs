const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const pg = require('pg');
const sharp = require('sharp');

const connectionString = "postgresql://postgres:EscapesPostgres2026Vercel@127.0.0.1:5432/escapes_db";
const pool = new pg.Pool({ connectionString });

const UPLOADS_DIR = "/var/www/vhosts/backendescapes.com/server/uploads";
const OPTIMIZED_DIR = path.join(UPLOADS_DIR, "optimized");

if (!fs.existsSync(OPTIMIZED_DIR)) {
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      fs.unlink(destPath, () => {});
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function run() {
  console.log("📸 INICIANDO MOTOR DE IMPORTACIÓN Y OPTIMIZACIÓN DE IMÁGENES (ROBUSTO)...");
  
  console.log("🔎 Consultando productos pendientes en la base de datos...");
  const { rows: products } = await pool.query(`
    SELECT id, sku, name, images 
    FROM products 
    WHERE (images LIKE '%api.mybihr.com%' 
       OR images LIKE '%static.bihr.pro%')
       AND images NOT LIKE '%optimized%'
    ORDER BY id ASC
  `);

  console.log(`🎯 Encontrados ${products.length} productos con imágenes pendientes de optimizar.`);

  if (products.length === 0) {
    console.log("✅ ¡No hay imágenes pendientes! Todo está optimizado.");
    await pool.end();
    return;
  }

  const CONCURRENCY = 8; // Aumentado para mayor velocidad en el VPS
  let activeIndex = 0;
  let completedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

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

      const externalUrl = imagesList[0].src.trim();

      // 🛑 Validaciones robustas de URL
      if (!externalUrl.startsWith('http') || externalUrl.includes('.zip') || externalUrl.endsWith('.zip')) {
        skippedCount++;
        // Marcar como procesado con placeholder para evitar re-análisis infinito
        const placeholderImagesJson = JSON.stringify([
          {
            src: "https://placehold.co/800x800/18181b/f97316?text=ESCAPES+Y+MAS",
            srcMobile: "https://placehold.co/400x400/18181b/f97316?text=ESCAPES+Y+MAS",
            srcCardDesktop: "https://placehold.co/250x250/18181b/f97316?text=ESCAPES+Y+MAS",
            srcCardMobile: "https://placehold.co/150x150/18181b/f97316?text=ESCAPES+Y+MAS",
            alt: name
          }
        ]);
        await pool.query(
          `UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2`,
          [placeholderImagesJson, product.id]
        );
        continue;
      }

      const tempPath = path.join(OPTIMIZED_DIR, `temp-${sku}`);
      const desktopFilename = `${sku}-desktop.webp`;
      const mobileFilename = `${sku}-mobile.webp`;
      const cardDesktopFilename = `${sku}-card-desktop.webp`;
      const cardMobileFilename = `${sku}-card-mobile.webp`;

      const destDesktop = path.join(OPTIMIZED_DIR, desktopFilename);
      const destMobile = path.join(OPTIMIZED_DIR, mobileFilename);
      const destCardDesktop = path.join(OPTIMIZED_DIR, cardDesktopFilename);
      const destCardMobile = path.join(OPTIMIZED_DIR, cardMobileFilename);

      try {
        await downloadImage(externalUrl, tempPath);

        // Optimizar Desktop
        await sharp(tempPath)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(destDesktop);

        // Optimizar Mobile
        await sharp(tempPath)
          .resize({ width: 400, withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(destMobile);

        // Optimizar Tarjeta Desktop (1:1 a 250px con fondo blanco)
        await sharp(tempPath)
          .resize({
            width: 250,
            height: 250,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ quality: 80 })
          .toFile(destCardDesktop);

        // Optimizar Tarjeta Móvil (1:1 a 150px con fondo blanco)
        await sharp(tempPath)
          .resize({
            width: 150,
            height: 150,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ quality: 75 })
          .toFile(destCardMobile);

        const optimizedImagesJson = JSON.stringify([
          {
            src: `https://backendescapes.com/uploads/optimized/${desktopFilename}`,
            srcMobile: `https://backendescapes.com/uploads/optimized/${mobileFilename}`,
            srcCardDesktop: `https://backendescapes.com/uploads/optimized/${cardDesktopFilename}`,
            srcCardMobile: `https://backendescapes.com/uploads/optimized/${cardMobileFilename}`,
            alt: name
          }
        ]);

        await pool.query(
          `UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2`,
          [optimizedImagesJson, product.id]
        );

        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        completedCount++;
        if (completedCount % 100 === 0 || completedCount === products.length) {
          console.log(`📈 Progreso: ${completedCount}/${products.length} completados (Omitidos: ${skippedCount}, Fallidos: ${failedCount})`);
        }
      } catch (err) {
        failedCount++;
        // En caso de fallo de formato, poner placeholder para evitar atasco
        const fallbackJson = JSON.stringify([
          {
            src: "https://placehold.co/800x800/18181b/f97316?text=ESCAPES+Y+MAS",
            srcMobile: "https://placehold.co/400x400/18181b/f97316?text=ESCAPES+Y+MAS",
            srcCardDesktop: "https://placehold.co/250x250/18181b/f97316?text=ESCAPES+Y+MAS",
            srcCardMobile: "https://placehold.co/150x150/18181b/f97316?text=ESCAPES+Y+MAS",
            alt: name
          }
        ]);
        await pool.query(
          `UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2`,
          [fallbackJson, product.id]
        ).catch(() => {});

        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`\n🎉 PROCESO DE OPTIMIZACIÓN FINALIZADO 🎉`);
  console.log(`✅ Imágenes exitosamente optimizadas: ${completedCount}`);
  console.log(`🚫 Imágenes omitidas (no válidas/zip): ${skippedCount}`);
  console.log(`❌ Conversiones fallidas (con fallback aplicado): ${failedCount}`);

  await pool.end();
}

run().catch(console.error);
