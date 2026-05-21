const fs = require('fs');
const path = require('path');
const readline = require('readline');
const pg = require('pg');
const { execSync } = require('child_process');

const connectionString = "postgresql://postgres:EscapesPostgres2026Vercel@127.0.0.1:5432/escapes_db";
const pool = new pg.Pool({ connectionString });

const ZIP_PATH = "/root/cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01.zip";
const EXTRACT_DIR = "/root/catalog_extracted";

function splitCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

async function run() {
  console.log("🏍️  INICIANDO PROCESO DE IMPORTACIÓN DE CATÁLOGO MOTO (PARIDAD PARSER)...");
  
  if (!fs.existsSync(EXTRACT_DIR)) {
    console.log(`📦 Extrayendo ZIP en ${EXTRACT_DIR}...`);
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    execSync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`);
    console.log("✅ Extracción completada.");
  } else {
    console.log("📦 La carpeta de extracción ya existe. Saltando extracción.");
  }

  const files = fs.readdirSync(EXTRACT_DIR).filter(f => f.endsWith('.csv'));
  console.log(`🔍 Encontrados ${files.length} archivos de marcas.`);

  let totalImported = 0;
  let totalBicyclesFiltered = 0;
  let totalSkipped = 0;
  let batch = [];
  const BATCH_SIZE = 5000;

  for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
    const file = files[fileIdx];
    const filePath = path.join(EXTRACT_DIR, file);
    console.log(`📖 [${fileIdx + 1}/${files.length}] Procesando ${file}...`);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isHeader = true;
    let currentLine = '';
    let quoteCount = 0;

    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      if (!line.trim() && currentLine === '') continue;

      const quotesInLine = (line.match(/"/g) || []).length;
      
      if (currentLine === '') {
        currentLine = line;
        quoteCount = quotesInLine;
      } else {
        currentLine += '\n' + line;
        quoteCount += quotesInLine;
      }

      if (quoteCount % 2 === 0) {
        const row = currentLine;
        currentLine = '';
        quoteCount = 0;

        const parts = splitCSVLine(row);
        if (parts.length < 19) {
          totalSkipped++;
          continue;
        }

        const sku = parts[0]?.trim();
        const name = parts[4]?.trim();
        const cat1 = parts[16]?.trim() || '';
        const cat2 = parts[17]?.trim() || '';
        const cat3 = parts[18]?.trim() || '';

        if (!sku || !name) continue;

        // 🛑 Filtro robusto contra productos de bicicletas
        const isBicycle = (
          cat1.toLowerCase().includes('bicycle') ||
          cat2.toLowerCase().includes('bicycle') ||
          cat3.toLowerCase().includes('bicycle') ||
          cat1.toLowerCase() === 'velo' ||
          cat2.toLowerCase() === 'velo' ||
          (cat1.toLowerCase().includes('cycle') && !cat1.toLowerCase().includes('motorcycle')) ||
          (cat2.toLowerCase().includes('cycle') && !cat2.toLowerCase().includes('motorcycle')) ||
          (cat3.toLowerCase().includes('cycle') && !cat3.toLowerCase().includes('motorcycle'))
        );

        if (isBicycle) {
          totalBicyclesFiltered++;
          continue;
        }

        // Evitar precios y stock NaN y saltar productos a precio 0
        const rawPrice = parseFloat(parts[6] || '0');
        if (isNaN(rawPrice) || rawPrice <= 0) continue;
        const priceVal = Math.round(rawPrice * 100);

        const rawStock = parseInt(parts[10] || '0');
        const stockVal = isNaN(rawStock) ? 0 : rawStock;

        // Procesar imágenes
        const imgs = [];
        if (parts[44]) imgs.push({ src: parts[44], alt: name });
        if (parts[45]) imgs.push({ src: parts[45], alt: name });
        if (parts[46]) imgs.push({ src: parts[46], alt: name });
        if (parts[47]) imgs.push({ src: parts[47], alt: name });
        if (parts[48]) imgs.push({ src: parts[48], alt: name });
        const imagesJson = JSON.stringify(imgs);

        batch.push({
          name,
          sku,
          price: priceVal,
          sale_price: null,
          stock: stockVal,
          category_id: 0,
          status: 'published',
          provider_id: 'bihr',
          description: parts[15]?.trim() || '',
          images: imagesJson,
          compatibility: '[]'
        });

        if (batch.length >= BATCH_SIZE) {
          await saveBatch(batch);
          totalImported += batch.length;
          batch = [];
          console.log(`⚡ Insertados/Actualizados ${totalImported} productos... (Bici filtradas: ${totalBicyclesFiltered}, Líneas incompletas: ${totalSkipped})`);
        }
      }
    }
  }

  // Insertar lote restante
  if (batch.length > 0) {
    await saveBatch(batch);
    totalImported += batch.length;
  }

  console.log(`\n🎉 PROCESO COMPLETADO 🎉`);
  console.log(`✅ Total de productos de moto importados/actualizados: ${totalImported}`);
  console.log(`❌ Total de productos de bicicleta descartados: ${totalBicyclesFiltered}`);
  console.log(`⚠️  Total de líneas incompletas descartadas: ${totalSkipped}`);
  
  await pool.end();
}

async function saveBatch(items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fields = ['name', 'sku', 'price', 'sale_price', 'stock', 'category_id', 'status', 'provider_id', 'description', 'images', 'compatibility'];
    const rows = [];
    const values = [];
    
    items.forEach((item, idx) => {
      const baseIdx = idx * fields.length;
      const placeholders = fields.map((_, fIdx) => `$${baseIdx + fIdx + 1}`).join(', ');
      rows.push(`(${placeholders}, NOW(), NOW())`);
      
      fields.forEach(field => {
        values.push(item[field]);
      });
    });

    const query = `
      INSERT INTO products (name, sku, price, sale_price, stock, category_id, status, provider_id, description, images, compatibility, created_at, updated_at)
      VALUES ${rows.join(', ')}
      ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        sale_price = EXCLUDED.sale_price,
        stock = EXCLUDED.stock,
        description = EXCLUDED.description,
        images = EXCLUDED.images,
        updated_at = NOW()
    `;

    await client.query(query, values);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error insertando lote:', err.message);
  } finally {
    client.release();
  }
}

run().catch(console.error);
