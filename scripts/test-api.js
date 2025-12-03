const fetch = require('node-fetch');

async function testAPI() {
    console.log('🧪 Testing Database API...\n');

    try {
        // Test items endpoint
        console.log('1. Testing /api/items...');
        const itemsRes = await fetch('http://localhost:3000/api/items?limit=5');
        const itemsData = await itemsRes.json();
        console.log(`   Status: ${itemsRes.status}`);
        console.log(`   Success: ${itemsData.success}`);
        console.log(`   Count: ${itemsData.count}`);
        if (itemsData.data) {
            console.log(`   Sample: ${itemsData.data[0]?.name}\n`);
        } else {
            console.log(`   Error: ${itemsData.error}\n`);
        }

        // Test recipes endpoint
        console.log('2. Testing /api/recipes...');
        const recipesRes = await fetch('http://localhost:3000/api/recipes?limit=5');
        const recipesData = await recipesRes.json();
        console.log(`   Status: ${recipesRes.status}`);
        console.log(`   Success: ${recipesData.success}`);
        console.log(`   Count: ${recipesData.count}`);
        if (recipesData.data) {
            console.log(`   Sample: ${recipesData.data[0]?.resultItemId}\n`);
        } else {
            console.log(`   Error: ${recipesData.error}\n`);
        }

        // Test search endpoint
        console.log('3. Testing /api/search...');
        const searchRes = await fetch('http://localhost:3000/api/search?q=sword&limit=5');
        const searchData = await searchRes.json();
        console.log(`   Status: ${searchRes.status}`);
        console.log(`   Success: ${searchData.success}`);
        console.log(`   Count: ${searchData.count}`);
        if (searchData.data) {
            console.log(`   Sample: ${searchData.data[0]?.name}\n`);
        } else {
            console.log(`   Error: ${searchData.error}\n`);
        }

        // Test metadata endpoint
        console.log('4. Testing /api/metadata...');
        const metaRes = await fetch('http://localhost:3000/api/metadata');
        const metaData = await metaRes.json();
        console.log(`   Status: ${metaRes.status}`);
        console.log(`   Success: ${metaData.success}`);
        if (metaData.data) {
            console.log(`   Categories: ${metaData.data.categories.join(', ')}\n`);
        } else {
            console.log(`   Error: ${metaData.error}\n`);
        }

        console.log('✅ API tests complete!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAPI();
