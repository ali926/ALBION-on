const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'albion.db');

console.log('🚀 Starting database import...\n');

try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`Opening database at: ${DB_PATH}`);
    const db = new Database(DB_PATH);

    // Disable foreign keys during import
    db.pragma('foreign_keys = OFF');

    // Load and execute schema
    console.log('📋 Initializing database schema...');
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('  ✓ Schema initialized\n');

    // Load JSON files
    console.log('📂 Loading JSON data files...');
    const itemsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'data', 'items.json'), 'utf-8'));
    const recipesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'data', 'recipes.json'), 'utf-8'));
    console.log(`  ✓ Found ${itemsData.length} items`);
    console.log(`  ✓ Found ${recipesData.length} recipes\n`);

    // Import items
    console.log('🔨 Importing items...');
    const insertItem = db.prepare(`
        INSERT OR REPLACE INTO items 
        (id, name, tier, enchantment, category, subcategory, crafting_station, base_value, is_artifact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const importItems = db.transaction((items) => {
        for (const item of items) {
            insertItem.run(
                item.id,
                item.name,
                item.tier,
                0,
                item.type.includes('Armor') ? 'Armor' : item.type === 'Weapon' ? 'Weapon' : item.type,
                null,
                null,
                item.baseValue || 0,
                0
            );
        }
    });

    importItems(itemsData);
    console.log(`  ✓ Imported ${itemsData.length} items\n`);

    // Import recipes
    console.log('📜 Importing recipes...');
    const insertRecipe = db.prepare(`
        INSERT OR REPLACE INTO recipes 
        (id, result_item_id, crafting_station, batch_size, base_focus_cost)
        VALUES (?, ?, ?, ?, ?)
    `);

    const insertMaterial = db.prepare(`
        INSERT OR REPLACE INTO recipe_materials 
        (recipe_id, material_item_id, amount, is_artifact_material)
        VALUES (?, ?, ?, ?)
    `);

    const importRecipes = db.transaction((recipes) => {
        for (const recipe of recipes) {
            insertRecipe.run(
                recipe.id,
                recipe.resultItemId,
                'Unknown',
                recipe.batchSize || 1,
                890
            );

            for (const material of recipe.materials) {
                insertMaterial.run(
                    recipe.id,
                    material.itemId,
                    material.amount,
                    0
                );
            }
        }
    });

    importRecipes(recipesData);
    console.log(`  ✓ Imported ${recipesData.length} recipes\n`);

    // Stats
    console.log('📊 Database Statistics:');
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
    const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
    console.log(`  Items: ${itemCount}`);
    console.log(`  Recipes: ${recipeCount}\n`);

    db.close();
    console.log('✅ Import completed successfully!');
    console.log(`\n💾 Database saved to: ${DB_PATH}`);

} catch (error) {
    console.error('\n❌ Import failed:');
    console.error(error);
    process.exit(1);
}
