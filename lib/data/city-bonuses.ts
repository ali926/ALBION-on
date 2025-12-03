/**
 * City-specific refining bonuses in Albion Online
 * Each city specializes in one resource type and provides a return rate bonus
 * 
 * Source: https://wiki.albiononline.com/wiki/Local_Production_Bonus
 * 
 * Refining Bonus: +18% for specialized resource
 * - Fort Sterling: Wood +18%
 * - Lymhurst: Fiber +18%
 * - Bridgewatch: Stone +18%
 * - Martlock: Hide +18%
 * - Thetford: Ore +18%
 * - Caerleon: None (no refining bonus)
 * 
 * Note: The production output may be increased by an additional 59% with Focus
 */

export interface CityBonus {
    city: string;
    resourceType: string;
    bonusPercentage: number; // Refining bonus percentage (+18%)
}

// Resource type mappings
export const RESOURCE_TYPES = {
    ORE: 'ORE',
    FIBER: 'FIBER',
    HIDE: 'HIDE',
    WOOD: 'WOOD',
    ROCK: 'ROCK'
} as const;

export const REFINED_TYPES = {
    METALBAR: 'METALBAR',
    CLOTH: 'CLOTH',
    LEATHER: 'LEATHER',
    PLANKS: 'PLANKS',
    STONEBLOCK: 'STONEBLOCK'
} as const;

// City specialization mapping (Refining Bonus +18%)
export const CITY_SPECIALIZATIONS: Record<string, string> = {
    'Fort Sterling': RESOURCE_TYPES.WOOD,
    'Thetford': RESOURCE_TYPES.ORE,
    'Bridgewatch': RESOURCE_TYPES.ROCK,
    'Lymhurst': RESOURCE_TYPES.FIBER,
    'Martlock': RESOURCE_TYPES.HIDE
};

// Reverse mapping: Resource → City
export const RESOURCE_TO_CITY: Record<string, string> = {
    [RESOURCE_TYPES.ORE]: 'Thetford',
    [REFINED_TYPES.METALBAR]: 'Thetford',
    [RESOURCE_TYPES.FIBER]: 'Lymhurst',
    [REFINED_TYPES.CLOTH]: 'Lymhurst',
    [RESOURCE_TYPES.HIDE]: 'Martlock',
    [REFINED_TYPES.LEATHER]: 'Martlock',
    [RESOURCE_TYPES.WOOD]: 'Fort Sterling',
    [REFINED_TYPES.PLANKS]: 'Fort Sterling',
    [RESOURCE_TYPES.ROCK]: 'Bridgewatch',
    [REFINED_TYPES.STONEBLOCK]: 'Bridgewatch'
};

// Refining bonus percentage (constant across all cities)
export const REFINING_BONUS_PERCENTAGE = 18; // +18% for specialized resource

/**
 * Get the refining bonus for a specific resource type in a specific city
 * @param resourceType - Raw or refined resource type (e.g., 'ORE', 'METALBAR')
 * @param city - City name
 * @returns Bonus percentage (18% for specialized city, 0% otherwise)
 */
export function getCityBonus(
    resourceType: string,
    city: string
): number {
    const specializedCity = RESOURCE_TO_CITY[resourceType];

    // No bonus if not in the specialized city
    if (!specializedCity || specializedCity !== city) {
        return 0;
    }

    // Return refining bonus (+18%)
    return REFINING_BONUS_PERCENTAGE;
}

/**
 * Get the optimal city for refining a specific resource type
 * @param resourceType - Raw or refined resource type
 * @returns City name with the best bonus
 */
export function getOptimalRefiningCity(resourceType: string): string | null {
    return RESOURCE_TO_CITY[resourceType] || null;
}

/**
 * Check if a city has a bonus for a specific resource
 * @param resourceType - Raw or refined resource type
 * @param city - City name
 * @returns True if the city provides a bonus for this resource
 */
export function hasCityBonus(resourceType: string, city: string): boolean {
    return getCityBonus(resourceType, city) > 0;
}

/**
 * Get all cities with their specialized resources
 * @returns Array of city specialization info
 */
export function getAllCityBonuses(): Array<{ city: string; resourceType: string; bonus: number }> {
    return Object.entries(CITY_SPECIALIZATIONS).map(([city, resourceType]) => ({
        city,
        resourceType,
        bonus: REFINING_BONUS_PERCENTAGE
    }));
}

/**
 * Calculate the effective return rate with city bonus applied
 * @param baseReturnRate - Base return rate percentage (e.g., 24.8)
 * @param cityBonus - City bonus percentage (e.g., 18)
 * @returns Effective return rate with bonus applied
 */
export function calculateEffectiveReturnRate(
    baseReturnRate: number,
    cityBonus: number
): number {
    // City bonus is additive to return rate
    return baseReturnRate + cityBonus;
}
