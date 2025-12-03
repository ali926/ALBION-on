/**
 * Dynamic Item Generator for Black Market
 * 
 * Instead of maintaining a massive static JSON file with 10,000+ items,
 * this module generates item IDs and names dynamically based on templates.
 * This approach is more maintainable and results in smaller bundle size.
 */

import { Item, ItemType } from './types';

export interface ItemTemplate {
    baseId: string;
    baseName: string;
    category: string;
    tiers: number[];
    hasEnchantments: boolean;
    baseValue: number; // Base value for tier 4
}

/**
 * Comprehensive item templates for all Black Market accepted items
 */
export const ITEM_TEMPLATES: ItemTemplate[] = [
    // === BAGS (High Priority - Highest BM Volume) ===
    { baseId: "BAG", baseName: "Bag", category: "Bag", tiers: [3, 4, 5, 6, 7, 8], hasEnchantments: false, baseValue: 72 },

    // === CAPES (High Priority - Highest BM Volume) ===
    { baseId: "CAPE", baseName: "Cape", category: "Cape", tiers: [3, 4, 5, 6, 7, 8], hasEnchantments: false, baseValue: 72 },

    // === PLATE ARMOR (ZvZ Meta) ===
    // Helmets
    { baseId: "HEAD_PLATE_SET1", baseName: "Soldier Helmet", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "HEAD_PLATE_SET2", baseName: "Knight Helmet", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "HEAD_PLATE_SET3", baseName: "Guardian Helmet", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // Chest
    { baseId: "ARMOR_PLATE_SET1", baseName: "Soldier Armor", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "ARMOR_PLATE_SET2", baseName: "Knight Armor", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "ARMOR_PLATE_SET3", baseName: "Guardian Armor", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // Boots
    { baseId: "SHOES_PLATE_SET1", baseName: "Soldier Boots", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "SHOES_PLATE_SET2", baseName: "Knight Boots", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "SHOES_PLATE_SET3", baseName: "Guardian Boots", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === CLOTH ARMOR (ZvZ Meta - Cleric Robe) ===
    // Helmets
    { baseId: "HEAD_CLOTH_SET1", baseName: "Scholar Cowl", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "HEAD_CLOTH_SET2", baseName: "Cleric Cowl", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "HEAD_CLOTH_SET3", baseName: "Mage Cowl", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // Chest
    { baseId: "ARMOR_CLOTH_SET1", baseName: "Scholar Robe", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "ARMOR_CLOTH_SET2", baseName: "Cleric Robe", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "ARMOR_CLOTH_SET3", baseName: "Mage Robe", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // Boots
    { baseId: "SHOES_CLOTH_SET1", baseName: "Scholar Sandals", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "SHOES_CLOTH_SET2", baseName: "Cleric Sandals", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "SHOES_CLOTH_SET3", baseName: "Mage Sandals", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === LEATHER ARMOR ===
    // Helmets
    { baseId: "HEAD_LEATHER_SET1", baseName: "Mercenary Hood", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "HEAD_LEATHER_SET2", baseName: "Hunter Hood", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "HEAD_LEATHER_SET3", baseName: "Assassin Hood", category: "Head Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // Chest
    { baseId: "ARMOR_LEATHER_SET1", baseName: "Mercenary Jacket", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "ARMOR_LEATHER_SET2", baseName: "Hunter Jacket", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "ARMOR_LEATHER_SET3", baseName: "Assassin Jacket", category: "Chest Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // Boots
    { baseId: "SHOES_LEATHER_SET1", baseName: "Mercenary Shoes", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "SHOES_LEATHER_SET2", baseName: "Hunter Shoes", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "SHOES_LEATHER_SET3", baseName: "Assassin Shoes", category: "Feet Armor", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === WEAPONS - SWORDS ===
    { baseId: "MAIN_SWORD", baseName: "Broadsword", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_SWORD", baseName: "Claymore", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_DUALSWORD", baseName: "Dual Swords", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === WEAPONS - AXES ===
    { baseId: "MAIN_AXE", baseName: "Battleaxe", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_AXE", baseName: "Greataxe", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_HALBERD", baseName: "Halberd", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === WEAPONS - MACES ===
    { baseId: "MAIN_MACE", baseName: "Mace", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_MACE", baseName: "Heavy Mace", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_HAMMER", baseName: "Hammer", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === WEAPONS - BOWS ===
    { baseId: "2H_BOW", baseName: "Bow", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_WARBOW", baseName: "Warbow", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_LONGBOW", baseName: "Longbow", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === WEAPONS - CROSSBOWS ===
    { baseId: "2H_CROSSBOW", baseName: "Crossbow", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "2H_CROSSBOWLARGE", baseName: "Heavy Crossbow", category: "Weapon", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },

    // === OFF-HANDS ===
    { baseId: "OFF_SHIELD", baseName: "Shield", category: "Off-Hand", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "OFF_TOWERSHIELD", baseName: "Tower Shield", category: "Off-Hand", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "OFF_BOOK", baseName: "Tome of Insight", category: "Off-Hand", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
    { baseId: "OFF_ORB", baseName: "Orb", category: "Off-Hand", tiers: [4, 5, 6, 7, 8], hasEnchantments: true, baseValue: 72 },
];

/**
 * Get tier prefix for item names
 */
function getTierPrefix(tier: number): string {
    const prefixes: Record<number, string> = {
        3: "Journeyman's",
        4: "Adept's",
        5: "Expert's",
        6: "Master's",
        7: "Grandmaster's",
        8: "Elder's"
    };
    return prefixes[tier] || `T${tier}`;
}

/**
 * Generate item ID following Albion's format
 * Format: T{tier}_{baseId}@{enchantment}
 * Example: T6_HEAD_PLATE_SET2@1 = Master's Knight Helmet .1
 */
export function generateItemId(baseId: string, tier: number, enchantment: number = 0): string {
    if (enchantment === 0) {
        return `T${tier}_${baseId}`;
    }
    return `T${tier}_${baseId}@${enchantment}`;
}

/**
 * Generate item name with tier prefix and enchantment suffix
 * Example: "Master's Knight Helmet .1"
 */
export function generateItemName(baseName: string, tier: number, enchantment: number = 0): string {
    const prefix = getTierPrefix(tier);
    const name = `${prefix} ${baseName}`;

    if (enchantment === 0) {
        return name;
    }
    return `${name} .${enchantment}`;
}

/**
 * Calculate base value for a tier
 * Base value doubles with each tier
 */
function calculateBaseValue(baseValue: number, tier: number): number {
    const tierMultiplier = Math.pow(2, tier - 4); // T4 = 1x, T5 = 2x, T6 = 4x, etc.
    return baseValue * tierMultiplier;
}

/**
 * Generate all items from templates
 * Returns array of all possible items for Black Market
 */
export function getAllBlackMarketItems(): Item[] {
    const items: Item[] = [];

    ITEM_TEMPLATES.forEach(template => {
        template.tiers.forEach(tier => {
            if (template.hasEnchantments) {
                // Generate base item (.0) and enchanted variants (.1, .2, .3)
                for (let enchant = 0; enchant <= 3; enchant++) {
                    items.push({
                        id: generateItemId(template.baseId, tier, enchant),
                        name: generateItemName(template.baseName, tier, enchant),
                        tier,
                        enchantment: enchant,
                        type: template.category,
                        baseValue: calculateBaseValue(template.baseValue, tier)
                    });
                }
            } else {
                // No enchantments (bags, capes)
                items.push({
                    id: generateItemId(template.baseId, tier, 0),
                    name: generateItemName(template.baseName, tier, 0),
                    tier,
                    enchantment: 0,
                    type: template.category,
                    baseValue: calculateBaseValue(template.baseValue, tier)
                });
            }
        });
    });

    return items;
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: string): Item[] {
    const allItems = getAllBlackMarketItems();
    return allItems.filter(item => item.type === category);
}

/**
 * Get items by tier
 */
export function getItemsByTier(tier: number): Item[] {
    const allItems = getAllBlackMarketItems();
    return allItems.filter(item => item.tier === tier);
}

/**
 * Search items by name
 */
export function searchItems(query: string): Item[] {
    const allItems = getAllBlackMarketItems();
    const lowerQuery = query.toLowerCase();
    return allItems.filter(item => item.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get item by ID
 */
export function getItemById(itemId: string): Item | undefined {
    const allItems = getAllBlackMarketItems();
    return allItems.find(item => item.id === itemId);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
    const categories = new Set<string>();
    ITEM_TEMPLATES.forEach(template => categories.add(template.category));
    return Array.from(categories).sort();
}

/**
 * Get popular Black Market items (high volume items)
 * Based on research: Bags, Capes, ZvZ meta gear
 */
export function getPopularBMItems(): Item[] {
    const allItems = getAllBlackMarketItems();

    // Filter for high-demand categories
    const popularCategories = ['Bag', 'Cape'];
    const popularNames = ['Cleric Robe', 'Knight Helmet', 'Soldier Boots', 'Mercenary Jacket'];

    return allItems.filter(item =>
        popularCategories.includes(item.type) ||
        popularNames.some(name => item.name.includes(name))
    );
}

/**
 * Get count of total items available
 */
export function getTotalItemCount(): number {
    let count = 0;
    ITEM_TEMPLATES.forEach(template => {
        template.tiers.forEach(() => {
            if (template.hasEnchantments) {
                count += 4; // .0, .1, .2, .3
            } else {
                count += 1;
            }
        });
    });
    return count;
}
