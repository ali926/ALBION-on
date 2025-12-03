/**
 * Import existing JSON data into SQLite database
 * This script migrates from the current JSON files to the new database structure
 */

import { getDatabase, initializeDatabase, getDatabaseStats } from '../lib/db/connection';
import fs from 'fs';
import path from 'path';

interface JsonItem {
    id: string;
    name: string;
    tier: number;
    type: string;
    baseValue?: number;
}

interface JsonRecipe {
    id: string;
    resultItemId: string;
    materials: Array<{
        itemId: string;
        amount: number;
    }>;
    batchSize?: number;
}

interface CityBonusData {
    city: string;
    category: string;
    bonus: number;
}

/**
 * Categorize item based on type
 */
function categorizeItem(type: string): { category: string; subcategory: string | null; station: string | null } {
    const typeMap: Record<string, { category: string; subcategory?: string; station?: string }> = {
        'Weapon': { category: 'Weapon', station: '' }, // Will be determined by item ID
        'Head Armor': { category: 'Armor', subcategory: 'Head' },
        'Chest Armor': { category: 'Armor', subcategory: 'Chest' },
        'Feet Armor': { category: 'Armor', subcategory: 'Feet' },
        'Off-Hand': { category: 'Off-Hand', station: "Warrior's Forge" },
        'Cape': { category: 'Cape', station: 'Toolmaker' },
        'Bag': { category: 'Bag', station: 'Toolmaker' },
        'Consumable': { category: 'Consumable' },
        'Refined Resource': { category: 'Resource', subcategory: 'Refined' },
        'Resource': { category: 'Resource', subcategory: 'Raw' },
    };

    const mapped = typeMap[type] || { category: 'Other', subcategory: '', station: '' };
    return {
        category: mapped.category,
        subcategory: mapped.subcategory || null,
        station: mapped.station || null,
    };
}

/**
 * Determine crafting station from item ID
 */
function getCraftingStation(itemId: string): string {
    // Warrior's Forge
    if (itemId.includes('_SWORD') || itemId.includes('_AXE') || itemId.includes('_MACE') ||
        itemId.includes('_HAMMER') || itemId.includes('_CROSSBOW') || itemId.includes('_SHIELD') ||
        itemId.includes('_PLATE')) {
        return "Warrior's Forge";
    }

    // Hunter's Lodge
    if (itemId.includes('_BOW') || itemId.includes('_SPEAR') || itemId.includes('_DAGGER') ||
        itemId.includes('_QUARTERSTAFF') || itemId.includes('_LEATHER')) {
        return "Hunter's Lodge";
    }

    // Mage's Tower
    if (itemId.includes('_FIRE') || itemId.includes('_HOLY') || itemId.includes('_ARCANE') ||
        itemId.includes('_FROST') || itemId.includes('_CURSED') || itemId.includes('_CLOTH')) {
        return "Mage's Tower";
    }

    // Toolmaker
    if (itemId.includes('_CAPE') || itemId.includes('_BAG') || itemId.includes('_TOOL')) {
        return 'Toolmaker';
    }

    // Alchemist
    if (itemId.includes('_POTION') || itemId.includes('_FLASK')) {
        return "Alchemist's Lab";
    }

    // Cook
    if (itemId.includes('_MEAL') || itemId.includes('_SOUP') || itemId.includes('_PIE')) {
        return 'Cook';
    }

    return 'Unknown';
}

/**
 * Check if item is an artifact material
 */
function isArtifact(itemId: string): boolean {
    return itemId.includes('_RUNE') ||
        itemId.includes('_SOUL') ||
        itemId.includes('_RELIC') ||
        itemId.includes('_SHARD') ||
        itemId.includes('_AVALONIAN');
}

/**
 * Import items from JSON
 */
function importItems(db: any, items: JsonItem[]): number {
    const insertItem = db.prepare(`
        INSERT OR REPLACE INTO items 
        (id, name, tier, enchantment, category, subcategory, crafting_station, base_value, is_artifact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items: JsonItem[]) => {
        for (const item of items) {
            const categorized = categorizeItem(item.type);
            const station = categorized.station || getCraftingStation(item.id);

            insertItem.run(
                item.id,
                item.name,
                item.tier,
                0, // Base enchantment
                categorized.category,
                categorized.subcategory,
                station,
                item.baseValue || 0,
                isArtifact(item.id) ? 1 : 0
            );
        }
    });

    insertMany(items);
    return items.length;
}

/**
 * Import recipes from JSON
 */
function importRecipes(db: any, recipes: JsonRecipe[]): { recipes: number; materials: number } {
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

    let materialCount = 0;

    const insertMany = db.transaction((recipes: JsonRecipe[]) => {
        for (const recipe of recipes) {
            const station = getCraftingStation(recipe.resultItemId);
            const baseFocusCost = 890; // Default, will be updated later

            insertRecipe.run(
                recipe.id,
                recipe.resultItemId,
                station,
                recipe.batchSize || 1,
                baseFocusCost
            );

            for (const material of recipe.materials) {
                insertMaterial.run(
                    recipe.id,
                    material.itemId,
                    material.amount,
                    isArtifact(material.itemId) ? 1 : 0
                );
                materialCount++;
            }
        }
    });

    insertMany(recipes);
    return { recipes: recipes.length, materials: materialCount };
}

/**
 * Import city bonuses
 */
function importCityBonuses(db: any): number {
    // Based on existing crafting-bonuses.ts
    const bonuses: CityBonusData[] = [
        // Martlock - Warrior items
        { city: 'Martlock', category: 'Weapon', bonus: 18 },
        { city: 'Martlock', category: 'Armor', bonus: 18 },
        { city: 'Martlock', category: 'Off-Hand', bonus: 18 },

        // Bridgewatch - Hunter items
        { city: 'Bridgewatch', category: 'Weapon', bonus: 18 },
        { city: 'Bridgewatch', category: 'Armor', bonus: 18 },

        // Lymhurst - Mage items
        { city: 'Lymhurst', category: 'Weapon', bonus: 18 },
        { city: 'Lymhurst', category: 'Armor', bonus: 18 },

        // Fort Sterling - Toolmaker
        { city: 'Fort Sterling', category: 'Cape', bonus: 18 },
        { city: 'Fort Sterling', category: 'Bag', bonus: 18 },

        // Thetford - Consumables
        { city: 'Thetford', category: 'Consumable', bonus: 18 },
    ];

    const insertBonus = db.prepare(`
        INSERT OR REPLACE INTO city_bonuses (city, item_category, bonus_percentage)
        VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((bonuses: CityBonusData[]) => {
        for (const bonus of bonuses) {
            insertBonus.run(bonus.city, bonus.category, bonus.bonus);
        }
    });

    insertMany(bonuses);
    return bonuses.length;
}

/**
 * Main import function
 */
async function main() {
    console.log('🚀 Starting database import...\n');

    try {
        // Initialize database
        console.log('📋 Initializing database schema...');
        initializeDatabase();

        const db = getDatabase();

        // Load JSON files
        console.log('📂 Loading JSON data files...');
        const itemsPath = path.join(process.cwd(), 'lib', 'data', 'items.json');
        const recipesPath = path.join(process.cwd(), 'lib', 'data', 'recipes.json');

        if (!fs.existsSync(itemsPath) || !fs.existsSync(recipesPath)) {
            throw new Error('JSON data files not found!');
        }

        const itemsData: JsonItem[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
        const recipesData: JsonRecipe[] = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));

        console.log(`  ✓ Found ${itemsData.length} items`);
        console.log(`  ✓ Found ${recipesData.length} recipes\n`);

        // Import items
        console.log('🔨 Importing items...');
        const itemCount = importItems(db, itemsData);
        console.log(`  ✓ Imported ${itemCount} items\n`);

        // Import recipes
        console.log('📜 Importing recipes...');
        const recipeStats = importRecipes(db, recipesData);
        console.log(`  ✓ Imported ${recipeStats.recipes} recipes`);
        console.log(`  ✓ Imported ${recipeStats.materials} recipe materials\n`);

        // Import city bonuses
        console.log('🏛️  Importing city bonuses...');
        const bonusCount = importCityBonuses(db);
        console.log(`  ✓ Imported ${bonusCount} city bonuses\n`);

        // Display statistics
        console.log('📊 Database Statistics:');
        const stats = getDatabaseStats();
        console.log(`  Items: ${stats.itemCount}`);
        console.log(`  Recipes: ${stats.recipeCount}`);
        console.log(`  Materials: ${stats.materialCount}`);
        console.log(`  City Bonuses: ${stats.cityBonusCount}`);
        console.log(`  Focus Costs: ${stats.focusCostCount}\n`);

        console.log('✅ Import completed successfully!');
        console.log(`\n💾 Database saved to: ${path.join(process.cwd(), 'data', 'albion.db')}`);

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    }
}

// Run import
main();
