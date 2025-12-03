/**
 * City Crafting Bonuses
 * All Royal Cities have 18% base bonus + 15% specialization for specific items
 */

export const CRAFTING_BONUSES: Record<string, { items: string[]; bonus: number }> = {
    'Lymhurst': {
        items: [
            // Bows
            '2H_BOW', '2H_WARBOW', '2H_LONGBOW',
            // Cloth Armor
            'HEAD_CLOTH', 'ARMOR_CLOTH', 'SHOES_CLOTH',
            // Nature Staffs
            '2H_NATURESTAFF', '2H_WILDSTAFF', '2H_DRUIDSTAFF'
        ],
        bonus: 15
    },
    'Martlock': {
        items: [
            // Leather Armor
            'HEAD_LEATHER', 'ARMOR_LEATHER', 'SHOES_LEATHER',
            // Spears
            '2H_SPEAR', '2H_HARPOON', '2H_GLAIVE',
            // Boots (all types)
            'SHOES_PLATE', 'SHOES_LEATHER', 'SHOES_CLOTH'
        ],
        bonus: 15
    },
    'Fort Sterling': {
        items: [
            // Plate Armor
            'HEAD_PLATE', 'ARMOR_PLATE', 'SHOES_PLATE',
            // Hammers
            '2H_HAMMER', '2H_POLEHAMMER', 'MAIN_HAMMER',
            // Maces
            '2H_MACE', 'MAIN_MACE', '2H_FLAIL'
        ],
        bonus: 15
    },
    'Bridgewatch': {
        items: [
            // Crossbows
            '2H_CROSSBOW', '2H_CROSSBOWLARGE', 'MAIN_CROSSBOW',
            // Shields
            'OFF_SHIELD', 'OFF_TOWERSHIELD', 'OFF_SPIKEDSHIELD',
            // Daggers
            'MAIN_DAGGER', '2H_DAGGERPAIR', '2H_CLAWPAIR'
        ],
        bonus: 15
    },
    'Thetford': {
        items: [
            // Swords
            '2H_SWORD', '2H_CLAYMORE', 'MAIN_SWORD', '2H_DUALSWORD',
            // Axes
            '2H_AXE', '2H_HALBERD', 'MAIN_AXE', '2H_HALBERD_MORGANA',
            // Quarterstaffs
            '2H_QUARTERSTAFF', '2H_IRONCLADEDSTAFF', '2H_DOUBLEBLADEDSTAFF'
        ],
        bonus: 15
    },
    'Caerleon': {
        items: [], // No specialization bonus, only base 18%
        bonus: 0
    }
};

export const BASE_CITY_BONUS = 18; // All Royal Cities

/**
 * Get the total crafting bonus for an item in a specific city
 * @param itemId - The item ID (e.g., "T4_2H_SWORD")
 * @param city - The city name
 * @returns Total production bonus percentage
 */
export function getCraftingBonus(itemId: string, city: string): number {
    // Extract the base item type (remove tier and enchantment)
    const baseItemType = itemId.replace(/^T\d+_/, '').replace(/_LEVEL\d+@\d+$/, '').replace(/@\d+$/, '');

    const cityBonus = CRAFTING_BONUSES[city];
    if (!cityBonus) return BASE_CITY_BONUS;

    // Check if this item type has a specialization bonus in this city
    const hasSpecialization = cityBonus.items.some(item => baseItemType.includes(item));

    return BASE_CITY_BONUS + (hasSpecialization ? cityBonus.bonus : 0);
}

/**
 * Find the optimal city for crafting a specific item
 * @param itemId - The item ID
 * @returns City name with highest bonus
 */
export function getOptimalCraftingCity(itemId: string): string {
    let bestCity = 'Caerleon';
    let bestBonus = BASE_CITY_BONUS;

    for (const [city, data] of Object.entries(CRAFTING_BONUSES)) {
        const bonus = getCraftingBonus(itemId, city);
        if (bonus > bestBonus) {
            bestBonus = bonus;
            bestCity = city;
        }
    }

    return bestCity;
}

/**
 * Check if a city has a crafting bonus for an item
 * @param itemId - The item ID
 * @param city - The city name
 * @returns True if city has specialization bonus
 */
export function hasCraftingBonus(itemId: string, city: string): boolean {
    return getCraftingBonus(itemId, city) > BASE_CITY_BONUS;
}
