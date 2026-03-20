import fs from 'fs';
import path from 'path';

// Load JSON once in the module scope (Vercel reuses lambdas)
const JSON_PATH = path.join(process.cwd(), 'api', 'moto_catalog.json');

let catalog = null;

function getCatalog() {
    if (!catalog) {
        if (!fs.existsSync(JSON_PATH)) {
            throw new Error(`Catalog missing at ${JSON_PATH}`);
        }
        catalog = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    }
    return catalog;
}

export default async function handler(req, res) {
    const { action, brand, model, year } = req.query;

    try {
        const { hierarchy, compatibility } = getCatalog();

        if (action === 'brands') {
            const brands = Object.keys(hierarchy).sort();
            return res.status(200).json(brands);
        }

        if (action === 'models') {
            const models = Object.keys(hierarchy[brand] || {}).sort();
            return res.status(200).json(models);
        }

        if (action === 'years') {
            const years = Object.keys(hierarchy[brand]?.[model] || {}).sort((a, b) => b - a);
            return res.status(200).json(years);
        }

        if (action === 'compatible-skus') {
            // Find all codes for selected brand/model/year
            let codes = [];
            if (!hierarchy[brand]) return res.status(200).json([]);
            
            if (model) {
                if (year && year !== 'General') {
                    codes = hierarchy[brand][model][year] || [];
                } else {
                    // All years for this model
                    Object.values(hierarchy[brand][model]).forEach(cList => {
                        codes.push(...cList);
                    });
                }
            } else {
                // All models for this brand
                Object.values(hierarchy[brand]).forEach(modelsObj => {
                    Object.values(modelsObj).forEach(cList => {
                        codes.push(...cList);
                    });
                });
            }

            // Map codes to SKUs
            const skusSet = new Set();
            codes.forEach(code => {
                const vehicleSkus = compatibility[code] || [];
                vehicleSkus.forEach(sku => skusSet.add(sku));
            });

            return res.status(200).json(Array.from(skusSet));
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('[VEHICLES API ERROR]:', error);
        return res.status(500).json({ 
            error: error.message,
            path: JSON_PATH
        });
    }
}
