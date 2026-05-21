import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateCatalogSyncState(state: any) {
  try {
    fs.writeFileSync('/tmp/catalog_sync_state.json', JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.error('[BIHR SERVICE]: Error writing catalog sync state file:', e);
  }
}

// ================================================================
// CONFIGURACIÓN DE BIHR
// ================================================================
const BIHR_API_BASE = process.env.BIHR_API_BASE || 'https://api.bihr.net';
const BIHR_USERNAME = process.env.BIHR_USERNAME || 'info@escapesymas.com';
const BIHR_MACKEY = process.env.BIHR_MACKEY || '3799B392-3934-4514-ABF0-9EF7F544A117';

// Estado de caché del token
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0; // Timestamp en ms

interface BihrTokenResponse {
  access_token: string;
  expires_in: number; // en segundos
  token_type: string;
}

/**
 * Obtiene y gestiona el Token de Autenticación de Bihr con caché de 30 mins
 */
export async function getBihrToken(): Promise<string> {
  const currentTime = Date.now();
  
  // Si el token sigue siendo válido (con un margen de seguridad de 2 minutos)
  if (cachedToken && currentTime < tokenExpiryTime - 120000) {
    return cachedToken;
  }

  console.log('[BIHR SERVICE]: Solicitando nuevo token de acceso a Bihr...');

  try {
    const formData = new URLSearchParams();
    formData.append('UserName', BIHR_USERNAME);
    formData.append('PassWord', BIHR_MACKEY);

    const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Authentication/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error de autenticación Bihr (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as BihrTokenResponse;
    cachedToken = data.access_token;
    // Expira en 30 minutos (expires_in suele ser 1800 segundos)
    tokenExpiryTime = currentTime + (data.expires_in * 1000);
    
    console.log('[BIHR SERVICE]: Token obtenido correctamente.');
    return cachedToken;
  } catch (error) {
    console.error('[BIHR SERVICE ERROR]: Error al autenticar con Bihr:', error);
    throw error;
  }
}

// ================================================================
// MÓDULO DE INVENTARIO Y STOCK EN VIVO
// ================================================================

export interface ProductStockInfo {
  productCode: string;
  inStock: boolean;
  stockValue?: number;
  status: 'InStock' | 'Short' | 'OutOfStock';
}

/**
 * Consulta el nivel de stock en vivo para un producto (InStock, Short, OutOfStock)
 */
export async function getLiveStockLevel(productCode: string): Promise<'InStock' | 'Short' | 'OutOfStock'> {
  try {
    const token = await getBihrToken();
    if (token === 'mock_bihr_bearer_token') {
      return 'InStock'; // Mock en desarrollo
    }

    const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Inventory/StockLevel?productCode=${encodeURIComponent(productCode)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const status = await response.json();
    return status as 'InStock' | 'Short' | 'OutOfStock';
  } catch (error) {
    console.error(`[BIHR SERVICE]: Error al consultar StockLevel para ${productCode}:`, error);
    return 'OutOfStock'; // Fallback seguro
  }
}

/**
 * Consulta el stock exacto (unidades numéricas) en vivo para un producto
 */
export async function getLiveStockValue(productCode: string): Promise<number> {
  try {
    const token = await getBihrToken();

    const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Inventory/StockValue?productCode=${encodeURIComponent(productCode)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const value = await response.json();
    return Number(value);
  } catch (error) {
    console.error(`[BIHR SERVICE]: Error al consultar StockValue para ${productCode}:`, error);
    return 0; // Fallback seguro
  }
}

/**
 * Comprueba disponibilidad en vivo de múltiples referencias (ideal para checkout/carrito)
 */
export async function checkProductsInfo(items: Array<{ ProductCode: string; Quantity: number }>) {
  try {
    const token = await getBihrToken();

    const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Inventory/ProductsInfo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(items)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BIHR SERVICE]: Error en checkProductsInfo:', error);
    return items.map(item => ({ productCode: item.ProductCode, available: false }));
  }
}

// ================================================================
// MÓDULO DE DROPSHIPPING / CREACIÓN DE PEDIDOS
// ================================================================

export interface BihrOrderRequest {
  deliveryAddress: {
    firstName: string;
    lastName: string;
    companyName?: string;
    street: string;
    zipCode: string;
    city: string;
    countryCode: string; // Ejemplo: 'ES'
    phoneNumber: string;
    email: string;
  };
  items: Array<{
    productCode: string;
    quantity: number;
  }>;
  customerOrderReference: string; // Tu identificador de pedido en PostgreSQL
  isDropshipping: boolean;
}

/**
 * Crea un pedido de dropshipping directamente en Bihr
 */
export async function createBihrOrder(orderData: BihrOrderRequest) {
  try {
    const token = await getBihrToken();

    const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Order/Creation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        DeliveryAddress: {
          FirstName: orderData.deliveryAddress.firstName,
          LastName: orderData.deliveryAddress.lastName,
          CompanyName: orderData.deliveryAddress.companyName || '',
          Street: orderData.deliveryAddress.street,
          ZipCode: orderData.deliveryAddress.zipCode,
          City: orderData.deliveryAddress.city,
          CountryCode: orderData.deliveryAddress.countryCode,
          PhoneNumber: orderData.deliveryAddress.phoneNumber,
          Email: orderData.deliveryAddress.email
        },
        Items: orderData.items.map(item => ({
          ProductCode: item.productCode,
          Quantity: item.quantity
        })),
        CustomerOrderReference: orderData.customerOrderReference,
        ShippingType: orderData.isDropshipping ? 'Dropshipping' : 'Standard'
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Error en Bihr Order (${response.status}): ${errBody}`);
    }

    return await response.json(); // Retorna el ticketId
  } catch (error) {
    console.error('[BIHR SERVICE]: Error al emitir pedido en Bihr:', error);
    throw error;
  }
}

/**
 * Consulta el estado y tracking de un pedido en Bihr usando su ticketId o referencia
 */
export async function getBihrOrderStatus(ticketId: string) {
  try {
    const token = await getBihrToken();

    const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Order/Status?ticketId=${encodeURIComponent(ticketId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Error en Bihr Order Status (${response.status}): ${errBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BIHR SERVICE]: Error al consultar pedido en Bihr:', error);
    throw error;
  }
}

// ================================================================
// MÓDULO DE DE DESCARGA Y SINCRONIZACIÓN DEL CATÁLOGO
// ================================================================

/**
 * Lógica para solicitar la generación asíncrona, descargar e importar el catálogo
 */
export async function syncBihrCatalog(catalogType: 'HardPart' | 'RiderGear' | 'Prices' = 'HardPart'): Promise<boolean> {
  const token = await getBihrToken();
  const startTime = new Date().toISOString();

  updateCatalogSyncState({
    status: 'generating',
    catalogType,
    startTime
  });

  try {
    console.log(`[BIHR SERVICE]: Solicitando generación de catálogo ${catalogType}...`);
    // Solicita generación de catálogo en formato ZIP - JSON
    const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Catalog/ZIP/JSON/${catalogType}/Full`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log('[BIHR SERVICE]: Catálogo ya estaba generado. Descargando...');
      // Si ya está generado, podemos procesarlo directamente
      const downloadData = await response.json();
      if (downloadData.downloadId) {
        await downloadAndProcessCatalog(downloadData.downloadId, catalogType, startTime);
        return true;
      }
    } else if (response.status === 202) {
      const requestData = await response.json();
      const ticketId = requestData.ticketId;
      console.log(`[BIHR SERVICE]: Petición aceptada. TicketID recibido: ${ticketId}. Esperando generación...`);
      
      updateCatalogSyncState({
        status: 'waiting_generation',
        catalogType,
        startTime,
        ticketId
      });

      // Consultar estado en bucle con espera de 30 segundos
      let attempts = 0;
      const maxAttempts = 20; // 10 minutos
      
      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 30000));
        attempts++;
        
        console.log(`[BIHR SERVICE]: Comprobando estado de ticket ${ticketId} (intento ${attempts})...`);
        const statusRes = await fetch(`${BIHR_API_BASE}/api/v2.1/Catalog/GenerationStatus?ticketId=${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!statusRes.ok) continue;
        
        const statusData = await statusRes.json();
        console.log(`[BIHR SERVICE]: Estado de generación: ${statusData.requestStatus}`);
        
        if (statusData.requestStatus === 'DONE') {
          console.log(`[BIHR SERVICE]: Catálogo listo. Descargando con downloadId: ${statusData.downloadId}`);
          await downloadAndProcessCatalog(statusData.downloadId, catalogType, startTime);
          return true;
        } else if (statusData.requestStatus === 'ERROR') {
          throw new Error('La generación de catálogo en los servidores de Bihr falló.');
        }
      }
      
      throw new Error('Tiempo de espera agotado para la generación del catálogo.');
    } else {
      throw new Error(`Código HTTP de respuesta no esperado: ${response.status}`);
    }

    return false;
  } catch (error: any) {
    console.error(`[BIHR SERVICE ERROR]: Falló la sincronización de catálogo ${catalogType}:`, error);
    updateCatalogSyncState({
      status: 'failed',
      catalogType,
      startTime,
      endTime: new Date().toISOString(),
      error: error.message || String(error)
    });
    return false;
  }
}

/**
 * Descarga el archivo ZIP generado, lo extrae e importa a PostgreSQL
 */
async function downloadAndProcessCatalog(downloadId: string, catalogType: string, startTime: string) {
  const token = await getBihrToken();
  const zipPath = path.join(process.cwd(), 'uploads', `catalog-${downloadId}.zip`);
  const extractDir = path.join(process.cwd(), 'uploads', `catalog-${downloadId}`);

  console.log(`[BIHR SERVICE]: Descargando catálogo ZIP a: ${zipPath}`);
  
  updateCatalogSyncState({
    status: 'downloading',
    catalogType,
    startTime
  });
  
  // Realizar descarga
  const res = await fetch(`${BIHR_API_BASE}/api/v2.1/Catalog/GeneratedFile?downloadId=${downloadId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`No se pudo descargar el archivo de catálogo. HTTP ${res.status}`);
  }

  const fileStream = fs.createWriteStream(zipPath);
  const reader = res.body?.getReader();
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(Buffer.from(value));
    }
  }
  fileStream.end();
  
  console.log('[BIHR SERVICE]: Descarga completada. Extrayendo ZIP...');
  
  updateCatalogSyncState({
    status: 'extracting',
    catalogType,
    startTime
  });

  // Asegurar que existe directorio destino
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  // Extraer el archivo ZIP usando el comando unzip nativo de Linux
  return new Promise<void>((resolve, reject) => {
    exec(`unzip -o "${zipPath}" -d "${extractDir}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('[BIHR SERVICE ERROR]: Fallo al extraer con unzip de Linux:', error);
        reject(error);
        return;
      }
      
      console.log('[BIHR SERVICE]: Extracción exitosa. Procesando catálogo JSON...');
      
      // Buscar archivos JSON extraídos
      const files = fs.readdirSync(extractDir);
      const jsonFile = files.find(file => file.endsWith('.json'));
      
      if (!jsonFile) {
        reject(new Error('No se encontró ningún archivo JSON dentro del catálogo ZIP descargado.'));
        return;
      }

      const jsonFilePath = path.join(extractDir, jsonFile);
      console.log(`[BIHR SERVICE]: Procesando catálogo desde: ${jsonFilePath}`);
      
      // Limpieza programada de temporales en background
      resolve(processCatalogJson(jsonFilePath, catalogType, startTime).then(() => {
        try {
          fs.unlinkSync(zipPath);
          fs.rmSync(extractDir, { recursive: true, force: true });
          console.log('[BIHR SERVICE]: Limpieza de archivos temporales de descarga realizada.');
        } catch (e) {
          console.error('[BIHR SERVICE WARNING]: Error limpiando archivos temporales:', e);
        }
      }));
    });
  });
}

/**
 * Analiza el JSON importado e inserta/actualiza los productos en PostgreSQL
 */
import pkg from 'pg';
const { Pool } = pkg;

const BATCH_SIZE = 100;

async function processCatalogJson(filePath: string, catalogType: string, startTime: string) {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const catalog = JSON.parse(rawData);
  
  const references = catalog.References || catalog.Products || [];
  console.log(`[BIHR SERVICE]: Total de referencias encontradas en catálogo de Bihr: ${references.length}`);

  updateCatalogSyncState({
    status: 'importing',
    catalogType,
    startTime,
    currentBatch: 0,
    totalBatches: Math.ceil(references.length / BATCH_SIZE),
    totalProcessed: 0,
    totalItems: references.length,
    inserted: 0,
    updated: 0
  });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db",
    ssl: false,
    max: 5
  });

  console.log('[BIHR SERVICE]: Comenzando upsert masivo en PostgreSQL...');
  
  // Cargar reglas de precios una vez al inicio del catálogo
  const rulesClient = await pool.connect();
  let pricingRules: any[] = [];
  try {
    const rulesRes = await rulesClient.query("SELECT * FROM pricing_rules WHERE active = 1");
    pricingRules = rulesRes.rows || [];
    console.log(`[BIHR SERVICE]: Se cargaron ${pricingRules.length} reglas de márgenes activas.`);
  } catch (err) {
    console.error('[BIHR SERVICE]: Error al cargar reglas de márgenes, se usarán valores por defecto:', err);
  } finally {
    rulesClient.release();
  }

  const totalBatches = Math.ceil(references.length / BATCH_SIZE);
  let totalInserted = 0;
  let totalUpdated = 0;

  for (let i = 0; i < references.length; i += BATCH_SIZE) {
    const batch = references.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    console.log(`[BIHR SERVICE]: Procesando lote ${batchNum}/${totalBatches} (${batch.length} productos)...`);
    
    updateCatalogSyncState({
      status: 'importing',
      catalogType,
      startTime,
      currentBatch: batchNum,
      totalBatches,
      totalProcessed: Math.min(i + BATCH_SIZE, references.length),
      totalItems: references.length,
      inserted: totalInserted,
      updated: totalUpdated
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const ref of batch) {
        const sku = ref.ProductCode || ref.SupplierProductCode || ref.PartNumber || '';
        const name = ref.ProductName || ref.Description || ref.Designation || 'Sin nombre';
        const brand = ref.Brand || '';
        
        let cost = 0;
        if (ref.BaseDealerPriceExcludingTax) {
          cost = Math.round(parseFloat(ref.BaseDealerPriceExcludingTax) * 100);
        } else if (ref.RetailPriceExcludingTax) {
          cost = Math.round(parseFloat(ref.RetailPriceExcludingTax) * 100);
        }

        const barcode = ref.BarCode || '';
        const stockVal = ref.StockValue ? parseInt(ref.StockValue) : 0;
        const description = ref.Description || ref.HtmlDescription || '';
        
        const categoryMap: Record<string, number> = {
          'RIDER GEAR': 9,
          'HARD PARTS': 1,
          'PROTECTION': 9,
          'TYRES': 7,
          'OILS': 6,
          'ACCESSORIES': 10
        };
        const categoryId = categoryMap[ref.Category1?.toUpperCase()] || 1;

        // Calcular precio según márgenes
        let marginPercent = 20; // default 20%
        const brandRule = pricingRules.find(r => r.rule_type === 'brand' && r.target_id?.toLowerCase() === brand?.toLowerCase());
        if (brandRule) {
          marginPercent = brandRule.margin_percent;
        } else {
          const categoryRule = pricingRules.find(r => r.rule_type === 'category' && r.target_id === String(categoryId));
          if (categoryRule) {
            marginPercent = categoryRule.margin_percent;
          } else {
            const globalRule = pricingRules.find(r => r.rule_type === 'global');
            if (globalRule) {
              marginPercent = globalRule.margin_percent;
            }
          }
        }

        let price = Math.round(cost * (1 + marginPercent / 100));

        // Respaldo de precio si cost es 0
        if (price === 0) {
          if (ref.RetailPriceIncludingTax) {
            price = Math.round(parseFloat(ref.RetailPriceIncludingTax) * 100);
          } else if (ref.RetailPriceExcludingTax) {
            price = Math.round(parseFloat(ref.RetailPriceExcludingTax) * 100);
          }
          cost = Math.round(price / 1.20);
        }
        
        const result = await client.query(`
          INSERT INTO products (sku, name, brand, cost, price, stock, barcode, description, category_id, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', NOW(), NOW())
          ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            cost = EXCLUDED.cost,
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            barcode = EXCLUDED.barcode,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            updated_at = NOW()
          RETURNING id, (xmax = 0) AS inserted
        `, [sku, name, brand, cost, price, stockVal, barcode, description, categoryId]);
        
        if (result.rows[0]?.inserted) {
          totalInserted++;
        } else {
          totalUpdated++;
        }
      }
      
      await client.query('COMMIT');
      console.log(`[BIHR SERVICE]: Lote ${batchNum} completado.`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[BIHR SERVICE ERROR]: Error en lote ${batchNum}:`, err);
    } finally {
      client.release();
    }
  }
  
  await pool.end();
  console.log(`[BIHR SERVICE]: Importación completada. Nuevos: ${totalInserted}, Actualizados: ${totalUpdated}`);
  
  updateCatalogSyncState({
    status: 'completed',
    catalogType,
    startTime,
    endTime: new Date().toISOString(),
    inserted: totalInserted,
    updated: totalUpdated
  });
}
