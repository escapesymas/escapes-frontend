import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';

export default async function handler(req, res) {
    const { action, brand, model, year } = req.query;
    
    // Better path resolution for Vercel. Bundled files are in the lambda's CWD or subfolders.
    const dbPath = path.join(process.cwd(), 'api', 'moto_catalog.db');

    let db;
    try {
        // 1. Initial checks for debugging (will show in 500 error response)
        if (!fs.existsSync(dbPath)) {
            // Check if it's in the same directory as this file (sometimes /api/ is the root for lambda)
            const fallbackPath = path.join(__dirname, 'moto_catalog.db');
            if (fs.existsSync(fallbackPath)) {
                console.log('Using fallback path:', fallbackPath);
            } else {
                return res.status(500).json({ 
                    error: "Database file missing", 
                    cwd: process.cwd(), 
                    dirname: __dirname,
                    attempted_paths: [dbPath, fallbackPath]
                });
            }
        }

        // 2. Open DB
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READONLY
        });

        if (action === 'brands') {
            const brands = await db.all('SELECT DISTINCT brand FROM vehicles ORDER BY brand');
            return res.status(200).json(brands.map(b => b.brand));
        }

        if (action === 'models') {
            const models = await db.all('SELECT DISTINCT model FROM vehicles WHERE brand = ? ORDER BY model', [brand]);
            return res.status(200).json(models.map(m => m.model));
        }

        if (action === 'years') {
            const years = await db.all('SELECT DISTINCT year FROM vehicles WHERE brand = ? AND model = ? ORDER BY year DESC', [brand, model]);
            return res.status(200).json(years.map(y => y.year));
        }

        if (action === 'compatible-skus') {
            let vQuery = 'SELECT code FROM vehicles WHERE brand = ? AND model = ?';
            const params = [brand, model];
            if (year && year !== 'General') {
                vQuery += ' AND year = ?';
                params.push(year);
            }
            const codes = await db.all(vQuery, params);
            if (codes.length === 0) return res.status(200).json([]);

            const placeholders = codes.map(() => '?').join(',');
            const skus = await db.all(`SELECT DISTINCT sku FROM compatibility WHERE vehicle_code IN (${placeholders})`, codes.map(c => c.code));
            
            return res.status(200).json(skus.map(s => s.sku));
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('[VEHICLES API ERROR]:', error);
        return res.status(500).json({ 
            error: error.message, 
            stack: error.stack,
            dbPath 
        });
    } finally {
        if (db) {
            try { await db.close(); } catch (e) {}
        }
    }
}
