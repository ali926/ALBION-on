import { getCraftingBonus } from './data/crafting-bonuses';

export interface CraftingCalculationInput {
    recipe: {
        itemId: string;
        materials: { itemId: string; amount: number; isArtifact?: boolean }[];
        baseFocusCost?: number;
    };
    amount: number;
    craftCity: string;
    sellCity: string;
    sellToBlackMarket: boolean;
    useFocus: boolean;
    focusSpecialization: number; // 0-40000
    isPremium: boolean;
    usageFee: number;
    materialPrices: Record<string, number>; // itemId -> price
    outputPrice: number; // Sell price
    blackMarketPrice?: number;
}

export interface CraftingCalculationOutput {
    // Production
    productionBonus: number; // Total % bonus
    resourceReturnRate: number; // Actual RRR %

    // Materials
    materialsGross: { itemId: string; amount: number; cost: number }[];
    materialsReturned: { itemId: string; amount: number; value: number }[];
    materialsNet: { itemId: string; amount: number; cost: number }[];
    totalMaterialCost: number;

    // Focus
    baseFocusCost: number;
    actualFocusCost: number;
    focusEfficiency: number; // % reduction

    // Costs
    usageFee: number;
    totalCost: number;

    // Revenue
    sellPrice: number;
    blackMarketPrice?: number;
    recommendSellTo: 'Market' | 'Black Market';
    salesTax: number; // 4% or 8%
    setupFee: number; // 2.5%
    totalTax: number; // salesTax + setupFee
    revenue: number; // After all taxes

    // Profit
    profit: number;
    profitPerUnit: number;
    profitPerFocus: number;
    roi: number; // %

    // City Info
    cityBonus: number;
    hasSpecialization: boolean;
}

/**
 * Calculate crafting output with RRR, focus efficiency, and profit
 */
export function calculateCraftingOutput(input: CraftingCalculationInput): CraftingCalculationOutput {
    const {
        recipe,
        amount,
        craftCity,
        sellCity,
        sellToBlackMarket,
        useFocus,
        focusSpecialization,
        isPremium,
        usageFee,
        materialPrices,
        outputPrice,
        blackMarketPrice
    } = input;

    // 1. Calculate Production Bonus
    const cityBonus = getCraftingBonus(recipe.itemId, craftCity);
    const focusBonus = useFocus ? 59 : 0;
    const productionBonus = cityBonus + focusBonus;

    // 2. Calculate Resource Return Rate (RRR)
    // Formula: RRR = 1 - (1 / (1 + ProductionBonus / 100))
    const resourceReturnRate = 1 - (1 / (1 + productionBonus / 100));

    // 3. Calculate Materials
    const materialsGross: { itemId: string; amount: number; cost: number }[] = [];
    const materialsReturned: { itemId: string; amount: number; value: number }[] = [];
    const materialsNet: { itemId: string; amount: number; cost: number }[] = [];

    let totalMaterialCost = 0;

    for (const mat of recipe.materials) {
        const grossAmount = mat.amount * amount;
        const price = materialPrices[mat.itemId] || 0;
        const grossCost = grossAmount * price;

        // Artifacts are NEVER returned
        const returnedAmount = mat.isArtifact ? 0 : grossAmount * resourceReturnRate;
        const returnedValue = returnedAmount * price;

        const netAmount = grossAmount - returnedAmount;
        const netCost = netAmount * price;

        materialsGross.push({ itemId: mat.itemId, amount: grossAmount, cost: grossCost });
        materialsReturned.push({ itemId: mat.itemId, amount: returnedAmount, value: returnedValue });
        materialsNet.push({ itemId: mat.itemId, amount: netAmount, cost: netCost });

        totalMaterialCost += netCost;
    }

    // 4. Calculate Focus Cost
    const baseFocusCost = recipe.baseFocusCost || 0;
    const actualFocusCost = useFocus
        ? Math.floor(baseFocusCost / Math.pow(2, focusSpecialization / 10000))
        : 0;
    const focusEfficiency = baseFocusCost > 0
        ? ((baseFocusCost - actualFocusCost) / baseFocusCost) * 100
        : 0;

    // 5. Calculate Total Cost
    const totalCost = totalMaterialCost + usageFee;

    // 6. Calculate Revenue (with correct Black Market taxes)
    const setupFeeRate = 0.025; // 2.5% setup fee for sell orders
    const salesTaxRate = isPremium ? 0.04 : 0.08;

    let sellPrice = outputPrice;
    let recommendSellTo: 'Market' | 'Black Market' = 'Market';
    let actualSalesTax = 0;
    let actualSetupFee = 0;

    if (sellToBlackMarket && blackMarketPrice) {
        // Calculate net revenue for both options (BOTH have same taxes!)
        // Regular Market
        const regularSetupFee = outputPrice * setupFeeRate;
        const regularSalesTax = outputPrice * salesTaxRate;
        const regularRevenue = amount * (outputPrice - regularSetupFee - regularSalesTax);

        // Black Market (SAME taxes, but potentially higher buy order price)
        const bmSetupFee = blackMarketPrice * setupFeeRate;
        const bmSalesTax = blackMarketPrice * salesTaxRate;
        const bmRevenue = amount * (blackMarketPrice - bmSetupFee - bmSalesTax);

        if (bmRevenue > regularRevenue) {
            sellPrice = blackMarketPrice;
            recommendSellTo = 'Black Market';
            actualSalesTax = bmSalesTax * amount;
            actualSetupFee = bmSetupFee * amount;
        } else {
            actualSalesTax = regularSalesTax * amount;
            actualSetupFee = regularSetupFee * amount;
        }
    } else {
        actualSalesTax = outputPrice * salesTaxRate * amount;
        actualSetupFee = outputPrice * setupFeeRate * amount;
    }

    const totalTax = actualSalesTax + actualSetupFee;
    const revenue = amount * sellPrice - totalTax;

    // 7. Calculate Profit
    const profit = revenue - totalCost;
    const profitPerUnit = profit / amount;
    const profitPerFocus = actualFocusCost > 0 ? profit / actualFocusCost : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
        productionBonus,
        resourceReturnRate: resourceReturnRate * 100,
        materialsGross,
        materialsReturned,
        materialsNet,
        totalMaterialCost,
        baseFocusCost,
        actualFocusCost,
        focusEfficiency,
        usageFee,
        totalCost,
        sellPrice,
        blackMarketPrice,
        recommendSellTo,
        salesTax: actualSalesTax,
        setupFee: actualSetupFee,
        totalTax,
        revenue,
        profit,
        profitPerUnit,
        profitPerFocus,
        roi,
        cityBonus,
        hasSpecialization: cityBonus > 18
    };
}
