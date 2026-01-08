// ESTE SERVICIO HA SIDO DESACTIVADO
// La funcionalidad de Mecánico IA ha sido eliminada del proyecto.
// Archivo mantenido como placeholder para evitar errores de importación residuales.

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendMessageToMechanic = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  console.warn("AI Service is disabled");
  return "El servicio de IA está desactivado actualmente.";
};