
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-wp-nonce');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { path, media, ...queryParams } = req.query;

        // 1. IMAGE PROXY MODE
        if (media) {
            const imageUrl = `https://backendescapes.com/${media}`;
            const imageResponse = await fetch(imageUrl);

            if (!imageResponse.ok) {
                res.status(imageResponse.status).send(`Failed to fetch image: ${imageResponse.statusText}`);
                return;
            }

            const contentType = imageResponse.headers.get('content-type');
            if (contentType) res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

            const arrayBuffer = await imageResponse.arrayBuffer();
            res.send(Buffer.from(arrayBuffer));
            return;
        }

        // 2. API PROXY MODE
        if (!path) {
            return res.status(400).json({ error: 'Missing path or media parameter' });
        }

        // Build target URL
        const queryString = new URLSearchParams(queryParams).toString();
        const targetUrl = `https://backendescapes.com/wp-json/${path}${queryString ? '?' + queryString : ''}`;

        console.log(`[PROXY] ${req.method} -> ${targetUrl}`);

        const headers = { ...req.headers };
        // Clean up headers for the backend request
        delete headers.host;
        delete headers.cookie;
        delete headers.connection;
        delete headers['content-length'];

        // Authentication for WooCommerce (Hardcoded as fallback, ideally use process.env)
        const WOO_CONFIG = {
            consumerKey: process.env.WOO_CONSUMER_KEY || 'ck_76d086034f7194600f769d6711710ee478fcf8db',
            consumerSecret: process.env.WOO_CONSUMER_SECRET || 'cs_f7112048f074479e394073f159496a8043431f41'
        };

        if (path.startsWith('wc/v3')) {
            const auth = Buffer.from(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }

        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json().catch(() => null);

        // Forward status and data
        res.status(response.status).json(data || { status: response.status, statusText: response.statusText });

    } catch (error) {
        console.error('[PROXY ERROR]:', error);
        res.status(500).json({
            error: 'Internal Proxy Error',
            message: error.message
        });
    }
}
