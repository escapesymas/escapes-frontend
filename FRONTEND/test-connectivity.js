
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const url = 'https://backendescapes.com/wp-json/wc/v3/products?per_page=1';
// Testing the keys found in the older server.js
console.log('Testing with STOREDATA.TS keys (ck_15...)');
console.log('Fetching:', url);
const consumerKey = 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const consumerSecret = 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

async function check() {
    console.log('Testing with SERVER.JS keys (ck_d3...)');
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        const text = await res.text();
        console.log('Body preview:', text.substring(0, 500));

        if (text.includes('"id":')) {
            console.log('✅ SUCCESS: These keys work!');
        } else {
            console.log('❌ FAILURE: These keys returned invalid response.');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
