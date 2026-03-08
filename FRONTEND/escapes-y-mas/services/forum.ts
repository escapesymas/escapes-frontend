import { ForumCategory, ForumTopic, ForumReply, UserRank } from '../types';
import { MessageSquare, Wrench, Bike, Shield, Compass, LifeBuoy, Flag } from 'lucide-react';
import { makeRequest, toggleLike as apiToggleLike, registerActivity, fetchUserRank as apiFetchUserRank } from './woocommerce';

// --- CONFIGURATION ---

// We map the mock IDs to these visual cues, but in real WP they are just categories
const FORUM_ICONS: Record<string, any> = {
  'start_zone': Flag,
  'mechanic': Wrench,
  'brands': Bike,
  'gear': Shield,
  'routes': Compass,
  'support': LifeBuoy
};

// --- STATIC CATEGORIES & HIERARCHY ---

export const STATIC_CATEGORIES = [
  {
    id: 'general',
    title: 'Paddock General',
    description: 'Charlas sobre motociclismo, actualiadad y off-topic.',
    icon: MessageSquare,
    bg: 'bg-blue-100',
    color: 'text-blue-600'
  },
  {
    id: 'mechanic',
    title: 'Mecánica y Taller',
    description: 'Dudas técnicas, bricos, mantenimientos y averías.',
    icon: Wrench,
    bg: 'bg-orange-100',
    color: 'text-orange-600'
  },
  {
    id: 'market_bikes',
    title: 'Compraventa Motos',
    description: 'EXCLUSIVO MOTOS. Prohibido recambios o equipamiento.',
    icon: Bike,
    bg: 'bg-green-100',
    color: 'text-green-600'
  },
  {
    id: 'routes',
    title: 'Rutas y Quedadas',
    description: 'Organiza salidas por tu zona. Navegación por provincias.',
    icon: Compass,
    bg: 'bg-red-100',
    color: 'text-red-600'
  }
];

export const SPAIN_PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", "Cáceres",
  "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara",
  "Guipúzcoa", "Huelva", "Huesca", "Illes Balears", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León",
  "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
  "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
].sort();

/**
 * 1. OBTENER CATEGORÍAS
 * Devuelve las categorías estáticas definidas para la App.
 */
export const fetchForumCategories = async (): Promise<ForumCategory[]> => {
  // Return static categories immediately
  return STATIC_CATEGORIES.map(cat => ({
    id: cat.id,
    title: cat.title,
    description: cat.description,
    icon: cat.icon,
    topicCount: 0 // Dynamic count logic would handle this differently
  }));
};

/**
 * 2. OBTENER TEMAS
 * Endpoint: /wp/v2/paddock_topic
 */
export const fetchTopics = async (categoryId: string): Promise<ForumTopic[]> => {
  try {
    // Native WP Posts
    let endpoint = `/wp/v2/posts?_embed&per_page=20&status=publish`;

    // Filter by native category ID
    if (categoryId && !isNaN(Number(categoryId))) {
      endpoint += `&categories=${categoryId}`;
    }

    const { data } = await makeRequest(endpoint);

    return (data as any[]).map(item => ({
      id: item.id,
      categoryId: categoryId,
      title: item.title.rendered,
      author: item._embedded?.author?.[0]?.name || 'Piloto Anónimo',
      authorId: item.author,
      authorAvatar: item._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
      date: new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      views: 0,
      replies: 0, // Native posts show comment count in 'replies' or we can fetch it
      isPinned: item.sticky || false,
      content: item.content?.rendered || '',
      likes: item.likes || 0,
      likedBy: item.is_liked ? [9999] : [] // Frontend uses likedBy array length to check status, slight hack but effective for boolean
    }));
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [];
  }
};

/**
 * 3. OBTENER RESPUESTAS
 * Las respuestas son Comments del post type 'paddock_topic'
 */
export const fetchReplies = async (topicId: number): Promise<ForumReply[]> => {
  try {
    const { data } = await makeRequest(`/paddock/v1/replies?topic_id=${topicId}`);
    return data as ForumReply[];
  } catch (error) {
    console.error("Error fetching replies:", error);
    return [];
  }
};

/**
 * 4. CREAR TEMA
 */
export const createTopic = async (
  token: string,
  categoryId: string,
  title: string,
  body: string
): Promise<{ success: boolean; id?: number; error?: string }> => {
  try {
    // Creating a native WP Post
    const payload = {
      title: title,
      content: body,
      status: 'publish',
      categories: [parseInt(categoryId)] // Native tax uses 'categories'
    };

    const { data } = await makeRequest('/wp/v2/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al crear tema' };
  }
};

/**
 * 5. CREAR RESPUESTA (Comentario)
 */
export const createReply = async (
  token: string,
  topicId: number,
  body: string
): Promise<{ success: boolean; id?: number; error?: string }> => {
  try {
    const { data } = await makeRequest('/wp/v2/comments', {
      method: 'POST',
      body: JSON.stringify({
        post: topicId,
        content: body
      }),
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al responder' };
  }
};

/**
 * 6. ACTUALIZAR TEMA
 */
export const updateTopic = async (token: string, topicId: number, title: string, content: string): Promise<boolean> => {
  try {
    await makeRequest(`/wp/v2/posts/${topicId}`, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 7. BORRAR TEMA
 */
export const deleteTopic = async (token: string, topicId: number): Promise<boolean> => {
  try { // Force delete to skip trash
    await makeRequest(`/wp/v2/posts/${topicId}?force=true`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 8. ACTUALIZAR RESPUESTA
 */
export const updateReply = async (token: string, replyId: number, content: string): Promise<boolean> => {
  try {
    await makeRequest(`/wp/v2/comments/${replyId}`, {
      method: 'POST', // Update
      body: JSON.stringify({ content }),
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 9. BORRAR RESPUESTA
 */
export const deleteReply = async (token: string, replyId: number): Promise<boolean> => {
  try {
    await makeRequest(`/wp/v2/comments/${replyId}?force=true`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch (e) {
    return false;
  }
};

// --- GAMIFICATION DELEGATES ---

export const toggleLike = async (
  type: 'topic' | 'reply',
  id: number,
  userId: number,
  token: string
) => {
  try {
    const result = await apiToggleLike(type, id, token);
    return { success: true, liked: result.liked, likeCount: result.likeCount };
  } catch (e: any) {
    const msg = e.message || 'Error';
    if (msg.includes('No puedes')) return { success: false, liked: false, likeCount: 0, error: msg };
    return { success: false, liked: false, likeCount: 0 };
  }
};

export const awardXP = async (userId: number, actionType: 'CREATE_TOPIC' | 'CREATE_REPLY', token: string, targetId: number = 0) => {
  // Map actionType to the values expected by registerActivity ('post' or 'reply')
  const type = actionType === 'CREATE_TOPIC' ? 'post' : 'reply';
  await registerActivity(type, targetId, token);
};

export const getUserRank = async (userId: number): Promise<UserRank | null> => {
  return await apiFetchUserRank(userId);
};
