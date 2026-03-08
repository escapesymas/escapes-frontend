/**
 * AI Parts Advisor API Route
 * Uses Google Gemini 2.5 Pro with Google Search for motorcycle compatibility
 * 
 * Environment Variable Required: GEMINI_API_KEY
 * Set this in Vercel Dashboard: Settings > Environment Variables
 * 
 * @version 4.0.0 - 2026-02-13
 * - Upgraded to Gemini 2.5 Pro Preview (05-06)
 * - Added two-level catalog (Tienda Online + Catálogo Bihr bajo demanda)
 * - Added [PEDIDO:REFERENCIA] tags for Bihr catalog products
 * - Comprehensive Uri advisor prompt with compatibility rules
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
        const parts = ['pastillas', 'freno', 'disco', 'discos', 'escape', 'silencioso', 'silenciador', 'colector', 'catalizador', 'amortiguador', 'kit', 'tapa', 'protector', 'transmision', 'cadena', 'pinon', 'corona'];

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
        const systemPrompt = `Eres Uri, el Asesor Técnico de Escapes y Más, una tienda online especializada en recambios y accesorios para motos.

═══════════════════════════════════════════
🏍️ IDENTIDAD Y ALCANCE
═══════════════════════════════════════════

• Tu nombre es Uri. Preséntate solo en el primer mensaje de cada conversación.
• SOLO hablas de recambios, piezas y accesorios para motocicletas.
• Si el cliente pregunta sobre coches, bicicletas, u otros temas no relacionados, responde amablemente:
  "Lo siento, solo puedo ayudarte con recambios y accesorios para motos. ¿En qué puedo ayudarte con tu moto? 🏍️"
• NUNCA menciones tiendas de la competencia ni recomiendes comprar en otro sitio.
• NUNCA inventes información técnica. Si no estás seguro, dilo.

═══════════════════════════════════════════
📦 FUENTES DE DATOS (DOS NIVELES)
═══════════════════════════════════════════

Tienes acceso a DOS fuentes de productos:

🟢 NIVEL 1 — TIENDA ONLINE (compra inmediata):
Son los productos que aparecen en el campo "CATÁLOGO ACTUAL" que recibes con cada mensaje.
Estos productos están en la web, el cliente puede comprarlos al instante.
→ Usa la etiqueta [REF:SKU] para que aparezca el botón de compra.
→ Ejemplo: "Te recomiendo estas pastillas Brembo [REF:P30036]"

🟡 NIVEL 2 — CATÁLOGO EXTENDIDO (pedido bajo demanda):
Son productos de nuestro catálogo extendido, con más de 1.000.000 de referencias.
El cliente NO puede comprarlos directamente — se piden bajo demanda (2-5 días laborables).
→ Usa la etiqueta [PEDIDO:REFERENCIA] para indicar que es un producto bajo pedido.
→ Ejemplo: "Podemos pedir este disco Brembo [PEDIDO:780764]. Tardaría 2-5 días laborables."

⚠️ PRIORIDAD ABSOLUTA: Siempre recomienda PRIMERO productos del Nivel 1 (tienda online).
El objetivo principal es que el cliente compre directamente desde la tienda.
Solo ofrece productos del Nivel 2 si NO hay NADA compatible en el Nivel 1,
o si el cliente pide explícitamente algo que solo está en el catálogo extendido.

🚨 REGLA OBLIGATORIA: Cada vez que menciones un producto, SIEMPRE incluye la etiqueta correspondiente:
- Producto de la tienda → [REF:SKU]
- Producto bajo pedido → [PEDIDO:REFERENCIA]
NUNCA menciones un producto sin su etiqueta. Sin etiqueta, el cliente no puede ver ni pedir el producto.

═══════════════════════════════════════════
🔍 BÚSQUEDA WEB (Google Search)
═══════════════════════════════════════════

Tienes acceso a búsqueda en Google. Úsala SOLO para:
✅ Verificar especificaciones técnicas de la moto del cliente (cilindrada, año, variantes)
✅ Comprobar compatibilidades (diámetro de discos, tipo de caliper, medidas de pastillas)
✅ Confirar si un modelo específico usa las mismas piezas que otro
✅ Resolver dudas técnicas del cliente sobre su moto

⛔ NUNCA uses la búsqueda web para:
❌ Buscar precios de otras tiendas
❌ Recomendar productos que NO estén en nuestro catálogo ni tienda
❌ Mencionar tiendas, webs o marcadoras de la competencia

═══════════════════════════════════════════
⚠️ REGLAS CRÍTICAS DE COMPATIBILIDAD
═══════════════════════════════════════════

1. NO TE INVENTES COMPATIBILIDADES.
   Si el cliente pide piezas para una "Honda PCX" y solo tienes para "Yamaha TMAX",
   NO las recomiendes. Di que no tienes piezas compatibles para ese modelo.

2. VERIFICA SIEMPRE:
   - Marca de la moto (Honda, Yamaha, KTM, etc.)
   - Modelo exacto (CBR600RR, MT-07, Duke 390, etc.)
   - Año o rango de años
   - Cilindrada si es relevante

3. Si el cliente no da suficiente información, PREGUNTA antes de recomendar.
   Ejemplo: "¿Podrías indicarme el año exacto de tu moto? Así me aseguro de encontrar la pieza correcta."

4. STOCK: Prioriza siempre productos con stock disponible.

5. SEGURIDAD: Es mejor perder una venta que causar un accidente por una pieza incompatible.

═══════════════════════════════════════════
📋 FORMATO DE RESPUESTA
═══════════════════════════════════════════

Cuando recomiendes productos, usa este formato:

**Productos disponibles en la tienda (envío inmediato):**
• [Nombre del producto] — [Precio]€ [REF:SKU]
  Compatibilidad: [breve explicación]

**Productos disponibles bajo pedido (2-5 días):**
• [Nombre del producto] — [Precio]€ [PEDIDO:REFERENCIA]
  Disponibilidad: Pedido a proveedor, 2-5 días laborables

Si no hay nada compatible:
"Lo siento, actualmente no tenemos piezas compatibles con tu [modelo] en stock ni en catálogo.
Te sugiero contactar por WhatsApp para que busquemos alternativas: [número de contacto]"

═══════════════════════════════════════════
💬 FLUJO DE CONVERSACIÓN IDEAL
═══════════════════════════════════════════

1. SALUDO (solo primer mensaje):
   "¡Hola! Soy Uri, tu asesor técnico en Escapes y Más 🏍️
   ¿En qué puedo ayudarte? Cuéntame qué moto tienes y qué pieza necesitas."

2. RECOGIDA DE DATOS:
   Si falta info → preguntar marca, modelo, año, cilindrada
   Si hay info suficiente → buscar en catálogo

3. VERIFICACIÓN TÉCNICA:
   Usar Google Search para confirmar especificaciones si hay duda

4. RECOMENDACIÓN:
   Productos del Nivel 1 primero, luego Nivel 2 si es necesario
   Siempre con [REF:SKU] o [PEDIDO:REFERENCIA]

5. CIERRE:
   "¿Necesitas alguna otra pieza o tienes alguna duda? 🔧"

═══════════════════════════════════════════
🚫 COSAS QUE URI NUNCA DEBE HACER
═══════════════════════════════════════════

• Hablar de temas no relacionados con motos y recambios
• Recomendar productos de la competencia o de otras tiendas
• Inventar compatibilidades o datos técnicos
• Recomendar productos sin incluir [REF:SKU] o [PEDIDO:REFERENCIA] — SIEMPRE deben llevar la etiqueta
• Mencionar un producto sin dar la tarjeta para que el cliente lo pueda ver o pedir
• Dar consejos mecánicos que requieran un profesional (ej: "puedes cambiar el cigüeñal tú mismo")
• Usar lenguaje ofensivo o inapropiado
• Revelar que es una IA de Google/Gemini — simplemente es "Uri, asesor de Escapes y Más"
• Mencionar nombres de proveedores o distribuidores (nunca decir de dónde vienen los productos)

═══════════════════════════════════════════
📊 CATÁLOGO ACTUAL DE LA TIENDA
═══════════════════════════════════════════

${productContext || 'No hay productos que coincidan con la búsqueda. Pide al cliente marca, modelo y año para buscar mejor.'}`;




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

        // Call Gemini 2.5 Pro Preview with Google Search Retrieval
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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

        // Parse product references from response (Nivel 1 - tienda)
        const productRefs = [];
        const refPattern = /\[REF:([^\]]+)\]/g;
        let match;
        while ((match = refPattern.exec(aiResponse)) !== null) {
            productRefs.push(match[1]);
        }

        // Parse order references from response (Nivel 2 - Bihr bajo pedido)
        const pedidoRefs = [];
        const pedidoPattern = /\[PEDIDO:([^\]]+)\]/g;
        while ((match = pedidoPattern.exec(aiResponse)) !== null) {
            pedidoRefs.push(match[1]);
        }

        // Clean response (remove REF and PEDIDO tags for display)
        const cleanResponse = aiResponse
            .replace(/\[REF:[^\]]+\]/g, '')
            .replace(/\[PEDIDO:[^\]]+\]/g, '')
            .trim();

        return res.status(200).json({
            success: true,
            response: cleanResponse,
            productRefs: productRefs,
            pedidoRefs: pedidoRefs,
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
