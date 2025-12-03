import { MarketPrice } from './types';

// Legacy interface for backward compatibility
export interface AlbionMarketPrice {
    itemId: string;
    city: string;
    sellPriceMin: number;
    sellPriceMax: number;
    buyPriceMin: number;
    buyPriceMax: number;
    bestPrice: number; // Intelligent field: sell_price_min if available, else buy_price_max
    timestamp?: string; // ISO timestamp from API
}

// Price cache to avoid excessive API calls
const priceCache = new Map<string, { data: MarketPrice[]; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current market prices for an item across multiple cities
 * Results are cached for 5 minutes
 */
export async function fetchItemPrices(
    itemId: string,
    cities: string[] = ["Caerleon", "Bridgewatch", "Lymhurst", "Martlock", "Fort Sterling", "Thetford"]
): Promise<AlbionMarketPrice[]> {
    const cacheKey = `${itemId}-${cities.join(',')}`;
    const cached = priceCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        return cached.data as AlbionMarketPrice[];
    }

    try {
        const cityParam = encodeURIComponent(cities.join(","));
        const res = await fetch(
            `https://europe.albion-online-data.com/api/v2/stats/prices/${itemId}?locations=${cityParam}&v=${Date.now()}`,
            {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.timeout(10000) // 10s timeout
            }
        );

        if (!res.ok) {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const prices = data.map((d: any) => {
            const sellMin = d.sell_price_min || 0;
            const buyMax = d.buy_price_max || 0;
            // Use sell_price_min if available (> 0), otherwise fallback to buy_price_max
            const bestPrice = sellMin > 0 ? sellMin : buyMax;

            return {
                itemId: d.item_id,
                city: d.city,
                sellPriceMin: sellMin,
                sellPriceMax: d.sell_price_max || 0,
                buyPriceMin: d.buy_price_min || 0,
                buyPriceMax: buyMax,
                bestPrice: bestPrice,
                timestamp: d.timestamp
            };
        });

        // Cache the results
        priceCache.set(cacheKey, { data: prices, timestamp: Date.now() });

        return prices;
    } catch (error) {
        console.error(`Failed to fetch prices for ${itemId}:`, error);

        // Return cached data even if expired, if available
        if (cached) {
            console.warn('Using stale cache data due to fetch error');
            return cached.data as AlbionMarketPrice[];
        }

        throw error;
    }
}


/**
 * Fetch prices for multiple items at once with rate limiting
 */
export async function fetchMultipleItemPrices(
    itemIds: string[],
    cities: string[] = ["Caerleon", "Bridgewatch", "Lymhurst", "Martlock", "Fort Sterling", "Thetford"]
): Promise<Map<string, AlbionMarketPrice[]>> {
    const results = new Map<string, AlbionMarketPrice[]>();

    // Very conservative rate limiting to avoid 429 errors
    const BATCH_SIZE = 1; // Process one item at a time
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay

    for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
        const batch = itemIds.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (itemId) => {
            try {
                const prices = await fetchItemPrices(itemId, cities);
                return { itemId, prices };
            } catch (error) {
                console.error(`Failed to fetch prices for ${itemId}:`, error);
                return { itemId, prices: [] };
            }
        });

        const batchResults = await Promise.all(promises);
        batchResults.forEach(({ itemId, prices }) => {
            results.set(itemId, prices);
        });

        // Add delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < itemIds.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    return results;
}


/**
 * Calculate marketplace taxes for selling an item
 * @param sellPrice - The price at which the item is being sold
 * @param isPremium - Whether the player has premium status (4% vs 8% sales tax)
 * @param useSellOrder - Whether placing a sell order (adds 2.5% fee) vs instant sell
 * @returns Breakdown of sales tax, order fee, and total tax
 */
export function calculateMarketplaceTax(
    sellPrice: number,
    isPremium: boolean = false,
    useSellOrder: boolean = true
): { salesTax: number; orderFee: number; totalTax: number } {
    const salesTaxRate = isPremium ? 0.04 : 0.08;
    const salesTax = sellPrice * salesTaxRate;
    const orderFee = useSellOrder ? sellPrice * 0.025 : 0;

    return {
        salesTax,
        orderFee,
        totalTax: salesTax + orderFee
    };
}

/**
 * Calculate order fees for buying and selling
 * @param buyPrice - Purchase price
 * @param sellPrice - Selling price
 * @param useBuyOrder - Whether using a buy order
 * @param useSellOrder - Whether using a sell order
 * @returns Buy and sell order fees
 */
export function calculateOrderFees(
    buyPrice: number,
    sellPrice: number,
    useBuyOrder: boolean = true,
    useSellOrder: boolean = true
): { buyOrderFee: number; sellOrderFee: number; totalFees: number } {
    const buyOrderFee = useBuyOrder ? buyPrice * 0.025 : 0;
    const sellOrderFee = useSellOrder ? sellPrice * 0.025 : 0;

    return {
        buyOrderFee,
        sellOrderFee,
        totalFees: buyOrderFee + sellOrderFee
    };
}

/**
 * Fetch market history/volume data for an item
 * @param itemId - Item ID
 * @param city - City name
 * @param timescale - Time period (default: 24 hours)
 * @returns Volume analysis data including history
 */
export async function fetchMarketVolume(
    itemId: string,
    city: string,
    timescale: number = 24
): Promise<{ dailyVolume: number; averagePrice: number; history: any[] }> {
    try {
        const encodedCity = encodeURIComponent(city);
        const res = await fetch(
            `https://europe.albion-online-data.com/api/v2/stats/history/${itemId}?locations=${encodedCity}&time-scale=${timescale}`,
            {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!res.ok) {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }

        const responseData = await res.json();

        if (!responseData || responseData.length === 0) {
            console.warn(`No volume data found for ${itemId} in ${city}`);
            return { dailyVolume: 0, averagePrice: 0, history: [] };
        }

        // The API returns an array with one object containing a 'data' array
        // Structure: [{ location, item_id, quality, data: [{item_count, avg_price, timestamp}] }]
        const historyData = responseData[0]?.data || [];

        if (historyData.length === 0) {
            console.warn(`No history data points for ${itemId} in ${city}`);
            return { dailyVolume: 0, averagePrice: 0, history: [] };
        }

        // Calculate total volume and average price from the data array
        const totalVolume = historyData.reduce((sum: number, d: any) => sum + (d.item_count || 0), 0);
        const totalValue = historyData.reduce((sum: number, d: any) => sum + ((d.avg_price || 0) * (d.item_count || 0)), 0);
        const averagePrice = totalVolume > 0 ? totalValue / totalVolume : 0;

        return {
            dailyVolume: totalVolume,
            averagePrice,
            history: historyData
        };
    } catch (error) {
        console.error(`Failed to fetch volume for ${itemId} in ${city}:`, error);
        return { dailyVolume: 0, averagePrice: 0, history: [] };
    }
}

/**
 * Calculate market depth and sustainability
 * @param dailyVolume - Daily trading volume
 * @param amount - Amount you want to refine/sell
 * @returns Market depth analysis
 */
export function calculateMarketDepth(
    dailyVolume: number,
    amount: number
): {
    marketDepth: 'High' | 'Medium' | 'Low';
    sustainableAmount: number;
    volumeWarning?: string;
    saturationRatio: number;
    sellTimeHours: number;
} {
    // Rule of thumb: Don't sell more than 10% of daily volume at once
    const sustainableAmount = Math.floor(dailyVolume * 0.1);
    const saturationRatio = dailyVolume > 0 ? amount / dailyVolume : 1;
    const sellTimeHours = dailyVolume > 0 ? (amount / dailyVolume) * 24 : 24;

    let marketDepth: 'High' | 'Medium' | 'Low' = 'Medium';
    let volumeWarning: string | undefined;

    if (dailyVolume === 0) {
        marketDepth = 'Low';
        volumeWarning = 'No recent trading activity detected. Market may be illiquid.';
    } else if (dailyVolume < 100) {
        marketDepth = 'Low';
        volumeWarning = 'Very low trading volume. Selling large amounts may crash the market.';
    } else if (dailyVolume < 1000) {
        marketDepth = 'Medium';
        if (amount > sustainableAmount) {
            volumeWarning = `Your amount (${amount}) exceeds recommended limit (${sustainableAmount}).`;
        }
    } else {
        marketDepth = 'High';
    }

    return {
        marketDepth,
        sustainableAmount,
        volumeWarning,
        saturationRatio,
        sellTimeHours
    };
}

/**
 * Calculate price trend based on historical data
 * @param history - Array of historical data points
 * @returns Trend analysis
 */
export function calculatePriceTrend(history: any[]): {
    trend: 'Up' | 'Down' | 'Stable';
    changePercentage: number;
    volatility: 'High' | 'Medium' | 'Low';
    recommendation: string;
} {
    if (!history || history.length < 3) {
        return { trend: 'Stable', changePercentage: 0, volatility: 'Low', recommendation: 'Insufficient Data' };
    }

    // Sort by date ascending just in case
    const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Get last 3 days and last 7 days (if available)
    const last3Days = sorted.slice(-3);
    const last7Days = sorted.slice(-7);

    // Calculate Simple Moving Averages (SMA)
    const sma3 = last3Days.reduce((sum, d) => sum + d.avg_price, 0) / last3Days.length;
    const sma7 = last7Days.reduce((sum, d) => sum + d.avg_price, 0) / last7Days.length;

    const currentPrice = sorted[sorted.length - 1].avg_price;

    // Trend Logic
    let trend: 'Up' | 'Down' | 'Stable' = 'Stable';
    if (currentPrice > sma3 && sma3 > sma7) {
        trend = 'Up';
    } else if (currentPrice < sma3 && sma3 < sma7) {
        trend = 'Down';
    }

    // Change Percentage (Current vs 7-day average)
    const changePercentage = ((currentPrice - sma7) / sma7) * 100;

    // Volatility (Standard Deviation of last 7 days)
    const variance = last7Days.reduce((sum, d) => sum + Math.pow(d.avg_price - sma7, 2), 0) / last7Days.length;
    const stdDev = Math.sqrt(variance);
    const volatilityRatio = stdDev / sma7;

    let volatility: 'High' | 'Medium' | 'Low' = 'Low';
    if (volatilityRatio > 0.15) volatility = 'High';
    else if (volatilityRatio > 0.05) volatility = 'Medium';

    // Recommendation
    let recommendation = 'Hold';
    if (trend === 'Up' && volatility !== 'High') recommendation = 'Sell Now';
    else if (trend === 'Down') recommendation = 'Wait / Don\'t Sell';
    else if (volatility === 'High') recommendation = 'Risky - Check Orders';

    return {
        trend,
        changePercentage,
        volatility,
        recommendation
    };
}

/**
 * Clear the price cache (useful for forcing fresh data)
 */
export function clearPriceCache(): void {
    priceCache.clear();
}

/**
 * Calculate order age in minutes from ISO timestamp.
 * @param timestamp - ISO timestamp string
 * @returns Age in minutes
 */
export function getOrderAge(timestamp: string | undefined): number {
    if (!timestamp) return 999; // Return high value if no timestamp

    try {
        const now = new Date();
        const orderTime = new Date(timestamp);
        const ageMs = now.getTime() - orderTime.getTime();
        return Math.floor(ageMs / 60000); // Convert to minutes
    } catch (error) {
        console.error('Invalid timestamp:', timestamp);
        return 999;
    }
}

/**
 * Fetch Black Market flip opportunities for given items.
 * Compares buy prices in specified cities with sell prices in Black Market.
 * 
 * @param itemIds - Array of item IDs to check
 * @param buyLocations - Cities to buy from (e.g., Caerleon, Royal Cities)
 * @returns Map of item IDs to their flip opportunities
 */
export async function fetchBlackMarketFlips(
    itemIds: string[],
    buyLocations: string[] = ["Caerleon"]
): Promise<Map<string, { buyCity: string; buyPrice: number; buyAge: number; sellPrice: number; sellAge: number; quantity: number }[]>> {
    const results = new Map<string, any[]>();

    // Fetch prices for all buy locations + Black Market
    const allLocations = [...buyLocations, "Black Market"];
    const priceData = await fetchMultipleItemPrices(itemIds, allLocations);

    priceData.forEach((cityPrices, itemId) => {
        const opportunities: any[] = [];

        // Find Black Market buy orders (where we sell)
        const bmPrices = cityPrices.find(p => p.city === "Black Market");
        if (!bmPrices || bmPrices.buyPriceMax === 0) return; // No BM buy orders

        const bmBuyPrice = bmPrices.buyPriceMax;
        const bmAge = getOrderAge(bmPrices.timestamp);

        // Check each buy location for sell orders (where we buy)
        buyLocations.forEach(city => {
            const cityPrice = cityPrices.find(p => p.city === city);
            if (!cityPrice || cityPrice.sellPriceMin === 0) return; // No sell orders

            const buyCost = cityPrice.sellPriceMin;
            const buyAge = getOrderAge(cityPrice.timestamp);

            // Only include if there's potential profit
            if (bmBuyPrice > buyCost) {
                opportunities.push({
                    buyCity: city,
                    buyPrice: buyCost,
                    buyAge,
                    sellPrice: bmBuyPrice,
                    sellAge: bmAge,
                    quantity: Math.min(cityPrice.sellPriceMax || 1, bmPrices.buyPriceMin || 1)
                });
            }
        });

        if (opportunities.length > 0) {
            results.set(itemId, opportunities);
        }
    });

    return results;
}

