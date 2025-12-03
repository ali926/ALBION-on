/**
 * Upgrade materials system for Albion Online enchantment upgrades.
 * Defines requirements and costs for upgrading items from one enchantment level to another.
 */

/**
 * Upgrade requirement for a single enchantment step.
 */
export interface UpgradeStep {
    from: number;
    to: number;
    runes: number;
    souls: number;
    relics: number;
}

/**
 * Complete upgrade requirements by tier.
 * Each tier has different requirements for upgrading between enchantment levels.
 */
export const UPGRADE_REQUIREMENTS: Record<number, UpgradeStep[]> = {
    4: [
        { from: 0, to: 1, runes: 1, souls: 0, relics: 0 },
        { from: 1, to: 2, runes: 2, souls: 0, relics: 0 },
        { from: 2, to: 3, runes: 3, souls: 0, relics: 0 },
        { from: 3, to: 4, runes: 4, souls: 0, relics: 0 },
    ],
    5: [
        { from: 0, to: 1, runes: 1, souls: 1, relics: 0 },
        { from: 1, to: 2, runes: 2, souls: 2, relics: 0 },
        { from: 2, to: 3, runes: 3, souls: 3, relics: 0 },
        { from: 3, to: 4, runes: 4, souls: 4, relics: 0 },
    ],
    6: [
        { from: 0, to: 1, runes: 1, souls: 1, relics: 1 },
        { from: 1, to: 2, runes: 2, souls: 2, relics: 2 },
        { from: 2, to: 3, runes: 3, souls: 3, relics: 3 },
        { from: 3, to: 4, runes: 4, souls: 4, relics: 4 },
    ],
    7: [
        { from: 0, to: 1, runes: 1, souls: 1, relics: 1 },
        { from: 1, to: 2, runes: 2, souls: 2, relics: 2 },
        { from: 2, to: 3, runes: 3, souls: 3, relics: 3 },
        { from: 3, to: 4, runes: 4, souls: 4, relics: 4 },
    ],
    8: [
        { from: 0, to: 1, runes: 1, souls: 1, relics: 1 },
        { from: 1, to: 2, runes: 2, souls: 2, relics: 2 },
        { from: 2, to: 3, runes: 3, souls: 3, relics: 3 },
        { from: 3, to: 4, runes: 4, souls: 4, relics: 4 },
    ],
};

/**
 * Material requirements for an upgrade.
 */
export interface UpgradeMaterialRequirements {
    runes: number;
    souls: number;
    relics: number;
}

/**
 * Get the material requirements for upgrading an item.
 * Supports multi-step upgrades (e.g., 0 → 3 requires summing steps 0→1, 1→2, 2→3).
 * 
 * @param tier - Item tier (4-8)
 * @param fromEnchant - Starting enchantment level (0-4)
 * @param toEnchant - Target enchantment level (0-4)
 * @returns Material requirements or null if invalid
 */
export function getUpgradeRequirements(
    tier: number,
    fromEnchant: number,
    toEnchant: number
): UpgradeMaterialRequirements | null {
    // Validation
    if (tier < 4 || tier > 8) return null;
    if (fromEnchant < 0 || fromEnchant > 4) return null;
    if (toEnchant < 0 || toEnchant > 4) return null;
    if (fromEnchant >= toEnchant) return null;

    const tierRequirements = UPGRADE_REQUIREMENTS[tier];
    if (!tierRequirements) return null;

    // Sum requirements for all steps
    let totalRunes = 0;
    let totalSouls = 0;
    let totalRelics = 0;

    for (let enchant = fromEnchant; enchant < toEnchant; enchant++) {
        const step = tierRequirements.find(s => s.from === enchant && s.to === enchant + 1);
        if (!step) return null;

        totalRunes += step.runes;
        totalSouls += step.souls;
        totalRelics += step.relics;
    }

    return {
        runes: totalRunes,
        souls: totalSouls,
        relics: totalRelics
    };
}

/**
 * Material prices for upgrade cost calculation.
 */
export interface MaterialPrices {
    runePrice: number;
    soulPrice: number;
    relicPrice: number;
}

/**
 * Calculate the total cost of upgrade materials.
 * 
 * @param tier - Item tier (4-8)
 * @param fromEnchant - Starting enchantment level (0-4)
 * @param toEnchant - Target enchantment level (0-4)
 * @param prices - Current market prices for materials
 * @returns Total cost in silver, or null if invalid upgrade
 */
export function calculateUpgradeCost(
    tier: number,
    fromEnchant: number,
    toEnchant: number,
    prices: MaterialPrices
): number | null {
    const requirements = getUpgradeRequirements(tier, fromEnchant, toEnchant);
    if (!requirements) return null;

    const cost =
        (requirements.runes * prices.runePrice) +
        (requirements.souls * prices.soulPrice) +
        (requirements.relics * prices.relicPrice);

    return cost;
}

/**
 * Get the item ID for upgrade materials based on tier.
 * 
 * @param tier - Item tier (4-8)
 * @param materialType - Type of material ('rune', 'soul', or 'relic')
 * @returns Item ID for the material
 */
export function getUpgradeMaterialId(tier: number, materialType: 'rune' | 'soul' | 'relic'): string {
    const tierMap: Record<number, string> = {
        4: 'T4',
        5: 'T5',
        6: 'T6',
        7: 'T7',
        8: 'T8'
    };

    const typeMap = {
        rune: 'RUNE',
        soul: 'SOUL',
        relic: 'RELIC'
    };

    return `${tierMap[tier]}_${typeMap[materialType]}`;
}

/**
 * Check if an upgrade is possible (has valid requirements).
 */
export function isValidUpgrade(tier: number, fromEnchant: number, toEnchant: number): boolean {
    return getUpgradeRequirements(tier, fromEnchant, toEnchant) !== null;
}

/**
 * Get all valid upgrade paths for a given tier and starting enchantment.
 * Useful for showing available upgrade options.
 */
export function getValidUpgradePaths(tier: number, fromEnchant: number): number[] {
    const validTargets: number[] = [];

    for (let target = fromEnchant + 1; target <= 4; target++) {
        if (isValidUpgrade(tier, fromEnchant, target)) {
            validTargets.push(target);
        }
    }

    return validTargets;
}
