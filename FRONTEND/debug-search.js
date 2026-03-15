
const WOO_CONFIG = {
    baseUrl: "https://backendescapes.com",
    consumerKey: "ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9",
    consumerSecret: "cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a"
};

async function testSearch(query) {
    console.log(`\n--- Testing Query: "${query}" ---`);
    try {
        const path = `/wp-json/wc/v3/products?per_page=5&status=publish&search=${encodeURIComponent(query)}`;
        const url = `${WOO_CONFIG.baseUrl}${path}&consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error("Error:", response.status);
            return;
        }

        const products = await response.json();
        console.log(`Found ${products.length} products.`);
        products.forEach(p => console.log(`- [${p.id}] ${p.name}`));

        // check for brake pads
        const hasPads = products.some(p => p.name.toLowerCase().includes('pastillas') || p.name.toLowerCase().includes('freno'));
        console.log(`> Includes Brake Pads? ${hasPads ? 'YES' : 'NO'}`);
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

async function runTests() {
    // 1. Strict Search (Current Implementation)
    await testSearch("Yamaha MT-07 2021");

    // 2. Broad Search (Model Only)
    await testSearch("Yamaha MT-07");

    // 3. Search for specific missing item to see how it's named
    await testSearch("Pastillas MT-07");
}

runTests();
.