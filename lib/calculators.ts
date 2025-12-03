import { RefiningInput, RefiningOutput, CraftingInput, CraftingOutput, CityBonusInfo, TransportInfo, RefiningMetrics } from './types';
import { getCityBonus, getOptimalRefiningCity, RESOURCE_TO_CITY, calculateEffectiveReturnRate } from './data/city-bonuses';
import { getItemWeight, getTransportRoute, calculateTransportCost, analyzeTransportRoute } from './data/transport-data';

export type ArtifactType = 'Regular' | 'Royal' | 'Avalonian' | 'Shark';

export interface CraftingParams {
    usageFee: number;
    materialAmount: number;
    itemTier: number;
    enchTier: number;
    artifactTier: number;
    artifactType?: ArtifactType;
    avalonianEnergy?: number;
}

/**
 * Calculate crafting tax based on Albion Online formulas
 * Formula: (UsageFee/1000) * 18 * MaterialAmount * Multiplier * 2^(ItemTier-4) * 2^(EnchTier)
 */
export function calculateCraftingTax(params: CraftingParams): number {
    const { usageFee, materialAmount, itemTier, enchTier, artifactTier, artifactType = 'Regular', avalonianEnergy = 0 } = params;

    const base = 18;
    let multiplier = 1 + (0.25 * (Math.pow(2, artifactTier) - 1) / Math.pow(2, enchTier));

    if (artifactType === 'Royal') multiplier += 1;
    if (artifactType === 'Avalonian') return (usageFee / 1000) * (base * materialAmount * Math.pow(2, itemTier - 4) + 72 * avalonianEnergy);
    if (artifactType === 'Shark') return (usageFee / 1000) * (base * materialAmount * Math.pow(2, itemTier - 4) + 225);

    return (usageFee / 1000) * base * materialAmount * multiplier * Math.pow(2, itemTier - 4) * Math.pow(2, enchTier);
}

/**
 * Calculate refining tax
 * Formula: (UsageFee/1000) * 18 * 2^(ItemTier-4) * 2^(EnchTier)
 */
export function calculateRefiningTax(usageFee: number, itemTier: number, enchTier: number): number {
    return (usageFee / 1000) * 18 * Math.pow(2, itemTier - 4) * Math.pow(2, enchTier);
}

import { REFINING_FOCUS_COSTS, ENCHANTMENT_FOCUS_MULTIPLIERS } from './data/focus-costs';

/**
 * Calculate focus cost based on base cost and efficiency
 * Formula: Base * 0.5 ^ (Efficiency / 10000)
 */
export function calculateFocusCost(baseCost: number, efficiency: number): number {
    return Math.floor(baseCost * Math.pow(0.5, efficiency / 10000));
}

/**
 * Calculate production bonus and resource return rate for refining
 * Based on official Albion Online mechanics
 * 
 * Production Bonus Components:
 * - Base City Bonus: 18% (all Royal cities)
 * - Specialization Bonus: 40% (if refining in specialized city)
 * - Focus Bonus: 59% (if using focus)
 * 
 * Resource Return Rate Formula: RRR = 1 - (100 / (100 + ProductionBonus))
 * 
 * @param resourceType - Resource type being refined
 * @param city - City where refining happens
 * @param useFocus - Whether using focus points
 * @returns Production bonus breakdown and calculated return rate
 */
export function calculateProductionBonus(
    resourceType: string,
    city: string,
    useFocus: boolean
): {
    baseBonus: number;
    specializationBonus: number;
    focusBonus: number;
    totalProductionBonus: number;
    resourceReturnRate: number; // Percentage (e.g., 36.7 for 36.7%)
} {
    // Base bonus for all Royal cities
    const baseBonus = 18;

    // Check if city specializes in this resource (+40%)
    const optimalCity = RESOURCE_TO_CITY[resourceType];
    const specializationBonus = (optimalCity === city) ? 40 : 0;

    // Focus adds flat +59% to production bonus
    const focusBonus = useFocus ? 59 : 0;

    // Total production bonus
    const totalProductionBonus = baseBonus + specializationBonus + focusBonus;

    // Convert production bonus to resource return rate
    // Formula: RRR = 1 - (100 / (100 + ProductionBonus))
    // Example: 58% production bonus → RRR = 1 - (100/158) = 0.367 = 36.7%
    const resourceReturnRate = (1 - (100 / (100 + totalProductionBonus))) * 100;

    return {
        baseBonus,
        specializationBonus,
        focusBonus,
        totalProductionBonus,
        resourceReturnRate
    };
}

/**
 * Calculate refining output with return rate and nutrition
 * Base refining: 2 raw resources → 1 refined resource
 * With return rate and nutrition, you get bonus materials back
 */
export function calculateRefiningOutput(input: RefiningInput & {
    marketPrices?: {
        rawItem: number;
        refinedItem?: number; // Lower tier refined item price
        outputItem: number;
    };
    buyCity?: string; // For transport calculations
    refineCity?: string; // City where refining happens (may have bonus)
}): RefiningOutput {
    const {
        resourceItemId, tier, enchantment, amount, usageFee,
        returnRate, nutritionFactor = 0, marketPrices,
        useFocus = false, focusEfficiency = 0,
        buyCity, refineCity
    } = input;

    // Refining Ratios
    // T2: 1 Raw
    // T3: 2 Raw + 1 Refined T2
    // T4: 2 Raw + 1 Refined T3
    // T5: 3 Raw + 1 Refined T4
    // T6: 4 Raw + 1 Refined T5
    // T7: 5 Raw + 1 Refined T6
    // T8: 5 Raw + 1 Refined T7

    let rawRatio = 1;
    let refinedRatio = 0;

    if (tier === 3) { rawRatio = 2; refinedRatio = 1; }
    else if (tier === 4) { rawRatio = 2; refinedRatio = 1; }
    else if (tier === 5) { rawRatio = 3; refinedRatio = 1; }
    else if (tier === 6) { rawRatio = 4; refinedRatio = 1; }
    else if (tier === 7) { rawRatio = 5; refinedRatio = 1; }
    else if (tier === 8) { rawRatio = 5; refinedRatio = 1; }

    const rawMaterialsNeeded = amount * rawRatio;
    const refinedMaterialNeeded = amount * refinedRatio;

    // Calculate tax
    const tax = calculateRefiningTax(usageFee, tier, enchantment) * amount;

    // Extract resource type from item ID for production bonus calculation
    const resourceType = resourceItemId.split('_')[1]?.split('@')[0] || '';

    // Calculate production bonus and resource return rate
    // This replaces the old manual returnRate input with the correct formula
    const productionBonus = refineCity
        ? calculateProductionBonus(resourceType, refineCity, useFocus)
        : {
            baseBonus: 0,
            specializationBonus: 0,
            focusBonus: 0,
            totalProductionBonus: 0,
            resourceReturnRate: 0
        };

    // Use calculated return rate from production bonus
    // If no refineCity specified, fall back to manual returnRate for backward compatibility
    const effectiveReturnRate = refineCity
        ? (productionBonus.resourceReturnRate / 100)
        : (returnRate / 100);

    // Store city bonus info for display
    let cityBonusInfo: CityBonusInfo | undefined;
    if (refineCity && productionBonus.specializationBonus > 0) {
        cityBonusInfo = {
            city: refineCity,
            resourceType,
            bonusPercentage: productionBonus.specializationBonus,
            productionBonus: productionBonus.totalProductionBonus,
            effectiveReturnRate: productionBonus.resourceReturnRate
        };
    }

    // Materials returned (saved)
    const rawReturned = rawMaterialsNeeded * effectiveReturnRate;
    const refinedReturned = refinedMaterialNeeded * effectiveReturnRate;

    // Net materials used
    const netRawUsed = rawMaterialsNeeded - rawReturned;
    const netRefinedUsed = refinedMaterialNeeded - refinedReturned;

    // Estimated output (you always get the requested amount)
    const estimatedOutput = amount;

    // Focus Cost Calculation
    let totalFocusCost = 0;
    if (useFocus) {
        const baseFocusCost = REFINING_FOCUS_COSTS[tier] || 0;
        const enchMultiplier = ENCHANTMENT_FOCUS_MULTIPLIERS[enchantment] || 1;
        const costPerItem = calculateFocusCost(baseFocusCost * enchMultiplier, focusEfficiency);
        totalFocusCost = costPerItem * amount;
    }

    // Cost calculation if prices are available
    let buyPriceRaw, buyPriceRefined, sellPrice, grossProfit, netProfit, profitMargin, totalCost;
    let costPerRefined = 0;
    let profitPerFocus = 0;

    if (marketPrices) {
        buyPriceRaw = marketPrices.rawItem;
        buyPriceRefined = marketPrices.refinedItem || 0;
        sellPrice = marketPrices.outputItem;

        const rawCost = netRawUsed * buyPriceRaw;
        const refinedCost = netRefinedUsed * buyPriceRefined;

        totalCost = rawCost + refinedCost + tax;
        costPerRefined = totalCost / estimatedOutput;

        const totalRevenue = estimatedOutput * sellPrice;

        // Marketplace tax based on premium status
        const salesTaxRate = (input.isPremium ?? false) ? 0.04 : 0.08;
        const sellOrderFee = 0.025; // 2.5% sell order fee
        const marketTax = totalRevenue * (salesTaxRate + sellOrderFee);

        grossProfit = totalRevenue - totalCost;
        netProfit = grossProfit - marketTax;
        profitMargin = (netProfit / totalCost) * 100;

        if (totalFocusCost > 0) {
            profitPerFocus = netProfit / totalFocusCost;
        }
    } else {
        // Without prices, we can only calculate physical efficiency
        // We'll use a placeholder for costPerRefined based on units
        costPerRefined = (netRawUsed + netRefinedUsed) / estimatedOutput;
        totalCost = tax;
    }

    // Calculate profit without city bonus for comparison
    let profitWithoutBonus: number | undefined;
    if (cityBonusInfo && marketPrices) {
        const baseReturnRate = returnRate / 100;
        const baseRawReturned = rawMaterialsNeeded * baseReturnRate;
        const baseRefinedReturned = refinedMaterialNeeded * baseReturnRate;
        const baseNetRawUsed = rawMaterialsNeeded - baseRawReturned;
        const baseNetRefinedUsed = refinedMaterialNeeded - baseRefinedReturned;

        const baseRawCost = baseNetRawUsed * marketPrices.rawItem;
        const baseRefinedCost = baseNetRefinedUsed * (marketPrices.refinedItem || 0);
        const baseTotalCost = baseRawCost + baseRefinedCost + tax;
        const baseTotalRevenue = estimatedOutput * marketPrices.outputItem;
        const salesTaxRate = (input.isPremium ?? false) ? 0.04 : 0.08;
        const sellOrderFee = 0.025;
        const baseMarketTax = baseTotalRevenue * (salesTaxRate + sellOrderFee);
        const baseGrossProfit = baseTotalRevenue - baseTotalCost;
        profitWithoutBonus = baseGrossProfit - baseMarketTax;

        // Calculate bonus silver value
        if (netProfit !== undefined) {
            cityBonusInfo.bonusSilver = netProfit - profitWithoutBonus;
        }
    }

    // Calculate transport info if cities are specified
    let transportInfo: TransportInfo | undefined;
    if (buyCity && refineCity && input.city && marketPrices) {
        const sellCity = input.city as string;
        const totalWeight = getItemWeight(resourceItemId, rawMaterialsNeeded);
        const totalValue = (totalCost || 0) + (netProfit || 0);

        const analysis = analyzeTransportRoute(
            buyCity,
            refineCity,
            sellCity,
            totalWeight,
            totalValue
        );

        transportInfo = {
            fromCity: buyCity,
            toCity: sellCity,
            distance: analysis.totalDistance,
            weight: totalWeight,
            riskLevel: analysis.overallRisk,
            estimatedCost: analysis.totalCost,
            estimatedTime: analysis.totalTime
        };
    }

    // Calculate advanced metrics
    let metrics: RefiningMetrics | undefined;
    if (netProfit !== undefined && estimatedOutput > 0) {
        const profitPerUnit = netProfit / estimatedOutput;

        metrics = {
            profitPerUnit,
            profitPerFocus: totalFocusCost > 0 ? (netProfit / totalFocusCost) : undefined,
            profitPerBatch: {
                batch10: (netProfit / amount) * 10,
                batch100: (netProfit / amount) * 100,
                batch1000: (netProfit / amount) * 1000
            },
            // Estimate: ~30 seconds per refining operation
            silverPerHour: (netProfit / amount) * 120 // 120 operations per hour
        };
    }

    return {
        rawMaterialsNeeded,
        refinedMaterialNeeded,
        tax,
        estimatedOutput,
        costPerRefined,
        totalCost,
        buyPriceRaw,
        buyPriceRefined,
        sellPrice,
        grossProfit,
        netProfit,
        profitMargin,
        focusCost: totalFocusCost,
        profitPerFocus,
        cityBonus: cityBonusInfo,
        profitWithoutBonus,
        transport: transportInfo,
        metrics
    };
}

/**
 * Calculate crafting profitability
 */
export function calculateCraftingProfit(input: CraftingInput): CraftingOutput {
    const { materialPrices, resultItemPrice, usageFee, isPremium = false, useFocus = false, focusEfficiency = 0, focusCost } = input;

    // Calculate material costs
    const materialCosts = Object.entries(materialPrices).map(([itemId, price]) => ({
        itemId,
        amount: 1, // This should come from recipe
        cost: price
    }));

    const totalMaterialCost = materialCosts.reduce((sum, m) => sum + m.cost, 0);

    // For now, use simplified tax calculation
    const tax = 100; // Placeholder

    const totalCost = totalMaterialCost + tax;
    const grossProfit = resultItemPrice - totalCost;

    // Marketplace tax based on premium status
    const salesTaxRate = isPremium ? 0.04 : 0.08;
    const sellOrderFee = 0.025; // 2.5% sell order fee
    const marketplaceTax = resultItemPrice * (salesTaxRate + sellOrderFee);

    const netProfit = grossProfit - marketplaceTax;
    const profitMargin = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    // Focus Cost Calculation
    let totalFocusCost = 0;
    let profitPerFocus = 0;

    if (useFocus && focusCost) {
        // If base focus cost is provided in input (from recipe)
        const costPerItem = calculateFocusCost(focusCost, focusEfficiency);
        totalFocusCost = costPerItem; // Assuming 1 item crafted

        if (totalFocusCost > 0) {
            profitPerFocus = netProfit / totalFocusCost;
        }
    }

    return {
        materialCosts,
        tax,
        totalCost,
        resultPrice: resultItemPrice,
        grossProfit,
        netProfit,
        profitMargin,
        focusCost: totalFocusCost,
        profitPerFocus
    };
}

/**
 * Calculate profit from flipping (buying low, selling high)
 * @param buyPrice - Price to buy the item at
 * @param sellPrice - Price to sell the item at
 * @param quantity - Number of items to flip
 * @param useOrders - Whether using buy/sell orders (adds 2.5% fees each) or instant transactions
 * @param isPremium - Whether player has premium status (4% vs 8% sales tax)
 * @returns Detailed breakdown of gross profit, fees, taxes, net profit, and margin
 */
export function calculateFlippingProfit(
    buyPrice: number,
    sellPrice: number,
    quantity: number = 1,
    useOrders: boolean = true,
    isPremium: boolean = false
): {
    gross: number;
    net: number;
    margin: number;
    tax: number;
    salesTax: number;
    orderFees: number;
    buyOrderFee: number;
    sellOrderFee: number;
} {
    const gross = (sellPrice - buyPrice) * quantity;

    // Sales tax based on premium status
    const salesTaxRate = isPremium ? 0.04 : 0.08;
    const salesTax = sellPrice * quantity * salesTaxRate;

    // Order fees (if using orders)
    let buyOrderFee = 0;
    let sellOrderFee = 0;
    if (useOrders) {
        buyOrderFee = buyPrice * quantity * 0.025;
        sellOrderFee = sellPrice * quantity * 0.025;
    }

    const orderFees = buyOrderFee + sellOrderFee;
    const totalTax = salesTax + orderFees;
    const net = gross - totalTax;
    const margin = buyPrice > 0 ? (net / (buyPrice * quantity)) * 100 : 0;

    return {
        gross,
        net,
        margin,
        tax: totalTax,
        salesTax,
        orderFees,
        buyOrderFee,
        sellOrderFee
    };
}
