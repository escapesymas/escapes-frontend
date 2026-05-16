
const WP_USER = 'adsave';
const WP_PASS = 'Pedrito2011P!';
const TARGET_URL = 'https://backendescapes.com/wp-json/wp/v2/paddock_category';

const categories = [
    { name: 'Paddock General', description: 'Charlas generales sobre el mundo del motor' },
    { name: 'Mecánica y Taller', description: 'Dudas técnicas y mantenimiento' },
    { name: 'Compraventa Motos', description: 'Solo motos completas' },
    { name: 'Rutas y Quedadas', description: 'Organiza tus salidas' }
];

async function createCategories() {
    const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

    for (const cat of categories) {
        console.log(`Creating category: ${cat.name}...`);
        try {
            const response = await fetch(TARGET_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cat)
            });

            const data = await response.json();
            if (response.ok) {
                console.log(`✅ Created: ${cat.name} (ID: ${data.id})`);
            } else {
                console.error(`❌ Failed: ${cat.name} - ${data.message || response.statusText}`);
            }
        } catch (error) {
            console.error(`❌ Error creating ${cat.name}:`, error.message);
        }
    }
}

createCategories();
