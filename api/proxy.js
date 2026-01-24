import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { path } = req.query; // Capture the intended path from query string or rewrite

    // NOTE: When using vercel.json rewrite like: 
    // "source": "/wp-json/(.*)", "destination": "/api/proxy?path=$1"
    // The 'path' query param will contain the captured group.

    if (!path) {
        return res.status(400).json({ error: "Missing path parameter" });
    }

    const targetUrl = `https://backendescapes.com/wp-json/${path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    console.log(`[PROXY] Forwarding to: ${targetUrl}`);

    // Reconstruct headers
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];
    delete headers.connection;
    delete headers.cookie; // STRIP COOKIES to fix "Respuesta no JSON" error
    delete headers['x-vercel-id'];
    delete headers['x-vercel-forwarded-for'];

    // Add Auth manually if needed, but usually the client sends Authorization header which we pass through.
    // We add User-Agent just in case.
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
        });

        // Copy response headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type');

        res.status(response.status);
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('[PROXY ERROR]', error);
        res.status(502).json({ error: "Bad Gateway", details: error.message });
    }
}
