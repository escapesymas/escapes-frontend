import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default async function handler(req, res) {
    const { action, brand, model, year } = req.query;
    
    // SQLite DB path (bundled with Vercel deployment)
    const dbPath = path.resolve('./api/moto_catalog.db');

    let db;
    try {
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
            // 1. Get VehicleCode(s) for the selection
            let vQuery = 'SELECT code FROM vehicles WHERE brand = ? AND model = ?';
            const params = [brand, model];
            if (year && year !== 'General') {
                vQuery += ' AND year = ?';
                params.push(year);
            }
            const codes = await db.all(vQuery, params);
            
            if (codes.length === 0) return res.status(200).json([]);

            // 2. Get SKUs from compatibility table
            const placeholders = codes.map(() => '?').join(',');
            const skus = await db.all(`SELECT DISTINCT sku FROM compatibility WHERE vehicle_code IN (${placeholders})`, codes.map(c => c.code));
            
            return res.status(200).json(skus.map(s => s.sku));
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('[VEHICLES API]:', error);
        return res.status(500).json({ error: error.message, path: dbPath });
    } finally {
        if (db) await db.close();
    }
}
