import { WOO_CONFIG } from '../storeData';
import { ForumCategory, ForumTopic, ForumReply } from '../types';
import { MessageSquare, Wrench, Flame, HelpCircle, Trophy, Info } from 'lucide-react';

// BASE URL NATIVA DE WORDPRESS
const WP_API_BASE = WOO_CONFIG.baseUrl.replace(/\/$/, "") + '/wp-json/wp/v2';

// Helper de autenticación simple por URL (Evita problemas de CORS con headers complejos en hostings compartidos)
const getAuthParams = () => {
  return `?consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;
};

// Asignación visual de iconos según el nombre de la categoría
const getIconForForum = (slug: string = '', id: string | number) => {
  const s = slug.toLowerCase();
  if (s.includes('taller') || s.includes('tecnica') || s.includes('mecanic')) return Wrench;
  if (s.includes('racing') || s.includes('circuito')) return Flame;
  if (s.includes('competi') || s.includes('campeonato')) return Trophy;
  if (s.includes('ayuda') || s.includes('soporte')) return HelpCircle;
  if (s.includes('general') || s.includes('charla')) return MessageSquare;
  return Info;
};

/**
 * 1. OBTENER FOROS (Categorías de WP)
 * Usamos las categorías estándar de WP. Para diferenciar las del blog de las del foro,
 * podrías filtrar por un 'parent' ID específico si tuvieras una categoría padre "Foro".
 * Aquí traemos todas las que no estén vacías.
 */
export const fetchForumCategories = async (): Promise<ForumCategory[]> => {
  try {
    // hide_empty=true para no mostrar categorías sin temas
    const response = await fetch(`${WP_API_BASE}/categories?hide_empty=false&per_page=20`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      id: String(item.id),
      title: item.name,
      description: item.description || 'Espacio de discusión',
      icon: getIconForForum(item.slug, item.id),
      topicCount: item.count || 0
    }));
  } catch (error) {
    console.error("Native Forum API Error (Categories):", error);
    return [];
  }
};

/**
 * 2. OBTENER TEMAS (Posts de WP)
 * Filtramos los posts por la categoría seleccionada.
 * Usamos '_embed' para traer datos del autor e imagen destacada en una sola llamada.
 */
export const fetchTopics = async (categoryId: string): Promise<ForumTopic[]> => {
  try {
    const response = await fetch(`${WP_API_BASE}/posts?categories=${categoryId}&_embed&per_page=20`);
    if (!response.ok) throw new Error('Failed to fetch topics');
    
    const data = await response.json();

    return data.map((item: any) => ({
      id: item.id,
      categoryId: categoryId,
      title: item.title.rendered,
      // Intentamos obtener el nombre del autor desde _embedded, fallback a 'Anónimo'
      author: item._embedded?.author?.[0]?.name || 'Piloto Anónimo',
      authorAvatar: item._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
      date: new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      views: 0, // WP nativo no cuenta views por defecto
      replies: 0, // WP API list no devuelve conteo de comentarios fácil, se puede mejorar con campos custom
      isPinned: item.sticky || false,
      content: item.content.rendered // Guardamos el contenido para vista detalle
    }));
  } catch (error) {
    console.error("Native Forum API Error (Topics):", error);
    return [];
  }
};

/**
 * 3. OBTENER RESPUESTAS (Comentarios de WP)
 * Obtenemos los comentarios asociados al ID del Post (Tema).
 */
export const fetchReplies = async (topicId: number): Promise<ForumReply[]> => {
  try {
    // Traemos el post primero para usarlo como "Mensaje Original" (OP)
    const postResponse = await fetch(`${WP_API_BASE}/posts/${topicId}?_embed`);
    const postData = await postResponse.ok ? await postResponse.json() : null;

    // Traemos los comentarios
    const commentsResponse = await fetch(`${WP_API_BASE}/comments?post=${topicId}&order=asc&per_page=100`);
    const commentsData = await commentsResponse.ok ? await commentsResponse.json() : [];

    const result: ForumReply[] = [];

    // Añadimos el Post original como si fuera la primera entrada del hilo
    if (postData) {
      result.push({
        id: postData.id,
        topicId: postData.id,
        author: postData._embedded?.author?.[0]?.name || 'Autor Original',
        authorAvatar: postData._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
        authorRole: 'OP', // Original Poster
        content: postData.content.rendered,
        date: new Date(postData.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }),
        likes: 0
      });
    }

    // Mapeamos los comentarios
    const mappedComments = commentsData.map((comment: any) => ({
      id: comment.id,
      topicId: topicId,
      author: comment.author_name,
      authorAvatar: comment.author_avatar_urls?.['96'] || '',
      authorRole: 'Racer',
      content: comment.content.rendered,
      date: new Date(comment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }),
      likes: 0
    }));

    return [...result, ...mappedComments];

  } catch (error) {
    console.error("Native Forum API Error (Replies):", error);
    return [];
  }
};

/**
 * 4. CREAR TEMA (Crear Post en WP)
 * Requiere Token JWT.
 */
export const createTopic = async (
  token: string, 
  categoryId: string, 
  title: string, 
  body: string
): Promise<{ success: boolean; id?: number; error?: string }> => {
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
        categories: [parseInt(categoryId)], // Asigna la categoría seleccionada
        status: 'publish' // Publicar inmediatamente
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejo específico de errores WP
      if (data.code === 'rest_cannot_create') {
        throw new Error('No tienes permisos para crear temas. Contacta al admin.');
      }
      throw new Error(data.message || `Error ${response.status}: No se pudo crear el tema.`);
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 5. CREAR RESPUESTA (Crear Comentario en WP)
 * Requiere Token JWT.
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
      body: JSON.stringify({ 
        post: topicId, // ID del Post al que respondemos
        content: body 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'rest_comment_login_required') {
        throw new Error('Debes iniciar sesión para responder.');
      }
      if (data.code === 'rest_cannot_create') {
        throw new Error('Permisos insuficientes para responder en este tema.');
      }
      throw new Error(data.message || `Error ${response.status}: No se pudo publicar la respuesta.`);
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};