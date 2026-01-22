/**
 * AI Parts Advisor API Route
 * Uses Google Gemini 2.5 Pro with Google Search for motorcycle compatibility
 * 
 * Environment Variable Required: GEMINI_API_KEY
 * Set this in Vercel Dashboard: Settings > Environment Variables
 * 
 * @version 3.0.0 - 2026-01-22
 * - Upgraded to Gemini 2.5 Pro
 * - Added Google Search for motorcycle compatibility verification
 * - Integrated complete CSV catalog (6571 products) for comprehensive search
 * - Products remain exclusively from store catalog
 */

import fs from 'fs';
import path from 'path';

/**
 * Parse CSV and search for products
 * @param {string} userMessage - The user's search query
 * @returns {string} - Formatted product context
 */
function searchCatalogCSV(userMessage) {
    try {
        // Read CSV file from public directory
        const csvPath = path.join(process.cwd(), 'public', 'catalogo-completo.csv');

        if (!fs.existsSync(csvPath)) {
            console.error('[CSV] Catalog file not found:', csvPath);
            return '';
        }

        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n');

        // Skip header
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV row (handling quoted fields)
            const row = parseCSVRow(line);
            if (row.length < 10) continue;

            // Extract key fields
            const sku = row[2] || '';
            const name = row[4] || '';
            const description = row[8] || '';
            const price = row[26] || row[27] || '';
            const categories = row[28] || '';
            const brand = row[42] || '';

            products.push({ sku, name, description, price, categories, brand });
        }

        // Filter products based on user query
        const query = userMessage.toLowerCase();
        const brands = ['honda', 'yamaha', 'kawasaki', 'suzuki', 'ducati', 'bmw', 'ktm', 'aprilia', 'triumph', 'vespa', 'piaggio', 'moto guzzi', 'harley', 'royal enfield', 'cf moto', 'kove', 'fantic', 'husqvarna', 'qj motor', 'voge', 'zontes', 'sym'];
        const parts = ['pastillas', 'freno', 'disco', 'discos', 'escape', 'silencioso', 'silenciador', 'colector', 'catalizador', 'amortiguador', 'kit', 'tapa', 'protector'];

        const mentionedBrand = brands.find(b => query.includes(b));
        const mentionedParts = parts.filter(p => query.includes(p));

        // Search strategy
        let filtered = products.filter(p => {
            const searchText = `${p.name} ${p.description} ${p.categories} ${p.brand}`.toLowerCase();

            // Match brand if mentioned
            if (mentionedBrand && !searchText.includes(mentionedBrand)) return false;

            // Match at least one part type if mentioned
            if (mentionedParts.length > 0) {
                const hasPartMatch = mentionedParts.some(part => searchText.includes(part));
                if (!hasPartMatch) return false;
            }

            return true;
        });

        // If too many results, prioritize by relevance
        if (filtered.length > 100) {
            // Score products by relevance
            filtered = filtered.map(p => {
                let score = 0;
                const text = `${p.name} ${p.description}`.toLowerCase();

                if (mentionedBrand && text.includes(mentionedBrand)) score += 10;
                mentionedParts.forEach(part => {
                    if (text.includes(part)) score += 5;
                });

                return { ...p, score };
            }).sort((a, b) => b.score - a.score).slice(0, 100);
        }

        // Limit to 50 best matches
        const limited = filtered.slice(0, 50);

        // Format for Gemini
        return limited.map(p =>
            `PRODUCTO: ${p.name} | REF: [REF:${p.sku}] | PRECIO: ${p.price}€ | CATEGORÍA: ${p.categories} | MARCA: ${p.brand}`
        ).join('\n');

    } catch (error) {
        console.error('[CSV] Error reading catalog:', error);
        return '';
    }
}

/**
 * Parse a single CSV row handling quoted fields
 */
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result.map(field => field.replace(/^"|"$/g, '').trim());
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('[AI ADVISOR] GEMINI_API_KEY not configured');
        return res.status(500).json({
            error: 'El asesor de IA no está configurado. Contacta al administrador.',
            code: 'API_KEY_MISSING'
        });
    }

    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Search the complete CSV catalog
        console.log('[CSV] Searching catalog for:', message);
        const productContext = searchCatalogCSV(message);
        console.log('[CSV] Found', productContext.split('\n').length, 'products');

        // System prompt for the AI advisor with web search instructions
        const systemPrompt = `Eres URI, el Asesor de Recambios de Escapes y Más. Tu ÚNICA función es ayudar a clientes a encontrar piezas para sus motos.

👤 TU IDENTIDAD:
- Te llamas URI
- Eres el asesor de recambios de Escapes y Más
- Tu tono es profesional, cercano y técnico

🚫 LÍMITES ESTRICTOS - SOLO RECAMBIOS:
- SOLO hablas de recambios, piezas, motos y productos de la tienda
- Si te preguntan sobre CUALQUIER otro tema (política, deportes, chistes, clima, etc.), responde:
  "Soy Uri, el asesor de recambios. Solo puedo ayudarte con piezas para tu moto. ¿Qué pieza necesitas?"
- NO des opiniones personales sobre nada que no sea recambios
- NO cuentes chistes, historias ni nada fuera de tu función

🔍 USO DE BÚSQUEDA WEB (Google Search):
Tienes acceso a Google. ÚSALO para:
- Verificar especificaciones técnicas de la moto del cliente
- Buscar compatibilidades técnicas (medidas, montaje)

⛔ PROHIBIDO ABSOLUTAMENTE:
- NUNCA menciones marcas que NO vendemos (EBC, SBS, Galfer, Ferodo, etc.)
- NUNCA recomiendes comprar en otras tiendas
- SOLO habla de productos del CATÁLOGO ACTUAL

🏪 MARCAS QUE VENDEMOS: Braking, Mivv, Termignoni, Storm, Akrapovic, Öhlins, Brembo Racing

📦 ESTRATEGIA:
1. Verifica las especificaciones de la moto del cliente en la web
2. Busca en el CATÁLOGO productos compatibles
3. Si no hay productos, di: "Actualmente no tenemos eso para tu moto. ¿Quieres que te avise cuando llegue?"
4. SIEMPRE incluye [REF:SKU] para el botón de compra

CATÁLOGO ACTUAL (búsqueda en toda la base de datos):
${productContext || 'No hay productos que coincidan con tu búsqueda.'}

RECUERDA: Eres Uri, solo hablas de recambios. Cualquier tema fuera de tu función lo rechazas amablemente.`;




        // Build conversation for Gemini
        const contents = [];

        // Add conversation history
        for (const msg of history) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Call Gemini 2.5 Pro with Google Search Retrieval
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    tools: [{
                        google_search: {}
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        topP: 0.9
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI ADVISOR] Gemini API error:', errorText);

            // WE EXPOSE THE ERROR TO THE UI FOR DEBUGGING
            return res.status(500).json({
                error: `Error de Google: ${errorText.substring(0, 200)}...`,
                code: 'GEMINI_ERROR'
            });
        }

        const data = await response.json();

        // Extract response text
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Lo siento, no pude procesar tu consulta. ¿Podrías reformularla?';

        // Parse product references from response
        const productRefs = [];
        const refPattern = /\[REF:([^\]]+)\]/g;
        let match;
        while ((match = refPattern.exec(aiResponse)) !== null) {
            productRefs.push(match[1]);
        }

        // Clean response (remove REF tags for display)
        const cleanResponse = aiResponse.replace(/\[REF:[^\]]+\]/g, '').trim();

        return res.status(200).json({
            success: true,
            response: cleanResponse,
            productRefs: productRefs,
            rawResponse: aiResponse
        });

    } catch (error) {
        console.error('[AI ADVISOR] Error:', error);
        return res.status(500).json({
            error: 'Error interno del asesor. Inténtalo de nuevo.',
            code: 'INTERNAL_ERROR'
        });
    }
}
