"use client";

import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import OpportunityScanner from '../../components/OpportunityScanner';
import VolumeChart from '../../components/VolumeChart';
import RouteMap from '../../components/RouteMap';
import {
    calculateBlackMarketProfit,
    compareMarkets,
    BlackMarketCalculationInput,
    BlackMarketCalculationOutput
} from '../../lib/black-market-calculator';
import {
    getAllBlackMarketItems,
    getPopularBMItems,
    getAllCategories
} from '../../lib/item-generator';
import { fetchItemPrices, fetchMarketVolume, calculateMarketDepth } from '../../lib/market';
import { calculateTransportRisk, MountType, RiskProfile, MOUNT_DATA, RISK_PROFILES } from '../../lib/transport-calculator';
import { City, Item, BlackMarketFlipOpportunity } from '../../lib/types';
import recipesData from '../../lib/data/recipes.json';
import { calculateCraftingOutput } from '../../lib/crafting-calculator';

const TIERS = [3, 4, 5, 6, 7, 8];
const ENCHANTMENTS = [0, 1, 2, 3];

export default function BlackMarketPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState<'calculator' | 'scanner'>('calculator');

    // Item Selection
    const [allItems] = useState<Item[]>(() => getAllBlackMarketItems());
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [tierFilter, setTierFilter] = useState<number | 'All'>('All');
    const [enchantmentFilter, setEnchantmentFilter] = useState<number | 'All'>('All');

    // Settings
    const [buyCity, setBuyCity] = useState<string>(City.CAERLEON);
    const [quantity, setQuantity] = useState<number>(1);
    const [isPremium, setIsPremium] = useState<boolean>(false);

    // Transport Risk
    const [mountType, setMountType] = useState<MountType>('Ox');
    const [riskProfile, setRiskProfile] = useState<RiskProfile>('Standard');

    // Crafting Mode State
    const [mode, setMode] = useState<'flipping' | 'crafting'>('flipping');
    const [craftCity, setCraftCity] = useState<string>(City.MARTLOCK);
    const [usageFee, setUsageFee] = useState<number>(500);
    const [useFocus, setUseFocus] = useState<boolean>(false);
    const [craftingCost, setCraftingCost] = useState<number>(0);
    const [recipe, setRecipe] = useState<any>(null);

    // Data
    const [loading, setLoading] = useState(false);
    const [buyPrice, setBuyPrice] = useState<number>(0);
    const [bmBuyOrder, setBmBuyOrder] = useState<number>(0);
    const [regularMarketPrice, setRegularMarketPrice] = useState<number>(0);
    const [result, setResult] = useState<BlackMarketCalculationOutput | null>(null);
    const [volumeData, setVolumeData] = useState<{
        dailyVolume: number;
        marketDepth: 'High' | 'Medium' | 'Low';
        sustainableAmount: number;
        warning?: string;
        history?: any[];
    } | null>(null);

    // Filtered Items
    const filteredItems = allItems.filter(item => {
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (categoryFilter !== 'All' && item.type !== categoryFilter) return false;
        if (tierFilter !== 'All' && item.tier !== tierFilter) return false;
        if (enchantmentFilter !== 'All' && item.enchantment !== enchantmentFilter) return false;
        return true;
    });

    // Fetch Prices
    const handleFetchPrices = async () => {
        if (!selectedItem) return;

        setLoading(true);
        try {
            if (mode === 'crafting') {
                // Find recipe for the selected item
                const foundRecipe = (recipesData as any[]).find(
                    r => r.resultItemId === selectedItem.id
                );

                if (!foundRecipe) {
                    console.error('No recipe found for item:', selectedItem.id);
                    alert(`No recipe found for ${selectedItem.name}. This item may not be craftable.`);
                    setLoading(false);
                    return;
                }

                setRecipe(foundRecipe);

                // Fetch material prices from crafting city
                const materialPricesMap: Record<string, number> = {};
                for (const mat of foundRecipe.materials) {
                    const prices = await fetchItemPrices(mat.itemId, [craftCity]);
                    const priceData = prices.find(p => p.city === craftCity);
                    materialPricesMap[mat.itemId] = priceData?.sellPriceMin || 0;
                }

                // Fetch Black Market buy order for the crafted item
                const bmPrices = await fetchItemPrices(selectedItem.id, ["Black Market"]);
                const bmPrice = bmPrices.find(p => p.city === "Black Market");
                setBmBuyOrder(bmPrice?.buyPriceMax || 0);

                // Calculate crafting cost using the crafting calculator
                const craftingOutput = calculateCraftingOutput({
                    recipe: {
                        itemId: foundRecipe.resultItemId,
                        materials: foundRecipe.materials,
                        baseFocusCost: foundRecipe.baseFocusCost || 0
                    },
                    amount: quantity,
                    craftCity,
                    sellCity: City.CAERLEON,
                    sellToBlackMarket: false,
                    useFocus,
                    focusSpecialization: 0,
                    isPremium,
                    usageFee,
                    materialPrices: materialPricesMap,
                    outputPrice: bmPrice?.buyPriceMax || 0
                });

                // Set the total crafting cost
                setCraftingCost(craftingOutput.totalCost);
                setBuyPrice(craftingOutput.totalCost);

                // Fetch volume data
                const volume = await fetchMarketVolume(selectedItem.id, City.CAERLEON);
                const depth = calculateMarketDepth(volume.dailyVolume, quantity);
                setVolumeData({
                    dailyVolume: volume.dailyVolume,
                    marketDepth: depth.marketDepth,
                    sustainableAmount: depth.sustainableAmount,
                    warning: depth.volumeWarning,
                    history: volume.history
                });
            } else {
                // Flipping mode - original logic
                const cities = buyCity === City.CAERLEON
                    ? [City.CAERLEON, "Black Market"]
                    : [buyCity, City.CAERLEON, "Black Market"];

                const prices = await fetchItemPrices(selectedItem.id, cities);

                // Get buy price from selected city
                const buyCityPrice = prices.find(p => p.city === buyCity);
                setBuyPrice(buyCityPrice?.sellPriceMin || 0);

                // Get Black Market buy order (what BM pays)
                const bmPrice = prices.find(p => p.city === "Black Market");
                setBmBuyOrder(bmPrice?.buyPriceMax || 0);

                // Get regular market price for comparison
                const caerleonPrice = prices.find(p => p.city === City.CAERLEON);
                setRegularMarketPrice(caerleonPrice?.sellPriceMin || 0);

                // Fetch volume data
                const volume = await fetchMarketVolume(selectedItem.id, City.CAERLEON);
                const depth = calculateMarketDepth(volume.dailyVolume, quantity);
                setVolumeData({
                    dailyVolume: volume.dailyVolume,
                    marketDepth: depth.marketDepth,
                    sustainableAmount: depth.sustainableAmount,
                    warning: depth.volumeWarning,
                    history: volume.history
                });
            }

        } catch (error) {
            console.error('Failed to fetch prices:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Profit
    const handleCalculate = () => {
        if (!selectedItem || buyPrice === 0 || bmBuyOrder === 0) return;

        // Calculate transport risk if buying from different city (only in flipping mode)
        const transportRisk = mode === 'flipping' && buyCity !== City.CAERLEON
            ? calculateTransportRisk({
                cargoValue: bmBuyOrder * quantity,
                craftCost: buyPrice * quantity,
                mountType,
                riskProfile
            })
            : undefined;

        const input: BlackMarketCalculationInput = {
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            buyCity: mode === 'crafting' ? craftCity : buyCity,
            buyPrice,
            blackMarketBuyOrder: bmBuyOrder,
            quantity,
            isPremium,
            transportRisk,
            isCrafted: mode === 'crafting',
            craftingCost: mode === 'crafting' ? craftingCost : undefined,
            craftCity: mode === 'crafting' ? craftCity : undefined
        };

        const calculation = calculateBlackMarketProfit(input);

        // Add market comparison if we have regular market price
        if (regularMarketPrice > 0) {
            const comparison = compareMarkets(bmBuyOrder, regularMarketPrice, isPremium);
            calculation.regularMarketPrice = regularMarketPrice;
            calculation.regularMarketProfit = comparison.regularNetPrice * quantity - (buyPrice * quantity);
            calculation.profitDifference = comparison.difference * quantity;
            calculation.recommendSellTo = comparison.betterMarket;
        }

        setResult(calculation);
    };

    // Handle selecting an opportunity from the scanner
    const handleSelectOpportunity = (opp: BlackMarketFlipOpportunity) => {
        // Find the item object
        const item = allItems.find(i => i.id === opp.itemId);
        if (item) {
            setSelectedItem(item);
            setSearchTerm(item.name);
            setBuyCity(opp.buyCity);
            setMode('flipping'); // Switch to flipping mode
            setActiveTab('calculator');
        }
    };

    return (
        <div className="max-w-7xl mx-auto slide-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <span className="text-purple-500">☠️</span>
                    <span className="bg-gradient-to-r from-purple-500 via-red-500 to-black bg-clip-text text-transparent">
                        Shadow Market
                    </span>
                </h1>
                <p className="text-gray-400">
                    Calculate profits from the Black Market in Caerleon - Craft or Flip for maximum gains
                </p>

                {/* Tabs with Shadow Slide Effect */}
                <div className="flex space-x-4 mt-6 border-b border-gray-700">
                    <button
                        className={`tab-slide pb-2 px-4 font-medium transition-colors ${activeTab === 'calculator'
                            ? 'text-purple-400 active'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('calculator')}
                    >
                        💰 Shadow Calculator
                    </button>
                    <button
                        className={`tab-slide pb-2 px-4 font-medium transition-colors ${activeTab === 'scanner'
                            ? 'text-purple-400 active'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('scanner')}
                    >
                        🔍 Smuggler Scanner
                    </button>
                </div>
            </div>

            {activeTab === 'scanner' ? (
                <OpportunityScanner
                    isPremium={isPremium}
                    onSelectOpportunity={handleSelectOpportunity}
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Panel */}
                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-gray-100">Item Selection & Settings</h2>

                        {/* Mode Toggle */}
                        <div className="flex bg-gray-800 p-1 rounded-lg mb-4">
                            <button
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'flipping' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                onClick={() => setMode('flipping')}
                            >
                                📉 Flipping
                            </button>
                            <button
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'crafting' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                onClick={() => setMode('crafting')}
                            >
                                🔨 Crafting
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Category</label>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="select-field text-xs py-1"
                                        >
                                            <option value="All">All</option>
                                            {getAllCategories().map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Tier</label>
                                        <select
                                            value={tierFilter}
                                            onChange={(e) => setTierFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                                            className="select-field text-xs py-1"
                                        >
                                            <option value="All">All</option>
                                            {TIERS.map(t => <option key={t} value={t}>T{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Enchant</label>
                                        <select
                                            value={enchantmentFilter}
                                            onChange={(e) => setEnchantmentFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                                            className="select-field text-xs py-1"
                                        >
                                            <option value="All">All</option>
                                            {ENCHANTMENTS.map(e => <option key={e} value={e}>{e === 0 ? 'Flat' : `.${e}`}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Search - Shadow BM Input */}
                                <div>
                                    <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                                        🔮 Shadow Search
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="☠️ Search Black Market items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="forged-input bg-gradient-to-r from-purple-900/20 to-black/40 border-purple-700 focus:border-purple-500"
                                    />
                                </div>

                                {/* Item List */}
                                <div className="max-h-48 overflow-y-auto custom-scrollbar bg-gray-900 rounded border border-gray-700">
                                    {filteredItems.length > 0 ? (
                                        filteredItems.slice(0, 50).map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-700 ${selectedItem?.id === item.id ? 'bg-gray-700 text-gold' : 'text-gray-300'
                                                    }`}
                                            >
                                                {item.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                            No items found
                                        </div>
                                    )}
                                    {filteredItems.length > 50 && (
                                        <div className="px-3 py-2 text-xs text-gray-500 text-center border-t border-gray-700">
                                            Showing 50 of {filteredItems.length} items. Refine your search.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Item Display */}
                            {selectedItem && (
                                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Selected Item</div>
                                    <div className="text-lg font-bold text-gold">{selectedItem.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">ID: {selectedItem.id}</div>
                                </div>
                            )}

                            {/* Buy City / Crafting Settings */}
                            {mode === 'flipping' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Buy From & Transport Route
                                    </label>

                                    <div className="mb-4 bg-gray-900/50 rounded-lg p-2 border border-gray-700">
                                        <RouteMap
                                            selectedCity={buyCity}
                                            onSelectCity={(city) => setBuyCity(city)}
                                        />
                                    </div>

                                    <select
                                        value={buyCity}
                                        onChange={(e) => setBuyCity(e.target.value)}
                                        className="select-field"
                                    >
                                        {Object.values(City).filter(c => c !== City.BLACK_MARKET).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    {buyCity !== City.CAERLEON && (
                                        <p className="text-xs text-yellow-400 mt-1">
                                            ⚠️ Requires transport through Red Zones
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Crafting City
                                        </label>
                                        <select
                                            value={craftCity}
                                            onChange={(e) => setCraftCity(e.target.value)}
                                            className="select-field"
                                        >
                                            {Object.values(City).filter(c => c !== City.BLACK_MARKET).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Usage Fee
                                            </label>
                                            <input
                                                type="number"
                                                value={usageFee}
                                                onChange={(e) => setUsageFee(Number(e.target.value))}
                                                className="input-field"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent p-3 rounded-lg border border-purple-800/30">
                                            <div>
                                                <span className="text-sm font-bold text-purple-400 flex items-center gap-2">
                                                    🔮 Use Focus
                                                </span>
                                                <span className="text-xs text-gray-500">Return materials</span>
                                            </div>
                                            <div
                                                className={`arcane-switch ${useFocus ? 'active' : ''}`}
                                                onClick={() => setUseFocus(!useFocus)}
                                            >
                                                <div className="arcane-switch-thumb" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                    className="input-field"
                                    min="1"
                                />
                            </div>

                            {/* Premium Toggle - Shadow Royal */}
                            <div className="flex items-center  justify-between bg-gradient-to-r from-purple-900/20 to-transparent p-3 rounded-lg border border-purple-800/30">
                                <div>
                                    <span className="text-sm font-bold text-purple-400 flex items-center gap-2">
                                        👑 Premium
                                    </span>
                                    <span className="text-xs text-gray-500">-50% tax</span>
                                </div>
                                <div
                                    className={`arcane-switch ${isPremium ? 'active' : ''}`}
                                    onClick={() => setIsPremium(!isPremium)}
                                >
                                    <div className="arcane-switch-thumb" />
                                </div>
                            </div>

                            {/* Transport Settings (if not Caerleon and Flipping) */}
                            {mode === 'flipping' && buyCity !== City.CAERLEON && (
                                <div className="pt-4 border-t border-gray-700 space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-300">Transport Settings</h3>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Mount</label>
                                        <select
                                            value={mountType}
                                            onChange={(e) => setMountType(e.target.value as MountType)}
                                            className="select-field text-sm"
                                        >
                                            {Object.entries(MOUNT_DATA).map(([key, stats]) => (
                                                <option key={key} value={key}>
                                                    {stats.name} - {stats.speed}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Risk Level</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(RISK_PROFILES).map(([key, profile]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setRiskProfile(key as RiskProfile)}
                                                    className={`p-2 rounded text-xs border ${riskProfile === key
                                                        ? 'bg-red-900/40 border-red-500 text-red-200'
                                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className="font-bold">{profile.name}</div>
                                                    <div className="text-[10px] opacity-70">
                                                        {(profile.survivalRate * 100).toFixed(0)}% Survival
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <button
                                onClick={handleFetchPrices}
                                disabled={loading || !selectedItem}
                                className="btn-secondary w-full"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="loading-spinner mr-2"></span>
                                        Fetching Prices...
                                    </span>
                                ) : (
                                    'Fetch Market Prices'
                                )}
                            </button>

                            <button
                                onClick={handleCalculate}
                                disabled={buyPrice === 0 || bmBuyOrder === 0}
                                className="btn-primary w-full"
                            >
                                Calculate Profit
                            </button>
                        </div>
                    </Card>

                    {/* Results Panel */}
                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-gray-100">Profit Analysis</h2>

                        {result ? (
                            <div className="space-y-4">
                                {/* Quick Summary */}
                                <div className={`p-4 rounded-lg border-2 ${result.totalProfit > 0
                                    ? 'bg-green-900/20 border-green-600'
                                    : 'bg-red-900/20 border-red-600'
                                    }`}>
                                    <div className="text-sm text-gray-400 mb-1">Total Profit</div>
                                    <div className={`text-3xl font-bold ${result.totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.totalProfit > 0 ? '+' : ''}{result.totalProfit.toLocaleString()} 🪙
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        {result.profitPerItem.toLocaleString()} 🪙 per item • {result.profitMargin.toFixed(1)}% margin
                                    </div>
                                </div>

                                {/* Revenue Breakdown */}
                                <div className="glass-card p-4 bg-gray-800/30">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Revenue Breakdown</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">BM Buy Order</span>
                                            <span className="text-gray-100 font-medium">{result.grossRevenue.toLocaleString()} 🪙</span>
                                        </div>
                                        <div className="flex justify-between text-red-400">
                                            <span>- Sales Tax ({(result.taxBreakdown.salesTaxRate * 100).toFixed(1)}%)</span>
                                            <span>-{result.salesTax.toLocaleString()} 🪙</span>
                                        </div>
                                        <div className="flex justify-between text-red-400">
                                            <span>- Setup Fee (2.5%)</span>
                                            <span>-{result.setupFee.toLocaleString()} 🪙</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-700 font-medium">
                                            <span className="text-gray-300">Net Revenue</span>
                                            <span className="text-green-400">{result.netRevenue.toLocaleString()} 🪙</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Breakdown */}
                                <div className="glass-card p-4 bg-gray-800/30">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Cost Breakdown</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">
                                                {mode === 'crafting' ? `Crafting Cost (${craftCity})` : `Buy Cost (${buyCity})`}
                                            </span>
                                            <span className="text-gray-100">{result.baseCost.toLocaleString()} 🪙</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-700 font-medium">
                                            <span className="text-gray-300">Total Cost</span>
                                            <span className="text-red-400">{result.totalCost.toLocaleString()} 🪙</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Volume Analysis */}
                                {volumeData && (
                                    <div className="glass-card p-4 bg-gray-800/30">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-3">📊 Market Volume (24h)</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div>
                                                <span className="text-gray-500 block text-xs">Daily Volume</span>
                                                <span className="text-gray-200">{volumeData.dailyVolume.toLocaleString()} units</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs">Market Depth</span>
                                                <span className={`font-medium ${volumeData.marketDepth === 'High' ? 'text-green-400' :
                                                    volumeData.marketDepth === 'Medium' ? 'text-yellow-400' :
                                                        'text-red-400'
                                                    }`}>{volumeData.marketDepth}</span>
                                            </div>
                                        </div>

                                        {/* Chart */}
                                        {volumeData.history && volumeData.history.length > 0 && (
                                            <div className="mb-3 border-t border-gray-700 pt-3">
                                                <div className="text-xs text-gray-400 mb-2">Price & Volume History (7 Days)</div>
                                                <VolumeChart data={volumeData.history} height={150} />
                                            </div>
                                        )}

                                        {volumeData.warning && (
                                            <div className="mt-3 text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-800/50">
                                                ⚠️ {volumeData.warning}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Risk Analysis */}
                                {result.expectedValue !== undefined && (
                                    <div className="glass-card p-4 bg-gray-800/30">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex justify-between">
                                            <span>☠️ Transport Risk</span>
                                            <span className={result.isRecommended ? 'text-green-400' : 'text-red-400'}>
                                                {result.isRecommended ? 'Worth it' : 'Too risky'}
                                            </span>
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Expected Value</span>
                                                <span className={`font-bold ${result.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {result.expectedValue > 0 ? '+' : ''}{result.expectedValue.toLocaleString()} 🪙
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Break-even Survival</span>
                                                <span className="text-gray-300">{(result.breakEvenSurvivalRate! * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Market Comparison */}
                                {result.regularMarketPrice && result.regularMarketProfit !== undefined && (
                                    <div className="glass-card p-4 bg-gray-800/30">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Market Comparison</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Regular Market Profit</span>
                                                <span className="text-gray-300">{result.regularMarketProfit.toLocaleString()} 🪙</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Black Market Profit</span>
                                                <span className="text-gray-300">{result.totalProfit.toLocaleString()} 🪙</span>
                                            </div>
                                            <div className={`flex justify-between pt-2 border-t border-gray-700 font-medium ${result.profitDifference! > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                <span>Difference</span>
                                                <span>{result.profitDifference! > 0 ? '+' : ''}{result.profitDifference!.toLocaleString()} 🪙</span>
                                            </div>
                                        </div>
                                        <div className={`mt-3 p-2 rounded text-sm font-medium ${result.recommendSellTo === 'Black Market'
                                            ? 'bg-green-900/30 text-green-300'
                                            : 'bg-blue-900/30 text-blue-300'
                                            }`}>
                                            💡 Recommendation: Sell to {result.recommendSellTo}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-4">🏴‍☠️</div>
                                <p>Select an item and fetch prices to see profit analysis</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
