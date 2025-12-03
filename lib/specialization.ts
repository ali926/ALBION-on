export interface SpecializationLevels {
    mastery: number; // 0-100
    specialization: number; // 0-100
    otherSpecsAverage?: number; // 0-100, average level of other items in the same group
    numberOfOtherItems?: number; // How many other items are in this group (e.g. 2 for Robes: Mage, Scholar)
}

export type ItemType = 'armor_weapon' | 'offhand' | 'tool' | 'cape' | 'bag' | 'refining';

interface Coefficients {
    mastery: number;
    specUnique: number;
    specMutual: number;
}

export const SPECIALIZATION_COEFFICIENTS: Record<ItemType, Coefficients> = {
    armor_weapon: { mastery: 30, specUnique: 250, specMutual: 15 },
    offhand: { mastery: 30, specUnique: 250, specMutual: 15 },
    tool: { mastery: 30, specUnique: 250, specMutual: 60 },
    cape: { mastery: 30, specUnique: 370, specMutual: 30 },
    bag: { mastery: 30, specUnique: 310, specMutual: 30 },
    refining: { mastery: 30, specUnique: 250, specMutual: 0 }
};

/**
 * Calculate Focus Cost Efficiency based on levels and item type.
 */
export function calculateFocusEfficiency(
    levels: SpecializationLevels,
    type: ItemType = 'armor_weapon'
): number {
    const { mastery, specialization, otherSpecsAverage = 0, numberOfOtherItems = 0 } = levels;
    const coeff = SPECIALIZATION_COEFFICIENTS[type];

    const masteryBonus = mastery * coeff.mastery;
    const specBonus = specialization * coeff.specUnique;
    const mutualBonus = (otherSpecsAverage * numberOfOtherItems) * coeff.specMutual;

    return Math.min(masteryBonus + specBonus + mutualBonus, 40000); // Cap at 40k? Actually theoretical max might be higher but 30k is "max" usually. Let's not hard cap unless needed.
    // Actually, 100 * 30 + 100 * 250 + 100 * 7 * 15 = 3000 + 25000 + 10500 = 38500.
    // So it can go near 40k.
    // Let's just return the sum.
}

/**
 * Calculate the Focus Cost for an item given the base cost and efficiency.
 * Formula: Base * 0.5 ^ (Efficiency / 10000)
 */
export function calculateFocusCost(baseCost: number, efficiency: number): number {
    return Math.floor(baseCost * Math.pow(0.5, efficiency / 10000));
}

export function getSpecializationType(itemType: string): ItemType {
    const type = itemType.toLowerCase();
    if (type.includes('off-hand') || type.includes('shield') || type.includes('torch') || type.includes('tome')) {
        return 'offhand';
    }
    if (type.includes('cape')) {
        return 'cape';
    }
    if (type.includes('bag')) {
        return 'bag';
    }
    if (type.includes('tool')) {
        return 'tool';
    }
    // Default to armor_weapon for weapons, armor, and consumables (similar scaling usually)
    return 'armor_weapon';
}
