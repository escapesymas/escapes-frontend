/**
 * AI Parts Advisor API Route
 * Uses Google Gemini API for conversational assistance
 * 
 * Environment Variable Required: GEMINI_API_KEY
 * Set this in Vercel Dashboard: Settings > Environment Variables
 * 
 * @version 1.0.1 - 2026-01-22
 */

module.exports = async function handler(req, res) {
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
        const systemPrompt = `Eres el Asesor de Recambios de Escapes y Más, una tienda online especializada en escapes, accesorios y recambios para motos.

INSTRUCCIONES:
- Responde SIEMPRE en español
- Sé conciso y profesional
- Ayuda a encontrar piezas compatibles con la moto del cliente
- Cuando recomiendes un producto específico, incluye la referencia así: [REF:SKU_DEL_PRODUCTO]
- Si no conoces el SKU exacto, describe el producto claramente
- Si no sabes algo, dilo honestamente
- Puedes preguntar marca, modelo y año de la moto para dar mejores recomendaciones
- Menciona que los envíos son en 24/48h y hay garantía de 3 años

CATÁLOGO DISPONIBLE:
${productContext || 'Catálogo general de escapes, filtros de aire, aceites, frenos y accesorios para motos.'}

EJEMPLO DE RESPUESTA CON PRODUCTO:
"Para tu Yamaha MT-07 te recomiendo el escape Akrapovic Racing Line [REF:AK-S-Y7R1-ZC]. Tiene un sonido brutal y mejora el rendimiento."`;

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

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
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
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('[AI ADVISOR] Gemini API error:', errorData);
            return res.status(500).json({
                error: 'Error al conectar con el asesor. Inténtalo de nuevo.',
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
