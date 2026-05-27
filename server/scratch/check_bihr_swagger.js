import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSwagger() {
  const urls = [
    'https://api.bihr.net/swagger/v2.1/swagger.json',
    'https://api.bihr.net/swagger/v2/swagger.json',
    'https://api.bihr.net/swagger/v1/swagger.json',
    'https://api.bihr.net/api-docs/swagger.json',
    'https://api.bihr.net/api-docs/openapi.json',
  ];

  for (const url of urls) {
    try {
      console.log(`Trying ${url}...`);
      const res = await fetch(url);
      if (res.ok) {
        console.log(`Success! Found swagger at ${url}`);
        const data = await res.json();
        const paths = Object.keys(data.paths || {});
        console.log('Available endpoints count:', paths.length);
        console.log('Paths:', paths.filter(p => p.toLowerCase().includes('vehic') || p.toLowerCase().includes('model') || p.toLowerCase().includes('brand')));
        fs.writeFileSync(path.join(__dirname, 'bihr_paths.json'), JSON.stringify(paths, null, 2));
        return;
      } else {
        console.log(`Failed: ${res.status}`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

testSwagger();
