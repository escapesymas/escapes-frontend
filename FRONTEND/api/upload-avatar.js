import multer from 'multer';
import FormData from 'form-data';
import { Buffer } from 'buffer';

// Allow handling of self-signed certs in some environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// --- CONFIGURATION ---
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';
const PROXY_TARGET_URL = 'https://backendescapes.com';

// Configure Multer to use Memory Storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// IMPORTANT: Disable Vercel's default body parser
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await new Promise((resolve, reject) => {
            upload.single('avatar')(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (!req.file) return res.status(400).json({ success: false, message: 'No file received' });
        const { userId } = req.body || {};
        if (!userId) return res.status(400).json({ success: false, message: 'userId missing' });

        const form = new FormData();
        form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
        form.append('title', `Avatar User ${userId}`);

        const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');
        const wpRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, ...form.getHeaders() },
            body: form
        });

        if (!wpRes.ok) throw new Error(`WP Error: ${wpRes.status}`);

        const mediaData = await wpRes.json();
        const avatarUrl = mediaData.source_url;

        await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers/${userId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ meta_data: [{ key: '_custom_avatar', value: avatarUrl }] })
        });

        return res.status(200).json({ success: true, url: avatarUrl });
    } catch (error) {
        console.error('[UPLOAD ERROR]:', error.message);
        return res.status(500).json({ success: false, message: 'Upload failed' });
    }
}
