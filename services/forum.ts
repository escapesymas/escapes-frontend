import { WOO_CONFIG } from '../storeData';
import { ForumCategory, ForumTopic, ForumReply } from '../types';
import { MessageSquare, Wrench, Gauge, Compass, Headphones, Aperture } from 'lucide-react';

// BASE URL NATIVA DE WORDPRESS
const WP_API_BASE = WOO_CONFIG.baseUrl.replace(/\/$/, "") + '/wp-json/wp/v2';

/**
 * ESQUEMA MAESTRO DEL FORO (Fallback & Structure)
 * Estas son las categorías ideales para organizar la comunidad.
 */
const FORUM_SCHEMA: ForumCategory[] = [
  {
    id: 'mechanic',
    title: 'Mecánica y Taller',
    description: 'Dudas técnicas, montajes, reparaciones y mantenimiento.',
    icon: Wrench,
    topicCount: 15
  },
  {
    id: 'showroom',
    title: 'Showroom & Sound',
    description: 'Enseña tu máquina. Fotos, videos de escapes y modificaciones.',
    icon: Aperture,
    topicCount: 42
  },
  {
    id: 'racing',
    title: 'Racing & Circuito',
    description: 'Tiempos, técnicas de pilotaje, tandas y competición.',
    icon: Gauge,
    topicCount: 8
  },
  {
    id: 'community',
    title: 'Rutas y Paddock',
    description: 'Quedadas, viajes, experiencias y charla general.',
    icon: Compass,
    topicCount: 23
  },
  {
    id: 'support',
    title: 'Soporte Tienda',
    description: 'Ayuda con pedidos, devoluciones y preguntas preventa.',
    icon: Headphones,
    topicCount: 5
  }
];

// Mapeo avanzado de iconos por si vienen de WP real
const getIconForForum = (slug: string = '', id: string | number) => {
  const s = slug.toLowerCase();
  if (s.includes('taller') || s.includes('mecanic') || s.includes('tecni')) return Wrench;
  if (s.includes('racing') || s.includes('circuito') || s.includes('competi')) return Gauge;
  if (s.includes('foto') || s.includes('video') || s.includes('show')) return Aperture;
  if (s.includes('ruta') || s.includes('quedada') || s.includes('viaje')) return Compass;
  if (s.includes('soporte') || s.includes('ayuda') || s.includes('tienda')) return Headphones;
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
       console.warn("Forum API unavailable, loading Schema.");
       return FORUM_SCHEMA;
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
       return FORUM_SCHEMA;
    }
    
    return data.map((item: any) => ({
      id: String(item.id),
      title: item.name,
      description: item.description || 'Espacio de discusión',
      icon: getIconForForum(item.slug, item.id),
      topicCount: item.count || 0
    }));
  } catch (error) {
    console.error("Using Fallback Schema due to error:", error);
    return FORUM_SCHEMA;
  }
};

/**
 * 2. OBTENER TEMAS (Posts de WP)
 * Filtramos los posts por la categoría seleccionada.
 */
export const fetchTopics = async (categoryId: string): Promise<ForumTopic[]> => {
  try {
    // Si la categoría es del esquema estático (string) y no numérico, devolvemos mock data para demo
    // ya que WP necesita IDs numéricos.
    if (isNaN(Number(categoryId))) {
       return getMockTopics(categoryId);
    }

    const response = await fetch(`${WP_API_BASE}/posts?categories=${categoryId}&_embed&per_page=20`);
    if (!response.ok) throw new Error('Failed to fetch topics');
    
    const data = await response.json();

    return data.map((item: any) => ({
      id: item.id,
      categoryId: categoryId,
      title: item.title.rendered,
      author: item._embedded?.author?.[0]?.name || 'Piloto Anónimo',
      authorAvatar: item._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
      date: new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      views: 0, 
      replies: 0,
      isPinned: item.sticky || false,
      content: item.content.rendered 
    }));
  } catch (error) {
    console.warn("Native Forum API Error (Topics), returning mocks for demo.");
    return getMockTopics(categoryId);
  }
};

/**
 * 3. OBTENER RESPUESTAS
 */
export const fetchReplies = async (topicId: number): Promise<ForumReply[]> => {
  try {
    const postResponse = await fetch(`${WP_API_BASE}/posts/${topicId}?_embed`);
    const postData = postResponse.ok ? await postResponse.json() : null;

    const commentsResponse = await fetch(`${WP_API_BASE}/comments?post=${topicId}&order=asc&per_page=100`);
    const commentsData = commentsResponse.ok ? await commentsResponse.json() : [];

    const result: ForumReply[] = [];

    if (postData) {
      result.push({
        id: postData.id,
        topicId: postData.id,
        author: postData._embedded?.author?.[0]?.name || 'Autor Original',
        authorAvatar: postData._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
        authorRole: 'OP',
        content: postData.content.rendered,
        date: new Date(postData.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }),
        likes: 0
      });
    }

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

// --- MOCK DATA GENERATOR FOR DEMO ---
const getMockTopics = (catId: string): ForumTopic[] => {
  const common = { author: 'Marc M.', date: 'Hoy', views: 120, replies: 5, authorAvatar: '', isPinned: false };
  
  if (catId === 'mechanic') return [
    { ...common, id: 101, categoryId: catId, title: '¿Par de apriete colectores MT-09?', content: 'Hola, alguien tiene el manual de taller...', isPinned: true },
    { ...common, id: 102, categoryId: catId, title: 'Ruido metálico al reducir en S1000RR', content: 'Suena como una lata...' }
  ];
  if (catId === 'showroom') return [
    { ...common, id: 201, categoryId: catId, title: 'Mi Panigale V4 con línea completa Akrapovic', content: 'Os dejo unas fotos del montaje...', isPinned: true },
    { ...common, id: 202, categoryId: catId, title: 'Antes y después: Z900 Full Black', content: 'Vinilado completo...' }
  ];
  if (catId === 'racing') return [
    { ...common, id: 301, categoryId: catId, title: 'Tandas Motorland Abril', content: '¿Quién se apunta?', isPinned: true }
  ];
  return [
    { ...common, id: 999, categoryId: catId, title: 'Bienvenido al foro Escapes y Más', content: 'Preséntate aquí.', isPinned: true }
  ];
};