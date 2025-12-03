import fs from 'fs';
import path from 'path';

// --- Types ---

interface Item {
    id: string;
    name: string;
    tier: number;
    type: string;
    baseValue: number;
}

interface Recipe {
    id: string;
    resultItemId: string;
    materials: { itemId: string; amount: number }[];
    craftingStation: string;
    batchSize: number;
    baseFocusCost?: number; // Optional, can add later
}

// --- Configuration ---

const TIERS = [4, 5, 6, 7, 8];
const TIER_NAMES: Record<number, string> = {
    4: "Adept's",
    5: "Expert's",
    6: "Master's",
    7: "Grandmaster's",
    8: "Elder's"
};

const BASE_VALUES: Record<number, number> = {
    4: 1, // Multiplier base
    5: 2,
    6: 4,
    7: 8,
    8: 16
};

// Resource Types
const RESOURCES = {
    METALBAR: { name: "Metal Bar", type: "Refined Resource" },
    LEATHER: { name: "Leather", type: "Refined Resource" },
    CLOTH: { name: "Cloth", type: "Refined Resource" },
    PLANKS: { name: "Planks", type: "Refined Resource" },
    STONEBLOCK: { name: "Stone Block", type: "Refined Resource" }
};

// Item Templates
// Format: { idSuffix, nameSuffix, type, station, materials: [{ resource, amount }] }
const TEMPLATES = [
    // --- WARRIOR (Forge) ---
    {
        idSuffix: "MAIN_SWORD", nameSuffix: "Broadsword", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 12 }, { r: "LEATHER", a: 8 }]
    },
    {
        idSuffix: "2H_SWORD", nameSuffix: "Claymore", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 20 }, { r: "LEATHER", a: 12 }]
    },
    {
        idSuffix: "2H_DUALSWORD", nameSuffix: "Dual Swords", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 20 }, { r: "LEATHER", a: 12 }]
    },
    {
        idSuffix: "MAIN_AXE", nameSuffix: "Battleaxe", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 12 }, { r: "PLANKS", a: 8 }]
    },
    {
        idSuffix: "2H_AXE", nameSuffix: "Greataxe", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 20 }, { r: "PLANKS", a: 12 }]
    },
    {
        idSuffix: "2H_HALBERD", nameSuffix: "Halberd", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 20 }, { r: "PLANKS", a: 12 }]
    },
    {
        idSuffix: "MAIN_MACE", nameSuffix: "Mace", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 12 }, { r: "CLOTH", a: 8 }]
    },
    {
        idSuffix: "2H_MACE", nameSuffix: "Heavy Mace", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 20 }, { r: "CLOTH", a: 12 }]
    },
    {
        idSuffix: "2H_HAMMER", nameSuffix: "Hammer", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 20 }, { r: "CLOTH", a: 12 }] // Check materials
    },
    {
        idSuffix: "2H_CROSSBOW", nameSuffix: "Crossbow", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "PLANKS", a: 20 }, { r: "METALBAR", a: 12 }]
    },
    {
        idSuffix: "2H_CROSSBOWLARGE", nameSuffix: "Heavy Crossbow", type: "Weapon", station: "Warrior's Forge",
        materials: [{ r: "PLANKS", a: 20 }, { r: "METALBAR", a: 12 }]
    },
    {
        idSuffix: "OFF_SHIELD", nameSuffix: "Shield", type: "Off-Hand", station: "Warrior's Forge",
        materials: [{ r: "PLANKS", a: 4 }, { r: "METALBAR", a: 4 }]
    },
    {
        idSuffix: "HEAD_PLATE", nameSuffix: "Soldier Helmet", type: "Head Armor", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 8 }]
    },
    {
        idSuffix: "ARMOR_PLATE", nameSuffix: "Soldier Armor", type: "Chest Armor", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 16 }]
    },
    {
        idSuffix: "SHOES_PLATE", nameSuffix: "Soldier Boots", type: "Feet Armor", station: "Warrior's Forge",
        materials: [{ r: "METALBAR", a: 8 }]
    },

    // --- HUNTER (Lodge) ---
    {
        idSuffix: "2H_BOW", nameSuffix: "Bow", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 32 }]
    },
    {
        idSuffix: "2H_WARBOW", nameSuffix: "Warbow", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 32 }]
    },
    {
        idSuffix: "2H_LONGBOW", nameSuffix: "Longbow", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 32 }]
    },
    {
        idSuffix: "MAIN_SPEAR", nameSuffix: "Spear", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 12 }, { r: "METALBAR", a: 8 }]
    },
    {
        idSuffix: "2H_SPEAR", nameSuffix: "Pike", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 20 }, { r: "METALBAR", a: 12 }]
    },
    {
        idSuffix: "MAIN_DAGGER", nameSuffix: "Dagger", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "METALBAR", a: 12 }, { r: "LEATHER", a: 8 }]
    },
    {
        idSuffix: "2H_DAGGERPAIR", nameSuffix: "Dagger Pair", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "METALBAR", a: 16 }, { r: "LEATHER", a: 8 }] // Adjusted amounts
    },
    {
        idSuffix: "2H_CLAWS", nameSuffix: "Claws", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "METALBAR", a: 12 }, { r: "LEATHER", a: 20 }]
    },
    {
        idSuffix: "2H_QUARTERSTAFF", nameSuffix: "Quarterstaff", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 12 }, { r: "METALBAR", a: 8 }] // Check materials
    },
    {
        idSuffix: "2H_NATURESTAFF", nameSuffix: "Nature Staff", type: "Weapon", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 16 }, { r: "CLOTH", a: 8 }]
    },
    {
        idSuffix: "HEAD_LEATHER", nameSuffix: "Mercenary Hood", type: "Head Armor", station: "Hunter's Lodge",
        materials: [{ r: "LEATHER", a: 8 }]
    },
    {
        idSuffix: "ARMOR_LEATHER", nameSuffix: "Mercenary Jacket", type: "Chest Armor", station: "Hunter's Lodge",
        materials: [{ r: "LEATHER", a: 16 }]
    },
    {
        idSuffix: "SHOES_LEATHER", nameSuffix: "Mercenary Shoes", type: "Feet Armor", station: "Hunter's Lodge",
        materials: [{ r: "LEATHER", a: 8 }]
    },
    {
        idSuffix: "OFF_TORCH", nameSuffix: "Torch", type: "Off-Hand", station: "Hunter's Lodge",
        materials: [{ r: "PLANKS", a: 4 }, { r: "CLOTH", a: 4 }]
    },

    // --- MAGE (Tower) ---
    {
        idSuffix: "2H_FIRESTAFF", nameSuffix: "Fire Staff", type: "Weapon", station: "Mage's Tower",
        materials: [{ r: "PLANKS", a: 16 }, { r: "METALBAR", a: 8 }]
    },
    {
        idSuffix: "2H_INFERNOSTAFF", nameSuffix: "Infernal Staff", type: "Weapon", station: "Mage's Tower",
        materials: [{ r: "PLANKS", a: 16 }, { r: "METALBAR", a: 8 }]
    },
    {
        idSuffix: "2H_HOLYSTAFF", nameSuffix: "Holy Staff", type: "Weapon", station: "Mage's Tower",
        materials: [{ r: "PLANKS", a: 16 }, { r: "CLOTH", a: 8 }]
    },
    {
        idSuffix: "2H_DIVINESTAFF", nameSuffix: "Divine Staff", type: "Weapon", station: "Mage's Tower",
        materials: [{ r: "PLANKS", a: 16 }, { r: "CLOTH", a: 8 }]
    },
    {
        idSuffix: "2H_ARCANESTAFF", nameSuffix: "Arcane Staff", type: "Weapon", station: "Mage's Tower",
        materials: [{ r: "PLANKS", a: 16 }, { r: "METALBAR", a: 8 }]
    },
    {
        idSuffix: "2H_FROSTSTAFF", nameSuffix: "Frost Staff", type: "Weapon", station: "Mage's Tower",
        materials: [{ r: "PLANKS", a: 16 }, { r: "METALBAR", a: 8 }]
    },
    {
        idSuffix: "2H_CURSEDSTAFF", nameSuffix: "Cursed Staff", type: "Weapon", station: "Mage's Tower",
        materials: [{ r: "PLANKS", a: 16 }, { r: "LEATHER", a: 8 }]
    },
    {
        idSuffix: "HEAD_CLOTH", nameSuffix: "Scholar Cowl", type: "Head Armor", station: "Mage's Tower",
        materials: [{ r: "CLOTH", a: 8 }]
    },
    {
        idSuffix: "ARMOR_CLOTH", nameSuffix: "Scholar Robe", type: "Chest Armor", station: "Mage's Tower",
        materials: [{ r: "CLOTH", a: 16 }]
    },
    {
        idSuffix: "SHOES_CLOTH", nameSuffix: "Scholar Sandals", type: "Feet Armor", station: "Mage's Tower",
        materials: [{ r: "CLOTH", a: 8 }]
    },
    {
        idSuffix: "OFF_BOOK", nameSuffix: "Tome of Spells", type: "Off-Hand", station: "Mage's Tower",
        materials: [{ r: "CLOTH", a: 4 }, { r: "LEATHER", a: 4 }]
    },

    // --- TOOLMAKER ---
    {
        idSuffix: "CAPE", nameSuffix: "Cape", type: "Cape", station: "Toolmaker",
        materials: [{ r: "CLOTH", a: 4 }, { r: "LEATHER", a: 4 }] // Simplified
    },
    {
        idSuffix: "BAG", nameSuffix: "Bag", type: "Bag", station: "Toolmaker",
        materials: [{ r: "CLOTH", a: 8 }, { r: "LEATHER", a: 8 }] // Simplified
    }
];

// --- Generation Logic ---

const items: Item[] = [];
const recipes: Recipe[] = [];

// 1. Generate Refined Resources (T4-T8)
Object.entries(RESOURCES).forEach(([key, info]) => {
    TIERS.forEach(tier => {
        const id = `T${tier}_${key}`;
        items.push({
            id,
            name: `${TIER_NAMES[tier]} ${info.name}`,
            tier,
            type: info.type,
            baseValue: 18 * BASE_VALUES[tier] // Approximate value scaling
        });
    });
});

// 2. Generate Equipment
TEMPLATES.forEach(tpl => {
    TIERS.forEach(tier => {
        const itemId = `T${tier}_${tpl.idSuffix}`;
        const name = `${TIER_NAMES[tier]} ${tpl.nameSuffix}`;

        // Item
        items.push({
            id: itemId,
            name,
            tier,
            type: tpl.type,
            baseValue: 72 * BASE_VALUES[tier] // Approximate
        });

        // Recipe
        recipes.push({
            id: `RECIPE_${itemId}`,
            resultItemId: itemId,
            materials: tpl.materials.map(m => ({
                itemId: `T${tier}_${m.r}`,
                amount: m.a
            })),
            craftingStation: tpl.craftingStation,
            batchSize: 1
        });
    });
});

// --- Output ---

const outputDir = path.join(process.cwd(), 'lib', 'data');

fs.writeFileSync(path.join(outputDir, 'items.json'), JSON.stringify(items, null, 4));
fs.writeFileSync(path.join(outputDir, 'recipes.json'), JSON.stringify(recipes, null, 4));

console.log(`Generated ${items.length} items and ${recipes.length} recipes.`);
