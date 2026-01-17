/**
 * Toggle like on a forum topic or reply
 * Awards XP to both liker and content author
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { type, id, userId, token } = req.body;

    if (!type || !id || !userId || !token) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['topic', 'reply'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type. Must be "topic" or "reply"' });
    }

    // Validate token
    if (!token.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
        const WOO_URL = process.env.WOO_BASE_URL || 'https://backendescapes.com';
        const WOO_KEY = process.env.WOO_CONSUMER_KEY;
        const WOO_SECRET = process.env.WOO_CONSUMER_SECRET;

        const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
        const headers = {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        };

        // Determine WordPress endpoint
        const endpoint = type === 'topic'
            ? `${WOO_URL}/wp-json/wp/v2/posts/${id}`
            : `${WOO_URL}/wp-json/wp/v2/comments/${id}`;

        // Fetch current content
        const response = await fetch(endpoint, { headers });
        if (!response.ok) {
            throw new Error('Failed to fetch content');
        }

        const content = await response.json();
        const currentLikes = content.meta?._likes ? JSON.parse(content.meta._likes) : [];
        const authorId = type === 'topic' ? content.author : content.author_id;

        // Toggle like
        const isLiked = currentLikes.includes(userId);
        let newLikes;

        if (isLiked) {
            // Unlike
            newLikes = currentLikes.filter(id => id !== userId);
        } else {
            // Like
            newLikes = [...currentLikes, userId];
        }

        // Update content with new likes
        await fetch(endpoint, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                meta: {
                    _likes: JSON.stringify(newLikes),
                    _like_count: newLikes.length
                }
            })
        });

        // Award XP only on new likes (not unlikes)
        if (!isLiked) {
            // Award XP to liker (+1 for engagement)
            await fetch(`${req.headers.origin || 'http://localhost:5173'}/api/forum/award-xp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    actionType: 'GIVE_LIKE',
                    token: token
                })
            });

            // Award XP to author (+3 for topic, +2 for reply)
            if (authorId && authorId !== userId) {
                await fetch(`${req.headers.origin || 'http://localhost:5173'}/api/forum/award-xp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: authorId,
                        actionType: type === 'topic' ? 'RECEIVE_LIKE_TOPIC' : 'RECEIVE_LIKE_REPLY',
                        token: token
                    })
                });
            }
        }

        console.log(`[LIKE] User ${userId} ${isLiked ? 'unliked' : 'liked'} ${type} ${id}`);

        return res.status(200).json({
            success: true,
            liked: !isLiked,
            likeCount: newLikes.length,
            likedBy: newLikes
        });

    } catch (error) {
        console.error('[LIKE] Error toggling like:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar like: ' + error.message
        });
    }
}
