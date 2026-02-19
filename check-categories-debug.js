
const WP_USER = 'adsave';
const WP_PASS = 'Pedrito2011P!';
const TARGET_URL = 'https://backendescapes.com/wp-json/wp/v2/paddock_category';

async function checkCategories() {
    const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

    console.log(`Checking existing categories at ${TARGET_URL}...`);
    try {
        const response = await fetch(TARGET_URL + '?per_page=100', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Found ${data.length} categories.`);
            data.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`));
        } else {
            console.error(`❌ Failed to list categories: ${data.message || response.statusText}`);
        }
    } catch (error) {
        console.error(`❌ Error checking categories:`, error.message);
    }
}

checkCategories();
