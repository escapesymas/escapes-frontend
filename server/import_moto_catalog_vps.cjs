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
  console.log("🏍️  INICIANDO PROCESO DE IMPORTACIÓN DE CATÁLOGO MOTO CON VARIANTES (TALLAS Y COLORES)...");
  
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
    let headerFields = [];
    let imgIndices = [];
    let tallaIdx = -1;
    let colorIdx = -1;

    for await (const line of rl) {
      if (isHeader) {
        headerFields = splitCSVLine(line).map(f => f.trim());
        imgIndices = [];
        for (let i = 1; i <= 6; i++) {
          const idx = headerFields.indexOf(`Picture${i}`);
          if (idx !== -1) {
            imgIndices.push(idx);
          }
        }
        
        tallaIdx = headerFields.findIndex(h => 
          h.toLowerCase() === 'v-talla' || 
          h.toLowerCase() === 'talla' || 
          h.toLowerCase() === 'size' || 
          h.toLowerCase() === 'v-size'
        );
        
        colorIdx = headerFields.findIndex(h => 
          h.toLowerCase() === 'v-color' || 
          h.toLowerCase() === 'color'
        );

        isHeader = false;
        console.log(`📸 Columnas de imágenes encontradas en índices: ${imgIndices.join(', ')}`);
        console.log(`📏 Columna de Talla: ${tallaIdx !== -1 ? `${headerFields[tallaIdx]} (índice ${tallaIdx})` : 'No encontrada'}`);
        console.log(`🎨 Columna de Color: ${colorIdx !== -1 ? `${headerFields[colorIdx]} (índice ${colorIdx})` : 'No encontrada'}`);
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

        const rawPrice = parseFloat(parts[6] || '0');
        if (isNaN(rawPrice) || rawPrice <= 0) continue;
        const priceVal = Math.round(rawPrice * 100);

        const rawStock = parseInt(parts[10] || '0');
        const stockVal = isNaN(rawStock) ? 0 : rawStock;

        // Procesar imágenes usando los índices dinámicos de cabecera
        const imgs = [];
        imgIndices.forEach(idx => {
          if (parts[idx] && parts[idx].trim()) {
            imgs.push({ src: parts[idx].trim(), alt: name });
          }
        });
        
        if (imgs.length === 0) {
          [44, 45, 46, 47, 48].forEach(idx => {
            if (parts[idx] && parts[idx].trim() && parts[idx].trim().startsWith('http')) {
              imgs.push({ src: parts[idx].trim(), alt: name });
            }
          });
        }
        
        const imagesJson = JSON.stringify(imgs);

        // Procesar atributos (talla y color) para variantes
        const sizeVal = tallaIdx !== -1 ? parts[tallaIdx]?.trim() : '';
        const colorVal = colorIdx !== -1 ? parts[colorIdx]?.trim() : '';
        
        let parentSku = sku;
        if (/^\d+$/.test(sku) && sku.length > 6) {
          parentSku = sku.substring(0, sku.length - 2);
        } else if (sku.includes('-')) {
          parentSku = sku.split('-')[0];
        } else if (name.includes(',')) {
          parentSku = name.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        }

        const attributesJson = JSON.stringify({
          size: sizeVal || '',
          color: colorVal || '',
          parent_sku: parentSku
        });

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
          compatibility: '[]',
          attributes: attributesJson
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

    const fields = ['name', 'sku', 'price', 'sale_price', 'stock', 'category_id', 'status', 'provider_id', 'description', 'images', 'compatibility', 'attributes'];
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
      INSERT INTO products (name, sku, price, sale_price, stock, category_id, status, provider_id, description, images, compatibility, attributes, created_at, updated_at)
      VALUES ${rows.join(', ')}
      ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        sale_price = EXCLUDED.sale_price,
        stock = EXCLUDED.stock,
        description = EXCLUDED.description,
        images = EXCLUDED.images,
        attributes = EXCLUDED.attributes,
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
