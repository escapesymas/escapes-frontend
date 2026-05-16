import { db } from '../lib/db.js';
import { forumPosts, forumReplies, forumLikes, users } from '../lib/schema.js';
import { eq, desc, sql, and } from 'drizzle-orm';

// Configuración de Rangos y XP
const RANKS = [
    { level: 1, title: 'Novato', xpRequired: 0, color: '#71717a', icon: '🏍️' },
    { level: 2, title: 'Aprendiz', xpRequired: 50, color: '#22c55e', icon: '⚡' },
    { level: 3, title: 'Piloto', xpRequired: 150, color: '#3b82f6', icon: '🏁' },
    { level: 4, title: 'Experto', xpRequired: 300, color: '#a855f7', icon: '🔥' },
    { level: 5, title: 'Profesional', xpRequired: 500, color: '#f97316', icon: '💨' },
    { level: 6, title: 'Leyenda', xpRequired: 1000, color: '#eab308', icon: '👑' }
];

const XP_REWARDS = {
    CREATE_POST: 15,
    CREATE_REPLY: 10,
    RECEIVE_LIKE: 5,
    GIVE_LIKE: 1
};

function calculateRank(xp: number) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].xpRequired) {
            return RANKS[i];
        }
    }
    return RANKS[0];
}

export default async function handler(req: any, res: any) {
    const { action, category_id, thread_id } = req.query;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        switch (action) {
            case 'categories':
                return res.status(200).json([
                    { id: 1, title: '🔧 Mecánica y Taller', description: 'Consultas técnicas, bricos y mantenimiento.', count: 0 },
                    { id: 2, title: '🏍️ Compra-Venta', description: 'Mercadillo entre moteros.', count: 0 },
                    { id: 3, title: '🗺️ Rutas y Quedadas', description: 'Planea tu próxima salida.', count: 0 },
                    { id: 4, title: '🏁 General Paddock', description: 'Charlas generales sobre el mundo de las dos ruedas.', count: 0 }
                ]);

            case 'threads':
                const threads = await db.select({
                    id: forumPosts.id,
                    title: forumPosts.title,
                    createdAt: forumPosts.createdAt,
                    likes: forumPosts.likes,
                    authorName: users.username,
                    authorAvatar: users.avatarUrl,
                })
                .from(forumPosts)
                .leftJoin(users, eq(forumPosts.userId, users.id))
                .where(category_id ? eq(forumPosts.category, category_id) : undefined)
                .orderBy(desc(forumPosts.createdAt));
                
                return res.status(200).json({ data: threads });

            case 'thread-detail':
                if (!thread_id) return res.status(400).json({ error: 'Falta thread_id' });
                
                const thread = await db.select().from(forumPosts).where(eq(forumPosts.id, parseInt(thread_id))).limit(1);
                const replies = await db.select({
                    id: forumReplies.id,
                    content: forumReplies.content,
                    createdAt: forumReplies.createdAt,
                    authorName: users.username,
                    authorAvatar: users.avatarUrl,
                    authorXP: users.rankXp
                })
                .from(forumReplies)
                .leftJoin(users, eq(forumReplies.userId, users.id))
                .where(eq(forumReplies.postId, parseInt(thread_id)))
                .orderBy(forumReplies.createdAt);

                return res.status(200).json({ 
                    thread: thread[0], 
                    replies: replies.map(r => ({
                        ...r,
                        authorRank: calculateRank(r.authorXP || 0)
                    })) 
                });

            case 'create-thread':
                if (req.method !== 'POST') return res.status(405).end();
                const { title, content, userId, category } = req.body;
                
                const [newPost] = await db.insert(forumPosts).values({
                    userId,
                    title,
                    content,
                    category: category || 'general'
                }).returning();

                // Award XP
                await db.update(users)
                    .set({ rankXp: sql`${users.rankXp} + ${XP_REWARDS.CREATE_POST}` })
                    .where(eq(users.id, userId));

                return res.status(200).json({ success: true, id: newPost.id });

            case 'reply':
                if (req.method !== 'POST') return res.status(405).end();
                const { postId, replyUserId, replyContent } = req.body;

                await db.insert(forumReplies).values({
                    postId,
                    userId: replyUserId,
                    content: replyContent
                });

                // Award XP
                await db.update(users)
                    .set({ rankXp: sql`${users.rankXp} + ${XP_REWARDS.CREATE_REPLY}` })
                    .where(eq(users.id, replyUserId));

                return res.status(200).json({ success: true });

            case 'toggle-like':
                if (req.method !== 'POST') return res.status(405).end();
                const { targetType, targetId, currentUserId } = req.body;

                // Check if already liked
                const existingLike = await db.select().from(forumLikes).where(
                    and(
                        eq(forumLikes.userId, currentUserId),
                        eq(forumLikes.contentType, targetType),
                        eq(forumLikes.contentId, targetId)
                    )
                ).limit(1);

                if (existingLike.length > 0) {
                    // Unlike
                    await db.delete(forumLikes).where(eq(forumLikes.id, existingLike[0].id));
                    
                    // Decrement counter
                    if (targetType === 'post') {
                        await db.update(forumPosts).set({ likes: sql`${forumPosts.likes} - 1` }).where(eq(forumPosts.id, targetId));
                    }
                    return res.status(200).json({ success: true, liked: false });
                } else {
                    // Like
                    await db.insert(forumLikes).values({
                        userId: currentUserId,
                        contentType: targetType,
                        contentId: targetId
                    });

                    // Increment counter
                    if (targetType === 'post') {
                        await db.update(forumPosts).set({ likes: sql`${forumPosts.likes} + 1` }).where(eq(forumPosts.id, targetId));
                    }

                    // Award XP to giver and receiver
                    await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP_REWARDS.GIVE_LIKE}` }).where(eq(users.id, currentUserId));
                    
                    // Encontrar autor para darle XP
                    let authorId;
                    if (targetType === 'post') {
                        const p = await db.select().from(forumPosts).where(eq(forumPosts.id, targetId)).limit(1);
                        authorId = p[0]?.userId;
                    }

                    if (authorId && authorId !== currentUserId) {
                        await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP_REWARDS.RECEIVE_LIKE}` }).where(eq(users.id, authorId));
                    }

                    return res.status(200).json({ success: true, liked: true });
                }

            default:
                return res.status(400).json({ error: 'Acción no reconocida' });
        }
    } catch (error: any) {
        console.error('[FORUM API]:', error);
        return res.status(500).json({ error: error.message });
    }
}
