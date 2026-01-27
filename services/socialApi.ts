import { makeRequest } from './woocommerce';
import { User } from '../types';

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
        return data as SocialPostType[];
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
const MOCK_CATEGORIES: PaddockCategory[] = [
    { id: 101, title: 'Mecánica General', description: 'Dudas sobre mantenimiento, reparaciones y bricolaje.', count: 34, icon: 'wrench' },
    { id: 102, title: 'Circuitos y Tandas', description: 'Organización de rodadas, tiempos y consejos de pilotaje.', count: 12, icon: 'flag' },
    { id: 103, title: 'Rutas y Quedadas', description: 'Encuentra compañeros para salir de ruta el fin de semana.', count: 56, icon: 'map' },
    { id: 104, title: 'Compra-Venta', description: 'Mercadillo de piezas y motos entre particulares.', count: 8, icon: 'shopping-cart' }
];

const MOCK_THREADS: PaddockThread[] = [
    {
        id: 1, title: '¿Qué aceite recomiendan para una R1 2020?', content: 'Hola a todos, estoy por hacer el cambio de aceite...', author: { id: 10, name: 'Marc Márquez', avatar: '' },
        metrics: { views: 120, replies: 5, likes: 12 }, is_pinned: false, created_at: new Date().toISOString()
    },
    {
        id: 2, title: 'MEJORADA: Lista de circuitos en España', content: 'Aquí os dejo un recopilatorio de los mejores circuitos...', author: { id: 11, name: 'Admin', avatar: '' },
        metrics: { views: 500, replies: 25, likes: 80 }, is_pinned: true, created_at: new Date().toISOString()
    }
];

/**
 * PADDOCK: Obtener categorías
 */
export const fetchPaddockCategories = async (): Promise<PaddockCategory[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/paddock/categories`);

        // Doc returns { id, name, slug, count, description }
        // App expects { id, title, description, count, icon? }
        if (Array.isArray(data) && data.length > 0) {
            return data.map((cat: any) => ({
                id: cat.id,
                title: cat.name, // Map name -> title
                description: cat.description,
                count: cat.count,
                icon: undefined // Icon not provided by API
            }));
        }
        return MOCK_CATEGORIES;
    } catch (error) {
        console.warn('[PADDOCK] API failed, using MOCK data', error);
        return MOCK_CATEGORIES;
    }
};

/**
 * PADDOCK: Obtener hilos
 */
export const fetchPaddockThreads = async (categoryId: number, page: number = 1): Promise<PaddockThread[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/paddock/threads?category_id=${categoryId}&page=${page}`);

        // Doc returns { data: [...], has_more: boolean }
        if (data && Array.isArray(data.data)) {
            return data.data as PaddockThread[];
        }

        // Fallback for flat array if implementation differs from doc
        if (Array.isArray(data) && data.length > 0) return data as PaddockThread[];

        return MOCK_THREADS;
    } catch (error) {
        console.warn('[PADDOCK] API failed, using MOCK data', error);
        return MOCK_THREADS;
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
        const { data } = await makeRequest(`${API_BASE}/paddock/thread/create`, {
            method: 'POST',
            body: JSON.stringify({ category_id: categoryId, title, content }),
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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
        const { data } = await makeRequest(`${API_BASE}/paddock/thread/${threadId}`);
        return data as { thread: PaddockThread; replies: any[] };
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
        await makeRequest(`${API_BASE}/paddock/thread/${threadId}`, {
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
    targetType: 'social_post' | 'paddock_thread',
    targetId: number
): Promise<{ success: boolean; liked: boolean }> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/like`, {
            method: 'POST',
            body: JSON.stringify({ target_type: targetType, target_id: targetId }),
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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
        const { data } = await makeRequest(`${API_BASE}/reply`, {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, content }),
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const { data } = await makeRequest(`${API_BASE}/user/${userId}/full-profile`, { headers });
        return data as UserProfileFull;
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

export const searchUsers = async (query: string): Promise<{ id: number; name: string; avatar: string }[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
        return data; // Assuming straight array return
    } catch (error) {
        return [];
    }
};
