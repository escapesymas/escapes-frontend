
const url = 'http://localhost:8080/wp-json/wc/v3/products';

async function checkLocal() {
    console.log('Fetching local proxy:', url);
    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        const text = await res.text();
        console.log('Body preview:', text.substring(0, 500));
    } catch (e) {
        console.error('Error fetching local:', e);
    }
}

checkLocal();
