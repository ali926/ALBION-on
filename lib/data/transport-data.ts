/**
 * Transport optimization data for Albion Online
 * Includes weight calculations, city distances, and risk assessments
 */

export interface TransportRoute {
    fromCity: string;
    toCity: string;
    distance: number; // Approximate zones to travel
    riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Extreme';
    estimatedTime: number; // Minutes
}

export interface ItemWeight {
    baseWeight: number; // kg per unit
    stackSize: number; // Max stack size
}

// Item weight data (approximate values based on Albion Online)
export const ITEM_WEIGHTS: Record<string, number> = {
    // Raw Resources (per unit)
    ORE: 0.5,
    FIBER: 0.3,
    HIDE: 0.4,
    WOOD: 0.6,
    ROCK: 0.8,

    // Refined Resources (per unit)
    METALBAR: 0.8,
    CLOTH: 0.5,
    LEATHER: 0.6,
    PLANKS: 0.9,
    STONEBLOCK: 1.2
};

// City-to-city distances (approximate zones)
// This is a simplified model - actual routes may vary
export const CITY_DISTANCES: Record<string, Record<string, number>> = {
    'Fort Sterling': {
        'Fort Sterling': 0,
        'Thetford': 8,
        'Lymhurst': 10,
        'Bridgewatch': 12,
        'Martlock': 9,
        'Caerleon': 6
    },
    'Thetford': {
        'Fort Sterling': 8,
        'Thetford': 0,
        'Lymhurst': 9,
        'Bridgewatch': 11,
        'Martlock': 10,
        'Caerleon': 7
    },
    'Lymhurst': {
        'Fort Sterling': 10,
        'Thetford': 9,
        'Lymhurst': 0,
        'Bridgewatch': 8,
        'Martlock': 11,
        'Caerleon': 6
    },
    'Bridgewatch': {
        'Fort Sterling': 12,
        'Thetford': 11,
        'Lymhurst': 8,
        'Bridgewatch': 0,
        'Martlock': 9,
        'Caerleon': 7
    },
    'Martlock': {
        'Fort Sterling': 9,
        'Thetford': 10,
        'Lymhurst': 11,
        'Bridgewatch': 9,
        'Martlock': 0,
        'Caerleon': 6
    },
    'Caerleon': {
        'Fort Sterling': 6,
        'Thetford': 7,
        'Lymhurst': 6,
        'Bridgewatch': 7,
        'Martlock': 6,
        'Caerleon': 0
    }
};

// Risk levels based on typical routes
// This is simplified - actual risk depends on current game state
export const ROUTE_RISKS: Record<string, Record<string, TransportRoute['riskLevel']>> = {
    'Fort Sterling': {
        'Fort Sterling': 'Safe',
        'Thetford': 'Medium',
        'Lymhurst': 'Medium',
        'Bridgewatch': 'High',
        'Martlock': 'Medium',
        'Caerleon': 'High'
    },
    'Thetford': {
        'Fort Sterling': 'Medium',
        'Thetford': 'Safe',
        'Lymhurst': 'Medium',
        'Bridgewatch': 'Medium',
        'Martlock': 'Medium',
        'Caerleon': 'High'
    },
    'Lymhurst': {
        'Fort Sterling': 'Medium',
        'Thetford': 'Medium',
        'Lymhurst': 'Safe',
        'Bridgewatch': 'Low',
        'Martlock': 'Medium',
        'Caerleon': 'High'
    },
    'Bridgewatch': {
        'Fort Sterling': 'High',
        'Thetford': 'Medium',
        'Lymhurst': 'Low',
        'Bridgewatch': 'Safe',
        'Martlock': 'Medium',
        'Caerleon': 'High'
    },
    'Martlock': {
        'Fort Sterling': 'Medium',
        'Thetford': 'Medium',
        'Lymhurst': 'Medium',
        'Bridgewatch': 'Medium',
        'Martlock': 'Safe',
        'Caerleon': 'High'
    },
    'Caerleon': {
        'Fort Sterling': 'High',
        'Thetford': 'High',
        'Lymhurst': 'High',
        'Bridgewatch': 'High',
        'Martlock': 'High',
        'Caerleon': 'Safe'
    }
};

/**
 * Get the weight of an item type
 * @param itemId - Item ID (e.g., 'T4_ORE', 'T5_METALBAR')
 * @param amount - Number of units
 * @returns Total weight in kg
 */
export function getItemWeight(itemId: string, amount: number): number {
    // Extract resource type from item ID
    const resourceType = itemId.split('_')[1]?.split('@')[0] || '';
    const baseWeight = ITEM_WEIGHTS[resourceType] || 1.0;

    return baseWeight * amount;
}

/**
 * Get transport route information between two cities
 * @param fromCity - Origin city
 * @param toCity - Destination city
 * @returns Transport route details
 */
export function getTransportRoute(fromCity: string, toCity: string): TransportRoute {
    const distance = CITY_DISTANCES[fromCity]?.[toCity] || 0;
    const riskLevel = ROUTE_RISKS[fromCity]?.[toCity] || 'Medium';
    const estimatedTime = distance * 2; // Rough estimate: 2 minutes per zone

    return {
        fromCity,
        toCity,
        distance,
        riskLevel,
        estimatedTime
    };
}

/**
 * Calculate transport cost based on distance and cargo value
 * This is a simplified model - actual costs may vary
 * @param distance - Distance in zones
 * @param cargoValue - Total value of cargo in silver
 * @param riskLevel - Risk level of the route
 * @returns Estimated transport cost in silver
 */
export function calculateTransportCost(
    distance: number,
    cargoValue: number,
    riskLevel: TransportRoute['riskLevel']
): number {
    // Base cost: 100 silver per zone
    const baseCost = distance * 100;

    // Risk multiplier (opportunity cost of potential loss)
    const riskMultipliers = {
        'Safe': 0,
        'Low': 0.01,
        'Medium': 0.03,
        'High': 0.05,
        'Extreme': 0.10
    };

    const riskCost = cargoValue * (riskMultipliers[riskLevel] || 0.03);

    return baseCost + riskCost;
}

/**
 * Get risk level as a numeric value for calculations
 * @param riskLevel - Risk level string
 * @returns Numeric risk value (0-1)
 */
export function getRiskValue(riskLevel: TransportRoute['riskLevel']): number {
    const riskValues = {
        'Safe': 0,
        'Low': 0.1,
        'Medium': 0.3,
        'High': 0.5,
        'Extreme': 0.8
    };

    return riskValues[riskLevel] || 0.3;
}

/**
 * Calculate optimal transport route considering multiple factors
 * @param buyCity - City to buy materials
 * @param refineCity - City to refine (may have bonus)
 * @param sellCity - City to sell products
 * @param totalWeight - Total cargo weight
 * @param totalValue - Total cargo value
 * @returns Optimal route analysis
 */
export function analyzeTransportRoute(
    buyCity: string,
    refineCity: string,
    sellCity: string,
    totalWeight: number,
    totalValue: number
): {
    route1: TransportRoute; // Buy → Refine
    route2: TransportRoute; // Refine → Sell
    totalDistance: number;
    totalTime: number;
    totalCost: number;
    overallRisk: TransportRoute['riskLevel'];
} {
    const route1 = getTransportRoute(buyCity, refineCity);
    const route2 = getTransportRoute(refineCity, sellCity);

    const totalDistance = route1.distance + route2.distance;
    const totalTime = route1.estimatedTime + route2.estimatedTime;

    const cost1 = calculateTransportCost(route1.distance, totalValue * 0.5, route1.riskLevel);
    const cost2 = calculateTransportCost(route2.distance, totalValue, route2.riskLevel);
    const totalCost = cost1 + cost2;

    // Overall risk is the higher of the two routes
    const risk1Value = getRiskValue(route1.riskLevel);
    const risk2Value = getRiskValue(route2.riskLevel);
    const maxRiskValue = Math.max(risk1Value, risk2Value);

    let overallRisk: TransportRoute['riskLevel'] = 'Medium';
    if (maxRiskValue === 0) overallRisk = 'Safe';
    else if (maxRiskValue <= 0.1) overallRisk = 'Low';
    else if (maxRiskValue <= 0.3) overallRisk = 'Medium';
    else if (maxRiskValue <= 0.5) overallRisk = 'High';
    else overallRisk = 'Extreme';

    return {
        route1,
        route2,
        totalDistance,
        totalTime,
        totalCost,
        overallRisk
    };
}
