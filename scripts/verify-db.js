const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'albion.db');
const db = new Database(DB_PATH, { readonly: true });

console.log('📊 Database Statistics:\n');

const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
const materialCount = db.prepare('SELECT COUNT(*) as count FROM recipe_materials').get().count;

console.log(`  Items: ${itemCount}`);
console.log(`  Recipes: ${recipeCount}`);
console.log(`  Materials: ${materialCount}\n`);

console.log('📝 Sample Items:');
const sampleItems = db.prepare('SELECT id, name, tier, category FROM items LIMIT 5').all();
sampleItems.forEach(item => {
    console.log(`  - ${item.name} (${item.id}) - T${item.tier} ${item.category}`);
});

console.log('\n📜 Sample Recipes:');
const sampleRecipes = db.prepare(`
    SELECT r.id, i.name, r.crafting_station 
    FROM recipes r
    JOIN items i ON r.result_item_id = i.id
    LIMIT 5
`).all();
sampleRecipes.forEach(recipe => {
    console.log(`  - ${recipe.name} at ${recipe.crafting_station}`);
});

db.close();
console.log('\n✅ Database verification complete!');
