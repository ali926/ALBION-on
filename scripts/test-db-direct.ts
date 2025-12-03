
import { albionDb } from '../lib/db/queries';

console.log('🧪 Testing Database Queries Directly...\n');

try {
    console.log('1. Testing getItems...');
    const items = albionDb.getItems({ limit: 5 });
    console.log(`   ✅ Found ${items.length} items`);
    if (items.length > 0) {
        console.log(`   Sample: ${items[0].name} (${items[0].id})\n`);
    }

    console.log('2. Testing getRecipes...');
    const recipes = albionDb.getRecipes({ limit: 5 });
    console.log(`   ✅ Found ${recipes.length} recipes`);
    if (recipes.length > 0) {
        console.log(`   Sample: ${recipes[0].resultItemId}\n`);
    }

    console.log('3. Testing searchItems...');
    const searchResults = albionDb.searchItems('sword', 5);
    console.log(`   ✅ Found ${searchResults.length} items`);
    if (searchResults.length > 0) {
        console.log(`   Sample: ${searchResults[0].name}\n`);
    }

    console.log('4. Testing getCategories...');
    const categories = albionDb.getCategories();
    console.log(`   ✅ Found ${categories.length} categories`);
    console.log(`   Categories: ${categories.join(', ')}\n`);

    console.log('✅ All direct database tests passed!');

} catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error && error.stack) {
        console.error(error.stack);
    }
}
