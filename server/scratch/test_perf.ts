import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db'
});

async function main() {
  const brand = 'HONDA';
  const model = 'PCX 125';
  const year = 2022;

  // 1. Build nested index in memory
  console.log('--- Building Index ---');
  const startLoad = performance.now();
  const res = await pool.query(
    `SELECT sku, compatibility FROM products WHERE status = 'published' AND compatibility IS NOT NULL AND compatibility != '[]'`
  );
  
  // Map<brand, Map<year, Array<{ sku, model }>>>
  const index = new Map<string, Map<number, Array<{ sku: string, model: string }>>>();
  
  let count = 0;
  for (const row of res.rows) {
    if (!row.compatibility) continue;
    for (const item of row.compatibility) {
      if (!item.brand) continue;
      const bKey = item.brand.toLowerCase();
      const yKey = Number(item.year);
      if (isNaN(yKey)) continue;
      
      let yearMap = index.get(bKey);
      if (!yearMap) {
        yearMap = new Map();
        index.set(bKey, yearMap);
      }
      
      let list = yearMap.get(yKey);
      if (!list) {
        list = [];
        yearMap.set(yKey, list);
      }
      
      list.push({ sku: row.sku, model: item.model });
      count++;
    }
  }
  const endLoad = performance.now();
  console.log(`Indexed ${count} compatibilities across ${res.rows.length} products in ${(endLoad - startLoad).toFixed(2)} ms`);

  // 2. Search in index
  console.log('\n--- Searching Index ---');
  const startSearch = performance.now();
  const skusSet = new Set<string>();
  
  const bKey = brand.toLowerCase();
  const mKey = model.toLowerCase();
  
  const yearMap = index.get(bKey);
  if (yearMap) {
    const list = yearMap.get(year);
    if (list) {
      for (const item of list) {
        const cModel = item.model?.toLowerCase() || '';
        if (cModel.includes(mKey) || mKey.includes(cModel)) {
          skusSet.add(item.sku);
        }
      }
    }
  }
  
  const endSearch = performance.now();
  console.log(`Found ${skusSet.size} SKUs in ${(endSearch - startSearch).toFixed(4)} ms`);

  await pool.end();
}

main().catch(console.error);
