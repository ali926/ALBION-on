// Core Albion Online Type Definitions

import { TransportRiskOutput } from './transport-calculator';


export enum City {
    CAERLEON = "Caerleon",
    BRIDGEWATCH = "Bridgewatch",
    LYMHURST = "Lymhurst",
    MARTLOCK = "Martlock",
    FORT_STERLING = "Fort Sterling",
    THETFORD = "Thetford",
    BLACK_MARKET = "Black Market"
}

export enum ItemType {
    WEAPON = "Weapon",
    HEAD_ARMOR = "Head Armor",
    CHEST_ARMOR = "Chest Armor",
    FEET_ARMOR = "Feet Armor",
    RESOURCE = "Resource",
    REFINED_RESOURCE = "Refined Resource",
    CONSUMABLE = "Consumable",
    OTHER = "Other"
}

export interface Item {
    id: string;
    name: string;
    tier: number;
    enchantment?: number; // 0, 1, 2, 3, 4
    type: ItemType | string;
    iconUrl?: string;
    baseValue: number;
}

export interface Material {
    itemId: string;
    amount: number;
}

export interface Recipe {
    id: string;
    resultItemId: string;
    materials: Material[];
    craftingStation: string;
    batchSize: number;
}

export interface MarketPrice {
    itemId: string;
    city: string;
    sellPriceMin: number;
    sellPriceMax: number;
    buyPriceMin: number;
    buyPriceMax: number;
    timestamp?: string;
    sellPriceMinDate?: string; // ISO timestamp for sell order
    buyPriceMaxDate?: string; // ISO timestamp for buy order
}


export interface PriceHistory {
    itemId: string;
    city: string;
    timestamp: number;
    itemCount: number;
    averagePrice: number;
}

export interface RefiningInput {
    resourceItemId: string;
    tier: number;
    enchantment: number;
    amount: number;
    city: City | string;
    usageFee: number;
    returnRate: number; // 15.2% to 53.9% based on spec
    nutritionFactor?: number; // 0% to 50% based on food
    isPremium?: boolean; // Premium status affects marketplace tax (4% vs 8%)
    useFocus?: boolean;
    focusEfficiency?: number; // 0 to 30000
}

export interface RefiningOutput {
    rawMaterialsNeeded: number;
    refinedMaterialNeeded: number; // Amount of lower tier refined resource needed
    tax: number;
    estimatedOutput: number;
    costPerRefined: number;
    totalCost: number;
    // Market analysis
    buyPriceRaw?: number;
    buyPriceRefined?: number; // Price of lower tier refined input
    sellPrice?: number;
    grossProfit?: number;
    netProfit?: number;
    profitMargin?: number;
    focusCost?: number;
    profitPerFocus?: number;
    // Advanced features
    cityBonus?: CityBonusInfo;
    profitWithoutBonus?: number; // Profit comparison
    transport?: TransportInfo;
    metrics?: RefiningMetrics;
    volume?: VolumeAnalysis;
}

export interface CraftingInput {
    recipeId: string;
    city: City | string;
    usageFee: number;
    materialPrices: { [itemId: string]: number };
    resultItemPrice: number;
    focusCost?: number;
    isPremium?: boolean; // Premium status affects marketplace tax (4% vs 8%)
    useFocus?: boolean;
    focusEfficiency?: number;
}

export interface CraftingOutput {
    materialCosts: { itemId: string; amount: number; cost: number }[];
    tax: number;
    totalCost: number;
    resultPrice: number;
    grossProfit: number;
    netProfit: number; // after marketplace tax
    profitMargin: number;
    focusCost?: number;
    profitPerFocus?: number;
}

// Market Flipping Types

export interface FlipOpportunity {
    // Item identification
    itemId: string;
    itemName: string;
    tier: number;
    enchantment: number;
    quality: number;

    // Buy side
    buyLocation: string;
    buyPrice: number;
    buyQuantity: number;
    buyOrderAge: number; // minutes since last update

    // Sell side (usually Black Market)
    sellLocation: string;
    sellPrice: number;
    sellQuantity: number;
    sellOrderAge: number; // minutes since last update

    // Upgrade flip specific
    isUpgrade: boolean;
    baseEnchantment?: number;
    targetEnchantment?: number;
    upgradeMaterials?: UpgradeMaterial[];

    // Calculated metrics
    profitPerItem: number;
    totalProfit: number;
    profitMargin: number; // percentage
    roi: number; // return on investment
    totalCost: number;
    netSellPrice: number;

    // Risk assessment
    transportRisk?: TransportRiskOutput;
    marketDepth?: 'High' | 'Medium' | 'Low';
}

export interface UpgradeMaterial {
    itemId: string;
    itemName: string;
    quantity: number;
    pricePerUnit: number;
    totalCost: number;
    availableStock?: number; // user's inventory
}

export interface FlipFilters {
    // Location filters
    buyLocations: string[];
    sellLocations: string[]; // Usually just Black Market

    // Item filters
    tiers: number[];
    enchantments: number[];
    qualities: number[];
    categories: string[];

    // Profit filters
    minProfit: number;
    minMargin: number;
    maxInvestment: number;

    // Order age filters (freshness)
    maxBuyAge: number; // minutes
    maxSellAge: number; // minutes

    // Upgrade flip filters
    showUpgrades: boolean;
    upgradeFrom: number[]; // source enchantments
    upgradeTo: number[]; // target enchantments
    maxRuneCount: number;
    hideMissingMats: boolean;

    // Display filters
    hideConsumed: boolean;
    hideDuplicates: boolean;
    minQuantity: number;
}


export interface MarketTax {
    salesTax: number; // 4% for premium, 8% for non-premium
    sellOrderFee: number; // 2.5% when placing sell order
    buyOrderFee: number; // 2.5% when placing buy order
    totalTax: number;
}

// Advanced Refining Features

export interface CityBonusInfo {
    city: string;
    resourceType: string;
    bonusPercentage: number; // Specialization bonus (40%)
    productionBonus?: number; // Total production bonus (base + specialization + focus)
    effectiveReturnRate?: number; // Calculated return rate from production bonus
    bonusSilver?: number; // Silver value of the bonus
}

export interface TransportInfo {
    fromCity: string;
    toCity: string;
    distance: number; // zones
    weight: number; // kg
    riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Extreme';
    estimatedCost: number; // silver
    estimatedTime: number; // minutes
}

export interface VolumeAnalysis {
    itemId: string;
    city: string;
    dailyVolume: number;
    sustainableAmount: number; // Max amount before market collapse
    marketDepth: 'High' | 'Medium' | 'Low';
    volumeWarning?: string;
}

export interface RefiningMetrics {
    profitPerUnit: number; // Silver per refined item
    profitPerFocus?: number; // Silver per focus point (if using focus)
    profitPerBatch: { // Profit for common batch sizes
        batch10: number;
        batch100: number;
        batch1000: number;
    };
    silverPerHour?: number; // Estimated silver/hour
}

export interface CartItem {
    id: string; // Unique ID for the cart entry
    recipeId: string;
    itemName: string;
    amount: number;
    craftCity: string;
    sellCity: string;
    totalCost: number;
    revenue: number;
    profit: number;
    materials: { itemId: string; amount: number; cost: number }[]; // Net materials needed
    timestamp: number;
}

// Black Market Types

export interface BlackMarketFlipOpportunity {
    // Item identification
    itemId: string;
    itemName: string;
    tier: number;
    enchantment: number;
    quality: number;

    // Buy side (source city)
    buyCity: string;
    buyPrice: number;
    buyQuantity: number;
    buyOrderAge: number; // minutes since last update

    // Black Market side (always Caerleon)
    bmBuyOrder: number; // Price BM is willing to pay
    bmQuantity: number;
    bmOrderAge: number;

    // Upgrade flip specific
    isUpgrade: boolean;
    baseEnchantment?: number;
    targetEnchantment?: number;
    upgradeMaterials?: {
        itemId: string;
        itemName: string;
        quantity: number;
        pricePerUnit: number;
        totalCost: number;
    }[];

    // Profit metrics
    profitPerItem: number;
    totalProfit: number;
    profitMargin: number; // percentage
    roi: number;
    totalCost: number;
    netRevenue: number;

    // Market analysis
    dailyVolume: number;
    marketDepth: 'High' | 'Medium' | 'Low';
    sustainableAmount: number;
    volumeWarning?: string;

    // Risk assessment
    transportRisk: TransportRiskOutput;
    riskAdjustedProfit: number;
    expectedValue: number;
    isRecommended: boolean;
}

export interface BlackMarketFilters {
    // Location filters
    buyLocations: string[]; // Cities to buy from (Caerleon, Royal Cities)

    // Item filters
    tiers: number[];
    enchantments: number[];
    qualities: number[];
    categories: string[];

    // Profit filters
    minProfit: number;
    minMargin: number; // percentage
    maxInvestment: number;

    // Volume filters
    minDailyVolume: number;
    minMarketDepth: 'High' | 'Medium' | 'Low' | 'Any';

    // Order age filters (freshness)
    maxBuyAge: number; // minutes
    maxBMAge: number; // minutes

    // Risk filters
    maxRiskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Any';
    showOnlyRecommended: boolean;

    // Upgrade flip filters
    showUpgrades: boolean;
    upgradeFrom: number[]; // source enchantments
    upgradeTo: number[]; // target enchantments

    // Display filters
    hideStaleOrders: boolean;
    minQuantity: number;
}

export interface VolumeChartData {
    timestamps: string[];
    volumes: number[];
    averagePrices: number[];
}

export interface SupplyDemandAnalysis {
    currentSupply: number; // Items available to buy in cities
    currentDemand: number; // BM buy orders
    supplyDemandRatio: number;
    trend: 'Oversupply' | 'Balanced' | 'High Demand';
    recommendation: string;
}
