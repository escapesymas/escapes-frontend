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
export const fetchPaddockCategories = async (): Promise<PaddockCategory[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/paddock/categories`);
        return data as PaddockCategory[];
    } catch (error) {
        console.error('[PADDOCK] Error fetching categories:', error);
        return [];
    }
};

/**
 * PADDOCK: Obtener hilos
 */
export const fetchPaddockThreads = async (categoryId: number, page: number = 1): Promise<PaddockThread[]> => {
    try {
        const { data } = await makeRequest(`${API_BASE}/paddock/threads?category_id=${categoryId}&page=${page}`);
        return data as PaddockThread[];
    } catch (error) {
        console.error('[PADDOCK] Error fetching threads:', error);
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
        const { data } = await makeRequest(`${API_BASE}/friends/manage`, {
            method: 'POST',
            body: JSON.stringify({ action, target_id: targetId }),
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
