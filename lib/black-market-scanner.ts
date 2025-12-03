/**
 * Black Market Scanner - Discover profitable flip opportunities
 * 
 * Scans items across cities to find the best Black Market flips.
 * Considers profit margins, volume, transport risk, and market depth.
 */

import { fetchMultipleItemPrices, fetchMarketVolume, calculateMarketDepth, getOrderAge } from './market';
import { calculateBlackMarketProfit } from './black-market-calculator';
import { calculateTransportRisk } from './transport-calculator';
import { getAllBlackMarketItems, getPopularBMItems } from './item-generator';
import { BlackMarketFlipOpportunity, BlackMarketFilters, Item } from './types';

export interface ScanOptions {
    // Item selection
    items?: Item[]; // Specific items to scan, or null for all
    usePopularOnly?: boolean; // Only scan high-demand items

    // Location filters
    buyLocations: string[]; // Cities to buy from

    // Profit filters
    minProfit: number;
    minMargin: number; // percentage
    maxInvestment?: number;

    // Volume filters
    minDailyVolume?: number;

    // Settings
    isPremium: boolean;
    quantity?: number; // Default quantity to calculate for

    // Risk settings
    mountType?: string;
    riskProfile?: string;
}

export interface ScanProgress {
    total: number;
    completed: number;
    currentItem: string;
    percentage: number;
}

/**
 * Scan for profitable Black Market flip opportunities
 * 
 * @param options - Scan configuration
 * @param onProgress - Optional progress callback
 * @returns Array of profitable opportunities sorted by profit
 */
export async function scanBlackMarketOpportunities(
    options: ScanOptions,
    onProgress?: (progress: ScanProgress) => void
): Promise<BlackMarketFlipOpportunity[]> {
    const {
        items,
        usePopularOnly = false,
        buyLocations,
        minProfit,
        minMargin,
        maxInvestment,
        minDailyVolume = 0,
        isPremium,
        quantity = 1,
        mountType = 'Ox',
        riskProfile = 'Standard'
    } = options;

    // Determine which items to scan
    const itemsToScan = items
        ? items
        : usePopularOnly
            ? getPopularBMItems()
            : getAllBlackMarketItems();

    const opportunities: BlackMarketFlipOpportunity[] = [];
    const total = itemsToScan.length;
    let completed = 0;

    // Scan in batches to avoid overwhelming the API
    const BATCH_SIZE = 10;

    for (let i = 0; i < itemsToScan.length; i += BATCH_SIZE) {
        const batch = itemsToScan.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (item) => {
            try {
                // Fetch prices from buy locations + Black Market
                const locations = [...buyLocations, "Black Market"];
                const prices = await fetchMultipleItemPrices([item.id], locations);
                const itemPrices = prices.get(item.id);

                if (!itemPrices || itemPrices.length === 0) {
                    return null;
                }

                // Get Black Market buy order
                const bmPrice = itemPrices.find(p => p.city === "Black Market");
                if (!bmPrice || bmPrice.buyPriceMax === 0) {
                    return null; // No BM buy orders
                }

                const bmBuyOrder = bmPrice.buyPriceMax;
                const bmOrderAge = getOrderAge(bmPrice.timestamp);

                // Check each buy location
                const locationOpportunities: BlackMarketFlipOpportunity[] = [];

                for (const buyCity of buyLocations) {
                    const cityPrice = itemPrices.find(p => p.city === buyCity);
                    if (!cityPrice || cityPrice.sellPriceMin === 0) {
                        continue; // No sell orders in this city
                    }

                    const buyPrice = cityPrice.sellPriceMin;
                    const buyOrderAge = getOrderAge(cityPrice.timestamp);

                    // Quick profitability check
                    const taxRate = isPremium ? 0.04 : 0.08;
                    const setupFee = 0.025;
                    const netRevenue = bmBuyOrder * (1 - taxRate - setupFee);
                    const quickProfit = netRevenue - buyPrice;

                    if (quickProfit <= 0) {
                        continue; // Not profitable
                    }

                    // Calculate transport risk
                    const transportRisk = buyCity !== "Caerleon"
                        ? calculateTransportRisk({
                            cargoValue: bmBuyOrder * quantity,
                            craftCost: buyPrice * quantity,
                            mountType: mountType as any,
                            riskProfile: riskProfile as any
                        })
                        : {
                            successProfit: quickProfit * quantity,
                            failureLoss: 0,
                            expectedValue: quickProfit * quantity,
                            breakEvenRate: 0,
                            isRecommended: true,
                            gearCost: 0,
                            survivalRate: 100,
                            riskLevel: 'Safe' as const
                        };

                    // Full profit calculation
                    const calculation = calculateBlackMarketProfit({
                        itemId: item.id,
                        itemName: item.name,
                        buyCity,
                        buyPrice,
                        blackMarketBuyOrder: bmBuyOrder,
                        quantity,
                        isPremium,
                        transportRisk
                    });

                    // Apply filters
                    if (calculation.totalProfit < minProfit) continue;
                    if (calculation.profitMargin < minMargin) continue;
                    if (maxInvestment && calculation.totalCost > maxInvestment) continue;

                    // Fetch volume data
                    const volumeData = await fetchMarketVolume(item.id, "Caerleon");
                    const marketDepth = calculateMarketDepth(volumeData.dailyVolume, quantity);

                    if (volumeData.dailyVolume < minDailyVolume) continue;

                    // Create opportunity
                    const opportunity: BlackMarketFlipOpportunity = {
                        itemId: item.id,
                        itemName: item.name,
                        tier: item.tier,
                        enchantment: item.enchantment || 0,
                        quality: 1, // Default quality

                        buyCity,
                        buyPrice,
                        buyQuantity: cityPrice.sellPriceMax || 1,
                        buyOrderAge,

                        bmBuyOrder,
                        bmQuantity: bmPrice.buyPriceMin || 1,
                        bmOrderAge,

                        isUpgrade: false,

                        profitPerItem: calculation.profitPerItem,
                        totalProfit: calculation.totalProfit,
                        profitMargin: calculation.profitMargin,
                        roi: calculation.roi,
                        totalCost: calculation.totalCost,
                        netRevenue: calculation.netRevenue,

                        dailyVolume: volumeData.dailyVolume,
                        marketDepth: marketDepth.marketDepth,
                        sustainableAmount: marketDepth.sustainableAmount,
                        volumeWarning: marketDepth.volumeWarning,

                        transportRisk,
                        riskAdjustedProfit: calculation.riskAdjustedProfit || calculation.totalProfit,
                        expectedValue: calculation.expectedValue || calculation.totalProfit,
                        isRecommended: calculation.isRecommended !== undefined ? calculation.isRecommended : true
                    };

                    locationOpportunities.push(opportunity);
                }

                // Return best opportunity for this item
                if (locationOpportunities.length > 0) {
                    return locationOpportunities.sort((a, b) => b.riskAdjustedProfit - a.riskAdjustedProfit)[0];
                }

                return null;
            } catch (error) {
                console.error(`Error scanning ${item.name}:`, error);
                return null;
            } finally {
                completed++;
                if (onProgress) {
                    onProgress({
                        total,
                        completed,
                        currentItem: item.name,
                        percentage: (completed / total) * 100
                    });
                }
            }
        });

        const batchResults = await Promise.all(batchPromises);
        const validOpportunities = batchResults.filter((opp): opp is BlackMarketFlipOpportunity => opp !== null);
        opportunities.push(...validOpportunities);

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < itemsToScan.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Sort by risk-adjusted profit (descending)
    return opportunities.sort((a, b) => b.riskAdjustedProfit - a.riskAdjustedProfit);
}

/**
 * Quick scan for top opportunities (popular items only)
 * Faster than full scan, good for quick checks
 * 
 * @param limit - Maximum number of opportunities to return
 * @param isPremium - Premium status
 * @param buyLocations - Cities to buy from
 * @returns Top opportunities
 */
export async function scanTopOpportunities(
    limit: number = 20,
    isPremium: boolean = false,
    buyLocations: string[] = ["Caerleon"]
): Promise<BlackMarketFlipOpportunity[]> {
    const options: ScanOptions = {
        usePopularOnly: true,
        buyLocations,
        minProfit: 1000, // Minimum 1k profit
        minMargin: 5, // Minimum 5% margin
        isPremium,
        quantity: 1
    };

    const opportunities = await scanBlackMarketOpportunities(options);
    return opportunities.slice(0, limit);
}

/**
 * Filter opportunities based on criteria
 * 
 * @param opportunities - Array of opportunities
 * @param filters - Filter criteria
 * @returns Filtered opportunities
 */
export function filterOpportunities(
    opportunities: BlackMarketFlipOpportunity[],
    filters: BlackMarketFilters
): BlackMarketFlipOpportunity[] {
    return opportunities.filter(opp => {
        // Location filters
        if (filters.buyLocations.length > 0 && !filters.buyLocations.includes(opp.buyCity)) {
            return false;
        }

        // Item filters
        if (filters.tiers.length > 0 && !filters.tiers.includes(opp.tier)) {
            return false;
        }

        if (filters.enchantments.length > 0 && !filters.enchantments.includes(opp.enchantment)) {
            return false;
        }

        // Profit filters
        if (opp.totalProfit < filters.minProfit) return false;
        if (opp.profitMargin < filters.minMargin) return false;
        if (filters.maxInvestment && opp.totalCost > filters.maxInvestment) return false;

        // Volume filters
        if (opp.dailyVolume < filters.minDailyVolume) return false;

        if (filters.minMarketDepth !== 'Any') {
            const depthOrder = { 'Low': 0, 'Medium': 1, 'High': 2 };
            if (depthOrder[opp.marketDepth] < depthOrder[filters.minMarketDepth]) {
                return false;
            }
        }

        // Order age filters
        if (opp.buyOrderAge > filters.maxBuyAge) return false;
        if (opp.bmOrderAge > filters.maxBMAge) return false;

        // Risk filters
        if (filters.showOnlyRecommended && !opp.isRecommended) return false;

        // Display filters
        if (filters.hideStaleOrders && (opp.buyOrderAge > 60 || opp.bmOrderAge > 60)) {
            return false;
        }

        if (opp.buyQuantity < filters.minQuantity) return false;

        return true;
    });
}

/**
 * Sort opportunities by different criteria
 */
export function sortOpportunities(
    opportunities: BlackMarketFlipOpportunity[],
    sortBy: 'profit' | 'margin' | 'roi' | 'volume' | 'risk'
): BlackMarketFlipOpportunity[] {
    const sorted = [...opportunities];

    switch (sortBy) {
        case 'profit':
            return sorted.sort((a, b) => b.riskAdjustedProfit - a.riskAdjustedProfit);
        case 'margin':
            return sorted.sort((a, b) => b.profitMargin - a.profitMargin);
        case 'roi':
            return sorted.sort((a, b) => b.roi - a.roi);
        case 'volume':
            return sorted.sort((a, b) => b.dailyVolume - a.dailyVolume);
        case 'risk':
            return sorted.sort((a, b) => {
                const riskOrder = { 'Safe': 0, 'Standard': 1, 'Risky': 2, 'Suicide': 3 };
                return riskOrder[a.transportRisk.riskLevel] - riskOrder[b.transportRisk.riskLevel];
            });
        default:
            return sorted;
    }
}
