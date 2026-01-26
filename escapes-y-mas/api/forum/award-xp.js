// Rank configuration
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

/**
 * Calculate user level based on XP
 */
function calculateLevel(xp) {
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
    return {
        level: 1,
        title: RANKS[0].title,
        color: RANKS[0].color,
        icon: RANKS[0].icon,
        xp: xp,
        xpToNext: RANKS[1].xpRequired - xp
    };
}

/**
 * Award XP to a user and update their level
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
        const { userId, actionType, token } = req.body;

        console.log('[XP] Request received:', { userId, actionType, hasToken: !!token });

        if (!userId || !actionType || !token) {
            console.error('[XP] Missing fields:', { userId: !!userId, actionType: !!actionType, token: !!token });
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate token
        if (!token.startsWith('Bearer ')) {
            console.error('[XP] Invalid token format');
            return res.status(401).json({ message: 'Invalid token format' });
        }

        // Determine XP to award
        const xpAmount = XP_REWARDS[actionType] || 0;
        if (xpAmount === 0) {
            console.error('[XP] Invalid action type:', actionType);
            return res.status(400).json({ message: 'Invalid action type' });
        }

        console.log('[XP] Awarding', xpAmount, 'XP for', actionType);

        // Check if environment variables are set
        const WOO_URL = process.env.WOO_BASE_URL || 'https://backendescapes.com';
        const WOO_KEY = process.env.WOO_CONSUMER_KEY;
        const WOO_SECRET = process.env.WOO_CONSUMER_SECRET;

        if (!WOO_KEY || !WOO_SECRET) {
            console.error('[XP] Missing WooCommerce credentials');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Missing WooCommerce credentials'
            });
        }

        console.log('[XP] Using WooCommerce URL:', WOO_URL);

        const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');

        // Get current user data
        console.log('[XP] Fetching user data for ID:', userId);
        const userResponse = await fetch(`${WOO_URL}/wp-json/wc/v3/customers/${userId}`, {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('[XP] Failed to fetch user:', userResponse.status, errorText);
            throw new Error(`Failed to fetch user data: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        console.log('[XP] User data fetched successfully');

        const currentXP = parseInt(userData.meta_data?.find(m => m.key === '_forum_xp')?.value || '0');
        const newXP = currentXP + xpAmount;
        const newRank = calculateLevel(newXP);

        console.log('[XP] XP progression:', { currentXP, newXP, level: newRank.level });

        // Update user metadata
        const updateResponse = await fetch(`${WOO_URL}/wp-json/wc/v3/customers/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meta_data: [
                    { key: '_forum_xp', value: newXP.toString() },
                    { key: '_forum_level', value: newRank.level.toString() }
                ]
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('[XP] Failed to update user:', updateResponse.status, errorText);
            throw new Error(`Failed to update user: ${updateResponse.status}`);
        }

        console.log('[XP] ✓ User updated successfully. Total XP:', newXP, 'Level:', newRank.level);

        return res.status(200).json({
            success: true,
            xp: newXP,
            xpAwarded: xpAmount,
            rank: newRank
        });

    } catch (error) {
        console.error('[XP] Error:', error.message);
        console.error('[XP] Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Error al otorgar XP: ' + error.message
        });
    }
}
