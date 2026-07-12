import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIHR_USERNAME = process.env.BIHR_USERNAME || 'info@escapesymas.com';
const BIHR_MACKEY = process.env.BIHR_MACKEY || '';
const CATALOG_DIR = process.env.CATALOG_DIR || '/home/adrian/Documentos/GitHub/escapes-react/ADMIN/CATALOGO BIHR';
const BACKUP_DIR = `${CATALOG_DIR}-backup`;
const TEMP_ZIP = '/tmp/catalog-new.zip';
const TEMP_EXTRACT = '/tmp/catalog-extract';

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

async function downloadCatalog(token) {
  console.log('[DOWNLOAD] Fetching EssentialExtended catalog...');
  
  const response = await fetch('https://api.bihr.net/api/v2.1/Catalog/EssentialExtended', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/octet-stream'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  console.log('[DOWNLOAD] Writing to', TEMP_ZIP);
  const fileStream = createWriteStream(TEMP_ZIP);
  await pipeline(response.body, fileStream);
  
  const stats = fs.statSync(TEMP_ZIP);
  console.log(`[DOWNLOAD] Downloaded ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
}

function extractCatalog() {
  console.log('[EXTRACT] Cleaning up and extracting...');
  
  if (fs.existsSync(TEMP_EXTRACT)) {
    fs.rmSync(TEMP_EXTRACT, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_EXTRACT, { recursive: true });
  
  return execAsync(`unzip -o "${TEMP_ZIP}" -d "${TEMP_EXTRACT}"`).then(() => {
    const files = fs.readdirSync(TEMP_EXTRACT);
    console.log(`[EXTRACT] Found ${files.length} files`);
    return files;
  });
}

async function processFiles(files) {
  console.log('[PROCESS] Counting CSV files...');
  
  const csvFiles = files.filter(f => f.endsWith('.csv'));
  console.log(`[PROCESS] ${csvFiles.length} CSV files found`);
  
  if (csvFiles.length > 0) {
    console.log(`[PROCESS] Latest date: ${csvFiles[0].match(/(\d{4}_\d{2}_\d{2})/)?.[1] || 'unknown'}`);
  }
  
  // Backup old catalog
  console.log('[PROCESS] Backing up old catalog...');
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }
  
  // Copy old catalog to backup (not move, since we're across devices)
  execSync(`cp -r "${CATALOG_DIR}" "${BACKUP_DIR}"`);
  console.log(`[PROCESS] Backup available at: ${BACKUP_DIR}`);
  
  // Copy new files to catalog directory
  console.log('[PROCESS] Copying new files...');
  let copied = 0;
  for (const file of csvFiles) {
    const src = path.join(TEMP_EXTRACT, file);
    const dst = path.join(CATALOG_DIR, file);
    fs.copyFileSync(src, dst);
    copied++;
    if (copied % 50 === 0) console.log(`[PROCESS] Copied ${copied}/${csvFiles.length} files`);
  }
  
  console.log(`[PROCESS] Copied ${copied} files to ${CATALOG_DIR}`);
  
  return copied;
}

function execSync(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function cleanup() {
  console.log('[CLEANUP] Removing temp files...');
  try { fs.unlinkSync(TEMP_ZIP); } catch {}
  try { fs.rmSync(TEMP_EXTRACT, { recursive: true, force: true }); } catch {}
}

async function main() {
  console.log('========================================');
  console.log('   BIH CATALOG DOWNLOAD -', new Date().toISOString());
  console.log('========================================\n');
  
  try {
    const token = await getToken();
    console.log('[AUTH] Token obtained\n');
    
    await downloadCatalog(token);
    const files = await extractCatalog();
    await processFiles(files);
    await cleanup();
    
    console.log('\n========================================');
    console.log('   CATALOG UPDATE COMPLETE');
    console.log('========================================');
  } catch (err) {
    console.error('[ERROR]', err);
    process.exit(1);
  }
}

main();
