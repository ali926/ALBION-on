/**
 * Comprehensive flip profit calculator for Albion Online market flipping.
 * Supports simple flips and upgrade flips with material costs.
 */

export interface FlipCalculationInput {
    buyPrice: number;
    sellPrice: number;
    quantity: number;
    isPremium: boolean;

    // Upgrade materials (optional)
    upgradeMaterials?: {
        itemId: string;
        quantity: number;
        pricePerUnit: number;
    }[];

    // Transport risk (optional)
    transportRisk?: {
        cargoValue: number;
        survivalRate: number;
        gearCost: number;
    };
}

export interface FlipCalculationOutput {
    // Revenue breakdown
    grossRevenue: number;
    salesTax: number;
    setupFee: number;
    netRevenue: number;

    // Cost breakdown
    baseCost: number;
    upgradeCost: number;
    totalCost: number;

    // Profit metrics
    profitPerItem: number;
    totalProfit: number;
    profitMargin: number; // percentage
    roi: number; // return on investment percentage

    // Risk-adjusted (if transport risk provided)
    expectedValue?: number;
    riskAdjustedProfit?: number;
    breakEvenSurvivalRate?: number;
}

/**
 * Calculate comprehensive flip profit including taxes, fees, and optional upgrade costs.
 * 
 * Tax Structure:
 * - Sales Tax: 4% (premium) or 8% (non-premium)
 * - Setup Fee: 2.5% (always applied for Black Market)
 * 
 * @param input - Flip calculation parameters
 * @returns Detailed profit breakdown
 */
export function calculateFlipProfit(input: FlipCalculationInput): FlipCalculationOutput {
    const { buyPrice, sellPrice, quantity, isPremium, upgradeMaterials, transportRisk } = input;

    // Revenue calculations
    const grossRevenue = sellPrice * quantity;
    const salesTaxRate = isPremium ? 0.04 : 0.08;
    const setupFeeRate = 0.025;

    const salesTax = grossRevenue * salesTaxRate;
    const setupFee = grossRevenue * setupFeeRate;
    const netRevenue = grossRevenue - salesTax - setupFee;

    // Cost calculations
    const baseCost = buyPrice * quantity;
    const upgradeCost = upgradeMaterials
        ? upgradeMaterials.reduce((sum, mat) => sum + (mat.pricePerUnit * mat.quantity), 0)
        : 0;
    const totalCost = baseCost + upgradeCost;

    // Profit calculations
    const totalProfit = netRevenue - totalCost;
    const profitPerItem = totalProfit / quantity;
    const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const result: FlipCalculationOutput = {
        grossRevenue,
        salesTax,
        setupFee,
        netRevenue,
        baseCost,
        upgradeCost,
        totalCost,
        profitPerItem,
        totalProfit,
        profitMargin,
        roi
    };

    // Risk-adjusted calculations (if transport risk provided)
    if (transportRisk) {
        const { survivalRate, gearCost } = transportRisk;

        // Expected value = (Profit × Survival Rate) - (Total Cost × Death Rate) - Gear Cost
        const deathRate = 1 - survivalRate;
        const expectedValue = (totalProfit * survivalRate) - (totalCost * deathRate) - gearCost;
        const riskAdjustedProfit = expectedValue;

        // Break-even survival rate: rate needed for EV = 0
        // 0 = (Profit × Rate) - (Cost × (1 - Rate)) - Gear
        // 0 = Profit×Rate - Cost + Cost×Rate - Gear
        // Cost + Gear = (Profit + Cost) × Rate
        // Rate = (Cost + Gear) / (Profit + Cost)
        const breakEvenSurvivalRate = totalProfit + totalCost > 0
            ? (totalCost + gearCost) / (totalProfit + totalCost)
            : 1;

        result.expectedValue = expectedValue;
        result.riskAdjustedProfit = riskAdjustedProfit;
        result.breakEvenSurvivalRate = breakEvenSurvivalRate;
    }

    return result;
}

/**
 * Quick profit calculation for simple flips (no upgrades, no risk).
 * Useful for basic flip discovery.
 */
export function calculateSimpleFlipProfit(
    buyPrice: number,
    sellPrice: number,
    quantity: number,
    isPremium: boolean
): { profit: number; margin: number } {
    const result = calculateFlipProfit({
        buyPrice,
        sellPrice,
        quantity,
        isPremium
    });

    return {
        profit: result.totalProfit,
        margin: result.profitMargin
    };
}

/**
 * Calculate the minimum sell price needed to break even.
 */
export function calculateBreakEvenSellPrice(
    buyPrice: number,
    upgradeCost: number,
    isPremium: boolean
): number {
    const salesTaxRate = isPremium ? 0.04 : 0.08;
    const setupFeeRate = 0.025;
    const totalTaxRate = salesTaxRate + setupFeeRate;

    // netRevenue = sellPrice × (1 - totalTaxRate)
    // For break-even: netRevenue = buyPrice + upgradeCost
    // sellPrice × (1 - totalTaxRate) = buyPrice + upgradeCost
    // sellPrice = (buyPrice + upgradeCost) / (1 - totalTaxRate)

    return (buyPrice + upgradeCost) / (1 - totalTaxRate);
}

/**
 * Calculate profit margin percentage.
 */
export function calculateProfitMargin(profit: number, cost: number): number {
    return cost > 0 ? (profit / cost) * 100 : 0;
}
