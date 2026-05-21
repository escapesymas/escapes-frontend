import { makeRequest } from './woocommerce';
import { User } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';

const BACKEND_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : 'https://backendescapes.com';

// Helper to proxy URLs from backendescapes.com
const proxyUrl = (url: string) => {
    if (!url || !url.startsWith('https://backendescapes.com/')) return url;
    return optimizeImage(url);
};

// Helper to proxy images inside HTML content
const proxyHtml = (html: string) => {
    if (!html) return '';
    // Replace all backend escapes images with proxied versions
    return html.replace(
        /src="https:\/\/backendescapes\.com\/([^"]+)"/g,
        (match, path) => `src="/api/proxy?media=${path}"`
    );
};

// Tipos para la API Social
export interface SocialPostType {
    id: number;
    author: {
        id: number;
        name: string;
        avatar: string;
        rank?: any;
        timeAgo: string;
    };
    content: {
        text: string;
        media?: string[]; // URLs de imágenes
    };
    metrics: {
        likes: number;
        comments: number;
        liked: boolean;
    };
    created_at: string;
}

export interface PaddockCategory {
    id: number;
    title: string;
    description: string;
    icon?: string;
    count: number;
    parent?: number;
    children?: PaddockCategory[];
}

export interface PaddockThread {
    id: number;
    title: string;
    content: string;
    author: {
        id: number;
        name: string;
        avatar: string;
    };
    metrics: {
        views: number;
        replies: number;
        likes: number;
    };
    is_pinned: boolean;
    created_at: string;
}

// Prefijo base de la API (relativo a /wp-json, que ya lo pone makeRequest)
const API_BASE = '/paddock/v1';

/**
 * SOCIAL FEED: Obtener muro
 */
export const fetchSocialFeed = async (page: number = 1): Promise<SocialPostType[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/feed?page=${page}`);

        // Backend returns { data: [...], has_more: boolean }
        const posts = Array.isArray(data) ? data : (data?.data || []);
        if (!Array.isArray(posts)) return [];

        // Map backend fields to frontend SocialPostType interface
        return posts.map((p: any) => ({
            id: p.id,
            author: {
                id: p.author?.id || 0,
                name: p.author?.name || 'Anónimo',
                avatar: proxyUrl(p.author?.avatar || ''),
                rank: p.author?.rank || null,
                timeAgo: p.date || p.created_at || ''
            },
            content: {
                text: proxyHtml(p.content || ''),
                media: (p.media || []).map(proxyUrl)
            },
            metrics: {
                likes: p.likes_count || 0,
                comments: p.comments_count || 0,
                liked: p.is_liked || false
            },
            created_at: p.date || p.created_at || ''
        }));
    } catch (error) {
        console.error('[SOCIAL] Error fetching feed:', error);
        return [];
    }
};

/**
 * SOCIAL FEED: Crear post
 */
export const createSocialPost = async (
    token: string,
    content: string,
    mediaIds: number[] = []
): Promise<{ success: boolean; post?: SocialPostType; error?: string }> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/feed/create`, {
            method: 'POST',
            body: JSON.stringify({ content, media_ids: mediaIds }),
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return { success: true, post: data };
    } catch (error: any) {
        console.error('[SOCIAL] Error creating post:', error);
        return { success: false, error: error.message || 'Error al publicar' };
    }
};

/**
 * PADDOCK: Obtener categorías
 */
/**
 * PADDOCK: Obtener categorías
 */
// --- CONFIGURACIÓN UI CATEGORÍAS (Mapeo por ID o Título aprox) ---
const UI_CATEGORY_CONFIG: Record<string, Partial<PaddockCategory>> = {
    'general': { icon: 'message-square', id: 0 }, // Changed from 101 to 0 to match uncategorized threads
    'mecanica': { icon: 'wrench', id: 102 },
    'compraventa': { icon: 'bike', id: 103 },
    'rutas': { icon: 'compass', id: 104 }
};

export const SPAIN_PROVINCES = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", "Cáceres",
    "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara",
    "Guipúzcoa", "Huelva", "Huesca", "Illes Balears", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León",
    "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
    "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
    "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
].sort();

const buildPaddockTree = (flatList: any[], parentId: number = 0): PaddockCategory[] => {
    const tree: PaddockCategory[] = [];
    
    flatList.forEach(cat => {
        if ((cat.parent || 0) === parentId) {
            const children = buildPaddockTree(flatList, cat.id);
            
            // UI Config mapping
            const titleLower = cat.name.toLowerCase();
            let config = UI_CATEGORY_CONFIG['general'];
            if (titleLower.includes('mecanica') || titleLower.includes('taller')) config = UI_CATEGORY_CONFIG['mecanica'];
            else if (titleLower.includes('venta') || titleLower.includes('motos')) config = UI_CATEGORY_CONFIG['compraventa'];
            else if (titleLower.includes('ruta') || titleLower.includes('quedada')) config = UI_CATEGORY_CONFIG['rutas'];

            tree.push({
                id: cat.id,
                title: cat.name,
                description: cat.description || 'Espacio de discusión',
                count: cat.count || 0,
                icon: config!.icon,
                parent: cat.parent,
                children: children.length > 0 ? children : undefined
            });
        }
    });

    return tree;
};

export const fetchPaddockCategories = async (): Promise<PaddockCategory[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/forum?action=categories`);
        if (!response.ok) throw new Error('Error al obtener categorías');
        return await response.json();
    } catch (error) {
        console.error('[PADDOCK] API failed', error);
        return [
            { id: 1, title: '🔧 Mecánica y Taller', description: 'Consultas técnicas, bricos y mantenimiento.', count: 0 },
            { id: 4, title: '🏁 General Paddock', description: 'Charlas generales.', count: 0 }
        ];
    }
};

/**
 * PADDOCK: Obtener hilos
 */
export const fetchPaddockThreads = async (categoryId: number, page: number = 1): Promise<PaddockThread[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/forum?action=threads&category_id=${categoryId}&page=${page}`);
        if (!response.ok) throw new Error('Error al obtener hilos');
        const result = await response.json();
        
        return (result.data || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            content: t.content || '',
            author: {
                id: t.authorId || 0,
                name: t.authorName || 'Piloto',
                avatar: t.authorAvatar || ''
            },
            metrics: {
                views: t.viewCount || 0,
                replies: t.repliesCount || 0,
                likes: t.likes || 0
            },
            is_pinned: false,
            created_at: t.createdAt
        }));
    } catch (error) {
        console.warn('[PADDOCK] API failed', error);
        return [];
    }
};

/**
 * PADDOCK: Crear hilo
 */
export const createPaddockThread = async (
    token: string,
    categoryId: number,
    title: string,
    content: string
): Promise<{ success: boolean; id?: number; error?: string }> => {
    try {
        // Obtenemos el userId del token o del estado global (asumimos que el token es el JSON del usuario por ahora en tu sistema actual)
        const user = JSON.parse(atob(token.split('.')[1] || 'e30=')); // Fallback simple para pruebas
        
        const response = await fetch(`${BACKEND_URL}/api/forum?action=create-thread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, userId: user.id || 1, category: String(categoryId) })
        });
        const data = await response.json();
        return { success: true, id: data.id };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al crear hilo' };
    }
};

/**
 * PADDOCK: Obtener detalle de hilo y respuestas
 */
export const fetchPaddockThread = async (threadId: number): Promise<{ thread: PaddockThread; replies: any[] } | null> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/forum?action=thread-detail&thread_id=${threadId}`);
        if (!response.ok) throw new Error('Error al obtener detalle');
        const data = await response.json();
        
        return {
            thread: {
                ...data.thread,
                author: {
                    id: data.thread.userId,
                    name: data.thread.authorName || 'Piloto',
                    avatar: data.thread.authorAvatar || ''
                },
                metrics: {
                    views: data.thread.viewCount || 0,
                    replies: data.replies?.length || 0,
                    likes: data.thread.likes || 0
                }
            },
            replies: (data.replies || []).map((r: any) => ({
                id: r.id,
                content: r.content,
                author: r.authorName,
                authorAvatar: r.authorAvatar,
                authorRank: r.authorRank,
                date: new Date(r.createdAt).toLocaleDateString()
            }))
        };
    } catch (error) {
        console.error('[PADDOCK] Error fetching thread:', error);
        return null;
    }
};

/**
 * PADDOCK: Eliminar Hilo
 */
export const deletePaddockThread = async (token: string, threadId: number): Promise<{ success: boolean; error?: string }> => {
    try {
        await makeRequest(`${API_BASE}/thread/${threadId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al eliminar hilo' };
    }
};

/**
 * INTERACCIONES: Dar Like (toggle)
 */
export const toggleLike = async (
    token: string,
    targetType: 'post' | 'reply',
    targetId: number
): Promise<{ success: boolean; liked: boolean }> => {
    try {
        const user = JSON.parse(atob(token.split('.')[1] || 'e30='));
        const response = await fetch(`${BACKEND_URL}/api/forum?action=toggle-like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetType, targetId, currentUserId: user.id || 1 })
        });
        const data = await response.json();
        return { success: true, liked: data.liked };
    } catch (error) {
        return { success: false, liked: false };
    }
};

/**
 * INTERACCIONES: Responder / Comentar
 * Se usa tanto para posts del muro como hilos del foro (backend lo gestiona por ID)
 */
export const sendReply = async (
    token: string,
    postId: number,
    content: string
): Promise<{ success: boolean; comment?: any; error?: string }> => {
    try {
        const user = JSON.parse(atob(token.split('.')[1] || 'e30='));
        
        const response = await fetch(`${BACKEND_URL}/api/forum?action=reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, replyContent: content, replyUserId: user.id || 1 })
        });
        const data = await response.json();
        return { success: true, comment: data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al comentar' };
    }
};
/**
 * INTERACCIONES: Compartir Post (Share)
 */
export const sharePost = async (
    token: string,
    postId: number,
    platform: 'internal' | 'external' = 'internal'
): Promise<{ success: boolean; xpEarned?: number; error?: string }> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/share`, {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, platform }),
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return { success: true, xpEarned: data.xp_earned };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al compartir' };
    }
};

/**
 * GESTION: Eliminar Post
 */
export const deletePost = async (
    token: string,
    postId: number
): Promise<{ success: boolean; error?: string }> => {
    try {
        await makeRequest(`${API_BASE}/feed/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al eliminar' };
    }
};

// --- PERFIL Y AMIGOS ---

export interface UserProfileFull {
    id: number;
    name: string;
    avatar: string;
    cover: string;
    bio: string;
    rank: any;
    stats: {
        posts: number;
        friends: number;
        likes_received: number;
    };
    friendship_status: 'none' | 'pending' | 'accepted' | 'self';
    posts: SocialPostType[];
    friends: { id: number; name: string; avatar: string }[];
}

export const getUserProfile = async (
    token: string | null,
    userId: number
): Promise<UserProfileFull | null> => {
    try {
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
        const { data } = await makeRequest(`${API_BASE}/user/${userId}/full-profile`, { headers });
        if (!data) return null;

        return {
            ...data,
            avatar: proxyUrl(data.avatar || ''),
            cover: proxyUrl(data.cover || ''),
            posts: (data.posts || []).map((p: any) => ({
                ...p,
                author: { ...p.author, avatar: proxyUrl(p.author?.avatar || '') },
                content: { ...p.content, text: proxyHtml(p.content?.text || '') },
                media: (p.media || []).map(proxyUrl)
            }))
        } as UserProfileFull;
    } catch (error) {
        console.error('[PROFILE] Error fetching profile:', error);
        return null;
    }
};

export const manageFriendship = async (
    token: string,
    action: 'add' | 'accept' | 'reject' | 'remove',
    targetId: number
): Promise<{ success: boolean; status?: string; error?: string }> => {
    try {
        // Doc specifies /friends/request and action: 'send' for adding
        const apiAction = action === 'add' ? 'send' : action;

        const { data } = await makeRequest(`${API_BASE}/friends/request`, {
            method: 'POST',
            body: JSON.stringify({ action: apiAction, target_id: targetId }),
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return { success: true, status: data.status };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error en gestión de amistad' };
    }
};

export const searchUsers = async (query: string): Promise<{ id: number; name: string; avatar: string; rank?: any }[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
        return data;
    } catch (error) {
        return [];
    }
};

/**
 * SOCIAL: Obtener notificaciones
 */
export const fetchNotifications = async (token: string): Promise<any[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return data || [];
    } catch (error) {
        return [];
    }
};

/**
 * SOCIAL: Marcar notificaciones como leídas
 */
export const markNotificationsRead = async (token: string): Promise<boolean> => {
    try {
        await makeRequest(`${API_BASE}/notifications/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * SOCIAL: Toggle Follow
 */
export const toggleFollow = async (token: string, targetId: number): Promise<{ following: boolean }> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/follow`, {
            method: 'POST',
            body: JSON.stringify({ target_id: targetId }),
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return data;
    } catch (error) {
        return { following: false };
    }
};

/**
 * SOCIAL: Obtener Galería de Usuario
 */
export const fetchUserGallery = async (userId: number): Promise<any[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/user/${userId}/gallery`);
        return data || [];
    } catch (error) {
        return [];
    }
};
