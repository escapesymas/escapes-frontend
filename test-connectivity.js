
const url = 'https://backendescapes.com/wp-json/wc/v3/products';
const consumerKey = 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const consumerSecret = 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

// Basic Auth
const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

async function check() {
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        const text = await res.text();
        console.log('Body preview:', text.substring(0, 500));
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
