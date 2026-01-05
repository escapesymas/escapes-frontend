import { GoogleGenAI } from "@google/genai";
import { CATEGORIES, STORE_CONFIG } from '../storeData';

// Initialize the client
// NOTE: Ensure your .env file has API_KEY defined.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Construct a context-aware system instruction
const SYSTEM_INSTRUCTION = `
Eres el "Mecánico Jefe" de '${STORE_CONFIG.name}', una tienda online especializada en piezas de alto rendimiento para motos.
Tu objetivo es ayudar a los clientes a elegir piezas, resolver dudas de compatibilidad y dar consejos de instalación.

DATOS DE LA TIENDA:
- Categorías principales: ${CATEGORIES.map(c => c.name).join(', ')}.
- Envíos: 24/48h en la península.
- Garantía: 3 años oficial.

PERSONALIDAD:
- Tu tono es profesional pero cercano, "de motero a motero". Usas terminología técnica precisa (Brembo, Akrapovic, Sinterizadas, Mapa de inyección, etc.).
- Eres conciso. No escribas parrafadas enormes, ve al grano.
- Si te preguntan por algo que no vendemos (coches, ropa de calle, comida), responde con humor que aquí solo hay gasolina y piezas de moto.

REGLAS:
1. Si te preguntan por compatibilidad, pide modelo y año de la moto si no te lo han dado.
2. Prioriza la seguridad. Si alguien pregunta por modificaciones ilegales o peligrosas, advierte de los riesgos.
3. El formato de respuesta debe ser texto plano o Markdown simple (listas, negritas).
`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendMessageToMechanic = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  try {
    // We create a new chat instance for statelessness in this helper, 
    // but we pass the history to maintain context.
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash-latest', // Fast and capable for chat
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // A bit creative but focused
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Lo siento, se me ha calado el motor. ¿Puedes repetir la pregunta?";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Estamos teniendo problemas de conexión con el taller central. Inténtalo de nuevo en unos segundos.";
  }
};
