const BIHR_USERNAME = process.env.BIHR_USERNAME || 'info@escapesymas.com';
const BIHR_MACKEY = process.env.BIHR_MACKEY || '';
const CATALOG_DIR = process.env.CATALOG_DIR || '/home/adrian/Documentos/GitHub/escapes-react/ADMIN/CATALOGO BIHR';

async function getToken() {
  const formData = new URLSearchParams();
  formData.append('UserName', BIHR_USERNAME);
  formData.append('PassWord', BIHR_MACKEY);
  
  const response = await fetch('https://api.bihr.net/api/v2.1/Authentication/Token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
  
  const data = await response.json();
  return data.access_token;
}

async function requestCatalog(token, type) {
  console.log(`[CATALOG] Requesting ${type} catalog...`);
  
  const response = await fetch(`https://api.bihr.net/api/v2.1/Catalog/ZIP/JSON/${type}/Full`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const body = await response.text();
  
  if (response.status === 200) {
    console.log(`[CATALOG] ${type}: already generated (HTTP 200)`);
    return { type, status: 'ready', data: JSON.parse(body) };
  }
  
  const data = JSON.parse(body);
  return { type, status: 'pending', ticketId: data.ticketId };
}

async function waitForCatalog(token, ticketId, type, maxWait = 300) {
  console.log(`[CATALOG] Waiting for ${type} (ticket: ${ticketId})...`);
  
  for (let i = 0; i < maxWait; i++) {
    await new Promise(r => setTimeout(r, 2000));
    
    const response = await fetch(`https://api.bihr.net/api/v2.1/Catalog/GenerationStatus?ticketId=${ticketId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    console.log(`[CATALOG] ${type} status: ${data.RequestStatus} (${i*2}s)`);
    
    if (data.RequestStatus === 'DONE') {
      return data.DownloadId;
    }
    if (data.RequestStatus === 'ERROR') {
      throw new Error(`${type} generation failed`);
    }
  }
  throw new Error(`Timeout waiting for ${type}`);
}

async function downloadAndExtract(token, downloadId, type) {
  console.log(`[CATALOG] Downloading ${type}...`);
  
  const response = await fetch(`https://api.bihr.net/api/v2.1/Catalog/GeneratedFile?downloadId=${downloadId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  console.log(`[CATALOG] Downloaded ${buffer.byteLength} bytes`);
  
  // Save to temp file
  const fs = await import('fs');
  const path = await import('path');
  const zlib = await import('zlib');
  
  const zipPath = `/tmp/catalog-${type}.zip`;
  fs.writeFileSync(zipPath, Buffer.from(buffer));
  
  // Extract
  const extractDir = `/tmp/catalog-${type}`;
  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
  fs.mkdirSync(extractDir, { recursive: true });
  
  await new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`unzip -o "${zipPath}" -d "${extractDir}"`, (err, stdout, stderr) => {
      if (err) { reject(err); return; }
      resolve();
    });
  });
  
  console.log(`[CATALOG] Extracted to ${extractDir}`);
  
  // Find and move CSV files
  const files = fs.readdirSync(extractDir);
  const csvFiles = files.filter(f => f.endsWith('.csv'));
  
  console.log(`[CATALOG] Found ${csvFiles.length} CSV files`);
  
  // Create backup of current catalog
  const backupDir = `${CATALOG_DIR}-backup-${Date.now()}`;
  fs.renameSync(CATALOG_DIR, backupDir);
  fs.mkdirSync(CATALOG_DIR);
  
  // Move CSV files
  for (const file of csvFiles) {
    const src = path.join(extractDir, file);
    const dst = path.join(CATALOG_DIR, file);
    fs.renameSync(src, dst);
    console.log(`[CATALOG] Moved: ${file}`);
  }
  
  console.log(`[CATALOG] Backup saved to: ${backupDir}`);
  
  // Cleanup
  fs.rmSync(zipPath, { force: true });
  fs.rmSync(extractDir, { recursive: true, force: true });
  
  return csvFiles.length;
}

async function main() {
  console.log('[CATALOG] === Starting Bihr catalog download ===');
  
  const token = await getToken();
  console.log('[CATALOG] Token obtained');
  
  // Request both catalogs
  const [hardPart, riderGear] = await Promise.all([
    requestCatalog(token, 'HardPart'),
    requestCatalog(token, 'RiderGear')
  ]);
  
  console.log('[CATALOG] HardPart:', JSON.stringify(hardPart));
  console.log('[CATALOG] RiderGear:', JSON.stringify(riderGear));
  
  // Wait for pending catalogs
  const pending = [hardPart, riderGear].filter(c => c.status === 'pending');
  
  for (const cat of pending) {
    try {
      const downloadId = await waitForCatalog(token, cat.ticketId, cat.type);
      await downloadAndExtract(token, downloadId, cat.type);
    } catch (err) {
      console.error(`[CATALOG] Error with ${cat.type}:`, err.message);
    }
  }
  
  console.log('[CATALOG] === Catalog download complete ===');
}

main().catch(console.error);
