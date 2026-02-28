import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { path, media, w, h, fmt } = req.query;

    // Handle Media Proxying with optional Sharp optimization
    if (media) {
        let mediaUrl = media;
        if (!media.startsWith('http')) {
            mediaUrl = `https://backendescapes.com/${media}`;
        }
        console.log(`[PROXY] Fetching Media: ${mediaUrl}`);
        try {
            const mRes = await fetch(mediaUrl, {
                headers: {
                    'Referer': 'https://backendescapes.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!mRes.ok) {
                return res.status(mRes.status).json({ error: `Upstream returned ${mRes.status}` });
            }

            const mBuf = Buffer.from(await mRes.arrayBuffer());
            const contentType = mRes.headers.get('content-type') || '';

            // Only optimize actual images when params are present
            if (contentType.startsWith('image/') && (w || h || fmt || req.query.fit)) {
                try {
                    const sharpModule = await import('sharp');
                    const sharp = sharpModule.default;
                    let pipeline = sharp(mBuf);

                    // Resize if width or height specified
                    const width = w ? parseInt(w) : undefined;
                    const height = h ? parseInt(h) : undefined;
                    const fit = req.query.fit || 'inside';

                    if (width || height) {
                        pipeline = pipeline.resize(width, height, {
                            fit: fit,
                            withoutEnlargement: true,
                        });
                    }

                    // Convert format (default to webp for best compression)
                    const format = fmt || 'webp';
                    if (format === 'webp') {
                        pipeline = pipeline.webp({ quality: 75 });
                    } else if (format === 'avif') {
                        pipeline = pipeline.avif({ quality: 60 });
                    } else {
                        pipeline = pipeline.jpeg({ quality: 75 });
                    }

                    const optimized = await pipeline.toBuffer();

                    const mimeMap = { webp: 'image/webp', avif: 'image/avif', jpeg: 'image/jpeg', jpg: 'image/jpeg' };
                    res.setHeader('Content-Type', mimeMap[format] || 'image/webp');
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    res.setHeader('Vary', 'Accept');
                    console.log(`[PROXY] Optimized: ${mBuf.length} -> ${optimized.length} bytes (${format}, ${width || 'auto'}x${height || 'auto'})`);
                    return res.status(200).send(optimized);
                } catch (sharpErr) {
                    console.warn('[PROXY] Sharp optimization failed, serving raw:', sharpErr.message);
                    // Fall through to serve raw if sharp fails
                }
            }

            // Serve raw image (no optimization params or sharp failed)
            mRes.headers.forEach((v, k) => {
                const lk = k.toLowerCase();
                if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(lk)) {
                    res.setHeader(k, v);
                }
            });
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(mRes.status).send(mBuf);
        } catch (e) {
            return res.status(502).json({ error: "Media fetch failed" });
        }
    }

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

    // Add Auth manually as the client doesn't send it (handled by proxy)
    const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_d3b44ee68cb5f6e3e222da8dde30ac733f1c859f';
    const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_bc248d17e08ea49c04100e129b5798e6006c8fdd';
    const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

    headers['Authorization'] = `Basic ${auth}`;
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
        });

        // Copy response headers, but strip encoding/length ones as we are sending a new buffer
        response.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(lowerKey)) {
                res.setHeader(key, value);
            }
        });

        const buffer = await response.arrayBuffer();

        res.status(response.status);
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('[PROXY ERROR]', error);
        res.status(502).json({ error: "Bad Gateway", details: error.message });
    }
}
