/**
 * Toggle like on a forum topic or reply
 * Awards XP to both liker and content author
 */
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { type, id, userId, token } = req.body;

        console.log('[LIKE] Request:', { type, id, userId, hasToken: !!token });

        if (!type || !id || !userId || !token) {
            console.error('[LIKE] Missing fields');
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['topic', 'reply'].includes(type)) {
            console.error('[LIKE] Invalid type:', type);
            return res.status(400).json({ message: 'Invalid type. Must be "topic" or "reply"' });
        }

        // Validate token
        if (!token.startsWith('Bearer ')) {
            console.error('[LIKE] Invalid token format');
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const WOO_URL = process.env.WOO_BASE_URL || 'https://backendescapes.com';
        const WOO_KEY = process.env.WOO_CONSUMER_KEY;
        const WOO_SECRET = process.env.WOO_CONSUMER_SECRET;

        if (!WOO_KEY || !WOO_SECRET) {
            console.error('[LIKE] Missing WooCommerce credentials');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Missing credentials'
            });
        }

        console.log('[LIKE] Using URL:', WOO_URL);

        const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
        const headers = {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        };

        // Determine WordPress endpoint
        const endpoint = type === 'topic'
            ? `${WOO_URL}/wp-json/wp/v2/posts/${id}`
            : `${WOO_URL}/wp-json/wp/v2/comments/${id}`;

        console.log('[LIKE] Fetching from:', endpoint);

        // Fetch current content
        const response = await fetch(endpoint, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[LIKE] Failed to fetch content:', response.status, errorText);
            throw new Error(`Failed to fetch content: ${response.status}`);
        }

        const content = await response.json();
        console.log('[LIKE] Content fetched, ID:', content.id);

        // Parse existing likes (handle both string and already-parsed array)
        let currentLikes = [];
        if (content.meta && content.meta._likes) {
            try {
                currentLikes = typeof content.meta._likes === 'string'
                    ? JSON.parse(content.meta._likes)
                    : content.meta._likes;
                console.log('[LIKE] Current likes:', currentLikes);
            } catch (e) {
                console.warn('[LIKE] Failed to parse likes, using empty array:', e);
                currentLikes = [];
            }
        }

        const authorId = type === 'topic' ? content.author : (content.author_id || content.author);
        console.log('[LIKE] Author ID:', authorId);

        // Toggle like
        const isLiked = currentLikes.includes(userId);
        let newLikes;

        if (isLiked) {
            // Unlike
            newLikes = currentLikes.filter(id => id !== userId);
            console.log('[LIKE] Unliking. New count:', newLikes.length);
        } else {
            // Like
            newLikes = [...currentLikes, userId];
            console.log('[LIKE] Liking. New count:', newLikes.length);
        }

        // Update content with new likes
        console.log('[LIKE] Updating likes...');
        const updateResponse = await fetch(endpoint, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                meta: {
                    _likes: JSON.stringify(newLikes),
                    _like_count: newLikes.length
                }
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('[LIKE] Failed to update:', updateResponse.status, errorText);
            throw new Error(`Failed to update: ${updateResponse.status}`);
        }

        console.log('[LIKE] ✓ Likes updated successfully');

        // Award XP only on new likes (not unlikes)
        if (!isLiked) {
            const apiBase = req.headers.host ? `https://${req.headers.host}` : 'https://www.escapesymas.com';
            console.log('[LIKE] Awarding XP via:', apiBase);

            try {
                // Award XP to liker (+1 for engagement)
                await fetch(`${apiBase}/api/forum/award-xp`, {
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
                    await fetch(`${apiBase}/api/forum/award-xp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: authorId,
                            actionType: type === 'topic' ? 'RECEIVE_LIKE_TOPIC' : 'RECEIVE_LIKE_REPLY',
                            token: token
                        })
                    });
                }
                console.log('[LIKE] ✓ XP awarded');
            } catch (xpError) {
                console.warn('[LIKE] Failed to award XP (non-critical):', xpError.message);
                // Don't fail the whole request if XP fails
            }
        }

        console.log('[LIKE] ✓ Complete. User', userId, isLiked ? 'unliked' : 'liked', type, id);

        return res.status(200).json({
            success: true,
            liked: !isLiked,
            likeCount: newLikes.length,
            likedBy: newLikes
        });

    } catch (error) {
        console.error('[LIKE] Error:', error.message);
        console.error('[LIKE] Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar like: ' + error.message
        });
    }
}
