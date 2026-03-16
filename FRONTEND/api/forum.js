// Consolidated Forum API Handler
const RANKS = [
    { level: 1, title: 'Novato', xpRequired: 0, color: '#71717a', icon: '🏍️' },
    { level: 2, title: 'Aprendiz', xpRequired: 50, color: '#22c55e', icon: '⚡' },
    { level: 3, title: 'Piloto', xpRequired: 150, color: '#3b82f6', icon: '🏁' },
    { level: 4, title: 'Experto', xpRequired: 300, color: '#a855f7', icon: '🔥' },
    { level: 5, title: 'Profesional', xpRequired: 500, color: '#f97316', icon: '💨' },
    { level: 6, title: 'Leyenda', xpRequired: 1000, color: '#eab308', icon: '👑' }
];

const XP_REWARDS = {
    CREATE_TOPIC: 10,
    CREATE_REPLY: 5,
    RECEIVE_LIKE_TOPIC: 3,
    RECEIVE_LIKE_REPLY: 2,
    GIVE_LIKE: 1
};

function calculateRank(xp) {
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
    return { level: 1, title: RANKS[0].title, color: RANKS[0].color, icon: RANKS[0].icon, xp: 0, xpToNext: RANKS[1].xpRequired };
}

const WOO_URL = process.env.WOO_BASE_URL || 'https://backendescapes.com';
const WOO_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET;
const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
const headers = { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' };

async function getRank(req, res) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    try {
        const response = await fetch(`${WOO_URL}/wp-json/wc/v3/customers/${userId}`, { headers });
        if (!response.ok) return res.status(200).json(calculateRank(0));
        const userData = await response.json();
        const xp = parseInt(userData.meta_data?.find(m => m.key === '_forum_xp')?.value || '0');
        return res.status(200).json(calculateRank(xp));
    } catch (e) { return res.status(200).json(calculateRank(0)); }
}

async function awardXP(req, res) {
    const { userId, actionType, token } = req.body;
    if (!userId || !actionType || !token) return res.status(400).json({ message: 'Missing fields' });
    const xpAmount = XP_REWARDS[actionType] || 0;
    try {
        const userRes = await fetch(`${WOO_URL}/wp-json/wc/v3/customers/${userId}`, { headers });
        const userData = await userRes.json();
        const currentXP = parseInt(userData.meta_data?.find(m => m.key === '_forum_xp')?.value || '0');
        const newXP = currentXP + xpAmount;
        const newRank = calculateRank(newXP);
        await fetch(`${WOO_URL}/wp-json/wc/v3/customers/${userId}`, {
            method: 'PUT', headers,
            body: JSON.stringify({ meta_data: [{ key: '_forum_xp', value: newXP.toString() }, { key: '_forum_level', value: newRank.level.toString() }] })
        });
        return res.status(200).json({ success: true, xp: newXP, xpAwarded: xpAmount, rank: newRank });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

async function toggleLike(req, res) {
    const { type, id, userId, token } = req.body;
    const endpoint = type === 'topic' ? `${WOO_URL}/wp-json/wp/v2/posts/${id}` : `${WOO_URL}/wp-json/wp/v2/comments/${id}`;
    try {
        const response = await fetch(endpoint, { headers });
        const content = await response.json();
        let currentLikes = [];
        if (content.meta && content.meta._likes) {
            currentLikes = typeof content.meta._likes === 'string' ? JSON.parse(content.meta._likes) : content.meta._likes;
        }
        const isLiked = currentLikes.includes(userId);
        const newLikes = isLiked ? currentLikes.filter(lid => lid !== userId) : [...currentLikes, userId];
        await fetch(endpoint, {
            method: 'PUT', headers,
            body: JSON.stringify({ meta: { _likes: JSON.stringify(newLikes), _like_count: newLikes.length } })
        });
        if (!isLiked) {
            const apiBase = `https://${req.headers.host}`;
            await fetch(`${apiBase}/api/forum?action=award-xp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, actionType: 'GIVE_LIKE', token })
            });
        }
        return res.status(200).json({ success: true, liked: !isLiked, likeCount: newLikes.length, likedBy: newLikes });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const action = req.query.action || req.url?.split('/').pop()?.split('?')[0];

    if (req.method === 'GET') {
        if (action === 'get-user-rank') return getRank(req, res);
    } else if (req.method === 'POST') {
        if (action === 'award-xp') return awardXP(req, res);
        if (action === 'toggle-like') return toggleLike(req, res);
    }
    return res.status(400).json({ message: 'Invalid action' });
}
