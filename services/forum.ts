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

/**
 * 1. OBTENER CATEGORÍAS
 * Se mappea la taxonomía 'paddock_category' a nuestro tipo ForumCategory
 */
export const fetchForumCategories = async (): Promise<ForumCategory[]> => {
  try {
    // Native WP Categories
    const { data } = await makeRequest('/wp/v2/categories?hide_empty=false&per_page=20');

    return (data as any[]).map(cat => ({
      id: String(cat.id),
      title: cat.name,
      description: cat.description || 'Espacio de discusión',
      icon: FORUM_ICONS['brands'] || MessageSquare, // Logic to pick icon based on slug/id could be improved here
      topicCount: cat.count || 0
    }));
  } catch (error) {
    console.error("Error fetching forum categories:", error);
    // Fallback if no categories exist yet
    return [];
  }
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
      likes: 0,
      likedBy: []
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
    // Fetch Topic (Post) content first
    const topicReq = await makeRequest(`/wp/v2/posts/${topicId}?_embed`);
    const topic = topicReq.data as any;

    if (!topic) return [];

    const result: ForumReply[] = [];

    // 1. Topic (OP)
    // We treat the post content as the first "reply" in the thread
    result.push({
      id: topic.id,
      topicId: topic.id,
      author: topic._embedded?.author?.[0]?.name || 'Autor Original',
      authorId: topic.author,
      authorAvatar: topic._embedded?.author?.[0]?.avatar_urls?.['96'] || '',
      authorRole: 'OP',
      content: topic.content.rendered,
      date: new Date(topic.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      likes: 0, // We need to fetch likes from Paddock API or stored meta
      likedBy: []
    });

    // 2. Comments (Replies) - Native WP Comments
    const commentsReq = await makeRequest(`/wp/v2/comments?post=${topicId}&order=asc&per_page=100`);
    const comments = commentsReq.data as any[];

    const mappedComments = comments.map(comment => ({
      id: comment.id,
      topicId: topicId,
      author: comment.author_name,
      authorId: comment.author || 0,
      authorAvatar: comment.author_avatar_urls?.['96'] || '',
      authorRole: 'Racer',
      content: comment.content.rendered,
      date: new Date(comment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      likes: 0,
      likedBy: []
    }));

    return [...result, ...mappedComments];

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
    // Return format matching what Forum.tsx expects
    return { success: true, liked: result.liked, likeCount: 0 };
  } catch (e) {
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
