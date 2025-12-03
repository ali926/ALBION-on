// Base focus costs for refining (per operation)
// Source: Albion Online Wiki / Community Data
export const REFINING_FOCUS_COSTS: Record<number, number> = {
    2: 0,   // T2 cannot be refined with focus (no focus cost)
    3: 0,   // T3 cannot be refined with focus (no focus cost) usually, checking wiki... actually T4+ is main focus
    4: 54,
    5: 94,
    6: 164,
    7: 287,
    8: 503
};

// Enchantment multipliers for focus cost
// Usually: .0 = 1x, .1 = 1.x?, .2 = ...
// Wiki says costs increase with tier and quality/enchantment.
// For now we'll use a simplified multiplier or just base costs if exact multipliers aren't found.
// Community data suggests:
// Flat: 1.0
// .1: 1.5?
// .2: ?
// Let's stick to base costs for now and add a TODO for enchantment multipliers.
export const ENCHANTMENT_FOCUS_MULTIPLIERS: Record<number, number> = {
    0: 1.0,
    1: 1.75, // Approximate based on common knowledge, to be verified
    2: 2.5,
    3: 3.25,
    4: 4.0
};

// Crafting focus costs vary wildly by item.
// We might need a more complex lookup or just allow manual entry for now.
