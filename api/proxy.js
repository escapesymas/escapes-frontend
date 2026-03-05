import sharp from 'sharp';

// Bypass SSL certificate issues for backendescapes.com
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
        const { path, media, w, h, fmt, q, ...queryParams } = req.query;

        // Base URL Configuration
        const baseUrl = (process.env.WC_URL || 'https://backendescapes.com').replace(/\/$/, "");

        // 1. IMAGE PROXY MODE with Optimization
        if (media) {
            const imageUrl = `${baseUrl}/${media}`;
            const imageResponse = await fetch(imageUrl);

            if (!imageResponse.ok) {
                console.error(`[PROXY MEDIA ERROR] ${imageResponse.status} for ${imageUrl}`);
                res.status(imageResponse.status).send(`Failed to fetch image: ${imageResponse.statusText}`);
                return;
            }

            const arrayBuffer = await imageResponse.arrayBuffer();
            const inputBuffer = Buffer.from(arrayBuffer);

            let pipeline = sharp(inputBuffer);
            const width = parseInt(w);
            const height = parseInt(h);
            const quality = parseInt(q) || 80;
            const format = fmt || 'webp';

            // Resizing logic
            if (width || height) {
                pipeline = pipeline.resize({
                    width: width || null,
                    height: height || null,
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Format & Quality logic
            if (format === 'webp') {
                pipeline = pipeline.webp({ quality });
                res.setHeader('Content-Type', 'image/webp');
            } else if (format === 'avif') {
                pipeline = pipeline.avif({ quality });
                res.setHeader('Content-Type', 'image/avif');
            } else {
                // Fallback to original or specified fmt
                const originalType = imageResponse.headers.get('content-type');
                if (originalType) res.setHeader('Content-Type', originalType);
            }

            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

            const outputBuffer = await pipeline.toBuffer();
            res.send(outputBuffer);
            return;
        }

        // 2. API PROXY MODE
        if (!path) {
            return res.status(400).json({ error: 'Missing path or media parameter' });
        }

        // Build target URL 
        const queryString = new URLSearchParams(queryParams).toString();
        const targetUrl = `${baseUrl}/wp-json/${path}${queryString ? '?' + queryString : ''}`;

        const headers = { ...req.headers };
        // Clean up headers for the backend request
        delete headers.host;
        delete headers.cookie;
        delete headers.connection;
        delete headers['content-length'];
        delete headers['x-vercel-id'];
        delete headers['x-vercel-proxy-signature'];
        delete headers['x-forwarded-for'];

        // AUTHENTICATION
        // Priority: Vercel Environment Variables (WC_ prefixes based on user settings) > Hardcoded Backup
        const key = process.env.WC_CONSUMER_KEY || process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
        const secret = process.env.WC_CONSUMER_SECRET || process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

        const auth = Buffer.from(`${key}:${secret}`).toString('base64');

        // If the client sent an Authorization header (e.g. JWT Bearer), let it through 
        // unless it's a wc/v3 path which usually needs Basic Auth.
        // We override only if no Auth is present to allow user-specific JWTs.
        if (!headers['authorization']) {
            headers['Authorization'] = `Basic ${auth}`;
        }

        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        headers['Host'] = new URL(baseUrl).host;

        console.log(`[PROXY] ${req.method} -> ${targetUrl} (Using ${process.env.WC_CONSUMER_KEY ? 'Vercel WC_ Env' : 'Backup/Old'} Keys)`);

        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);

        // Copy response headers
        response.headers.forEach((v, k) => {
            const lk = k.toLowerCase();
            if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(lk)) {
                res.setHeader(k, v);
            }
        });

        const dataText = await response.text();

        try {
            const dataJson = JSON.parse(dataText);
            res.status(response.status).json(dataJson);
        } catch (e) {
            // Not JSON (could be a PHP error or HTML page)
            if (response.status === 500) {
                console.error(`[PROXY BACKEND ERROR] ${targetUrl} returned non-JSON 500:`, dataText.substring(0, 500));
            }
            res.status(response.status).send(dataText);
        }

    } catch (error) {
        console.error('[PROXY CRASH]:', error);
        res.status(500).json({
            error: 'Internal Proxy Error',
            message: error.message
        });
    }
}
