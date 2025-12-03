/**
 * Black Market Calculator - Core profit calculation logic
 * 
 * The Black Market in Albion Online has unique mechanics:
 * - Players can only SELL to it (via buy orders), never buy from it
 * - Same tax structure as regular markets (4% premium, 8% non-premium + 2.5% setup fee)
 * - Prices are often higher than regular markets due to demand for loot drops
 * - Transport to Caerleon (where BM is located) involves Red Zone risk
 */

import { TransportRiskOutput } from './transport-calculator';

export interface UpgradeMaterial {
    itemId: string;
    itemName: string;
    quantity: number;
    pricePerUnit: number;
    totalCost: number;
}

export interface BlackMarketCalculationInput {
    itemId: string;
    itemName: string;

    // Buy side (where to source the item)
    buyCity: string;
    buyPrice: number;
    quantity: number;

    // Black Market side (sell to BM)
    blackMarketBuyOrder: number; // The price BM is willing to pay

    // Settings
    isPremium: boolean;

    // Optional: Upgrade flip
    isUpgrade?: boolean;
    upgradeMaterials?: UpgradeMaterial[];

    // Optional: Crafting
    isCrafted?: boolean;
    craftingCost?: number;
    craftCity?: string;

    // Optional: Transport risk
    transportRisk?: TransportRiskOutput;
}

export interface BlackMarketCalculationOutput {
    // Revenue breakdown
    grossRevenue: number; // BM buy order × quantity
    salesTax: number; // 4% or 8%
    setupFee: number; // 2.5%
    netRevenue: number; // After taxes

    // Cost breakdown
    baseCost: number; // Buy price × quantity
    upgradeCost: number; // If upgrade flip
    craftingCost: number; // If crafted
    totalCost: number;

    // Profit metrics
    profitPerItem: number;
    totalProfit: number;
    profitMargin: number; // percentage
    roi: number; // return on investment percentage

    // Comparisons (if regular market price provided)
    regularMarketPrice?: number;
    regularMarketProfit?: number;
    profitDifference?: number;
    recommendSellTo: 'Black Market' | 'Regular Market';

    // Risk-adjusted (if transport risk provided)
    expectedValue?: number;
    riskAdjustedProfit?: number;
    breakEvenSurvivalRate?: number;
    isRecommended?: boolean;

    // Tax breakdown for display
    taxBreakdown: {
        salesTaxRate: number;
        setupFeeRate: number;
        totalTaxRate: number;
        salesTaxAmount: number;
        setupFeeAmount: number;
        totalTaxAmount: number;
    };
}

/**
 * Calculate comprehensive Black Market profit including all taxes, fees, and optional costs.
 * 
 * Tax Structure:
 * - Sales Tax: 4% (premium) or 8% (non-premium)
 * - Setup Fee: 2.5% (always applied when creating sell order)
 * - Total: 6.5% (premium) or 10.5% (non-premium)
 * 
 * @param input - Black Market calculation parameters
 * @returns Detailed profit breakdown
 */
export function calculateBlackMarketProfit(
    input: BlackMarketCalculationInput
): BlackMarketCalculationOutput {
    const {
        buyPrice,
        blackMarketBuyOrder,
        quantity,
        isPremium,
        upgradeMaterials,
        craftingCost = 0,
        transportRisk
    } = input;

    // Tax rates
    const salesTaxRate = isPremium ? 0.04 : 0.08;
    const setupFeeRate = 0.025;
    const totalTaxRate = salesTaxRate + setupFeeRate;

    // Revenue calculations
    const grossRevenue = blackMarketBuyOrder * quantity;
    const salesTax = grossRevenue * salesTaxRate;
    const setupFee = grossRevenue * setupFeeRate;
    const netRevenue = grossRevenue - salesTax - setupFee;

    // Cost calculations
    const baseCost = buyPrice * quantity;
    const upgradeCost = upgradeMaterials
        ? upgradeMaterials.reduce((sum, mat) => sum + mat.totalCost, 0)
        : 0;
    const totalCost = baseCost + upgradeCost + craftingCost;

    // Profit calculations
    const totalProfit = netRevenue - totalCost;
    const profitPerItem = totalProfit / quantity;
    const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // Tax breakdown for display
    const taxBreakdown = {
        salesTaxRate,
        setupFeeRate,
        totalTaxRate,
        salesTaxAmount: salesTax,
        setupFeeAmount: setupFee,
        totalTaxAmount: salesTax + setupFee
    };

    const result: BlackMarketCalculationOutput = {
        grossRevenue,
        salesTax,
        setupFee,
        netRevenue,
        baseCost,
        upgradeCost,
        craftingCost,
        totalCost,
        profitPerItem,
        totalProfit,
        profitMargin,
        roi,
        recommendSellTo: 'Black Market', // Default, will be updated if comparison available
        taxBreakdown
    };

    // Risk-adjusted calculations (if transport risk provided)
    if (transportRisk) {
        const { survivalRate, gearCost } = transportRisk;
        const deathRate = 1 - survivalRate;

        // Expected value = (Profit × Survival Rate) - (Total Cost × Death Rate) - Gear Cost
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

        const isRecommended = expectedValue > 0;

        result.expectedValue = expectedValue;
        result.riskAdjustedProfit = riskAdjustedProfit;
        result.breakEvenSurvivalRate = breakEvenSurvivalRate;
        result.isRecommended = isRecommended;
    }

    return result;
}

/**
 * Compare Black Market profit vs Regular Market profit.
 * Helps determine which market is more profitable after taxes.
 * 
 * @param bmBuyOrder - Black Market buy order price
 * @param regularMarketPrice - Regular market sell price
 * @param isPremium - Premium status
 * @returns Comparison with recommendation
 */
export function compareMarkets(
    bmBuyOrder: number,
    regularMarketPrice: number,
    isPremium: boolean
): {
    bmNetPrice: number;
    regularNetPrice: number;
    difference: number;
    betterMarket: 'Black Market' | 'Regular Market';
    percentageDifference: number;
} {
    const taxRate = isPremium ? 0.04 : 0.08;
    const setupFee = 0.025;
    const totalTaxRate = taxRate + setupFee;

    // Both markets have same tax structure
    const bmNetPrice = bmBuyOrder * (1 - totalTaxRate);
    const regularNetPrice = regularMarketPrice * (1 - totalTaxRate);

    const difference = bmNetPrice - regularNetPrice;
    const betterMarket = difference > 0 ? 'Black Market' : 'Regular Market';
    const percentageDifference = regularNetPrice > 0
        ? (difference / regularNetPrice) * 100
        : 0;

    return {
        bmNetPrice,
        regularNetPrice,
        difference,
        betterMarket,
        percentageDifference
    };
}

/**
 * Calculate the minimum Black Market buy order price needed to break even.
 * Useful for determining if a flip is worth it.
 * 
 * @param buyPrice - Price to purchase item
 * @param upgradeCost - Cost of upgrade materials (if applicable)
 * @param craftingCost - Cost of crafting (if applicable)
 * @param isPremium - Premium status
 * @returns Minimum BM buy order price to break even
 */
export function calculateBreakEvenBMPrice(
    buyPrice: number,
    upgradeCost: number = 0,
    craftingCost: number = 0,
    isPremium: boolean = false
): number {
    const totalCost = buyPrice + upgradeCost + craftingCost;
    const taxRate = isPremium ? 0.04 : 0.08;
    const setupFee = 0.025;
    const totalTaxRate = taxRate + setupFee;

    // netRevenue = bmPrice × (1 - totalTaxRate)
    // For break-even: netRevenue = totalCost
    // bmPrice × (1 - totalTaxRate) = totalCost
    // bmPrice = totalCost / (1 - totalTaxRate)

    return totalCost / (1 - totalTaxRate);
}

/**
 * Calculate profit margin percentage.
 * 
 * @param profit - Net profit
 * @param cost - Total cost
 * @returns Profit margin as percentage
 */
export function calculateProfitMargin(profit: number, cost: number): number {
    return cost > 0 ? (profit / cost) * 100 : 0;
}

/**
 * Calculate ROI (Return on Investment) percentage.
 * Same as profit margin but more commonly used term.
 * 
 * @param profit - Net profit
 * @param investment - Total investment/cost
 * @returns ROI as percentage
 */
export function calculateROI(profit: number, investment: number): number {
    return investment > 0 ? (profit / investment) * 100 : 0;
}

/**
 * Quick profit check - determines if a flip is profitable before detailed calculation.
 * 
 * @param buyPrice - Purchase price
 * @param bmBuyOrder - Black Market buy order
 * @param isPremium - Premium status
 * @returns True if profitable after taxes
 */
export function isFlipProfitable(
    buyPrice: number,
    bmBuyOrder: number,
    isPremium: boolean
): boolean {
    const breakEven = calculateBreakEvenBMPrice(buyPrice, 0, 0, isPremium);
    return bmBuyOrder > breakEven;
}
