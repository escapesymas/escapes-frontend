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
Tienes acceso a búsqueda en Google. ÚSALA ACTIVAMENTE para:
- Verificar ESPECIFICACIONES TÉCNICAS de la moto del cliente (tipo de caliper, diámetro disco)
- Buscar QUÉ MODELOS DE OTRAS MARCAS usan las mismas piezas (ej: "pastillas freno Z900 compatibles")
- Encontrar referencias cruzadas entre marcas (ej: Brembo, Braking, Nissin)

⛔ NUNCA uses la búsqueda web para:
- Buscar precios de otras tiendas
- Recomendar productos que NO estén en nuestro catálogo

📦 PRODUCTOS - ESTRATEGIA:
1. PRIMERO busca en la web las especificaciones técnicas de la moto del cliente
2. LUEGO busca en el catálogo productos con esas especificaciones
3. Si hay productos genéricos (ej: "Pastillas Braking para Kawasaki/Suzuki"), PREGUNTA al cliente si quiere que verifiques compatibilidad
4. SIEMPRE incluye [REF:SKU] para que aparezca el botón de compra

CATÁLOGO ACTUAL (ÚNICA FUENTE DE PRODUCTOS):
${productContext || 'No hay productos que coincidan. Intenta buscar el tipo de pieza (ej: "pastillas", "escape", "disco")'}

💡 FLUJO RECOMENDADO:
1. Cliente: "Pastillas para Z900 2020"
2. TÚ: Buscar en la web "Z900 2020 brake caliper type specifications"
3. TÚ: Con esa info, buscar en catálogo pastillas compatibles
4. TÚ: Si hay productos para "Kawasaki" en general, ofrecerlos INDICANDO que el cliente debe confirmar compatibilidad

⚠️ IMPORTANTE: Si no encuentras productos ESPECÍFICOS del modelo, pero SÍ hay productos de la misma MARCA o TIPO, muéstralos al cliente indicando:
"No tengo pastillas específicas para tu Z900, pero tenemos estas pastillas Braking para Kawasaki. ¿Quieres que verifique si son compatibles con tu modelo?"

RECUERDA: Es mejor ofrecer opciones con advertencia que decir "no hay nada".`;


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
