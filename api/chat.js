/**
 * AI Parts Advisor API Route
 * Uses Google Gemini 2.5 Pro with Google Search for motorcycle compatibility
 * 
 * Environment Variable Required: GEMINI_API_KEY
 * Set this in Vercel Dashboard: Settings > Environment Variables
 * 
 * @version 2.0.0 - 2026-01-22
 * - Upgraded to Gemini 2.5 Pro
 * - Added Google Search Retrieval for motorcycle compatibility verification
 * - Products remain exclusively from store catalog
 */

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
        const { message, history = [], productContext = '' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // System prompt for the AI advisor with web search instructions
        const systemPrompt = `Eres el Asesor TÉCNICO de Escapes y Más. Tu misión es encontrar piezas COMPATIBLES en nuestro catálogo.

🔍 USO DE BÚSQUEDA WEB (Google Search):
Tienes acceso a búsqueda en Google. ÚSALA SOLO para:
- Verificar ESPECIFICACIONES TÉCNICAS de la moto del cliente (cilindrada, año, variantes)
- Comprobar COMPATIBILIDADES (diámetro de discos, tipo de caliper, medidas de pastillas)
- Confirmar si un modelo específico usa las mismas piezas que otro

⛔ NUNCA uses la búsqueda web para:
- Buscar precios de otras tiendas
- Recomendar productos que NO estén en nuestro catálogo
- Buscar tiendas alternativas

📦 PRODUCTOS - REGLAS CRÍTICAS:
1. SOLO recomienda productos del "CATÁLOGO ACTUAL" de abajo (NUNCA de la web)
2. NO TE INVENTES COMPATIBILIDADES. Si no hay pieza compatible en el catálogo, dilo claramente.
3. REFERENCIA OBLIGATORIA: Siempre incluye [REF:SKU] para que aparezca el botón de compra.
   Ejemplo: "Te recomiendo las pastillas Braking [REF:791CM44]"
4. PRIORIZA productos con "STOCK: SÍ"

CATÁLOGO ACTUAL DE LA TIENDA (ÚNICA FUENTE DE PRODUCTOS):
${productContext || 'No hay productos que coincidan. Pide marca, modelo y año para buscar mejor.'}

💡 FLUJO DE TRABAJO:
1. Cliente menciona su moto → USA LA WEB para verificar especificaciones
2. Con las specs, busca en el CATÁLOGO productos compatibles
3. Recomienda SOLO productos del catálogo con [REF:SKU]
4. Si no hay productos compatibles en catálogo → Informa al cliente

RECUERDA: Mejor perder una venta que causar un accidente por pieza errónea.`;

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
                        google_search_retrieval: {
                            dynamic_retrieval_config: {
                                mode: "MODE_DYNAMIC",
                                dynamic_threshold: 0.5
                            }
                        }
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
