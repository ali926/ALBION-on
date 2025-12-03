"use client";
import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Tooltip from '../../components/Tooltip';
import { calculateRefiningOutput } from '../../lib/calculators';
import { fetchItemPrices, clearPriceCache, fetchMarketVolume, calculateMarketDepth, calculatePriceTrend } from '../../lib/market';
import { City } from '../../lib/types';
import { getOptimalRefiningCity, getCityBonus, hasCityBonus } from '../../lib/data/city-bonuses';
import DestinyBoardInput from '../../components/DestinyBoardInput';
import { SpecializationLevels, calculateFocusEfficiency } from '../../lib/specialization';

const RESOURCE_TYPES = [
    { name: 'Ore', raw: 'ORE', refined: 'METALBAR', icon: '⛏️' },
    { name: 'Fiber', raw: 'FIBER', refined: 'CLOTH', icon: '🌿' },
    { name: 'Hide', raw: 'HIDE', refined: 'LEATHER', icon: '🛡️' },
    { name: 'Wood', raw: 'WOOD', refined: 'PLANKS', icon: '🪓' },
    { name: 'Rock', raw: 'ROCK', refined: 'STONEBLOCK', icon: '🧱' },
];

const CITIES = Object.values(City).filter(c => c !== City.BLACK_MARKET && c !== City.CAERLEON);

export default function RefiningPage() {
    // Global Settings
    const [usePremium, setUsePremium] = useState(true);

    // Recipe Settings
    const [resourceType, setResourceType] = useState(RESOURCE_TYPES[2]); // Default to Hide
    const [tier, setTier] = useState<number>(6);
    const [enchantment, setEnchantment] = useState<number>(0);
    const [amount, setAmount] = useState<number>(100);
    const [usageFee, setUsageFee] = useState<number>(1000);
    const [useFocus, setUseFocus] = useState<boolean>(false);
    const [specialization, setSpecialization] = useState<SpecializationLevels>({
        mastery: 0,
        specialization: 0,
        otherSpecsAverage: 0,
        numberOfOtherItems: 0
    });
    const [refineCity, setRefineCity] = useState<string>(City.MARTLOCK); // City for refining
    const [sellCity, setSellCity] = useState<string>(City.MARTLOCK); // City for selling output

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [marketData, setMarketData] = useState<{
        rawPrices: any[],
        refinedPrices: any[],
        lowerRefinedPrices: any[],
        volumeData?: { dailyVolume: number; averagePrice: number; history: any[] }
    } | null>(null);

    // Construct Item IDs
    const rawItemId = `T${tier}_${resourceType.raw}${enchantment > 0 ? `_LEVEL${enchantment}@${enchantment}` : ''}`;
    const refinedItemId = `T${tier}_${resourceType.refined}${enchantment > 0 ? `@${enchantment}` : ''}`;
    const lowerRefinedItemId = tier === 4
        ? `T3_${resourceType.refined}`
        : (tier > 4 ? `T${tier - 1}_${resourceType.refined}${enchantment > 0 ? `_LEVEL${enchantment}@${enchantment}` : ''}` : null);

    // Fetch prices when dependencies change
    useEffect(() => {
        const fetchData = async () => {
            setIsAnalyzing(true);
            try {
                // Generate IDs for all 5 enchantments to allow comparison
                const enchantments = [0, 1, 2, 3, 4];

                // 1. Raw Materials (all enchants)
                const rawIds = enchantments.map(e =>
                    `T${tier}_${resourceType.raw}${e > 0 ? `_LEVEL${e}@${e}` : ''}`
                ).join(',');

                // 2. Refined Items (all enchants - for output)
                const refinedIds = enchantments.map(e =>
                    `T${tier}_${resourceType.refined}${e > 0 ? `_LEVEL${e}@${e}` : ''}`
                ).join(',');

                // 3. Lower Tier Refined (for input)
                // If T4, only T3 flat. If T5+, need matching enchants.
                let lowerRefinedIds = '';
                if (tier === 4) {
                    lowerRefinedIds = `T3_${resourceType.refined}`;
                } else if (tier > 4) {
                    lowerRefinedIds = enchantments.map(e =>
                        `T${tier - 1}_${resourceType.refined}${e > 0 ? `_LEVEL${e}@${e}` : ''}`
                    ).join(',');
                }

                // Fetch for ALL cities to allow comparison
                const [rawPrices, refinedPrices, lowerRefinedPrices] = await Promise.all([
                    fetchItemPrices(rawIds, CITIES),
                    fetchItemPrices(refinedIds, CITIES),
                    lowerRefinedIds ? fetchItemPrices(lowerRefinedIds, CITIES) : Promise.resolve([])
                ]);

                setMarketData({
                    rawPrices,
                    refinedPrices,
                    lowerRefinedPrices
                });

                // Fetch volume data for the refined item in sell city
                const volumeData = await fetchMarketVolume(refinedItemId, sellCity);
                setMarketData(prev => prev ? { ...prev, volumeData } : null);
            } catch (error) {
                console.error("Failed to fetch prices", error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        const timeoutId = setTimeout(fetchData, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [tier, resourceType, enchantment, refineCity, sellCity, refreshTrigger]);

    // Handle manual refresh
    const handleRefresh = () => {
        clearPriceCache();
        setRefreshTrigger(prev => prev + 1);
    };

    // Get specific prices for selected cities
    // Materials are bought in refine city, output is sold in sell city
    const apiRawPrice = marketData?.rawPrices.find(p => p.itemId === rawItemId && p.city === refineCity)?.bestPrice || 0;
    const apiRefinedPrice = marketData?.refinedPrices.find(p => p.itemId === refinedItemId && p.city === sellCity)?.bestPrice || 0;
    const apiLowerRefinedPrice = marketData?.lowerRefinedPrices.find(p => p.itemId === lowerRefinedItemId && p.city === refineCity)?.bestPrice || 0;

    // Calculate Focus Efficiency
    const focusEfficiency = calculateFocusEfficiency(specialization, 'refining');

    // Calculate Output with city bonus
    const calculation = calculateRefiningOutput({
        resourceItemId: rawItemId,
        tier,
        enchantment,
        amount,
        city: sellCity, // Sell in sell city
        usageFee,
        returnRate: 0, // Not used, calculated from production bonus
        isPremium: usePremium,
        useFocus,
        focusEfficiency,
        buyCity: refineCity, // Buy in same city
        refineCity,
        marketPrices: marketData ? {
            rawItem: apiRawPrice,
            refinedItem: apiLowerRefinedPrice,
            outputItem: apiRefinedPrice
        } : undefined
    });

    // City Optimizer: find optimal refining city (city with bonus for this resource)
    const optimizeCities = () => {
        const optimalRefineCity = getOptimalRefiningCity(resourceType.raw);
        if (optimalRefineCity) {
            setRefineCity(optimalRefineCity);
        }
    };

    // Get city bonus info
    const cityBonusPercentage = getCityBonus(resourceType.raw, refineCity);
    const hasBonusCity = cityBonusPercentage > 0;
    const optimalCity = getOptimalRefiningCity(resourceType.raw);


    // Volume analysis
    const volumeAnalysis = marketData?.volumeData ? calculateMarketDepth(
        marketData.volumeData.dailyVolume,
        amount
    ) : null;

    // Price trend analysis
    const trendAnalysis = marketData?.volumeData?.history ? calculatePriceTrend(marketData.volumeData.history) : null;


    return (
        <div className="max-w-7xl mx-auto slide-in pb-12">

            <div className="bg-gray-900/80 backdrop-blur rounded-xl p-6 mb-8 border border-gray-800">
                <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                    <h2 className="text-2xl font-bold text-white">Refining Calculator</h2>
                    <button
                        onClick={handleRefresh}
                        disabled={isAnalyzing}
                        className={`text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className={isAnalyzing ? 'animate-spin' : ''}>🔄</span>
                        <span>{isAnalyzing ? 'Updating Prices...' : 'Refresh All Prices'}</span>
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                            <label className="block text-sm font-bold text-gray-300">Refining City</label>
                            {hasBonusCity && (
                                <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-700 flex items-center space-x-1">
                                    <span>⭐</span>
                                    <span>+{cityBonusPercentage.toFixed(1)}% Bonus</span>
                                </span>
                            )}
                        </div>
                        <button
                            onClick={optimizeCities}
                            disabled={!marketData}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded flex items-center space-x-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>🎯</span>
                            <span>Auto-Optimize</span>
                        </button>
                    </div>
                    <select
                        value={refineCity}
                        onChange={(e) => setRefineCity(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {CITIES.map(c => {
                            const hasBonus = getCityBonus(resourceType.raw, c) > 0;
                            return (
                                <option key={c} value={c}>
                                    {c} {hasBonus ? '⭐' : ''}
                                </option>
                            );
                        })}
                    </select>
                    {optimalCity && refineCity !== optimalCity && (
                        <p className="text-xs text-yellow-500 mt-1">
                            💡 Tip: {optimalCity} has a +{getCityBonus(resourceType.raw, optimalCity).toFixed(1)}% bonus for {resourceType.name}
                        </p>
                    )}
                </div>

                {/* Sell City Selector */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-300">Sell City</label>
                    </div>
                    <select
                        value={sellCity}
                        onChange={(e) => setSellCity(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {CITIES.map(c => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        City where you'll sell the refined items
                    </p>
                </div>

                {/* City Bonus Comparison */}
                {hasBonusCity && calculation.cityBonus && calculation.profitWithoutBonus !== undefined && (
                    <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center">
                            <span className="mr-2">⭐</span>
                            City Bonus Impact
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 text-xs">Without Bonus</div>
                                <div className="text-gray-300 font-mono">{calculation.profitWithoutBonus.toLocaleString()} 🪙</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">With Bonus (+{cityBonusPercentage.toFixed(1)}%)</div>
                                <div className="text-green-400 font-mono font-bold">{calculation.netProfit?.toLocaleString()} 🪙</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Bonus Value</div>
                                <div className="text-green-400 font-mono">+{calculation.cityBonus.bonusSilver?.toLocaleString()} 🪙</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Production Bonus Breakdown */}
                {calculation.cityBonus?.productionBonus !== undefined && (
                    <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center">
                            <span className="mr-2">📊</span>
                            Production Bonus Breakdown
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                                <div className="text-gray-500 text-xs">Base (City)</div>
                                <div className="text-gray-300 font-mono">+18%</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Specialization</div>
                                <div className={`font-mono ${calculation.cityBonus.bonusPercentage > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                    +{calculation.cityBonus.bonusPercentage}%
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Focus Bonus</div>
                                <div className={`font-mono ${useFocus ? 'text-purple-400' : 'text-gray-500'}`}>
                                    +{useFocus ? '59' : '0'}%
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Total Production</div>
                                <div className="text-blue-400 font-mono font-bold">
                                    +{calculation.cityBonus.productionBonus}%
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-blue-800 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Effective Resource Return Rate:</span>
                                <span className="text-blue-300 font-mono font-bold text-lg">
                                    {calculation.cityBonus.effectiveReturnRate?.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Formula: RRR = 1 - (100 / (100 + {calculation.cityBonus.productionBonus}%)) = {calculation.cityBonus.effectiveReturnRate?.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-gray-700">
                    {/* Premium Toggle - Royal Status */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-yellow-900/20 to-transparent p-3 rounded-lg border border-yellow-800/30">
                        <div>
                            <span className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                                👑 Premium
                            </span>
                            <span className="text-xs text-gray-500">Tax -50%</span>
                        </div>
                        <div
                            className={`arcane-switch ${usePremium ? 'active' : ''}`}
                            onClick={() => setUsePremium(!usePremium)}
                        >
                            <div className="arcane-switch-thumb" />
                        </div>
                    </div>

                    {/* Focus Toggle - Arcane Switch */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent p-3 rounded-lg border border-purple-800/30">
                        <div>
                            <span className="text-sm font-bold text-purple-400 flex items-center gap-2">
                                🔮 Use Focus
                            </span>
                            <span className="text-xs text-gray-500">+59% return</span>
                        </div>
                        <div
                            className={`arcane-switch ${useFocus ? 'active' : ''}`}
                            onClick={() => setUseFocus(!useFocus)}
                        >
                            <div className="arcane-switch-thumb" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Effective Return Rate</label>
                        <div className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                            <span className="text-blue-400 font-mono font-bold">
                                {calculation.cityBonus?.effectiveReturnRate?.toFixed(1) || '0.0'}%
                            </span>
                            <span className="text-gray-500 text-xs ml-2">
                                (Auto-calculated)
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Based on production bonus: {calculation.cityBonus?.productionBonus || 0}%
                        </p>
                    </div>
                    {useFocus && (
                        <div className="md:col-span-4 bg-gray-800/30 p-4 rounded-lg border border-purple-500/30">
                            <DestinyBoardInput
                                type="refining"
                                values={specialization}
                                onChange={setSpecialization}
                                label="Refining Spec"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <div className="flex-grow">
                        <label className="text-xs text-gray-500 block mb-1 text-center">Quantity</label>
                        <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700">
                            <button onClick={() => setAmount(Math.max(1, amount - 1))} className="px-3 py-1 text-gray-400 hover:text-white">-</button>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-16 bg-transparent text-center text-white outline-none"
                            />
                            <button onClick={() => setAmount(amount + 1)} className="px-3 py-1 text-gray-400 hover:text-white">+</button>
                        </div>
                    </div>

                </div>

                <div>
                    <Tooltip content="The fee charged by the refining station per 100 nutrition used. Check the station sign in-game.">
                        <label className="text-xs text-gray-500 block mb-1 text-center cursor-help underline decoration-dotted">Usage Fee</label>
                    </Tooltip>
                    <input
                        type="number"
                        value={usageFee}
                        onChange={(e) => setUsageFee(Number(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-center text-sm focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Material Requirements */}
            <div className="mt-6 pt-6 border-t border-gray-800">
                <h5 className="text-sm font-bold text-gray-400 mb-3">Required Materials</h5>
                <div className="space-y-3">
                    {/* Raw Material */}
                    <div className="flex items-center justify-between bg-gray-800/30 p-2 rounded">
                        <div className="flex items-center space-x-3">
                            <span className="text-xl">{resourceType.icon}</span>
                            <div>
                                <div className="text-sm font-medium text-gray-300">T{tier} {resourceType.raw}</div>
                                <div className="text-xs text-gray-500">Market Price</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-300">{calculation.rawMaterialsNeeded} units</div>
                            <div className="text-xs text-gray-400">{apiRawPrice.toLocaleString()} 🪙</div>
                        </div>
                    </div>

                    {/* Refined Material */}
                    {calculation.refinedMaterialNeeded > 0 && (
                        <div className="flex items-center justify-between bg-gray-800/30 p-2 rounded">
                            <div className="flex items-center space-x-3">
                                <span className="text-xl opacity-70">{resourceType.icon}</span>
                                <div>
                                    <div className="text-sm font-medium text-gray-300">
                                        {tier === 4 ? `T3 ${resourceType.refined}` : `T${tier - 1}${enchantment > 0 ? `.${enchantment}` : ''} ${resourceType.refined}`}
                                    </div>
                                    <div className="text-xs text-gray-500">Market Price</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-gray-300">{calculation.refinedMaterialNeeded} units</div>
                                <div className="text-xs text-gray-400">{apiLowerRefinedPrice.toLocaleString()} 🪙</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Summary */}
            <div className="space-y-6">
                {/* Cost Breakdown Card */}
                <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-6">
                    <h3 className="font-bold text-white mb-4">Cost Breakdown</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Raw Materials</span>
                            <span className="text-gray-200">{(calculation.rawMaterialsNeeded * apiRawPrice).toLocaleString()} 🪙</span>
                        </div>
                        {calculation.refinedMaterialNeeded > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Refined Materials</span>
                                <span className="text-gray-200">{(calculation.refinedMaterialNeeded * apiLowerRefinedPrice).toLocaleString()} 🪙</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Usage Fee</span>
                            <span className="text-gray-200">{calculation.tax.toLocaleString()} 🪙</span>
                        </div>

                        {useFocus && calculation.focusCost && calculation.focusCost > 0 && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-purple-400">Focus Cost</span>
                                    <span className="text-purple-300">{calculation.focusCost.toLocaleString()} ⚡</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-400">Profit per Focus</span>
                                    <span className="text-green-300">{calculation.profitPerFocus?.toFixed(1)} 🪙/⚡</span>
                                </div>
                            </>
                        )}

                        <div className="border-t border-gray-700 my-2 pt-2">
                            <div className="flex justify-between font-bold">
                                <span className="text-gray-300">Total Investment</span>
                                <span className="text-white">{calculation.totalCost?.toLocaleString()} 🪙</span>
                            </div>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Expected Revenue</span>
                            <span className="text-gray-200">{(calculation.estimatedOutput * apiRefinedPrice).toLocaleString()} 🪙</span>
                        </div>

                        <div className="flex justify-between font-bold pt-2 border-t border-gray-700">
                            <span className="text-gray-300">ROI</span>
                            <span className={`${(calculation.profitMargin || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(calculation.profitMargin || 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Market Analysis Card */}
                {marketData?.volumeData && (
                    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-6">
                        <h3 className="font-bold text-white mb-4">Market Analysis</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Daily Volume</span>
                                <span className="text-gray-200">{marketData.volumeData.dailyVolume.toLocaleString()} units</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Est. Sell Time</span>
                                <span className="text-gray-200">
                                    {volumeAnalysis ? volumeAnalysis.sellTimeHours.toFixed(1) : '0'} hours
                                </span>
                            </div>

                            {/* Price Trend */}
                            {trendAnalysis && (
                                <>
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                                        <span className="text-gray-400">Price Trend</span>
                                        <span className={`font-bold ${trendAnalysis.trend === 'Up' ? 'text-green-400' :
                                            trendAnalysis.trend === 'Down' ? 'text-red-400' :
                                                'text-gray-400'
                                            }`}>
                                            {trendAnalysis.trend === 'Up' && '📈 Uptrend'}
                                            {trendAnalysis.trend === 'Down' && '📉 Downtrend'}
                                            {trendAnalysis.trend === 'Stable' && '➡️ Stable'}
                                            <span className="text-xs ml-1">
                                                ({trendAnalysis.changePercentage > 0 ? '+' : ''}{trendAnalysis.changePercentage.toFixed(1)}%)
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Volatility</span>
                                        <span className={`font-bold ${trendAnalysis.volatility === 'High' ? 'text-red-400' :
                                            trendAnalysis.volatility === 'Medium' ? 'text-yellow-400' :
                                                'text-green-400'
                                            }`}>
                                            {trendAnalysis.volatility === 'High' && '⚠️ High Risk'}
                                            {trendAnalysis.volatility === 'Medium' && '⚡ Moderate'}
                                            {trendAnalysis.volatility === 'Low' && '🛡️ Stable'}
                                        </span>
                                    </div>
                                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mt-2">
                                        <div className="text-xs text-blue-400 font-bold mb-1">💡 Recommendation</div>
                                        <div className="text-sm text-blue-300">{trendAnalysis.recommendation}</div>
                                    </div>
                                </>
                            )}

                            <div className="pt-2 border-t border-gray-700">
                                <Tooltip content="Ratio of your sell amount to the daily volume. High saturation means slower sales.">
                                    <div className="text-xs text-gray-500 mb-1 cursor-help underline decoration-dotted">Market Saturation</div>
                                </Tooltip>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${(volumeAnalysis?.saturationRatio || 0) > 0.1 ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(100, (volumeAnalysis?.saturationRatio || 0) * 1000)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {(volumeAnalysis?.saturationRatio || 0) > 0.1
                                        ? 'High saturation, might sell slowly'
                                        : 'Low saturation, should sell quickly'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Resource Selector (Bottom) */}
            <div className="mt-8 bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Configuration</h3>

                <div className="space-y-6">
                    {/* Resource Type */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Resource Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {RESOURCE_TYPES.map(type => (
                                <button
                                    key={type.name}
                                    onClick={() => setResourceType(type)}
                                    className={`p-3 rounded-lg border flex flex-col items-center space-y-2 transition-all ${resourceType.name === type.name
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                        }`}
                                >
                                    <span className="text-2xl">{type.icon}</span>
                                    <span className="font-medium">{type.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Tier Selector */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tier</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[4, 5, 6, 7, 8].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTier(t)}
                                        className={`py-2 rounded-lg border text-sm font-bold transition-all ${tier === t
                                            ? 'bg-blue-600 text-white border-blue-500'
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        T{t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Enchantment Selector */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Enchantment</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[0, 1, 2, 3, 4].map(e => (
                                    <button
                                        key={e}
                                        onClick={() => setEnchantment(e)}
                                        className={`py-2 rounded-lg border text-sm font-bold transition-all ${enchantment === e
                                            ? 'bg-purple-600 text-white border-purple-500'
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        .{e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500 pb-8">
                <p>
                    Data provided by the <a href="https://www.albion-online-data.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Albion Online Data Project</a>.
                </p>
                <p className="mt-1">
                    To update prices, run the <a href="https://www.albion-online-data.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Albion Data Client</a> while you play.
                </p>
            </div>
        </div>
    );
}
