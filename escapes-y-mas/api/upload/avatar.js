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

// Configure Multer to use Memory Storage (Avoids disk write permission issues in Vercel)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
        console.log('[UPLOAD API] Incio de request...');

        // 1. Run Multer Middleware
        await new Promise((resolve, reject) => {
            upload.single('avatar')(req, res, (err) => {
                if (err) {
                    console.error('[UPLOAD API] Multer error:', err);
                    reject(err);
                }
                else resolve();
            });
        });

        console.log('[UPLOAD API] Multer procesado.');

        // 2. Validate File & User
        if (!req.file) {
            console.error('[UPLOAD API] No file received');
            return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
        }

        const { userId } = req.body || {};
        if (!userId) {
            console.error('[UPLOAD API] No userId received');
            return res.status(400).json({ success: false, message: 'userId no proporcionado' });
        }

        console.log(`[UPLOAD API] Procesando archivo: ${req.file.originalname} (${req.file.mimetype}) para User: ${userId}`);

        // 3. Prepare FormData for WordPress
        // Using Buffer from memory storage
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        form.append('title', `Avatar User ${userId}`);
        form.append('caption', 'Avatar subido desde el frontend');

        // 4. Construct Auth Header
        const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

        // 5. POST to WordPress Media Library
        console.log('[UPLOAD API] Enviando a WordPress...');
        const wpRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                ...form.getHeaders()
            },
            body: form
        });

        if (!wpRes.ok) {
            const errText = await wpRes.text();
            console.error(`[UPLOAD API] Error WP (${wpRes.status}):`, errText);
            // Return 200 with success: false to handle gracefully in frontend
            return res.status(200).json({ success: false, message: `Error WP: ${wpRes.status}`, details: errText });
        }

        const mediaData = await wpRes.json();
        const avatarUrl = mediaData.source_url;
        const mediaId = mediaData.id;

        console.log('[UPLOAD API] Imagen subida a WP ID:', mediaId);

        // 6. Update WooCommerce Customer Metadata
        await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers/${userId}`, {
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

        // Success response
        return res.status(200).json({ success: true, url: avatarUrl, id: mediaId });

    } catch (error) {
        console.error('[UPLOAD API] CRITICAL ERROR:', error);
        // Ensure JSON response even on crash
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor de subidas',
            error: error.message
        });
    }
}
