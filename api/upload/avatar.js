import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';
import { Buffer } from 'buffer';

// Allow handling of self-signed certs in some environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// --- CONFIGURATION ---
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';
const PROXY_TARGET_URL = 'https://backendescapes.com';

// Configure Multer to use /tmp (required for Vercel/Lambda)
const upload = multer({ dest: '/tmp' });

// IMPORTANT: Disable Vercel's default body parser so Multer can handle the stream
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Run Multer Middleware
        await new Promise((resolve, reject) => {
            upload.single('avatar')(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 2. Validate File
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
        }

        const { userId } = req.body || {};
        const filePath = req.file.path;
        console.log(`[UPLOAD API] Recibido archivo para userId: ${userId}, path: ${filePath}`);

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId no proporcionado' });
        }

        // 3. Prepare FormData for WordPress
        // USE BUFFER instead of Stream for max compatibility with native fetch + form-data in all envs
        const fileBuffer = fs.readFileSync(filePath);

        const form = new FormData();
        form.append('file', fileBuffer, req.file.originalname);
        form.append('title', `Avatar User ${userId}`);
        form.append('caption', 'Avatar subido desde el frontend');

        // 4. Construct Auth Header
        const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

        // 5. POST to WordPress Media Library
        const wpRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                ...form.getHeaders()
            },
            body: form
        });

        // Clean up temp file immediately
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        if (!wpRes.ok) {
            const errText = await wpRes.text();
            console.error('[UPLOAD API] Error WP:', errText);
            return res.status(wpRes.status).json({ success: false, message: `Error WP: ${wpRes.statusText}`, details: errText });
        }

        const mediaData = await wpRes.json();
        const avatarUrl = mediaData.source_url;
        const mediaId = mediaData.id;

        console.log('[UPLOAD API] Imagen subida a WP ID:', mediaId);

        // 6. Update WooCommerce Customer Metadata
        const updateRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meta_data: [
                    { key: '_custom_avatar', value: avatarUrl },
                    { key: 'wp_user_avatar', value: mediaId }
                ]
            })
        });

        if (!updateRes.ok) {
            console.warn('[UPLOAD API] Usuario no actualizado, pero imagen subida.');
        }

        // Success response
        return res.status(200).json({ success: true, url: avatarUrl, id: mediaId });

    } catch (error) {
        console.error('[UPLOAD API] Error crítico:', error);
        return res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
}
