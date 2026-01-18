import { WOO_CONFIG } from '../storeData';
import { ForumCategory, ForumTopic, ForumReply, UserRank } from '../types';
import { MessageSquare, Wrench, Bike, Shield, Compass, LifeBuoy, Flag } from 'lucide-react';

// Use proxy to avoid CORS issues
const WP_API_BASE = '/proxy-wc/wp-json/wp/v2';

// Rank configuration (matches backend)
const RANKS = [
  { level: 1, title: 'Novato', xpRequired: 0, color: '#71717a', icon: '🏍️' },
  { level: 2, title: 'Aprendiz', xpRequired: 50, color: '#22c55e', icon: '⚡' },
  { level: 3, title: 'Piloto', xpRequired: 150, color: '#3b82f6', icon: '🏁' },
  { level: 4, title: 'Experto', xpRequired: 300, color: '#a855f7', icon: '🔥' },
  { level: 5, title: 'Profesional', xpRequired: 500, color: '#f97316', icon: '💨' },
  { level: 6, title: 'Leyenda', xpRequired: 1000, color: '#eab308', icon: '👑' }
];

/**
 * Calculate user rank from XP
 */
function calculateRank(xp: number): UserRank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].xpRequired) {
      const currentRank = RANKS[i];
      const nextRank = RANKS[i + 1];
      return {
        level: currentRank.level,
        title: currentRank.title,
        color: currentRank.color,
        icon: currentRank.icon,
        xp: xp,
        xpToNext: nextRank ? nextRank.xpRequired - xp : 0
      };
    }
  }
  return {
    level: 1,
    title: RANKS[0].title,
    color: RANKS[0].color,
    icon: RANKS[0].icon,
    xp: 0,
    xpToNext: RANKS[1].xpRequired
  };
}

/**
 * Get user rank from WordPress via API
 */
export const getUserRank = async (userId: number): Promise<UserRank | null> => {
  try {
    const response = await fetch(`/api/forum/get-user-rank?userId=${userId}`);

    if (!response.ok) {
      console.warn('[RANK] Failed to fetch user rank');
      return null;
    }

    const rank = await response.json();
    return rank;
  } catch (error) {
    console.error('[RANK] Error fetching user rank:', error);
    return null;
  }
};

/**
 * ESQUEMA MAESTRO DEL FORO (Fallback & Structure)
 * Estas son las categorías ideales para organizar la comunidad.
 */
const FORUM_SCHEMA: ForumCategory[] = [
  {
    id: 'start_zone',
    title: 'Línea de Salida',
    description: 'Bienvenidas, presentaciones, normas y charla general off-topic.',
    icon: Flag,
    topicCount: 12
  },
  {
    id: 'mechanic',
    title: 'El Taller',
    description: 'Mecánica, dudas técnicas, bricos, reparaciones y mantenimiento.',
    icon: Wrench,
    topicCount: 45
  },
  {
    id: 'brands',
    title: 'Por Marcas y Modelos',
    description: 'Espacio dedicado por fabricante: Aprilia, BMW, Ducati, Yamaha, etc.',
    icon: Bike,
    topicCount: 89
  },
  {
    id: 'gear',
    title: 'Equipamiento y Accesorios',
    description: 'Cascos, monos, guantes, chuches para la moto y reviews de material.',
    icon: Shield,
    topicCount: 23
  },
  {
    id: 'routes',
    title: 'Rutas y Encuentros',
    description: 'Organización de quedadas, rutas, viajes, circuitos y crónicas.',
    icon: Compass,
    topicCount: 34
  },
  {
    id: 'support',
    title: 'Soporte y Sugerencias',
    description: 'Ayuda con la web, atención al cliente y buzón de sugerencias.',
    icon: LifeBuoy,
    topicCount: 7
  }
];

// Mapeo avanzado de iconos por si vienen de WP real
const getIconForForum = (slug: string = '', id: string | number) => {
  const s = slug.toLowerCase();
  if (s.includes('bienvenid') || s.includes('general') || s.includes('salida')) return Flag;
  if (s.includes('taller') || s.includes('mecanic') || s.includes('tecni')) return Wrench;
  if (s.includes('marca') || s.includes('modelo') || s.includes('bike')) return Bike;
  if (s.includes('equip') || s.includes('accesori') || s.includes('casco')) return Shield;
  if (s.includes('ruta') || s.includes('quedada') || s.includes('viaje') || s.includes('circuit')) return Compass;
  if (s.includes('soporte') || s.includes('ayuda') || s.includes('sugerencia')) return LifeBuoy;
  return MessageSquare;
};

/**
 * 1. OBTENER FOROS (Categorías)
 * Intenta obtener categorías de WP. Si falla o están vacías,
 * devuelve el ESQUEMA MAESTRO para asegurar una buena UX.
 */
export const fetchForumCategories = async (): Promise<ForumCategory[]> => {
  try {
    const response = await fetch(`${WP_API_BASE}/categories?hide_empty=false&per_page=20`);

    if (!response.ok) {
      console.error("Forum API unavailable", response.status);
      return [];
    }

    const data = await response.json();

    return data.map((item: any) => ({
      id: String(item.id),
      title: item.name,
      description: item.description || 'Espacio de discusión',
      icon: getIconForForum(item.slug, item.id),
      topicCount: item.count || 0
    }));
  } catch (error) {
    console.error("Error fetching forum categories:", error);
    return [];
  }
};

/**
 * 2. OBTENER TEMAS (Posts de WP)
 * Filtramos los posts por la categoría seleccionada.
 */
export const fetchTopics = async (categoryId: string): Promise<ForumTopic[]> => {
  try {
    const response = await fetch(`${WP_API_BASE}/posts?categories=${categoryId}&_embed&per_page=20&_t=${new Date().getTime()}`);

    if (!response.ok) {
      console.error('Failed to fetch topics:', response.status);
      return [];
    }

    const data = await response.json();

    return data.map((item: any) => ({
      id: item.id,
      categoryId: categoryId,
      title: item.title.rendered,
      author: item._embedded?.author?.[0]?.name || 'Piloto Anónimo',
      authorId: item.author,
      authorAvatar: item._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
      date: new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      views: 0,
      replies: 0,
      isPinned: item.sticky || false,
      content: item.content.rendered
    }));
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [];
  }
};

/**
 * 3. OBTENER RESPUESTAS
 */
export const fetchReplies = async (topicId: number): Promise<ForumReply[]> => {
  try {
    const postResponse = await fetch(`${WP_API_BASE}/posts/${topicId}?_embed&_t=${new Date().getTime()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const postData = postResponse.ok ? await postResponse.json() : null;

    const commentsResponse = await fetch(`${WP_API_BASE}/comments?post=${topicId}&order=asc&per_page=100&_t=${new Date().getTime()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const commentsData = commentsResponse.ok ? await commentsResponse.json() : [];

    const result: ForumReply[] = [];

    if (postData) {
      const opLikes = postData.meta?._likes ? JSON.parse(postData.meta._likes) : [];
      result.push({
        id: postData.id,
        topicId: postData.id,
        author: postData._embedded?.author?.[0]?.name || 'Autor Original',
        authorId: postData.author,
        authorAvatar: postData._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
        authorRole: 'OP',
        content: postData.content.rendered,
        date: new Date(postData.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        likes: opLikes.length,
        likedBy: opLikes
      });
    }

    const mappedComments = commentsData.map((comment: any) => {
      const commentLikes = comment.meta?._likes ? JSON.parse(comment.meta._likes) : [];
      return {
        id: comment.id,
        topicId: topicId,
        author: comment.author_name,
        authorId: comment.author || 0,
        authorAvatar: comment.author_avatar_urls?.['96'] || '',
        authorRole: 'Racer',
        content: comment.content.rendered,
        date: new Date(comment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        likes: commentLikes.length,
        likedBy: commentLikes
      };
    });

    return [...result, ...mappedComments];

  } catch (error) {
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

  // Simulación si estamos en modo Demo (ID categoría no numérica)
  if (isNaN(Number(categoryId))) {
    return new Promise(resolve => {
      setTimeout(() => resolve({ success: true, id: Math.floor(Math.random() * 1000) }), 800);
    });
  }

  try {
    const response = await fetch(`${WP_API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: title,
        content: body,
        categories: [parseInt(categoryId)],
        status: 'publish'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'rest_cannot_create') return { success: false, error: 'Sin permisos.' };
      throw new Error(data.message);
    }
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 5. CREAR RESPUESTA
 */
export const createReply = async (
  token: string,
  topicId: number,
  body: string
): Promise<{ success: boolean; id?: number; error?: string }> => {
  try {
    const response = await fetch(`${WP_API_BASE}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ post: topicId, content: body })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'rest_comment_login_required') return { success: false, error: 'Login requerido.' };
      throw new Error(data.message);
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 6. EDITAR TEMA
 */
export const updateTopic = async (token: string, topicId: number, title: string, content: string): Promise<boolean> => {
  try {
    const response = await fetch(`${WP_API_BASE}/posts/${topicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    return response.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 7. BORRAR TEMA
 */
export const deleteTopic = async (token: string, topicId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${WP_API_BASE}/posts/${topicId}?force=true`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 8. EDITAR RESPUESTA
 */
export const updateReply = async (token: string, replyId: number, content: string): Promise<boolean> => {
  try {
    const response = await fetch(`${WP_API_BASE}/comments/${replyId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
    return response.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 9. BORRAR RESPUESTA
 */
export const deleteReply = async (token: string, replyId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${WP_API_BASE}/comments/${replyId}?force=true`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// --- MOCK DATA GENERATOR FOR DEMO ---
const getMockTopics = (catId: string): ForumTopic[] => {
  const common = { author: 'Marc M.', authorId: 9999, date: 'Hoy', views: 120, replies: 5, authorAvatar: '', isPinned: false, likes: 0, likedBy: [] };

  if (catId === 'start_zone') return [
    { ...common, id: 501, categoryId: catId, title: 'Bienvenidos a la Línea de Salida', content: 'Normas de la comunidad y presentaciones.', isPinned: true },
    { ...common, id: 502, categoryId: catId, title: 'Me presento desde Madrid', content: 'Hola a todos, acabo de adquirir una Z900...' }
  ];

  if (catId === 'mechanic') return [
    { ...common, id: 101, categoryId: catId, title: '¿Par de apriete colectores MT-09?', content: 'Hola, alguien tiene el manual de taller...', isPinned: true },
    { ...common, id: 102, categoryId: catId, title: 'Ruido metálico al reducir en S1000RR', content: 'Suena como una lata...' }
  ];

  if (catId === 'brands') return [
    { ...common, id: 601, categoryId: catId, title: '[Yamaha] Hilo Oficial MT-09 2024', content: 'Opiniones, configs y experiencias.', isPinned: true },
    { ...common, id: 602, categoryId: catId, title: '[Ducati] Problema con el quickshifter', content: 'A veces no entra la tercera...' }
  ];

  if (catId === 'gear') return [
    { ...common, id: 701, categoryId: catId, title: 'Review: Casco AGV Pista GP RR', content: 'Vale cada euro...', isPinned: true },
    { ...common, id: 702, categoryId: catId, title: '¿Mejores guantes para invierno?', content: 'Busco tacto pero que no se congelen las manos.' }
  ];

  if (catId === 'routes') return [
    { ...common, id: 801, categoryId: catId, title: 'Ruta Pirineos - Junio 2025', content: 'Estamos organizando grupo...', isPinned: true },
    { ...common, id: 802, categoryId: catId, title: 'Tandas en Cheste', content: '¿Alguien va el próximo finde?' }
  ];

  return [
    { ...common, id: 999, categoryId: catId, title: 'Bienvenido al foro', content: 'Participa con respeto.', isPinned: true }
  ];
};

// =====================
// LIKE SYSTEM
// =====================

/**
 * Toggle like on a topic or reply
 */
export const toggleLike = async (
  type: 'topic' | 'reply',
  id: number,
  userId: number,
  token: string
): Promise<{ success: boolean; liked: boolean; likeCount: number }> => {
  try {
    // Ensure token has Bearer prefix
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const response = await fetch('/api/forum/toggle-like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, userId, token: authToken })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error toggling like');
    }

    return {
      success: true,
      liked: data.liked,
      likeCount: data.likeCount
    };
  } catch (error) {
    console.error('[LIKE] Error:', error);
    return { success: false, liked: false, likeCount: 0 };
  }
};

/**
 * Award XP to a user
 */
export const awardXP = async (
  userId: number,
  actionType: 'CREATE_TOPIC' | 'CREATE_REPLY',
  token: string
): Promise<void> => {
  try {
    // Ensure token has Bearer prefix
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    await fetch('/api/forum/award-xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actionType, token: authToken })
    });
  } catch (error) {
    console.error('[XP] Error awarding XP:', error);
  }
};

