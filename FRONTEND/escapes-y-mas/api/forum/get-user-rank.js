/**
 * Get user rank from WordPress metadata
 */
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' });
    }

    // Rank configuration
    const RANKS = [
        { level: 1, title: 'Novato', xpRequired: 0, color: '#71717a', icon: '🏍️' },
        { level: 2, title: 'Aprendiz', xpRequired: 50, color: '#22c55e', icon: '⚡' },
        { level: 3, title: 'Piloto', xpRequired: 150, color: '#3b82f6', icon: '🏁' },
        { level: 4, title: 'Experto', xpRequired: 300, color: '#a855f7', icon: '🔥' },
        { level: 5, title: 'Profesional', xpRequired: 500, color: '#f97316', icon: '💨' },
        { level: 6, title: 'Leyenda', xpRequired: 1000, color: '#eab308', icon: '👑' }
    ];

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
        return {
            level: 1,
            title: RANKS[0].title,
            color: RANKS[0].color,
            icon: RANKS[0].icon,
            xp: 0,
            xpToNext: RANKS[1].xpRequired
        };
    }

    try {
        const WOO_URL = process.env.WOO_BASE_URL || 'https://backendescapes.com';
        const WOO_KEY = process.env.WOO_CONSUMER_KEY;
        const WOO_SECRET = process.env.WOO_CONSUMER_SECRET;

        if (!WOO_KEY || !WOO_SECRET) {
            console.error('[RANK] Missing WooCommerce credentials');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');

        const response = await fetch(`${WOO_URL}/wp-json/wc/v3/customers/${userId}`, {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('[RANK] Failed to fetch user:', response.status);
            // Return default rank instead of error
            return res.status(200).json(calculateRank(0));
        }

        const userData = await response.json();
        const xp = parseInt(userData.meta_data?.find(m => m.key === '_forum_xp')?.value || '0');
        const rank = calculateRank(xp);

        console.log(`[RANK] User ${userId}: ${rank.title} (${xp} XP)`);

        return res.status(200).json(rank);

    } catch (error) {
        console.error('[RANK] Error:', error);
        // Return default rank on error
        return res.status(200).json(calculateRank(0));
    }
}
