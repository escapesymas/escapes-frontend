/**
 * AI Parts Advisor API Route
 * Uses Google Gemini API for conversational assistance
 * 
 * Environment Variable Required: GEMINI_API_KEY
 * Set this in Vercel Dashboard: Settings > Environment Variables
 * 
 * @version 1.0.1 - 2026-01-22
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

        // System prompt for the AI advisor
        const systemPrompt = `Eres el Asesor Técnico Experto de Escapes y Más. Tu misión es actuar como un experto mecánico que filtra nuestro catálogo para el cliente.

INSTRUCCIONES DE EXPERTO:
1. USA TU CONOCIMIENTO DE INTERNET: Sabes qué marcas y tipos de piezas (pastillas, escapes, filtros) son compatibles con cada moto.
2. FILTRO INTELIGENTE: Te proporcionaré una LISTA DE PRODUCTOS de la tienda. Algunos serán compatibles y otros no. Tu trabajo es identificar los que SÍ sirven basándote en su título y marca.
3. PRIORIDAD DE STOCK: Si un producto tiene "Stock: SÍ", recomiéndalo con entusiasmo. Si dice "disponible bajo pedido", avisa de que tardará unos días.
4. HONESTIDAD TÉCNICA: Si tras revisar la LISTA DE PRODUCTOS ves que no tenemos la marca exacta que busca el cliente (ej: pide Brembo pero solo hay Braking), dile: "Para tu moto solemos trabajar con [Marca disponible], que ofrece un rendimiento similar a [Marca pedida]. Aquí tienes la opción que mejor te encaja...".
5. RECOMENDACIÓN PRECISA: Incluye siempre el SKU así: [REF:SKU].

CATÁLOGO ACTUAL DE LA TIENDA (Filtra estos resultados):
${productContext || 'No hay productos directos. Pide marca, modelo y año para hacer una búsqueda técnica profunda.'}

EJEMPLO:
"Para tu Honda PCX 125, las mejores pastillas que tenemos en stock ahora mismo son las Braking Sinterizadas [REF:791CM44]. Son de alto rendimiento y las tenemos disponibles para envío hoy mismo."`;

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

        // Call Gemini API (Using 2.0 Flash Experimental as 2.5 is not yet public)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
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
